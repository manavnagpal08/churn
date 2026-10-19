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
  Database
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
  const criterionLabel = status?.config?.criterion?.toUpperCase() || 'GINI';

  return (
    <aside className="w-64 bg-warmWhite border-r border-appBorder flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-appBorder flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={onExitToLanding}
          title="Back to Landing Page"
        >
          <span className="text-lg font-black tracking-tight text-nearBlack">CHURN</span>
          <span className="text-lg font-mono font-bold text-accentRed">//</span>
          <span className="text-lg font-black text-nearBlack bg-accentYellow px-1.5 py-0.5 rounded text-sm">
            ZERO
          </span>
        </div>

        <button
          onClick={onExitToLanding}
          className="text-[11px] font-mono text-mutedText hover:text-nearBlack flex items-center gap-1 px-2 py-1 rounded hover:bg-softIvory border border-transparent hover:border-appBorder transition-colors"
          title="Return to Product Landing Page"
        >
          <span>Landing</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-mutedText">
          Analytics & Models
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-md text-left transition-colors font-medium ${
                isActive
                  ? 'bg-nearBlack text-warmWhite font-semibold shadow-xs'
                  : 'text-nearBlack hover:bg-softIvory hover:text-nearBlack'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-accentYellow' : 'text-mutedText'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-accentYellow"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Live System Telemetry */}
      <div className="p-4 border-t border-appBorder bg-softIvory/60 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-mutedText">CART Model:</span>
            <span className="font-bold text-nearBlack">{criterionLabel} (Depth 4)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-mutedText">Test Accuracy:</span>
            <span className="font-bold text-nearBlack">{accuracyPct}%</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-mutedText">Dataset:</span>
            <span className="font-bold text-nearBlack">7,043 Records</span>
          </div>
        </div>

        <button
          onClick={onExitToLanding}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-appBorder bg-warmWhite rounded text-xs font-mono font-medium text-nearBlack hover:bg-softIvory transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-mutedText" />
          <span>Exit to Overview</span>
        </button>
      </div>
    </aside>
  );
};
