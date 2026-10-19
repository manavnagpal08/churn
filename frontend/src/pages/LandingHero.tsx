import React from 'react';
import {
  ArrowRight,
  GitBranch,
  BarChart3,
  ShieldCheck,
  CheckCircle,
  Cpu,
  Layers,
  Database,
  Users,
  TrendingDown,
  ChevronRight
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
    <div className="space-y-20 pb-24 pt-8 max-w-6xl mx-auto">
      {/* Editorial Hero Section */}
      <section className="space-y-8 pt-4">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 border border-appBorder bg-softIvory px-3 py-1 rounded text-xs font-mono text-nearBlack">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold">ACADEMIC MICROPROJECT • SEMESTER 5</span>
            <span className="text-mutedText">|</span>
            <span className="text-mutedText">DATA MINING &amp; DATA WAREHOUSING</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-nearBlack leading-[1.12]">
            Every customer tells a story.<br />
            <span className="text-nearBlack underline decoration-accentYellow decoration-4 underline-offset-8">
              Decode the ones at risk.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-mutedText leading-relaxed font-normal">
            A telecom customer retention platform built strictly on genuine <strong>CART Decision Tree Induction</strong>.
            Inspect empirical subscription risks, discover contract churn drivers, and underwrite customer churn probabilities with complete boolean tree transparency.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={() => onEnterApp('command-center')}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-nearBlack text-warmWhite font-semibold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <span>Open Command Center</span>
              <ArrowRight className="w-4 h-4 text-accentYellow" />
            </button>

            <button
              onClick={() => onEnterApp('prediction-studio')}
              className="flex items-center gap-2 px-6 py-3.5 bg-warmWhite border-2 border-nearBlack text-nearBlack font-semibold text-xs uppercase tracking-wider rounded hover:bg-softIvory transition-colors"
            >
              <Cpu className="w-4 h-4 text-nearBlack" />
              <span>Predict Single Customer</span>
            </button>

            <button
              onClick={() => onEnterApp('tree-observatory')}
              className="flex items-center gap-2 px-5 py-3.5 bg-softIvory border border-appBorder text-nearBlack font-medium text-xs uppercase tracking-wider rounded hover:bg-warmWhite transition-colors"
            >
              <GitBranch className="w-4 h-4 text-mutedText" />
              <span>Inspect Fitted Tree</span>
            </button>
          </div>
        </div>
      </section>

      {/* Dataset Ledger Baseline Telemetry */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-appBorder pb-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">
            Verified Dataset Baseline &amp; Model Accuracy
          </h2>
          <span className="text-xs font-mono text-mutedText">Dataset: Telco_customer_churn.xlsx</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-warmWhite border border-appBorder p-5 rounded-lg">
            <span className="text-xs font-mono text-mutedText block mb-1">Audited Portfolio</span>
            <div className="text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.total_customers.toLocaleString()}
            </div>
            <p className="text-xs text-mutedText mt-1">100% genuine customer records</p>
          </div>

          <div className="bg-warmWhite border border-appBorder border-l-4 border-l-accentRed p-5 rounded-lg">
            <span className="text-xs font-mono text-accentRed font-semibold block mb-1">Historical Churn</span>
            <div className="text-3xl font-black text-accentRed font-mono tracking-tight">
              {summary.churned_customers.toLocaleString()}
            </div>
            <p className="text-xs text-mutedText mt-1">26.54% empirical attrition</p>
          </div>

          <div className="bg-warmWhite border border-appBorder border-l-4 border-l-nearBlack p-5 rounded-lg">
            <span className="text-xs font-mono text-nearBlack font-semibold block mb-1">Retained Accounts</span>
            <div className="text-3xl font-black text-nearBlack font-mono tracking-tight">
              {summary.retained_customers.toLocaleString()}
            </div>
            <p className="text-xs text-mutedText mt-1">73.46% active customer base</p>
          </div>

          <div className="bg-softIvory border border-appBorder border-l-4 border-l-accentYellow p-5 rounded-lg">
            <span className="text-xs font-mono text-nearBlack font-semibold block mb-1">Generalization Accuracy</span>
            <div className="text-3xl font-black text-nearBlack font-mono tracking-tight">
              {accuracyPct}%
            </div>
            <p className="text-xs text-mutedText mt-1">Evaluated on 1,409 held-out test rows</p>
          </div>
        </div>
      </section>

      {/* System Features Overview */}
      <section className="space-y-6">
        <div className="border-b border-appBorder pb-3">
          <h2 className="text-2xl font-black text-nearBlack tracking-tight">
            Integrated Retention Modules
          </h2>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Engineered with strict model validation and full separation of presentation and machine learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-3 hover:border-nearBlack transition-colors">
            <div className="w-9 h-9 rounded bg-softIvory border border-appBorder flex items-center justify-center text-nearBlack font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-base font-bold text-nearBlack">Mathematical CART Induction</h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Trained using scikit-learn DecisionTreeClassifier with Gini and Entropy criteria. Hyperparameter limits and post-pruning avoid overfitting while maximizing held-out test accuracy.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('tree-observatory')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-nearBlack hover:underline"
              >
                <span>Inspect Tree Hierarchy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-3 hover:border-nearBlack transition-colors">
            <div className="w-9 h-9 rounded bg-softIvory border border-appBorder flex items-center justify-center text-nearBlack font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-base font-bold text-nearBlack">Single-Customer Prediction Studio</h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Provides real-time subscriber risk underwriting. Evaluates contract commitments, internet service tiers, and tech support add-ons, displaying the exact boolean branch traversed at each node.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('prediction-studio')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-nearBlack hover:underline"
              >
                <span>Launch Prediction Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-3 hover:border-nearBlack transition-colors">
            <div className="w-9 h-9 rounded bg-softIvory border border-appBorder flex items-center justify-center text-nearBlack font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-base font-bold text-nearBlack">Pattern &amp; Portfolio Analytics</h3>
            <p className="text-xs text-mutedText leading-relaxed">
              Explore bivariate hazard distributions across 6 cohorts (tenure, billing, contracts, and services) and browse the full 7,043 customer ledger with server-side filtering and CSV exports.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('pattern-intelligence')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-nearBlack hover:underline"
              >
                <span>Explore Patterns</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Command Center Entry CTA */}
      <section className="bg-softIvory border border-appBorder rounded-lg p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <span className="text-xs font-mono font-bold uppercase text-nearBlack">Ready to start analysis?</span>
          <h3 className="text-xl font-black text-nearBlack">Access Command Center</h3>
          <p className="text-xs text-mutedText">
            Review the executive portfolio dashboard, attrition hazard curves, and contract splits.
          </p>
        </div>

        <button
          onClick={() => onEnterApp('command-center')}
          className="flex items-center gap-2 px-6 py-3.5 bg-nearBlack text-warmWhite font-semibold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors whitespace-nowrap shadow-xs"
        >
          <span>Open Command Center</span>
          <ArrowRight className="w-4 h-4 text-accentYellow" />
        </button>
      </section>
    </div>
  );
};
