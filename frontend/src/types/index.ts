export interface CustomerInput {
  Gender: string;
  "Senior Citizen": string;
  Partner: string;
  Dependents: string;
  "Tenure Months": number;
  Contract: string;
  "Paperless Billing": string;
  "Phone Service": string;
  "Multiple Lines": string;
  "Internet Service": string;
  "Online Security": string;
  "Online Backup": string;
  "Device Protection": string;
  "Tech Support": string;
  "Streaming TV": string;
  "Streaming Movies": string;
  "Payment Method": string;
  "Monthly Charges": number;
  "Total Charges"?: number;
}

export interface DecisionPathStep {
  node_id: number;
  feature?: string;
  feature_name_clean?: string;
  rule_condition: string;
  user_value?: any;
  satisfied: boolean;
  samples: number;
  impurity: number;
  churn_probability: number;
  is_leaf: boolean;
}

export interface PredictionResult {
  prediction: string;
  churn_label: number;
  churn_probability: number;
  risk_level: string;
  risk_color: string;
  decision_path: DecisionPathStep[];
  key_drivers: string[];
  model_criterion: string;
  model_max_depth: number;
  timestamp: string;
}

export interface MetricSet {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  samples: number;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
  total: number;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface FeatureImportanceItem {
  raw_feature: string;
  feature_name: string;
  importance: number;
  importance_pct: number;
}

export interface ModelEvaluation {
  config: {
    criterion: string;
    max_depth: number;
    min_samples_leaf: number;
    ccp_alpha: number;
  };
  train_metrics: MetricSet;
  test_metrics: MetricSet;
  confusion_matrix: ConfusionMatrix;
  classification_report: Record<string, any>;
  roc_curve: RocPoint[];
  feature_importances: FeatureImportanceItem[];
  tree_metadata: {
    total_nodes: number;
    leaf_nodes: number;
    max_depth: number;
    criterion: string;
  };
}

export interface TreeNode {
  id: number;
  depth: number;
  is_leaf: boolean;
  branch_rule: string;
  samples: number;
  samples_pct: number;
  retained_count: number;
  churn_count: number;
  churn_prob: number;
  predicted_class: string;
  impurity: number;
  impurity_type: string;
  name: string;
  rule?: string;
  feature_raw?: string;
  threshold?: number;
  split_condition?: string;
  left_rule?: string;
  right_rule?: string;
  children?: TreeNode[];
}

export interface TreeStructureResponse {
  root: TreeNode;
  metadata: {
    criterion: string;
    max_depth: number;
    total_nodes: number;
    leaf_nodes: number;
    total_samples: number;
  };
}

export interface EdaAnalytics {
  summary: {
    total_customers: number;
    churned_customers: number;
    retained_customers: number;
    churn_rate_pct: number;
  };
  contract_breakdown: Array<{
    contract: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  tenure_breakdown: Array<{
    tenure_group: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  internet_breakdown: Array<{
    internet_service: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  payment_breakdown: Array<{
    payment_method: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  monthly_charges_breakdown: Array<{
    charge_tier: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  tech_support_breakdown: Array<{
    support_status: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  senior_breakdown: Array<{
    senior_citizen: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
  partner_breakdown: Array<{
    partner: string;
    total: number;
    churned: number;
    churn_rate: number;
  }>;
}

export interface CustomerRecord {
  CustomerID: string;
  Gender: string;
  "Senior Citizen": string;
  Partner: string;
  Dependents: string;
  "Tenure Months": number;
  Contract: string;
  "Internet Service": string;
  "Monthly Charges": number;
  "Total Charges": number;
  "Payment Method": string;
  "Paperless Billing": string;
  "Tech Support": string;
  "Churn Label": string;
  City: string;
}

export interface PortfolioResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  customers: CustomerRecord[];
}

export interface AppStatus {
  brand: string;
  tagline: string;
  status: {
    dataset_loaded: boolean;
    total_records: number;
    model_trained: boolean;
    active_criterion: string;
    last_trained_at: string | null;
    accuracy: number | null;
  };
  config: {
    criterion: string;
    max_depth: number;
    min_samples_leaf: number;
    ccp_alpha: number;
  };
}
