'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const os     = require('os');
const { exec } = require('child_process');
const { SerialPort } = require('serialport');
const WebSocket = require('ws');

// ── Disable GPU to prevent black screen crash ──────────────
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

// ── Constants ──────────────────────────────────────────────
const WS_PORT   = 9600;
const HTTP_PORT = 3000;
const BAUD      = 9600;
const FLUSH_MS  = 80;
const RETRY_MS  = 5000;
const PWA_DIR   = path.join(__dirname, 'pwa');
const CFG_PATH  = path.join(app.getPath('userData'), 'config.json');
const DEFAULT_APP_PORT     = 'COM21';
const DEFAULT_ARONIUM_PORT = 'COM20';

// ── State ──────────────────────────────────────────────────
let mainWin  = null;
let setupWin = null;
let serial   = null;
let wsServer = null;
let httpSrv  = null;
let retryTimer = null;

let order = { items:[], total:null, paid:null, change:null, discount:null, welcome:false, welcomeMessage:'' };
let rawBuf = '';
let flushTimer = null;

// ── Config ─────────────────────────────────────────────────
function loadCfg() {
  try { if (fs.existsSync(CFG_PATH)) return JSON.parse(fs.readFileSync(CFG_PATH,'utf-8')); } catch {}
  return { appPort: null, aroniumPort: null };
}
function saveCfg(c) {
  try { fs.mkdirSync(path.dirname(CFG_PATH),{recursive:true}); fs.writeFileSync(CFG_PATH,JSON.stringify(c,null,2)); } catch {}
}
let cfg = loadCfg();

// ── Helpers ────────────────────────────────────────────────
function getIp() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces) { if (i.family==='IPv4' && !i.internal) return i.address; }
  }
  return '127.0.0.1';
}

function emit() {
  const payload = JSON.stringify({ type:'ORDER_UPDATE', data:order });
  if (wsServer) wsServer.clients.forEach(c => { if(c.readyState===WebSocket.OPEN) c.send(payload); });
  if (mainWin)  mainWin.webContents.send('ORDER_UPDATED', order);
}

function sendStatus(connected, port, msg='') {
  if (mainWin)  mainWin.webContents.send('SERIAL_STATUS', {connected,port,message:msg});
  if (setupWin) setupWin.webContents.send('SERIAL_STATUS', {connected,port,message:msg});
}

function resetOrder() {
  order = { items:[], total:null, paid:null, change:null, discount:null, welcome:false, welcomeMessage:'' };
}

// ── Merge item ─────────────────────────────────────────────
function mergeItem(name, qty, price) {
  const key = name.trim().toLowerCase();
  const ex  = order.items.find(i => {
    const ik = i.name.trim().toLowerCase();
    return ((ik===key)||(ik.endsWith('...')&&key.startsWith(ik.slice(0,-3)))||(key.endsWith('...')&&ik.startsWith(key.slice(0,-3))))
      && Math.abs(i.price-price)<0.001;
  });
  if (ex) {
    if (ex.name.endsWith('...')&&!name.endsWith('...')) ex.name=name;
    ex.quantity = +((ex.quantity+qty).toFixed(4));
    ex.total    = +((ex.quantity*ex.price).toFixed(2));
  } else {
    order.items.push({name:name.trim(), quantity:+qty.toFixed(4), price, total:+(qty*price).toFixed(2), discount:null});
  }
}

function removeItem(name, price) {
  const key=name.trim().toLowerCase();
  order.items = order.items.filter(i=>!(i.name.trim().toLowerCase()===key&&(price==null||Math.abs(i.price-price)<0.001)));
}

// ── Parser ─────────────────────────────────────────────────
const RE_QTY   = /^(\d+(?:[.,]\d+)?)\s*x\s+([\d,]+(?:[.,]\d{1,2})?)\s*$/i;
const RE_TOTAL = /Total\s*[:\s]+([\d,]+(?:[.,]\d{1,2})?)/gi;
const RE_PAID  = /Paid\s*[:\s]+([\d,]+(?:[.,]\d{1,2})?)/gi;
const RE_CHANGE= /Change\s*[:\s]+([\d,]+(?:[.,]\d{1,2})?)/gi;
const RE_VOID  = /^(?:Void|Remove[d]?|Retrait?)\s*:\s*(.+)$/i;
const RE_TIME  = /^\d{1,2}:\d{2}/;

function pf(s) {
  s = s.trim();
  if (s.includes('.')&&s.includes(',')) return parseFloat(s.replace(/,/g,''));
  if (/,\d{1,2}$/.test(s)&&!s.includes('.')) return parseFloat(s.replace(',','.'));
  return parseFloat(s.replace(/,/g,''));
}

function splitFrames(raw) {
  return raw.split('\f').map(f =>
    f.replace(/[\x0B]/g,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n')
     .split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean)
  ).filter(f=>f.length>0);
}

