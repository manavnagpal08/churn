import React from 'react';
import { ArrowRight, ChevronRight, Database } from 'lucide-react';
import { AppStatus } from '../types';

interface LandingNavbarProps {
  onEnterApp: (targetTab?: string) => void;
  status: AppStatus | null;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onEnterApp, status }) => {
  const accuracyPct = status?.status?.accuracy
    ? (status.status.accuracy * 100).toFixed(2)
    : '79.91';

  return (
    <header className="w-full border-b border-appBorder bg-warmWhite sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center tracking-tight">
            <span className="text-2xl font-black tracking-tight text-nearBlack">CHURN</span>
            <span className="text-2xl font-mono font-bold text-accentRed mx-0.5">//</span>
            <span className="text-2xl font-black text-nearBlack bg-accentYellow px-1.5 py-0.5 rounded text-base">
              ZERO
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-mutedText border-l border-appBorder pl-3">
            Telecom Decision Intelligence
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-mutedText">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Telco Dataset (7,043 Records)</span>
            <span className="text-appBorder">•</span>
            <span>Test Acc: <strong className="text-nearBlack">{accuracyPct}%</strong></span>
          </div>

          <button
            onClick={() => onEnterApp('command-center')}
            className="flex items-center gap-2 px-5 py-2.5 bg-nearBlack text-warmWhite font-semibold text-xs tracking-wide rounded hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5 text-accentYellow" />
          </button>
        </div>
      </div>
    </header>
  );
};
