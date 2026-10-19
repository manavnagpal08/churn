import React from 'react';
import {
  ArrowRight,
  GitBranch,
  TrendingDown,
  ChevronRight,
  Database,
  BarChart3,
  Scale,
  Binary,
  Layers,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { AppStatus, EdaAnalytics } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

interface CommandCenterProps {
  analytics: EdaAnalytics | null;
  status: AppStatus | null;
  onNavigate: (tab: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ analytics, status, onNavigate }) => {
  const summary = analytics?.summary || {
    total_customers: 7043,
    churned_customers: 1869,
    retained_customers: 5174,
    churn_rate_pct: 26.54
  };

  const testAccuracy = status?.status?.accuracy ? (status.status.accuracy * 100).toFixed(2) : '79.91';

  const pieData = [
    { name: 'Retained Accounts', value: summary.retained_customers, color: '#0F172A' },
    { name: 'Churned Accounts', value: summary.churned_customers, color: '#EF4444' }
  ];

  const contractData = analytics?.contract_breakdown || [];
  const tenureData = analytics?.tenure_breakdown || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Command Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                <Database className="w-3.5 h-3.5" />
                <span>Telco Dataset</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">CART Model Engine v1.4</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Customer Retention & Churn Analytics
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              High-precision decision intelligence platform isolating structural attrition drivers across <strong>7,043 audited customer subscriptions</strong> using CART Decision Tree induction.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('prediction-studio')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Run Prediction</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={() => onNavigate('tree-observatory')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-50 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspect Tree</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-500">Total Portfolio</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary.total_customers.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Total audited accounts</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-rose-500 p-6 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-rose-600">Historical Churn</span>
          <div className="text-3xl font-black text-rose-600 tracking-tight">
            {summary.churned_customers.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">Confirmed customer attrition</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-slate-900 p-6 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-900">Retained Base</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {summary.retained_customers.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400">73.5% active subscriber retention</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-amber-400 p-6 rounded-xl shadow-xs space-y-1">
          <span className="text-xs font-medium text-slate-900">CART Test Accuracy</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {testAccuracy}%
          </div>
          <p className="text-xs text-slate-400">Evaluated on held-out test split</p>
        </div>
      </div>

      {/* Primary Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composition Chart */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Cohort Ratio</span>
            <h3 className="text-base font-bold text-slate-900">Portfolio Distribution</h3>
          </div>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={84}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((val: any) => [`${Number(val)?.toLocaleString()} Accounts (${((Number(val) || 0) / summary.total_customers * 100).toFixed(1)}%)`]) as any}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-900"></span>
              <span className="text-slate-700 font-medium">Retained: 73.5%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-500"></span>
              <span className="text-rose-600 font-semibold">Churn: 26.5%</span>
            </div>
          </div>
        </div>

        {/* Contract Type Breakdown */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Primary Split Feature</span>
            <h3 className="text-base font-bold text-slate-900">Churn Rate by Contract</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractData} layout="vertical" margin={{ top: 10, right: 15, left: 25, bottom: 5 }}>
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="contract" type="category" tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip
                  formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#EF4444" radius={[0, 4, 4, 0]}>
                  {contractData.map((entry, idx) => (
                    <Cell
                      key={`c-${idx}`}
                      fill={entry.churn_rate > 35 ? '#EF4444' : entry.churn_rate > 10 ? '#F59E0B' : '#0F172A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
            Month-to-month contracts experience a <strong>42.7% attrition rate</strong> vs 2.8% on Two-year commitments.
          </p>
        </div>

        {/* Tenure Hazard Curve */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Tenure Curve</span>
            <h3 className="text-base font-bold text-slate-900">Churn Rate by Subscriber Age</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <XAxis dataKey="tenure_group" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#0F172A" radius={[4, 4, 0, 0]}>
                  {tenureData.map((entry, idx) => (
                    <Cell
                      key={`t-${idx}`}
                      fill={entry.churn_rate > 40 ? '#EF4444' : entry.churn_rate > 20 ? '#F59E0B' : '#0F172A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
            Months 0–12 represent the highest hazard window (<strong>47.7% churn</strong>), stabilizing past month 24.
          </p>
        </div>
      </div>

      {/* Key Churn Drivers */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Model Findings</span>
          <h3 className="text-base font-bold text-slate-900">Primary Subscriber Risk Drivers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg space-y-2">
            <span className="font-semibold text-slate-900 uppercase block">1. Contractual Flexibility</span>
            <p className="text-slate-600">
              Month-to-month terms represent over 88% of all churn events in the portfolio, forming the root split in the decision tree.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg space-y-2">
            <span className="font-semibold text-slate-900 uppercase block">2. Tech Support Deficit</span>
            <p className="text-slate-600">
              Fiber optic subscribers without Tech Support or Online Security experience attrition rates exceeding 41.6%.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-lg space-y-2">
            <span className="font-semibold text-slate-900 uppercase block">3. Payment Channel</span>
            <p className="text-slate-600">
              Electronic checks experience 45.3% churn compared to 16.7% for automatic bank transfer accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
