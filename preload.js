'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  onSerialStatus:  cb => ipcRenderer.on('SERIAL_STATUS',   (_, d) => cb(d)),
  onOrderUpdated:  cb => ipcRenderer.on('ORDER_UPDATED',   (_, d) => cb(d)),
  onConfigLoaded:  cb => ipcRenderer.on('CONFIG_LOADED',   (_, d) => cb(d)),
  resetOrder:      ()      => ipcRenderer.send('RESET_ORDER'),
  addItem:         item    => ipcRenderer.send('MANUAL_ADD_ITEM', item),
  connectToPort:   port    => ipcRenderer.send('CONNECT_TO_PORT', port),
  simulateSerial:  text    => ipcRenderer.send('SIMULATE_SERIAL', text),
  openExternal:    url     => ipcRenderer.send('OPEN_EXTERNAL', url),
  saveConfig:      cfg     => ipcRenderer.send('SAVE_CONFIG', cfg),
  skipSetup:       ()      => ipcRenderer.send('SKIP_SETUP'),
  saveLang:        lang    => ipcRenderer.send('SAVE_LANG', lang),
  onLangChanged:   cb      => ipcRenderer.on('LANG_CHANGED', (_, l) => cb(l)),
  getSerialPorts:  ()      => ipcRenderer.invoke('GET_SERIAL_PORTS'),
  getLocalIp:      ()      => ipcRenderer.invoke('GET_LOCAL_IP'),
  getConfig:       ()      => ipcRenderer.invoke('GET_CONFIG'),
});
