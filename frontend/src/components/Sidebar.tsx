import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  GitFork,
  BarChart3,
  FlaskConical,
  Users,
  LogOut,
  ChevronRight,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { AppStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: AppStatus | null;
  onExitToLanding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  status,
  onExitToLanding
}) => {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'prediction-studio', label: 'Prediction Studio', icon: UserCheck },
    { id: 'tree-observatory', label: 'Tree Observatory', icon: GitFork },
    { id: 'pattern-intelligence', label: 'Pattern Intelligence', icon: BarChart3 },
    { id: 'model-evaluation', label: 'Evaluation Lab', icon: FlaskConical },
    { id: 'customer-portfolio', label: 'Customer Portfolio', icon: Users },
  ];

  const accuracyPct = status?.status?.accuracy
    ? (status.status.accuracy * 100).toFixed(2)
    : '79.91';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen select-none border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={onExitToLanding}
          title="Return to Product Landing Page"
        >
          <div className="flex items-center tracking-tight">
            <span className="text-lg font-black text-white">CHURN</span>
            <span className="text-lg font-mono font-bold text-rose-500 mx-0.5">//</span>
            <span className="text-xs font-bold text-slate-900 bg-amber-400 px-1.5 py-0.5 rounded font-mono">
              ZERO
            </span>
          </div>
        </div>

        <button
          onClick={onExitToLanding}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
          title="Back to Landing Page"
        >
          <span>Exit</span>
          <ArrowUpRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Analytics &amp; Platform
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs rounded-lg text-left transition-all font-medium ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-slate-950' : 'text-slate-400'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Live System Telemetry */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Engine:</span>
            <span className="font-semibold text-slate-200">CART DecisionTree</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Generalization:</span>
            <span className="font-bold text-amber-400">{accuracyPct}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Portfolio:</span>
            <span className="font-semibold text-slate-200">7,043 Records</span>
          </div>
        </div>

        <button
          onClick={onExitToLanding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Exit to Overview</span>
        </button>
      </div>
    </aside>
  );
};
