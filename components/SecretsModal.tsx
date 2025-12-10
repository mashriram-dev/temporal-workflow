
import React, { useState } from 'react';
import { X, Key, Plus, Trash2, Eye, EyeOff, Save } from 'lucide-react';

interface SecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
  secrets: Record<string, string>;
  onSave: (secrets: Record<string, string>) => void;
}

export const SecretsModal: React.FC<SecretsModalProps> = ({ isOpen, onClose, secrets, onSave }) => {
  const [localSecrets, setLocalSecrets] = useState<Record<string, string>>(secrets);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValues, setShowValues] = useState(false);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newKey.trim()) return;
    setLocalSecrets(prev => ({ ...prev, [newKey.trim()]: newValue.trim() }));
    setNewKey('');
    setNewValue('');
  };

  const handleDelete = (key: string) => {
    const next = { ...localSecrets };
    delete next[key];
    setLocalSecrets(next);
  };

  const handleSave = () => {
    onSave(localSecrets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
               <Key size={18} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Environment Variables</h2>
              <p className="text-xs text-zinc-500">Secure Vault Simulation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-3 text-xs text-blue-200">
             In production, these would be stored in HashiCorp Vault or AWS Secrets Manager. 
             Here, they are stored in browser memory to simulate authentication logic.
          </div>

          {/* List */}
          <div className="space-y-2">
            {Object.entries(localSecrets).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-800 group">
                <div className="flex-1 font-mono text-xs text-yellow-500 truncate">{key}</div>
                <div className="font-mono text-xs text-zinc-500">
                  {showValues ? val : '••••••••••••••••'}
                </div>
                <button 
                  onClick={() => handleDelete(key)}
                  className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {Object.keys(localSecrets).length === 0 && (
               <div className="text-center py-4 text-xs text-zinc-600 italic">No secrets defined yet.</div>
            )}
          </div>

          {/* Add New */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pt-4 border-t border-zinc-800">
             <input 
               placeholder="KEY (e.g. SLACK_TOKEN)"
               value={newKey}
               onChange={e => setNewKey(e.target.value)}
               className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-yellow-500 focus:outline-none"
             />
             <input 
               placeholder="VALUE"
               type={showValues ? "text" : "password"}
               value={newValue}
               onChange={e => setNewValue(e.target.value)}
               className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-yellow-500 focus:outline-none"
             />
             <button 
               onClick={handleAdd}
               disabled={!newKey}
               className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded disabled:opacity-50"
             >
               <Plus size={16} />
             </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-b-xl">
           <button 
             onClick={() => setShowValues(!showValues)} 
             className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-300"
           >
             {showValues ? <EyeOff size={14} /> : <Eye size={14} />}
             {showValues ? 'Hide Values' : 'Show Values'}
           </button>
           <button 
             onClick={handleSave}
             className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-zinc-200 transition-colors"
           >
             <Save size={16} />
             Save & Close
           </button>
        </div>
      </div>
    </div>
  );
};
