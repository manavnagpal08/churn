import React, { useState } from 'react';
import {CustomerInput, PredictionResult} from '../types';
import {predictSingleCustomer} from '../services/api';
import { ContributionExplanation } from '../components/ContributionExplanation';
import {ArrowRight, GitCommit, AlertTriangle, User, CreditCard, Wifi, Sliders} from 'lucide-react';

interface PredictionStudioProps {
  onInspectNodeInTree?: (nodeId: number) => void;
}

export const PredictionStudio: React.FC<PredictionStudioProps> = () => {
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
    setResult(null);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'Tenure Months' || field === 'Monthly Charges') {
        const tenure = field === 'Tenure Months' ? Number(value) : prev['Tenure Months'];
        const monthly = field === 'Monthly Charges' ? Number(value) : prev['Monthly Charges'];
        updated['Total Charges'] = Math.round(tenure * monthly * 100) / 100;
      }
      if (field === 'Phone Service') updated['Multiple Lines'] = value === 'No' ? 'No phone service' : 'No';
      if (field === 'Multiple Lines') updated['Phone Service'] = value === 'No phone service' ? 'No' : 'Yes';
      const internetFields = ['Online Security', 'Online Backup', 'Device Protection', 'Tech Support', 'Streaming TV', 'Streaming Movies'] as const;
      if (field === 'Internet Service') {
        internetFields.forEach(key => { updated[key] = value === 'No' ? 'No internet service' : prev[key] === 'No internet service' ? 'No' : prev[key]; });
      } else if (internetFields.includes(field as typeof internetFields[number])) {
        if (value === 'No internet service') {
          updated['Internet Service'] = 'No'; internetFields.forEach(key => { updated[key] = 'No internet service'; });
        } else if (prev['Internet Service'] === 'No') {
          updated['Internet Service'] = 'DSL';
          internetFields.forEach(key => { if (key !== field) updated[key] = 'No'; });
        }
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
    setResult(null); setError(null);
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
      <div className="bg-white border border-appBorder/80 rounded-xl p-6 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-mutedText">
            Individual customer assessment
          </span>
          <h1 className="text-2xl font-bold text-nearBlack tracking-tight mt-1">
            Understand a customer’s risk.
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Assess a customer profile with the active prediction model, then explore the factors behind its score.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-mutedText font-medium mr-1">Load Preset:</span>
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
            className="text-xs px-3 py-1.5 rounded-lg border border-appBorder bg-softIvory text-nearBlack hover:bg-softIvory font-medium transition-colors"
          >
            Retained Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs */}
        <form onSubmit={handleAnalyze} className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer Profile */}
          <div className="bg-white border border-appBorder/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <User className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                1. Customer Profile
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label htmlFor="customer-gender" className="block text-mutedText font-medium mb-1.5">Gender</label>
                <select
                  id="customer-gender" value={formData.Gender}
                  onChange={e => handleInputChange('Gender', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-senior-citizen" className="block text-mutedText font-medium mb-1.5">Senior Citizen</label>
                <select
                  id="customer-senior-citizen" value={formData['Senior Citizen']}
                  onChange={e => handleInputChange('Senior Citizen', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-partner" className="block text-mutedText font-medium mb-1.5">Partner</label>
                <select
                  id="customer-partner" value={formData.Partner}
                  onChange={e => handleInputChange('Partner', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-dependents" className="block text-mutedText font-medium mb-1.5">Dependents</label>
                <select
                  id="customer-dependents" value={formData.Dependents}
                  onChange={e => handleInputChange('Dependents', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Account Information */}
          <div className="bg-white border border-appBorder/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <Sliders className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                2. Account Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label htmlFor="customer-tenure-months" className="block text-mutedText font-medium mb-1.5">
                  Tenure: <strong className="text-nearBlack">{formData['Tenure Months']} Months</strong>
                </label>
                <input
                  id="customer-tenure-months" type="range"
                  min="0"
                  max="72"
                  value={formData['Tenure Months']}
                  onChange={e => handleInputChange('Tenure Months', parseInt(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <span className="text-[11px] text-mutedText">0 to 72 months</span>
              </div>

              <div>
                <label htmlFor="customer-contract" className="block text-mutedText font-medium mb-1.5">Contract Term</label>
                <select
                  id="customer-contract" value={formData.Contract}
                  onChange={e => handleInputChange('Contract', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-paperless-billing" className="block text-mutedText font-medium mb-1.5">Paperless Billing</label>
                <select
                  id="customer-paperless-billing" value={formData['Paperless Billing']}
                  onChange={e => handleInputChange('Paperless Billing', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Service Subscriptions */}
          <div className="bg-white border border-appBorder/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <Wifi className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                3. Service Subscriptions
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label htmlFor="customer-phone-service" className="block text-mutedText font-medium mb-1.5">Phone Service</label>
                <select
                  id="customer-phone-service" value={formData['Phone Service']}
                  onChange={e => handleInputChange('Phone Service', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-multiple-lines" className="block text-mutedText font-medium mb-1.5">Multiple Lines</label>
                <select
                  id="customer-multiple-lines" value={formData['Multiple Lines']}
                  onChange={e => handleInputChange('Multiple Lines', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No phone service">No phone service</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-internet-service" className="block text-mutedText font-medium mb-1.5">Internet Service</label>
                <select
                  id="customer-internet-service" value={formData['Internet Service']}
                  onChange={e => handleInputChange('Internet Service', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="DSL">DSL</option>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="No">No (None)</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-online-security" className="block text-mutedText font-medium mb-1.5">Online Security</label>
                <select
                  id="customer-online-security" value={formData['Online Security']}
                  onChange={e => handleInputChange('Online Security', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-online-backup" className="block text-mutedText font-medium mb-1.5">Online Backup</label>
                <select
                  id="customer-online-backup" value={formData['Online Backup']}
                  onChange={e => handleInputChange('Online Backup', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-device-protection" className="block text-mutedText font-medium mb-1.5">Device Protection</label>
                <select
                  id="customer-device-protection" value={formData['Device Protection']}
                  onChange={e => handleInputChange('Device Protection', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-tech-support" className="block text-mutedText font-medium mb-1.5">Tech Support</label>
                <select
                  id="customer-tech-support" value={formData['Tech Support']}
                  onChange={e => handleInputChange('Tech Support', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-streaming-tv" className="block text-mutedText font-medium mb-1.5">Streaming TV</label>
                <select
                  id="customer-streaming-tv" value={formData['Streaming TV']}
                  onChange={e => handleInputChange('Streaming TV', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-streaming-movies" className="block text-mutedText font-medium mb-1.5">Streaming Movies</label>
                <select
                  id="customer-streaming-movies" value={formData['Streaming Movies']}
                  onChange={e => handleInputChange('Streaming Movies', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Billing and Payment */}
          <div className="bg-white border border-appBorder/80 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-appBorder pb-3">
              <CreditCard className="w-4 h-4 text-nearBlack" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
                4. Billing and Payment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label htmlFor="customer-payment-method" className="block text-mutedText font-medium mb-1.5">Payment Method</label>
                <select
                  id="customer-payment-method" value={formData['Payment Method']}
                  onChange={e => handleInputChange('Payment Method', e.target.value)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                >
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>

              <div>
                <label htmlFor="customer-monthly-charges" className="block text-mutedText font-medium mb-1.5">
                  Monthly Charges: <strong className="text-nearBlack">${formData['Monthly Charges']}</strong>
                </label>
                <input
                  id="customer-monthly-charges" type="number"
                  step="0.5"
                  min="18"
                  max="130"
                  value={formData['Monthly Charges']}
                  onChange={e => handleInputChange('Monthly Charges', parseFloat(e.target.value) || 0)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
                />
              </div>

              <div>
                <label htmlFor="customer-total-charges" className="block text-mutedText font-medium mb-1.5">
                  Total Charges: <strong className="text-nearBlack">${formData['Total Charges']}</strong>
                </label>
                <input
                  id="customer-total-charges" type="number"
                  step="1.0"
                  min="0"
                  value={formData['Total Charges']}
                  onChange={e => handleInputChange('Total Charges', parseFloat(e.target.value) || 0)}
                  className="w-full bg-softIvory border border-appBorder rounded-lg px-3 py-2 text-nearBlack focus:border-nearBlack outline-none"
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
                Evaluating customer profile…
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
            <div className="bg-white border border-dashed border-appBorder rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-softIvory flex items-center justify-center mx-auto text-mutedText">
                <GitCommit className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-nearBlack">Ready to assess a customer</h4>
              <p className="text-xs text-mutedText max-w-xs mx-auto leading-relaxed">
                Configure subscriber attributes or load a preset case above, then click <strong>ANALYZE SUBSCRIBER RISK</strong> to assess the profile with the active prediction model.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-white border border-appBorder/80 rounded-xl p-6 space-y-6 shadow-xs">
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
                    {result.model_name || result.model_criterion.toUpperCase()}
                  </div>
                </div>
              </div>

              {result.algorithm && result.algorithm !== 'decision_tree' && <ContributionExplanation result={result}/>}
              {(!result.algorithm || result.algorithm === 'decision_tree') && <>
              {/* Key Drivers */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-mutedText tracking-wider">
                  Key Identified Drivers
                </span>
                <div className="space-y-1.5">
                  {result.key_drivers && result.key_drivers.length > 0 ? (
                    result.key_drivers.map((driver, dIdx) => (
                      <div key={dIdx} className="text-xs text-nearBlack bg-softIvory p-2.5 rounded-lg border border-appBorder/60 font-medium">
                        • {driver}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-mutedText bg-softIvory p-2.5 rounded-lg border border-appBorder/60">
                      Standard contractual profile matching baseline retention criteria.
                    </div>
                  )}
                </div>
              </div>

              {/* Exact Boolean Path Traversal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-appBorder pb-2">
                  <span className="text-xs font-semibold uppercase text-mutedText tracking-wider">
                    Node Traversal Trace
                  </span>
                  <span className="text-[11px] font-mono text-mutedText">
                    Path length: {result.decision_path.length} Levels
                  </span>
                </div>

                <div className="space-y-2.5">
                  {result.decision_path.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-softIvory border border-appBorder/70 rounded-lg text-xs space-y-1 hover:border-appBorder transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-nearBlack">
                          Step {idx + 1}: Node #{step.node_id}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            step.is_leaf
                              ? 'bg-nearBlack text-white'
                              : step.satisfied
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-200 text-nearBlack'
                          }`}
                        >
                          {step.is_leaf ? 'Leaf Outcome' : step.satisfied ? 'Branch evaluated' : 'Condition False (>)'}
                        </span>
                      </div>

                      <div className="font-mono text-nearBlack font-medium">
                        {step.rule_condition}
                      </div>

                      <div className="text-[11px] text-mutedText flex items-center justify-between pt-1 border-t border-appBorder/50">
                        <span>Impurity: {step.impurity.toFixed(3)}</span>
                        <span>Node Samples: {step.samples.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </> }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
