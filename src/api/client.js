import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://vithi-observability-dasboard.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Overview ────────────────────────────────────────────────────────────────
export const fetchOverviewKPIs = (params = {}) =>
  api.get('/api/overview/kpis', { params }).then((r) => r.data);

export const fetchOverviewCharts = (params = {}) =>
  api.get('/api/overview/charts', { params }).then((r) => r.data);

export const fetchOverviewHealth = (params = {}) =>
  api.get('/api/overview/health', { params }).then((r) => r.data);

export const fetchRecentIncidents = (params = {}) =>
  api.get('/api/overview/recent-incidents', { params }).then((r) => r.data);

export const fetchPipelineMonitoring = (params = {}) =>
  api.get('/api/overview/pipeline-monitoring', { params }).then((r) => r.data);

// ── Pipelines ────────────────────────────────────────────────────────────────
export const fetchPipelines = (params = {}) =>
  api.get('/api/pipelines', { params }).then((r) => r.data);

export const fetchPipelineRuns = (pid, params = {}) =>
  api.get(`/api/pipelines/${pid}/runs`, { params }).then((r) => r.data);

// ── Data Observability ───────────────────────────────────────────────────────
export const fetchFreshness = (params = {}) =>
  api.get('/api/observability/freshness', { params }).then((r) => r.data);

export const fetchVolume = (params = {}) =>
  api.get('/api/observability/volume', { params }).then((r) => r.data);

export const fetchSchema = (params = {}) =>
  api.get('/api/observability/schema', { params }).then((r) => r.data);

export const fetchDataQuality = (params = {}) =>
  api.get('/api/observability/data-quality', { params }).then((r) => r.data);

export const fetchMetrics = (params = {}) =>
  api.get('/api/observability/metrics', { params }).then((r) => r.data);

// ── Lineage ──────────────────────────────────────────────────────────────────
export const fetchLineage = (params = {}) =>
  api.get('/api/lineage', { params }).then((r) => r.data);

// ── Logs ─────────────────────────────────────────────────────────────────────
export const fetchLogs = (params = {}) =>
  api.get('/api/logs', { params }).then((r) => r.data);

export const fetchRunDetail = (runId) =>
  api.get(`/api/runs/${runId}`).then((r) => r.data);

// ── Convenience aliases ───────────────────────────────────────────────────────
// Used by ObsOverview and other pages
export const fetchHealth = fetchOverviewHealth;

export default api;
