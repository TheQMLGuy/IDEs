import { app, BrowserWindow, ipcMain, dialog, BrowserView } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let colabView: BrowserView | null = null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('read-dir', async (_event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.join(dirPath, e.name)
    }))
  } catch (e) {
    console.error('Failed to read dir', e)
    return []
  }
})

ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    return ''
  }
})

ipcMain.handle('save-file', async (_event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (e) {
    return { error: String(e) }
  }
})

// Colab Integration
function setupColabView() {
  if (colabView) return colabView
  colabView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  colabView.webContents.loadURL('https://colab.research.google.com')
  return colabView
}

ipcMain.on('set-mode', (_e, mode) => {
  if (!win) return
  if (mode === 'colab') {
    const view = setupColabView()
    win.setBrowserView(view)
    const bounds = win.getContentBounds()
    // Header height: 50px, no sidebar now
    view.setBounds({ x: 0, y: 50, width: bounds.width, height: bounds.height - 50 })
    view.setAutoResize({ width: true, height: true })
  } else {
    win.setBrowserView(null)
  }
})

ipcMain.handle('check-deps', async (_event, filePath) => {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [
      path.join(process.env.APP_ROOT, 'py', 'dep_checker.py'),
      filePath
    ]);

    let result = '';
    pythonProcess.stdout.on('data', (d) => result += d.toString());
    pythonProcess.stderr.on('data', (d) => console.error(`DepCheck Error: ${d}`));

    pythonProcess.on('close', (_code) => {
      try { resolve(JSON.parse(result)) }
      catch (e) { resolve({ error: 'Failed to parse dep check output', raw: result }) }
    })
  })
})

// Terminal Logic
let shell: ChildProcessWithoutNullStreams | null = null

function ensureShell() {
  if (shell) return shell

  const shellCmd = process.platform === 'win32' ? 'powershell.exe' : 'bash'
  shell = spawn(shellCmd, [], {
    cwd: process.env.USERPROFILE || process.cwd(),
    env: process.env
  })

  shell.stdout.on('data', (data) => {
    win?.webContents.send('terminal-incoming', data.toString())
  })

  shell.stderr.on('data', (data) => {
    win?.webContents.send('terminal-incoming', data.toString())
  })

  shell.on('exit', () => {
    win?.webContents.send('terminal-incoming', '\r\n[Process terminated]\r\n')
    shell = null
  })

  return shell
}

ipcMain.on('terminal-init', () => {
  ensureShell()
})

ipcMain.on('terminal-input', (_event, data) => {
  const s = ensureShell()
  s.stdin.write(data)
})

// ... (terminal logic)


ipcMain.handle('kaggle-action', async (_event, command, arg1, arg2) => {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [
      path.join(process.env.APP_ROOT, 'py', 'kaggle_ops.py'),
      command,
      arg1 || '',
      arg2 || ''
    ]);

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (_code) => {
      try {
        const json = JSON.parse(result);
        resolve(json);
      } catch (e) {
        resolve({ error: 'Failed to parse python output', raw: result });
      }
    });
  });
});

ipcMain.handle('analyze-dataset', async (_event, filePath) => {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [
      path.join(process.env.APP_ROOT, 'py', 'model_recommender.py'),
      filePath
    ]);

    let result = '';
    pythonProcess.stdout.on('data', (d) => result += d.toString());
    pythonProcess.stderr.on('data', (d) => console.error(`Analysis Error: ${d}`));

    pythonProcess.on('close', (_code) => {
      try { resolve(JSON.parse(result)) }
      catch (e) { resolve({ error: 'Failed to parse analysis output', raw: result }) }
    })
  })
})

// ... (cleanup)
app.on('will-quit', () => {
  if (shell) shell.kill()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
