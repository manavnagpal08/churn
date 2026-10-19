import React, { useState } from 'react';
import {TreeStructureResponse, TreeNode, ModelEvaluation} from '../types';
import {fetchTreeStructure, trainModel, fetchModelComparison} from '../services/api';
import {DecisionTreeViewer} from '../components/DecisionTreeViewer';
import {Sliders, RefreshCw, BookOpen, Scale} from 'lucide-react';

interface TreeObservatoryProps {
  initialTree: TreeStructureResponse | null;
  onModelRetrained?: () => void;
  trainingEnabled?: boolean;
}

export const TreeObservatory: React.FC<TreeObservatoryProps> = ({ initialTree, onModelRetrained, trainingEnabled = true }) => {
  const [treeData, setTreeData] = useState<TreeStructureResponse | null>(initialTree);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  // Hyperparameters
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>((initialTree?.config.criterion as 'gini' | 'entropy') || 'gini');
  const [maxDepth, setMaxDepth] = useState<number>(initialTree?.config.max_depth ?? 4);
  const [minSamplesLeaf, setMinSamplesLeaf] = useState<number>(initialTree?.config.min_samples_leaf ?? 15);
  const [ccpAlpha, setCcpAlpha] = useState<number>(initialTree?.config.ccp_alpha ?? 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<{
    gini: ModelEvaluation;
    entropy: ModelEvaluation;
    comparison_notes: { academic_context: string };
  } | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const loadTree = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetchTreeStructure();
      setTreeData(res);
      setSelectedNode(res.root);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The model operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setLoading(true); setError(null);
      await trainModel({
        criterion,
        max_depth: maxDepth,
        min_samples_leaf: minSamplesLeaf,
        ccp_alpha: ccpAlpha
      });
      await loadTree();
      if (onModelRetrained) onModelRetrained();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The model operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchComparison = async () => {
    try {
      setLoading(true); setError(null);
      const comp = await fetchModelComparison();
      setComparison(comp);
      setShowComparison(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The model operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {error && <p role="alert" className="p-4 bg-accentRed/10 border border-accentRed/30 rounded text-sm text-accentRed">{error}</p>}
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-appBorder pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-nearBlack bg-softIvory border border-appBorder px-2.5 py-1 rounded">
            CART Induction Visualizer
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-nearBlack tracking-tight mt-2">
            Decision Tree Observatory
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Inspect the separate CART reference model. Retraining this tree keeps the active ensemble predictor unchanged.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={loading}
            onClick={handleFetchComparison}
            className="flex items-center gap-1.5 px-3 py-2 bg-warmWhite border border-appBorder rounded-md text-xs font-mono font-medium text-nearBlack hover:bg-softIvory transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-accentYellow" />
            <span>Gini vs Entropy Comparison</span>
          </button>
        </div>
      </div>

      {!trainingEnabled && <p className="text-xs text-mutedText bg-softIvory border border-appBorder rounded-lg p-4">The hosted reference tree stays fixed for consistent results. Explore its nodes or compare split criteria here; use the local application for retraining experiments.</p>}
      {/* Model Control Bar: Max Depth, Min Leaf, Pruning, Criterion */}
      <div className="bg-warmWhite border border-appBorder rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 border-b border-appBorder pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-nearBlack" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-nearBlack">
              Hyperparameter Controls & Pruning
            </h3>
          </div>
          <span className="text-[11px] font-mono text-mutedText">
            Refitted strictly on training data (80% split)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
          {/* Criterion */}
          <div>
            <label className="block text-xs font-medium text-mutedText mb-1.5">
              Split Criterion
            </label>
            <div className="flex rounded-md border border-appBorder overflow-hidden bg-softIvory p-0.5">
              <button
                type="button"
                onClick={() => setCriterion('gini')}
                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                  criterion === 'gini' ? 'bg-nearBlack text-warmWhite' : 'text-mutedText hover:text-nearBlack'
                }`}
              >
                CART (Gini)
              </button>
              <button
                type="button"
                onClick={() => setCriterion('entropy')}
                className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                  criterion === 'entropy' ? 'bg-nearBlack text-warmWhite' : 'text-mutedText hover:text-nearBlack'
                }`}
              >
                Entropy (Info Gain)
              </button>
            </div>
          </div>

          {/* Max Depth */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-mutedText font-medium">Max Depth:</span>
              <span className="font-mono font-bold text-nearBlack">{maxDepth}</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={maxDepth}
              onChange={e => setMaxDepth(parseInt(e.target.value))}
              className="w-full accent-nearBlack cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-mutedText mt-0.5">
              <span>2 (Shallow)</span>
              <span>5</span>
              <span>10 (Deep)</span>
            </div>
          </div>

          {/* Min Samples Leaf */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-mutedText font-medium">Min Samples / Leaf:</span>
              <span className="font-mono font-bold text-nearBlack">{minSamplesLeaf}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={minSamplesLeaf}
              onChange={e => setMinSamplesLeaf(parseInt(e.target.value))}
              className="w-full accent-nearBlack cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-mutedText mt-0.5">
              <span>5</span>
              <span>15 (Startup default)</span>
              <span>100</span>
            </div>
          </div>

          {/* Complexity Pruning Alpha (ccp_alpha) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-mutedText font-medium">Cost-Complexity Alpha:</span>
              <span className="font-mono font-bold text-nearBlack">{ccpAlpha.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.05"
              step="0.002"
              value={ccpAlpha}
              onChange={e => setCcpAlpha(parseFloat(e.target.value))}
              className="w-full accent-nearBlack cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-mutedText mt-0.5">
              <span>0.0 (Unpruned)</span>
              <span>0.05 (Heavy)</span>
            </div>
          </div>

          {/* Retrain Button */}
          <div>
            <button
              onClick={handleRetrain}
              disabled={loading || !trainingEnabled}
              className="w-full py-2.5 bg-accentYellow hover:bg-yellow-400 text-nearBlack font-bold text-xs uppercase tracking-wider rounded border border-nearBlack flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Retraining...' : trainingEnabled ? 'Retrain reference tree' : 'Training available locally'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Gini vs Entropy Modal / Banner */}
      {showComparison && comparison && (
        <div className="bg-softIvory border-2 border-nearBlack rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-appBorder pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-accentYellow" />
              <h3 className="text-base font-bold text-nearBlack">
                Gini Impurity vs Entropy Criterion Benchmark
              </h3>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              className="text-xs font-mono text-mutedText hover:text-nearBlack"
            >
              Close [✕]
            </button>
          </div>

          <p className="text-xs text-mutedText leading-relaxed">
            {comparison.comparison_notes.academic_context}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Gini Card */}
            <div className="bg-warmWhite border border-appBorder rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-appBorder pb-2">
                <span className="font-mono font-bold text-xs uppercase text-nearBlack">
                  Configuration A: CART (Gini)
                </span>
                <span className="text-[11px] font-mono bg-softIvory px-2 py-0.5 rounded border border-appBorder">
                  G = 1 - &sum; p_i^2
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-mutedText block text-[10px]">Test Acc</span>
                  <span className="font-bold text-sm">{(comparison.gini.test_metrics.accuracy * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-mutedText block text-[10px]">Test Recall</span>
                  <span className="font-bold text-sm">{(comparison.gini.test_metrics.recall * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-mutedText block text-[10px]">ROC-AUC</span>
                  <span className="font-bold text-sm">{comparison.gini.test_metrics.roc_auc.toFixed(3)}</span>
                </div>
              </div>
              <p className="text-[11px] text-mutedText">
                Total nodes: {comparison.gini.tree_metadata.total_nodes} (Leaves: {comparison.gini.tree_metadata.leaf_nodes})
              </p>
            </div>

            {/* Entropy Card */}
            <div className="bg-warmWhite border border-appBorder rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-appBorder pb-2">
                <span className="font-mono font-bold text-xs uppercase text-nearBlack">
                  Configuration B: Entropy / Info-Gain
                </span>
                <span className="text-[11px] font-mono bg-softIvory px-2 py-0.5 rounded border border-appBorder">
                  H = - &sum; p_i log_2(p_i)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <span className="text-mutedText block text-[10px]">Test Acc</span>
                  <span className="font-bold text-sm">{(comparison.entropy.test_metrics.accuracy * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-mutedText block text-[10px]">Test Recall</span>
                  <span className="font-bold text-sm">{(comparison.entropy.test_metrics.recall * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-mutedText block text-[10px]">ROC-AUC</span>
                  <span className="font-bold text-sm">{comparison.entropy.test_metrics.roc_auc.toFixed(3)}</span>
                </div>
              </div>
              <p className="text-[11px] text-mutedText">
                Total nodes: {comparison.entropy.tree_metadata.total_nodes} (Leaves: {comparison.entropy.tree_metadata.leaf_nodes})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Tree Visualizer */}
      {treeData && (
        <DecisionTreeViewer
          rootNode={treeData.root}
          selectedNodeId={selectedNode?.id}
          onSelectNode={n => setSelectedNode(n)}
        />
      )}

      {/* Academic Step-by-Step Educational Walkthrough */}
      <section className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-appBorder pb-3">
          <BookOpen className="w-4 h-4 text-nearBlack" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-nearBlack">
            Induction Mechanics: How the Tree Partitions the Subscriber Base
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-mutedText leading-relaxed">
          <div className="space-y-2 border-l-2 border-accentYellow pl-4">
            <span className="font-mono font-bold text-nearBlack uppercase">
              1. Root Feature Split
            </span>
            <p>
              The algorithm evaluates every candidate feature threshold. In the telecom dataset, <strong>{treeData?.root.name || 'The selected root feature'}</strong> achieves the largest reduction in impurity, isolating high churn risk at the very first step.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-nearBlack pl-4">
            <span className="font-mono font-bold text-nearBlack uppercase">
              2. Recursive Stratification
            </span>
            <p>
              Subsets branch into left (condition met) and right (condition failed) partitions. Within Month-to-month subscribers, the tree branches on <strong>Tenure Months</strong> and <strong>Internet Service (Fiber Optic)</strong>, recursively seeking pure subgroups.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-accentRed pl-4">
            <span className="font-mono font-bold text-nearBlack uppercase">
              3. Terminal Leaf Assignment
            </span>
            <p>
              Splitting stops when maximum depth is reached or node sample size drops below minimum leaf threshold. The majority class determines the predicted class, and the leaf churn ratio defines the exact <strong>model-estimated churn probability</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
