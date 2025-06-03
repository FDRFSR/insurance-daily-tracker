const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Configurazione app
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = process.env.PORT || 5000;

// Variabili globali
let serverProcess = null;
let mainWindow = null;

console.log(`[Electron] Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`[Electron] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Electron] isPackaged: ${app.isPackaged}`);

// Trova porta libera
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      resolve(findFreePort(startPort + 1));
    });
  });
}

// Controlla se il server è già in esecuzione
function checkServerRunning(port) {
  return new Promise((resolve) => {
    const http = require('http');
    
    const req = http.get(`http://localhost:${port}/api/tasks/stats`, (res) => {
      console.log(`[Electron] ✅ Server already running on port ${port}`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`[Electron] No server running on port ${port}`);
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Avvia server Express (solo se necessario)
async function ensureServerRunning() {
  // In development, controlla prima se il server è già in esecuzione
  if (isDevelopment) {
    console.log(`[Electron] Development mode: checking if server is already running...`);
    
    const isRunning = await checkServerRunning(PORT);
    if (isRunning) {
      console.log(`[Electron] Using existing development server on port ${PORT}`);
      return PORT;
    }
    
    console.log(`[Electron] No existing server found, will start one`);
  }
  
  // Se arriviamo qui, dobbiamo avviare il server
  if (serverProcess) {
    console.log(`[Electron] Server process already exists`);
    return PORT;
  }
  
  try {
    let serverPath;
    let command;
    let args;
    let usePort = PORT;
    
    if (isDevelopment) {
      // Modalità development - usa tsx per TypeScript
      serverPath = path.join(__dirname, '..', 'server', 'index.ts');
      command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      args = ['tsx', serverPath];
      
      // In development, se la porta è occupata, trova una libera
      usePort = await findFreePort(PORT + 1);
      console.log(`[Electron] Development server will use port ${usePort}`);
    } else {
      // Modalità production - usa node per JavaScript compilato  
      serverPath = path.join(__dirname, '..', 'dist', 'index.js');
      command = 'node';
      args = [serverPath];
    }
    
    console.log(`[Electron] Server path: ${serverPath}`);
    console.log(`[Electron] Command: ${command} ${args.join(' ')}`);
    
    // Verifica che il file server esista
    if (!fs.existsSync(serverPath)) {
      console.error(`[Electron] Server file not found: ${serverPath}`);
      
      if (!isDevelopment) {
        throw new Error(`Build files not found at ${serverPath}.\n\nRun 'npm run build' first to create production files.`);
      } else {
        throw new Error(`Development server file not found: ${serverPath}\n\nMake sure the server directory exists.`);
      }
    }
    
    console.log(`[Electron] Starting server process on port ${usePort}...`);
    
    serverProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: isDevelopment ? 'development' : 'production',
        PORT: usePort.toString()
      },
      shell: process.platform === 'win32'
    });
    
    // Log output del server
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Server] ${output}`);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('Browserslist')) {
        console.error(`[Server Error] ${output}`);
      }
    });
    
    serverProcess.on('error', (err) => {
      console.error('[Electron] Failed to start server process:', err);
    });
    
    serverProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Server process exited with code ${code} and signal ${signal}`);
      serverProcess = null;
      
      if (code !== 0 && code !== null) {
        console.error(`[Electron] Server crashed with exit code ${code}`);
      }
    });
    
    return usePort;
    
  } catch (error) {
    console.error('[Electron] Server startup failed:', error);
    
    // Mostra dialog di errore user-friendly
    const response = await dialog.showMessageBox(null, {
      type: 'error',
      title: 'Errore Avvio Server',
      message: 'Impossibile avviare il server InsuraTask',
      detail: error.message,
      buttons: ['Esci', 'Riprova'],
      defaultId: 0,
      cancelId: 0
    });
    
    if (response.response === 1) {
      // Riprova
      return ensureServerRunning();
    } else {
      // Esci
      app.quit();
      return null;
    }
  }
}

// Aspetta che il server sia pronto
function waitForServer(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      const http = require('http');
      
      console.log(`[Electron] Checking server readiness on port ${port} (attempt ${attempts + 1}/${maxAttempts})`);
      
      const req = http.get(`http://localhost:${port}/api/tasks/stats`, (res) => {
        console.log('[Electron] ✅ Server is ready and responding!');
        resolve(true);
      });
      
      req.on('error', (err) => {
        attempts++;
        console.log(`[Electron] Server not ready yet (${err.code}), retrying...`);
        
        if (attempts >= maxAttempts) {
          console.error('[Electron] Server failed to start after maximum attempts');
          reject(new Error(`Server failed to start after ${maxAttempts} attempts.\n\nLast error: ${err.message}\n\nTry running 'npm run dev' separately to check for errors.`));
        } else {
          setTimeout(checkServer, 2000);
        }
      });
      
      req.setTimeout(3000, () => {
        req.destroy();
      });
    };
    
    // Prima attesa per dare tempo al server di avviarsi
    console.log('[Electron] Waiting for server to start...');
    setTimeout(checkServer, 1000);
  });
}

