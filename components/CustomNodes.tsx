
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Zap, Clock, PlayCircle, Loader2, CheckCircle2, XCircle, AlertTriangle, HardDrive, BrainCircuit, Wrench } from 'lucide-react';
import { WorkflowNodeData, WorkflowStatus } from '../types';
import { SDK_REGISTRY, TOOL_REGISTRY } from '../sdkDefinitions';

const StatusBadge = ({ status }: { status?: WorkflowStatus }) => {
  if (status === 'running') return <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 animate-pulse"><Loader2 size={12} className="text-white animate-spin" /></div>;
  if (status === 'completed') return <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1"><CheckCircle2 size={12} className="text-white" /></div>;
  if (status === 'failed') return <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><XCircle size={12} className="text-white" /></div>;
  return null;
};

const NodeWrapper = ({ children, selected, colorClass, title, icon: Icon, status }: any) => (
  <div className={`relative min-w-[240px] max-w-[280px] rounded-lg border-2 bg-zinc-900 transition-all shadow-xl ${status === 'failed' ? 'border-red-500' : selected ? 'border-white' : 'border-zinc-800'}`}>
    <StatusBadge status={status} />
    <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 rounded-t-md bg-zinc-950/30">
      <div className={`p-1.5 rounded-md ${colorClass} text-white`}><Icon size={14} /></div>
      <span className="text-xs font-bold uppercase text-zinc-300">{title}</span>
    </div>
    <div className="p-3 relative">{children}</div>
  </div>
);

export const TriggerNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => (
  <NodeWrapper selected={selected} colorClass="bg-emerald-600" title="Trigger" icon={PlayCircle} status={data.status}>
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
    <div className="text-sm text-zinc-100">{data.label}</div>
  </NodeWrapper>
));

export const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const svc = SDK_REGISTRY[data.config.serviceId];
  const act = svc?.actions.find(a => a.id === data.config.actionId);
  return (
    <NodeWrapper selected={selected} colorClass="bg-blue-600" title="Integration" icon={Zap} status={data.status}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-600" />
      <div className="text-sm text-zinc-100">{data.label}</div>
      <div className="mt-2 text-xs text-zinc-500 bg-zinc-950 p-1.5 rounded border border-zinc-800 flex items-center gap-2">
         {svc ? svc.name : 'Select Service'} <span className="text-zinc-700">/</span> {act ? act.name : '...'}
      </div>
      {data.error && <div className="mt-2 text-[10px] text-red-300 bg-red-900/20 p-1 rounded flex gap-1"><AlertTriangle size={10}/> {data.error}</div>}
      {data.result && <div className="mt-2 text-[9px] text-green-400 bg-zinc-950 p-1 font-mono break-all">{JSON.stringify(data.result).slice(0, 100)}...</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </NodeWrapper>
  );
});

export const AiNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const isLocal = data.config.serviceId === 'ollama' || data.config.serviceId === 'vllm';
  const tools = data.config.tools || [];
  
  return (
    <NodeWrapper selected={selected} colorClass="bg-purple-600" title="AI Agent" icon={isLocal ? HardDrive : BrainCircuit} status={data.status}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-600" />
      <div className="text-sm text-zinc-100">{data.label}</div>
      
      <div className="mt-2 flex flex-wrap gap-1">
         <span className={`text-[10px] px-1 rounded border ${isLocal ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {data.config.serviceId || 'Select Provider'}
         </span>
      </div>

      {tools.length > 0 && (
         <div className="mt-1 flex flex-wrap gap-1">
            {tools.map((t: string) => {
              const td = TOOL_REGISTRY.find(x => x.id === t);
              return (
                <span key={t} className="text-[9px] px-1 rounded bg-purple-900/30 text-purple-300 border border-purple-800 flex items-center gap-1">
                  <Wrench size={8} /> {td ? td.name.split(' ')[0] : t}
                </span>
              );
            })}
         </div>
      )}

      {data.status === 'running' && <div className="mt-2 text-[10px] text-purple-300 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Thinking...</div>}
      
      {data.result && (
        <div className="mt-2 max-h-[80px] overflow-y-auto bg-zinc-950 p-2 rounded border border-zinc-800">
          <p className="text-[10px] text-zinc-300">{data.result.answer}</p>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
    </NodeWrapper>
  );
});

export const WaitNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => (
  <NodeWrapper selected={selected} colorClass="bg-amber-600" title="Wait" icon={Clock} status={data.status}>
    <Handle type="target" position={Position.Top} className="!bg-zinc-600" />
    <div className="text-sm text-zinc-100">{data.label}</div>
    <div className="text-xs text-zinc-500 mt-1">{data.config.duration || '0s'}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
  </NodeWrapper>
));
