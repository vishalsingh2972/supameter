'use client';

import { useState, useEffect } from 'react';

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
  
  const [historyLogs, setHistoryLogs] = useState<DiagnosticData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/logs');
      const json = await res.json();
      if (json.success) {
        setHistoryLogs(json.data || []);
      }
    } catch (err) {
      console.error('Failed to update history sidebar container:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
      if (!json.success) throw new Error(json.error || 'Failed to analyze query log pipeline');

      setResult(json.data);
      fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/logs?id=${id}`, { method: 'DELETE' });
      const json = await response.json();
      
      if (json.success) {
        if (result?.id === id) {
          setResult(null);
        }
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to execute row delete action:', err);
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
      <header className="border-b border-zinc-800 px-6 py-4 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tight text-teal-400 font-mono">SupaMeter_AI</span>
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono">v1.2</span>
          </div>
          <div className="text-sm text-zinc-400 font-mono">⚡ Performance Gateway Enabled</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Sidebar Panel with explicit action layout */}
        <aside className="xl:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex flex-col h-[740px]">
          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3 pb-2 border-b border-zinc-800 flex justify-between items-center">
            <span>Analysis History</span>
            <button onClick={fetchHistory} className="text-teal-500 hover:text-teal-400 text-[10px]">🔄 Refresh</button>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {historyLoading && historyLogs.length === 0 && (
              <p className="text-xs font-mono text-zinc-600 animate-pulse text-center pt-4">Loading store rows...</p>
            )}
            {!historyLoading && historyLogs.length === 0 && (
              <p className="text-xs font-mono text-zinc-600 text-center pt-4">No logged history records found.</p>
            )}
            {historyLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setResult(log)}
                className={`group relative p-3 rounded-lg border text-left cursor-pointer transition-all hover:bg-zinc-800/40 ${
                  result?.id === log.id ? 'bg-zinc-900 border-teal-500' : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                {/* Header Row: Metadata on Left, Hover-Driven Trash Button on Right */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 truncate text-zinc-400 max-w-[90px]">
                      {log.summary_json.table}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                      log.summary_json.severity === 'CRITICAL' ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                      {log.summary_json.severity}
                    </span>
                  </div>
                  
                  {/* Hover-revealed Prune Action Button */}
                  <button
                    onClick={(e) => handleDelete(e, log.id)}
                    className="opacity-0 group-hover:opacity-100 bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 rounded px-1.5 py-0.5 transition-all font-sans text-xs flex items-center justify-center shadow-sm"
                    title="Prune Record From DB"
                  >
                    🗑️
                  </button>
                </div>
                
                <p className="text-xs font-medium text-zinc-300 truncate font-mono">{log.summary_json.bottleneck}</p>
                <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Workspace Layout block */}
        <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-fit">
          <section className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 flex flex-col space-y-4 h-[670px]">
            <div>
              <h2 className="text-lg font-medium text-zinc-200">Query Telemetry Input</h2>
              <p className="text-sm text-zinc-400">Paste your raw PostgreSQL EXPLAIN ANALYZE logs below.</p>
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
                  className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs font-mono focus:outline-none focus:border-teal-500 transition-colors resize-none"
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

          <section className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 flex flex-col min-h-[670px]">
            <h2 className="text-lg font-medium text-zinc-200 mb-4">Diagnostic Evaluation Output</h2>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-400 p-4 rounded-lg text-sm font-mono">
                ❌ Pipeline Exception: {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center text-zinc-500 h-[500px]">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm">No analysis active. Submit an optimization log on the left workspace panel or select an entry from the history panel.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 h-[500px]">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-zinc-400 animate-pulse">Running Gemini Schema Mapping & DB Write Operations...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 flex-1 animate-fadeIn">
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

                <div className="bg-zinc-950 p-5 rounded-lg border border-zinc-800 flex flex-col space-y-3">
                  <div>
                    <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Automated Remediation Script</h3>
                    <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{result.summary_json.remediation}</p>
                  </div>
                  
                  <div className="bg-zinc-900 p-3 rounded font-mono text-xs text-teal-300 border border-zinc-800 select-all cursor-pointer overflow-x-auto whitespace-pre-wrap">
                    {renderSqlBlock(result.summary_json.remediation, result.summary_json.table)}
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <span className="block text-xs font-mono text-zinc-500 uppercase mb-2">Original Log Analyzed</span>
                  <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto bg-zinc-900 p-3 rounded border border-zinc-800 max-h-[120px] whitespace-pre-wrap">
                    {result.raw_explain_text}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}