import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  MessageSquare, 
  User, 
  Clock, 
  Check, 
  Mic, 
  MicOff, 
  Package, 
  Globe, 
  UserRound,
  ShieldCheck
} from 'lucide-react';
import { useMessageStore } from '../store/useMessageStore';
import { useCustomerMessageStore } from '../store/useCustomerMessageStore';
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

type Tab = 'staff' | 'customers';

export default function MessagingInbox() {
  const { role, user } = useAuthStore();
  const { messages: staffMessages, subscribeToMessages, sendMessage, markAsRead: markStaffRead } = useMessageStore();
  const { messages: customerMessages, subscribeToCustomerMessages, replyToCustomer, markAsRead: markCustomerRead } = useCustomerMessageStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('staff');
  const [activeStaffRole, setActiveStaffRole] = useState<string>('manager');
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [activeCustomer, setActiveCustomer] = useState<{name: string, orderId?: string, guestId?: string} | null>(null);
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
    if (role) {
      subscribeToMessages(role);
      subscribeToCustomerMessages();
    }
  }, [role, subscribeToMessages, subscribeToCustomerMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !role) return;
    
    setSending(true);
    try {
      if (activeTab === 'staff') {
        await sendMessage(activeStaffRole, role, text, activeOrderId || undefined);
      } else if (activeCustomer && user) {
        await replyToCustomer(text, activeCustomer.name, user.id, role, activeCustomer.orderId, activeCustomer.guestId);
      }
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

  useEffect(() => {
    if (activeTab === 'staff' && !activeStaffRole && allRoles.length > 0) {
      setActiveStaffRole(allRoles[0].id);
    }
  }, [activeTab, activeStaffRole, allRoles]);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  const filteredStaffMessages = staffMessages.filter(m => 
    (m.from_role === role && m.to_role === activeStaffRole) || 
    (m.from_role === activeStaffRole && m.to_role === role)
  );

  const staffList = allRoles.map(r => {
    const lastMsg = staffMessages.find(m => 
      (m.from_role === r.id && m.to_role === role) || 
      (m.from_role === role && m.to_role === r.id)
    );
    const unreadCount = staffMessages.filter(m => 
      m.from_role === r.id && m.to_role === role && !m.is_read
    ).length;
    return { ...r, lastMsg, unreadCount };
  });

  // Groups customer messages by unique guest_id or name if guest_id is missing
  const customerList = Array.from(new Map(customerMessages.map(m => [m.guest_id || m.customer_name, m])).values())
    .map(m => ({ 
      name: m.customer_name, 
      guestId: m.guest_id,
      lastMsg: customerMessages.find(cm => cm.guest_id === m.guest_id || cm.customer_name === m.customer_name) 
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)]">
      {/* Sidebar: Threads */}
      <div className="lg:col-span-4 bg-[#1A1A1A] border border-[#333] rounded-lg p-6 flex flex-col overflow-hidden">
        <div className="flex gap-2 mb-8 bg-black/40 p-1 rounded-xl border border-[#333]">
          <button 
            onClick={() => setActiveTab('staff')}
            className={cn(
              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'staff' ? "bg-amber-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <ShieldCheck className="w-3 h-3" /> STAFF
            {staffMessages.filter(m => !m.is_read && m.to_role === role).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={cn(
              "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'customers' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <Globe className="w-3 h-3" /> CUSTOMERS
            {customerMessages.filter(m => !m.is_read && m.sender_type === 'customer').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          <AnimatePresence mode="wait">
            {activeTab === 'staff' ? (
              <motion.div 
                key="staff-list"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                className="space-y-2"
              >
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">CONVERSATIONS</label>
                {staffList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStaffRole(s.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 relative",
                      activeStaffRole === s.id 
                        ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10" 
                        : "bg-black/40 border-[#333] text-gray-400 hover:border-amber-500/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border",
                      activeStaffRole === s.id ? "bg-black/10 border-black/10" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}>
                      {s.label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black uppercase tracking-tighter truncate">{s.label} STATION</div>
                      {s.lastMsg && (
                        <div className={cn(
                          "text-[9px] font-bold truncate mt-0.5",
                          activeStaffRole === s.id ? "text-black/60" : "text-gray-600"
                        )}>
                          {s.lastMsg.message}
                        </div>
                      )}
                    </div>
                    {s.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                        {s.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="customer-list"
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">GUEST INQUIRIES</label>
                {customerList.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setActiveCustomer({ name: c.name, orderId: c.lastMsg?.order_id, guestId: c.guestId })}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 relative",
                      activeCustomer?.name === c.name 
                        ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                        : "bg-black/40 border-[#333] text-gray-400 hover:border-blue-500/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border",
                      activeCustomer?.name === c.name ? "bg-white/20 border-white/20" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    )}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black uppercase tracking-tighter truncate">{c.name}</div>
                      {c.lastMsg && (
                        <div className={cn(
                          "text-[9px] font-bold truncate mt-0.5",
                          activeCustomer?.name === c.name ? "text-white/60" : "text-gray-600"
                        )}>
                          {c.lastMsg.message}
                        </div>
                      )}
                    </div>
                    {!c.lastMsg?.is_read && c.lastMsg?.sender_type === 'customer' && (
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:col-span-8 bg-[#1A1A1A] border border-[#333] rounded-lg flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#252525] z-10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              activeTab === 'staff' ? "bg-amber-500" : "bg-blue-500"
            )} />
            <h3 className="font-black text-xs tracking-widest uppercase">
              {activeTab === 'staff' 
                ? `COMMS: ${allRoles.find(r => r.id === activeStaffRole)?.label || 'SELECT STATION'} STATION` 
                : `GUEST: ${activeCustomer?.name || 'SELECT INQUIRY'}`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-black/40 text-[10px] px-3 py-1 rounded-full font-black text-gray-400 border border-[#333]">
              {activeTab === 'staff' ? filteredStaffMessages.length : customerMessages.filter(m => m.customer_name === activeCustomer?.name).length} MESSAGES
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0D0D0D] flex flex-col-reverse">
          <div className="space-y-6 flex flex-col">
            <AnimatePresence mode="popLayout" initial={false}>
              {(activeTab === 'staff' ? [...filteredStaffMessages].reverse() : [...customerMessages.filter(m => m.guest_id ? m.guest_id === activeCustomer?.guestId : m.customer_name === activeCustomer?.name)].reverse()).map((msg: any) => {
                const isFromMe = (activeTab === 'staff') 
                  ? (msg.from_role === role)
                  : (msg.sender_type === 'staff');
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    onClick={() => {
                      if (!msg.is_read && !isFromMe) {
                        if (activeTab === 'staff') markStaffRead(msg.id);
                        else markCustomerRead(msg.id);
                      }
                    }}
                    className={cn(
                      "flex flex-col max-w-[85%] transition-all",
                      isFromMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      {!isFromMe && (
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          activeTab === 'staff' ? "text-amber-500" : "text-blue-400"
                        )}>
                          {activeTab === 'staff' ? msg.from_role.replace('_', ' ') : msg.customer_name}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDistanceToNow(new Date(msg.created_at))} ago</span>
                      {isFromMe && <span className="text-[10px] font-black text-blue-400 uppercase">YOU ({msg.staff_role || role})</span>}
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border text-sm relative transition-all group shadow-lg",
                      isFromMe 
                        ? "bg-blue-600 border-blue-500 text-white rounded-tr-none" 
                        : msg.is_read 
                          ? "bg-[#1A1A1A] border-[#333] text-gray-300 rounded-tl-none" 
                          : cn(
                              "rounded-tl-none",
                              activeTab === 'staff' ? "bg-amber-500 border-amber-500 text-black font-black" : "bg-blue-500/20 border-blue-500 text-white"
                            )
                    )}>
                      <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.message}</p>

                      {msg.order_id && (
                        <div className={cn(
                          "mt-3 pt-2 border-t text-[10px] font-black flex items-center gap-2",
                          isFromMe ? "border-white/20 text-white/60" : "border-black/10 text-black/40"
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

            {((activeTab === 'staff' ? filteredStaffMessages.length : customerMessages.filter(m => m.guest_id ? m.guest_id === activeCustomer?.guestId : m.customer_name === activeCustomer?.name).length) === 0) && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20 opacity-40">
                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-[#333]">
                  {activeTab === 'staff' ? <MessageSquare className="w-8 h-8" /> : <Globe className="w-8 h-8" />}
                </div>
                <p className="font-black uppercase tracking-widest text-[10px]">
                  {activeTab === 'staff' ? 'No Communication History' : activeCustomer ? 'Begin Conversation' : 'Select Inquiry'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Universal Input Area */}
        <div className="p-4 bg-[#1A1A1A] border-t border-[#333]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
              {activeTab === 'staff' && (
                <div className="flex-1 flex items-center gap-2 bg-black/40 border border-[#333] rounded-xl px-4 h-12">
                  <Package className="w-3.5 h-3.5 text-gray-600" />
                  <select 
                    value={activeOrderId}
                    onChange={(e) => setActiveOrderId(e.target.value)}
                    className="flex-1 bg-transparent text-[10px] font-black uppercase text-gray-400 outline-none cursor-pointer"
                  >
                    <option value="">NO ORDER LINKED</option>
                    {activeOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        ORDER {o.table_number || '?'} - {o.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "h-12 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase transition-all border",
                  isListening 
                    ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" 
                    : "bg-black/40 border-[#333] text-gray-500 hover:border-amber-500/50"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="hidden sm:inline">{isListening ? 'STOP' : 'VOICE'}</span>
              </button>
            </div>

            <div className="relative flex items-end gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend(e as any);
                   }
                }}
                placeholder={isListening ? "Listening..." : "Type a secure message..."}
                className={cn(
                  "flex-1 bg-black border border-[#333] rounded-2xl p-4 pr-12 text-sm focus:border-amber-500 outline-none transition-all min-h-[60px] max-h-32 resize-none",
                  isListening && "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                )}
              />
              <button
                type="submit"
                disabled={sending || !text.trim() || (activeTab === 'customers' && !activeCustomer)}
                className={cn(
                  "h-[60px] w-[60px] rounded-2xl flex items-center justify-center transition-all shadow-xl disabled:opacity-50",
                  activeTab === 'staff' ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-blue-500 hover:bg-blue-600 text-white"
                )}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
