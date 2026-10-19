import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CommandCenter } from './pages/CommandCenter';
import { PredictionStudio } from './pages/PredictionStudio';
import { TreeObservatory } from './pages/TreeObservatory';
import { PatternIntelligence } from './pages/PatternIntelligence';
import { ModelEvaluationLab } from './pages/ModelEvaluationLab';
import { CustomerPortfolio } from './pages/CustomerPortfolio';
import { MethodologyPage } from './pages/MethodologyPage';

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
  const [activeTab, setActiveTab] = useState<string>('command-center');
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

      // Fetch status, analytics, evaluation, and tree structure concurrently
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

  return (
    <div className="min-h-screen bg-warmWhite text-nearBlack flex flex-col font-sans selection:bg-accentYellow selection:text-nearBlack">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} status={status} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-nearBlack border-t-accentYellow rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <h3 className="font-mono font-bold text-sm text-nearBlack tracking-wider uppercase">
                Loading CHURN//ZERO Intelligence Engine
              </h3>
              <p className="text-xs text-mutedText">
                Ingesting Telco_customer_churn.xlsx and initializing CART Decision Tree...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="my-12 p-6 bg-accentRed/10 border-2 border-accentRed/40 rounded-lg max-w-2xl mx-auto space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-accentRed/20 text-accentRed flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-accentRed">Connection or Initialization Issue</h3>
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

            {activeTab === 'methodology' && (
              <MethodologyPage />
            )}
          </>
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-appBorder bg-softIvory py-8 text-xs text-mutedText">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-nearBlack">CHURN<span className="text-accentRed font-mono">//</span>ZERO</span>
            <span className="text-appBorder">|</span>
            <span>Academic Microproject • Semester 5 Data Mining & Data Warehousing</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Algorithm: CART (sklearn DecisionTree)</span>
            <span className="text-appBorder">•</span>
            <span>Dataset: Telco_customer_churn.xlsx</span>
            <span className="text-appBorder">•</span>
            <span>Strict Zero-Leakage Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
