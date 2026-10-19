import React from 'react';
import {LayoutDashboard, UserCheck, GitFork, BarChart3, FlaskConical, Users, ArrowUpRight, BookOpen, Activity} from 'lucide-react';
import type { AppStatus } from '../types';
interface Props { activeTab: string; setActiveTab: (tab: string) => void; status: AppStatus | null; onExitToLanding: () => void; }
export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, status, onExitToLanding }) => {
  const items = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'prediction-studio', label: 'Prediction Studio', icon: UserCheck },
    { id: 'customer-portfolio', label: 'Customer Portfolio', icon: Users },
    { id: 'pattern-intelligence', label: 'Pattern Intelligence', icon: BarChart3 },
    { id: 'tree-observatory', label: 'Tree Observatory', icon: GitFork },
    { id: 'model-evaluation', label: 'Evaluation Lab', icon: FlaskConical },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
  ];
  return <aside className="app-sidebar">
    <button className="brand" onClick={onExitToLanding} aria-label="CHURN ZERO overview">CHURN<span>//</span>ZERO<span className="brand-square"/></button>
    <div className="sidebar-caption">RETENTION WORKSPACE</div>
    <nav aria-label="Main navigation">{items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)}><Icon size={18}/><span>{label}</span>{activeTab === id && <span className="nav-indicator"/>}</button>)}</nav>
    <div className="sidebar-bottom"><div className="sidebar-model"><Activity size={17}/><span>{status?.status.model_name || 'Prediction model'}</span></div><dl><div><dt>Test accuracy</dt><dd>{status?.status.accuracy != null ? `${(status.status.accuracy * 100).toFixed(2)}%` : 'Unavailable'}</dd></div><div><dt>Dataset records</dt><dd>{status?.status.dataset_loaded ? status.status.total_records.toLocaleString() : 'Unavailable'}</dd></div></dl><p>Historical data. Predictions are estimates, not guaranteed outcomes.</p><button className="sidebar-overview" onClick={onExitToLanding}>Product overview <ArrowUpRight size={15}/></button></div>
  </aside>;
};
