import React, { useState } from 'react';
import { Sparkles, BrainCircuit, ChevronRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzePerformance } from '../services/geminiService';
import { AggregatedData, DashboardSummary } from '../types';

interface Props {
  summary: DashboardSummary;
  breakdown: AggregatedData[];
  dateRange: { start: string; end: string };
}

const AIAnalyst: React.FC<Props> = ({ summary, breakdown, dateRange }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setExpanded(true);
    try {
      const result = await analyzePerformance(summary, breakdown, dateRange);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Failed to generate analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden mb-12">
      <div className="p-6 border-b border-indigo-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">AI Performance Analyst</h3>
            <p className="text-sm text-slate-500">Deep insight powered by Gemini 3 Pro (Thinking Mode)</p>
          </div>
        </div>
        
        {!expanded && (
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            <BrainCircuit className="w-4 h-4" />
            Analyze Data
          </button>
        )}
      </div>

      {expanded && (
        <div className="p-6 min-h-[200px] bg-white/50 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <div className="text-center space-y-1">
                <p className="text-slate-800 font-medium">Analyzing data patterns...</p>
                <p className="text-xs">Thinking Budget: 32k tokens</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-indigo prose-sm max-w-none text-slate-700 custom-scrollbar overflow-y-auto max-h-[600px]">
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 mb-4 mt-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-slate-800 mb-3 mt-6 border-b border-indigo-100 pb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-semibold text-indigo-900 mb-2 mt-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
                  li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                }}
              >
                {analysis || ""}
              </ReactMarkdown>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setExpanded(false)}
                  className="text-sm text-slate-500 hover:text-indigo-600 font-medium px-4 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Close Analysis
                </button>
                <button 
                  onClick={handleAnalyze}
                  className="ml-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2"
                >
                   <Sparkles className="w-3 h-3" /> Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalyst;