function parseFrame(lines) {
  if (!lines.length) return false;

  // Welcome
  const wi = lines.findIndex(l=>/welcome/i.test(l));
  if (wi!==-1) {
    const msg = lines.find((l,i)=>i!==wi&&!/welcome/i.test(l)) || "Next customer please";
    resetOrder();
    order.welcome=true; order.welcomeMessage=msg;
    return true;
  }

  let changed = order.welcome;
  if (order.welcome) resetOrder();

  let i=0;
  while (i<lines.length) {
    const line=lines[i], next=lines[i+1]||'';
    if (RE_TIME.test(line)) { i++; continue; }

    // Totals
    const allT=[...line.matchAll(RE_TOTAL)];
    const allP=[...line.matchAll(RE_PAID)];
    const allC=[...line.matchAll(RE_CHANGE)];
    RE_TOTAL.lastIndex=RE_PAID.lastIndex=RE_CHANGE.lastIndex=0;
    if (allT.length||allP.length||allC.length) {
      if (allT[0]) order.total  = pf(allT[0][1]);
      if (allP[0]) order.paid   = pf(allP[0][1]);
      if (allC[0]) order.change = pf(allC[0][1]);
      changed=true; i++; continue;
    }

    // Void
    const mv = line.match(RE_VOID);
    if (mv) {
      const mq=next.match(RE_QTY);
      removeItem(mv[1].trim(), mq?pf(mq[2]):null);
      if (mq) i++;
      changed=true; i++; continue;
    }

    // Product
    const mq=next.match(RE_QTY);
    if (mq) {
      mergeItem(line, pf(mq[1]), pf(mq[2]));
      changed=true; i+=2; continue;
    }

    i++;
  }
  return changed;
}

function onSerialData(chunk) {
  rawBuf += chunk.toString();
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    const buf=rawBuf; rawBuf='';
    let changed=false;
    splitFrames(buf).forEach(f => { if(parseFrame(f)) changed=true; });
    if (changed) emit();
  }, FLUSH_MS);
}

// ── Serial port ─────────────────────────────────────────────
function connectSerial(portPath) {
  clearTimeout(retryTimer);
  if (serial) { try { if(serial.isOpen) serial.close(); } catch {} serial=null; }

  try {
    serial = new SerialPort({ path:portPath, baudRate:BAUD, dataBits:8, stopBits:1, parity:'none', autoOpen:false });
    serial.on('data',  d  => onSerialData(d));
    serial.on('open',  () => { console.log('[Serial] Open:',portPath); sendStatus(true,portPath); });
    serial.on('error', e  => { if(!e.message.includes('Access denied')) console.error('[Serial]',e.message); sendStatus(false,null,e.message); scheduleRetry(portPath); });
    serial.on('close', () => { sendStatus(false,null,'Port closed'); scheduleRetry(portPath); });
    serial.open(e => { if(e) { sendStatus(false,null,e.message); scheduleRetry(portPath); } });
  } catch(e) { sendStatus(false,null,e.message); scheduleRetry(portPath); }
}

function scheduleRetry(p) {
  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => connectSerial(p), RETRY_MS);
}

function initSerial() {
  const p = cfg.appPort || DEFAULT_APP_PORT;
  SerialPort.list().then(ports => {
    console.log('[Serial] Ports:', ports.map(p=>p.path).join(', '));
    connectSerial(ports.find(x=>x.path===p) ? p : (ports[0]?.path || p));
  }).catch(() => connectSerial(p));
}

