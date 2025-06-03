const { app, BrowserWindow, Menu, shell, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');

// Configurazione app
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_PORT = 5000; // Porta per development server esterno

// Variabili globali
let mainWindow = null;
let localServer = null;

console.log(`[Electron] Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`[Electron] isPackaged: ${app.isPackaged}`);

// 🎯 SOLUZIONE SEMPLICE: Server locale per production
function createLocalServer() {
  return new Promise((resolve, reject) => {
    // Trova percorso files statici
    let staticPath;
    
    if (isDevelopment) {
      // In development: punta alla build locale
      staticPath = path.join(__dirname, '..', 'dist', 'public');
    } else {
      // In production: prova diversi percorsi possibili
      const possiblePaths = [
        path.join(process.resourcesPath, 'app', 'dist', 'public'),  // Electron Builder standard
        path.join(app.getAppPath(), 'dist', 'public'),              // Alternative
        path.join(__dirname, '..', 'dist', 'public'),               // Fallback 1
        path.join(__dirname, 'dist', 'public'),                     // Fallback 2
      ];
      
      staticPath = possiblePaths.find(p => fs.existsSync(p));
      
      if (!staticPath) {
        console.log('[Electron] Tried paths:', possiblePaths);
        return reject(new Error(`Static files not found. Tried:\n${possiblePaths.join('\n')}\n\nRun 'npm run build' first.`));
      }
    }
    
    console.log(`[Electron] Static files path: ${staticPath}`);
    
    // Verifica che i files esistano
    if (!fs.existsSync(staticPath)) {
      return reject(new Error(`Static files not found at: ${staticPath}\n\nRun 'npm run build' first.`));
    }
    
    // Crea server Express locale
    const app = express();
    
    // Serve file statici
    app.use(express.static(staticPath));
    
    // API mock semplice per le statistiche (necessaria per il frontend)
    app.get('/api/tasks/stats', (req, res) => {
      res.json({
        total: 0,
        pending: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0
      });
    });
    
    // API mock per le tasks
    app.get('/api/tasks', (req, res) => {
      res.json([]);
    });
    
    // Fallback: serve index.html per SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
    
    // Avvia su porta libera
    const server = app.listen(0, 'localhost', () => {
      const port = server.address().port;
      console.log(`[Electron] ✅ Local server started on port ${port}`);
      resolve(port);
    });
    
    server.on('error', (err) => {
      console.error('[Electron] Server error:', err);
      reject(err);
    });
    
    // Salva riferimento server
    localServer = server;
  });
}

// Controlla se development server è disponibile
function checkDevelopmentServer() {
  if (!isDevelopment) return Promise.resolve(false);
  
  return new Promise((resolve) => {
    const http = require('http');
    
    const req = http.get(`http://localhost:${DEV_PORT}/api/tasks/stats`, (res) => {
      console.log(`[Electron] ✅ Development server running on port ${DEV_PORT}`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`[Electron] No development server on port ${DEV_PORT}`);
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
  console.log('[Electron] Creating main window...');
  
  let serverPort;
  
  try {
    if (isDevelopment) {
      // In development: prova prima il dev server esterno
      const devServerRunning = await checkDevelopmentServer();
      
      if (devServerRunning) {
        serverPort = DEV_PORT;
        console.log('[Electron] Using external development server');
      } else {
        console.log('[Electron] Starting local server for development');
        serverPort = await createLocalServer();
      }
    } else {
      // In production: sempre server locale
      console.log('[Electron] Starting local server for production');
      serverPort = await createLocalServer();
    }
  } catch (error) {
    console.error('[Electron] Failed to start server:', error);
    
    // Mostra dialog di errore
    const response = await dialog.showMessageBox(null, {
      type: 'error',
      title: 'Errore Avvio InsuraTask',
      message: 'Impossibile avviare l\'applicazione',
      detail: error.message,
      buttons: ['Esci', 'Mostra Dettagli'],
      defaultId: 0
    });
    
    if (response.response === 1) {
      // Mostra dettagli
      showErrorWindow(error);
      return;
    } else {
      app.quit();
      return;
    }
  }

  // Crea la finestra principale
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

  // Setup menu
  setupMenu();

  try {
    const appUrl = `http://localhost:${serverPort}`;
    console.log(`[Electron] Loading app from: ${appUrl}`);
    
    await mainWindow.loadURL(appUrl);
    
    // Mostra la finestra quando è pronta
    mainWindow.once('ready-to-show', () => {
      console.log('[Electron] ✅ Window ready, showing app');
      mainWindow.show();
      
      if (process.platform === 'darwin') {
        app.dock?.show();
      }
      mainWindow.focus();
      
      // DevTools solo in development
      if (isDevelopment) {
        mainWindow.webContents.openDevTools();
      }
    });
    
  } catch (error) {
    console.error('[Electron] Failed to load app:', error);
    showErrorWindow(error);
  }

  // Gestisci i link esterni
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
          font-family: system-ui, -apple-system, sans-serif;
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
          white-space: pre-line;
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
        <p><strong>Soluzioni:</strong></p>
        <ul style="text-align: left;">
          <li>Assicurati di aver fatto il build: <code>npm run build</code></li>
          <li>Verifica che i file esistano nella cartella dist/</li>
          <li>Prova a riavviare l'applicazione</li>
        </ul>
        <button onclick="location.reload()">🔄 Riprova</button>
        <button onclick="require('electron').shell.openExternal('https://github.com/FDRFSR/insuratask/issues')">🐛 Segnala</button>
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
              message: 'InsuraTask v1.0.0',
              detail: 'Gestione attività per agenti assicurativi\n\nSviluppato da Federico Fusarri'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Chiudi server locale
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
  if (localServer) {
    localServer.close();
  }
});

// Gestione errori
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron] Unhandled Rejection:', reason);
});