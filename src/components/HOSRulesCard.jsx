import React from 'react';

export default function HOSRulesCard() {
  const rules = [
    { limit: '11h', label: 'Maximum Daily Drive Dynamic' },
    { limit: '14h', label: 'Consecutive Operational Window' },
    { limit: '30m', label: 'Mandatory Rest Break rest interval per 8h continuous' },
    { limit: '70h', label: 'Maximum Service Limit over 8-Day Rolling Window' },
    { limit: '10h', label: 'Required Structural Off-Duty Recess' },
  ];

  return (
    <div className="premium-card p-6 bg-slate-900 border-0 shadow-xl shadow-slate-900/10">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">Regulatory Baselines</h3>
        <p className="text-xs text-slate-400 mt-0.5">FMCSA Title 49 CFR framework components applied.</p>
      </div>
      <ul className="space-y-3.5">
        {rules.map((rule, idx) => (
          <li key={idx} className="flex items-center justify-between text-xs border-b border-slate-800 pb-2.5 last:border-0 last:pb-0">
            <span className="font-medium text-slate-300">{rule.label}</span>
            <span className="font-mono bg-slate-800 border border-slate-750 text-indigo-400 font-bold px-2 py-0.5 rounded-md min-w-[38px] text-center">
              {rule.limit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}