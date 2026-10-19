import React, { useState } from 'react';
import {EdaAnalytics, FeatureImportanceItem} from '../types';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell} from 'recharts';
import {Info} from 'lucide-react';

interface PatternIntelligenceProps {
  analytics: EdaAnalytics | null;
  featureImportances: FeatureImportanceItem[];
}

export const PatternIntelligence: React.FC<PatternIntelligenceProps> = ({ analytics, featureImportances }) => {
  const [activeSegment, setActiveSegment] = useState<'all' | 'contract' | 'tenure' | 'billing' | 'services'>('all');

  const contractData = analytics?.contract_breakdown || [];
  const tenureData = analytics?.tenure_breakdown || [];
  const internetData = analytics?.internet_breakdown || [];
  const paymentData = analytics?.payment_breakdown || [];
  const monthlyData = analytics?.monthly_charges_breakdown || [];
  const techSupportData = analytics?.tech_support_breakdown || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-appBorder pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-nearBlack bg-softIvory border border-appBorder px-2.5 py-1 rounded">
            Exploratory Data Mining
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-nearBlack tracking-tight mt-2">
            Historical Pattern Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Historical subscriber trends and feature importance from the active fitted model.
          </p>
        </div>

        {/* View Filter Pill */}
        <div className="flex flex-wrap items-center gap-1.5 bg-softIvory border border-appBorder p-1 rounded-md text-xs font-mono">
          <button
            onClick={() => setActiveSegment('all')}
            className={`px-3 py-1.5 rounded transition-colors ${activeSegment === 'all' ? 'bg-nearBlack text-warmWhite font-bold' : 'text-mutedText hover:text-nearBlack'}`}
          >
            All Views
          </button>
          <button
            onClick={() => setActiveSegment('contract')}
            className={`px-3 py-1.5 rounded transition-colors ${activeSegment === 'contract' ? 'bg-nearBlack text-warmWhite font-bold' : 'text-mutedText hover:text-nearBlack'}`}
          >
            Contracts & Tenure
          </button>
          <button
            onClick={() => setActiveSegment('billing')}
            className={`px-3 py-1.5 rounded transition-colors ${activeSegment === 'billing' ? 'bg-nearBlack text-warmWhite font-bold' : 'text-mutedText hover:text-nearBlack'}`}
          >
            Billing & Charges
          </button>
          <button
            onClick={() => setActiveSegment('services')}
            className={`px-3 py-1.5 rounded transition-colors ${activeSegment === 'services' ? 'bg-nearBlack text-warmWhite font-bold' : 'text-mutedText hover:text-nearBlack'}`}
          >
            Service Adoption
          </button>
        </div>
      </div>

      {/* Prominent Non-Causation Methodological Notice */}
      <div className="bg-softIvory border-l-4 border-l-accentYellow p-4 rounded-r-lg border border-appBorder/80 text-xs text-mutedText leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-nearBlack shrink-0 mt-0.5" />
        <div>
          <strong className="text-nearBlack">Academic Epistemology & Non-Causation Disclaimer:</strong> Model feature importance summarizes fitted weights or split contributions, depending on the active algorithm. It is a model summary, not a causal effect. High importance indicates strong predictive association, <em>not causal agency</em>. Correlation with churn does not prove that modifying a feature directly changes subscriber behavior.
        </div>
      </div>

      {/* Actual Fitted Tree Feature Importance Ranking */}
      <section className="bg-warmWhite border border-appBorder rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-appBorder pb-3">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-mutedText">Active Model Summary</span>
            <h3 className="text-base font-bold text-nearBlack">Active Model Feature Importance</h3>
          </div>
          <span className="text-xs font-mono text-mutedText">Top {Math.min(10, featureImportances.length)} fitted features</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureImportances.slice(0, 10).map((feat, idx) => (
            <div key={`imp-${idx}`} className="bg-softIvory border border-appBorder p-3 rounded space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold text-nearBlack truncate max-w-[240px]">
                  #{idx + 1} {feat.feature_name}
                </span>
                <span className="font-extrabold text-nearBlack">{feat.importance_pct}%</span>
              </div>
              <div className="w-full bg-warmWhite border border-appBorder/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-accentYellow h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, feat.importance_pct)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contract Type */}
        {(activeSegment === 'all' || activeSegment === 'contract') && (
          <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Contract Dynamics</span>
              <h4 className="text-sm font-bold text-nearBlack">Churn Rate by Contract Commitment</h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="contract" tick={{ fontSize: 10 }} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                    contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="churn_rate" fill="#EF4444" radius={[4, 4, 0, 0]}>
                    {contractData.map((e, i) => (
                      <Cell key={`cb-${i}`} fill={e.churn_rate > 35 ? '#EF4444' : e.churn_rate > 10 ? '#FFD43B' : '#171717'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] font-mono text-mutedText border-t border-appBorder pt-2 flex justify-between">
              <span>Month-to-month: 42.7%</span>
              <span>2-Year: 2.8%</span>
            </div>
          </div>
        )}

        {/* Tenure Cohorts */}
        {(activeSegment === 'all' || activeSegment === 'contract') && (
          <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Subscriber Age</span>
              <h4 className="text-sm font-bold text-nearBlack">Churn Rate Across Tenure Windows</h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="tenure_group" tick={{ fontSize: 9 }} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                    contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="churn_rate" fill="#171717" radius={[4, 4, 0, 0]}>
                    {tenureData.map((e, i) => (
                      <Cell key={`tb-${i}`} fill={e.churn_rate > 30 ? '#EF4444' : '#171717'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] font-mono text-mutedText border-t border-appBorder pt-2 flex justify-between">
              <span>0-12 Mo: 47.7%</span>
              <span>61-72 Mo: 6.6%</span>
            </div>
          </div>
        )}

        {/* Internet Service Type */}
        {(activeSegment === 'all' || activeSegment === 'services') && (
          <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Connectivity Architecture</span>
              <h4 className="text-sm font-bold text-nearBlack">Internet Service Type vs Churn</h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={internetData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="internet_service" tick={{ fontSize: 10 }} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                    contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="churn_rate" fill="#EF4444" radius={[4, 4, 0, 0]}>
                    {internetData.map((e, i) => (
                      <Cell key={`ib-${i}`} fill={e.internet_service === 'Fiber optic' ? '#EF4444' : '#171717'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] font-mono text-mutedText border-t border-appBorder pt-2 flex justify-between">
              <span>Fiber Optic: 41.9%</span>
              <span>DSL: 19.0%</span>
            </div>
          </div>
        )}

        {/* Payment Method */}
        {(activeSegment === 'all' || activeSegment === 'billing') && (
          <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Billing Friction</span>
              <h4 className="text-sm font-bold text-nearBlack">Payment Method Churn Comparison</h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical" margin={{ top: 10, right: 15, left: 35, bottom: 5 }}>
                  <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="payment_method" type="category" tick={{ fontSize: 9, width: 85 }} />
                  <Tooltip
                    formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                    contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="churn_rate" fill="#171717" radius={[0, 4, 4, 0]}>
                    {paymentData.map((e, i) => (
                      <Cell key={`pb-${i}`} fill={e.payment_method === 'Electronic check' ? '#EF4444' : '#171717'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] font-mono text-mutedText border-t border-appBorder pt-2">
              Electronic checks exhibit 45.3% churn vs ~16% for automated transfers.
            </div>
          </div>
        )}

        {/* Tech Support Adoption */}
        {(activeSegment === 'all' || activeSegment === 'services') && (
          <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Customer Support Shield</span>
              <h4 className="text-sm font-bold text-nearBlack">Tech Support Subscription & Churn</h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techSupportData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="support_status" tick={{ fontSize: 10 }} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                    contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="churn_rate" fill="#171717" radius={[4, 4, 0, 0]}>
                    {techSupportData.map((e, i) => (
                      <Cell key={`tsb-${i}`} fill={e.support_status === 'No' ? '#EF4444' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] font-mono text-mutedText border-t border-appBorder pt-2">
              Subscribers without Tech Support churn at 41.6% vs 15.2% with Support.
            </div>
          </div>
        )}

        {/* Monthly Charges Tier */}
        {(activeSegment === 'all' || activeSegment === 'billing') && (
          <div className="bg-warmWhite border border-appBorder rounded-lg p-5 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-mutedText">Price Elasticity</span>
              <h4 className="text-sm font-bold text-nearBlack">Monthly Charges Tiers vs Churn</h4>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="charge_tier" tick={{ fontSize: 10 }} />
                  <YAxis unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={((val: any) => [`${val}% Churn Rate`]) as any}
                    contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#EAE7DF', borderRadius: '6px', fontSize: '11px' }}
                  />
                  <Bar dataKey="churn_rate" fill="#171717" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((e, i) => (
                      <Cell key={`mb-${i}`} fill={e.charge_tier === '$70 - $90' || e.charge_tier === '> $90' ? '#EF4444' : '#171717'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] font-mono text-mutedText border-t border-appBorder pt-2">
              Bills &gt; $70 carry ~34% churn rate vs 10.5% for basic tiers (&lt; $35).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
