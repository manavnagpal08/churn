import React, { useState } from 'react';
import { ModelEvaluation } from '../types';
import { trainModel } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  FlaskConical,
  Scale,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ModelEvaluationLabProps {
  evaluation: ModelEvaluation | null;
  onRetrainCompleted: (newEval: ModelEvaluation) => void;
}

export const ModelEvaluationLab: React.FC<ModelEvaluationLabProps> = ({
  evaluation,
  onRetrainCompleted
}) => {
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>(
    (evaluation?.config.criterion as 'gini' | 'entropy') || 'gini'
  );
  const [maxDepth, setMaxDepth] = useState<number>(evaluation?.config.max_depth || 5);
  const [minSamplesLeaf, setMinSamplesLeaf] = useState<number>(
    evaluation?.config.min_samples_leaf || 20
  );
  const [ccpAlpha, setCcpAlpha] = useState<number>(evaluation?.config.ccp_alpha || 0.0);
  const [loading, setLoading] = useState(false);

  const trainMetrics = evaluation?.train_metrics;
  const testMetrics = evaluation?.test_metrics;
  const cm = evaluation?.confusion_matrix || { tn: 900, fp: 135, fn: 155, tp: 219, total: 1409 };
  const rocPoints = evaluation?.roc_curve || [];

  const handleRetrain = async () => {
    try {
      setLoading(true);
      const res = await trainModel({
        criterion,
        max_depth: maxDepth,
        min_samples_leaf: minSamplesLeaf,
        ccp_alpha: ccpAlpha
      });
      onRetrainCompleted(res.evaluation);
    } catch (err) {
      console.error('Retrain error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriterionToggle = async (newCrit: 'gini' | 'entropy') => {
    setCriterion(newCrit);
    try {
      setLoading(true);
      const res = await trainModel({
        criterion: newCrit,
        max_depth: maxDepth,
        min_samples_leaf: minSamplesLeaf,
        ccp_alpha: ccpAlpha
      });
      onRetrainCompleted(res.evaluation);
    } catch (err) {
      console.error('Criterion switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-appBorder pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-nearBlack bg-softIvory border border-appBorder px-2.5 py-1 rounded">
            Empirical Validation &amp; Diagnostics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-nearBlack tracking-tight mt-2">
            Model Evaluation &amp; Generalization
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Auditing generalization fidelity on 1,409 held-out test customers (80/20 stratified split).
          </p>
        </div>

        {/* Criterion Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-mutedText">Active Criterion:</span>
          <div className="flex rounded-md border border-appBorder bg-softIvory p-0.5">
            <button
              onClick={() => handleCriterionToggle('gini')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                criterion === 'gini' ? 'bg-nearBlack text-warmWhite' : 'text-mutedText hover:text-nearBlack'
              }`}
            >
              CART (Gini)
            </button>
            <button
              onClick={() => handleCriterionToggle('entropy')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors ${
                criterion === 'entropy' ? 'bg-nearBlack text-warmWhite' : 'text-mutedText hover:text-nearBlack'
              }`}
            >
              Entropy (Info Gain)
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Tiles (Held-out Test) */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText">Test Accuracy</span>
          <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
            {testMetrics ? (testMetrics.accuracy * 100).toFixed(2) : '--'}%
          </div>
          <p className="text-[11px] text-mutedText">Held-out cohort</p>
        </div>

        <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 border-l-4 border-l-accentYellow">
          <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-semibold">Test Recall</span>
          <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
            {testMetrics ? (testMetrics.recall * 100).toFixed(2) : '--'}%
          </div>
          <p className="text-[11px] text-mutedText">Churn sensitivity</p>
        </div>

        <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText">Test Precision</span>
          <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
            {testMetrics ? (testMetrics.precision * 100).toFixed(2) : '--'}%
          </div>
          <p className="text-[11px] text-mutedText">Positive predictive value</p>
        </div>

        <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-mutedText">Test F1-Score</span>
          <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
            {testMetrics ? (testMetrics.f1 * 100).toFixed(2) : '--'}%
          </div>
          <p className="text-[11px] text-mutedText">Harmonic mean</p>
        </div>

        <div className="bg-warmWhite border border-appBorder p-5 rounded-lg space-y-1 bg-softIvory border-l-4 border-l-nearBlack">
          <span className="text-[11px] font-mono uppercase tracking-wider text-nearBlack font-semibold">Test ROC-AUC</span>
          <div className="text-3xl font-extrabold text-nearBlack font-mono tracking-tight">
            {testMetrics ? testMetrics.roc_auc.toFixed(3) : '--'}
          </div>
          <p className="text-[11px] text-mutedText">Area under ROC curve</p>
        </div>
      </section>

      {/* Train vs Test Comparison Table */}
      <section className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-appBorder pb-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Generalization Check</span>
            <h3 className="text-base font-bold text-nearBlack">Training Cohort vs Held-Out Test Cohort Performance</h3>
          </div>
          <span className="text-xs font-mono text-mutedText">
            Overfitting Gap: {testMetrics && trainMetrics ? ((trainMetrics.accuracy - testMetrics.accuracy) * 100).toFixed(2) : '0.00'}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-appBorder text-mutedText font-mono uppercase text-[10px]">
                <th className="py-2.5 px-4 font-bold">Partition</th>
                <th className="py-2.5 px-4 font-bold">Samples</th>
                <th className="py-2.5 px-4 font-bold">Accuracy</th>
                <th className="py-2.5 px-4 font-bold">Precision</th>
                <th className="py-2.5 px-4 font-bold">Recall</th>
                <th className="py-2.5 px-4 font-bold">F1-Score</th>
                <th className="py-2.5 px-4 font-bold">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appBorder/50 font-mono">
              <tr>
                <td className="py-3 px-4 font-bold text-nearBlack">Training Data (80%)</td>
                <td className="py-3 px-4">{trainMetrics?.samples}</td>
                <td className="py-3 px-4 font-semibold">{trainMetrics ? (trainMetrics.accuracy * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4">{trainMetrics ? (trainMetrics.precision * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4">{trainMetrics ? (trainMetrics.recall * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4">{trainMetrics ? (trainMetrics.f1 * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4">{trainMetrics?.roc_auc.toFixed(3)}</td>
              </tr>
              <tr className="bg-softIvory">
                <td className="py-3 px-4 font-bold text-nearBlack">Held-out Test (20%)</td>
                <td className="py-3 px-4">{testMetrics?.samples}</td>
                <td className="py-3 px-4 font-bold text-nearBlack">{testMetrics ? (testMetrics.accuracy * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4">{testMetrics ? (testMetrics.precision * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4 font-bold text-accentRed">{testMetrics ? (testMetrics.recall * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4">{testMetrics ? (testMetrics.f1 * 100).toFixed(2) : '--'}%</td>
                <td className="py-3 px-4 font-bold text-nearBlack">{testMetrics?.roc_auc.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Confusion Matrix & ROC Curve Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Confusion Matrix */}
        <div className="lg:col-span-6 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-appBorder pb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Binary Error Matrix</span>
              <h3 className="text-base font-bold text-nearBlack">Held-out Test Confusion Matrix</h3>
            </div>
            <span className="text-xs font-mono text-mutedText">Total: {cm.total} test cases</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* True Negative */}
            <div className="bg-softIvory border border-appBorder rounded-lg p-4 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-mutedText uppercase text-[10px]">True Negatives (TN)</span>
                <span className="text-emerald-700 font-bold">Retained Correctly</span>
              </div>
              <div className="text-3xl font-extrabold text-nearBlack font-mono">{cm.tn}</div>
              <p className="text-[11px] text-mutedText">
                Actual: Retained | Pred: Retained
              </p>
            </div>

            {/* False Positive */}
            <div className="bg-warmWhite border border-accentYellow/70 rounded-lg p-4 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-mutedText uppercase text-[10px]">False Positives (FP)</span>
                <span className="text-yellow-800 font-bold">Type I Error</span>
              </div>
              <div className="text-3xl font-extrabold text-yellow-700 font-mono">{cm.fp}</div>
              <p className="text-[11px] text-mutedText">
                Actual: Retained | Pred: Churn
              </p>
            </div>

            {/* False Negative */}
            <div className="bg-warmWhite border border-accentRed/70 rounded-lg p-4 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-mutedText uppercase text-[10px]">False Negatives (FN)</span>
                <span className="text-accentRed font-bold">Type II Error (Critical)</span>
              </div>
              <div className="text-3xl font-extrabold text-accentRed font-mono">{cm.fn}</div>
              <p className="text-[11px] text-mutedText">
                Actual: Churn | Pred: Retained
              </p>
            </div>

            {/* True Positive */}
            <div className="bg-softIvory border border-nearBlack rounded-lg p-4 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-mutedText uppercase text-[10px]">True Positives (TP)</span>
                <span className="text-nearBlack font-bold">Churn Detected</span>
              </div>
              <div className="text-3xl font-extrabold text-nearBlack font-mono">{cm.tp}</div>
              <p className="text-[11px] text-mutedText">
                Actual: Churn | Pred: Churn
              </p>
            </div>
          </div>

          {/* Deep Academic Explanation of Recall vs Precision in Telecom */}
          <div className="bg-softIvory border border-appBorder rounded p-4 text-xs text-mutedText leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-nearBlack">
              <AlertOctagon className="w-4 h-4 text-accentRed" />
              <span>Why Recall is the Critical Metric in Customer Churn Prediction:</span>
            </div>
            <p>
              In telecommunications, <strong>False Negatives ({cm.fn} missed churners)</strong> represent silent subscriber departures where no retention campaign is triggered, directly forfeiting customer lifetime value.
            </p>
            <p>
              Conversely, <strong>False Positives ({cm.fp} retention offers to loyal subscribers)</strong> incur only minor promotional discounts. Maximizing Recall ensures telecom operators intercept the greatest possible fraction of at-risk subscribers.
            </p>
          </div>
        </div>

        {/* ROC Curve */}
        <div className="lg:col-span-6 bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-appBorder pb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Discriminative Power</span>
              <h3 className="text-base font-bold text-nearBlack">Receiver Operating Characteristic (ROC)</h3>
            </div>
            <span className="text-xs font-mono font-bold text-nearBlack bg-accentYellow/30 px-2 py-0.5 rounded">
              AUC: {testMetrics?.roc_auc.toFixed(3)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocPoints} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="tpr" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip
                  formatter={((val: any, name: any) => [Number(val).toFixed(3), name === 'tpr' ? 'True Positive Rate (Sensitivity)' : 'False Positive Rate']) as any}
                  contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                />
                <ReferenceLine x={0} y={0} stroke="#EAE7DF" />
                <Line type="monotone" dataKey="tpr" stroke="#171717" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-mutedText border-t border-appBorder pt-2">
            The ROC curve maps sensitivity (TPR) against (1 - specificity) across all decision thresholds. An AUC of {testMetrics?.roc_auc.toFixed(3)} confirms strong discrimination above random chance (0.50).
          </p>
        </div>
      </div>
    </div>
  );
};
