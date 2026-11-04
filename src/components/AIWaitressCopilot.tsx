import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Mic, MicOff, Volume2, VolumeX, AlertTriangle, 
  Clock, Coffee, Play, Activity, CheckSquare, RefreshCw, Layers 
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { audioAlerts } from '../lib/audioAlerts';
import { cn } from '../lib/utils';

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'order' | 'loyalty' | 'inquiry' | 'inventory' | 'recommendation';
  message: string;
  table?: string;
}

interface ChatMessage {
  id: string;
  sender: 'staff' | 'ai';
  message: string;
  timestamp: Date;
}

const INITIAL_LOGS: ActivityLog[] = [
  { id: 'l1', timestamp: new Date(Date.now() - 480000), type: 'loyalty', message: 'Evie logged in VIP Guest Marcus (Gold Tier) at Table 4', table: '4' },
  { id: 'l2', timestamp: new Date(Date.now() - 360000), type: 'order', message: 'Evie routed Dine-in Order to Grill station: 1x Ribeye Steak Medium-Rare', table: '4' },
  { id: 'l3', timestamp: new Date(Date.now() - 240000), type: 'inquiry', message: 'Evie answered Table 2 regarding milk: "We have Oat, Almond, and Whole milk"', table: '2' },
  { id: 'l4', timestamp: new Date(Date.now() - 120000), type: 'recommendation', message: 'Evie successfully upsold Sweet Potato Waffles to Table 5', table: '5' }
];

