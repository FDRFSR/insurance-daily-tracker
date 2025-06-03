const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 🔧 LOGGING POTENZIATO per debug crash
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Su Windows, scrivi anche in un file log per debug
  if (process.platform === 'win32') {
    try {
      const logPath = path.join(process.cwd(), 'insuratask-debug.log');
      fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
      // Ignora errori di scrittura log
    }
  }
};

// Configurazione app
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_PORT = 5000;

// Variabili globali
let mainWindow = null;
let localServer = null;

log(`[Electron] Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
log(`[Electron] isPackaged: ${app.isPackaged}`);
log(`[Electron] Platform: ${process.platform}`);
log(`[Electron] __dirname: ${__dirname}`);
log(`[Electron] process.resourcesPath: ${process.resourcesPath}`);
log(`[Electron] app.getAppPath(): ${app.getAppPath()}`);

// 🎯 PERCORSI WINDOWS CORRETTI
function findStaticFiles() {
  const possiblePaths = [
    // Development
    path.join(__dirname, '..', 'dist', 'public'),
    
    // Production - extraResources
    path.join(process.resourcesPath, 'static'),
    
    // Production - standard paths
    path.join(process.resourcesPath, 'app', 'dist', 'public'),
    path.join(app.getAppPath(), 'dist', 'public'),
    path.join(__dirname, '..', 'dist', 'public'),
    path.join(__dirname, 'dist', 'public'),
    
    // Electron Builder alternative
    path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'public'),
  ];

  log('[Electron] Searching for static files...');
  
  for (const testPath of possiblePaths) {
    log(`[Electron] Testing: ${testPath}`);
    if (fs.existsSync(testPath)) {
      const indexPath = path.join(testPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        log(`[Electron] ✅ Found static files at: ${testPath}`);
        return testPath;
      } else {
        log(`[Electron] ⚠️ Directory exists but no index.html: ${testPath}`);
      }
    } else {
      log(`[Electron] ❌ Path not found: ${testPath}`);
    }
  }
  
  log('[Electron] 🔍 Listing available directories...');
  try {
    if (fs.existsSync(process.resourcesPath)) {
      const resourceFiles = fs.readdirSync(process.resourcesPath);
      log(`[Electron] Resources directory contents: ${resourceFiles.join(', ')}`);
    }
    
    const appFiles = fs.readdirSync(app.getAppPath());
    log(`[Electron] App directory contents: ${appFiles.join(', ')}`);
  } catch (e) {
    log(`[Electron] Error listing directories: ${e.message}`);
  }
  
  return null;
}

// 🚀 Server locale semplificato
function createLocalServer() {
  return new Promise((resolve, reject) => {
    log('[Electron] Creating local server...');
    
    let staticPath;
    
    if (isDevelopment) {
      staticPath = path.join(__dirname, '..', 'dist', 'public');
    } else {
      staticPath = findStaticFiles();
    }
    
    if (!staticPath || !fs.existsSync(staticPath)) {
      const error = `Static files not found. Searched multiple locations but no valid path found.`;
      log(`[Electron] ❌ ${error}`);
      return reject(new Error(error));
    }
    
    log(`[Electron] Using static path: ${staticPath}`);
    
    try {
      // Importa express solo quando necessario
      const express = require('express');
      const app = express();
      
      log('[Electron] Express loaded successfully');
      
      // Serve file statici
      app.use(express.static(staticPath));
      log('[Electron] Static middleware configured');
      
      // API mock essenziali
      app.get('/api/tasks/stats', (req, res) => {
        log('[Electron] API call: /api/tasks/stats');
        res.json({
          total: 0,
          pending: 0, 
          completed: 0,
          overdue: 0,
          dueToday: 0
        });
      });
      
      app.get('/api/tasks', (req, res) => {
        log('[Electron] API call: /api/tasks');
        res.json([]);
      });
      
      // Fallback per SPA
      app.get('*', (req, res) => {
        const indexPath = path.join(staticPath, 'index.html');
        log(`[Electron] Serving index.html for: ${req.path}`);
        res.sendFile(indexPath);
      });
      
      // Avvia server su porta casuale
      const server = app.listen(0, 'localhost', () => {
        const port = server.address().port;
        log(`[Electron] ✅ Local server started on port ${port}`);
        resolve(port);
      });
      
      server.on('error', (err) => {
        log(`[Electron] Server error: ${err.message}`);
        reject(err);
      });
      
      localServer = server;
      
    } catch (error) {
      log(`[Electron] Error creating server: ${error.message}`);
      reject(error);
    }
  });
}

// Controlla development server
function checkDevelopmentServer() {
  if (!isDevelopment) return Promise.resolve(false);
  
  return new Promise((resolve) => {
    const http = require('http');
    
    const req = http.get(`http://localhost:${DEV_PORT}/api/tasks/stats`, (res) => {
      log(`[Electron] ✅ Development server found on port ${DEV_PORT}`);
      resolve(true);
    });
    
    req.on('error', () => {
      log(`[Electron] No development server on port ${DEV_PORT}`);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Crea finestra principale
async function createWindow() {
  log('[Electron] Creating main window...');
  
  let serverPort;
  
  try {
    if (isDevelopment) {
      const devServerRunning = await checkDevelopmentServer();
      
      if (devServerRunning) {
        serverPort = DEV_PORT;
        log('[Electron] Using external development server');
      } else {
        log('[Electron] Starting local server for development');
        serverPort = await createLocalServer();
      }
    } else {
      log('[Electron] Starting local server for production');
      serverPort = await createLocalServer();
    }
  } catch (error) {
    log(`[Electron] ❌ Failed to start server: ${error.message}`);
    
    // Mostra dialog di errore user-friendly
    const response = await dialog.showMessageBox(null, {
      type: 'error',
      title: 'Errore Avvio InsuraTask',
      message: 'Impossibile avviare l\'applicazione',
      detail: `${error.message}\n\nIl file di log è stato salvato come insuratask-debug.log`,
      buttons: ['Esci', 'Mostra Log'],
      defaultId: 0
    });
    
    if (response.response === 1) {
      // Mostra log
      const logPath = path.join(process.cwd(), 'insuratask-debug.log');
      shell.openPath(logPath);
    }
    
    app.quit();
    return;
  }

  // Crea finestra
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false,
    backgroundColor: '#fafaf9',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  });

  log('[Electron] Main window created');

  // Setup menu
  setupMenu();

  try {
    const appUrl = `http://localhost:${serverPort}`;
    log(`[Electron] Loading app from: ${appUrl}`);
    
    await mainWindow.loadURL(appUrl);
    
    mainWindow.once('ready-to-show', () => {
      log('[Electron] ✅ Window ready, showing app');
      mainWindow.show();
      
      if (process.platform === 'darwin') {
        app.dock?.show();
      }
      mainWindow.focus();
      
      if (isDevelopment) {
        mainWindow.webContents.openDevTools();
      }
    });
    
  } catch (error) {
    log(`[Electron] ❌ Failed to load app: ${error.message}`);
    showErrorWindow(error);
  }

  // Gestisci link esterni
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Mostra finestra di errore
function showErrorWindow(error) {
  const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>InsuraTask - Errore</title>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: system-ui, sans-serif;
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          margin: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          max-width: 600px;
          text-align: center;
        }
        h1 { color: #ff6b6b; margin-bottom: 20px; }
        .error { 
          background: rgba(0,0,0,0.3);
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-family: monospace;
          text-align: left;
          word-break: break-word;
        }
        button {
          background: #4ecdc4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          margin: 10px;
          font-size: 16px;
        }
        button:hover { background: #45b7b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Errore InsuraTask</h1>
        <p>L'applicazione non è riuscita ad avviarsi.</p>
        <div class="error">${error.message}</div>
        <p><strong>Cosa controllare:</strong></p>
        <ul style="text-align: left;">
          <li>Verifica che il file sia scaricato completamente</li>
          <li>Controlla il file insuratask-debug.log per dettagli</li>
          <li>Prova a riavviare come amministratore</li>
          <li>Disabilita temporaneamente l'antivirus</li>
        </ul>
        <button onclick="location.reload()">🔄 Riprova</button>
      </div>
    </body>
    </html>
  `;
  
  if (mainWindow) {
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    mainWindow.show();
  }
}

// Setup menu
function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Nuova Attività',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                window.dispatchEvent(new CustomEvent('electron-new-task'));
              `);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Esci' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Ricarica' },
        { role: 'toggleDevTools', label: 'DevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Aiuto',
      submenu: [
        {
          label: 'Informazioni',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'InsuraTask',
              message: 'InsuraTask v1.0.8',
              detail: 'Gestione attività per agenti assicurativi\n\nSviluppato da Federico Fusarri'
            });
          }
        },
        {
          label: 'Log Debug',
          click: () => {
            const logPath = path.join(process.cwd(), 'insuratask-debug.log');
            shell.openPath(logPath);
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Event handlers con logging
app.whenReady().then(() => {
  log('[Electron] App ready, creating window');
  createWindow();
});

app.on('window-all-closed', () => {
  log('[Electron] All windows closed');
  
  if (localServer) {
    localServer.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  log('[Electron] App quitting');
  if (localServer) {
    localServer.close();
  }
});

// Gestione errori critici
process.on('uncaughtException', (error) => {
  log(`[Electron] ❌ UNCAUGHT EXCEPTION: ${error.message}`);
  log(`[Electron] Stack: ${error.stack}`);
});

process.on('unhandledRejection', (reason) => {
  log(`[Electron] ❌ UNHANDLED REJECTION: ${reason}`);
});