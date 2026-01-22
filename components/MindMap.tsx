
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MindMapData, MindNode, MindEdge, NodeType } from '../types';
import { ZoomIn, ZoomOut, Home, Edit3, X, ClipboardList } from 'lucide-react';

interface MindMapProps {
  data: MindMapData;
  onUpdateNode: (node: MindNode) => void;
  isTaskWidgetVisible: boolean;
  onToggleTaskWidget: () => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, onUpdateNode, isTaskWidgetVisible, onToggleTaskWidget }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNode, setEditNode] = useState<MindNode | null>(null);

  const nodeColors: Record<NodeType, string> = {
    concept: '#60a5fa',
    task: '#f87171',
    person: '#c084fc',
    event: '#fbbf24',
    resource: '#34d399'
  };

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // To prevent mutation issues and ensure D3 correctly resolves IDs to the new objects
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.edges.map(d => ({ ...d }));

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial Viewport setup: Center at 50% zoom
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.5));

    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(links).id(d => d.id).distance(220))
      .force('charge', d3.forceManyBody().strength(-1800))
      .force('center', d3.forceCenter(0, 0))
      // Adding X and Y forces prevents unlinked nodes from flying into infinite space
      .force('x', d3.forceX(0).strength(0.08))
      .force('y', d3.forceY(0).strength(0.08))
      .force('collision', d3.forceCollide().radius(110));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.25)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.label === 'suggested' ? '5,5' : '0')
      .attr('class', 'transition-opacity duration-1000');

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'cursor-pointer group')
      .on('click', (event, d) => {
        const originalNode = data.nodes.find(n => n.id === d.id);
        if (originalNode) setSelectedNode(originalNode);
        event.stopPropagation();
      })
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', 32)
      .attr('fill', d => nodeColors[d.type] || '#fff')
      .attr('fill-opacity', 0.15)
      .attr('stroke', d => nodeColors[d.type] || '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-300 group-hover:stroke-white group-hover:fill-opacity-30');

    node.filter(d => !!d.icon).append('text')
      .text(d => d.icon!)
      .attr('dy', 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('class', 'pointer-events-none select-none');

    node.append('text')
      .text(d => d.label)
      .attr('dy', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('class', 'pointer-events-none select-none uppercase tracking-wider');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    const zoomIn = () => svg.transition().duration(500).call(zoom.scaleBy, 1.4);
    const zoomOut = () => svg.transition().duration(500).call(zoom.scaleBy, 0.7);
    const goHome = () => {
      const w = containerRef.current?.clientWidth || 800;
      const h = containerRef.current?.clientHeight || 600;
      svg.transition()
        .duration(800)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(w / 2, h / 2).scale(0.5));
    };

    (window as any).mindMapControls = { zoomIn, zoomOut, goHome };

    return () => {
      simulation.stop();
    };
  }, [data]);

  const handleEditClick = () => {
    setEditNode(selectedNode);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editNode) {
      onUpdateNode(editNode);
      setSelectedNode(editNode);
      setIsEditing(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950">
      <svg ref={svgRef} className="w-full h-full" onClick={() => setSelectedNode(null)} />
      
      <div className="absolute bottom-6 left-6 flex gap-2">
        <button 
          onClick={() => (window as any).mindMapControls?.zoomIn()} 
          className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          onClick={() => (window as any).mindMapControls?.zoomOut()} 
          className="p-3 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button 
          onClick={() => (window as any).mindMapControls?.goHome()} 
          className="p-3 bg-blue-600/80 hover:bg-blue-600 rounded-xl border border-blue-500/20 text-white transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          title="Core Consciousness"
        >
          <Home size={18} />
        </button>
        <button 
          onClick={onToggleTaskWidget} 
          className={`p-3 rounded-xl border transition-all shadow-lg active:scale-95 ${isTaskWidgetVisible ? 'bg-amber-600/80 border-amber-500/20 text-white shadow-amber-500/20' : 'bg-slate-800/80 hover:bg-slate-700 border-white/10 text-slate-400 hover:text-white'}`}
          title="Toggle Task Cortex"
        >
          <ClipboardList size={18} />
        </button>
      </div>

      {selectedNode && (
        <div className="absolute bottom-20 left-6 w-80 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {isEditing ? (
            <div className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-mono text-blue-400 uppercase tracking-widest">Editing Node</h3>
                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
              </div>
              <div className="flex gap-3">
                <input 
                  className="w-12 bg-slate-800 border border-white/10 rounded px-2 py-2 outline-none focus:border-blue-500 text-center text-lg"
                  value={editNode?.icon || ''}
                  onChange={e => setEditNode(prev => prev ? {...prev, icon: e.target.value} : null)}
                  placeholder="🚀"
                  title="Icon (Emoji)"
                />
                <input 
                  className="flex-grow bg-slate-800 border border-white/10 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors text-white"
                  value={editNode?.label}
                  onChange={e => setEditNode(prev => prev ? {...prev, label: e.target.value} : null)}
                  placeholder="Node Name"
                />
              </div>
              <textarea 
                className="bg-slate-800 border border-white/10 rounded px-3 py-2 outline-none focus:border-blue-500 min-h-[100px] transition-colors text-sm text-slate-200"
                value={editNode?.description}
                onChange={e => setEditNode(prev => prev ? {...prev, description: e.target.value} : null)}
                placeholder="Description..."
              />
              <select 
                className="bg-slate-800 border border-white/10 rounded px-3 py-2 outline-none text-sm text-slate-200"
                value={editNode?.type}
                onChange={e => setEditNode(prev => prev ? {...prev, type: e.target.value as NodeType} : null)}
              >
                <option value="concept">Concept</option>
                <option value="task">Task</option>
                <option value="person">Person</option>
                <option value="event">Event</option>
                <option value="resource">Resource</option>
              </select>
              <button 
                onClick={saveEdit}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-semibold transition-colors text-sm shadow-lg shadow-blue-500/20"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  {selectedNode.icon && <span className="text-3xl">{selectedNode.icon}</span>}
                  <div>
                    <span 
                      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/20 mb-1.5 inline-block"
                      style={{ color: nodeColors[selectedNode.type], borderColor: nodeColors[selectedNode.type] }}
                    >
                      {selectedNode.type}
                    </span>
                    <h2 className="text-xl font-bold text-white leading-tight">{selectedNode.label}</h2>
                  </div>
                </div>
                <button 
                  onClick={handleEditClick}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mt-4">{selectedNode.description || "No description available."}</p>
              {(selectedNode.date || selectedNode.priority) && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4">
                   {selectedNode.date && (
                     <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Timeline</div>
                        <div className="text-xs text-blue-400 font-medium">{selectedNode.date}</div>
                     </div>
                   )}
                   {selectedNode.priority && (
                     <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Priority</div>
                        <div className={`text-xs font-bold uppercase ${
                          selectedNode.priority === 'high' ? 'text-red-400' : 
                          selectedNode.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>{selectedNode.priority}</div>
                     </div>
                   )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MindMap;
