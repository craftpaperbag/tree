
import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Trash2, HelpCircle, Layers, Loader2, Edit3, Check, X, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { CustomNodeData, AIExpandMode } from '../types';

const CustomNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const typedData = data as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(typedData.label);

  useEffect(() => {
    setEditValue(typedData.label);
  }, [typedData.label]);

  const handleEdit = useCallback(() => {
    if (editValue.trim() !== typedData.label) {
      typedData.onEdit(id, editValue);
    }
    setIsEditing(false);
  }, [id, editValue, typedData]);

  const handleCancel = useCallback(() => {
    setEditValue(typedData.label);
    setIsEditing(false);
  }, [typedData.label]);

  const onExpandClick = useCallback((mode: AIExpandMode) => {
    let finalLabel = typedData.label;
    if (isEditing) {
      finalLabel = editValue;
      typedData.onEdit(id, editValue);
      setIsEditing(false);
    }
    typedData.onExpand(id, mode, finalLabel);
  }, [id, isEditing, editValue, typedData]);

  return (
    <div 
      className={`
        relative px-4 py-3 rounded-xl border-2 bg-white shadow-lg transition-all w-[240px]
        ${typedData.isExpanding ? 'animate-ai-pulse border-indigo-500 bg-indigo-50/30' : 
          selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}
        ${typedData.isCollapsed ? 'ring-1 ring-slate-200 opacity-90' : ''}
      `}
      onDoubleClick={() => !typedData.isExpanding && setIsEditing(true)}
    >
      {typedData.isExpanding && (
        <div className="absolute -top-3 -right-3 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg z-10 animate-bounce">
          <Sparkles size={14} />
        </div>
      )}

      {typedData.hasChildren && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              typedData.onToggleCollapse(id);
            }}
            className={`w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:border-indigo-400 text-slate-500 hover:text-indigo-600 transition-all
              ${typedData.isCollapsed ? 'bg-indigo-50 border-indigo-200 text-indigo-600 scale-110' : ''}
            `}
          >
            {typedData.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          {typedData.isCollapsed && typedData.descendantCount && typedData.descendantCount > 0 && (
            <div className="mt-1 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full shadow-md animate-in fade-in zoom-in duration-200">
              +{typedData.descendantCount}
            </div>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3" />
      
      <div className="flex flex-col gap-2">
        {isEditing ? (
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-indigo-200">
            <input
              autoFocus
              onFocus={(e) => e.target.select()}
              className="flex-1 text-base font-medium text-slate-900 focus:outline-none bg-transparent px-1"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex items-center gap-0.5">
              <button 
                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                onClick={handleEdit} 
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Save"
              >
                <Check size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between group cursor-pointer" title="Double click to edit">
            <span className={`text-sm font-semibold text-slate-800 break-words flex-1 pr-2 ${typedData.isCollapsed ? 'line-clamp-2' : ''}`}>
              {typedData.label}
            </span>
            {!typedData.isExpanding && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                title="Edit text"
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              onClick={() => onExpandClick('why')}
              disabled={typedData.isExpanding}
              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors
                ${typedData.isExpanding ? 'text-indigo-400' : 'text-amber-600 hover:text-amber-700'}
              `}
              title="Why Analysis"
            >
              {typedData.isExpanding ? <Loader2 size={12} className="animate-spin" /> : <HelpCircle size={12} />}
              Why?
            </button>
            <button
              onClick={() => onExpandClick('what')}
              disabled={typedData.isExpanding}
              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors
                ${typedData.isExpanding ? 'text-indigo-400' : 'text-indigo-600 hover:text-indigo-700'}
              `}
              title="Decomposition"
            >
              {typedData.isExpanding ? <Loader2 size={12} className="animate-spin" /> : <Layers size={12} />}
              What?
            </button>
          </div>
          {!typedData.isExpanding && (
            <button
              onClick={() => typedData.onDelete(id)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              title="Delete node"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3" />
    </div>
  );
};

export default React.memo(CustomNode);
