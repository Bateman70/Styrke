import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Data persistence file path
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'sync_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// In-memory database with disk backing
let syncDatabase = {};

// Load existing database from disk on startup
if (fs.existsSync(DATA_FILE)) {
  try {
    const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
    syncDatabase = JSON.parse(fileData);
    console.log(`[DATABASE LOADED] Loaded ${Object.keys(syncDatabase).length} sync codes from disk.`);
  } catch (err) {
    console.error('Error reading sync_db.json file:', err);
    syncDatabase = {};
  }
}

function saveDatabaseToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(syncDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sync_db.json to disk:', err);
  }
}

// Enable CORS and JSON body parsing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '20mb' }));

// API Endpoint: Upload / Save workout data for a sync code
app.post('/api/sync', (req, res) => {
  try {
    const { syncCode, logs, scheduleConfig, userProfile } = req.body;
    const cleanCode = (syncCode || 'styrke55').trim().toLowerCase();

    syncDatabase[cleanCode] = {
      updatedAt: new Date().toISOString(),
      logs: Array.isArray(logs) ? logs : [],
      scheduleConfig,
      userProfile,
    };

    saveDatabaseToDisk();

    console.log(`[SYNC SUCCESS] Saved ${syncDatabase[cleanCode].logs.length} logs for code: ${cleanCode}`);
    return res.json({
      success: true,
      code: cleanCode,
      updatedAt: syncDatabase[cleanCode].updatedAt,
      message: `Suksess! Lagret ${syncDatabase[cleanCode].logs.length} økter i skyen for koden "${cleanCode}".`,
    });
  } catch (err) {
    console.error('[SYNC ERROR]', err);
    return res.status(500).json({ success: false, error: 'Kunne ikke lagre data på tjeneren.' });
  }
});

// API Endpoint: Fetch / Download workout data for a sync code
app.get('/api/sync/:code', (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toLowerCase();
    const data = syncDatabase[cleanCode];

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Fant ingen lagret data i skyen for koden "${cleanCode}". Trykk "1. Last opp til skyen" først!`,
      });
    }

    return res.json({
      success: true,
      syncCode: cleanCode,
      updatedAt: data.updatedAt,
      logs: data.logs || [],
      scheduleConfig: data.scheduleConfig,
      userProfile: data.userProfile,
    });
  } catch (err) {
    console.error('[SYNC FETCH ERROR]', err);
    return res.status(500).json({ success: false, error: 'Kunne ikke hente data fra tjeneren.' });
  }
});

// Serve static compiled frontend files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: All unhandled GET requests return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MyStrength app server running on port ${PORT}`);
});
