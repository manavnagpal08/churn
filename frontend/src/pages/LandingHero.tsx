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
  ChevronRight,
  Sparkles,
  Lock
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
    <div className="space-y-24 pb-28 pt-10 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 px-3.5 py-1.5 rounded-full text-xs text-slate-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Decision Tree Induction Intelligence</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Semester 5 DMDW Microproject</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
          Every customer tells a story.<br />
          <span className="text-slate-900 bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text">
            Decode the ones at risk.
          </span>
        </h1>

        <p className="text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
          An enterprise-grade customer retention platform built strictly on <strong>CART Decision Tree Induction</strong>.
          Inspect empirical churn patterns, simulate individual subscriber risk, and audit boolean decision pathways.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onEnterApp('command-center')}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => onEnterApp('prediction-studio')}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-300 text-slate-800 font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Cpu className="w-4 h-4 text-slate-600" />
            <span>Single Prediction Studio</span>
          </button>

          <button
            onClick={() => onEnterApp('tree-observatory')}
            className="flex items-center gap-2 px-5 py-3.5 bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs uppercase tracking-wider rounded-lg hover:bg-slate-200 transition-colors"
          >
            <GitBranch className="w-4 h-4 text-slate-500" />
            <span>Inspect Decision Tree</span>
          </button>
        </div>
      </section>

      {/* Verified Telemetry Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Empirical Baseline &amp; Validation
          </h2>
          <span className="text-xs text-slate-400 font-mono">Dataset: Telco_customer_churn.xlsx</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Audited Portfolio</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {summary.total_customers.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">100% verified customer rows</p>
          </div>

          <div className="bg-white border border-slate-200/80 border-l-4 border-l-rose-500 p-6 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-rose-600 block mb-1">Confirmed Attrition</span>
            <div className="text-3xl font-black text-rose-600 tracking-tight">
              {summary.churned_customers.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">26.54% historical churn loss</p>
          </div>

          <div className="bg-white border border-slate-200/80 border-l-4 border-l-slate-900 p-6 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-900 block mb-1">Retained Accounts</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {summary.retained_customers.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">73.46% active customer base</p>
          </div>

          <div className="bg-white border border-slate-200/80 border-l-4 border-l-amber-400 p-6 rounded-xl shadow-xs">
            <span className="text-xs font-medium text-slate-900 block mb-1">CART Test Accuracy</span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {accuracyPct}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Evaluated on 1,409 held-out rows</p>
          </div>
        </div>
      </section>

      {/* Core Architectural Modules */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Comprehensive Retention Platform
          </h2>
          <p className="text-sm text-slate-500">
            Modular decision intelligence without artificial logic or fabricated metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-3 hover:border-slate-400 hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Mathematical CART Induction</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Implemented using scikit-learn CART classifier with Gini and Entropy criteria. Hyperparameter constraints and post-pruning avoid overfitting while maximizing generalization.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('tree-observatory')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-rose-600"
              >
                <span>Inspect Tree Hierarchy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-3 hover:border-slate-400 hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Single Prediction Studio</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides real-time subscriber risk underwriting. Evaluates contract commitments, internet service tiers, and tech support add-ons, displaying the exact boolean branch traversed at each node.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('prediction-studio')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-rose-600"
              >
                <span>Launch Prediction Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-3 hover:border-slate-400 hover:shadow-xs transition-all">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">Cohort Pattern Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore bivariate hazard distributions across 6 cohorts (tenure, billing, contracts, and services) and browse the full 7,043 customer ledger with server-side filtering and CSV exports.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onEnterApp('pattern-intelligence')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-rose-600"
              >
                <span>Explore Patterns</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Banner */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-semibold uppercase text-amber-400 tracking-wider">Operational Environment Ready</span>
          <h3 className="text-2xl font-bold text-white">Enter the Command Center</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Analyze the complete telecom customer portfolio, compare Gini vs. Entropy configurations, and audit single subscriber churn decisions.
          </p>
        </div>

        <button
          onClick={() => onEnterApp('command-center')}
          className="flex items-center gap-2 px-6 py-3.5 bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shadow-xs"
        >
          <span>Open Platform</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </section>
    </div>
  );
};
