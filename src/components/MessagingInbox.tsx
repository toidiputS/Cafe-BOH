import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, User, Clock, Check, Mic, MicOff, Package } from 'lucide-react';
import { useMessageStore } from '../store/useMessageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function MessagingInbox() {
  const { role } = useAuthStore();
  const { messages, subscribeToMessages, sendMessage, markAsRead } = useMessageStore();
  const [recipient, setRecipient] = useState('head_chef');
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { orders } = useOrderStore();

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice-to-text is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setText(prev => {
          const trimmed = prev.trim();
          return trimmed + (trimmed ? ' ' : '') + finalTranscript;
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    if (role) subscribeToMessages(role);
  }, [role, subscribeToMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !role) return;
    
    setSending(true);
    try {
      await sendMessage(recipient, role, text, activeOrderId || undefined);
      setText('');
      setActiveOrderId('');
    } finally {
      setSending(false);
    }
  };

  const allRoles = [
    { id: 'head_chef', label: 'Chef' },
    { id: 'waitress', label: 'Waitress' },
    { id: 'manager', label: 'Manager' },
    { id: 'bartender', label: 'Bartender' },
    { id: 'expeditor', label: 'Expeditor' },
    { id: 'prep_cook', label: 'Prep' },
    { id: 'takeout_host', label: 'Takeout' },
    { id: 'driver', label: 'Driver' }
  ].filter(r => r.id !== role);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)]">
      {/* Compose / Sidebar */}
      <div className="lg:col-span-4 bg-[#1A1A1A] border border-[#333] rounded-lg p-6 flex flex-col overflow-y-auto custom-scrollbar">
        <h3 className="text-lg font-black text-amber-500 mb-6 flex items-center gap-2 tracking-tighter">
          <Send className="w-5 h-5" /> NEW TRANSMISSION
        </h3>
        
        <form onSubmit={handleSend} className="space-y-6 flex-1 flex flex-col">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">TARGET STATION</label>
            <div className="grid grid-cols-2 gap-2">
              {allRoles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRecipient(r.id)}
                  className={cn(
                    "py-2.5 px-3 rounded text-[11px] font-black transition-all border uppercase tracking-tighter",
                    recipient === r.id 
                      ? "bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                      : "bg-[#0A0A0A] border-[#333] text-gray-400 hover:border-gray-500"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">LINK TO ORDER (OPTIONAL)</label>
            <select 
              value={activeOrderId}
              onChange={(e) => setActiveOrderId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#333] rounded p-3 text-xs font-mono focus:border-amber-500 outline-none"
            >
              <option value="">NO ORDER LINKED</option>
              {activeOrders.map(o => (
                <option key={o.id} value={o.id}>
                  TABLE {o.table_number || '?'} - {o.customer_name || 'WALK-IN'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col relative">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">MESSAGE CONTENT</label>
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black transition-all border",
                  isListening 
                    ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse" 
                    : "bg-black/40 border-[#333] text-gray-500 hover:text-amber-500 hover:border-amber-500"
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3 h-3" /> STOP DICTATING
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3" /> VOICE-TO-TEXT
                  </>
                )}
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isListening ? "Listening..." : "e.target.value = '86 the salmon, 10 min wait'..."}
              className={cn(
                "flex-1 w-full bg-[#0A0A0A] border border-[#333] rounded-lg p-4 text-sm focus:outline-none focus:border-amber-500 font-mono resize-none leading-relaxed transition-all",
                isListening && "border-red-500/50 ring-1 ring-red-500/20"
              )}
            />
          </div>

          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-black font-black py-4 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-xl"
          >
            {sending ? 'COMMUNICATING...' : 'PUSH TO STATION'}
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      {/* Inbox / History */}
      <div className="lg:col-span-8 bg-[#1A1A1A] border border-[#333] rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#252525]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-black text-xs tracking-widest uppercase">BRIDGE SECURE RECEPTION</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-black/40 text-[10px] px-3 py-1 rounded-full font-black text-gray-400 border border-[#333]">
              {messages.length} ARCHIVED
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0D0D0D]">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => {
              const isFromMe = msg.from_role === role;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  onClick={() => !msg.is_read && markAsRead(msg.id)}
                  className={cn(
                    "flex flex-col max-w-[85%] transition-all",
                    isFromMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    {!isFromMe && <span className="text-[10px] font-black text-amber-500 uppercase">{msg.from_role.replace('_', ' ')}</span>}
                    <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDistanceToNow(new Date(msg.created_at))} ago</span>
                    {isFromMe && <span className="text-[10px] font-black text-blue-400 uppercase">YOU</span>}
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border text-sm relative transition-all group",
                    isFromMe 
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-50 rounded-tr-none" 
                      : msg.is_read 
                        ? "bg-[#1A1A1A] border-[#333] text-gray-300 rounded-tl-none" 
                        : "bg-amber-500/10 border-amber-500/40 text-white rounded-tl-none shadow-[0_4px_20px_rgba(245,158,11,0.05)]"
                  )}>
                    {!msg.is_read && !isFromMe && (
                      <div className="absolute -left-1.5 top-0 w-3 h-3 bg-amber-500 rounded-full border-2 border-[#0D0D0D]" />
                    )}

                    <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.message}</p>

                    {msg.order_id && (
                      <div className={cn(
                        "mt-3 pt-2 border-t text-[10px] font-black flex items-center gap-2",
                        isFromMe ? "border-blue-500/20 text-blue-400" : "border-amber-500/20 text-amber-500"
                      )}>
                        <Package className="w-3 h-3" />
                        REF: ORDER #{msg.order_id.slice(0, 8).toUpperCase()}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-[#333]">
                <MessageSquare className="w-8 h-8 text-gray-700" />
              </div>
              <p className="font-black uppercase tracking-widest text-xs text-gray-700">No Comms Active</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
