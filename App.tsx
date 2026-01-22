
import React, { useState, useEffect, useCallback } from 'react';
import { MindMapData, MindNode, MindEdge, ChatMessage, Task, MindMapChangeProposal } from './types';
import MindMap from './components/MindMap';
import ChatWindow from './components/ChatWindow';
import TaskWidget from './components/TaskWidget';
import { extractTasksFromMindMap } from './services/geminiService';
import { BrainCircuit, MessageSquareText } from 'lucide-react';

const INITIAL_DATA: MindMapData = {
  nodes: [
    { id: 'me', label: 'My Consciousness', type: 'concept', icon: '🧠', description: 'The root of my digital twin.', x: 0, y: 0 },
    { id: 'work', label: 'Work', type: 'concept', icon: '💼', description: 'Professional life and goals.', x: 150, y: 50 },
    { id: 'health', label: 'Health', type: 'concept', icon: '💪', description: 'Physical and mental well-being.', x: -150, y: 50 },
  ],
  edges: [
    { id: 'e1', source: 'me', target: 'work' },
    { id: 'e2', source: 'me', target: 'health' },
  ]
};

const App: React.FC = () => {
  const [mindMap, setMindMap] = useState<MindMapData>(INITIAL_DATA);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isTaskWidgetVisible, setIsTaskWidgetVisible] = useState(true);

  // Sync tasks from mindmap
  const syncTasks = useCallback(async () => {
    setIsSyncingTasks(true);
    try {
      const extractedTasks = await extractTasksFromMindMap(mindMap);
      setTasks(extractedTasks);
    } catch (error) {
      console.error("Failed to sync tasks:", error);
    } finally {
      setIsSyncingTasks(false);
    }
  }, [mindMap]);

  // Initial task sync and set interval (simulated hour)
  useEffect(() => {
    syncTasks();
    const interval = setInterval(syncTasks, 1000 * 60 * 60); // 1 hour
    return () => clearInterval(interval);
  }, [syncTasks]);

  const handleApplyChanges = (proposal: MindMapChangeProposal) => {
    setMindMap(prev => {
      const newNodes = [...prev.nodes];
      const newEdges = [...prev.edges];

      const nodesToAdd = proposal.nodesToAdd || [];
      nodesToAdd.forEach(node => {
        if (!newNodes.find(n => n.id === node.id)) {
          newNodes.push(node);
        }
      });

      const nodesToUpdate = proposal.nodesToUpdate || [];
      nodesToUpdate.forEach(update => {
        const idx = newNodes.findIndex(n => n.id === update.id);
        if (idx !== -1) {
          newNodes[idx] = { ...newNodes[idx], ...update };
        }
      });

      const edgesToAdd = proposal.edgesToAdd || [];
      edgesToAdd.forEach(edge => {
        if (!newEdges.find(e => e.id === edge.id)) {
          newEdges.push(edge);
        }
      });

      return { nodes: newNodes, edges: newEdges };
    });
  };

  const updateTaskInMindMap = (updatedTask: Task) => {
    setMindMap(prev => {
      const newNodes = prev.nodes.map(node => {
        if (node.id === updatedTask.nodeId) {
          return {
            ...node,
            label: updatedTask.title,
            date: updatedTask.dueDate,
            reminderDate: updatedTask.reminderDate,
            priority: updatedTask.urgency,
            isCompleted: updatedTask.completed
          };
        }
        return node;
      });
      return { ...prev, nodes: newNodes };
    });
  };

  const handleUpdateNode = (updatedNode: MindNode) => {
    setMindMap(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0c] overflow-hidden">
      {/* Main Area: Mind Map */}
      <div className={`relative flex-grow h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 transition-all duration-500`}>
        <header className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
          <h1 className="text-3xl font-light tracking-tighter text-blue-400">SYNAPSE</h1>
          <p className="text-xs font-mono uppercase text-slate-500 tracking-widest mt-1">Digital Twin of your Brain</p>
        </header>

        <MindMap 
          data={mindMap} 
          onUpdateNode={handleUpdateNode}
          isTaskWidgetVisible={isTaskWidgetVisible}
          onToggleTaskWidget={() => setIsTaskWidgetVisible(!isTaskWidgetVisible)}
        />

        {/* Task Widget: Floating Persistent Overlay */}
        <div className={`absolute top-6 right-6 z-20 pointer-events-auto transition-all duration-500 transform ${isTaskWidgetVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
          <TaskWidget 
            tasks={tasks} 
            isSyncing={isSyncingTasks}
            onUpdateTask={updateTaskInMindMap}
            onManualSync={syncTasks}
            onClose={() => setIsTaskWidgetVisible(false)}
          />
        </div>
      </div>

      {/* Right Sidebar: Chat Window / Neural Interface */}
      <div className={`relative h-full border-l border-white/10 bg-slate-900/40 backdrop-blur-xl flex flex-col z-30 transition-all duration-500 ${isChatCollapsed ? 'w-0' : 'w-[450px]'}`}>
        <div className={`${isChatCollapsed ? 'hidden' : 'block'} h-full flex flex-col`}>
          <ChatWindow 
            mindMap={mindMap}
            onApplyChanges={handleApplyChanges}
            onCollapse={() => setIsChatCollapsed(true)}
          />
        </div>
        
        {/* Re-expand button for chat */}
        {isChatCollapsed && (
          <button 
            onClick={() => setIsChatCollapsed(false)}
            className="absolute -left-12 top-6 p-3 bg-blue-600/80 hover:bg-blue-600 rounded-l-xl border border-blue-500/20 text-white transition-all shadow-lg shadow-blue-500/20 active:scale-95 z-40"
            title="Expand Neural Interface"
          >
            <MessageSquareText size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
