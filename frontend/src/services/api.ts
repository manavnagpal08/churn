import {
  AppStatus,
  EdaAnalytics,
  ModelEvaluation,
  TreeStructureResponse,
  PredictionResult,
  CustomerInput,
  PortfolioResponse
} from '../types';

const API_BASE = '/api';

export async function fetchAppStatus(): Promise<AppStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch application status');
  return res.json();
}

export async function fetchEdaAnalytics(): Promise<EdaAnalytics> {
  const res = await fetch(`${API_BASE}/analytics/eda`);
  if (!res.ok) throw new Error('Failed to fetch EDA analytics');
  return res.json();
}

export async function fetchModelEvaluation(): Promise<ModelEvaluation> {
  const res = await fetch(`${API_BASE}/model/evaluation`);
  if (!res.ok) throw new Error('Failed to fetch model evaluation');
  return res.json();
}

export async function fetchModelComparison(): Promise<{
  gini: ModelEvaluation;
  entropy: ModelEvaluation;
  comparison_notes: { academic_context: string };
}> {
  const res = await fetch(`${API_BASE}/model/comparison`);
  if (!res.ok) throw new Error('Failed to fetch criteria comparison');
  return res.json();
}

export async function trainModel(config: {
  criterion: string;
  max_depth?: number;
  min_samples_leaf: number;
  ccp_alpha: number;
}): Promise<{ message: string; evaluation: ModelEvaluation; status: any }> {
  const res = await fetch(`${API_BASE}/model/train`, {
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
  const res = await fetch(`${API_BASE}/tree/structure`);
  if (!res.ok) throw new Error('Failed to fetch decision tree structure');
  return res.json();
}

export async function predictSingleCustomer(customer: CustomerInput): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict/single`, {
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

  const res = await fetch(`${API_BASE}/predict/upload`, {
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

  const res = await fetch(`${API_BASE}/portfolio/customers?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch customer portfolio');
  return res.json();
}

export function getExportUrl(contract?: string, churnFilter?: string): string {
  const query = new URLSearchParams();
  if (contract) query.append('contract', contract);
  if (churnFilter) query.append('churn_filter', churnFilter);
  return `${API_BASE}/portfolio/export?${query.toString()}`;
}
