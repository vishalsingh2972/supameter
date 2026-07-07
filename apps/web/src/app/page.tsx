'use client';

import { useState } from 'react';

interface DiagnosticData {
  id: string;
  raw_explain_text: string;
  execution_time_ms: number;
  created_at: string;
  summary_json: {
    bottleneck: string;
    table: string;
    remediation: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export default function Dashboard() {
  const [rawLog, setRawLog] = useState('');
  const [executionTime, setExecutionTime] = useState('0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawLog.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLog,
          executionTimeMs: parseInt(executionTime, 10) || 0,
        }),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to analyze query log pipeline');
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-950 text-red-400 border-red-800';
      case 'HIGH': return 'bg-orange-950 text-orange-400 border-orange-800';
      case 'MEDIUM': return 'bg-yellow-950 text-yellow-400 border-yellow-800';
      default: return 'bg-zinc-900 text-zinc-400 border-zinc-800';
    }
  };

  const renderSqlBlock = (remediationText: string, tableName: string) => {
    if (remediationText.includes('CREATE')) {
      return remediationText.substring(remediationText.indexOf('CREATE'));
    }
    return `-- Execute optimization strategy for public.${tableName}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-teal-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-zinc-800 px-6 py-4 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tight text-teal-400 font-mono">SupaMeter_AI</span>
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono">v1.0</span>
          </div>
          <div className="text-sm text-zinc-400 font-mono">⚡ Performance Gateway Enabled</div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Form Input */}
        <section className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 flex flex-col space-y-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-200">Query Telemetry Input</h2>
            <p className="text-sm text-zinc-400">Paste your raw PostgreSQL EXPLAIN ANALYZE logs below to kickstart diagnostic parsing.</p>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4 flex-1 flex flex-col">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Estimated Metric (Execution Time ms)</label>
              <input
                type="number"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="4200"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">Execution Text Log Payload</label>
              <textarea
                value={rawLog}
                onChange={(e) => setRawLog(e.target.value)}
                className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs font-mono focus:outline-none focus:border-teal-500 transition-colors min-h-[300px] resize-none"
                placeholder="Paste plan output here... e.g. -> Seq Scan on users..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !rawLog.trim()}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-medium py-3 px-4 rounded-lg text-sm tracking-wide transition-all font-mono"
            >
              {loading ? 'PROCESSING METRICS ENGINE...' : 'ANALYZE EXECUTION PLAN'}
            </button>
          </form>
        </section>

        {/* Right Column: AI Analytics Breakdown Output */}
        <section className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 flex flex-col min-h-[450px]">
          <h2 className="text-lg font-medium text-zinc-200 mb-4">Diagnostic Evaluation Output</h2>

          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-400 p-4 rounded-lg text-sm font-mono">
              ❌ Pipeline Exception: {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm">No analysis active. Submit an optimization log on the left workspace panel to compile recommendations.</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-zinc-400 animate-pulse">Running Gemini Schema Mapping & DB Write Operations...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 flex-1 animate-fadeIn">
              {/* Telemetry Overview Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <span className="block text-xs font-mono text-zinc-500 uppercase">Log Track ID</span>
                  <span className="text-xs font-mono text-zinc-300 truncate block mt-1">{result.id}</span>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <span className="block text-xs font-mono text-zinc-500 uppercase">Latency Metric</span>
                  <span className="text-sm font-mono text-teal-400 block mt-1 font-bold">{result.execution_time_ms} ms</span>
                </div>
              </div>

              {/* Core Bottleneck Alert Banner */}
              <div className={`p-5 rounded-lg border flex flex-col space-y-2 ${getSeverityBadgeColor(result.summary_json.severity)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase">[{result.summary_json.severity} SEVERITY DETECTED]</span>
                  <span className="text-xs font-mono bg-black/40 px-2.5 py-0.5 rounded border border-current">
                    Table: {result.summary_json.table}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono pt-1">
                  Bottleneck: {result.summary_json.bottleneck}
                </div>
              </div>

              {/* Action Remediation Strategy Block */}
              <div className="bg-zinc-950 p-5 rounded-lg border border-zinc-800 flex flex-col space-y-3 flex-1">
                <div>
                  <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Automated Remediation Script</h3>
                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{result.summary_json.remediation}</p>
                </div>
                
                {/* Clean inline function execution avoids JSX engine conflicts */}
                <div className="bg-zinc-900 p-3 rounded font-mono text-xs text-teal-300 border border-zinc-800 select-all cursor-pointer overflow-x-auto whitespace-pre-wrap">
                  {renderSqlBlock(result.summary_json.remediation, result.summary_json.table)}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}