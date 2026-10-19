import React from 'react';
import type { PredictionResult } from '../types';
export const ContributionExplanation: React.FC<{result: PredictionResult}> = ({result}) => {
  const contributions = result.feature_contributions || [];
  const maximum = Math.max(...contributions.map(item => Math.abs(item.contribution)), .001);
  const shown = contributions.slice(0,8);
  const remainder = contributions.slice(8).reduce((sum,item) => sum + item.contribution,0);
  return <section className="contribution-explanation">
    <div><div className="eyebrow">BEHIND THIS PREDICTION</div><h3>What shapes this customer's score.</h3><p>Positive values move this model's score toward churn. Negative values move it toward retention.</p></div>
    <div className="contribution-key"><span>← Toward retention</span><span>Toward churn →</span></div>
    <div className="contribution-list">{shown.map(item => <div key={item.feature} className="contribution-row"><div><span>{item.feature}</span><small>{String(item.value)}</small></div><div className="contribution-track"><span className={item.contribution >= 0 ? 'positive' : 'negative'} style={{width:`${Math.abs(item.contribution)/maximum*48}%`}}/></div><strong className={item.contribution>=0 ? 'positive' : 'negative'}>{item.contribution>0 ? '+' : ''}{item.contribution.toFixed(3)}</strong></div>)}</div>
    {contributions.length>8 && <p className="contribution-remainder">{contributions.length-8} other inputs combined: {remainder>0 ? '+' : ''}{remainder.toFixed(3)} model-score units.</p>}
    <details className="explanation-details"><summary>How to read this explanation</summary><p>{result.explanation_method === 'tree_shap' ? `These are TreeSHAP contributions from the fitted ${result.model_name} model.` : result.explanation_method === 'linear' ? 'These are exact coefficient-times-input contributions from the fitted logistic regression model.' : 'These are path-difference contributions aggregated across the fitted ensemble. This is not SHAP.'} Values are in {result.contribution_units === 'log_odds' ? 'log-odds' : 'probability'} units, not percentage-point effects. Together with the baseline score, all contributions reconstruct this prediction. They describe model behavior, not causal effects.</p><dl><div><dt>Model baseline score</dt><dd>{result.baseline_score?.toFixed(4)}</dd></div><div><dt>Score for this profile</dt><dd>{result.prediction_score?.toFixed(4)}</dd></div><div><dt>Model</dt><dd>{result.model_name}</dd></div></dl></details>
    <p className="card-footnote">The Tree Observatory is a separate CART reference model. Its path is not used as an explanation for this prediction.</p>
  </section>;
};
