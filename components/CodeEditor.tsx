
import React from 'react';
import { Copy } from 'lucide-react';

export const CodeEditor = ({ code }: { code: string }) => {
  return (
    <div className="h-full w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm flex flex-col">
       <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
          <span className="text-xs font-bold text-zinc-400">workflow.ts</span>
          <button className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white" onClick={() => navigator.clipboard.writeText(code)}>
            <Copy size={12} /> Copy
          </button>
       </div>
       <div className="flex-1 overflow-auto p-4">
         <pre>
           <code>{code}</code>
         </pre>
       </div>
    </div>
  );
};
