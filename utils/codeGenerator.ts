
import { NexusNode, NexusEdge } from '../types';

export const generateSdkCode = (nodes: NexusNode[], edges: NexusEdge[]): string => {
  if (nodes.length === 0) return '// No nodes to generate code from.';

  let code = `import { WorkflowBuilder } from '@nexus/sdk';\n\n`;
  code += `export const myWorkflow = new WorkflowBuilder()\n`;

  // 1. Find Start Node
  const trigger = nodes.find(n => n.data.type === 'TRIGGER');
  if (!trigger) return '// Error: No Trigger Node Found';

  code += `  .trigger('${trigger.data.label}')\n`;

  // 2. Linear Traversal (Simplification for this demo)
  // In a real generic graph, we would do a topological sort.
  // We will assume a linear chain for the code generation demo.
  
  let currentNode = trigger;
  const visited = new Set<string>([trigger.id]);

  while (true) {
    // Find generic outgoing edge
    const edge = edges.find(e => e.source === currentNode.id);
    if (!edge) break;

    const nextNode = nodes.find(n => n.id === edge.target);
    if (!nextNode || visited.has(nextNode.id)) break;

    // Generate Code Step
    const { type, config, label } = nextNode.data;
    const stepName = label.replace(/\s+/g, '_').toLowerCase();

    if (type === 'SDK_ACTION') {
      code += `  .action('${stepName}', {\n`;
      code += `    service: '${config.serviceId}',\n`;
      code += `    method: '${config.actionId}',\n`;
      if (config.credentialsId) code += `    credentialsId: '${config.credentialsId}',\n`;
      code += `    parameters: ${JSON.stringify(config.parameters, null, 6).replace('}', '    }')}\n`;
      code += `  })\n`;
    } 
    else if (type === 'AI_AGENT') {
      code += `  .ai('${stepName}', {\n`;
      code += `    provider: '${config.serviceId}',\n`;
      code += `    model: '${config.parameters?.model}',\n`;
      code += `    mode: '${config.mode || 'simple_agent'}',\n`;
      if (config.tools && config.tools.length > 0) {
        code += `    tools: ${JSON.stringify(config.tools)},\n`;
      }
      code += `    systemPrompt: '${config.parameters?.system_prompt || ''}'\n`;
      code += `  })\n`;
    }
    else if (type === 'WAIT') {
      code += `  .wait('${config.duration || '5s'}')\n`;
    }

    visited.add(nextNode.id);
    currentNode = nextNode;
  }

  code += `  .build();`;
  return code;
};
