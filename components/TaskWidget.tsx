
import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, RefreshCw, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';
import { Task } from '../types';

interface TaskWidgetProps {
  tasks: Task[];
  isSyncing: boolean;
  onUpdateTask: (task: Task) => void;
  onManualSync: () => void;
  onClose: () => void;
}

const TaskWidget: React.FC<TaskWidgetProps> = ({ tasks, isSyncing, onUpdateTask, onManualSync, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Task>>({});

  const urgencyColors = {
    high: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityMap[a.urgency] - priorityMap[b.urgency];
  });

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditValues(task);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditValues({});
  };

  const saveEditing = () => {
    if (editingTaskId && editValues) {
      onUpdateTask(editValues as Task);
      setEditingTaskId(null);
      setEditValues({});
    }
  };

  return (
    <div className={`w-[340px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 ${isExpanded ? 'max-h-[600px]' : 'max-h-[56px]'}`}>
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">Task Cortex</h3>
          {isSyncing && <RefreshCw size={12} className="animate-spin text-slate-500" />}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onManualSync}
            className="p-1 text-slate-500 hover:text-white transition-colors"
            title="Scan Brain Map"
          >
            <RefreshCw size={14} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white transition-colors"
            title="Hide Cortex"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-2 overflow-y-auto max-h-[500px]">
          {sortedTasks.length === 0 ? (
            <div className="py-10 text-center opacity-30 text-xs text-slate-400">
              No tasks detected in mind map.
            </div>
          ) : (
            <div className="space-y-1">
              {sortedTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`group p-3 rounded-xl border transition-all flex gap-3 items-start ${
                    editingTaskId === task.id 
                      ? 'bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20' 
                      : 'border-transparent hover:border-white/5 hover:bg-white/5'
                  } ${task.completed && editingTaskId !== task.id ? 'opacity-50' : ''}`}
                >
                  {editingTaskId === task.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <input 
                        className="bg-slate-800 text-sm border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500 text-white w-full"
                        value={editValues.title}
                        onChange={e => setEditValues({ ...editValues, title: e.target.value })}
                        placeholder="Task Title"
                      />
                      <div className="flex gap-2">
                        <input 
                          className="bg-slate-800 text-[10px] border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500 text-white flex-grow"
                          value={editValues.dueDate || ''}
                          onChange={e => setEditValues({ ...editValues, dueDate: e.target.value })}
                          placeholder="Date (e.g. Tomorrow 10am)"
                        />
                        <select 
                          className="bg-slate-800 text-[10px] border border-white/10 rounded px-2 py-1 outline-none text-white"
                          value={editValues.urgency}
                          onChange={e => setEditValues({ ...editValues, urgency: e.target.value as 'high' | 'medium' | 'low' })}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-1">
                        <button onClick={cancelEditing} className="p-1 text-slate-400 hover:text-white"><X size={14} /></button>
                        <button onClick={saveEditing} className="p-1 text-blue-400 hover:text-blue-300"><Check size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => onUpdateTask({ ...task, completed: !task.completed })}
                        className={`mt-0.5 flex-shrink-0 transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </h4>
                          <div className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-tighter ${urgencyColors[task.urgency]}`}>
                            {task.urgency}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock size={10} />
                              <span className="truncate">{task.dueDate}</span>
                            </div>
                          )}
                          <button 
                            onClick={() => startEditing(task)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity ml-auto"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskWidget;
