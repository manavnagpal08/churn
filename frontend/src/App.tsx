import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './pages/LandingHero';
import { CommandCenter } from './pages/CommandCenter';
import { PredictionStudio } from './pages/PredictionStudio';
import { TreeObservatory } from './pages/TreeObservatory';
import { PatternIntelligence } from './pages/PatternIntelligence';
import { ModelEvaluationLab } from './pages/ModelEvaluationLab';
import { CustomerPortfolio } from './pages/CustomerPortfolio';

import {
  fetchAppStatus,
  fetchEdaAnalytics,
  fetchModelEvaluation,
  fetchTreeStructure
} from './services/api';
import {
  AppStatus,
  EdaAnalytics,
  ModelEvaluation,
  TreeStructureResponse
} from './types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // 'landing' is default. Once user enters the app, it sets to 'command-center', 'prediction-studio', etc.
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [analytics, setAnalytics] = useState<EdaAnalytics | null>(null);
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [treeStructure, setTreeStructure] = useState<TreeStructureResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllInitialData();
  }, []);

  const loadAllInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusRes, analyticsRes, evalRes, treeRes] = await Promise.all([
        fetchAppStatus(),
        fetchEdaAnalytics(),
        fetchModelEvaluation(),
        fetchTreeStructure()
      ]);

      setStatus(statusRes);
      setAnalytics(analyticsRes);
      setEvaluation(evalRes);
      setTreeStructure(treeRes);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(
        err.message || 'Failed to connect to CHURN//ZERO backend. Please ensure the Python FastAPI server is running on port 8000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModelRetrained = async (newEval?: ModelEvaluation) => {
    try {
      const [statusRes, treeRes] = await Promise.all([
        fetchAppStatus(),
        fetchTreeStructure()
      ]);
      setStatus(statusRes);
      setTreeStructure(treeRes);
      if (newEval) {
        setEvaluation(newEval);
      } else {
        const evalRes = await fetchModelEvaluation();
        setEvaluation(evalRes);
      }
    } catch (err) {
      console.error('Error refreshing post-retrain state:', err);
    }
  };

  const isLanding = activeTab === 'landing';

  return (
    <div className="min-h-screen bg-warmWhite text-nearBlack font-sans selection:bg-accentYellow selection:text-nearBlack flex flex-col">
      {/* 1. If on Landing Page: Show LandingNavbar with NO internal tabs */}
      {isLanding ? (
        <div className="flex flex-col min-h-screen">
          <LandingNavbar
            onEnterApp={(targetTab) => setActiveTab(targetTab || 'command-center')}
            status={status}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            {loading && (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-nearBlack border-t-accentYellow rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <h3 className="font-mono font-bold text-sm text-nearBlack tracking-wider uppercase">
                    Initializing CHURN//ZERO
                  </h3>
                  <p className="text-xs text-mutedText">
                    Connecting to CART Decision Tree backend...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="my-12 p-6 bg-accentRed/10 border-2 border-accentRed/40 rounded-lg max-w-2xl mx-auto space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-accentRed/20 text-accentRed flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-accentRed">Connection Issue</h3>
                <p className="text-xs text-nearBlack leading-relaxed">{error}</p>
                <button
                  onClick={loadAllInitialData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-nearBlack text-warmWhite rounded text-xs font-mono font-bold hover:bg-neutral-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}

            {!loading && !error && (
              <LandingHero
                onEnterApp={(tab) => setActiveTab(tab || 'command-center')}
                status={status}
                analytics={analytics}
              />
            )}
          </main>

          <footer className="border-t border-appBorder bg-softIvory py-8 text-xs text-mutedText">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-nearBlack">CHURN<span className="text-accentRed font-mono">//</span>ZERO</span>
                <span className="text-appBorder">|</span>
                <span>Academic Microproject • Semester 5 Data Mining & Data Warehousing</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span>CART Decision Tree</span>
                <span className="text-appBorder">•</span>
                <span>Telco_customer_churn.xlsx</span>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* 2. Inside the Operational Application: Professional Sidebar Navigation */
        <div className="flex min-h-screen bg-warmWhite">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            status={status}
            onExitToLanding={() => setActiveTab('landing')}
          />

          {/* Main Operational Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Workspace Header Bar */}
            <header className="h-16 border-b border-appBorder bg-warmWhite/90 backdrop-blur-sm sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">
                  Workspace /
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-nearBlack">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 bg-softIvory border border-appBorder px-3 py-1.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="text-mutedText">Engine:</span>
                  <span className="font-bold text-nearBlack">CART (Depth 4)</span>
                  <span className="text-appBorder">|</span>
                  <span className="text-mutedText">Accuracy:</span>
                  <span className="font-bold text-nearBlack">
                    {status?.status?.accuracy ? (status.status.accuracy * 100).toFixed(2) : '79.91'}%
                  </span>
                </div>
              </div>
            </header>

            {/* Operational Content Area */}
            <main className="flex-1 px-6 sm:px-8 py-6 max-w-7xl w-full">
              {loading && (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-3 border-nearBlack border-t-accentYellow rounded-full animate-spin"></div>
                  <p className="text-xs font-mono text-mutedText uppercase">Loading module...</p>
                </div>
              )}

              {!loading && (
                <>
                  {activeTab === 'command-center' && (
                    <CommandCenter
                      analytics={analytics}
                      status={status}
                      onNavigate={(tab) => setActiveTab(tab)}
                    />
                  )}

                  {activeTab === 'prediction-studio' && (
                    <PredictionStudio />
                  )}

                  {activeTab === 'tree-observatory' && (
                    <TreeObservatory
                      initialTree={treeStructure}
                      onModelRetrained={handleModelRetrained}
                    />
                  )}

                  {activeTab === 'pattern-intelligence' && (
                    <PatternIntelligence
                      analytics={analytics}
                      featureImportances={evaluation?.feature_importances || []}
                    />
                  )}

                  {activeTab === 'model-evaluation' && (
                    <ModelEvaluationLab
                      evaluation={evaluation}
                      onRetrainCompleted={(newEval) => handleModelRetrained(newEval)}
                    />
                  )}

                  {activeTab === 'customer-portfolio' && (
                    <CustomerPortfolio />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
