
export type NodeType = 'concept' | 'task' | 'person' | 'event' | 'resource';

export interface MindNode {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  icon?: string; // Emoji or identifier for an icon
  details?: string;
  date?: string;
  reminderDate?: string;
  isCompleted?: boolean;
  priority?: 'high' | 'medium' | 'low';
  x?: number;
  y?: number;
}

export interface MindEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface MindMapData {
  nodes: MindNode[];
  edges: MindEdge[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedChanges?: MindMapChangeProposal;
  attachments?: {
    name: string;
    type: string;
    data: string; // base64
  }[];
}

export interface MindMapChangeProposal {
  nodesToAdd: MindNode[];
  nodesToUpdate: Partial<MindNode>[];
  edgesToAdd: MindEdge[];
  explanation: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  reminderDate?: string;
  urgency: 'high' | 'medium' | 'low';
  completed: boolean;
  nodeId: string; // Reference to the mindmap node
}
