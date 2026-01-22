
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Cpu, Check, X, BrainCircuit, User, MicOff, ChevronRight } from 'lucide-react';
import { ChatMessage, MindMapData, MindMapChangeProposal } from '../types';
import { processBrainInput } from '../services/geminiService';

interface ChatWindowProps {
  mindMap: MindMapData;
  onApplyChanges: (proposal: MindMapChangeProposal) => void;
  onCollapse: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ mindMap, onApplyChanges, onCollapse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
        return;
      }
      recognitionRef.current.start();
    }
  };

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend && !isProcessing) return;

    // If still listening, stop it first
    if (isListening) {
      recognitionRef.current?.stop();
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await processBrainInput(textToSend, mindMap);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        suggestedChanges: response.suggestedChanges
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error processing your input. My neural pathways might be congested.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = (id: string, proposal: MindMapChangeProposal) => {
    onApplyChanges(proposal);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, suggestedChanges: undefined, content: m.content + "\n\n(Changes applied to mind map)" } : m));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Neural Interface</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Synced</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onCollapse}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-10">
            <div className="mb-4 p-4 rounded-full bg-slate-800">
              <Cpu size={48} className="text-blue-400" />
            </div>
            <h4 className="text-lg font-medium mb-2">Initialize Connection</h4>
            <p className="text-sm">Speak or type anything. I will learn from your inputs and organize your thoughts into your digital mind map.</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
              {m.role === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
            </div>
            <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : ''}`}>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                {m.content}
              </div>
              
              {m.suggestedChanges && (
                <div className="mt-3 p-4 bg-slate-800/80 border border-blue-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Check size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Suggested Updates</span>
                  </div>
                  <p className="text-xs text-slate-400 italic">"{m.suggestedChanges.explanation}"</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApply(m.id, m.suggestedChanges!)}
                      className="flex-grow bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors"
                    >
                      Apply to Map
                    </button>
                    <button 
                      onClick={() => setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, suggestedChanges: undefined } : msg))}
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              )}
              
              <span className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <BrainCircuit size={16} />
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listening Status Overlay */}
      {isListening && (
        <div className="px-4 py-2 bg-blue-600/10 border-t border-blue-500/20 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Neural Listening Active...</span>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-slate-950/80">
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-white/10 rounded-2xl focus-within:border-blue-500 transition-colors">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Paperclip size={20} />
            <input type="file" ref={fileInputRef} className="hidden" />
          </button>
          <input 
            className="flex-grow bg-transparent border-none outline-none text-sm p-1 placeholder:text-slate-600"
            placeholder={isListening ? "I'm listening..." : "Type a thought, task, or question..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={toggleListening}
            className={`p-2 transition-all rounded-full ${isListening ? 'bg-red-500/20 text-red-500' : 'text-slate-400 hover:text-white'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className={`p-2 rounded-xl transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 cursor-not-allowed'}`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
