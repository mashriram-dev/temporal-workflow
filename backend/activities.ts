
/**
 * BACKEND: Temporal Activities
 * These functions run in the Node.js Worker Environment.
 */

import { WebClient } from '@slack/web-api';
import Stripe from 'stripe';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// --- TOOL IMPLEMENTATIONS ---
// In a real app, import these from a tools folder
const calculatorTool = new DynamicStructuredTool({
  name: "calculator",
  description: "Can perform mathematical operations.",
  schema: z.object({ operation: z.string(), a: z.number(), b: z.number() }),
  func: async ({ operation, a, b }) => {
    return `${a + b}`; // Simplification
  },
});

const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description: "Search the web for information.",
  schema: z.object({ query: z.string() }),
  func: async ({ query }) => {
    return `Results for ${query}: Nexus Studio is a powerful workflow engine.`;
  },
});

const ALL_TOOLS: Record<string, any> = {
  calc: calculatorTool,
  web_search: webSearchTool
};

export const activities = {
  
  // --- ROBUST INTEGRATIONS ---
  async executeSlackAction(methodPath: string, params: any, token: string) {
    if (!token) throw new Error("Slack Token required");
    const client = new WebClient(token);
    
    // Dynamic deep property access
    const parts = methodPath.split('.');
    let handler: any = client;
    for (const part of parts) {
      handler = handler[part];
    }
    
    if (typeof handler !== 'function') throw new Error(`Method ${methodPath} is not a function on Slack Client`);
    return await handler.call(client, params);
  },

  async executeStripeAction(methodPath: string, params: any, apiKey: string) {
    if (!apiKey) throw new Error("Stripe Key required");
    const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });
    
    const parts = methodPath.split('.');
    let handler: any = stripe;
    for (const part of parts) {
      handler = handler[part];
    }
    return await handler.call(stripe, params);
  },

  // --- ROBUST LANGGRAPH FACTORY ---
  async executeAiAgent(config: { provider: string, model: string, systemPrompt: string, userPrompt: string, tools?: string[], mode?: string }, apiKey: string) {
    // 1. Initialize Model
    let llm: any;
    if (config.provider === 'openai') {
      llm = new ChatOpenAI({ modelName: config.model, openAIApiKey: apiKey, temperature: 0.7 });
    } else if (config.provider === 'anthropic') {
      llm = new ChatAnthropic({ modelName: config.model, anthropicApiKey: apiKey });
    } else {
      throw new Error(`Provider ${config.provider} not supported.`);
    }

    // 2. Bind Tools
    const selectedTools = (config.tools || []).map(id => ALL_TOOLS[id]).filter(Boolean);
    if (selectedTools.length > 0) {
      llm = llm.bindTools(selectedTools);
    }

    // 3. Construct Graph
    // For 'simple_agent', we use a prebuilt ReAct pattern
    const toolNode = new ToolNode(selectedTools);
    
    const workflow = new StateGraph(MessagesAnnotation)
      .addNode("agent", async (state) => {
        const result = await llm.invoke(state.messages);
        return { messages: [result] };
      })
      .addNode("tools", toolNode)
      .addEdge("__start__", "agent")
      .addConditionalEdges("agent", (state) => {
        const lastMsg: any = state.messages[state.messages.length - 1];
        if (lastMsg.tool_calls && lastMsg.tool_calls.length > 0) {
          return "tools";
        }
        return "__end__";
      })
      .addEdge("tools", "agent");

    const app = workflow.compile();

    // 4. Invoke
    const result = await app.invoke({
      messages: [
        new SystemMessage(config.systemPrompt),
        new HumanMessage(config.userPrompt)
      ]
    });

    return { 
      answer: result.messages[result.messages.length - 1].content,
      trace: result.messages.map((m: any) => ({ role: m._getType(), content: m.content })) 
    };
  }
};
