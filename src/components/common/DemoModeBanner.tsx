import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Database, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoModeBanner: React.FC = () => {
  const { settings, toggleDemoMode } = useApp();
  const [expanded, setExpanded] = useState(false);

  if (!settings.isDemoMode) {
    return (
      <div className="bg-emerald-600 text-white text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 mx-auto font-medium">
          <Database className="w-3.5 h-3.5" />
          <span>Connected to Supabase / Production Backend Architecture (Strict Verification Enabled)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-sm transition-all">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <span className="font-semibold tracking-wide">
            DEMO / TEST ENVIRONMENT:
          </span>
          <span className="hidden sm:inline text-amber-100">
            No real monetary transactions are processed. All balances and operations are simulated.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[11px] font-medium transition"
          >
            <span>{expanded ? 'Hide Details' : 'Notice'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={toggleDemoMode}
            className="bg-white text-orange-700 hover:bg-orange-50 px-2 py-0.5 rounded font-bold text-[11px] transition shadow-sm"
          >
            Toggle Live
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-amber-700/90 text-white px-4 py-3 text-xs border-t border-white/20 animate-fadeIn">
          <div className="max-w-4xl mx-auto space-y-1.5 leading-relaxed">
            <p className="font-semibold">Compliance & Transparency Disclosure:</p>
            <p>
              EasyBasePoint does not generate fake financial transactions, guaranteed earnings, or fake bank confirmations. All database tables and RLS security policies are prepared in <code>supabase_schema.sql</code>. In Demo mode, transactions execute within your local sandbox environment for testing and UX demonstration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
