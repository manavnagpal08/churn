import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Database,
  GitBranch,
  ShieldAlert,
  Binary,
  Layers,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Calculator
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-4">
      {/* Title */}
      <div className="border-b border-appBorder pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-softIvory border border-appBorder rounded-full text-xs font-mono font-bold text-nearBlack">
          <GraduationCap className="w-3.5 h-3.5 text-accentYellow" />
          Academic Microproject Documentation • Semester 5 Data Mining & Data Warehousing
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-nearBlack tracking-tight">
          Methodology & Project Architecture
        </h1>
        <p className="text-sm text-mutedText font-mono">
          Title: Customer Churn Prediction & Intelligence using Decision Tree Induction (CART)
        </p>
      </div>

      {/* 1. Problem Statement & Objectives */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-nearBlack border-b border-appBorder pb-2">
          <span className="font-mono font-bold text-sm text-accentRed">01.</span>
          <h2 className="text-lg font-bold uppercase tracking-wide">Problem Statement & Objectives</h2>
        </div>
        <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
          Customer attrition (churn) presents a substantial financial vulnerability in telecommunications due to high customer acquisition costs compared to subscription maintenance costs. The objective of this academic microproject is to construct an interpretable, transparent machine learning framework utilizing <strong>Decision Tree Induction</strong> to identify at-risk subscribers, extract explicit decision rules, and uncover behavioral patterns from historical telecom records.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="bg-softIvory border border-appBorder p-4 rounded-lg space-y-1">
            <strong className="text-nearBlack block font-mono">Primary Objective:</strong>
            <span>Construct and evaluate a CART Decision Tree classifier that predicts subscriber churn without black-box opacity.</span>
          </div>
          <div className="bg-softIvory border border-appBorder p-4 rounded-lg space-y-1">
            <strong className="text-nearBlack block font-mono">Interpretability Objective:</strong>
            <span>Trace exact Boolean decision paths through tree nodes to reveal actionable thresholds (e.g. tenure and contract milestones).</span>
          </div>
        </div>
      </section>

      {/* 2. Dataset Specification & Leakage Prevention */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-nearBlack border-b border-appBorder pb-2">
          <span className="font-mono font-bold text-sm text-accentRed">02.</span>
          <h2 className="text-lg font-bold uppercase tracking-wide">Dataset Specification & Leakage Prevention</h2>
        </div>
        <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
          The project utilizes the actual workspace dataset <code>Telco_customer_churn.xlsx</code> consisting of <strong>7,043 customer records</strong> and 33 original columns.
        </p>

        <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3 text-xs">
          <h3 className="font-bold text-nearBlack font-mono uppercase text-[11px]">Leakage-Prone and Metadata Columns Excluded:</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-mutedText">
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentRed mt-1 shrink-0"></span>
              <span><strong>CustomerID:</strong> Unique arbitrary identifier.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentRed mt-1 shrink-0"></span>
              <span><strong>Count, Country, State:</strong> Single-value constants.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentRed mt-1 shrink-0"></span>
              <span><strong>City, Zip Code, Lat Long:</strong> High-cardinality spatial coordinates.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentRed mt-1 shrink-0"></span>
              <span><strong>Churn Value:</strong> Direct numeric encoding of target label.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentRed mt-1 shrink-0"></span>
              <span><strong>Churn Score:</strong> Post-churn predictive score (data leakage).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accentRed mt-1 shrink-0"></span>
              <span><strong>Churn Reason:</strong> Populated only after churn has occurred (pure leakage).</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-appBorder text-[11px] text-mutedText">
            <strong>Numeric Data Cleaning:</strong> Exactly 11 records in <code>Total Charges</code> had whitespace strings corresponding to customers with <code>Tenure Months == 0</code>. These were safely coerced to 0.0 rather than dropping rows.
          </div>
        </div>
      </section>

      {/* 3. Decision Tree Induction & Mathematics */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-nearBlack border-b border-appBorder pb-2">
          <span className="font-mono font-bold text-sm text-accentRed">03.</span>
          <h2 className="text-lg font-bold uppercase tracking-wide">Mathematical Formulations: CART, Gini & Entropy</h2>
        </div>
        <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
          The model strictly implements the <strong>CART (Classification and Regression Trees)</strong> algorithm via <code>sklearn.tree.DecisionTreeClassifier</code>. The tree performs greedy recursive binary splitting: at each node, it evaluates all possible split points across all features to maximize the reduction in node impurity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-softIvory border border-appBorder p-4 rounded-lg space-y-2">
            <strong className="text-nearBlack block text-sm">Gini Impurity (CART Default)</strong>
            <p className="text-mutedText font-sans">
              Measures the probability of misclassifying a randomly chosen element from the set if it were randomly labeled according to the class distribution.
            </p>
            <div className="bg-warmWhite border border-appBorder p-2.5 rounded font-bold text-center text-nearBlack">
              G(D) = 1 - &sum;<sub>i=1</sub><sup>k</sup> p<sub>i</sub><sup>2</sup>
            </div>
            <p className="text-[10px] text-mutedText font-sans">
              For binary churn classification, maximum Gini impurity is 0.50 (pure 50/50 mix) and minimum is 0.0 (pure node).
            </p>
          </div>

          <div className="bg-softIvory border border-appBorder p-4 rounded-lg space-y-2">
            <strong className="text-nearBlack block text-sm">Entropy & Information Gain</strong>
            <p className="text-mutedText font-sans">
              Measures the average information or unpredictability inherent in the distribution (Shannon entropy).
            </p>
            <div className="bg-warmWhite border border-appBorder p-2.5 rounded font-bold text-center text-nearBlack">
              H(D) = - &sum;<sub>i=1</sub><sup>k</sup> p<sub>i</sub> log<sub>2</sub>(p<sub>i</sub>)
            </div>
            <p className="text-[10px] text-mutedText font-sans">
              Information Gain measures the reduction in entropy achieved by partitioning dataset D according to split condition A: IG(D, A) = H(D) - H(D|A).
            </p>
          </div>
        </div>

        {/* Academic Clarification: CART Entropy vs Textbook ID3 */}
        <div className="bg-warmWhite border-l-4 border-l-nearBlack border border-appBorder p-4 rounded-r-lg text-xs text-mutedText leading-relaxed space-y-2">
          <strong className="text-nearBlack flex items-center gap-1.5 font-mono">
            <Binary className="w-4 h-4 text-nearBlack" />
            Clarification on ID3 vs Scikit-Learn's Entropy Criterion:
          </strong>
          <p>
            In machine learning literature, the classic <strong>ID3 algorithm</strong> (Quinlan, 1986) creates multi-way splits for categorical variables and does not natively support continuous numeric variables or pruning.
          </p>
          <p>
            Scikit-learn’s implementation is an optimized version of <strong>CART</strong> that supports both the Gini impurity and Shannon entropy criteria. While using <code>criterion="entropy"</code> measures Information Gain, the tree construction remains binary and handles numeric features via threshold cuts. We explicitly do not claim that scikit-learn is a textbook ID3 implementation.
          </p>
        </div>
      </section>

      {/* 4. Validation Protocol & Generalization */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-nearBlack border-b border-appBorder pb-2">
          <span className="font-mono font-bold text-sm text-accentRed">04.</span>
          <h2 className="text-lg font-bold uppercase tracking-wide">Validation Protocol & Overfitting Control</h2>
        </div>
        <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
          To prevent data snooping and data leakage:
        </p>
        <ul className="list-disc pl-5 text-xs text-mutedText space-y-1.5 leading-relaxed">
          <li>
            <strong>Stratified 80/20 Train-Test Split:</strong> The dataset is partitioned with a fixed seed (<code>random_state=42</code>) preserving the 26.5% churn ratio in both partitions (5,634 train samples, 1,409 held-out test samples).
          </li>
          <li>
            <strong>Preprocessing Pipeline:</strong> One-hot encoding and scalers are fitted strictly on <code>X_train</code> and applied downstream to <code>X_test</code>.
          </li>
          <li>
            <strong>Overfitting Controls:</strong> Unconstrained decision trees tend to memorize training noise, reaching 100% training accuracy with poor test generalization. CHURN//ZERO implements <code>max_depth</code>, <code>min_samples_leaf</code>, and cost-complexity pruning (<code>ccp_alpha</code>) to produce parsimonious trees that generalize effectively.
          </li>
        </ul>
      </section>

      {/* 5. Limitations & Academic Integrity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-nearBlack border-b border-appBorder pb-2">
          <span className="font-mono font-bold text-sm text-accentRed">05.</span>
          <h2 className="text-lg font-bold uppercase tracking-wide">Limitations & Epistemic Boundaries</h2>
        </div>
        <div className="bg-softIvory border border-appBorder rounded-lg p-5 space-y-3 text-xs text-mutedText leading-relaxed">
          <p>
            1. <strong>Historical Boundary:</strong> The findings reflect telecom customer dynamics within the provided California dataset. Generalization to other geographies or subscription verticals cannot be guaranteed without re-fitting.
          </p>
          <p>
            2. <strong>Empirical vs Future Certainty:</strong> Test accuracy (~79.4%) and ROC-AUC (~0.83) measure predictive correlation in held-out data. Prediction outputs must be interpreted as statistical risk assessments, not deterministic forecasts.
          </p>
          <p>
            3. <strong>Algorithmic Constraint:</strong> By user requirement, no ensemble algorithms (Random Forest, XGBoost) or neural networks were employed. While ensembles might yield slightly higher ROC-AUC, single CART Decision Trees provide complete, audit-ready interpretability essential for regulatory compliance and academic instruction.
          </p>
        </div>
      </section>
    </div>
  );
};
