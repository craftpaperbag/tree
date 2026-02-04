
import { Node, Edge } from '@xyflow/react';

export type AIExpandMode = 'why' | 'what';

export interface CustomNodeData {
  label: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, newLabel: string) => void;
  onExpand: (id: string, mode: AIExpandMode, overrideLabel?: string) => void;
  onRefine: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onTogglePin: (id: string) => void; // Added for context pinning
  isExpanding?: boolean;
  isCollapsed?: boolean;
  isPinned?: boolean; // Added to track nodes manually selected as context
  hasChildren?: boolean;
  descendantCount?: number;
  generatedBy?: AIExpandMode;
}

export type CustomNodeType = Node<CustomNodeData>;

export interface TreeData {
  nodes: CustomNodeType[];
  edges: Edge[];
}

export interface AIResponse {
  ideas: string[];
}

export interface PromptLog {
  id: string;
  timestamp: number;
  type: 'expand' | 'refine';
  mode?: AIExpandMode;
  input: string;
  fullPrompt: string;
  response: string;
}

export interface SystemSettings {
  customInstruction: string;
}
