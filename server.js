import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json({ limit: '10mb' }));

// In-memory database for cross-device workout sync
const syncDatabase: Record<string, { updatedAt: string; logs: any[]; scheduleConfig?: any }> = {};

// API Endpoint: Upload / Save workout data for a sync code
app.post('/api/sync', (req, res) => {
  try {
    const { syncCode, logs, scheduleConfig } = req.body;
    const cleanCode = (syncCode || 'styrke55').trim().toLowerCase();

    syncDatabase[cleanCode] = {
      updatedAt: new Date().toISOString(),
      logs: logs || [],
      scheduleConfig,
    };

    console.log(`[SYNC SUCCESS] Saved ${logs?.length || 0} logs for code: ${cleanCode}`);
    return res.json({ success: true, code: cleanCode, updatedAt: syncDatabase[cleanCode].updatedAt });
  } catch (err) {
    console.error('[SYNC ERROR]', err);
    return res.status(500).json({ success: false, error: 'Kunne ikke lagre data.' });
  }
});

// API Endpoint: Fetch / Download workout data for a sync code
app.get('/api/sync/:code', (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toLowerCase();
    const data = syncDatabase[cleanCode];

    if (!data) {
      return res.status(404).json({ success: false, error: 'Fant ingen data for denne koden.' });
    }

    return res.json({ success: true, syncCode: cleanCode, ...data });
  } catch (err) {
    console.error('[SYNC FETCH ERROR]', err);
    return res.status(500).json({ success: false, error: 'Kunne ikke hente data.' });
  }
});

// Serve static compiled frontend files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: All unhandled GET requests return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Styrke & Løp app server running on port ${PORT}`);
});
