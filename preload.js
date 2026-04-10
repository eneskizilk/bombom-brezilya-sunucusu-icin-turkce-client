const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getBaseDir: () => ipcRenderer.sendSync('get-base-dir'),
    winMin: () => ipcRenderer.send('win-min'),
    winMax: () => ipcRenderer.send('win-max'),
    winClose: () => ipcRenderer.send('win-close'),
    clearAndQuit: () => ipcRenderer.send('clear-and-quit'),
    
    toggleMute: (isMuted) => ipcRenderer.send('toggle-mute', isMuted),
    setZoom: (scale) => ipcRenderer.send('set-zoom', scale),
    takeScreenshot: () => ipcRenderer.send('take-screenshot'),
    
    onHideSplash: (callback) => ipcRenderer.on('hide-splash', callback)
});