import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Flame, CheckCircle, Package, Ban, Clock } from 'lucide-react';
import type { Order, OrderItem, Station } from '../types';

export default function KitchenDisplaySystem() {
  const { orders, subscribeToOrders, updateItemStatus, updateOrderStatus } = useOrderStore();
  const { role } = useAuthStore();
  
  const [activeStation, setActiveStation] = useState<Station | 'all'>('all');

  useEffect(() => {
    subscribeToOrders();
  }, [subscribeToOrders]);

  // Set default station based on role
  useEffect(() => {
    if (role === 'grill_cook') setActiveStation('grill');
    else if (role === 'fry_cook') setActiveStation('fry');
    else if (role === 'prep_cook') setActiveStation('prep');
    else if (role === 'bartender') setActiveStation('bar');
    else if (role === 'expeditor') setActiveStation('expo');
    else if (role === 'head_chef' || role === 'manager') setActiveStation('all');
  }, [role]);

  // Only show orders that are new or in progress
  // Filter further by station if not 'all'
  const kitchenTickets = orders.filter(o => {
    const isNewOrInProgress = o.status === 'new' || o.status === 'in_progress';
    if (!isNewOrInProgress) return false;
    if (activeStation === 'all') return true;
    return o.items.some(item => item.station === activeStation);
  });

  const stations: { id: Station | 'all', label: string }[] = [
    { id: 'all', label: 'ALL STATIONS' },
    { id: 'expo', label: 'EXPO' },
    { id: 'grill', label: 'GRILL' },
    { id: 'fry', label: 'FRY' },
    { id: 'prep', label: 'PREP' },
    { id: 'bar', label: 'BAR' }
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black font-mono tracking-tighter uppercase">Kitchen Operating System</h2>
          <p className="text-[10px] font-black text-amber-500 tracking-[0.2em] mt-1">REAL-TIME PRODUCTION PIPELINE</p>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-[#333] overflow-x-auto">
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStation(s.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeStation === s.id ? "bg-amber-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-black tracking-widest text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> PENDING
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> FIRE
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> READY
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> 86'D
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max px-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {kitchenTickets.map((order) => (
              <KitchenTicket 
                key={order.id} 
                order={order}
                viewStation={activeStation}
                onFireItem={(idx) => updateItemStatus(order.id, idx, 'fired')}
                onReadyItem={(idx) => updateItemStatus(order.id, idx, 'ready')}
                onUnavailableItem={(idx) => updateItemStatus(order.id, idx, 'unavailable')}
                onCompleteTicket={() => updateOrderStatus(order.id, 'ready')}
              />
            ))}
          </AnimatePresence>
          {kitchenTickets.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center border-2 border-dashed border-[#333] rounded-3xl w-96 bg-black/20"
            >
              <div className="text-center grayscale opacity-20">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Station Clear</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function KitchenTicket({ 
  order, 
  viewStation,
  onFireItem, 
  onReadyItem, 
  onUnavailableItem,
  onCompleteTicket 
}: { 
  order: Order, 
  viewStation: Station | 'all',
  onFireItem: (idx: number) => void | Promise<void>,
  onReadyItem: (idx: number) => void | Promise<void>,
  onUnavailableItem: (idx: number) => void | Promise<void>,
  onCompleteTicket: () => void | Promise<void>,
  key?: string
}) {
  // Filter items based on the active station view
  const filteredItems = viewStation === 'all' 
    ? order.items 
    : order.items.filter(i => i.station === viewStation);

  const isAllDone = order.items.every(i => i.status === 'ready' || i.status === 'unavailable');
  const isFilteredDone = filteredItems.every(i => i.status === 'ready' || i.status === 'unavailable');
  const timeSince = formatDistanceToNow(new Date(order.created_at));

  // Determine if this ticket should be "bump-able" from this view
  const canBump = viewStation === 'all' || viewStation === 'expo' ? isAllDone : isFilteredDone;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -50 }}
      className={cn(
        "w-96 bg-[#111] border-2 border-[#222] flex flex-col rounded-3xl h-full transition-all overflow-hidden shadow-2xl",
        order.priority && "ring-2 ring-red-500 ring-inset",
        isAllDone && "border-green-500/30"
      )}
    >
      <div className={cn(
        "p-4 border-b-2 border-[#222] flex justify-between items-start pt-6",
        order.priority ? "bg-red-500 text-black" : "bg-[#1A1A1A]"
      )}>
        <div>
          <div className="text-3xl font-black font-mono leading-none tracking-tighter">#{order.table_number || '??'}</div>
          <div className={cn("text-[10px] font-black mt-2 uppercase tracking-widest", order.priority ? "text-black/80" : "text-gray-500")}>
            {order.customer_name || 'WALK-IN'} • {timeSince}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={cn(
            "text-[9px] font-black uppercase px-2 py-1 rounded-full",
            order.priority ? "bg-black text-white" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
          )}>
            {order.order_type}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filteredItems.map((item) => {
          // Find original index for the status callback
          const originalIdx = order.items.findIndex(oi => oi === item);
          
          return (
            <motion.div 
              key={`${order.id}-${originalIdx}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (item.status === 'pending') onFireItem(originalIdx);
                else if (item.status === 'fired') onReadyItem(originalIdx);
              }}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group/item",
                item.status === 'ready' 
                  ? "bg-green-500/5 border-green-500/20 opacity-40" 
                  : item.status === 'fired'
                    ? "bg-blue-500/10 border-blue-500/30"
                    : item.status === 'unavailable'
                      ? "bg-red-500/10 border-red-500/30 opacity-70"
                      : "bg-black border-[#222] hover:border-[#333] border-amber-500/10 shadow-[inner_0_0_10px_rgba(245,158,11,0.02)]"
              )}
            >
              {item.status !== 'ready' && item.status !== 'unavailable' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnavailableItem(originalIdx);
                  }}
                  className="absolute right-2 top-2 z-20 p-1.5 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                  title="Mark as 86 / Unavailable"
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex justify-between items-start relative z-10">
                <div className="flex gap-4">
                  <span className={cn(
                    "font-black text-2xl leading-none w-8",
                    item.status === 'ready' || item.status === 'unavailable' ? "text-gray-600" : "text-amber-500"
                  )}>{item.qty}</span>
                  <div>
                    <div className={cn(
                      "font-black text-sm uppercase tracking-tight",
                      (item.status === 'ready' || item.status === 'unavailable') ? "text-gray-600 line-through" : "text-white"
                    )}>
                      {item.name}
                    </div>
                    {item.status === 'unavailable' && (
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> 86'd / OUT OF STOCK
                      </div>
                    )}
                    {item.station && viewStation === 'all' && (
                      <span className="text-[8px] font-black bg-[#222] px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-widest mt-1 inline-block">
                        {item.station}
                      </span>
                    )}
                    {item.mods?.map((mod, mi) => (
                      <div key={mi} className="text-[10px] text-amber-500/80 font-black mt-1 uppercase leading-none italic">• {mod}</div>
                    ))}
                    {item.customizations && (
                      <div className="text-[9px] text-red-500 font-black mt-2 uppercase bg-red-500/10 px-2 py-1 rounded inline-block border border-red-500/10">
                        REQ: {item.customizations}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'pending' && <Clock className="w-5 h-5 text-amber-500/40" />}
                  {item.status === 'fired' && <Flame className="w-5 h-5 text-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-full" />}
                  {item.status === 'ready' && <CheckCircle className="w-5 h-5 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] rounded-full" />}
                  {item.status === 'unavailable' && <Ban className="w-5 h-5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] rounded-full" />}
                </div>
              </div>
            </motion.div>
          );
        })}

        {order.special_requests && (
          <div className="p-4 mt-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
             <div className="text-[9px] font-black text-red-500/70 uppercase tracking-widest mb-1.5 flex items-center gap-2">
               <Package className="w-3 h-3" /> STAFF TICKET NOTE
             </div>
             <p className="text-[11px] text-gray-400 uppercase font-bold leading-relaxed">{order.special_requests}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t-2 border-[#222] bg-[#151515]">
        {canBump ? (
          <button 
            onClick={onCompleteTicket}
            className={cn(
              "w-full font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all shadow-2xl",
              viewStation === 'all' || viewStation === 'expo'
                ? "bg-green-500 hover:bg-green-600 text-black shadow-green-500/20"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
            )}
          >
            {viewStation === 'all' || viewStation === 'expo' ? 'COMPLETE ALL / BUMP' : `CLEAR ${viewStation.toUpperCase()} STATION`}
          </button>
        ) : (
          <div className="py-2 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-gray-600 font-black uppercase tracking-widest">
              <span>PROGRESS</span>
              <span>{filteredItems.filter(i => i.status === 'ready' || i.status === 'unavailable').length} / {filteredItems.length}</span>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden border border-[#222]">
              <motion.div 
                className={cn(
                  "h-full transition-all duration-500",
                  filteredItems.some(i => i.status === 'unavailable') ? "bg-red-500" : "bg-amber-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(filteredItems.filter(i => i.status === 'ready' || i.status === 'unavailable').length / filteredItems.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
