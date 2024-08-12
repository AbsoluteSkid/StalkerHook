const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    WriteUserData: (data) => ipcRenderer.invoke('write-userdata', data),
    ReadUserData: () => ipcRenderer.invoke('read-userdata'),
    openMainWindow: () => ipcRenderer.send('open-main-window'),
    openLoginWindow: () => ipcRenderer.send('open-login-window'),
});