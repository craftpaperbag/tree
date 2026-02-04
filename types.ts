
import { Node, Edge } from '@xyflow/react';

export type AIExpandMode = 'why' | 'what';

export interface CustomNodeData {
  label: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, newLabel: string) => void;
  onExpand: (id: string, mode: AIExpandMode, overrideLabel?: string) => void;
  onToggleCollapse: (id: string) => void;
  isExpanding?: boolean;
  isCollapsed?: boolean;
  hasChildren?: boolean;
  descendantCount?: number;
}

export type CustomNodeType = Node<CustomNodeData>;

export interface TreeData {
  nodes: CustomNodeType[];
  edges: Edge[];
}

export interface AIResponse {
  ideas: string[];
}

export interface SystemSettings {
  customInstruction: string;
}
