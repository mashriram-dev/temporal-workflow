
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  BackgroundVariant,
  Panel,
  getIncomers,
} from 'reactflow';
import { Sidebar } from './components/Sidebar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { SecretsModal } from './components/SecretsModal';
import { TriggerNode, ActionNode, AiNode, WaitNode } from './components/CustomNodes';
import { INITIAL_NODES, NodeType, NexusNode, LogEntry } from './types';
import { Play, Loader2, Key, Code2, LayoutTemplate } from 'lucide-react';
import { AiEngine } from './utils/aiEngine';
import { CodeEditor } from './components/CodeEditor';
import { generateSdkCode } from './utils/codeGenerator';

const AppContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [generatedCode, setGeneratedCode] = useState('');
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isSecretsOpen, setIsSecretsOpen] = useState(false);
  const [secrets, setSecrets] = useState<Record<string, string>>({
    'SLACK_TOKEN': 'xoxb-demo-token',
  });

  // Regenerate Code when Graph Changes
  useEffect(() => {
    if (activeTab === 'code') {
      setGeneratedCode(generateSdkCode(nodes, edges));
    }
  }, [nodes, edges, activeTab]);

  const nodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    action: ActionNode,
    ai: AiNode,
    wait: WaitNode,
  }), []);

  const addLog = (level: LogEntry['level'], message: string, nodeId?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36),
      timestamp: Date.now(),
      level,
      message,
      nodeId
    }]);
  };

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#71717a' } }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type') as NodeType;
      const label = event.dataTransfer.getData('application/reactflow/label');
      const configStr = event.dataTransfer.getData('application/reactflow/config');
      
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const config = configStr ? JSON.parse(configStr) : {};

      const newNode: NexusNode = {
        id: `${type.toLowerCase()}-${Date.now()}`,
        type: type === 'TRIGGER' ? 'trigger' : type === 'SDK_ACTION' ? 'action' : type === 'AI_AGENT' ? 'ai' : 'wait',
        position,
        data: { label, type, status: 'idle', config },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const runWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setIsConsoleOpen(true);
    setLogs([]);
    addLog('info', 'Starting Workflow Execution...');

    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', result: undefined, error: undefined } })));

    // Topological Execution
    const processed = new Set<string>();
    const nodeResults = new Map<string, any>();
    
    // Initial: Trigger
    const startNode = nodes.find(n => n.data.type === 'TRIGGER');
    if (startNode) {
       nodeResults.set(startNode.id, { event: 'manual_run', timestamp: Date.now() });
       processed.add(startNode.id);
       addLog('success', 'Trigger Activated', startNode.id);
    } else {
       addLog('error', 'No Trigger Node found');
       setIsExecuting(false);
       return;
    }

    let active = true;
    while(active) {
       active = false;
       const candidates = nodes.filter(n => !processed.has(n.id));
       
       for (const node of candidates) {
         const incomers = getIncomers(node, nodes, edges);
         const parentsReady = incomers.length > 0 && incomers.every(p => processed.has(p.id));
         
         if (parentsReady) {
            active = true;
            setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n));
            addLog('info', `Running ${node.data.label}...`, node.id);

            // Fetch Inputs from Parent
            const inputs = incomers.reduce((acc, parent) => ({ ...acc, ...nodeResults.get(parent.id) }), {});

            try {
              let result;
              const config = node.data.config;
              
              // 1. AI EXECUTION (Real)
              if (node.data.type === 'AI_AGENT') {
                 if (['openai', 'anthropic', 'ollama', 'vllm'].includes(config.serviceId)) {
                    addLog('info', `Connecting to ${config.serviceId}...`, node.id);
                    result = await AiEngine.execute(config.serviceId, config.actionId, config.parameters, secrets);
                 } else {
                    result = { answer: "Simulated AI Response (Service not found)" };
                 }
              }
              
              // 2. SDK EXECUTION (Strict Simulation)
              else if (node.data.type === 'SDK_ACTION') {
                 const credId = config.credentialsId;
                 
                 // Strict Check
                 if (credId && !secrets[credId]) {
                    throw new Error(`MISSING SECRET: ${credId}. Please add it in Secrets Panel.`);
                 }
                 
                 await new Promise(r => setTimeout(r, 800)); // Latency
                 
                 // Strict Echo - No Default Success
                 result = {
                   status: 'executed',
                   service: config.serviceId,
                   action: config.actionId,
                   input_params: config.parameters,
                   upstream_data: inputs, // Prove data flow
                   timestamp: new Date().toISOString()
                 };

                 // Specific Mocks for Demo Visuals
                 if (config.serviceId === 'slack' && config.actionId === 'chat.postMessage') {
                    result = { ...result, slack_channel_id: 'C123456', message_ts: '17000000.0001' };
                 }
              }

              else if (node.data.type === 'WAIT') {
                 await new Promise(r => setTimeout(r, 1500));
                 result = { waited: true };
              }

              nodeResults.set(node.id, result);
              processed.add(node.id);
              addLog('success', `Completed: ${node.data.label}`, node.id);
              setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'completed', result } } : n));
            } catch (err: any) {
              addLog('error', err.message, node.id);
              setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'failed', error: err.message } } : n));
            }
         }
       }
       if (active) await new Promise(r => setTimeout(r, 100)); 
    }
    
    setIsExecuting(false);
    addLog('info', 'Workflow Run Finished');
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden flex-col">
      <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white">N</div>
          <div><h1 className="text-zinc-100 font-bold">Nexus Studio</h1></div>
          {/* Tab Switcher */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 ml-8">
            <button onClick={() => setActiveTab('visual')} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'visual' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
               <LayoutTemplate size={12} /> Visual
            </button>
            <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'code' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
               <Code2 size={12} /> Code
            </button>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsSecretsOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded">
            <Key size={14} /> Secrets
          </button>
          <button onClick={runWorkflow} disabled={isExecuting} className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded ${isExecuting ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200'}`}>
            {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Visual Editor */}
        <div className={`flex-1 relative ${activeTab === 'visual' ? 'block' : 'hidden'}`} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onInit={setReactFlowInstance}
            onDrop={onDrop} onDragOver={onDragOver}
            onNodeClick={(_, n) => setSelectedNodeId(n.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes} fitView className="bg-zinc-950"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#27272a" />
            <Controls className="!bg-zinc-900 !border-zinc-700" />
            <Panel position="top-center">
               <div className="bg-zinc-900/80 backdrop-blur px-3 py-1 rounded-full text-xs text-zinc-400 border border-zinc-700">
                 {isExecuting ? 'Status: Running' : 'Status: Ready'}
               </div>
            </Panel>
          </ReactFlow>
          <ConsolePanel logs={logs} isOpen={isConsoleOpen} onToggle={() => setIsConsoleOpen(!isConsoleOpen)} onClear={() => setLogs([])} />
        </div>

        {/* Code Editor */}
        <div className={`flex-1 relative ${activeTab === 'code' ? 'block' : 'hidden'}`}>
           <CodeEditor code={generatedCode} />
        </div>

        {selectedNodeId && activeTab === 'visual' && (
          <PropertiesPanel 
            selectedNode={nodes.find(n => n.id === selectedNodeId) || null} 
            updateNodeData={(id, data) => setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n))}
            closePanel={() => setSelectedNodeId(null)} 
          />
        )}
      </div>

      <SecretsModal isOpen={isSecretsOpen} onClose={() => setIsSecretsOpen(false)} secrets={secrets} onSave={setSecrets} />
    </div>
  );
};

export default function App() {
  return <ReactFlowProvider><AppContent /></ReactFlowProvider>;
}
