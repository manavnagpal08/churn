import React from 'react';
import {
  ArrowRight,
  GitBranch,
  BarChart3,
  ShieldAlert,
  Layers,
  Database,
  CheckCircle,
  FileSpreadsheet,
  ChevronRight,
  TrendingDown,
  Activity,
  Cpu
} from 'lucide-react';
import { AppStatus, EdaAnalytics } from '../types';

interface LandingHeroProps {
  onEnterApp: (targetTab?: string) => void;
  status: AppStatus | null;
  analytics: EdaAnalytics | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterApp, status, analytics }) => {
  const summary = analytics?.summary || {
    total_customers: 7043,
    churned_customers: 1869,
    retained_customers: 5174,
    churn_rate_pct: 26.54
  };

  const accuracyPct = status?.status?.accuracy ? (status.status.accuracy * 100).toFixed(2) : '79.91';

  return (
    <div className="space-y-16 pb-20 pt-4">
      {/* Hero Header Section */}
      <section className="border-b border-appBorder pb-14 pt-2">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 border border-appBorder bg-softIvory px-3 py-1 rounded text-xs font-mono text-nearBlack">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold">PRODUCTION INTELLIGENCE SYSTEM</span>
            <span className="text-mutedText">|</span>
            <span className="text-mutedText">CART DECISION TREE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-nearBlack leading-[1.1]">
            Every customer tells a story.<br />
            <span className="text-nearBlack underline decoration-accentYellow decoration-4 underline-offset-8">
              Decode the ones at risk.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-mutedText leading-relaxed font-normal max-w-2xl">
            A real-world telecom customer churn prediction platform built on genuine decision tree induction.
            We analyze empirical subscription signals, contractual dependencies, and usage thresholds to prevent customer attrition before it happens.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => onEnterApp('command-center')}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-nearBlack text-warmWhite font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <span>Explore Command Center</span>
              <ArrowRight className="w-4 h-4 text-accentYellow" />
            </button>

            <button
              onClick={() => onEnterApp('prediction-studio')}
              className="flex items-center gap-2 px-6 py-3.5 bg-warmWhite border-2 border-nearBlack text-nearBlack font-bold text-xs uppercase tracking-wider rounded hover:bg-softIvory transition-colors"
            >
              <Cpu className="w-4 h-4 text-nearBlack" />
              <span>Run Churn Prediction</span>
            </button>

            <button
              onClick={() => onEnterApp('tree-observatory')}
              className="flex items-center gap-2 px-5 py-3.5 bg-softIvory border border-appBorder text-nearBlack font-medium text-xs uppercase tracking-wider rounded hover:bg-warmWhite transition-colors"
            >
              <GitBranch className="w-4 h-4 text-mutedText" />
              <span>Inspect Decision Tree</span>
            </button>
          </div>
        </div>
      </section>

      {/* Verified Live Telemetry Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">
            Verified Dataset Baseline & Model Specifications
          </h2>
          <span className="text-xs font-mono text-mutedText">Source: Telco_customer_churn.xlsx</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg">
            <span className="text-xs font-mono text-mutedText block mb-1">Audited Records</span>
            <div className="text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.total_customers.toLocaleString()}
            </div>
            <p className="text-xs text-mutedText mt-1">100% verified customer rows</p>
          </div>

          <div className="bg-warmWhite border border-appBorder border-l-4 border-l-accentRed p-5 rounded-lg">
            <span className="text-xs font-mono text-accentRed font-semibold block mb-1">Historical Churn</span>
            <div className="text-3xl font-black text-accentRed font-mono tracking-tight">
              {summary.churned_customers.toLocaleString()}
            </div>
            <p className="text-xs text-mutedText mt-1">26.54% empirical loss rate</p>
          </div>

          <div className="bg-warmWhite border border-appBorder border-l-4 border-l-nearBlack p-5 rounded-lg">
            <span className="text-xs font-mono text-nearBlack font-semibold block mb-1">Retained Base</span>
            <div className="text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.retained_customers.toLocaleString()}
            </div>
            <p className="text-xs text-mutedText mt-1">73.46% active customer base</p>
          </div>

          <div className="bg-softIvory border border-appBorder border-l-4 border-l-accentYellow p-5 rounded-lg">
            <span className="text-xs font-mono text-nearBlack font-semibold block mb-1">CART Test Accuracy</span>
            <div className="text-3xl font-black text-nearBlack font-mono tracking-tight">
              {accuracyPct}%
            </div>
            <p className="text-xs text-mutedText mt-1">Evaluated on 1,409 held-out test rows</p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-nearBlack tracking-tight">
            How CHURN//ZERO Works
          </h2>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Engineered from ground up with true academic rigor and enterprise-ready backend logic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-3 hover:border-nearBlack transition-colors">
            <div className="w-10 h-10 rounded bg-softIvory border border-appBorder flex items-center justify-center text-nearBlack font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-nearBlack">Mathematical Tree Induction</h3>
            <p className="text-xs text-mutedText leading-relaxed">
              We employ the CART algorithm using scikit-learn. Splitting on Gini impurity and entropy criteria with cost-complexity pruning prevents over-fitting and maximizes generalization.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('tree-observatory')}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-nearBlack hover:underline"
              >
                <span>View Tree Observatory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-3 hover:border-nearBlack transition-colors">
            <div className="w-10 h-10 rounded bg-softIvory border border-appBorder flex items-center justify-center text-nearBlack font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-nearBlack">Real-Time Risk Underwriting</h3>
            <p className="text-xs text-mutedText leading-relaxed">
              The Prediction Studio audits subscriber contract terms, tenure, payment friction, and tech support add-ons. It outputs the exact boolean decision path traversed through the tree.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('prediction-studio')}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-nearBlack hover:underline"
              >
                <span>Launch Prediction Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-3 hover:border-nearBlack transition-colors">
            <div className="w-10 h-10 rounded bg-softIvory border border-appBorder flex items-center justify-center text-nearBlack font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-nearBlack">Cohort Pattern Analytics</h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Explore bivariate risk drivers across contracts, tenure lifecycle hazards, paperless billing, and electronic check adoption across the complete 7,043 customer ledger.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('pattern-intelligence')}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-nearBlack hover:underline"
              >
                <span>Explore Patterns</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launch Banner */}
      <section className="bg-softIvory border border-appBorder rounded-lg p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <span className="text-xs font-mono font-bold uppercase text-nearBlack">Ready to examine the intelligence?</span>
          <h3 className="text-xl font-black text-nearBlack">Open the Command Center Dashboard</h3>
          <p className="text-xs text-mutedText">
            Review the full executive overview, portfolio distribution, and risk cohort vectors.
          </p>
        </div>

        <button
          onClick={() => onEnterApp('command-center')}
          className="flex items-center gap-2 px-6 py-3 bg-nearBlack text-warmWhite font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors whitespace-nowrap"
        >
          <span>Open Command Center</span>
          <ArrowRight className="w-4 h-4 text-accentYellow" />
        </button>
      </section>
    </div>
  );
};
