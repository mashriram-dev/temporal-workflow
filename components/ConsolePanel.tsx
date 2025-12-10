
import React, { useRef, useEffect } from 'react';
import { Terminal, X, Minimize2, Maximize2 } from 'lucide-react';
import { LogEntry } from '../types';

interface ConsolePanelProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, isOpen, onToggle, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white px-3 py-2 rounded-md shadow-xl flex items-center gap-2 text-xs font-mono z-50 transition-colors"
      >
        <Terminal size={14} />
        Console ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-black/95 border-t border-zinc-800 z-50 flex flex-col shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Execution Console</span>
          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-mono">{logs.length} events</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors">
            Clear
          </button>
          <button onClick={onToggle} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors">
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* Logs */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {logs.length === 0 && (
           <div className="text-zinc-600 italic text-center mt-10">No logs available. Run the workflow to see output.</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 hover:bg-zinc-900/50 p-0.5 rounded">
            <span className="text-zinc-600 min-w-[70px] shrink-0">
               {new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}.{new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0')}
            </span>
            <span className={`
               uppercase font-bold min-w-[60px] shrink-0
               ${log.level === 'info' ? 'text-blue-500' : ''}
               ${log.level === 'success' ? 'text-emerald-500' : ''}
               ${log.level === 'error' ? 'text-red-500' : ''}
            `}>
               [{log.level}]
            </span>
            <span className={`whitespace-pre-wrap break-all ${log.level === 'error' ? 'text-red-300' : 'text-zinc-300'}`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
