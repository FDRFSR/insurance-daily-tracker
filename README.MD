# 🛡️ InsuraTask v1.1

**Una moderna applicazione web e desktop per la gestione delle attività di agenti assicurativi**

[![Version](https://img.shields.io/badge/version-1.1.0--dev-blue?style=for-the-badge)](https://github.com/FDRFSR/insurance-daily-tracker)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

---

## 📋 Panoramica

InsuraTask è una soluzione completa per agenti assicurativi che vogliono ottimizzare la gestione delle loro attività quotidiane. L'applicazione offre un'interfaccia intuitiva per organizzare chiamate, preventivi, sinistri, documentazione e appuntamenti con i clienti.

### 🎯 Obiettivi
- **Centralizzare** la gestione delle attività assicurative
- **Migliorare** l'organizzazione temporale degli agenti
- **Ridurre** le attività perse o dimenticate
- **Fornire** una panoramica chiara delle priorità quotidiane

---

## 📸 Screenshots

### 🏠 Dashboard Principale
![Dashboard Overview](screenshots/dashboard-overview.png)
*Vista principale con statistiche, lista attività e calendario integrato*

### 📋 Gestione Attività
![Task Management](screenshots/task-management.png)
*Lista attività con filtri, ricerca e azioni rapide*

---

## ✨ Funzionalità Principali

### 📊 Dashboard Intelligente v1.1
- **Statistiche real-time**: Panoramica delle attività totali, in scadenza, completate
- **Analytics Avanzate**: Grafici interattivi per trend, distribuzioni e performance
- **Notifiche smart**: Alert per attività in ritardo e scadenze del giorno
- **Metriche visuali**: Card colorate con icone specifiche per ogni categoria
- **Export Professionale**: Report PDF/Excel con branding e statistiche integrate

### 📅 Gestione Attività Avanzata
- **CRUD completo**: Crea, modifica, elimina e visualizza attività
- **Categorie specializzate**: Chiamate, Preventivi, Sinistri, Documenti, Appuntamenti
- **Priorità e stati**: Sistema di priorità (bassa/media/alta) e stati (pending/completed/overdue)
- **Ricerca potente**: Filtro per categoria, ricerca testuale su titolo/descrizione/cliente
- **File Attachments**: Allegati per ogni attività con preview integrato

### 🗓️ Calendario Interattivo (Enhanced Calendar)
- **Vista mensile avanzata**: Navigazione fluida con indicatori eventi per giorno
- **Popover dettagliati**: Click su ogni giorno per vedere attività complete
- **Indicatori categorizzati**: Punti colorati per tipo di attività
- **Priority indicators**: Icone speciali per alta priorità e scadenze
- **Integrazione filtri**: Selezione date sincronizzata con task list

### ⚡ Quick Actions & Shortcuts v1.1
- **6 Azioni rapide**: Bottoni categorizzati per creazione veloce attività
- **Keyboard shortcuts**: Scorciatoie complete (Ctrl+N, Q, A, S, F, T)
- **Visual feedback**: Animazioni hover e feedback visivo professionale
- **Form pre-compilati**: Categoria e data già selezionate per workflow ottimizzato
- **Cross-platform**: Supporto Ctrl/Cmd per Windows/Mac

### 👤 Gestione Profilo
- **Profilo personalizzabile**: Nome, email, ruolo, azienda
- **Preferenze utente**: Tema chiaro/scuro, lingua, notifiche
- **Persistenza locale**: Salvataggio automatico delle preferenze

### 📈 Reporting & Analytics v1.1
- **Grafici interattivi**: Trend settimanali, performance giornaliere, distribuzioni
- **Export avanzato**: PDF e Excel con filtri personalizzabili
- **Metriche real-time**: Tasso completamento, efficienza, clienti da ricontattare
- **Dashboard toggle**: Visualizzazione analytics opzionale per interfaccia pulita

---

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** - Framework UI moderno con hooks
- **TypeScript** - Type safety e developer experience
- **Vite** - Build tool veloce e moderno
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui + Radix UI** - Componenti accessibili e customizzabili
- **TanStack Query** - Data fetching e caching intelligente
- **React Hook Form + Zod** - Form management e validazione
- **Chart.js + Recharts** - 📈 Grafici interattivi e analytics (v1.1)
- **React-ChartJS-2** - 📊 Integrazione React per Chart.js (v1.1)

### Backend
- **Node.js + TypeScript** - Runtime JavaScript server-side
- **Express.js** - Web framework minimalista
- **SQLite + better-sqlite3** - Database embedded performante
- **Zod** - Schema validation condivisa
- **Drizzle ORM** - Type-safe database queries
- **Multer** - 📎 File upload middleware (v1.1)
- **jsPDF + jsPDF-AutoTable** - 📄 Generazione PDF professionale (v1.1)
- **XLSX** - 📊 Export Excel con formattazione (v1.1)
- **Node-Cron** - 🔄 Scheduler per automazione (v1.1)

### Google Integration (Preparato per v1.3)
- **Google APIs** - Client per Google Calendar
- **Google Auth Library** - OAuth2 authentication
- **Googleapis** - SDK completo Google Services

### DevOps & Tools
- **ESLint + TypeScript** - Code quality e type checking
- **PostCSS + Autoprefixer** - CSS processing
- **Wouter** - Routing leggero
- **tsx** - TypeScript execution per development
- **Electron** - Desktop app wrapper
- **PKG** - Standalone executables

---

## 📁 Struttura del Progetto

```
insuratask/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti riutilizzabili
│   │   │   ├── ui/        # UI components (shadcn/ui)
│   │   │   ├── export/    # 📊 Export components (v1.1)
│   │   │   │   └── ExportModal.tsx
│   │   │   ├── attachments/ # 📎 File management (v1.1)
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   ├── AttachmentList.tsx
│   │   │   │   └── FilePreview.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── task-list.tsx
│   │   │   ├── task-modal.tsx
│   │   │   ├── enhanced-calendar.tsx  # 📅 Enhanced (v1.1)
│   │   │   └── dashboard-charts.tsx   # 📈 Analytics (v1.1)
│   │   ├── contexts/       # React Context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   │   └── exportService.ts  # 📊 Export API (v1.1)
│   │   ├── types/          # TypeScript definitions
│   │   │   └── export.ts   # 📊 Export types (v1.1)
│   │   └── main.tsx        # Entry point
│   └── index.html
├── server/                 # Backend Express
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes definition
│   ├── storage.ts         # Data layer interface
│   ├── sqlite-storage.ts  # SQLite implementation
│   ├── middleware/        # 📎 Middleware (v1.1)
│   │   └── fileUpload.ts  # Multer configuration
│   ├── routes/            # 📊 API routes (v1.1)
│   │   ├── export.ts      # Export endpoints
│   │   ├── attachments.ts # File management
│   │   └── templates.ts   # Template CRUD (preparato)
│   ├── services/          # 🔧 Business logic (v1.1)
│   │   ├── reportGenerator.ts  # PDF/Excel generation
│   │   └── cronService.ts      # Job scheduler
│   └── vite.ts            # Vite integration
├── shared/                # Codice condiviso
│   ├── schema.ts          # Zod schemas e types
│   ├── schemas/           # 📊 Schema validation (v1.1)
│   │   └── export.ts      # Export request schemas
│   └── types/             # 📊 Type definitions (v1.1)
│       ├── export.ts      # Export data types
│       ├── template.ts    # Template types (preparato)
│       └── attachment.ts  # Attachment types
├── electron/              # Wrapper Electron per desktop app
├── screenshots/           # Screenshot per la documentazione
├── uploads/               # 📎 File storage (v1.1)
│   └── metadata/          # File metadata storage
├── dist-pkg/              # Build standalone desktop
├── package.json           # Dependencies (aggiornato v1.1)
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.MD
```

---

## 🔌 API Reference

### Endpoints Principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Lista attività con filtri |
| `GET` | `/api/tasks/:id` | Dettaglio attività specifica |
| `POST` | `/api/tasks` | Crea nuova attività |
| `PATCH` | `/api/tasks/:id` | Aggiorna attività esistente |
| `DELETE` | `/api/tasks/:id` | Elimina attività |
| `GET` | `/api/tasks/stats` | Statistiche dashboard |

### 📊 Nuovi Endpoints v1.1 - Export & Files

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/api/export` | Genera report PDF/Excel |
| `POST` | `/api/export/preview` | Anteprima dati export |
| `POST` | `/api/attachments/upload` | Upload file allegati |
| `GET` | `/api/attachments/:taskId` | Lista allegati per attività |
| `DELETE` | `/api/attachments/:id` | Elimina allegato |
| `GET` | `/api/attachments/download/:id` | Download file allegato |

### 🔄 Endpoints Templates (Preparati v1.2)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/templates` | Lista template disponibili |
| `POST` | `/api/templates` | Crea nuovo template |
| `PATCH` | `/api/templates/:id` | Aggiorna template |
| `DELETE` | `/api/templates/:id` | Elimina template |
| `POST` | `/api/templates/:id/generate` | Genera task da template |

### Query Parameters

```bash
# Filtra per categoria
GET /api/tasks?category=calls

# Filtra per stato  
GET /api/tasks?status=pending

# Ricerca testuale
GET /api/tasks?search=mario+rossi

# Combinazione filtri
GET /api/tasks?category=quotes&status=pending&search=preventivo
```

### 📊 Esempio Export Request (v1.1)

**POST /api/export**
```json
{
  "format": "pdf",  // "pdf" | "excel"
  "title": "Report Attività Settimanali",
  "filters": {
    "category": "calls",
    "status": "pending",
    "dateFrom": "2025-06-01",
    "dateTo": "2025-06-07",
    "client": "Mario Rossi"
  },
  "includeStats": true
}
```

**Response:** File download (application/pdf o application/xlsx)

### Esempio Task Request/Response

**POST /api/tasks**
```json
{
  "title": "Chiamare Mario Rossi per rinnovo polizza auto",
  "description": "Discutere nuove coperture e sconti famiglia",
  "category": "calls",
  "client": "Mario Rossi",
  "priority": "high",
  "dueDate": "2025-06-03",
  "dueTime": "14:30"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Chiamare Mario Rossi per rinnovo polizza auto",
  "description": "Discutere nuove coperture e sconti famiglia",
  "category": "calls",
  "client": "Mario Rossi",
  "priority": "high",
  "status": "pending",
  "dueDate": "2025-06-03",
  "dueTime": "14:30",
  "completed": false,
  "completedAt": null,
  "createdAt": "2025-06-02T10:30:00Z",
  "updatedAt": "2025-06-02T10:30:00Z"
}
```

---

## 🎨 Design System

### Palette Colori

```css
/* Colori Primari */
--primary: #1565C0;           /* Blue - Azioni principali */
--secondary: #B45309;         /* Orange - Azioni secondarie */
--success: #2E7D32;          /* Green - Successo/Completato */
--warning: #F57C00;          /* Orange - Attenzione/Media priorità */
--error: #EF4444;            /* Red - Errore/Alta priorità */

/* Colori Neutri */
--background: #FAFAF9;       /* Sfondo principale */
--foreground: #080808;       /* Testo principale */
--muted: #F5F5F4;           /* Elementi secondari */
--border: #E7E5E4;           /* Bordi */
```

### Categorie Attività

| Categoria | Icona | Colore | Descrizione |
|-----------|-------|---------|-------------|
| `calls` | 📞 | Blue | Chiamate clienti |
| `quotes` | 🧮 | Green | Preventivi e quotazioni |
| `claims` | 📋 | Red | Gestione sinistri |
| `documents` | 📁 | Yellow | Documentazione |
| `appointments` | 📅 | Purple | Appuntamenti |

---

## 🗄️ Database locale

- Il database SQLite viene creato in `~/.config/insuratask/tasks.db` (Linux/macOS) o nella cartella utente su Windows.
- Non viene mai sovrascritto da nuove release.
- Backup e migrazioni schema gestite dal backend.

---

## 🧪 Testing

```bash
npm run check      # Type checking
npm run build      # Build test
npx eslint client/src server/   # Linting
```

---

## 🚀 Deployment

### Ambiente di Produzione

1. **Build dell'applicazione**:
   ```bash
   npm run build
   ```

2. **Configurazione variabili d'ambiente**:
   ```bash
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=./production.db
   ```

3. **Avvio del server**:
   ```bash
   npm start
   ```

### Docker (Opzionale)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

Le contribuzioni sono benvenute! Per contribuire al progetto:

1. **Fork** il repository
2. **Crea** un branch per la tua feature (`git checkout -b feature/amazing-feature`)
3. **Commit** le tue modifiche (`git commit -m 'Add amazing feature'`)
4. **Push** al branch (`git push origin feature/amazing-feature`)
5. **Apri** una Pull Request

### Development Guidelines

- Utilizza **TypeScript** per tutti i nuovi file
- Segui le convenzioni di **ESLint** configurate
- Scrivi **test** per le nuove funzionalità
- Mantieni la **documentazione** aggiornata
- Usa **commit convenzionali** (feat:, fix:, docs:, etc.)

---

## 🆕 Novità v1.1 - Enhanced Features

### ✅ **IMPLEMENTATO - v1.1.0**

#### 📊 **Export Avanzato PDF/Excel**
- **Export PDF Professionale**: Report con branding InsuraTask, layout curato e statistiche integrate
- **Export Excel Formattato**: Fogli di calcolo con formattazione, filtri e grafici integrati
- **Filtri Avanzati**: Export personalizzabile per data, categoria, stato, priorità e cliente
- **Preview Real-time**: Anteprima dei dati prima della generazione del report
- **Download Automatico**: Generazione e download immediato dei file

#### 📅 **Calendario Avanzato (Enhanced Calendar)**
- **Vista Mensile Interattiva**: Navigazione fluida con indicatori visuali per ogni giorno
- **Popover Dettagliati**: Click sui giorni per vedere dettagli completi delle attività
- **Indicatori Categorizzati**: Punti colorati per tipo di attività (chiamate, preventivi, etc.)
- **Priority & Status Indicators**: Icone speciali per priorità alta e attività in ritardo
- **Integrazione Perfetta**: Sincronizzazione con task list e filtri data

#### ⚡ **Sistema Quick Actions Avanzato**
- **6 Azioni Rapide**: Bottoni categorizzati per creazione veloce attività
  - 🔵 **Nuova Chiamata** - Chiamate clienti
  - 🟢 **Preventivo** - Quotazioni e preventivi  
  - 🟣 **Appuntamento** - Meeting e appuntamenti
  - 🔴 **Sinistro** - Gestione sinistri
  - 🟠 **Cliente** - Nuovi clienti
  - 🟦 **Traccia Tempo** - Amministrazione
- **Keyboard Shortcuts**: Scorciatoie complete (Ctrl+N, Q, A, S, F, T)
- **Visual Feedback**: Animazioni hover e feedback visivo per azioni

#### 📈 **Analytics & Reporting Avanzato**
- **Dashboard Charts Interattivi**: Grafici settimanali, trend giornalieri, distribuzioni
- **Metriche Real-time**: Statistiche live su completamento, efficienza e performance
- **Clienti da Ricontattare**: Sistema intelligente per identificare follow-up necessari
- **Toggle Analytics**: Visualizzazione opzionale per interfaccia pulita

#### 📎 **Sistema File Attachments**
- **Upload Sicuro**: Gestione allegati per ogni attività
- **Preview Integrato**: Anteprima file supportati direttamente nell'interfaccia
- **Gestione Avanzata**: Organizzazione, download e rimozione allegati
- **Validazione File**: Controllo tipi e dimensioni file supportati

#### 🔄 **Infrastructure per Templates (Preparato)**
- **Sistema Template**: Base per attività ricorrenti (pronto per implementazione)
- **Cron Jobs Service**: Scheduler per automazione attività
- **Template Engine**: Placeholder dinamici e personalizzazione

### 🎨 **Miglioramenti UI/UX v1.1**
- **Glassmorphism Design**: Effetti moderni con backdrop-blur e gradienti
- **Responsive Perfetto**: Layout ottimizzato per mobile, tablet e desktop
- **Micro-interactions**: Animazioni fluide e feedback visivo professionale
- **Color-coded Categories**: Sistema di colori coerente per categorizzazione immediata

---

## 🔮 Roadmap Future

### v1.2 - Collaboration
- [ ] Multi-utente con permessi
- [ ] Condivisione attività tra colleghi
- [ ] Comments e note collaborativi
- [ ] Audit log delle modifiche

### v1.3 - Google Integration
- [ ] Integrazione Google Calendar completa
- [ ] Sincronizzazione bidirezionale eventi
- [ ] OAuth2 e gestione account Google
- [ ] Conflict resolution automatico

### v2.0 - Advanced Features
- [ ] Mobile app nativa
- [ ] Modalità offline
- [ ] Integrazione CRM esterni
- [ ] API pubblica per integrazioni
- [ ] Templates ricorrenti automatici

---

## 📄 License

Questo progetto è rilasciato sotto licenza **MIT**. Vedi il file [LICENSE](LICENSE) per maggiori dettagli.

---

## 📧 Contatti

**Federico Fusarri**
- 🌐 **LinkedIn**: [federico-fusarri](https://linkedin.com/in/federico-fusarri)
- 🐙 **GitHub**: [FDRFSR](https://github.com/FDRFSR)
- 📧 **Email**: [iscrizioni.fusarri at gmail.com](mailto:iscrizioni.fusarri at gmail.com)



<div align="center">

**Sviluppato con ❤️ per la community degli agenti assicurativi**

[⭐ Lascia una stella](https://github.com/FDRFSR/insurance-daily-tracker) • [🐛 Segnala un bug](https://github.com/FDRFSR/insurance-daily-tracker/issues) • [💡 Richiedi una feature](https://github.com/FDRFSR/insurance-daily-tracker/issues)

</div>