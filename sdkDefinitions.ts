
/**
 * ------------------------------------------------------------------
 * UNIVERSAL SDK REGISTRY (Production Simulation)
 * ------------------------------------------------------------------
 * Represents the reflected metadata of 100+ SDKs.
 */

export type ParamType = 'string' | 'number' | 'boolean' | 'json' | 'select' | 'array';

export interface SdkParamDefinition {
  name: string;
  label: string;
  type: ParamType;
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
}

export interface SdkActionDefinition {
  id: string;
  name: string;
  description: string;
  params: SdkParamDefinition[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  schema: string; // JSON Schema description
}

export interface ServiceDefinition {
  id: string;
  name: string;
  category: 'crm' | 'dev' | 'productivity' | 'communication' | 'finance' | 'ai_cloud' | 'ai_local' | 'core';
  icon: string; // Lucide Icon Name
  defaultCredentialsId?: string;
  actions: SdkActionDefinition[];
}

// --- TOOLS REGISTRY FOR AI ---
export const TOOL_REGISTRY: ToolDefinition[] = [
  { id: 'calc', name: 'Calculator', description: 'Perform basic math operations', schema: '{a: number, b: number, op: string}' },
  { id: 'web_search', name: 'Web Search (SerpAPI)', description: 'Search Google for real-time info', schema: '{query: string}' },
  { id: 'retrieve_docs', name: 'Knowledge Base', description: 'RAG retrieval from internal docs', schema: '{query: string}' },
];

// --- MAIN REGISTRY ---
export const SDK_REGISTRY: Record<string, ServiceDefinition> = {
  // === CRM ===
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    icon: 'Cloud',
    defaultCredentialsId: 'SALESFORCE_TOKEN',
    actions: [
      {
        id: 'leads.create',
        name: 'Create Lead',
        description: 'Creates a new Lead object.',
        params: [
          { name: 'LastName', label: 'Last Name', type: 'string', required: true },
          { name: 'Company', label: 'Company', type: 'string', required: true },
          { name: 'Email', label: 'Email', type: 'string', required: false }
        ]
      },
      {
        id: 'soql.query',
        name: 'Run SOQL',
        description: 'Execute a SOQL query.',
        params: [{ name: 'query', label: 'SOQL Query', type: 'string', required: true }]
      }
    ]
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    icon: 'Users',
    defaultCredentialsId: 'HUBSPOT_KEY',
    actions: [
      {
        id: 'crm.contacts.create',
        name: 'Create Contact',
        description: 'Create a new contact record.',
        params: [
          { name: 'email', label: 'Email', type: 'string', required: true },
          { name: 'firstname', label: 'First Name', type: 'string', required: false }
        ]
      }
    ]
  },

