
import React, { useEffect, useState } from 'react';
import { NexusNode } from '../types';
import { X, Check, Database, Bot, AlertTriangle, Layers, Wrench } from 'lucide-react';
import { SDK_REGISTRY, SdkParamDefinition, ServiceDefinition, SdkActionDefinition, TOOL_REGISTRY } from '../sdkDefinitions';

interface PropertiesPanelProps {
  selectedNode: NexusNode | null;
  updateNodeData: (id: string, newData: any) => void;
  closePanel: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, updateNodeData, closePanel }) => {
  const [localLabel, setLocalLabel] = useState('');
  const [config, setConfig] = useState<any>({});
  
  useEffect(() => {
    if (selectedNode) {
      setLocalLabel(selectedNode.data.label);
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const currentService: ServiceDefinition | undefined = SDK_REGISTRY[config.serviceId];
  const currentAction: SdkActionDefinition | undefined = currentService?.actions.find(a => a.id === config.actionId);

  // Available Services
  const availableServices = Object.values(SDK_REGISTRY).filter(svc => {
    if (selectedNode.data.type === 'SDK_ACTION') return svc.category !== 'ai_cloud' && svc.category !== 'ai_local';
    if (selectedNode.data.type === 'AI_AGENT') return svc.category.startsWith('ai_');
    return false;
  });

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    if (key === 'serviceId') {
      newConfig.actionId = '';
      newConfig.parameters = {};
      const svc = SDK_REGISTRY[value];
      if (svc?.defaultCredentialsId) newConfig.credentialsId = svc.defaultCredentialsId;
    }
    setConfig(newConfig);
  };

  const handleParamChange = (paramName: string, value: any) => {
    const newParams = { ...(config.parameters || {}), [paramName]: value };
    setConfig({ ...config, parameters: newParams });
  };

  const toggleTool = (toolId: string) => {
    const currentTools = config.tools || [];
    if (currentTools.includes(toolId)) {
      setConfig({ ...config, tools: currentTools.filter((t: string) => t !== toolId) });
    } else {
      setConfig({ ...config, tools: [...currentTools, toolId] });
    }
  };

  const saveChanges = () => {
    updateNodeData(selectedNode.id, { label: localLabel, config: config });
  };

  const renderInput = (param: SdkParamDefinition) => {
    const val = config.parameters?.[param.name] ?? param.defaultValue ?? '';
    if (param.type === 'boolean') {
      return (
        <select value={String(val)} onChange={e => handleParamChange(param.name, e.target.value === 'true')} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200">
          <option value="true">True</option><option value="false">False</option>
        </select>
      );
    }
    if (param.type === 'select') {
      return (
        <select value={val} onChange={e => handleParamChange(param.name, e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200">
           {param.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    return (
      <input 
        type={param.type === 'number' ? 'number' : 'text'}
        value={val}
        onChange={e => handleParamChange(param.name, param.type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={param.placeholder}
        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none font-mono"
      />
    );
  };

  return (
    <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shadow-2xl z-20">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">Properties</h2>
          <p className="text-xs text-zinc-500 font-mono">Type: {selectedNode.data.type}</p>
        </div>
        <button onClick={closePanel} className="text-zinc-500 hover:text-white"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Node Label</label>
          <input value={localLabel} onChange={(e) => setLocalLabel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 outline-none" />
        </div>

        {selectedNode.data.type !== 'WAIT' && selectedNode.data.type !== 'TRIGGER' && (
          <>
            {/* Service & Action */}
            <div className="space-y-4 border border-zinc-800 bg-zinc-900/50 p-3 rounded-lg">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2">
                  {selectedNode.data.type === 'AI_AGENT' ? <Bot size={12}/> : <Database size={12}/>} Provider
                </label>
                <select value={config.serviceId || ''} onChange={(e) => handleConfigChange('serviceId', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 outline-none">
                  <option value="">-- Select --</option>
                  {availableServices.map(svc => <option key={svc.id} value={svc.id}>{svc.name}</option>)}
                </select>
              </div>

              {currentService && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Method</label>
                  <select value={config.actionId || ''} onChange={(e) => handleConfigChange('actionId', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 outline-none">
                    <option value="">-- Select Action --</option>
                    {currentService.actions.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            
            {/* AI Specific Config: Mode & Tools */}
            {selectedNode.data.type === 'AI_AGENT' && (
              <div className="space-y-4 border border-zinc-800 bg-zinc-900/50 p-3 rounded-lg">
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2"><Layers size={12}/> Execution Mode</label>
                    <div className="flex bg-zinc-950 p-1 rounded border border-zinc-800">
                       <button onClick={() => handleConfigChange('mode', 'simple_agent')} className={`flex-1 text-xs py-1 rounded ${(!config.mode || config.mode === 'simple_agent') ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Simple Agent</button>
                       <button onClick={() => handleConfigChange('mode', 'custom_graph')} className={`flex-1 text-xs py-1 rounded ${config.mode === 'custom_graph' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Custom Graph</button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase flex items-center gap-2"><Wrench size={12}/> Enable Tools</label>
                    <div className="space-y-1">
                      {TOOL_REGISTRY.map(tool => (
                        <div key={tool.id} onClick={() => toggleTool(tool.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer border ${config.tools?.includes(tool.id) ? 'bg-purple-900/30 border-purple-500 text-purple-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                           <Check size={10} className={config.tools?.includes(tool.id) ? 'opacity-100' : 'opacity-0'} />
                           <span className="text-xs">{tool.name}</span>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            )}

            {/* Params */}
            {currentAction && (
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div className="text-xs font-bold text-zinc-300 uppercase">Parameters</div>
                {currentAction.params.map(param => (
                  <div key={param.name} className="space-y-1">
                    <div className="flex justify-between">
                       <label className="text-xs text-zinc-400">{param.label}</label>
                       {param.required && <span className="text-[9px] text-red-400 font-mono">*REQ</span>}
                    </div>
                    {renderInput(param)}
                  </div>
                ))}
              </div>
            )}
            
            {/* Secrets Hint */}
             {currentService?.defaultCredentialsId && (
              <div className="pt-4 border-t border-zinc-800 text-[10px] text-zinc-600 flex gap-1">
                <AlertTriangle size={10} /> Requires secret: <span className="text-yellow-600 font-mono">{config.credentialsId || currentService.defaultCredentialsId}</span>
              </div>
             )}
          </>
        )}

        {selectedNode.data.type === 'WAIT' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase">Duration</label>
            <input value={config.duration || ''} onChange={(e) => handleConfigChange('duration', e.target.value)} placeholder="e.g. 5s" className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none" />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <button onClick={saveChanges} className="w-full flex justify-center items-center gap-2 bg-white text-black py-2 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors">
          <Check size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
};
