'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  onSerialStatus:  cb => ipcRenderer.on('SERIAL_STATUS',   (_, d) => cb(d)),
  onOrderUpdated:  cb => ipcRenderer.on('ORDER_UPDATED',   (_, d) => cb(d)),
  onConfigLoaded:  cb => ipcRenderer.on('CONFIG_LOADED',   (_, d) => cb(d)),
  onComPairResult: cb => ipcRenderer.on('COM_PAIR_RESULT', (_, d) => cb(d)),
  resetOrder:      ()      => ipcRenderer.send('RESET_ORDER'),
  addItem:         item    => ipcRenderer.send('MANUAL_ADD_ITEM', item),
  connectToPort:   port    => ipcRenderer.send('CONNECT_TO_PORT', port),
  simulateSerial:  text    => ipcRenderer.send('SIMULATE_SERIAL', text),
  openExternal:    url     => ipcRenderer.send('OPEN_EXTERNAL', url),
  saveConfig:      cfg     => ipcRenderer.send('SAVE_CONFIG', cfg),
  skipSetup:       ()      => ipcRenderer.send('SKIP_SETUP'),
  createComPair:   (p1,p2) => ipcRenderer.send('CREATE_COM_PAIR', {port1:p1,port2:p2}),
  getSerialPorts:  ()      => ipcRenderer.invoke('GET_SERIAL_PORTS'),
  getLocalIp:      ()      => ipcRenderer.invoke('GET_LOCAL_IP'),
  getConfig:       ()      => ipcRenderer.invoke('GET_CONFIG'),
});
