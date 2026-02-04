
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  Controls,
  Panel,
  Node,
  useReactFlow,
} from '@xyflow/react';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import CustomNode from './CustomNode';
import Toolbar from './Toolbar';
import { CustomNodeData, AIExpandMode, PromptLog } from '../types';
import { getLayoutedElements, generateId } from '../lib/utils';
import { generateExpandedNodes, refineNodeText } from '../services/geminiService';

const nodeTypes = {
  custom: CustomNode,
};

const STORAGE_KEY = 'ai-thought-tree-data';
const SETTINGS_KEY = 'ai-thought-tree-settings';
const LOGS_KEY = 'ai-thought-tree-logs';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const FlowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnyExpanding, setIsAnyExpanding] = useState(false);
  const [aiStatus, setAiStatus] = useState('Analyzing context...');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [promptLogs, setPromptLogs] = useState<PromptLog[]>([]);
  
  const { fitView } = useReactFlow();

  // History state
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const skipHistoryRef = useRef(false);
  
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const fitViewToContent = useCallback(() => {
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 50);
  }, [fitView]);

  const addPromptLog = useCallback((log: Omit<PromptLog, 'id' | 'timestamp'>) => {
    const newLog: PromptLog = {
      ...log,
      id: generateId(),
      timestamp: Date.now()
    };
    setPromptLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getAncestorContext = useCallback((nodes: Node[], edges: Edge[], startNodeId: string): string[] => {
    const context: string[] = [];
    let currentId = startNodeId;
    
    while (true) {
      const incomingEdge = edges.find(e => e.target === currentId);
      if (!incomingEdge) break;
      
      const parentNode = nodes.find(n => n.id === incomingEdge.source);
      if (!parentNode) break;
      
      context.unshift((parentNode.data as CustomNodeData).label);
      currentId = parentNode.id;
    }
    
    return context;
  }, []);

  const getPinnedContext = useCallback((nodes: Node[]): string[] => {
    return nodes
      .filter(n => (n.data as CustomNodeData).isPinned)
      .map(n => (n.data as CustomNodeData).label);
  }, []);

  const getDescendantIds = useCallback((nodes: Node[], edges: Edge[], startNodeId: string): string[] => {
    const descendantIds: string[] = [];
    const queue = [startNodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const childEdges = edges.filter(e => e.source === currentId);
      childEdges.forEach(e => {
        descendantIds.push(e.target);
        queue.push(e.target);
      });
    }
    return Array.from(new Set(descendantIds));
  }, []);

  const syncVisibility = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const hiddenNodeIds = new Set<string>();
    const nodeDescendantsMap = new Map<string, number>();
    
    const childrenMap = new Map<string, string[]>();
    currentEdges.forEach(edge => {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
    });

    const traverse = (nodeId: string, isParentCollapsed: boolean): number => {
      const children = childrenMap.get(nodeId) || [];
      const node = currentNodes.find(n => n.id === nodeId);
      const isActuallyCollapsed = isParentCollapsed || (node?.data as CustomNodeData)?.isCollapsed;

      let totalDescendants = 0;
      children.forEach(childId => {
        if (isActuallyCollapsed) {
          hiddenNodeIds.add(childId);
        }
        totalDescendants += 1 + traverse(childId, !!isActuallyCollapsed);
      });

      nodeDescendantsMap.set(nodeId, totalDescendants);
      return totalDescendants;
    };

    const rootNodes = currentNodes.filter(n => !currentEdges.find(e => e.target === n.id));
    rootNodes.forEach(root => traverse(root.id, false));

    const updatedNodes = currentNodes.map(node => ({
      ...node,
      hidden: hiddenNodeIds.has(node.id),
      data: {
        ...node.data,
        hasChildren: childrenMap.has(node.id),
        descendantCount: nodeDescendantsMap.get(node.id) || 0
      }
    }));

    const updatedEdges = currentEdges.map(edge => ({
      ...edge,
      hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)
    }));

    return { nodes: updatedNodes, edges: updatedEdges };
  }, []);

  useEffect(() => {
    if (!isAnyExpanding) return;
    const statuses = [
      'Analyzing context...',
      'Consulting Gemini...',
      'Refining expression...',
      'Polishing thoughts...',
      'Finalizing...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % statuses.length;
      setAiStatus(statuses[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnyExpanding]);

  const takeSnapshot = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (skipHistoryRef.current) return;
    setPast((prev) => {
      const newPast = [...prev, { nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges)) }];
      if (newPast.length > 50) return newPast.slice(1);
      return newPast;
    });
    setFuture([]);
  }, []);

  function bindNodeCallbacks(nodesToBind: Node[], forceResetExpanding = false) {
    return nodesToBind.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete: deleteNode,
        onEdit: editNode,
        onExpand: expandNode,
        onRefine: refineNode,
        onToggleCollapse: toggleCollapse,
        onTogglePin: togglePin,
        isExpanding: forceResetExpanding ? false : node.data.isExpanding,
      }
    }));
  }

  const togglePin = useCallback((id: string) => {
    setNodes(nds => nds.map(n => 
      n.id === id ? { ...n, data: { ...n.data, isPinned: !n.data.isPinned } } : n
    ));
  }, [setNodes]);

  const toggleCollapse = useCallback((id: string) => {
    takeSnapshot(nodesRef.current, edgesRef.current);
    const updatedNodes = nodesRef.current.map(n => 
      n.id === id ? { ...n, data: { ...n.data, isCollapsed: !n.data.isCollapsed } } : n
    );
    const { nodes: visNodes, edges: visEdges } = syncVisibility(updatedNodes, edgesRef.current);
    setNodes(bindNodeCallbacks(visNodes));
    setEdges(visEdges);
    fitViewToContent();
  }, [takeSnapshot, syncVisibility, fitViewToContent]);

  const deleteNode = useCallback((id: string) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const descendantIds = getDescendantIds(currentNodes, currentEdges, id);
    const idsToRemove = new Set([id, ...descendantIds]);
    takeSnapshot(currentNodes, currentEdges);
    const filteredNodes = currentNodes.filter((n) => !idsToRemove.has(n.id));
    const filteredEdges = currentEdges.filter((e) => !idsToRemove.has(e.source) && !idsToRemove.has(e.target));
    const { nodes: visNodes, edges: visEdges } = syncVisibility(filteredNodes, filteredEdges);
    setNodes(bindNodeCallbacks(visNodes));
    setEdges(visEdges);
    fitViewToContent();
  }, [setNodes, setEdges, takeSnapshot, syncVisibility, getDescendantIds, fitViewToContent]);

  const editNode = useCallback((id: string, newLabel: string) => {
    takeSnapshot(nodesRef.current, edgesRef.current);
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)));
  }, [setNodes, takeSnapshot]);

  const refineNode = useCallback(async (id: string) => {
    const currentNodes = nodesRef.current;
    const node = currentNodes.find(n => n.id === id);
    if (!node) return;

    setIsAnyExpanding(true);
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, isExpanding: true } } : n));

    try {
      const { refined, fullPrompt } = await refineNodeText(node.data.label, systemInstruction);
      addPromptLog({
        type: 'refine',
        input: node.data.label,
        fullPrompt,
        response: refined
      });
      takeSnapshot(nodesRef.current, edgesRef.current);
      setNodes(nds => nds.map(n => n.id === id ? { 
        ...n, 
        data: { ...n.data, label: refined, isExpanding: false } 
      } : n));
    } catch (error) {
      alert("Refinement failed.");
      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, isExpanding: false } } : n));
    } finally {
      setIsAnyExpanding(false);
    }
  }, [systemInstruction, takeSnapshot, addPromptLog]);

  const expandNode = useCallback(async (id: string, mode: AIExpandMode, overrideLabel?: string) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const parentNode = currentNodes.find((n) => n.id === id);
    if (!parentNode) return;

    setIsAnyExpanding(true);
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, isExpanding: true, isCollapsed: false } } : n)));

    try {
      const parentLabel = overrideLabel || (parentNode.data as CustomNodeData).label;
      const pinnedContext = getPinnedContext(currentNodes);
      const context = pinnedContext.length > 0 ? pinnedContext : getAncestorContext(currentNodes, currentEdges, id);
      
      const { ideas, fullPrompt } = await generateExpandedNodes(parentLabel, mode, context, systemInstruction);
      
      addPromptLog({
        type: 'expand',
        mode,
        input: parentLabel,
        fullPrompt,
        response: JSON.stringify(ideas)
      });

      const descendantIds = getDescendantIds(currentNodes, currentEdges, id);
      const latestNodes = nodesRef.current.filter(n => !descendantIds.includes(n.id));
      const latestEdges = edgesRef.current.filter(e => !descendantIds.includes(e.source) && !descendantIds.includes(e.target));
      takeSnapshot(latestNodes, latestEdges);

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      ideas.forEach((idea) => {
        const newId = generateId();
        newNodes.push({
          id: newId,
          type: 'custom',
          position: { x: parentNode.position.x, y: parentNode.position.y + 150 },
          data: { 
            label: idea, 
            onDelete: deleteNode, 
            onEdit: editNode, 
            onExpand: expandNode, 
            onRefine: refineNode,
            onToggleCollapse: toggleCollapse,
            onTogglePin: togglePin,
            generatedBy: mode 
          },
        });
        newEdges.push({
          id: `e-${id}-${newId}`,
          source: id,
          target: newId,
          animated: true,
          style: { stroke: mode === 'why' ? '#f59e0b' : '#6366f1', strokeWidth: 2 },
        });
      });

      const updatedNodes = [...latestNodes, ...newNodes].map((n) => 
        n.id === id ? { ...n, data: { ...n.data, isExpanding: false, label: parentLabel, isCollapsed: false } } : n
      );
      const updatedEdges = [...latestEdges, ...newEdges];
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(updatedNodes, updatedEdges);
      const { nodes: visNodes, edges: visEdges } = syncVisibility(layoutedNodes, layoutedEdges);
      setNodes(bindNodeCallbacks(visNodes));
      setEdges(visEdges);
      fitViewToContent();
    } catch (error) {
      alert("AI Generation failed.");
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, isExpanding: false } } : n)));
    } finally {
      setIsAnyExpanding(false);
    }
  }, [deleteNode, editNode, takeSnapshot, getDescendantIds, getPinnedContext, getAncestorContext, systemInstruction, syncVisibility, toggleCollapse, togglePin, refineNode, fitViewToContent, addPromptLog]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    skipHistoryRef.current = true;
    setIsAnyExpanding(false); // Force reset AI state on undo
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture((prev) => [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...prev]);
    setNodes(bindNodeCallbacks(previous.nodes, true));
    setEdges(previous.edges);
    setPast(newPast);
    setTimeout(() => { 
      skipHistoryRef.current = false; 
      fitViewToContent();
    }, 0);
  }, [past, nodes, edges, fitViewToContent]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    skipHistoryRef.current = true;
    setIsAnyExpanding(false); // Force reset AI state on redo
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setNodes(bindNodeCallbacks(next.nodes, true));
    setEdges(next.edges);
    setFuture(newFuture);
    setTimeout(() => { 
      skipHistoryRef.current = false; 
      fitViewToContent();
    }, 0);
  }, [future, nodes, edges, fitViewToContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') redo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
        const { nodes: visNodes, edges: visEdges } = syncVisibility(savedNodes, savedEdges);
        setNodes(bindNodeCallbacks(visNodes, true));
        setEdges(visEdges);
        fitViewToContent();
      } catch (e) {
        addRootNode();
      }
    } else {
      addRootNode();
    }
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSystemInstruction(parsed.customInstruction || '');
      } catch (e) {}
    }
    const savedLogs = localStorage.getItem(LOGS_KEY);
    if (savedLogs) {
      try {
        setPromptLogs(JSON.parse(savedLogs));
      } catch (e) {}
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    }
  }, [nodes, edges, isInitialized]);

  const updateSystemInstruction = (val: string) => {
    setSystemInstruction(val);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ customInstruction: val }));
  };

  const onConnect = useCallback((params: Connection) => {
    takeSnapshot(nodesRef.current, edgesRef.current);
    const newEdges = addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, edgesRef.current);
    const { nodes: visNodes, edges: visEdges } = syncVisibility(nodesRef.current, newEdges);
    setNodes(bindNodeCallbacks(visNodes));
    setEdges(visEdges);
    fitViewToContent();
  }, [setEdges, takeSnapshot, syncVisibility, fitViewToContent]);

  const addRootNode = useCallback(() => {
    const id = generateId();
    takeSnapshot(nodesRef.current, edgesRef.current);
    const newNode: Node = {
      id,
      type: 'custom',
      position: { x: window.innerWidth / 2 - 120, y: 150 },
      data: { 
        label: 'New Idea', 
        onDelete: deleteNode, 
        onEdit: editNode, 
        onExpand: expandNode, 
        onRefine: refineNode,
        onToggleCollapse: toggleCollapse,
        onTogglePin: togglePin
      },
    };
    const { nodes: visNodes, edges: visEdges } = syncVisibility([...nodesRef.current, newNode], edgesRef.current);
    setNodes(bindNodeCallbacks(visNodes));
    setEdges(visEdges);
    fitViewToContent();
  }, [deleteNode, editNode, expandNode, takeSnapshot, syncVisibility, toggleCollapse, togglePin, refineNode, fitViewToContent]);

  const clearTree = useCallback(() => {
    if (window.confirm('全てのノードを削除してもよろしいですか？')) {
      takeSnapshot(nodesRef.current, edgesRef.current);
      setNodes([]);
      setEdges([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: [], edges: [] }));
    }
  }, [takeSnapshot, setNodes, setEdges]);

  const autoLayout = useCallback(() => {
    takeSnapshot(nodesRef.current, edgesRef.current);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodesRef.current, edgesRef.current);
    const { nodes: visNodes, edges: visEdges } = syncVisibility(layoutedNodes, layoutedEdges);
    setNodes(bindNodeCallbacks(visNodes));
    setEdges(visEdges);
    fitViewToContent();
  }, [takeSnapshot, syncVisibility, fitViewToContent]);

  const exportData = useCallback(() => {
    const data = { nodes: nodesRef.current, edges: edgesRef.current };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tree-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const onNodeDragStop = useCallback(() => takeSnapshot(nodesRef.current, edgesRef.current), [takeSnapshot]);

  return (
    <div className={`w-full h-[100dvh] relative transition-all duration-500 overflow-hidden ${isAnyExpanding ? 'cursor-wait' : ''}`}>
      {isAnyExpanding && (
        <div className="absolute inset-0 bg-indigo-50/10 backdrop-blur-[1px] z-40 pointer-events-none" />
      )}

      {isAnyExpanding && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.3)] border border-indigo-100 animate-in fade-in slide-in-from-bottom-5 duration-300 w-auto max-w-[90vw]">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shrink-0">
            <BrainCircuit size={20} className="text-white animate-pulse" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles size={12} className="text-indigo-500" />
              AI Generating...
            </span>
            <span className="text-[10px] text-indigo-600 font-medium truncate">
              {aiStatus}
            </span>
          </div>
          <Loader2 size={14} className="animate-spin text-slate-300 shrink-0" />
        </div>
      )}

      <Toolbar
        onAddRoot={addRootNode}
        onClear={clearTree}
        onExport={exportData}
        onAutoLayout={autoLayout}
        onUndo={undo}
        onRedo={redo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        systemInstruction={systemInstruction}
        onUpdateInstruction={updateSystemInstruction}
        promptLogs={promptLogs}
      />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-50"
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls 
          showInteractive={false} 
          position="bottom-left"
          className="!m-4 sm:!mb-4 !mb-24" 
        />
        <Panel position="bottom-right" className="hidden sm:block bg-white/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 shadow-sm backdrop-blur-sm">
          <p className="font-semibold text-slate-700 mb-1">Shortcuts</p>
          <div className="grid grid-cols-2 gap-x-2">
            <span>Undo:</span> <kbd>Ctrl+Z</kbd>
            <span>Redo:</span> <kbd>Ctrl+Y</kbd>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowEditor;
