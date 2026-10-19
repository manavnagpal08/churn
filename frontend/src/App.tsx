import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import {Sidebar} from './components/Sidebar';
import {LandingNavbar} from './components/LandingNavbar';
import {LandingHero} from './pages/LandingHero';
const CommandCenter = lazy(() => import('./pages/CommandCenter').then(module => ({ default: module.CommandCenter })));
const PredictionStudio = lazy(() => import('./pages/PredictionStudio').then(module => ({ default: module.PredictionStudio })));
const TreeObservatory = lazy(() => import('./pages/TreeObservatory').then(module => ({ default: module.TreeObservatory })));
const PatternIntelligence = lazy(() => import('./pages/PatternIntelligence').then(module => ({ default: module.PatternIntelligence })));
const ModelEvaluationLab = lazy(() => import('./pages/ModelEvaluationLab').then(module => ({ default: module.ModelEvaluationLab })));
const CustomerPortfolio = lazy(() => import('./pages/CustomerPortfolio').then(module => ({ default: module.CustomerPortfolio })));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage').then(module => ({ default: module.MethodologyPage })));
import {fetchAppStatus, fetchEdaAnalytics, fetchModelEvaluation, fetchTreeStructure} from './services/api';
import type { AppStatus, EdaAnalytics, ModelEvaluation, TreeStructureResponse } from './types';
import {AlertTriangle, RefreshCw, Menu, X, ArrowUpRight} from 'lucide-react';

const titles: Record<string, string> = {
  landing: 'Overview', 'command-center': 'Command Center', 'prediction-studio': 'Prediction Studio',
  'tree-observatory': 'Tree Observatory', 'pattern-intelligence': 'Pattern Intelligence',
  'model-evaluation': 'Evaluation Lab', 'customer-portfolio': 'Customer Portfolio', methodology: 'Methodology',
};
const route = () => Object.hasOwn(titles, location.hash.slice(1)) ? location.hash.slice(1) : 'landing';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(route);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [analytics, setAnalytics] = useState<EdaAnalytics | null>(null);
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [tree, setTree] = useState<TreeStructureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = (tab = 'command-center') => { location.hash = tab; setMenuOpen(false); };
  useEffect(() => {
    const changed = () => { setActiveTab(route()); setMenuOpen(false); window.scrollTo(0, 0); };
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('hashchange', changed);
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('hashchange', changed); window.removeEventListener('keydown', keydown); };
  }, []);
  useEffect(() => {
    if (!menuOpen || !window.matchMedia('(max-width: 800px)').matches) return;
    const previous = document.activeElement as HTMLElement | null;
    const drawer = document.querySelector('.sidebar-container') as HTMLElement;
    const controls = drawer.querySelectorAll<HTMLButtonElement>('button');
    controls[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    };
    drawer.addEventListener('keydown', trap);
    const scroll = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => {drawer.removeEventListener('keydown', trap); document.body.style.overflow = scroll; previous?.focus();};
  }, [menuOpen]);
  useEffect(() => { document.title = `${titles[activeTab]} · CHURN//ZERO`; }, [activeTab]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const current = await fetchAppStatus();
      if (!current.status.model_trained) throw new Error('The prediction engine is not ready yet. Retry in a moment.');
      const [eda, metrics, structure] = await Promise.all([fetchEdaAnalytics(), fetchModelEvaluation(), fetchTreeStructure()]);
      setStatus(current); setAnalytics(eda); setEvaluation(metrics); setTree(structure);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load the workspace.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Initialize data from the external API.
    void load();
  }, [load]);
  const refreshModel = async () => {
    try {
      const [current, metrics, structure] = await Promise.all([fetchAppStatus(), fetchModelEvaluation(), fetchTreeStructure()]);
      setStatus(current); setEvaluation(metrics); setTree(structure);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to refresh the model.'); }
  };

  const feedback = loading ? <div role="status" className="workspace-feedback"><RefreshCw className="animate-spin" size={26}/><h2>Preparing your workspace</h2><p>Loading the dataset and measured model results.</p></div>
    : error ? <div role="alert" className="workspace-feedback"><AlertTriangle size={30}/><h2>Workspace unavailable</h2><p>{error}</p><button className="primary-button" onClick={load}><RefreshCw size={16}/> Retry connection</button></div> : null;

  return <div className="app-root">
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    {activeTab === 'landing' ? <>
      <LandingNavbar onEnterApp={navigate} status={status}/>
      <main id="main-content" tabIndex={-1} className="landing-main">{feedback || <LandingHero onEnterApp={navigate} status={status} analytics={analytics}/>}</main>
      <footer className="site-footer"><span>CHURN//ZERO</span><span>Customer churn · Explainable decisions · DMDW project</span><button onClick={() => navigate('methodology')}>Read methodology <ArrowUpRight size={14}/></button></footer>
    </> : <div className="workspace-shell">
      {menuOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
      <div className={`sidebar-container ${menuOpen ? 'is-open' : ''}`}>
        <Sidebar activeTab={activeTab} setActiveTab={navigate} status={status} onExitToLanding={() => navigate('landing')}/>
      </div>
      <div className="workspace-body">
        <header className="workspace-header">
          <div className="flex items-center gap-3"><button className="mobile-menu icon-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button><span className="header-breadcrumb">Workspace <span>/</span> <strong>{titles[activeTab]}</strong></span></div>
          <div className="header-model"><span className={`status-dot ${!loading && !error && status?.status.model_trained ? 'online' : ''}`}/><span>{!loading && !error && status?.status.model_trained ? `${status.status.model_name || 'CART decision tree'}` : 'Connecting'}</span><button className="icon-button" disabled={loading} aria-label="Refresh workspace" onClick={load}><RefreshCw size={15}/></button></div>
        </header>
        <main id="main-content" tabIndex={-1} className="workspace-content">{feedback || <Suspense fallback={<div role="status" className="workspace-feedback">Loading page…</div>}>
          {activeTab === 'command-center' && <CommandCenter analytics={analytics} status={status} onNavigate={navigate}/>}
          {activeTab === 'prediction-studio' && <PredictionStudio/>}
          {activeTab === 'tree-observatory' && <TreeObservatory key={status?.status.last_trained_at} initialTree={tree} trainingEnabled={status?.capabilities?.reference_training ?? true} onModelRetrained={refreshModel}/>}
          {activeTab === 'pattern-intelligence' && <PatternIntelligence analytics={analytics} featureImportances={evaluation?.feature_importances || []}/>}
          {activeTab === 'model-evaluation' && <ModelEvaluationLab hosted={status?.capabilities?.hosted} evaluation={evaluation} onRetrainCompleted={refreshModel}/>}
          {activeTab === 'customer-portfolio' && <CustomerPortfolio hosted={status?.capabilities?.hosted}/>}
          {activeTab === 'methodology' && <MethodologyPage evaluation={evaluation}/>}
        </Suspense>}</main>
      </div>
    </div>}
  </div>;
};
export default App;
