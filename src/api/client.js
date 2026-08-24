import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://etl-pipeline-lemon.vercel.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper to normalize query params with preset='all' default
const withPreset = (params = {}) => ({ preset: 'all', ...params });

// ── Overview ────────────────────────────────────────────────────────────────
export const fetchOverviewKPIs = (params = {}) =>
  api.get('/api/v1/overview/kpis', { params: withPreset(params) }).then(r => r.data);

export const fetchOverviewCharts = (params = {}) =>
  api.get('/api/v1/overview/charts', { params: withPreset(params) }).then(r => r.data);

export const fetchOverviewHealth = (params = {}) =>
  api.get('/api/v1/overview/health', { params: withPreset(params) }).then(r => r.data);

export const fetchRecentIncidents = (params = {}) =>
  api.get('/api/v1/overview/recent-incidents', { params: withPreset(params) }).then(r => r.data);

export const fetchPipelineMonitoring = (params = {}) =>
  api.get('/api/v1/overview/pipelines', { params: withPreset(params) }).then(r => r.data);

// ── Pipelines ────────────────────────────────────────────────────────────────
export const fetchPipelines = (params = {}) =>
  api.get('/api/v1/pipelines', { params: withPreset(params) }).then(r => r.data);

export const fetchPipelineRuns = (pid, params = {}) =>
  api.get(`/api/v1/pipelines/${pid}/runs`, { params: withPreset(params) }).then(r => r.data);

// ── Data Observability ───────────────────────────────────────────────────────
export const fetchFreshness = (params = {}) =>
  api.get('/api/v1/observability/freshness', { params: withPreset(params) }).then(r => r.data);

export const fetchVolume = (params = {}) =>
  api.get('/api/v1/observability/volume', { params: withPreset(params) }).then(r => r.data);

export const fetchSchema = (params = {}) =>
  api.get('/api/v1/observability/schema', { params: withPreset(params) }).then(r => r.data);

export const fetchDataQuality = (params = {}) =>
  api.get('/api/v1/observability/quality', { params: withPreset(params) }).then(r => r.data);

export const fetchMetrics = (params = {}) =>
  api.get('/api/v1/metrics', { params: withPreset(params) }).then(r => r.data);

// ── Lineage ──────────────────────────────────────────────────────────────────
export const fetchLineage = (params = {}) =>
  api.get('/api/v1/lineage', { params: withPreset(params) }).then(r => r.data);

// ── Incidents ────────────────────────────────────────────────────────────────
export const fetchIncidents = (params = {}) =>
  api.get('/api/v1/incidents', { params: withPreset(params) }).then(r => r.data);

// ── Logs ─────────────────────────────────────────────────────────────────────
export const fetchLogs = (params = {}) =>
  api.get('/api/v1/logs', { params: withPreset(params) }).then(r => r.data);

export const fetchRunDetail = (runId) =>
  api.get(`/api/v1/runs/${runId}`).then(r => r.data);

// ── Alerts ───────────────────────────────────────────────────────────────────
export const fetchAlerts = (params = {}) =>
  api.get('/api/v1/alerts', { params: withPreset(params) }).then(r => r.data);

// ── Convenience aliases ───────────────────────────────────────────────────────
export const fetchHealth = fetchOverviewHealth;

export default api;
