import React, { useState } from 'react';
import { CustomerInput, PredictionResult } from '../types';
import { predictSingleCustomer } from '../services/api';
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  User,
  CreditCard,
  Wifi,
  Sliders,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

interface PredictionStudioProps {
  onInspectNodeInTree?: (nodeId: number) => void;
}

export const PredictionStudio: React.FC<PredictionStudioProps> = ({ onInspectNodeInTree }) => {
  const [formData, setFormData] = useState<CustomerInput>({
    Gender: 'Female',
    'Senior Citizen': 'No',
    Partner: 'No',
    Dependents: 'No',
    'Tenure Months': 4,
    Contract: 'Month-to-month',
    'Paperless Billing': 'Yes',
    'Phone Service': 'Yes',
    'Multiple Lines': 'No',
    'Internet Service': 'Fiber optic',
    'Online Security': 'No',
    'Online Backup': 'No',
    'Device Protection': 'No',
    'Tech Support': 'No',
    'Streaming TV': 'Yes',
    'Streaming Movies': 'No',
    'Payment Method': 'Electronic check',
    'Monthly Charges': 79.5,
    'Total Charges': 318.0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CustomerInput, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'Tenure Months' || field === 'Monthly Charges') {
        const tenure = field === 'Tenure Months' ? Number(value) : prev['Tenure Months'];
        const monthly = field === 'Monthly Charges' ? Number(value) : prev['Monthly Charges'];
        updated['Total Charges'] = Math.round(tenure * monthly * 100) / 100;
      }
      return updated;
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const prediction = await predictSingleCustomer(formData);
      setResult(prediction);
    } catch (err: any) {
      setError(err.message || 'Error executing customer prediction');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: 'at-risk' | 'loyal' | 'moderate') => {
    if (preset === 'at-risk') {
      setFormData({
        Gender: 'Female',
        'Senior Citizen': 'No',
        Partner: 'No',
        Dependents: 'No',
        'Tenure Months': 2,
        Contract: 'Month-to-month',
        'Paperless Billing': 'Yes',
        'Phone Service': 'Yes',
        'Multiple Lines': 'No',
        'Internet Service': 'Fiber optic',
        'Online Security': 'No',
        'Online Backup': 'No',
        'Device Protection': 'No',
        'Tech Support': 'No',
        'Streaming TV': 'Yes',
        'Streaming Movies': 'Yes',
        'Payment Method': 'Electronic check',
        'Monthly Charges': 89.5,
        'Total Charges': 179.0
      });
    } else if (preset === 'loyal') {
      setFormData({
        Gender: 'Male',
        'Senior Citizen': 'No',
        Partner: 'Yes',
        Dependents: 'Yes',
        'Tenure Months': 58,
        Contract: 'Two year',
        'Paperless Billing': 'No',
        'Phone Service': 'Yes',
        'Multiple Lines': 'Yes',
        'Internet Service': 'DSL',
        'Online Security': 'Yes',
        'Online Backup': 'Yes',
        'Device Protection': 'Yes',
        'Tech Support': 'Yes',
        'Streaming TV': 'No',
        'Streaming Movies': 'No',
        'Payment Method': 'Bank transfer (automatic)',
        'Monthly Charges': 64.2,
        'Total Charges': 3723.6
      });
    } else {
      setFormData({
        Gender: 'Male',
        'Senior Citizen': 'Yes',
        Partner: 'No',
        Dependents: 'No',
        'Tenure Months': 18,
        Contract: 'One year',
        'Paperless Billing': 'Yes',
        'Phone Service': 'Yes',
        'Multiple Lines': 'No',
        'Internet Service': 'Fiber optic',
        'Online Security': 'No',
        'Online Backup': 'Yes',
        'Device Protection': 'No',
        'Tech Support': 'No',
        'Streaming TV': 'Yes',
        'Streaming Movies': 'Yes',
        'Payment Method': 'Credit card (automatic)',
        'Monthly Charges': 75.0,
        'Total Charges': 1350.0
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Real-Time Underwriting
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Subscriber Risk Simulation &amp; Decision Path
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure subscriber inputs to trace their exact Boolean path through the CART decision tree.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Load Preset:</span>
          <button
            type="button"
            onClick={() => loadPreset('at-risk')}
            className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium transition-colors"
          >
            High Risk Case
          </button>
          <button
            type="button"
            onClick={() => loadPreset('moderate')}
            className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium transition-colors"
          >
            Moderate Case
          </button>
          <button
            type="button"
            onClick={() => loadPreset('loyal')}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 font-medium transition-colors"
          >
            Retained Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs */}
        <form onSubmit={handleAnalyze} className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer Profile */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                1. Customer Profile
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Gender</label>
                <select
                  value={formData.Gender}
                  onChange={e => handleInputChange('Gender', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Senior Citizen</label>
                <select
                  value={formData['Senior Citizen']}
                  onChange={e => handleInputChange('Senior Citizen', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Partner</label>
                <select
                  value={formData.Partner}
                  onChange={e => handleInputChange('Partner', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Dependents</label>
                <select
                  value={formData.Dependents}
                  onChange={e => handleInputChange('Dependents', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Account Information */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                2. Account Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  Tenure: <strong className="text-slate-900">{formData['Tenure Months']} Months</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="72"
                  value={formData['Tenure Months']}
                  onChange={e => handleInputChange('Tenure Months', parseInt(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">0 to 72 months</span>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Contract Term</label>
                <select
                  value={formData.Contract}
                  onChange={e => handleInputChange('Contract', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Paperless Billing</label>
                <select
                  value={formData['Paperless Billing']}
                  onChange={e => handleInputChange('Paperless Billing', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Service Subscriptions */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wifi className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                3. Service Subscriptions
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Phone Service</label>
                <select
                  value={formData['Phone Service']}
                  onChange={e => handleInputChange('Phone Service', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Multiple Lines</label>
                <select
                  value={formData['Multiple Lines']}
                  onChange={e => handleInputChange('Multiple Lines', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No phone service">No phone service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Internet Service</label>
                <select
                  value={formData['Internet Service']}
                  onChange={e => handleInputChange('Internet Service', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="DSL">DSL</option>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="No">No (None)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Online Security</label>
                <select
                  value={formData['Online Security']}
                  onChange={e => handleInputChange('Online Security', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Online Backup</label>
                <select
                  value={formData['Online Backup']}
                  onChange={e => handleInputChange('Online Backup', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Device Protection</label>
                <select
                  value={formData['Device Protection']}
                  onChange={e => handleInputChange('Device Protection', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Tech Support</label>
                <select
                  value={formData['Tech Support']}
                  onChange={e => handleInputChange('Tech Support', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Streaming TV</label>
                <select
                  value={formData['Streaming TV']}
                  onChange={e => handleInputChange('Streaming TV', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Streaming Movies</label>
                <select
                  value={formData['Streaming Movies']}
                  onChange={e => handleInputChange('Streaming Movies', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Billing and Payment */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                4. Billing and Payment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1.5">Payment Method</label>
                <select
                  value={formData['Payment Method']}
                  onChange={e => handleInputChange('Payment Method', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                >
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  Monthly Charges: <strong className="text-slate-900">${formData['Monthly Charges']}</strong>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="18"
                  max="130"
                  value={formData['Monthly Charges']}
                  onChange={e => handleInputChange('Monthly Charges', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1.5">
                  Total Charges: <strong className="text-slate-900">${formData['Total Charges']}</strong>
                </label>
                <input
                  type="number"
                  step="1.0"
                  min="0"
                  value={formData['Total Charges']}
                  onChange={e => handleInputChange('Total Charges', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:border-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Evaluating Decision Tree Path...
              </span>
            ) : (
              <>
                <span>ANALYZE SUBSCRIBER RISK</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>

        {/* Prediction Results & Transparent Decision Path */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <GitCommit className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Ready for Model Underwriting</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Configure subscriber attributes or load a preset case above, then click <strong>ANALYZE SUBSCRIBER RISK</strong> to trace the exact CART decision nodes.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-6 shadow-xs">
              {/* Verdict Header */}
              <div
                className={`p-5 rounded-xl border flex items-start justify-between ${
                  result.risk_color === 'red'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : result.risk_color === 'yellow'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase opacity-75">
                    Model Classification
                  </span>
                  <h3 className="text-2xl font-black tracking-tight mt-0.5">
                    {result.prediction}
                  </h3>
                  <p className="text-xs mt-1 font-medium">
                    Estimated Churn Probability: <strong>{(result.churn_probability * 100).toFixed(1)}%</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-md ${
                      result.risk_color === 'red'
                        ? 'bg-rose-600 text-white'
                        : result.risk_color === 'yellow'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {result.risk_level}
                  </span>
                  <div className="text-[10px] opacity-75 mt-1 font-mono">
                    Criterion: {result.model_criterion.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Key Drivers */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Key Identified Drivers
                </span>
                <div className="space-y-1.5">
                  {result.key_drivers && result.key_drivers.length > 0 ? (
                    result.key_drivers.map((driver, dIdx) => (
                      <div key={dIdx} className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-medium">
                        • {driver}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      Standard contractual profile matching baseline retention criteria.
                    </div>
                  )}
                </div>
              </div>

              {/* Exact Boolean Path Traversal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Node Traversal Trace
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Depth: {result.decision_path.length} Levels
                  </span>
                </div>

                <div className="space-y-2.5">
                  {result.decision_path.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg text-xs space-y-1 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">
                          Step {idx + 1}: Node #{step.node_id}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            step.is_leaf
                              ? 'bg-slate-900 text-white'
                              : step.satisfied
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {step.is_leaf ? 'Leaf Outcome' : step.satisfied ? 'Condition Met (<=)' : 'Condition False (>)'}
                        </span>
                      </div>

                      <div className="font-mono text-slate-800 font-medium">
                        {step.rule_condition}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
                        <span>Impurity: {step.impurity.toFixed(3)}</span>
                        <span>Node Samples: {step.samples.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
