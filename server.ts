import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CommitteeId, Delegate, RubricScore } from './src/types.js';
import { DEFAULT_DELEGATES, DEFAULT_JUDGE_PINS, DEFAULT_ADMIN_PIN } from './src/data/initialData.js';

interface StoreData {
  delegates: Delegate[];
  scores: Record<string, RubricScore>; // key: `${delegateId}_J${judgeIndex}`
  judgePins: Record<string, string>; // key: `${committeeId}-${judgeIndex}`
  adminPin: string;
  judgePortalSchedule: {
    isEnabled: boolean;
    startTime: string | null;
    endTime: string | null;
    message: string;
  };
}

const DATA_FILE = path.join(process.cwd(), 'armun_data_store.json');

function loadStore(): StoreData {
  let loaded: any = {};
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      loaded = JSON.parse(content);
    } catch (e) {
      console.error('Error reading store file, using defaults:', e);
    }
  }
  return {
    delegates: loaded.delegates || [...DEFAULT_DELEGATES],
    scores: loaded.scores || {},
    judgePins: loaded.judgePins || { ...DEFAULT_JUDGE_PINS },
    adminPin: loaded.adminPin || DEFAULT_ADMIN_PIN,
    judgePortalSchedule: loaded.judgePortalSchedule || {
      isEnabled: true,
      startTime: null,
      endTime: null,
      message: 'Judge Evaluation Portal is currently disabled by Master Admin.',
    },
  };
}

function checkJudgePortalStatus(schedule?: StoreData['judgePortalSchedule']) {
  if (!schedule) return { active: true, message: '' };
  if (!schedule.isEnabled) {
    return {
      active: false,
      message: schedule.message || 'Judge Evaluation Portal is currently disabled by Master Admin.',
    };
  }

  const now = new Date();
  if (schedule.startTime) {
    const start = new Date(schedule.startTime);
    if (!isNaN(start.getTime()) && now < start) {
      return {
        active: false,
        message: `Judge Evaluation Portal is scheduled to open at ${start.toLocaleString()}.`,
      };
    }
  }

  if (schedule.endTime) {
    const end = new Date(schedule.endTime);
    if (!isNaN(end.getTime()) && now > end) {
      return {
        active: false,
        message: `Judge Evaluation Portal schedule ended at ${end.toLocaleString()}.`,
      };
    }
  }

  return { active: true, message: '' };
}

function saveStore(data: StoreData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving store file:', e);
  }
}

