#!/usr/bin/env node

/**
 * 🚀 Build script isolato per binario standalone
 * Crea un environment completamente pulito senza dipendenze frontend
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧹 Creating isolated standalone build...');

// 1. Crea directory temporanea
const tempDir = path.join(__dirname, 'temp-standalone');
const distDir = path.join(__dirname, 'dist');

// Pulisci e crea directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// 2. Crea package.json minimal per standalone
const minimalPackageJson = {
  "name": "insuratask-standalone",
  "version": "1.0.0",
  "type": "module",
  "main": "standalone.js",
  "bin": {
    "insuratask": "standalone.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "better-sqlite3": "^11.10.0", 
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "pkg": {
    "scripts": ["standalone.js"],
    "assets": ["static/**/*"],
    "targets": ["node18-win-x64", "node18-macos-x64", "node18-linux-x64"],
    "outputPath": "../pkg-dist"
  }
};

console.log('📝 Creating minimal package.json...');
fs.writeFileSync(
  path.join(tempDir, 'package.json'), 
  JSON.stringify(minimalPackageJson, null, 2)
);

// 3. Copia il file server standalone pulito
const standaloneCode = `#!/usr/bin/env node

/**
 * 🛡️ InsuraTask Standalone Server
 * Server completo con UI embedded per esecuzione senza dipendenze
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 🔧 Configurazione
const PORT = process.env.PORT || 3000;
const isPkg = process.pkg !== undefined;
const isDev = process.env.NODE_ENV === 'development';

console.log(\`[InsuraTask] Starting server...\`);
console.log(\`[InsuraTask] Mode: \${isPkg ? 'PKG Binary' : 'Node.js'}\`);
console.log(\`[InsuraTask] Port: \${PORT}\`);

// 📂 Path resolution per PKG
function getStaticPath() {
  if (isPkg) {
    // In PKG, gli assets sono in snapshot/app/static
    const pkgPath = path.join(path.dirname(process.execPath), 'static');
    if (fs.existsSync(pkgPath)) {
      return pkgPath;
    }
    
    // Fallback per PKG
    return path.join(__dirname, '..', 'static');
  }
  
  // Development/normal Node.js
  return path.join(__dirname, 'static');
}

function getDatabasePath() {
  if (isPkg) {
    // In PKG, usa directory accanto all'eseguibile
    return path.join(path.dirname(process.execPath), 'insuratask.db');
  }
  
  return path.join(__dirname, 'insuratask.db');
}

// 🗄️ Database setup
const dbPath = getDatabasePath();
console.log(\`[Database] Path: \${dbPath}\`);

let db;
try {
  db = new Database(dbPath);
  console.log('[Database] ✅ Connected');
  
  // Crea tabelle se non esistono
  db.exec(\`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      client TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT,
      due_time TEXT,
      completed BOOLEAN NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  \`);
  
  // Seed data se vuoto
  const count = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  if (count.count === 0) {
    console.log('[Database] Seeding initial data...');
    const today = new Date().toISOString().split('T')[0];
    
    const insert = db.prepare(\`
      INSERT INTO tasks (title, description, category, client, priority, status, due_date, due_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \`);
    
    insert.run(
      'Chiamata cliente esempio',
      'Contattare il cliente per rinnovo polizza',
      'calls',
      'Mario Rossi',
      'high',
      'pending',
      today,
      '14:30'
    );
    
    console.log('[Database] ✅ Initial data seeded');
  }
  
} catch (error) {
  console.error('[Database] ❌ Error:', error.message);
  process.exit(1);
}

// 📋 Zod schemas
const insertTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['calls', 'quotes', 'claims', 'documents', 'appointments']),
  client: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'completed', 'overdue']).default('pending'),
  dueDate: z.string().optional(),
  dueTime: z.string().optional()
});

const updateTaskSchema = insertTaskSchema.partial();

// 🔧 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 📊 CORS per development
if (isDev) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
}

// 🔗 API Routes
app.get('/api/tasks/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    const pending = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('pending');
    const completed = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('completed');
    const overdue = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('overdue');
    const dueToday = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE due_date = ? AND completed = 0').get(today);

    res.json({
      total: total.count,
      pending: pending.count,
      completed: completed.count,
      overdue: overdue.count,
      dueToday: dueToday.count,
    });
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero delle statistiche" });
  }
});

app.get('/api/tasks', (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    let query = 'SELECT * FROM tasks';
    let params = [];
    let conditions = [];
    
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR client LIKE ?)');
      const searchTerm = \`%\${search}%\`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const tasks = db.prepare(query).all(...params);
    
    // Converti da snake_case a camelCase
    const convertedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      client: task.client,
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date,
      dueTime: task.due_time,
      completed: Boolean(task.completed),
      completedAt: task.completed_at ? new Date(task.completed_at) : null,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at)
    }));
    
    res.json(convertedTasks);
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero delle attività" });
  }
});

app.get('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID attività non valido" });
    }
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ message: "Attività non trovata" });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Errore nel recupero dell'attività" });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const result = insertTaskSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ 
        message: "Dati attività non validi",
        errors: validationError.message 
      });
    }

    const now = new Date().toISOString();
    const data = result.data;
    
    const stmt = db.prepare(\`
      INSERT INTO tasks (title, description, category, client, priority, status, due_date, due_time, completed, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);

    const insertResult = stmt.run(
      data.title,
      data.description || null,
      data.category,
      data.client || null,
      data.priority || 'medium',
      data.status || 'pending',
      data.dueDate || null,
      data.dueTime || null,
      0,
      null,
      now,
      now
    );

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(insertResult.lastInsertRowid);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Errore nella creazione dell'attività" });
  }
});

app.patch('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID attività non valido" });
    }

    const result = updateTaskSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ 
        message: "Dati aggiornamento non validi",
        errors: validationError.message 
      });
    }

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existingTask) {
      return res.status(404).json({ message: "Attività non trovata" });
    }

    const data = result.data;
    const now = new Date().toISOString();
    const completedAt = data.completed === true ? now : 
                       data.completed === false ? null : 
                       existingTask.completed_at;

    const stmt = db.prepare(\`
      UPDATE tasks 
      SET title = ?, description = ?, category = ?, client = ?, priority = ?, 
          status = ?, due_date = ?, due_time = ?, completed = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    \`);

    stmt.run(
      data.title ?? existingTask.title,
      data.description ?? existingTask.description,
      data.category ?? existingTask.category,
      data.client ?? existingTask.client,
      data.priority ?? existingTask.priority,
      data.status ?? existingTask.status,
      data.dueDate ?? existingTask.due_date,
      data.dueTime ?? existingTask.due_time,
      data.completed !== undefined ? (data.completed ? 1 : 0) : existingTask.completed,
      completedAt,
      now,
      id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Errore nell'aggiornamento dell'attività" });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID attività non valido" });
    }

    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: "Attività non trovata" });
    }

    res.json({ message: "Attività eliminata con successo" });
  } catch (error) {
    res.status(500).json({ message: "Errore nell'eliminazione dell'attività" });
  }
});

// 📁 Serve static files
const staticPath = getStaticPath();
console.log(\`[Static] Path: \${staticPath}\`);

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  console.log('[Static] ✅ Files served');
  
  // SPA fallback
  app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend files not found');
    }
  });
} else {
  console.warn('[Static] ⚠️ Static files not found, serving API only');
  
  app.get('*', (req, res) => {
    res.json({ 
      message: 'InsuraTask API Server',
      status: 'running',
      endpoints: ['/api/tasks', '/api/tasks/stats']
    });
  });
}

// 🚀 Start server
const server = app.listen(PORT, () => {
  console.log(\`\`);
  console.log(\`🛡️  InsuraTask Server Started\`);
  console.log(\`📡 Server: http://localhost:\${PORT}\`);
  console.log(\`💾 Database: \${dbPath}\`);
  console.log(\`📁 Static: \${staticPath}\`);
  console.log(\`\`);
  console.log(\`Ready to manage your insurance tasks! 🚀\`);
  console.log(\`\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  
  server.close(() => {
    if (db) {
      db.close();
      console.log('[Database] Connection closed');
    }
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  
  server.close(() => {
    if (db) {
      db.close();
    }
    process.exit(0);
  });
});
`;

