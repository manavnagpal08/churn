import React, { useState } from 'react';
import { CustomerInput, PredictionResult } from '../types';
import { predictSingleCustomer } from '../services/api';
import {
  Sparkles,
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
  HelpCircle
} from 'lucide-react';

interface PredictionStudioProps {
  onInspectNodeInTree?: (nodeId: number) => void;
}

export const PredictionStudio: React.FC<PredictionStudioProps> = ({ onInspectNodeInTree }) => {
  // Default values set to an illustrative moderate-risk telecom subscriber
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
      // Auto-update Total Charges estimate if monthly or tenure changed
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

  // Quick Preset Profiles for testing
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-appBorder pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-accentYellow bg-nearBlack px-2 py-0.5 rounded">
            Interactive Prediction Studio
          </span>
          <h1 className="text-3xl font-extrabold text-nearBlack tracking-tight mt-2">
            Simulate Subscriber Scenarios
          </h1>
          <p className="text-sm text-mutedText mt-1">
            Input verified customer parameters to trace their exact evaluation through the fitted Decision Tree.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-mutedText mr-1">Load Preset:</span>
          <button
            type="button"
            onClick={() => loadPreset('at-risk')}
            className="text-xs px-2.5 py-1.5 rounded border border-accentRed/40 bg-accentRed/5 text-accentRed hover:bg-accentRed/10 font-mono font-medium transition-colors"
          >
            High Risk Archetype
          </button>
          <button
            type="button"
            onClick={() => loadPreset('moderate')}
            className="text-xs px-2.5 py-1.5 rounded border border-accentYellow/50 bg-accentYellow/10 text-nearBlack hover:bg-accentYellow/20 font-mono font-medium transition-colors"
          >
            Moderate Case
          </button>
          <button
            type="button"
            onClick={() => loadPreset('loyal')}
            className="text-xs px-2.5 py-1.5 rounded border border-appBorder bg-warmWhite text-nearBlack hover:bg-softIvory font-mono font-medium transition-colors"
          >
            Retained Cohort
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Customer Input Experience */}
        <form onSubmit={handleAnalyze} className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer Profile */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <User className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                1. Customer Profile
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-mutedText font-medium mb-1.5">Gender</label>
                <select
                  value={formData.Gender}
                  onChange={e => handleInputChange('Gender', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Senior Citizen</label>
                <select
                  value={formData['Senior Citizen']}
                  onChange={e => handleInputChange('Senior Citizen', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Partner</label>
                <select
                  value={formData.Partner}
                  onChange={e => handleInputChange('Partner', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Dependents</label>
                <select
                  value={formData.Dependents}
                  onChange={e => handleInputChange('Dependents', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Account Information */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <Sliders className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                2. Account Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-mutedText font-medium mb-1.5">
                  Tenure: <span className="font-mono font-bold text-nearBlack">{formData['Tenure Months']} Months</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="72"
                  value={formData['Tenure Months']}
                  onChange={e => handleInputChange('Tenure Months', parseInt(e.target.value) || 0)}
                  className="w-full accent-nearBlack cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-mutedText mt-1">
                  <span>0 mo</span>
                  <span>36 mo</span>
                  <span>72 mo</span>
                </div>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Contract Agreement</label>
                <select
                  value={formData.Contract}
                  onChange={e => handleInputChange('Contract', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack font-semibold focus:border-nearBlack outline-none"
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Paperless Billing</label>
                <select
                  value={formData['Paperless Billing']}
                  onChange={e => handleInputChange('Paperless Billing', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Service Subscriptions */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <Wifi className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                3. Service Subscriptions
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-mutedText font-medium mb-1.5">Phone Service</label>
                <select
                  value={formData['Phone Service']}
                  onChange={e => handleInputChange('Phone Service', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Multiple Lines</label>
                <select
                  value={formData['Multiple Lines']}
                  onChange={e => handleInputChange('Multiple Lines', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No phone service">No phone service</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Internet Service</label>
                <select
                  value={formData['Internet Service']}
                  onChange={e => handleInputChange('Internet Service', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack font-semibold focus:border-nearBlack outline-none"
                >
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="DSL">DSL</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Online Security</label>
                <select
                  value={formData['Online Security']}
                  onChange={e => handleInputChange('Online Security', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Online Backup</label>
                <select
                  value={formData['Online Backup']}
                  onChange={e => handleInputChange('Online Backup', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Device Protection</label>
                <select
                  value={formData['Device Protection']}
                  onChange={e => handleInputChange('Device Protection', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Tech Support</label>
                <select
                  value={formData['Tech Support']}
                  onChange={e => handleInputChange('Tech Support', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Streaming TV</label>
                <select
                  value={formData['Streaming TV']}
                  onChange={e => handleInputChange('Streaming TV', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Streaming Movies</label>
                <select
                  value={formData['Streaming Movies']}
                  onChange={e => handleInputChange('Streaming Movies', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Billing and Payment */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <CreditCard className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                4. Billing and Payment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-mutedText font-medium mb-1.5">Payment Method</label>
                <select
                  value={formData['Payment Method']}
                  onChange={e => handleInputChange('Payment Method', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack focus:border-nearBlack outline-none font-medium"
                >
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Monthly Charges ($)</label>
                <input
                  type="number"
                  step="0.05"
                  min="18.25"
                  max="118.75"
                  value={formData['Monthly Charges']}
                  onChange={e => handleInputChange('Monthly Charges', parseFloat(e.target.value) || 0)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack font-mono focus:border-nearBlack outline-none"
                />
              </div>

              <div>
                <label className="block text-mutedText font-medium mb-1.5">Total Charges ($)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData['Total Charges'] ?? 0}
                  onChange={e => handleInputChange('Total Charges', parseFloat(e.target.value) || 0)}
                  className="w-full bg-softIvory border border-appBorder rounded px-3 py-2 text-nearBlack font-mono focus:border-nearBlack outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accentYellow hover:bg-yellow-400 text-nearBlack font-extrabold text-sm uppercase tracking-wider rounded-md shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-nearBlack border-t-transparent rounded-full animate-spin"></span>
                Evaluating Decision Tree Path...
              </span>
            ) : (
              <>
                <span>ANALYZE CUSTOMER</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Prediction Results & Transparent Decision Path */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="p-4 bg-accentRed/10 border border-accentRed/30 rounded-lg text-accentRed text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-softIvory border border-dashed border-appBorder rounded-lg p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-warmWhite border border-appBorder flex items-center justify-center mx-auto text-mutedText">
                <GitCommit className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-nearBlack">Ready for Induction Trace</h4>
              <p className="text-xs text-mutedText max-w-xs mx-auto">
                Select customer attributes or choose a preset archetype above, then click <strong>ANALYZE CUSTOMER</strong> to trace the exact CART decision path.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-6 shadow-sm">
              {/* Verdict Header */}
              <div
                className={`p-5 rounded-lg border flex items-start justify-between ${
                  result.risk_color === 'red'
                    ? 'bg-accentRed/10 border-accentRed/30'
                    : result.risk_color === 'yellow'
                    ? 'bg-accentYellow/20 border-accentYellow/50'
                    : 'bg-emerald-50 border-emerald-300'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-mutedText">
                    Model Classification
                  </span>
                  <h3
                    className={`text-2xl font-black tracking-tight ${
                      result.risk_color === 'red'
                        ? 'text-accentRed'
                        : result.risk_color === 'yellow'
                        ? 'text-yellow-800'
                        : 'text-emerald-800'
                    }`}
                  >
                    {result.prediction}
                  </h3>
                  <p className="text-xs text-nearBlack mt-1 font-medium">
                    Estimated Churn Probability: <strong>{(result.churn_probability * 100).toFixed(1)}%</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-mono font-bold uppercase rounded ${
                      result.risk_color === 'red'
                        ? 'bg-accentRed text-warmWhite'
                        : result.risk_color === 'yellow'
                        ? 'bg-accentYellow text-nearBlack'
                        : 'bg-emerald-700 text-warmWhite'
                    }`}
                  >
                    {result.risk_level}
                  </span>
                  <div className="text-[10px] font-mono text-mutedText mt-1">
                    Tree Criterion: {result.model_criterion.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Product Risk Tier Note */}
              <div className="bg-softIvory border border-appBorder rounded p-3 text-[11px] text-mutedText leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-accentYellow shrink-0 mt-0.5" />
                <span>
                  <strong>Product Risk Band:</strong> High (&ge;60%), Moderate (30%-60%), Low (&lt;30%). These are operational thresholds, not guarantees of individual subscriber intent.
                </span>
              </div>

              {/* Exact Tree Path Walkthrough */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-appBorder pb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-nearBlack">
                    Exact CART Decision Path
                  </span>
                  <span className="text-[11px] font-mono text-mutedText">
                    {result.decision_path.length} Nodes Traversed
                  </span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {result.decision_path.map((step, idx) => {
                    const isLast = step.is_leaf;
                    return (
                      <div
                        key={`path-${idx}`}
                        className={`p-3 rounded border text-xs transition-all ${
                          isLast
                            ? 'bg-softIvory border-nearBlack font-medium'
                            : 'bg-warmWhite border-appBorder hover:border-accentYellow'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-mutedText">
                            STEP {idx + 1}: {isLast ? `LEAF #${step.node_id}` : `NODE #${step.node_id}`}
                          </span>
                          <span className="font-mono text-[10px] text-mutedText">
                            Cohort Churn: {(step.churn_probability * 100).toFixed(1)}% ({step.samples} spl)
                          </span>
                        </div>

                        <div className="font-semibold text-nearBlack">
                          {step.rule_condition}
                        </div>

                        {step.user_value !== null && (
                          <div className="text-[11px] text-mutedText mt-1">
                            Subscriber Attribute: <span className="font-mono text-nearBlack font-medium">{String(step.user_value)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Decisive Factors */}
              <div className="border-t border-appBorder pt-4 space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-nearBlack">
                  Decisive Decision Rules
                </span>
                <ul className="space-y-1.5 text-xs text-mutedText">
                  {result.key_drivers.map((driver, i) => (
                    <li key={`driver-${i}`} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accentYellow mt-1.5 shrink-0"></span>
                      <span className="font-mono text-nearBlack">{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
