const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { createElectronServer } = require('./server.cjs');

// 🔧 LOGGING POTENZIATO
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Log su file per debug Windows
  if (process.platform === 'win32') {
    try {
      const logPath = path.join(process.cwd(), 'insuratask-debug.log');
      fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
      // Ignora errori scrittura log
    }
  }
};

// Configurazione
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_PORT = 5000;

// Variabili globali
let mainWindow = null;
let localServer = null;

log(`[Electron] Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
log(`[Electron] Platform: ${process.platform}`);
log(`[Electron] App path: ${app.getAppPath()}`);
log(`[Electron] Resources path: ${process.resourcesPath}`);

// 🎯 TROVA FILE STATICI con logging migliorato
function findStaticFiles() {
  const possiblePaths = [
    // Development
    path.join(__dirname, '..', 'dist', 'public'),
    
    // Production - extraResources  
    path.join(process.resourcesPath, 'static'),
    
    // Production - standard
    path.join(process.resourcesPath, 'app', 'dist', 'public'),
    path.join(app.getAppPath(), 'dist', 'public'),
    path.join(__dirname, '..', 'dist', 'public'),
    
    // Backup paths
    path.join(__dirname, 'dist', 'public'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'public'),
  ];

  log('[Electron] 🔍 Searching for static files...');
  
  for (const testPath of possiblePaths) {
    log(`[Electron] Testing path: ${testPath}`);
    
    if (fs.existsSync(testPath)) {
      const indexPath = path.join(testPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        // Verifica anche che ci siano file CSS/JS
        const assetsPath = path.join(testPath, 'assets');
        const hasAssets = fs.existsSync(assetsPath);
        
        log(`[Electron] ✅ Found static files at: ${testPath}`);
        log(`[Electron] Has assets directory: ${hasAssets}`);
        
        if (hasAssets) {
          const assetFiles = fs.readdirSync(assetsPath);
          log(`[Electron] Assets files: ${assetFiles.slice(0, 5).join(', ')}${assetFiles.length > 5 ? '...' : ''}`);
        }
        
        return testPath;
      } else {
        log(`[Electron] ⚠️ Directory exists but no index.html: ${testPath}`);
      }
    } else {
      log(`[Electron] ❌ Path not found: ${testPath}`);
    }
  }
  
  // Debug: lista directory disponibili
  log('[Electron] 🔍 Available directories:');
  try {
    if (fs.existsSync(process.resourcesPath)) {
      const resourceFiles = fs.readdirSync(process.resourcesPath);
      log(`[Electron] Resources: ${resourceFiles.join(', ')}`);
    }
    
    const appFiles = fs.readdirSync(app.getAppPath());
    log(`[Electron] App directory: ${appFiles.join(', ')}`);
  } catch (e) {
    log(`[Electron] Error listing directories: ${e.message}`);
  }
  
  return null;
}

// 🚀 CREA SERVER LOCALE con API complete
function createLocalServer() {
  return new Promise((resolve, reject) => {
    log('[Electron] 🚀 Creating local server with full API support...');
    
    let staticPath;
    
    if (isDevelopment) {
      staticPath = path.join(__dirname, '..', 'dist', 'public');
      log(`[Electron] Development static path: ${staticPath}`);
    } else {
      staticPath = findStaticFiles();
    }
    
    if (!staticPath || !fs.existsSync(staticPath)) {
      const error = `❌ Static files not found! Searched multiple locations.
      
Troubleshooting:
1. Verify the build completed successfully
2. Check that dist/public directory contains index.html
3. For Windows: Try running as administrator
4. Check file permissions

Static path attempted: ${staticPath || 'none found'}`;
      
      log(`[Electron] ${error}`);
      return reject(new Error(error));
    }
    
    // Verifica contenuto directory
    try {
      const staticFiles = fs.readdirSync(staticPath);
      log(`[Electron] Static files found: ${staticFiles.join(', ')}`);
      
      const indexPath = path.join(staticPath, 'index.html');
      const indexSize = fs.statSync(indexPath).size;
      log(`[Electron] index.html size: ${indexSize} bytes`);
      
      if (indexSize < 100) {
        log(`[Electron] ⚠️ WARNING: index.html is very small (${indexSize} bytes)`);
      }
    } catch (e) {
      log(`[Electron] Error reading static directory: ${e.message}`);
    }
    
    try {
      // Usa il server completo con tutte le API
      const expressApp = createElectronServer(staticPath, log);
      
      log('[Electron] ✅ Express app created with full API support');
      
      // Avvia server su porta casuale
      const server = expressApp.listen(0, 'localhost', () => {
        const port = server.address().port;
        log(`[Electron] ✅ Local server started on http://localhost:${port}`);
        log(`[Electron] Static files served from: ${staticPath}`);
        resolve(port);
      });
      
      server.on('error', (err) => {
        log(`[Electron] ❌ Server error: ${err.message}`);
        reject(err);
      });
      
      localServer = server;
      
    } catch (error) {
      log(`[Electron] ❌ Error creating server: ${error.message}`);
      log(`[Electron] Stack: ${error.stack}`);
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
      log(`[Electron] ❌ No development server on port ${DEV_PORT}`);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 🖥️ CREA FINESTRA PRINCIPALE
async function createWindow() {
  log('[Electron] 🖥️ Creating main window...');
  
  let serverPort;
  
  try {
    if (isDevelopment) {
      const devServerRunning = await checkDevelopmentServer();
      
      if (devServerRunning) {
        serverPort = DEV_PORT;
        log('[Electron] 📡 Using external development server');
      } else {
        log('[Electron] 🔄 Starting local server for development');
        serverPort = await createLocalServer();
      }
    } else {
      log('[Electron] 🔄 Starting local server for production');
      serverPort = await createLocalServer();
    }
  } catch (error) {
    log(`[Electron] ❌ Failed to start server: ${error.message}`);
    
    await showErrorDialog(error);
    app.quit();
    return;
  }

  // Crea finestra con impostazioni ottimizzate
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      // Migliora rendering
      experimentalFeatures: false,
      backgroundThrottling: false,
    },
    show: false,
    backgroundColor: '#fafaf9',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'InsuraTask',
    // Icona se disponibile
    icon: getAppIcon()
  });

  log('[Electron] 🖥️ Main window created');

  // Setup menu
  setupMenu();

  try {
    const appUrl = `http://localhost:${serverPort}`;
    log(`[Electron] 🌐 Loading app from: ${appUrl}`);
    
    // Timeout per il caricamento
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isLoading()) {
        log('[Electron] ⚠️ Loading timeout - forcing show');
        mainWindow.show();
      }
    }, 10000);
    
    await mainWindow.loadURL(appUrl);
    
    mainWindow.once('ready-to-show', () => {
      log('[Electron] ✅ Window ready - showing app');
      mainWindow.show();
      
      if (process.platform === 'darwin') {
        app.dock?.show();
      }
      mainWindow.focus();
      
      // DevTools solo in development
      if (isDevelopment) {
        log('[Electron] 🔧 Opening DevTools (development mode)');
        mainWindow.webContents.openDevTools();
      }
    });
    
    // Debug caricamento CSS/JS
    mainWindow.webContents.on('did-finish-load', () => {
      log('[Electron] ✅ Page finished loading');
      
      // Verifica che gli stili siano caricati
      mainWindow.webContents.executeJavaScript(`
        const stylesheets = document.styleSheets.length;
        const bodyComputed = getComputedStyle(document.body);
        console.log('Stylesheets loaded:', stylesheets);
        console.log('Body background:', bodyComputed.backgroundColor);
        
        // Invia risultati al main process
        'Stylesheets: ' + stylesheets + ', Body BG: ' + bodyComputed.backgroundColor;
      `).then(result => {
        log(`[Electron] CSS Debug: ${result}`);
      }).catch(e => {
        log(`[Electron] CSS Debug error: ${e.message}`);
      });
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      log(`[Electron] ❌ Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
    });
    
  } catch (error) {
    log(`[Electron] ❌ Failed to load app: ${error.message}`);
    showErrorWindow(error);
  }

  // Gestisci link esterni
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    log(`[Electron] 🔗 Opening external link: ${url}`);
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 🖼️ OTTIENI ICONA APP
function getAppIcon() {
  const iconPaths = [
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(__dirname, '..', 'electron', 'assets', 'icon.png'),
    path.join(process.resourcesPath, 'assets', 'icon.png')
  ];
  
  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      log(`[Electron] 🖼️ Using icon: ${iconPath}`);
      return iconPath;
    }
  }
  
  log('[Electron] ⚠️ No app icon found');
  return undefined;
}

// ❌ MOSTRA DIALOG ERRORE
async function showErrorDialog(error) {
  const response = await dialog.showMessageBox(null, {
    type: 'error',
    title: 'Errore Avvio InsuraTask',
    message: 'Impossibile avviare l\'applicazione',
    detail: `${error.message}\n\nFile di log: insuratask-debug.log`,
    buttons: ['Esci', 'Mostra Log', 'Apri Cartella'],
    defaultId: 0
  });
  
  if (response.response === 1) {
    // Mostra log
    const logPath = path.join(process.cwd(), 'insuratask-debug.log');
    shell.openPath(logPath);
  } else if (response.response === 2) {
    // Apri cartella app
    shell.showItemInFolder(app.getPath('exe'));
  }
}

// ❌ MOSTRA FINESTRA ERRORE
function showErrorWindow(error) {
  const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>InsuraTask - Errore</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex; 
          justify-content: center; 
          align-items: center; 
          min-height: 100vh; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 16px;
          backdrop-filter: blur(15px);
          max-width: 700px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        h1 { 
          color: #ff6b6b; 
          margin-bottom: 20px; 
          font-size: 2.5em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .error { 
          background: rgba(0,0,0,0.4);
          padding: 20px;
          border-radius: 12px;
          margin: 25px 0;
          font-family: 'Consolas', 'Monaco', monospace;
          text-align: left;
          word-break: break-word;
          font-size: 14px;
          line-height: 1.5;
          border-left: 4px solid #ff6b6b;
        }
        .suggestions {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: left;
          border-left: 4px solid #4ecdc4;
        }
        .suggestions h3 {
          color: #4ecdc4;
          margin-bottom: 10px;
        }
        .suggestions ul {
          margin-left: 20px;
        }
        .suggestions li {
          margin: 8px 0;
          line-height: 1.4;
        }
        button {
          background: linear-gradient(45deg, #4ecdc4, #44a08d);
          color: white;
          border: none;
          padding: 15px 25px;
          border-radius: 8px;
          cursor: pointer;
          margin: 10px;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        button:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .version {
          margin-top: 20px;
          opacity: 0.7;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Errore InsuraTask</h1>
        <p>L'applicazione non è riuscita ad avviarsi correttamente.</p>
        
        <div class="error">${error.message}</div>
        
        <div class="suggestions">
          <h3>💡 Possibili soluzioni:</h3>
          <ul>
            <li><strong>Riavvia</strong> l'applicazione</li>
            <li><strong>Esegui come amministratore</strong> (Windows)</li>
            <li><strong>Controlla antivirus</strong> - potrebbe bloccare l'app</li>
            <li><strong>Verifica spazio disco</strong> disponibile</li>
            <li><strong>Riavvia il computer</strong> se il problema persiste</li>
          </ul>
        </div>
        
        <button onclick="location.reload()">🔄 Riprova</button>
        <button onclick="require('electron').shell.openPath('${process.cwd()}')">📁 Apri Cartella</button>
        
        <div class="version">
          InsuraTask v1.0.9 | Platform: ${process.platform} | Mode: ${isDevelopment ? 'Development' : 'Production'}
        </div>
      </div>
    </body>
    </html>
  `;
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    mainWindow.show();
  }
}

// 📋 SETUP MENU
function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Nuova Attività',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
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
      label: 'Modifica',
      submenu: [
        { role: 'undo', label: 'Annulla' },
        { role: 'redo', label: 'Ripeti' },
        { type: 'separator' },
        { role: 'cut', label: 'Taglia' },
        { role: 'copy', label: 'Copia' },
        { role: 'paste', label: 'Incolla' },
        { role: 'selectall', label: 'Seleziona Tutto' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Ricarica' },
        { role: 'forceReload', label: 'Ricarica Forzata' },
        { role: 'toggleDevTools', label: 'DevTools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom 100%' },
        { role: 'zoomIn', label: 'Zoom +' },
        { role: 'zoomOut', label: 'Zoom -' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Schermo Intero' }
      ]
    },
    {
      label: 'Aiuto',
      submenu: [
        {
          label: 'Informazioni su InsuraTask',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'InsuraTask',
              message: 'InsuraTask v1.0.9',
              detail: '🛡️ Gestione attività per agenti assicurativi\n\n👨‍💻 Sviluppato da Federico Fusarri\n🌐 https://github.com/FDRFSR/insuratask',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Apri Log Debug',
          click: () => {
            const logPath = path.join(process.cwd(), 'insuratask-debug.log');
            shell.openPath(logPath);
          }
        },
        {
          label: 'Apri Cartella App',
          click: () => {
            shell.showItemInFolder(app.getPath('exe'));
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 🚀 EVENT HANDLERS
app.whenReady().then(() => {
  log('[Electron] 🚀 App ready - creating window');
  createWindow();
});

app.on('window-all-closed', () => {
  log('[Electron] 🔚 All windows closed');
  
  if (localServer) {
    log('[Electron] Closing local server');
    localServer.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    log('[Electron] 🔄 Reactivating - creating window');
    createWindow();
  }
});

app.on('before-quit', () => {
  log('[Electron] 🔚 App quitting - cleanup');
  if (localServer) {
    localServer.close();
  }
});

// ❌ GESTIONE ERRORI CRITICI
process.on('uncaughtException', (error) => {
  log(`[Electron] ❌ UNCAUGHT EXCEPTION: ${error.message}`);
  log(`[Electron] Stack: ${error.stack}`);
});

process.on('unhandledRejection', (reason) => {
  log(`[Electron] ❌ UNHANDLED REJECTION: ${reason}`);
});