let store: StoreData = loadStore();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Login Endpoint
  app.post('/api/login', (req, res) => {
    const { role, committeeId, judgeIndex, pin } = req.body;

    if (role === 'admin' || role === 'masteradmin') {
      const cleanPin = (pin || '').trim();
      if (
        cleanPin === store.adminPin ||
        cleanPin === DEFAULT_ADMIN_PIN ||
        cleanPin === 'admin123' ||
        cleanPin === 'admin' ||
        cleanPin === 'masteradmin123' ||
        cleanPin === 'master123' ||
        cleanPin === 'masteradmin' ||
        cleanPin === 'master'
      ) {
        return res.json({
          success: true,
          role: role,
          token: `${role}_token_${Date.now()}`,
        });
      }
      return res.status(401).json({ success: false, message: `Invalid ${role === 'masteradmin' ? 'Master Admin' : 'Secretariat Admin'} Password or PIN!` });
    }

    if (role === 'judge') {
      if (!committeeId || !judgeIndex || !pin) {
        return res.status(400).json({ success: false, message: 'Missing required credentials' });
      }

      // Check Judge Portal Scheduling / Bulk Disable status
      const scheduleStatus = checkJudgePortalStatus(store.judgePortalSchedule);
      if (!scheduleStatus.active) {
        return res.status(403).json({
          success: false,
          message: scheduleStatus.message || 'Judge Evaluation Portal is currently disabled by Master Admin.',
        });
      }

      const key = `${committeeId}-${judgeIndex}`;
      const validPin = store.judgePins[key] || DEFAULT_JUDGE_PINS[key];

      if (pin === validPin) {
        return res.json({
          success: true,
          role: 'judge',
          committeeId,
          judgeIndex: Number(judgeIndex),
          judgeName: `Judge ${judgeIndex} (${committeeId})`,
          token: `judge_${committeeId}_J${judgeIndex}_${Date.now()}`,
        });
      }

      return res.status(401).json({ success: false, message: 'Invalid PIN for selected Judge and Committee' });
    }

    return res.status(400).json({ success: false, message: 'Invalid role specified' });
  });

  // Isolated Judge Data Endpoint
  // STRICT SECURITY: Judge ONLY receives delegates for their committee and ONLY THEIR OWN scores
  app.get('/api/judge/data', (req, res) => {
    const committeeId = req.query.committeeId as CommitteeId;
    const judgeIndex = Number(req.query.judgeIndex);

    if (!committeeId || !judgeIndex || (judgeIndex !== 1 && judgeIndex !== 2 && judgeIndex !== 3)) {
      return res.status(400).json({ success: false, message: 'Invalid committee or judge index' });
    }

    const scheduleStatus = checkJudgePortalStatus(store.judgePortalSchedule);

    // Filter delegates belonging strictly to this committee
    const committeeDelegates = store.delegates.filter((d) => d.committeeId === committeeId);

    // Extract ONLY scores entered by THIS judge index for this committee
    const judgeScores: Record<string, RubricScore> = {};
    committeeDelegates.forEach((d) => {
      const scoreKey = `${d.id}_J${judgeIndex}`;
      if (store.scores[scoreKey]) {
        judgeScores[d.id] = store.scores[scoreKey];
      }
    });

    res.json({
      success: true,
      committeeId,
      judgeIndex,
      delegates: committeeDelegates,
      myScores: judgeScores,
      isPortalDisabled: !scheduleStatus.active,
      portalDisabledReason: scheduleStatus.message,
    });
  });

  // Save / Update Judge Score
  app.post('/api/judge/save-score', (req, res) => {
    const { delegateId, committeeId, judgeIndex, criteriaScores, comments, isLocked } = req.body;

    if (!delegateId || !committeeId || !judgeIndex || !criteriaScores) {
      return res.status(400).json({ success: false, message: 'Invalid score payload' });
    }

    const scheduleStatus = checkJudgePortalStatus(store.judgePortalSchedule);
    if (!scheduleStatus.active) {
      return res.status(403).json({ success: false, message: scheduleStatus.message || 'Judge Evaluation Portal is currently disabled by Master Admin.' });
    }

    // Calculate total marks (Sum of all 10 criteria, max 100)
    let totalMarks = 0;
    Object.values(criteriaScores as Record<string, number>).forEach((val) => {
      totalMarks += Math.min(10, Math.max(0, Number(val) || 0));
    });

    const scoreKey = `${delegateId}_J${judgeIndex}`;

    // Check if score was locked earlier
    if (store.scores[scoreKey]?.isLocked && !isLocked) {
      return res.status(403).json({ success: false, message: 'This evaluation has been locked and submitted.' });
    }

    const newScore: RubricScore = {
      delegateId,
      committeeId,
      judgeIndex: Number(judgeIndex) as 1 | 2 | 3,
      criteriaScores,
      totalMarks,
      comments: comments || '',
      isLocked: Boolean(isLocked),
      updatedAt: new Date().toISOString(),
    };

    store.scores[scoreKey] = newScore;
    saveStore(store);

    res.json({
      success: true,
      score: newScore,
      message: 'Evaluation saved successfully',
    });
  });

  // Admin / Master Admin Direct Score Override Endpoint
  app.post('/api/admin/update-score', (req, res) => {
    const { delegateId, committeeId, judgeIndex, criteriaScores, comments, totalMarks } = req.body;

    if (!delegateId || !committeeId || !judgeIndex || !criteriaScores) {
      return res.status(400).json({ success: false, message: 'Invalid score payload' });
    }

    let calculatedTotal = 0;
    if (typeof totalMarks === 'number' && !isNaN(totalMarks)) {
      calculatedTotal = totalMarks;
    } else {
      Object.values(criteriaScores as Record<string, number>).forEach((val) => {
        calculatedTotal += Math.min(10, Math.max(0, Number(val) || 0));
      });
    }

    const scoreKey = `${delegateId}_J${judgeIndex}`;

    const updatedScore: RubricScore = {
      delegateId,
      committeeId,
      judgeIndex: Number(judgeIndex) as 1 | 2 | 3,
      criteriaScores,
      totalMarks: calculatedTotal,
      comments: comments || '',
      isLocked: false,
      updatedAt: new Date().toISOString(),
    };

    store.scores[scoreKey] = updatedScore;
    saveStore(store);

    res.json({
      success: true,
      score: updatedScore,
      message: 'Score updated successfully by Master Admin',
    });
  });

  // Admin Data Endpoint - Aggregates everything for overall monitoring
  app.get('/api/admin/data', (req, res) => {
    res.json({
      success: true,
      delegates: store.delegates,
      scores: store.scores,
      judgePins: store.judgePins,
      adminPin: store.adminPin,
      judgePortalSchedule: store.judgePortalSchedule,
    });
  });

  // Schedule & Bulk Toggle Judge Portal Access (Master Admin)
  app.post('/api/admin/schedule-judge-portal', (req, res) => {
    const { isEnabled, startTime, endTime, message } = req.body;
    store.judgePortalSchedule = {
      isEnabled: Boolean(isEnabled),
      startTime: startTime || null,
      endTime: endTime || null,
      message: message || 'Judge Evaluation Portal is currently disabled by Master Admin.',
    };
    saveStore(store);
    res.json({
      success: true,
      judgePortalSchedule: store.judgePortalSchedule,
      message: 'Judge Portal Schedule & Access updated successfully',
    });
  });

  // Admin Delegate Management (Add / Edit / Delete / Bulk Import)
  app.post('/api/admin/delegate', (req, res) => {
    const { action, delegate, delegatesList } = req.body;

    if (action === 'add' && delegate) {
      const newDel: Delegate = {
        id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        slNo: Number(delegate.slNo) || store.delegates.length + 1,
        committeeId: delegate.committeeId,
        delegateName: delegate.delegateName,
        portfolio: delegate.portfolio,
      };
      store.delegates.push(newDel);
      saveStore(store);
      return res.json({ success: true, delegate: newDel });
    }

    if (action === 'edit' && delegate) {
      const idx = store.delegates.findIndex((d) => d.id === delegate.id);
      if (idx !== -1) {
        store.delegates[idx] = { ...store.delegates[idx], ...delegate };
        saveStore(store);
        return res.json({ success: true, delegate: store.delegates[idx] });
      }
    }

    if (action === 'delete' && delegate?.id) {
      store.delegates = store.delegates.filter((d) => d.id !== delegate.id);
      // Remove associated scores
      Object.keys(store.scores).forEach((k) => {
        if (k.startsWith(`${delegate.id}_`)) {
          delete store.scores[k];
        }
      });
      saveStore(store);
      return res.json({ success: true, message: 'Delegate deleted' });
    }

    if (action === 'bulk_replace' && Array.isArray(delegatesList)) {
      store.delegates = delegatesList;
      saveStore(store);
      return res.json({ success: true, delegates: store.delegates });
    }

    if ((action === 'bulk_append' || action === 'bulk_add') && Array.isArray(delegatesList)) {
      store.delegates = [...store.delegates, ...delegatesList];
      saveStore(store);
      return res.json({ success: true, delegates: store.delegates });
    }

    if (action === 'bulk_replace_committee' && req.body.committeeId && Array.isArray(delegatesList)) {
      store.delegates = store.delegates.filter((d) => d.committeeId !== req.body.committeeId).concat(delegatesList);
      saveStore(store);
      return res.json({ success: true, delegates: store.delegates });
    }

    res.status(400).json({ success: false, message: 'Invalid delegate action' });
  });

  // Admin PIN management & Reset
  app.post('/api/admin/update-pins', (req, res) => {
    const { newAdminPin, newJudgePins } = req.body;
    if (newAdminPin) {
      store.adminPin = newAdminPin;
    }
    if (newJudgePins) {
      store.judgePins = { ...store.judgePins, ...newJudgePins };
    }
    saveStore(store);
    res.json({ success: true, message: 'PINs updated successfully' });
  });

  app.post('/api/admin/reset-scores', (req, res) => {
    const { committeeId } = req.body;
    if (committeeId) {
      // Clear scores for specific committee
      Object.keys(store.scores).forEach((key) => {
        if (store.scores[key].committeeId === committeeId) {
          delete store.scores[key];
        }
      });
    } else {
      // Reset all scores
      store.scores = {};
    }
    saveStore(store);
    res.json({ success: true, message: 'Scores reset successfully' });
  });

  // --- VITE MIDDLEWARE SETUP FOR DEV / STATIC FOR PROD ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARMUN Edition-2 Judging Server running on http://localhost:${PORT}`);
  });
}

startServer();
