import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageCircle, ArrowLeft, Package, User, Star, Trophy, History, LogIn, LogOut } from 'lucide-react';
import { useCustomerMessageStore } from '../store/useCustomerMessageStore';
import { useLoyaltyStore } from '../store/useLoyaltyStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function CustomerSupportPortal() {
  const { messages, sendCustomerMessage, subscribeToCustomerMessages } = useCustomerMessageStore();
  const { profile, history, fetchLoyaltyData } = useLoyaltyStore();
  const { user, signOut } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [guestId, setGuestId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'loyalty'>('chat');

  useEffect(() => {
    // Persistent guest ID
    let storedId = localStorage.getItem('bridge_guest_id');
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 11);
      localStorage.setItem('bridge_guest_id', storedId);
    }
    setGuestId(storedId);

    // Auto-resume if name exists
    const storedName = localStorage.getItem('bridge_guest_name');
    if (storedName) {
      setName(storedName);
      setIsSessionStarted(true);
    }
  }, []);

  useEffect(() => {
    if (isSessionStarted) {
      subscribeToCustomerMessages();
      if (name) localStorage.setItem('bridge_guest_name', name);
    }
  }, [isSessionStarted, subscribeToCustomerMessages, name]);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData(user.id);
      setIsSessionStarted(true);
    }
  }, [user, fetchLoyaltyData]);
  
  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    } else if (user?.email) {
      setName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) setIsSessionStarted(true);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + '?customer' }
      });
      if (error) throw error;
      alert('Check your email for the magic link!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await sendCustomerMessage(message, name, orderId || undefined, guestId);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  // Filter messages for current session
  const myMessages = messages.filter(m => 
    (user && m.customer_id === user.id) || 
    m.guest_id === guestId || 
    (m.customer_name === name && !m.guest_id && !m.customer_id)
  );

  if (!isSessionStarted && !showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Bridge Support</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-tight mt-2">Real-time Guest Assistance</p>
          </div>

          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Identify Yourself</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="NAME OR INITIALS"
                  className="w-full bg-black border border-[#333] rounded-xl py-4 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all uppercase font-black tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group uppercase tracking-widest"
            >
              Start Guest Chat
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-[#333]" />
              <span className="text-[10px] font-black text-gray-600 uppercase">OR</span>
              <div className="h-px flex-1 bg-[#333]" />
            </div>

            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="w-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-500 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 group uppercase tracking-widest"
            >
              <LogIn className="w-4 h-4" /> Sign In / Rewards
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (showAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 shadow-2xl"
        >
          <button onClick={() => setShowAuth(false)} className="mb-6 text-gray-500 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <Star className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Rewards Program</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Earn 10 points for every $1</p>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR@EMAIL.COM"
                className="w-full bg-black border border-[#333] rounded-xl py-4 px-4 text-sm focus:border-amber-500 outline-none transition-all uppercase font-black tracking-widest shadow-inner"
              />
            </div>
            <button
              disabled={authLoading}
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group uppercase tracking-widest disabled:opacity-50"
            >
              {authLoading ? 'SENDING LINK...' : 'SEND MAGIC LINK'}
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-[#333] p-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setIsSessionStarted(false);
              setShowAuth(false);
            }}
            className="p-2 hover:bg-black rounded-lg transition-colors text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Bridge Café Help</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Support Agent Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-xl border border-[#333]">
              <div className="text-right">
                <div className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 justify-end">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {profile?.total_points || 0} PTS
                </div>
                <div className="text-[9px] font-black text-gray-500 uppercase">{profile?.tier || 'BRONZE'} MEMBER</div>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
             <div className="text-right">
                <div className="text-[10px] font-black text-blue-500 uppercase">{name}</div>
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">GUEST SESSION</div>
             </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-[#1A1A1A] border-b border-[#333]">
        <button 
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative",
            activeTab === 'chat' ? "text-blue-500" : "text-gray-500"
          )}
        >
          <MessageCircle className="w-4 h-4" /> SUPPORT CHAT
          {activeTab === 'chat' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('loyalty')}
          className={cn(
            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative",
            activeTab === 'loyalty' ? "text-amber-500" : "text-gray-500"
          )}
        >
          <Trophy className="w-4 h-4" /> LOYALTY REWARDS
          {activeTab === 'loyalty' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'chat' ? (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex flex-col h-[calc(100vh-160px)]"
          >
            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col-reverse">
              <div className="space-y-6">
                {[...myMessages].reverse().map((msg) => {
                  const isStaff = msg.sender_type === 'staff';
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "flex flex-col max-w-[85%]",
                        isStaff ? "mr-auto items-start" : "ml-auto items-end"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5 px-2">
                        {isStaff && <span className="text-[10px] font-black text-blue-500 uppercase">BRIDGE {msg.staff_role?.replace('_', ' ') || 'STAFF'}</span>}
                        <span className="text-[9px] text-gray-600 font-bold uppercase">{formatDistanceToNow(new Date(msg.created_at))} ago</span>
                        {!isStaff && <span className="text-[10px] font-black text-gray-400 uppercase">YOU</span>}
                      </div>
                      
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-lg",
                        isStaff 
                          ? "bg-[#1A1A1A] border border-[#333] text-gray-100 rounded-tl-none" 
                          : "bg-blue-600 text-white rounded-tr-none"
                      )}>
                        {msg.message}
                      </div>
                    </motion.div>
                  );
                })}
                {myMessages.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="inline-block p-6 bg-[#1A1A1A] border border-[#333] rounded-3xl mb-4 text-gray-400 text-sm">
                      Hello {name}! How can we help you today?
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Chat Input */}
            <footer className="p-4 bg-[#1A1A1A] border-t border-[#333]">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSend} className="relative flex items-end gap-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask the kitchen something..."
                    className="flex-1 bg-black border border-[#333] rounded-2xl p-4 pr-12 text-sm focus:border-blue-500 outline-none transition-all min-h-[56px] max-h-32 resize-none"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="p-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div 
            key="loyalty"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
          >
            {!user ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                  <LogIn className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Sign In for Rewards</h3>
                <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
                  Join the club to earn points on every dollar spent.
                </p>
                <button 
                  onClick={() => setShowAuth(true)}
                  className="bg-amber-500 text-black font-black px-8 py-4 rounded-xl uppercase tracking-widest shadow-lg"
                >
                  Join Now
                </button>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-8 pb-10">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-black shadow-2xl relative overflow-hidden">
                  <Star className="absolute -right-8 -top-8 w-40 h-40 text-black/10 rotate-12" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Current Balance</p>
                      <h2 className="text-5xl font-black">{profile?.total_points || 0}</h2>
                      <p className="text-xs font-black uppercase tracking-tight mt-1">Bridge Points</p>
                    </div>
                    <div className="bg-black/10 px-4 py-2 rounded-full border border-black/10">
                      <span className="text-sm font-black uppercase tracking-widest">{profile?.tier || 'BRONZE'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-12 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span>Tier Progress</span>
                      <span>Next Level</span>
                    </div>
                    <div className="h-3 bg-black/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((profile?.total_points || 0) / 1000) * 100, 100)}%` }}
                        className="h-full bg-white" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">History</h3>
                  </div>
                  <div className="space-y-2">
                    {history.map((entry) => (
                      <div key={entry.id} className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs",
                            entry.points_change > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {entry.points_change > 0 ? '+' : ''}{entry.points_change}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase">{entry.reason.replace('_', ' ')}</p>
                            <p className="text-[9px] text-gray-600 font-bold">{new Date(entry.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
