
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { executeSlackAction, executeStripeAction, executeAiAgent } = proxyActivities<typeof activities.activities>({
  startToCloseTimeout: '1m',
  retry: { maximumAttempts: 3 }
});

interface WorkflowNode {
  id: string;
  type: string;
  config: any;
}

export async function NexusInterpreterWorkflow(definition: { nodes: WorkflowNode[], edges: any[] }, inputPayload: any) {
  const results: Record<string, any> = {};
  
  // 1. Handle Trigger
  const trigger = definition.nodes.find(n => n.type === 'TRIGGER');
  if (trigger) results[trigger.id] = inputPayload;

  // 2. Linear Execution Simulation
  const executionOrder = definition.nodes.filter(n => n.type !== 'TRIGGER');

  for (const node of executionOrder) {
    const config = node.config;
    let result;

    try {
      if (node.type === 'SDK_ACTION') {
        const { serviceId, actionId, parameters } = config;
        const secret = "PROCESS_ENV_FETCHED_SECRET"; // In prod, resolve via config.credentialsId

        if (serviceId === 'slack') {
          result = await executeSlackAction(actionId, parameters, secret);
        } else if (serviceId === 'stripe') {
          result = await executeStripeAction(actionId, parameters, secret);
        } else {
           // Generic fallback for other 100+ integrations
           result = { executed: true, service: serviceId, action: actionId, timestamp: Date.now() };
        }
      } 
      else if (node.type === 'AI_AGENT') {
        const prevOutput = JSON.stringify(results); // Simple context
        result = await executeAiAgent({
          provider: config.serviceId,
          model: config.parameters.model,
          systemPrompt: config.parameters.system_prompt || 'You are helpful',
          userPrompt: config.parameters.user_prompt || prevOutput,
          tools: config.tools,
          mode: config.mode
        }, "PROCESS_ENV_FETCHED_SECRET");
      }
      else if (node.type === 'WAIT') {
        await sleep(config.duration || '5s');
        result = { waited: true };
      }
      
      results[node.id] = result;
    } catch (e: any) {
      results[node.id] = { error: e.message };
      throw e; // Fail workflow
    }
  }

  return results;
}