export default function AIWaitressCopilot() {
  const { orders } = useOrderStore();
  const { items, toggle86, initialize: initInventory } = useInventoryStore();
  const { role } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'console' | 'inventory' | 'alerts'>('console');
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm1', sender: 'ai', message: "Salutations Back-Of-House. I am Evie, your Front-Of-House AI Waitress. I'm actively monitoring tables, handling orders, and tracking guest satisfaction. Let me know what you need or if I should highlight any inventory recommendations.", timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [copilotState, setCopilotState] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');
  const [audioMuted, setAudioMuted] = useState(audioAlerts.getMuted());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initInventory();
  }, [initInventory]);

  // Auto Scroll Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic random live activities to make BOH feel dynamically linked with FOH AI
  useEffect(() => {
    const activityInterval = setInterval(() => {
      const activities: Omit<ActivityLog, 'id' | 'timestamp'>[] = [
        { type: 'loyalty', message: 'Evie awarded 120 loyalty points to Sarah at Table 3', table: '3' },
        { type: 'inquiry', message: 'Evie explained vegan options to Table 1: "The Quinoa Harvest Bowl is 100% vegan."', table: '1' },
        { type: 'recommendation', message: 'Evie recommended the Amber Espresso Latte to Table 6', table: '6' },
        { type: 'order', message: 'Evie received customized request for Table 2: "extra garlic aioli"', table: '2' },
        { type: 'inventory', message: 'Evie synchronized: Checked the 86 list. Verified item status for Table 5.', table: '5' }
      ];

      const chosen = activities[Math.floor(Math.random() * activities.length)];
      const newLog: ActivityLog = {
        id: Math.random().toString(),
        timestamp: new Date(),
        ...chosen
      };

      setLogs(prev => [newLog, ...prev.slice(0, 9)]);
      
      // Play brief high-tier alert in BOH for new FOH events
      if (chosen.type === 'order') {
        audioAlerts.playNewOrderChime();
      }
    }, 45000); // Trigger every 45s

    return () => clearInterval(activityInterval);
  }, []);

  // Text-To-Speech function for Evie
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    
    // Stop any current speaking
    window.speechSynthesis?.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to select a clean female English voice for "Evie"
    const voices = window.speechSynthesis?.getVoices() || [];
    const evieVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Samantha') || v.lang.startsWith('en'));
    
    if (evieVoice) {
      utterance.voice = evieVoice;
    }
    
    utterance.pitch = 1.1;
    utterance.rate = 1.0;

    utterance.onstart = () => setCopilotState('speaking');
    utterance.onend = () => setCopilotState('idle');
    utterance.onerror = () => setCopilotState('idle');

    window.speechSynthesis?.speak(utterance);
  };

  const handleMuteToggle = () => {
    const nextMuted = !audioMuted;
    setAudioMuted(nextMuted);
    audioAlerts.setMuted(nextMuted);
  };

  // Automated smart conversational responder
  const processAICommand = (query: string) => {
    setCopilotState('processing');
    const q = query.toLowerCase();
    
    setTimeout(() => {
      let responseText = '';
      
      if (q.includes('status') || q.includes('tables') || q.includes('occupancy')) {
        const activeT = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        responseText = `Currently we have ${activeT.length} active tables being served. Evie is managing interactive guest dialogues at ${Math.max(1, activeT.length - 1)} of them. Our table throughput rate is steady.`;
      } 
      else if (q.includes('86') || q.includes('out of') || q.includes('inventory') || q.includes('stock')) {
        const oos = items.filter(i => i.is86d);
        if (oos.length > 0) {
          responseText = `The following menu items are currently marked 86'd on the digital tablets: ${oos.map(i => i.name).join(', ')}. Evie has dynamically removed them from active guest suggestions.`;
        } else {
          responseText = "Everything is currently available! The full menu is active, and I am recommending all standard dishes to incoming tables.";
        }
      } 
      else if (q.includes('recommend') || q.includes('suggest') || q.includes('promo')) {
        // Find most expensive available item
        const topAvailable = [...items].filter(i => !i.is86d).sort((a,b) => b.price - a.price)[0];
        responseText = `Excellent directive. I will actively promote the ${topAvailable?.name || 'Bridge Burger'} (priced at $${topAvailable?.price || 16}) to high-ticket VIP parties currently seated.`;
        
        // Add log entry
        const promoLog: ActivityLog = {
          id: Math.random().toString(),
          timestamp: new Date(),
          type: 'recommendation',
          message: `Evie set priority push: Actively recommending ${topAvailable?.name} at FOH`
        };
        setLogs(prev => [promoLog, ...prev]);
        audioAlerts.playNewOrderChime();
      } 
      else if (q.includes('allergy') || q.includes('allerg')) {
        const allergicT = orders.filter(o => o.special_requests?.toLowerCase().includes('allergy') || o.special_requests?.toLowerCase().includes('allergic'));
        if (allergicT.length > 0) {
          responseText = `Attention line cooks! Table ${allergicT.map(o => o.table_number).join(', ')} has flagged critical allergy concerns. Please verify cross-contamination safeguards immediately.`;
        } else {
          responseText = "No active table has reported allergies in their latest digital ticket. Standby for updates.";
        }
      } 
      else if (q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
        responseText = `Hello! Evie here. Line cooks, expediter, and managers are working flawlessly today. Let me know if you need any table telemetry.`;
      } 
      else {
        responseText = `Understood. I've updated my location algorithms. I'll maintain constant synchronization with BOH to ensure we pacing tickets smoothly.`;
      }

      setMessages(prev => [
        ...prev, 
        { id: Math.random().toString(), sender: 'ai', message: responseText, timestamp: new Date() }
      ]);
      setCopilotState('speaking');
      speakText(responseText);

    }, 1000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'staff', message: userMsg, timestamp: new Date() }]);
    setInputText('');
    processAICommand(userMsg);
  };

  // Speech-to-Text handler
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setCopilotState('listening');
      audioAlerts.playNewOrderChime();
    };

    recognition.onend = () => {
      setIsListening(false);
      if (copilotState === 'listening') setCopilotState('idle');
    };

    recognition.onerror = () => {
      setIsListening(false);
      setCopilotState('idle');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'staff', message: transcript, timestamp: new Date() }]);
        processAICommand(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Quick Action triggers for high-tier tactile tablets
  const triggerQuickAction = (label: string, query: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'staff', message: label, timestamp: new Date() }]);
    processAICommand(query);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-[calc(100vh-140px)] h-auto pb-12 xl:pb-0">
      
      {/* Left Column (6 Cols): Live FOH Activity Feed & Metrics */}
      <div className="xl:col-span-5 flex flex-col gap-6 xl:overflow-hidden h-auto">
        
        {/* Evie Digital Wave/Status Card */}
        <div className="bg-[#111] border-2 border-[#222] rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[180px]">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">FOH AI ASSISTANT</span>
          </div>

          <div className="absolute top-4 right-6 flex gap-2">
            <button 
              onClick={handleMuteToggle}
              className="p-1.5 bg-black/40 hover:bg-white/5 rounded-lg border border-[#333] text-gray-400 transition-colors"
              title={audioMuted ? "Unmute Sounds" : "Mute Sounds"}
            >
              {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-black uppercase border transition-all flex items-center gap-1",
                voiceEnabled ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-black/40 border-[#333] text-gray-500"
              )}
            >
              VOICE: {voiceEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Glowing Aura Visual representing AI State */}
          <div className="relative mt-4">
            <motion.div 
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all relative z-10",
                copilotState === 'listening' ? "bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" :
                copilotState === 'speaking' ? "bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]" :
                copilotState === 'processing' ? "bg-blue-500/10 border-blue-500 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                "bg-[#1A1A1A] border-gray-800"
              )}
            >
              <Sparkles className={cn(
                "w-8 h-8",
                copilotState === 'listening' ? "text-red-500" :
                copilotState === 'speaking' ? "text-amber-500" :
                copilotState === 'processing' ? "text-blue-500" :
                "text-gray-500"
              )} />
            </motion.div>

            {/* Simulated Animated Voice Waves */}
            <AnimatePresence>
              {(copilotState === 'speaking' || copilotState === 'listening') && (
                <>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0.3 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                    className={cn("absolute inset-0 rounded-full border-2", copilotState === 'listening' ? "border-red-500" : "border-amber-500")}
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.9, opacity: 0.15 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.6, delay: 0.3, ease: "easeOut" }}
                    className={cn("absolute inset-0 rounded-full border-2", copilotState === 'listening' ? "border-red-500" : "border-amber-500")}
                  />
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4">
            <h3 className="font-mono text-lg font-black uppercase tracking-tight">EVIE ASSISTANT V3</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-0.5">
              STATUS: {copilotState === 'listening' ? 'LISTENING FOR COMMAND...' : 
                        copilotState === 'speaking' ? 'SPEECH ACTIVE...' : 
                        copilotState === 'processing' ? 'CONSULTING TELEMETRY...' : 'MONITORING FOH'}
            </p>
          </div>
        </div>

        {/* Live Activity Log / Ticker Feed */}
        <div className="bg-[#111] border-2 border-[#222] rounded-3xl p-6 h-[350px] xl:h-auto xl:flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#222]">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500 animate-pulse" /> LIVE TELEMETRY FEED
              </h3>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Real-time artificial intelligence activity logs</p>
            </div>
            <span className="text-[9px] font-black bg-black/40 border border-[#333] text-gray-500 px-2.5 py-1 rounded-full uppercase">SECURE SYNC</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-black/40 rounded-2xl border border-gray-900 flex items-start justify-between gap-4 group hover:border-[#333] transition-all"
                >
                  <div className="flex gap-3">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0",
                      log.type === 'order' ? 'bg-amber-500' :
                      log.type === 'loyalty' ? 'bg-green-500' :
                      log.type === 'inquiry' ? 'bg-blue-500' :
                      log.type === 'inventory' ? 'bg-red-500' : 'bg-purple-500'
                    )} />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-300 leading-normal">{log.message}</p>
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1 block">
                        {log.type.toUpperCase()} • {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  {log.table && (
                    <span className="text-[9px] font-black bg-[#1A1A1A] border border-[#222] text-gray-400 px-2 py-0.5 rounded uppercase">
                      TBL {log.table}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Right Column (7 Cols): Intelligent Chat console & Directives */}
      <div className="xl:col-span-7 bg-[#111] border-2 border-[#222] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative h-[650px] xl:h-full">
        
        {/* Tab Selection */}
        <div className="flex bg-[#161616] border-b border-[#222]">
          <button
            onClick={() => setActiveTab('console')}
            className={cn(
              "flex-1 py-4 text-center text-xs font-black uppercase tracking-widest transition-all border-b-2",
              activeTab === 'console' ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-gray-500 hover:text-white"
            )}
          >
            INTERACTION CONSOLE
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "flex-1 py-4 text-center text-xs font-black uppercase tracking-widest transition-all border-b-2",
              activeTab === 'inventory' ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-gray-500 hover:text-white"
            )}
          >
            86'D INVENTORY MANAGER
          </button>
        </div>

        {/* Console view */}
        {activeTab === 'console' && (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            
            {/* Directives/Quick Actions Box */}
            <div className="p-4 bg-[#151515] border-b border-[#222]">
              <span className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2.5">TACTICAL Directives FOR EVIE</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => triggerQuickAction("Recommend Specials Priority", "proactively recommend our high-margin specials to VIP guests")}
                  className="px-3 py-1.5 bg-black/40 hover:bg-amber-500 hover:text-black border border-[#333] hover:border-amber-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  🚀 UPSELL HIGH-MARGIN
                </button>
                <button
                  onClick={() => triggerQuickAction("Check Allergy telemetry", "check active dining tables for allergen declarations")}
                  className="px-3 py-1.5 bg-black/40 hover:bg-red-500 hover:text-white border border-[#333] hover:border-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  ⚠️ CHECK ALLERGENS
                </button>
                <button
                  onClick={() => triggerQuickAction("Check telemetric occupancy", "give me table status and dining room throughput levels")}
                  className="px-3 py-1.5 bg-black/40 hover:bg-blue-500 hover:text-white border border-[#333] hover:border-blue-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  📊 TBL telemetry
                </button>
                <button
                  onClick={() => triggerQuickAction("Verify 86-list sync", "sync and confirm our active 86 out of stock items")}
                  className="px-3 py-1.5 bg-black/40 hover:bg-purple-500 hover:text-white border border-[#333] hover:border-purple-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  🗄️ SYNC 86'd list
                </button>
              </div>
            </div>

            {/* Messages Scrollbox */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/30">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.sender === 'staff' ? 'ml-auto items-end' : 'mr-auto items-start')}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className={cn("text-[9px] font-black uppercase", m.sender === 'staff' ? 'text-blue-500' : 'text-amber-500')}>
                      {m.sender === 'staff' ? `Staff override (${role?.toUpperCase()})` : 'AI EVIE'}
                    </span>
                    <span className="text-[8px] text-gray-600 font-bold uppercase">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-3xl text-sm leading-relaxed",
                    m.sender === 'staff' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-[#1A1A1A] border border-[#2d2d2d] text-gray-200 rounded-tl-none font-medium"
                  )}>
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="p-4 bg-[#151515] border-t border-[#222]">
              <form onSubmit={handleSend} className="flex gap-2.5 max-w-4xl mx-auto">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all",
                    isListening 
                      ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" 
                      : "bg-black/40 border-[#333] text-gray-500 hover:border-amber-500/50"
                  )}
                  title="Voice Command (Tap to speak)"
                >
                  {isListening ? <MicOff className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Instruct the AI Waitress... (e.g., 'Suggest Ribeye', 'Table occupancy')"}
                  className="flex-1 bg-black border border-[#333] rounded-2xl px-4 text-sm focus:border-amber-500 outline-none transition-all placeholder-gray-700"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="h-12 w-12 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 86'd Inventory list manager view */}
        {activeTab === 'inventory' && (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="p-6 border-b border-[#222] bg-[#151515]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">TACTILE 86-LIST TOGGLE BOARD</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                Toggling an item instantly locks it from Waitstaff ordering systems and commands the AI Waitress to stop selling it.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {['grill', 'fry', 'prep', 'bar'].map((st) => {
                const stationItems = items.filter(i => i.station === st);
                return (
                  <div key={st} className="space-y-3">
                    <h4 className="text-[10px] font-black text-amber-500 tracking-[0.25em] uppercase border-b border-gray-900 pb-1.5">
                      {st.toUpperCase()} STATION
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stationItems.map((item) => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "p-4 rounded-2xl border transition-all flex justify-between items-center",
                            item.is86d 
                              ? "bg-red-500/5 border-red-500/30 opacity-70" 
                              : "bg-black/35 border-gray-900 hover:border-[#333]"
                          )}
                        >
                          <div>
                            <span className="text-[10px] font-black bg-[#222] text-gray-500 px-2 py-0.5 rounded uppercase tracking-wider">
                              {item.id.toUpperCase()}
                            </span>
                            <p className={cn("text-sm font-bold mt-1.5 uppercase", item.is86d ? "text-red-500/80 line-through" : "text-white")}>
                              {item.name}
                            </p>
                            <span className="text-[10px] text-gray-500 mt-0.5 block font-bold font-mono">${item.price.toFixed(2)}</span>
                          </div>

                          <button
                            onClick={() => {
                              toggle86(item.id, role || 'Staff Override');
                              // Play clean physical audio beep
                              if (!item.is86d) {
                                audioAlerts.playWarningBuzz();
                              } else {
                                audioAlerts.playKitchenBellChime();
                              }
                            }}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                              item.is86d 
                                ? "bg-red-500 text-white shadow-lg shadow-red-500/10 hover:bg-red-600" 
                                : "bg-[#222] hover:bg-white/5 text-gray-400 hover:text-white border border-[#333]"
                            )}
                          >
                            {item.is86d ? "86'D (LOCK)" : "ACTIVE"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