// ── HTTP server (PWA) ──────────────────────────────────────
const MIME = {'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};

function initHttp() {
  httpSrv = http.createServer((req,res) => {
    let p=req.url.split('?')[0]; if(p==='/') p='/index.html';
    const fp=path.join(PWA_DIR,p);
    if (!fp.startsWith(PWA_DIR)) { res.writeHead(403); res.end(); return; }
    fs.readFile(fp,(err,data)=>{
      if (err) { res.writeHead(err.code==='ENOENT'?404:500); res.end(); return; }
      res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'});
      res.end(data);
    });
  });
  httpSrv.listen(HTTP_PORT,'0.0.0.0',()=>{
    const ip=getIp();
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║   AroniumPOS Display Client v1.0.3     ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║  PWA → http://${ip}:${HTTP_PORT}`.padEnd(42)+'║');
    console.log(`║  WS  → ws://${ip}:${WS_PORT}`.padEnd(42)+'║');
    console.log(`╚════════════════════════════════════════╝\n`);
  });
}

// ── WebSocket ──────────────────────────────────────────────
function initWs() {
  wsServer = new WebSocket.Server({ port:WS_PORT });
  wsServer.on('connection',(ws,req)=>{
    console.log('[WS] Client:',req.socket.remoteAddress);
    ws.send(JSON.stringify({type:'ORDER_UPDATE',data:order}));
    ws.on('error',e=>console.error('[WS]',e.message));
  });
}

// ── Windows ────────────────────────────────────────────────
function createSetupWin() {
  setupWin = new BrowserWindow({ width:480, height:560, resizable:false, center:true,
    title:'AroniumPOS Display Client — Setup', backgroundColor:'#07090f', show:false,
    webPreferences:{ preload:path.join(__dirname,'preload.js'), contextIsolation:true, nodeIntegration:false }
  });
  setupWin.setMenuBarVisibility(false);
  setupWin.loadFile('setup.html');
  setupWin.once('ready-to-show', ()=>setupWin.show());
  setupWin.on('closed', ()=>{ setupWin=null; });
}

function createMainWin() {
  mainWin = new BrowserWindow({ width:1280, height:720, minWidth:900, minHeight:500,
    fullscreenable:true, backgroundColor:'#07090f', show:false,
    title:'AroniumPOS Display Client',
    webPreferences:{ preload:path.join(__dirname,'preload.js'), contextIsolation:true, nodeIntegration:false }
  });
  mainWin.setMenuBarVisibility(false);
  mainWin.loadFile('index.html');
  mainWin.once('ready-to-show', ()=>mainWin.show());
  mainWin.on('closed', ()=>{ mainWin=null; });
  mainWin.webContents.on('did-finish-load', ()=>{
    const ip=getIp();
    mainWin.webContents.send('CONFIG_LOADED',{ appPort:cfg.appPort, aroniumPort:cfg.aroniumPort, localIp:`${ip}:${HTTP_PORT}` });
  });
}

// ── IPC ────────────────────────────────────────────────────
ipcMain.handle('GET_SERIAL_PORTS', async()=>(await SerialPort.list()).map(p=>({path:p.path,description:p.description||''})));
ipcMain.handle('GET_LOCAL_IP',     ()=>`${getIp()}:${HTTP_PORT}`);
ipcMain.handle('GET_CONFIG',       ()=>cfg);

ipcMain.on('CONNECT_TO_PORT', (_,p)=>connectSerial(p));
ipcMain.on('RESET_ORDER',     ()=>{ resetOrder(); emit(); });
ipcMain.on('MANUAL_ADD_ITEM', (_,item)=>{ if(order.welcome) resetOrder(); mergeItem(item.name||'Product',parseFloat(item.quantity)||1,parseFloat(item.price)||0); emit(); });
ipcMain.on('SIMULATE_SERIAL', (_,text)=>{ rawBuf+=text; clearTimeout(flushTimer); flushTimer=setTimeout(()=>{ const b=rawBuf;rawBuf=''; let ch=false; splitFrames(b).forEach(f=>{if(parseFrame(f))ch=true;}); if(ch)emit(); },FLUSH_MS); });
ipcMain.on('OPEN_EXTERNAL',   (_,url)=>{ if(url.startsWith('https://')) shell.openExternal(url); });

ipcMain.on('SAVE_CONFIG', (_,newCfg)=>{
  cfg={...cfg,...newCfg};
  saveCfg(cfg);
  if (setupWin) { setupWin.close(); setupWin=null; }
  if (!mainWin) { createMainWin(); }
  else { mainWin.show(); mainWin.webContents.send('CONFIG_LOADED',{appPort:cfg.appPort,aroniumPort:cfg.aroniumPort,localIp:`${getIp()}:${HTTP_PORT}`}); }
  connectSerial(cfg.appPort||DEFAULT_APP_PORT);
});

ipcMain.on('SKIP_SETUP', ()=>{
  if (setupWin) { setupWin.close(); setupWin=null; }
  if (!mainWin) createMainWin();
  else mainWin.show();
  initSerial();
});

ipcMain.on('CREATE_COM_PAIR', (_,{port1,port2})=>{
  // Use extraResources path (works in packaged exe)
  const resDir  = process.resourcesPath || path.join(__dirname,'build');
  const script  = path.join(resDir,'install_com0com.ps1');
  const cmd     = `powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "${script}" -Port1 ${port1} -Port2 ${port2}`;
  exec(cmd,{timeout:120000},(err,stdout,stderr)=>{
    const success = !err || stdout.includes('SUCCESS') || stdout.includes('ready');
    console.log('[COM]',stdout,stderr);
    const win = setupWin||mainWin;
    if (win) win.webContents.send('COM_PAIR_RESULT',{success,error:success?null:(stderr||err?.message||'Failed')});
  });
});

// ── App lifecycle ──────────────────────────────────────────
app.on('ready',()=>{
  initHttp();
  initWs();
  const needsSetup = !cfg.appPort || !cfg.aroniumPort;
  if (needsSetup) { createSetupWin(); }
  else            { createMainWin(); initSerial(); }
});

app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); });
app.on('activate',          ()=>{ if(!mainWin&&!setupWin) { if(!cfg.appPort) createSetupWin(); else createMainWin(); } });
app.on('before-quit',       ()=>{
  if(serial&&serial.isOpen) serial.close();
  if(wsServer) wsServer.close();
  if(httpSrv)  httpSrv.close();
});
