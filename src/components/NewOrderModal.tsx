import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Search, User, CreditCard, ShoppingBag, Utensils, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { audioAlerts } from '../lib/audioAlerts';
import { cn } from '../lib/utils';
import type { CustomerProfile, Station } from '../types';

interface NewOrderModalProps {
  onClose: () => void;
}

export default function NewOrderModal({ onClose }: NewOrderModalProps) {
  const [step, setStep] = useState(1);
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout' | 'delivery'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerProfile[]>([]);
  const [items, setItems] = useState<{name: string, qty: number, station: Station}[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemStation, setNewItemStation] = useState<Station>('grill');
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [specialRequests, setSpecialRequests] = useState('');
  
  const { items: menuItems, initialize: initInventory } = useInventoryStore();
  const [activeMenuTab, setActiveMenuTab] = useState<'grill' | 'fry' | 'prep' | 'bar'>('grill');

  useEffect(() => {
    initInventory();
  }, [initInventory]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      supabase
        .from('customer_profiles')
        .select('*')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5)
        .then(({ data }) => {
          if (data) setSearchResults(data);
        });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const addItem = () => {
    if (newItemName) {
      setItems([...items, { name: newItemName, qty: 1, station: newItemStation }]);
      setNewItemName('');
    }
  };

  const handleCreateOrder = async () => {
    const { error } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber,
        customer_name: customerName || (selectedCustomerId ? searchResults.find(c => c.id === selectedCustomerId)?.full_name : 'Guest'),
        order_type: orderType,
        items: items.map(i => ({ ...i, status: 'pending', mods: [], customizations: '' })),
        total_price: totalPrice || (items.length * 15), // Estimate if not set
        customer_id: selectedCustomerId,
        status: 'new',
        special_requests: specialRequests
      });

    if (error) {
      alert(error.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1A1A1A] border border-[#333] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#333] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Create New Ticket</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Order Type</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'dine_in', label: 'DINE IN', icon: Utensils },
                      { id: 'takeout', label: 'TAKEOUT', icon: ShoppingBag },
                      { id: 'delivery', label: 'DELIVERY', icon: CreditCard }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setOrderType(t.id as any)}
                        className={cn(
                          "flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                          orderType === t.id ? "bg-amber-500 border-amber-500 text-black shadow-lg" : "bg-black/40 border-[#333] text-gray-500 hover:border-amber-500/50"
                        )}
                      >
                        <t.icon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Table / Unit #</label>
                  <input 
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full bg-black border border-[#333] rounded-2xl p-4 text-sm font-black focus:border-amber-500 outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Link Loyalty Member (Optional)</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-black border border-[#333] rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  {searchResults.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomerName(c.full_name);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl hover:bg-amber-500/10 transition-all flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tighter">{c.full_name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">{c.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-500 uppercase">{c.total_points} PTS</p>
                        <p className="text-[8px] font-black text-gray-600 uppercase">{c.tier} MEMBER</p>
                      </div>
                    </button>
                  ))}
                  {selectedCustomerId && (
                    <div className="p-4 bg-amber-500 text-black rounded-2xl flex justify-between items-center shadow-lg">
                      <div className="flex items-center gap-2 font-black uppercase text-xs">
                        <User className="w-4 h-4" /> LINKED: {customerName}
                      </div>
                      <button onClick={() => setSelectedCustomerId(null)} className="p-1 hover:bg-black/10 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dynamic Menu Selection Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Tap Menu Items to Add</label>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Real-time Stock Checked</span>
                </div>
                
                {/* Menu Category Tabs */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-[#333] overflow-x-auto gap-1">
                  {(['grill', 'fry', 'prep', 'bar'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveMenuTab(tab)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap px-3",
                        activeMenuTab === tab ? "bg-amber-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Menu Items Grid */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {menuItems.filter(i => i.station === activeMenuTab).map((menuItem) => (
                    <button
                      key={menuItem.id}
                      type="button"
                      disabled={menuItem.is86d}
                      onClick={() => {
                        setItems((prev) => {
                          const existing = prev.find(i => i.name === menuItem.name);
                          if (existing) {
                            return prev.map(i => i.name === menuItem.name ? { ...i, qty: i.qty + 1 } : i);
                          }
                          return [...prev, { name: menuItem.name, qty: 1, station: menuItem.station }];
                        });
                        setTotalPrice(prev => prev + menuItem.price);
                        audioAlerts.playFireItemSizzle();
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex flex-col justify-between h-[72px] transition-all relative overflow-hidden group/menuitem active:scale-95",
                        menuItem.is86d 
                          ? "bg-red-500/5 border-red-500/10 opacity-40 cursor-not-allowed" 
                          : "bg-black/30 border-[#222] hover:border-amber-500/40 hover:bg-black/50"
                      )}
                    >
                      {menuItem.is86d && (
                        <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> 86'D
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[10px] font-black text-white uppercase tracking-tight group-hover/menuitem:text-amber-500 transition-colors truncate max-w-[80%]">
                          {menuItem.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full mt-auto">
                        <span className="text-[9px] text-gray-500 font-bold font-mono">${menuItem.price.toFixed(2)}</span>
                        {!menuItem.is86d && (
                          <span className="text-[8px] text-amber-500/60 font-black uppercase tracking-widest group-hover/menuitem:text-amber-500">
                            + ADD
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Backup Add */}
              <div className="space-y-2 border-t border-[#222] pt-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Manual / Custom Item Entry</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Custom dish (e.g., Gluten-free pancake)..."
                    className="flex-1 bg-black border border-[#222] rounded-xl p-3 text-xs font-bold uppercase placeholder-gray-700 text-gray-200"
                  />
                  <select 
                    value={newItemStation}
                    onChange={(e) => setNewItemStation(e.target.value as Station)}
                    className="bg-black border border-[#222] rounded-xl px-3 text-[10px] font-black uppercase text-gray-400"
                  >
                    <option value="grill">GRILL</option>
                    <option value="fry">FRY</option>
                    <option value="prep">PREP</option>
                    <option value="bar">BAR</option>
                  </select>
                  <button 
                    type="button"
                    onClick={() => {
                      if (newItemName) {
                        setItems([...items, { name: newItemName, qty: 1, station: newItemStation }]);
                        setTotalPrice(prev => prev + 15); // Add default $15 for manual custom item
                        setNewItemName('');
                      }
                    }} 
                    className="bg-amber-500 hover:bg-amber-600 text-black px-4 rounded-xl transition-all shadow-lg font-black text-xs flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Ticket Preview */}
              <div className="bg-black/40 rounded-2xl border border-[#333] overflow-hidden">
                <div className="p-3.5 border-b border-[#333] bg-black/20 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ORDER TICKET PREVIEW</span>
                  {items.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        setItems([]);
                        setTotalPrice(0);
                      }}
                      className="text-[8px] font-black text-red-500 uppercase hover:underline"
                    >
                      CLEAR ALL
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-950 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-500 text-sm">{item.qty}x</span>
                        <span className="text-xs font-bold text-gray-300 uppercase">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] font-black bg-[#222] px-2 py-0.5 rounded text-gray-500 uppercase">{item.station}</span>
                        <button
                          type="button"
                          onClick={() => {
                            // Find item price if exists in inventory, otherwise default $15
                            const price = menuItems.find(mi => mi.name === item.name)?.price ?? 15;
                            setItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: it.qty - 1 } : it).filter(it => it.qty > 0));
                            setTotalPrice(prev => Math.max(0, prev - price));
                          }}
                          className="text-gray-600 hover:text-red-500 font-bold text-sm px-1.5"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center py-4 text-gray-600 text-[10px] font-black uppercase tracking-widest italic">No items added</p>
                  )}
                </div>
              </div>

              {/* Special Requests & Est Total */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Special Requests & Allergy Notes</label>
                  <textarea 
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Gluten allergy, dressing on the side..."
                    rows={2}
                    className="w-full bg-black border border-[#222] rounded-2xl p-3.5 text-xs font-semibold focus:border-amber-500 outline-none transition-all resize-none placeholder-gray-700 text-gray-200 h-[64px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Estimated Total ($)</label>
                    <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest">{Math.floor(totalPrice * 10)} PTS EARNED</span>
                  </div>
                  <input 
                    type="number"
                    value={totalPrice.toFixed(2)}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-black border border-[#222] rounded-2xl p-3.5 text-xl font-black text-amber-500 focus:border-amber-500 outline-none transition-all h-[64px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-[#333] flex justify-between gap-4">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="flex-1 border border-[#333] hover:bg-white/5 text-gray-500 font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
            >
              Back
            </button>
          )}
          <button 
            onClick={() => step === 1 ? setStep(2) : handleCreateOrder()}
            disabled={step === 1 ? !tableNumber : items.length === 0}
            className="flex-[2] bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {step === 1 ? 'Next Step' : 'Confirm & Send to Kitchen'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
