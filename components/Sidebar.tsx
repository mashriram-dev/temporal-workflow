import React, { useState, useMemo } from 'react';
import { Bot, Zap, Clock, PlayCircle, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { NodeType } from '../types';
import { SDK_REGISTRY, ServiceDefinition } from '../sdkDefinitions';
import * as LucideIcons from 'lucide-react';

interface ServiceItemProps {
  svc: ServiceDefinition;
  onDragStart: (event: React.DragEvent, nodeType: NodeType, label: string, config?: any) => void;
}

const ServiceItem = ({ svc, onDragStart }: ServiceItemProps) => {
  // Dynamic Icon
  const IconComp = (LucideIcons as any)[svc.icon] || Zap;
  
  // Determine Node Type based on category
  const isAi = svc.category.startsWith('ai_');
  const type: NodeType = isAi ? 'AI_AGENT' : 'SDK_ACTION';

  return (
    <div 
      className="flex items-center gap-3 p-2 ml-2 bg-zinc-800/20 border border-transparent hover:bg-zinc-800 hover:border-zinc-700 rounded-md cursor-grab transition-colors"
      onDragStart={(e) => onDragStart(e, type, `New ${svc.name}`, { serviceId: svc.id })}
      draggable
    >
      <IconComp size={14} className={isAi ? "text-purple-400" : "text-blue-400"} />
      <div className="text-sm text-zinc-300">{svc.name}</div>
    </div>
  );
};

export const Sidebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Core': true, 'crm': true, 'dev': false, 'ai': true
  });

  const onDragStart = (event: React.DragEvent, nodeType: NodeType, label: string, config: any = {}) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.setData('application/reactflow/config', JSON.stringify(config));
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCat = (cat: string) => setExpandedCategories(p => ({ ...p, [cat]: !p[cat] }));

  // Group Definitions
  const categories = useMemo(() => {
    const groups: Record<string, ServiceDefinition[]> = {};
    Object.values(SDK_REGISTRY).forEach(svc => {
      if (!groups[svc.category]) groups[svc.category] = [];
      groups[svc.category].push(svc);
    });
    return groups;
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return null;
    return Object.values(SDK_REGISTRY).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full select-none">
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">Toolbox</h2>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
          <input 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2 py-2 text-xs text-white focus:border-blue-500 outline-none"
            placeholder="Search 100+ Integrations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        
        {/* Search Results */}
        {searchTerm && filteredServices && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-zinc-500 px-2 py-1 uppercase">Results</div>
            {filteredServices.map(svc => <ServiceItem key={svc.id} svc={svc} onDragStart={onDragStart} />)}
            {filteredServices.length === 0 && <div className="text-xs text-zinc-600 px-4">No results found.</div>}
          </div>
        )}

        {/* Standard Categories */}
        {!searchTerm && (
          <>
            {/* Logic Primitives */}
            <div>
              <button onClick={() => toggleCat('Core')} className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded text-xs font-semibold text-zinc-400 uppercase">
                <span>Logic</span>
                {expandedCategories['Core'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedCategories['Core'] && (
                <div className="space-y-1 mt-1">
                   <div className="flex items-center gap-3 p-2 ml-2 bg-zinc-800/20 hover:bg-zinc-800 rounded-md cursor-grab" onDragStart={(e) => onDragStart(e, 'WAIT', 'Wait 5s')} draggable>
                      <Clock size={14} className="text-amber-400" />
                      <div className="text-sm text-zinc-300">Wait / Delay</div>
                   </div>
                </div>
              )}
            </div>

            {/* AI */}
             <div>
              <button onClick={() => toggleCat('ai')} className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded text-xs font-semibold text-zinc-400 uppercase">
                <span>AI Models</span>
                {expandedCategories['ai'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedCategories['ai'] && (
                <div className="space-y-1 mt-1">
                   {[...categories['ai_cloud'] || [], ...categories['ai_local'] || []].map(svc => (
                     <ServiceItem key={svc.id} svc={svc} onDragStart={onDragStart} />
                   ))}
                </div>
              )}
            </div>

            {/* Integration Categories */}
            {['crm', 'dev', 'productivity', 'finance', 'communication'].map(cat => (
              categories[cat] && (
                <div key={cat}>
                  <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded text-xs font-semibold text-zinc-400 uppercase">
                    <span>{cat}</span>
                    {expandedCategories[cat] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expandedCategories[cat] && (
                    <div className="space-y-1 mt-1">
                      {categories[cat].map(svc => <ServiceItem key={svc.id} svc={svc} onDragStart={onDragStart} />)}
                    </div>
                  )}
                </div>
              )
            ))}
          </>
        )}
      </div>
    </aside>
  );
};