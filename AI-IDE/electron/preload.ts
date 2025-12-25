import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // File System API
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  saveFile: (path: string, content: string) => ipcRenderer.invoke('save-file', path, content)
})

contextBridge.exposeInMainWorld('fileSystem', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  saveFile: (path: string, content: string) => ipcRenderer.invoke('save-file', path, content)
})

contextBridge.exposeInMainWorld('terminal', {
  init: () => ipcRenderer.send('terminal-init'),
  send: (data: string) => ipcRenderer.send('terminal-input', data),
  onData: (callback: (data: string) => void) => {
    const subscription = (_event: any, data: string) => callback(data)
    ipcRenderer.on('terminal-incoming', subscription)
    return () => ipcRenderer.off('terminal-incoming', subscription)
  }
})

contextBridge.exposeInMainWorld('appControl', {
  setMode: (mode: string) => ipcRenderer.send('set-mode', mode)
})

contextBridge.exposeInMainWorld('kaggle', {
  search: (query: string) => ipcRenderer.invoke('kaggle-action', 'search', query),
  download: (id: string, path: string) => ipcRenderer.invoke('kaggle-action', 'download', id, path)
})

contextBridge.exposeInMainWorld('analysis', {
  recommend: (path: string) => ipcRenderer.invoke('analyze-dataset', path),
  checkDeps: (path: string) => ipcRenderer.invoke('check-deps', path)
})
