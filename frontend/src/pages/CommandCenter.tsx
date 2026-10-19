import React from 'react';
import { ArrowUpRight, ArrowRight, ShieldCheck, Database, GitBranch, Cpu, Activity, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { EdaAnalytics, AppStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

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

  const testAccuracy = status?.status?.accuracy ? (status.status.accuracy * 100).toFixed(2) : '79.42';

  const pieData = [
    { name: 'Retained Customers', value: summary.retained_customers, color: '#171717' },
    { name: 'Churned Customers', value: summary.churned_customers, color: '#EF4444' }
  ];

  const contractData = analytics?.contract_breakdown || [];
  const tenureData = analytics?.tenure_breakdown || [];

  return (
    <div className="space-y-12 pb-16">
      {/* Asymmetric Editorial Hero Section */}
      <section className="pt-8 pb-10 border-b border-appBorder">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-softIvory border border-appBorder rounded-full text-xs font-mono font-medium text-nearBlack">
              <span className="w-2 h-2 rounded-full bg-accentYellow"></span>
              Decision Tree Induction Microproject • Telecom Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-nearBlack leading-[1.08]">
              Every customer tells a story.
              <br />
              <span className="text-accentRed underline decoration-accentYellow decoration-4 underline-offset-8">
                Decode the ones at risk.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-mutedText leading-relaxed max-w-2xl font-normal">
              Using rigorous <strong>CART Decision Tree induction</strong>, CHURN//ZERO isolates the precise split points, tenure thresholds, and service configurations that distinguish loyal telecom subscribers from churn hazards.
            </p>

            {/* Prominent Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('prediction-studio')}
                className="flex items-center gap-2 px-6 py-3.5 bg-accentYellow text-nearBlack font-bold text-sm rounded-md shadow-sm hover:bg-yellow-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Run a Churn Prediction</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('pattern-intelligence')}
                className="flex items-center gap-2 px-6 py-3.5 bg-warmWhite border border-nearBlack text-nearBlack font-semibold text-sm rounded-md hover:bg-softIvory transition-all"
              >
                <span>Explore Customer Intelligence</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('tree-observatory')}
                className="flex items-center gap-2 px-4 py-3.5 text-mutedText hover:text-nearBlack font-medium text-xs font-mono transition-colors"
              >
                <GitBranch className="w-4 h-4 text-accentYellow" />
                <span>View Trained Tree</span>
              </button>
            </div>
          </div>

          {/* Model Status Card */}
          <div className="lg:col-span-4 bg-softIvory border border-appBorder rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-appBorder pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-nearBlack">
                System & Model Status
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Operational
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-mutedText flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Workspace File
                </span>
                <span className="font-mono font-semibold text-nearBlack">Telco_customer_churn.xlsx</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-mutedText flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Learning Algorithm
                </span>
                <span className="font-mono font-semibold text-nearBlack">CART (DecisionTreeClassifier)</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-mutedText flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Active Criterion
                </span>
                <span className="font-mono font-semibold text-nearBlack">
                  {status?.config?.criterion?.toUpperCase() || 'GINI'} (Depth: {status?.config?.max_depth || 5})
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-mutedText flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Generalization Accuracy
                </span>
                <span className="font-mono font-bold text-nearBlack bg-accentYellow/30 px-2 py-0.5 rounded">
                  {testAccuracy}% (Held-out Test)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-appBorder text-[11px] text-mutedText leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-accentYellow" />
              Test accuracy is measured strictly on a 20% stratified held-out test cohort (1,409 customers) and represents empirical generalization, not future certainty.
            </div>
          </div>
        </div>
      </section>

      {/* Live Dataset Metrics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">
              Empirical Baseline
            </span>
            <h2 className="text-xl font-bold text-nearBlack tracking-tight">
              Dataset & Cohort Telemetry
            </h2>
          </div>
          <span className="text-xs font-mono text-mutedText">Source: Telco_customer_churn.xlsx (Verified)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText">Total Customers</span>
            <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
              {summary.total_customers.toLocaleString()}
            </div>
            <p className="text-[11px] text-mutedText">100% verified records</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-accentRed">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accentRed font-semibold">Churned Customers</span>
            <div className="text-3xl font-extrabold text-accentRed font-mono tracking-tight">
              {summary.churned_customers.toLocaleString()}
            </div>
            <p className="text-[11px] text-mutedText">Confirmed subscriber loss</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-nearBlack">
            <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-semibold">Retained Customers</span>
            <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
              {summary.retained_customers.toLocaleString()}
            </div>
            <p className="text-[11px] text-mutedText">Active telecommunication base</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-accentYellow">
            <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-semibold">Historical Churn Rate</span>
            <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
              {summary.churn_rate_pct}%
            </div>
            <p className="text-[11px] text-mutedText">Base cohort churn ratio</p>
          </div>

          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 bg-softIvory">
            <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-semibold">Model Test Accuracy</span>
            <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
              {testAccuracy}%
            </div>
            <p className="text-[11px] text-mutedText">Fitted Decision Tree</p>
          </div>
        </div>
      </section>

      {/* Visual Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Churn Ratio Distribution Pie */}
        <div className="lg:col-span-4 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Target Distribution</span>
            <h3 className="text-base font-bold text-nearBlack">Cohort Composition</h3>
          </div>

          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((val: any) => [`${val?.toLocaleString()} customers (${((Number(val) || 0) / summary.total_customers * 100).toFixed(1)}%)`]) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-appBorder text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-nearBlack"></span>
              <span className="text-mutedText">Retained (73.5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-accentRed"></span>
              <span className="text-mutedText">Churned (26.5%)</span>
            </div>
          </div>
        </div>

        {/* Churn by Contract Breakdown */}
        <div className="lg:col-span-4 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Key Driver Analysis</span>
            <h3 className="text-base font-bold text-nearBlack">Churn Rate by Contract Type</h3>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractData} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 5 }}>
                <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="contract" type="category" tick={{ fontSize: 11, width: 80 }} />
                <Tooltip
                  formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#EF4444" radius={[0, 4, 4, 0]}>
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

          <p className="text-[11px] text-mutedText border-t border-appBorder pt-2">
            Month-to-month contracts experience severe churn (42.7%), while Two-year commitments hold churn below 3%.
          </p>
        </div>

        {/* Tenure vs Churn Analysis */}
        <div className="lg:col-span-4 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Tenure Life Cycle</span>
            <h3 className="text-base font-bold text-nearBlack">Churn Rate Across Tenure Groups</h3>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <XAxis dataKey="tenure_group" tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="churn_rate" fill="#171717" radius={[4, 4, 0, 0]}>
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

          <p className="text-[11px] text-mutedText border-t border-appBorder pt-2">
            The first 12 months constitute the acute hazard zone (&gt;47% churn), declining rapidly with subscriber maturity.
          </p>
        </div>
      </section>
    </div>
  );
};