// Crea finestra principale
async function createWindow() {
  console.log('[Electron] Creating main window...');
  
  // Assicura che il server sia in esecuzione
  const serverPort = await ensureServerRunning();
  if (!serverPort) {
    console.error('[Electron] Failed to ensure server is running, exiting');
    return;
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
    icon: getIconPath(),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    backgroundColor: '#fafaf9'
  });

  // Setup menu
  setupMenu();

  try {
    console.log('[Electron] Waiting for server to be ready...');
    await waitForServer(serverPort);
    
    const appUrl = `http://localhost:${serverPort}`;
    console.log(`[Electron] Loading app from: ${appUrl}`);
    
    await mainWindow.loadURL(appUrl);
    
    // Mostra la finestra quando è pronta
    mainWindow.once('ready-to-show', () => {
      console.log('[Electron] ✅ Window ready, showing app');
      mainWindow.show();
      
      // Focus sulla finestra
      if (process.platform === 'darwin') {
        app.dock?.show();
      }
      mainWindow.focus();
      
      // DevTools in development
      if (isDevelopment) {
        console.log('[Electron] Opening DevTools (development mode)');
        mainWindow.webContents.openDevTools();
      }
    });
    
    // Gestisci errori di caricamento
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`[Electron] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
    });
    
  } catch (error) {
    console.error('[Electron] Failed to load app:', error);
    
    // Mostra pagina di errore migliorata
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>InsuraTask - Errore</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
          }
          .error-container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
          }
          h1 { 
            color: #ff6b6b; 
            margin-bottom: 20px; 
            font-size: 2em;
            margin-top: 0;
          }
          p { 
            margin: 15px 0; 
            line-height: 1.6;
            opacity: 0.9;
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
            transition: background 0.3s;
          }
          button:hover { 
            background: #45b7b8; 
          }
          .details {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            text-align: left;
            white-space: pre-line;
            line-height: 1.4;
          }
          .suggestions {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>⚠️ Errore Server InsuraTask</h1>
          <p>Il server InsuraTask non è riuscito ad avviarsi correttamente.</p>
          
          <div class="details">Errore: ${error.message}

Modalità: ${isDevelopment ? 'Development' : 'Production'}
Porta tentata: ${serverPort}
          </div>
          
          <div class="suggestions">
            <strong>💡 In modalità development:</strong><br>
            Assicurati che 'npm run dev' sia già in esecuzione in un altro terminale prima di avviare Electron.
          </div>
          
          <button onclick="location.reload()">🔄 Riprova</button>
          <button onclick="require('electron').shell.openExternal('https://github.com/FDRFSR/insuratask/issues')">🐛 Segnala Bug</button>
        </div>
      </body>
      </html>
    `;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    mainWindow.show();
  }

  // Gestisci i link esterni
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Ottieni percorso icona
function getIconPath() {
  const iconDir = path.join(__dirname, 'assets');
  
  if (process.platform === 'win32') {
    return path.join(iconDir, 'icon.ico');
  } else if (process.platform === 'darwin') {
    return path.join(iconDir, 'icon.icns');
  } else {
    return path.join(iconDir, 'icon.png');
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
        {
          role: 'quit',
          label: process.platform === 'darwin' ? 'Esci da InsuraTask' : 'Esci'
        }
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
        { role: 'paste', label: 'Incolla' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Ricarica' },
        { role: 'forceReload', label: 'Ricarica Forzata' },
        { role: 'toggleDevTools', label: 'Strumenti Sviluppatore' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normale' },
        { role: 'zoomIn', label: 'Zoom Avanti' },
        { role: 'zoomOut', label: 'Zoom Indietro' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Schermo Intero' }
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
              detail: 'Gestione attività per agenti assicurativi\n\nSviluppato da Federico Fusarri',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Event handlers
app.whenReady().then(() => {
  console.log('[Electron] App ready, creating window');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('[Electron] All windows closed');
  
  // In development, NON terminare il server esterno
  // In production, terminare il nostro server
  if (!isDevelopment && serverProcess) {
    console.log('[Electron] Killing server process');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (serverProcess) {
        console.log('[Electron] Force killing server process');
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
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
  console.log('[Electron] App quitting, cleaning up');
  
  // Solo in production terminiamo il nostro server
  if (!isDevelopment && serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

// Gestione errori
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Electron] Unhandled Rejection:', reason);
});