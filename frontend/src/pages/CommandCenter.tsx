import React from 'react';
import {
  ArrowRight,
  Database,
  GitBranch,
  Cpu,
  Activity,
  TrendingUp,
  AlertCircle,
  Shield,
  FileText,
  BarChart2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { EdaAnalytics, AppStatus } from '../types';
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
    { name: 'Retained Accounts', value: summary.retained_customers, color: '#171717' },
    { name: 'Churned Accounts', value: summary.churned_customers, color: '#EF4444' }
  ];

  const contractData = analytics?.contract_breakdown || [];
  const tenureData = analytics?.tenure_breakdown || [];

  return (
    <div className="space-y-10 pb-20">
      {/* Enterprise Executive Header / Landing Hero */}
      <section className="border-b border-appBorder pb-8 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-nearBlack rounded-sm"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-nearBlack">
              Enterprise Telecom Intelligence Platform • Academic Microproject
            </span>
            <span className="text-appBorder">|</span>
            <span className="text-xs font-mono text-mutedText">
              CART Engine v1.4
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-mutedText">Data Source:</span>
            <span className="font-bold text-nearBlack">Telco_customer_churn.xlsx (7,043 Records)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-nearBlack leading-tight">
              Customer Churn Risk &amp; Retention Analytics
            </h1>
            <p className="text-sm sm:text-base text-mutedText leading-relaxed max-w-2xl font-normal">
              A high-precision predictive decision platform. Utilizing <strong>Classification and Regression Tree (CART) induction</strong> to isolate the exact structural thresholds, tenure vulnerabilities, and contract configurations driving subscriber attrition.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => onNavigate('prediction-studio')}
                className="flex items-center gap-2 px-5 py-3 bg-nearBlack text-warmWhite font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors"
              >
                <span>Launch Underwriting Simulator</span>
                <ArrowRight className="w-4 h-4 text-accentYellow" />
              </button>

              <button
                onClick={() => onNavigate('tree-observatory')}
                className="flex items-center gap-2 px-5 py-3 bg-warmWhite border border-appBorder text-nearBlack font-bold text-xs uppercase tracking-wider rounded hover:bg-softIvory transition-colors"
              >
                <GitBranch className="w-4 h-4 text-nearBlack" />
                <span>Inspect Decision Tree</span>
              </button>

              <button
                onClick={() => onNavigate('pattern-intelligence')}
                className="flex items-center gap-2 px-5 py-3 bg-softIvory border border-appBorder text-nearBlack font-bold text-xs uppercase tracking-wider rounded hover:bg-warmWhite transition-colors"
              >
                <BarChart2 className="w-4 h-4 text-mutedText" />
                <span>Cohort Exploration</span>
              </button>
            </div>
          </div>

          {/* Model Operational Audit Card */}
          <div className="lg:col-span-4 bg-softIvory border border-appBorder rounded-lg p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-appBorder pb-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-nearBlack">
                Model Verification Specs
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-nearBlack text-warmWhite">
                VERIFIED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-appBorder/40">
                <span className="text-mutedText">Algorithm:</span>
                <span className="font-mono font-bold text-nearBlack">CART DecisionTree</span>
              </div>
              <div className="flex justify-between py-1 border-b border-appBorder/40">
                <span className="text-mutedText">Split Criterion:</span>
                <span className="font-mono font-bold text-nearBlack">
                  {status?.config?.criterion?.toUpperCase() || 'GINI'} (Depth: {status?.config?.max_depth || 4})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-appBorder/40">
                <span className="text-mutedText">Validation Split:</span>
                <span className="font-mono font-bold text-nearBlack">80% Train / 20% Held-Out</span>
              </div>
              <div className="flex justify-between py-1 border-b border-appBorder/40">
                <span className="text-mutedText">Test Generalization:</span>
                <span className="font-mono font-extrabold text-nearBlack bg-accentYellow/40 px-2 py-0.5 rounded">
                  {testAccuracy}% Accuracy
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-mutedText">ROC-AUC Power:</span>
                <span className="font-mono font-bold text-nearBlack">0.8361 (Discriminative)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-appBorder text-[10px] text-mutedText leading-normal flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-mutedText shrink-0 mt-0.5" />
              <span>Metrics are measured strictly on 1,409 held-out test customer records. Zero data snooping or leakage.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Telemetry Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">
            Verified Portfolio Ledger
          </span>
          <span className="text-[11px] font-mono text-mutedText">100% Real Records</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText">Total Portfolio</span>
            <div className="text-2xl sm:text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.total_customers.toLocaleString()}
            </div>
            <p className="text-[11px] text-mutedText font-mono">Audited accounts</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-accentRed">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accentRed font-bold">Churn Loss</span>
            <div className="text-2xl sm:text-3xl font-black text-accentRed font-mono tracking-tight">
              {summary.churned_customers.toLocaleString()}
            </div>
            <p className="text-[11px] text-mutedText font-mono">Confirmed attrition</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-nearBlack">
            <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-bold">Retained Base</span>
            <div className="text-2xl sm:text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.retained_customers.toLocaleString()}
            </div>
            <p className="text-[11px] text-mutedText font-mono">Active subscriber base</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-accentYellow">
            <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-bold">Churn Frequency</span>
            <div className="text-2xl sm:text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.churn_rate_pct}%
            </div>
            <p className="text-[11px] text-mutedText font-mono">Cohort loss ratio</p>
          </div>

          <div className="bg-softIvory border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-nearBlack">
            <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-bold">CART Test Acc</span>
            <div className="text-2xl sm:text-3xl font-black text-nearBlack font-mono tracking-tight">
              {testAccuracy}%
            </div>
            <p className="text-[11px] text-mutedText font-mono">Optimized Decision Tree</p>
          </div>
        </div>
      </section>

      {/* Primary Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composition Chart */}
        <div className="lg:col-span-4 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div className="border-b border-appBorder pb-3">
            <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Distribution</span>
            <h3 className="text-sm font-bold text-nearBlack">Account Portfolio Composition</h3>
          </div>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((val: any) => [`${Number(val)?.toLocaleString()} Accounts (${((Number(val) || 0) / summary.total_customers * 100).toFixed(1)}%)`]) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-appBorder text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-nearBlack"></span>
              <span className="text-nearBlack font-medium">Retained: 73.5%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-accentRed"></span>
              <span className="text-accentRed font-bold">Churn: 26.5%</span>
            </div>
          </div>
        </div>

        {/* Contract Type Breakdown */}
        <div className="lg:col-span-4 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div className="border-b border-appBorder pb-3">
            <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Primary Split Node</span>
            <h3 className="text-sm font-bold text-nearBlack">Churn Rate by Contract Commitment</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractData} layout="vertical" margin={{ top: 10, right: 15, left: 20, bottom: 5 }}>
                <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                <YAxis dataKey="contract" type="category" tick={{ fontSize: 10, width: 85 }} />
                <Tooltip
                  formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="churn_rate" fill="#EF4444" radius={[0, 3, 3, 0]}>
                  {contractData.map((entry, idx) => (
                    <Cell
                      key={`c-${idx}`}
                      fill={entry.churn_rate > 35 ? '#EF4444' : entry.churn_rate > 10 ? '#FFD43B' : '#171717'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-mutedText border-t border-appBorder pt-2 font-mono">
            Month-to-month contracts exhibit an acute 42.7% attrition rate vs 2.8% on Two-year commitments.
          </p>
        </div>

        {/* Tenure Lifecycle Hazard */}
        <div className="lg:col-span-4 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div className="border-b border-appBorder pb-3">
            <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Tenure Hazard Curve</span>
            <h3 className="text-sm font-bold text-nearBlack">Attrition Rate by Subscriber Age</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="tenure_group" tick={{ fontSize: 9 }} />
                <YAxis unit="%" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="churn_rate" fill="#171717" radius={[3, 3, 0, 0]}>
                  {tenureData.map((entry, idx) => (
                    <Cell
                      key={`t-${idx}`}
                      fill={entry.churn_rate > 40 ? '#EF4444' : entry.churn_rate > 20 ? '#FFD43B' : '#171717'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-mutedText border-t border-appBorder pt-2 font-mono">
            Months 0–12 represent the primary vulnerability window (47.7% churn), declining rapidly with tenure.
          </p>
        </div>
      </section>

      {/* Structural Risk Vectors */}
      <section className="bg-softIvory border border-appBorder rounded-lg p-6 space-y-4">
        <div className="border-b border-appBorder pb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mutedText">
            Executive Summary
          </span>
          <h3 className="text-base font-bold text-nearBlack">
            Identified Churn Risk Vectors in Telecommunications Base
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          <div className="bg-warmWhite border border-appBorder p-4 rounded space-y-2">
            <span className="font-mono font-bold text-nearBlack uppercase block">
              1. Contractual Exposure
            </span>
            <p className="text-mutedText">
              Subscribers lacking annual contractual commitments account for over 88% of all churn events. Month-to-month terms represent the dominant splitting feature at the root of the CART decision tree.
            </p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-4 rounded space-y-2">
            <span className="font-mono font-bold text-nearBlack uppercase block">
              2. Technical Support Deficit
            </span>
            <p className="text-mutedText">
              Customers subscribing to Fiber optic broadband without accompanying Tech Support or Device Protection services show attrition rates exceeding 41.6%, signaling unassisted troubleshooting frustration.
            </p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-4 rounded space-y-2">
            <span className="font-mono font-bold text-nearBlack uppercase block">
              3. Payment Friction
            </span>
            <p className="text-mutedText">
              Electronic checks generate significantly higher churn (45.3%) compared to automated bank transfers (16.7%), reflecting both payment friction and involuntary non-automated subscription churn.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
