
// --- Core Workflow Types ---
import { Node, Edge } from 'reactflow';

export type NodeType = 
  | 'TRIGGER' 
  | 'SDK_ACTION' 
  | 'AI_AGENT' 
  | 'WAIT';

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: Record<string, any>; // Dynamic config based on Registry
  status?: WorkflowStatus;
  result?: any;
  error?: string;
  isParallel?: boolean;
}

// Defines a generic Action or AI Task
export interface NodeConfig {
  serviceId: string;      
  actionId: string;       
  credentialsId?: string; 
  parameters: Record<string, any>;
}

export interface AiConfig extends NodeConfig {
  mode: 'simple_agent' | 'custom_graph';
  tools?: string[]; // IDs of enabled tools
  systemPrompt?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'error' | 'success';
  message: string;
  nodeId?: string;
}

// React Flow Types
export type NexusNode = Node<WorkflowNodeData>;
export type NexusEdge = Edge;

export const INITIAL_NODES: NexusNode[] = [
  {
    id: 'start-1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Webhook Start', 
      type: 'TRIGGER', 
      status: 'idle',
      config: {} 
    },
  },
];
