import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2, Pill, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AiCopilot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! I'm your QuickRx AI Assistant. How can I help you with medications, substitutes, or drug info today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: textToSend });
      const aiMsg: Message = { role: 'ai', content: res.data.reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to my brain right now. Please check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Generic for Lipitor?", icon: Pill },
    { label: "Check Aspirin interactions", icon: AlertTriangle },
    { label: "Explain Metformin usage", icon: Info },
  ];

  return (
    <div className="h-[calc(100vh-140px)] max-w-5xl mx-auto flex flex-col gap-4 animate-in fade-in duration-700">
      {/* Chat History Area */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Gemini Clinical Engine</h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Live • v1.5 Flash</p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([messages[0]])}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
          >
            Clear History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-800 text-slate-200'
              }`}>
                {msg.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'ai' 
                  ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none' 
                  : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.label)}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your medical query here..." 
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl pl-6 pr-14 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-lg shadow-slate-200/50 text-lg"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white px-5 rounded-xl transition-all flex items-center justify-center shadow-md shadow-indigo-200"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          AI can make mistakes. Verify clinical data with official pharmacopoeia.
        </p>
      </div>
    </div>
  );
}