import React from 'react';
import {ArrowUpRight} from 'lucide-react';
import type { AppStatus } from '../types';
export const LandingNavbar: React.FC<{onEnterApp: (tab?: string) => void; status: AppStatus | null}> = ({onEnterApp}) => <header className="landing-header"><div className="landing-nav"><button className="brand" onClick={() => onEnterApp('landing')}>CHURN<span>//</span>ZERO<span className="brand-square"/></button><nav aria-label="Product navigation"><button onClick={() => onEnterApp('methodology')}>Methodology</button><button onClick={() => onEnterApp('model-evaluation')}>Model results</button></nav><button className="primary-button" onClick={() => onEnterApp('command-center')}>Open workspace <ArrowUpRight size={16}/></button></div></header>;
