import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Search, User, CreditCard, ShoppingBag, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOrderStore } from '../store/useOrderStore';
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
        status: 'new'
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
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Add Items</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Item name..."
                    className="flex-1 bg-black border border-[#333] rounded-xl p-4 text-sm font-bold uppercase"
                  />
                  <select 
                    value={newItemStation}
                    onChange={(e) => setNewItemStation(e.target.value as Station)}
                    className="bg-black border border-[#333] rounded-xl px-4 text-xs font-black uppercase"
                  >
                    <option value="grill">GRILL</option>
                    <option value="fry">FRY</option>
                    <option value="prep">PREP</option>
                    <option value="bar">BAR</option>
                  </select>
                  <button onClick={addItem} className="bg-amber-500 text-black p-4 rounded-xl hover:bg-amber-600 transition-all shadow-lg">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl border border-[#333] overflow-hidden">
                <div className="p-4 border-b border-[#333] bg-black/20">
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ORDER TICKET PREVIEW</span>
                </div>
                <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-[#333] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-500">{item.qty}x</span>
                        <span className="text-sm font-bold text-gray-300 uppercase">{item.name}</span>
                      </div>
                      <span className="text-[9px] font-black bg-[#333] px-2 py-0.5 rounded text-gray-500 uppercase">{item.station}</span>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center py-6 text-gray-600 text-xs font-bold uppercase italic uppercase">No items added</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                 <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Estimated Total ($)</label>
                 <input 
                   type="number"
                   value={totalPrice}
                   onChange={(e) => setTotalPrice(Number(e.target.value))}
                   placeholder="0.00"
                   className="w-full bg-black border border-[#333] rounded-2xl p-4 text-3xl font-black focus:border-amber-500 outline-none transition-all"
                 />
                 <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Points earned: {Math.floor(totalPrice * 10)} PTS</p>
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
