/**
 * MoneyNest — js/sync.js
 * Offline-first cloud sync via Supabase (table: cloud_data).
 * Silent — never blocks UI. All errors are console.warn only.
 */
;(function () {
  'use strict';

  const SUPABASE_URL      = 'https://jwddciqqhmfkbqhdrfre.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZGRjaXFxaG1ma2JxaGRyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjkyMjcsImV4cCI6MjA5NDM0NTIyN30.Gqz39AWpW1BkWXhfhnR_vOUYUy93bgdSNvBfXYQ3VGk';
  const PENDING_KEY = 'mn_pending_sync';

  // Reuse the Supabase client from supabase-auth.js when available, else create minimal one
  function _getClient() {
    try {
      if (window._mnSyncClient) return window._mnSyncClient;
      window._mnSyncClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return window._mnSyncClient;
    } catch(e) {
      console.warn('[MNSync] Supabase client unavailable:', e);
      return null;
    }
  }

  async function _getSession() {
    try {
      if (window.MNSupabaseAuth) return await window.MNSupabaseAuth.getSession();
      const client = _getClient();
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data?.session || null;
    } catch(e) {
      return null;
    }
  }

  // ─── Pending queue ────────────────────────────────────────────────
  function getPendingQueue() {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
  }

  function addToPendingQueue(data) {
    try {
      const q = getPendingQueue();
      q.push({ data, ts: Date.now() });
      // Keep last 20 entries max to avoid unbounded growth
      if (q.length > 20) q.splice(0, q.length - 20);
      localStorage.setItem(PENDING_KEY, JSON.stringify(q));
    } catch(e) {
      console.warn('[MNSync] addToPendingQueue error:', e);
    }
  }

  function clearPendingQueue() {
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  }

  // ─── Core sync ────────────────────────────────────────────────────
  async function syncToCloud(data) {
    try {
      const session = await _getSession();
      if (!session) { addToPendingQueue(data); return; }

      const client = _getClient();
      if (!client) { addToPendingQueue(data); return; }

      showSyncIndicator('syncing');

      const { error } = await client
        .from('cloud_data')
        .upsert(
          { user_id: session.user.id, data_json: data, synced_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      showSyncIndicator('synced');
      window.dispatchEvent(new Event('mn:synced'));
    } catch(e) {
      console.warn('[MNSync] syncToCloud failed:', e);
      addToPendingQueue(data);
      showSyncIndicator('error');
    }
  }

  async function triggerSync(data) {
    if (!navigator.onLine) { addToPendingQueue(data); showSyncIndicator('offline'); return; }
    const session = await _getSession();
    if (!session) return; // local-only user, no error
    await syncToCloud(data);
  }

  async function fetchFromCloud() {
    try {
      const session = await _getSession();
      if (!session) return null;

      const client = _getClient();
      if (!client) return null;

      const { data, error } = await client
        .from('cloud_data')
        .select('data_json, synced_at')
        .eq('user_id', session.user.id)
        .order('synced_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      // Only suggest cloud data if it's newer than local
      const localStr = localStorage.getItem('mn_data');
      if (!localStr) return data.data_json;

      const localObj = JSON.parse(localStr);
      const localTs = localObj._updatedAt || 0;
      const cloudTs = new Date(data.synced_at).getTime();
      return cloudTs > localTs ? data.data_json : null;
    } catch(e) {
      console.warn('[MNSync] fetchFromCloud failed:', e);
      return null;
    }
  }

  async function processPendingQueue() {
    const queue = getPendingQueue();
    if (!queue.length) return;

    const session = await _getSession();
    if (!session) return;

    // Only send the latest entry — older ones are superseded
    const latest = queue[queue.length - 1];
    try {
      await syncToCloud(latest.data);
      clearPendingQueue();
    } catch {
      // keep queue, retry next time
    }
  }

  // ─── Auto backup every 5 minutes ─────────────────────────────────
  function autoBackup() {
    setInterval(async () => {
      const session = await _getSession();
      if (!session) return;
      const raw = localStorage.getItem('mn_data');
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        await triggerSync(data);
      } catch(e) {
        console.warn('[MNSync] autoBackup parse error:', e);
      }
    }, 5 * 60 * 1000);
  }

  // ─── Sync status indicator ────────────────────────────────────────
  function showSyncIndicator(state) {
    const el = document.getElementById('mn-sync-status');
    if (!el) return;
    const map = {
      syncing: { text: '⟳ Sincronizando…', cls: 'syncing' },
      synced:  { text: '✓ Sincronizado',   cls: 'synced'  },
      offline: { text: '⊘ Sin conexión',   cls: 'offline' },
      error:   { text: '⚠ Error sync',     cls: 'error'   },
    };
    const cfg = map[state] || map.synced;
    el.textContent = cfg.text;
    el.className   = `mn-sync-status mn-sync-${cfg.cls}`;
    if (state === 'synced') setTimeout(() => { if (el) el.textContent = ''; }, 3000);
  }

  // ─── Listeners ───────────────────────────────────────────────────
  window.addEventListener('online',  () => processPendingQueue());
  window.addEventListener('mn:data:saved', e => { if (e.detail) triggerSync(e.detail); });

  // ─── Public API ──────────────────────────────────────────────────
  window.MNSync = { triggerSync, fetchFromCloud, processPendingQueue, autoBackup, syncToCloud };

  autoBackup();
})();
