import React from 'react';
import { LayoutDashboard, UserCheck, GitFork, BarChart3, FlaskConical, Users, BookOpen } from 'lucide-react';
import { AppStatus } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: AppStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, status }) => {
  const navItems = [
    { id: 'landing', label: 'Home', icon: LayoutDashboard },
    { id: 'command-center', label: 'Command Center', icon: BarChart3 },
    { id: 'prediction-studio', label: 'Prediction Studio', icon: UserCheck },
    { id: 'tree-observatory', label: 'Tree Observatory', icon: GitFork },
    { id: 'pattern-intelligence', label: 'Pattern Intelligence', icon: BarChart3 },
    { id: 'model-evaluation', label: 'Evaluation Lab', icon: FlaskConical },
    { id: 'customer-portfolio', label: 'Customer Portfolio', icon: Users },
  ];

  const accuracyPct = status?.status?.accuracy ? (status.status.accuracy * 100).toFixed(2) : '79.91';
  const criterionLabel = status?.config?.criterion?.toUpperCase() || 'GINI';

  return (
    <header className="sticky top-0 z-50 bg-warmWhite/95 backdrop-blur-md border-b border-appBorder">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="flex items-center tracking-tight">
            <span className="text-xl font-black tracking-tight text-nearBlack">CHURN</span>
            <span className="text-xl font-mono font-bold text-accentRed mx-0.5">//</span>
            <span className="text-xl font-mono font-black text-nearBlack bg-accentYellow px-1.5 py-0.5 rounded">ZERO</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-appBorder"></div>
          <p className="hidden md:block text-[11px] font-mono tracking-wide text-mutedText uppercase font-semibold">
            Understand the risk. Decode the decision. Retain the customer.
          </p>
        </div>

        {/* Live Model Telemetry */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-softIvory border border-appBorder px-3 py-1.5 rounded text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-mutedText">Model:</span>
            <span className="font-bold text-nearBlack">CART ({criterionLabel})</span>
            <span className="text-appBorder">|</span>
            <span className="text-mutedText">Accuracy:</span>
            <span className="font-bold text-nearBlack">{accuracyPct}%</span>
          </div>

          <div className="text-[11px] font-mono font-bold px-2.5 py-1 bg-nearBlack text-warmWhite rounded">
            TELCO 7,043
          </div>
        </div>
      </div>

      {/* Navigation Links with Yellow Active Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-appBorder/40 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 sm:space-x-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'text-nearBlack bg-softIvory font-semibold'
                    : 'text-mutedText hover:text-nearBlack hover:bg-softIvory/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-nearBlack' : 'text-mutedText'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-accentYellow rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