console.log('📝 Creating standalone server file...');
fs.writeFileSync(path.join(tempDir, 'standalone.js'), standaloneCode);

// 4. Copia static files se esistono
const staticSourcePath = path.join(distDir, 'public');
const staticDestPath = path.join(tempDir, 'static');

if (fs.existsSync(staticSourcePath)) {
  console.log('📁 Copying static files...');
  
  function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      files.forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  copyRecursive(staticSourcePath, staticDestPath);
  console.log('✅ Static files copied');
} else {
  console.log('⚠️ No static files found, will serve API only');
}

// 5. Install minimal dependencies
console.log('📦 Installing minimal dependencies...');
process.chdir(tempDir);

try {
  execSync('npm install --production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// 6. Build with pkg
console.log('🔨 Building standalone binaries...');

try {
  // Pulisci pkg-dist nella directory principale
  const pkgDistPath = path.join(__dirname, 'pkg-dist');
  if (fs.existsSync(pkgDistPath)) {
    fs.rmSync(pkgDistPath, { recursive: true });
  }
  fs.mkdirSync(pkgDistPath, { recursive: true });
  
  // Esegui pkg
  execSync('npx pkg .', { stdio: 'inherit' });
  console.log('✅ Standalone binaries built');
  
} catch (error) {
  console.error('❌ Failed to build binaries:', error.message);
  process.exit(1);
}

// 7. Cleanup
console.log('🧹 Cleaning up...');
process.chdir(__dirname);

// Lista i file generati
const pkgDistPath = path.join(__dirname, 'pkg-dist');
if (fs.existsSync(pkgDistPath)) {
  console.log('📦 Generated files:');
  const files = fs.readdirSync(pkgDistPath);
  files.forEach(file => {
    const filePath = path.join(pkgDistPath, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`  - ${file} (${sizeMB} MB)`);
  });
}

// Rimuovi directory temporanea
fs.rmSync(tempDir, { recursive: true });

console.log('');
console.log('🎉 Standalone build completed!');
console.log('');
console.log('📁 Files are in: pkg-dist/');
console.log('🚀 Run with: ./pkg-dist/insuratask-standalone-*');
console.log('');