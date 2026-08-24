import axios from 'axios';

export const getBaseUrl = () => {
  if (typeof window !== 'undefined' && localStorage.getItem('API_BASE_URL')) {
    return localStorage.getItem('API_BASE_URL');
  }
  return import.meta.env.VITE_API_BASE_URL || 'https://vithi-observability-dasboard.vercel.app';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

// Helper for resilient GET requests (tries path then fallback path if 404)
const safeGet = async (path, fallbackPath, params = {}) => {
  try {
    const res = await api.get(path, { params });
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 404 && fallbackPath) {
      const resFallback = await api.get(fallbackPath, { params });
      return resFallback.data;
    }
    throw err;
  }
};

// ── Overview ────────────────────────────────────────────────────────────────
export const fetchOverviewKPIs = (params = {}) =>
  safeGet('/api/overview/kpis', '/api/v1/overview/kpis', params);

export const fetchOverviewCharts = (params = {}) =>
  safeGet('/api/overview/charts', '/api/v1/overview/charts', params);

export const fetchOverviewHealth = (params = {}) =>
  safeGet('/api/overview/health', '/api/v1/overview/health', params);

export const fetchRecentIncidents = (params = {}) =>
  safeGet('/api/overview/recent-incidents', '/api/v1/overview/recent-incidents', params);

export const fetchPipelineMonitoring = (params = {}) =>
  safeGet('/api/overview/pipeline-monitoring', '/api/v1/overview/pipelines', params);

// ── Pipelines ────────────────────────────────────────────────────────────────
export const fetchPipelines = (params = {}) =>
  safeGet('/api/pipelines', '/api/v1/pipelines', params);

export const fetchPipelineRuns = (pid, params = {}) =>
  safeGet(`/api/pipelines/${pid}/runs`, `/api/v1/pipelines/${pid}/runs`, params);

// ── Data Observability ───────────────────────────────────────────────────────
export const fetchFreshness = (params = {}) =>
  safeGet('/api/observability/freshness', '/api/v1/observability/freshness', params);

export const fetchVolume = (params = {}) =>
  safeGet('/api/observability/volume', '/api/v1/observability/volume', params);

export const fetchSchema = (params = {}) =>
  safeGet('/api/observability/schema', '/api/v1/observability/schema', params);

export const fetchDataQuality = (params = {}) =>
  safeGet('/api/observability/data-quality', '/api/v1/observability/quality', params);

export const fetchMetrics = (params = {}) =>
  safeGet('/api/observability/metrics', '/api/v1/metrics', params);

// ── Lineage ──────────────────────────────────────────────────────────────────
export const fetchLineage = (params = {}) =>
  safeGet('/api/lineage', '/api/v1/lineage', params);

// ── Incidents ────────────────────────────────────────────────────────────────
export const fetchIncidents = (params = {}) =>
  safeGet('/api/incidents', '/api/v1/incidents', params);

// ── Logs ─────────────────────────────────────────────────────────────────────
export const fetchLogs = (params = {}) =>
  safeGet('/api/logs', '/api/v1/logs', params);

export const fetchRunDetail = (runId) =>
  safeGet(`/api/runs/${runId}`, `/api/v1/runs/${runId}`);

// ── Alerts ───────────────────────────────────────────────────────────────────
export const fetchAlerts = (params = {}) =>
  safeGet('/api/alerts', '/api/v1/alerts', params).catch(() => ({ items: [] }));

// ── Convenience aliases ───────────────────────────────────────────────────────
export const fetchHealth = fetchOverviewHealth;

export default api;
