import {
  AppStatus,
  EdaAnalytics,
  ModelEvaluation,
  TreeStructureResponse,
  PredictionResult,
  CustomerInput,
  PortfolioResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let adminToken = '';
let activePredictor = '';
function scopedUrl(url: string) { return activePredictor ? `${url}${url.includes('?') ? '&' : '?'}predictor=${encodeURIComponent(activePredictor)}` : url; }
export function setAdminToken(token: string) { adminToken = token; }
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal,
      headers: { ...options.headers, ...(adminToken ? { 'X-Admin-Token': adminToken } : {}), ...(activePredictor ? {'X-Predictor':activePredictor} : {}) } });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const detail = body?.detail;
      const message = Array.isArray(detail) ? detail.map(item => `${item.loc?.slice(1).join(' > ') || 'Input'}: ${item.msg}`).join('; ')
        : typeof detail === 'string' ? detail : `Request failed (${response.status}). Please retry.`;
      throw new Error(message);
    }
    return response;
  } catch (failure) {
    if (failure instanceof DOMException && failure.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    if (failure instanceof TypeError) throw new Error('Unable to connect to the API. Check the server connection and retry.');
    throw failure;
  } finally { window.clearTimeout(timeout); }
}

export async function fetchAppStatus(): Promise<AppStatus> {
  const res = await apiFetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch application status');
  return res.json();
}

export async function fetchEdaAnalytics(): Promise<EdaAnalytics> {
  const res = await apiFetch(`${API_BASE}/analytics/eda`);
  if (!res.ok) throw new Error('Failed to fetch EDA analytics');
  return res.json();
}

export async function fetchModelEvaluation(): Promise<ModelEvaluation> {
  const res = await apiFetch(`${API_BASE}/model/evaluation`);
  if (!res.ok) throw new Error('Failed to fetch model evaluation');
  return res.json();
}

export async function fetchModelComparison(): Promise<{
  gini: ModelEvaluation;
  entropy: ModelEvaluation;
  comparison_notes: { academic_context: string };
}> {
  const res = await apiFetch(`${API_BASE}/model/comparison`);
  if (!res.ok) throw new Error('Failed to fetch criteria comparison');
  return res.json();
}

export async function trainModel(config: {
  criterion: string;
  max_depth?: number;
  min_samples_leaf: number;
  ccp_alpha: number;
}): Promise<{ message: string; evaluation: ModelEvaluation; status: any }> {
  const res = await apiFetch(`${API_BASE}/model/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Training failed' }));
    throw new Error(err.detail || 'Training failed');
  }
  return res.json();
}

export async function fetchTreeStructure(): Promise<TreeStructureResponse> {
  const res = await apiFetch(`${API_BASE}/tree/structure`);
  if (!res.ok) throw new Error('Failed to fetch decision tree structure');
  return res.json();
}

export async function predictSingleCustomer(customer: CustomerInput): Promise<PredictionResult> {
  const res = await apiFetch(`${API_BASE}/predict/single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function uploadAndPredictBatch(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiFetch(`${API_BASE}/predict/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload batch prediction failed' }));
    throw new Error(err.detail || 'Upload batch prediction failed');
  }
  return res.json();
}

export async function fetchPortfolioCustomers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  contract?: string;
  churnFilter?: string;
  sortBy?: string;
  sortDir?: string;
}): Promise<PortfolioResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('page_size', params.pageSize.toString());
  if (params.search) query.append('search', params.search);
  if (params.contract) query.append('contract', params.contract);
  if (params.churnFilter) query.append('churn_filter', params.churnFilter);
  if (params.sortBy) query.append('sort_by', params.sortBy);
  if (params.sortDir) query.append('sort_dir', params.sortDir);

  const res = await apiFetch(`${API_BASE}/portfolio/customers?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch customer portfolio');
  return res.json();
}

export function getExportUrl(contract?: string, churnFilter?: string, search?: string, sortBy?: string, sortDir?: string): string {
  const query = new URLSearchParams();
  if (contract) query.append('contract', contract);
  if (churnFilter) query.append('churn_filter', churnFilter);
  if (search) query.append('search', search);
  if (sortBy) query.append('sort_by', sortBy);
  if (sortDir) query.append('sort_dir', sortDir);
  return scopedUrl(`${API_BASE}/portfolio/export?${query.toString()}`);
}

export const getTemplateUrl = () => `${API_BASE}/predict/template`;

export async function selectPredictor(algorithm: string): Promise<{evaluation: ModelEvaluation; status: AppStatus['status']}> {
  const response = await apiFetch(`${API_BASE}/model/select`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({algorithm}),
  });
  const result = await response.json();
  activePredictor = result.evaluation.algorithm;
  return result;
}