  // === FINANCE ===
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    category: 'finance',
    icon: 'CreditCard',
    defaultCredentialsId: 'STRIPE_SECRET_KEY',
    actions: [
      {
        id: 'customers.create',
        name: 'Create Customer',
        description: 'Create a new customer in Stripe.',
        params: [
          { name: 'email', label: 'Email', type: 'string', required: true, placeholder: 'customer@example.com' },
          { name: 'name', label: 'Full Name', type: 'string', required: false }
        ]
      },
      {
        id: 'paymentIntents.create',
        name: 'Create Payment Intent',
        description: 'Create a payment intent for checkout.',
        params: [
          { name: 'amount', label: 'Amount (cents)', type: 'number', required: true, placeholder: '2000' },
          { name: 'currency', label: 'Currency', type: 'string', required: true, defaultValue: 'usd' }
        ]
      }
    ]
  },

  // === DEVELOPER ===
  github: {
    id: 'github',
    name: 'GitHub',
    category: 'dev',
    icon: 'Github',
    defaultCredentialsId: 'GITHUB_TOKEN',
    actions: [
      {
        id: 'issues.create',
        name: 'Create Issue',
        description: 'Create a new issue in a repository.',
        params: [
          { name: 'owner', label: 'Owner', type: 'string', required: true },
          { name: 'repo', label: 'Repository', type: 'string', required: true },
          { name: 'title', label: 'Title', type: 'string', required: true },
          { name: 'body', label: 'Body', type: 'string', required: false }
        ]
      }
    ]
  },
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    category: 'dev',
    icon: 'Gitlab',
    defaultCredentialsId: 'GITLAB_TOKEN',
    actions: [
      {
        id: 'projects.create',
        name: 'Create Project',
        description: 'Create a new project.',
        params: [{ name: 'name', label: 'Name', type: 'string', required: true }]
      }
    ]
  },

  // === PRODUCTIVITY ===
  notion: {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    icon: 'FileText',
    defaultCredentialsId: 'NOTION_TOKEN',
    actions: [
      {
        id: 'pages.create',
        name: 'Create Page',
        description: 'Create a new page in a database.',
        params: [
          { name: 'database_id', label: 'Database ID', type: 'string', required: true },
          { name: 'properties', label: 'Properties (JSON)', type: 'json', required: true }
        ]
      }
    ]
  },
  asana: {
    id: 'asana',
    name: 'Asana',
    category: 'productivity',
    icon: 'CheckSquare',
    defaultCredentialsId: 'ASANA_TOKEN',
    actions: [
      {
        id: 'tasks.create',
        name: 'Create Task',
        description: 'Create a new task.',
        params: [
          { name: 'workspace', label: 'Workspace ID', type: 'string', required: true },
          { name: 'name', label: 'Task Name', type: 'string', required: true }
        ]
      }
    ]
  },

  // === COMMUNICATION ===
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    icon: 'Slack',
    defaultCredentialsId: 'SLACK_TOKEN',
    actions: [
      {
        id: 'chat.postMessage',
        name: 'Post Message',
        description: 'Send a message to a channel.',
        params: [
          { name: 'channel', label: 'Channel ID', type: 'string', required: true, placeholder: 'C01234567' },
          { name: 'text', label: 'Message Text', type: 'string', required: true, placeholder: 'Hello Team!' },
          { name: 'mrkdwn', label: 'Enable Markdown', type: 'boolean', required: false, defaultValue: true }
        ]
      },
      {
        id: 'users.info',
        name: 'Get User Info',
        description: 'Retrieve details about a specific user.',
        params: [
          { name: 'user', label: 'User ID', type: 'string', required: true, placeholder: 'U01234567' }
        ]
      }
    ]
  },
  twilio: {
    id: 'twilio',
    name: 'Twilio',
    category: 'communication',
    icon: 'Phone',
    defaultCredentialsId: 'TWILIO_AUTH_TOKEN',
    actions: [
      {
        id: 'messages.create',
        name: 'Send SMS',
        description: 'Send a text message.',
        params: [
          { name: 'to', label: 'To Number', type: 'string', required: true },
          { name: 'from', label: 'From Number', type: 'string', required: true },
          { name: 'body', label: 'Message Body', type: 'string', required: true }
        ]
      }
    ]
  },
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'communication',
    icon: 'Mail',
    defaultCredentialsId: 'SENDGRID_API_KEY',
    actions: [
      {
        id: 'mail.send',
        name: 'Send Email',
        description: 'Send a transactional email.',
        params: [
          { name: 'to', label: 'To Email', type: 'string', required: true },
          { name: 'subject', label: 'Subject', type: 'string', required: true },
          { name: 'html', label: 'HTML Content', type: 'string', required: true }
        ]
      }
    ]
  },

  // === AI CLOUD ===
  openai: {
    id: 'openai',
    name: 'OpenAI',
    category: 'ai_cloud',
    icon: 'Bot',
    defaultCredentialsId: 'OPENAI_API_KEY',
    actions: [
      {
        id: 'chat.completions.create',
        name: 'Generate Text',
        description: 'Generate a response using GPT models.',
        params: [
          { name: 'model', label: 'Model', type: 'select', options: ['gpt-4-turbo', 'gpt-3.5-turbo'], required: true, defaultValue: 'gpt-4-turbo' },
          { name: 'system_prompt', label: 'System Prompt', type: 'string', required: true, defaultValue: 'You are a helpful assistant.' },
          { name: 'user_prompt', label: 'User Prompt', type: 'string', required: true, description: 'The input query.' },
          { name: 'temperature', label: 'Temperature', type: 'number', required: false, defaultValue: 0.7 }
        ]
      }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'ai_cloud',
    icon: 'BrainCircuit',
    defaultCredentialsId: 'ANTHROPIC_API_KEY',
    actions: [
      {
        id: 'messages.create',
        name: 'Generate Text (Claude)',
        description: 'Generate a response using Claude models.',
        params: [
          { name: 'model', label: 'Model', type: 'select', options: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'], required: true, defaultValue: 'claude-3-sonnet-20240229' },
          { name: 'system', label: 'System Prompt', type: 'string', required: true, defaultValue: 'You are a helpful assistant.' },
          { name: 'messages', label: 'User Message', type: 'string', required: true }
        ]
      }
    ]
  },

  // === AI LOCAL ===
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    category: 'ai_local',
    icon: 'HardDrive',
    actions: [
      {
        id: 'generate',
        name: 'Generate Completion',
        description: 'Generate text using a local LLM via Ollama.',
        params: [
          { name: 'baseUrl', label: 'Base URL', type: 'string', required: true, defaultValue: 'http://localhost:11434' },
          { name: 'model', label: 'Model Name', type: 'string', required: true, placeholder: 'llama3' },
          { name: 'prompt', label: 'Prompt', type: 'string', required: true },
          { name: 'stream', label: 'Stream Response', type: 'boolean', required: false, defaultValue: false }
        ]
      }
    ]
  },
  vllm: {
    id: 'vllm',
    name: 'vLLM (Local)',
    category: 'ai_local',
    icon: 'Server',
    actions: [
      {
        id: 'completions',
        name: 'Generate Completion',
        description: 'High-throughput local serving.',
        params: [
          { name: 'baseUrl', label: 'Base URL', type: 'string', required: true, defaultValue: 'http://localhost:8000' },
          { name: 'model', label: 'Model Name', type: 'string', required: true },
          { name: 'prompt', label: 'Prompt', type: 'string', required: true }
        ]
      }
    ]
  }
};
