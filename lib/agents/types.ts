export interface Agent {
  id: string;
  name: string;
  role: 'traffic' | 'copy' | 'design' | 'seo' | 'analytics' | 'central';
  systemPrompt: string;
  capabilities: string[];
}

export interface AgentTask {
  id: string;
  description: string;
  assignedTo: string[];
  status: 'pending' | 'in_progress' | 'completed';
  results: Record<string, any>;
}
