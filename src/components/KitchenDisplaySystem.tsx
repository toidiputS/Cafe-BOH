import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrderStore } from '../store/useOrderStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Flame, CheckCircle, Package } from 'lucide-react';
import type { Order, OrderItem } from '../types';

export default function KitchenDisplaySystem() {
  const { orders, subscribeToOrders, updateItemStatus, updateOrderStatus } = useOrderStore();

  useEffect(() => {
    subscribeToOrders();
  }, [subscribeToOrders]);

  // Only show orders that are new or in progress
  const kitchenTickets = orders.filter(o => o.status === 'new' || o.status === 'in_progress');

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black font-mono tracking-tighter">LIVE KITCHEN FEED</h2>
        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> PENDING</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> FIRE</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> READY</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max">
          <AnimatePresence mode="popLayout">
            {kitchenTickets.map((order) => (
              <KitchenTicket 
                key={order.id} 
                order={order} 
                onFireItem={(idx) => updateItemStatus(order.id, idx, 'fired')}
                onReadyItem={(idx) => updateItemStatus(order.id, idx, 'ready')}
                onCompleteTicket={() => updateOrderStatus(order.id, 'ready')}
              />
            ))}
          </AnimatePresence>
          {kitchenTickets.length === 0 && (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#333] rounded-xl w-80">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No active tickets</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KitchenTicket({ 
  order, 
  onFireItem, 
  onReadyItem, 
  onCompleteTicket 
}: { 
  order: Order, 
  onFireItem: (idx: number) => void,
  onReadyItem: (idx: number) => void,
  onCompleteTicket: () => void
}) {
  const isAllReady = order.items.every(i => i.status === 'ready');
  const timeSince = formatDistanceToNow(new Date(order.created_at));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "w-80 bg-[#1A1A1A] border-2 border-[#333] flex flex-col rounded-lg h-full transition-all",
        order.priority && "ticket-pulse border-red-500",
        isAllReady && "border-green-500/50"
      )}
    >
      <div className={cn(
        "p-3 border-b-2 border-[#333] flex justify-between items-start pt-4",
        order.priority ? "bg-red-500 text-black" : "bg-[#222]"
      )}>
        <div>
          <div className="text-2xl font-black font-mono leading-none">#{order.table_number || '??'}</div>
          <div className={cn("text-[10px] font-bold mt-1 uppercase", order.priority ? "text-black" : "text-gray-500")}>
            {order.customer_name || 'WALK-IN'} • {timeSince}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.5 rounded">
            {order.order_type}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {order.items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => {
              if (item.status === 'pending') onFireItem(idx);
              else if (item.status === 'fired') onReadyItem(idx);
            }}
            className={cn(
              "p-3 rounded border-b border-[#222] cursor-pointer transition-all active:scale-[0.98]",
              item.status === 'ready' ? "bg-green-500/10 opacity-60" : "hover:bg-[#222]"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <span className="font-black text-lg leading-none">{item.qty}</span>
                <div>
                  <div className={cn("font-bold text-sm", item.status === 'ready' && "line-through")}>
                    {item.name.toUpperCase()}
                  </div>
                  {item.mods?.map((mod, mi) => (
                    <div key={mi} className="text-xs text-amber-500 font-bold mt-0.5">• {mod.toUpperCase()}</div>
                  ))}
                  {item.customizations && (
                    <div className="text-xs text-red-400 font-black mt-1 uppercase bg-red-400/10 px-1 inline-block">
                      {item.customizations}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'fired' && <Flame className="w-4 h-4 text-amber-500 animate-pulse" />}
                {item.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
            </div>
          </div>
        ))}

        {order.special_requests && (
          <div className="p-3 mt-2 bg-amber-500/10 border border-amber-500/20 rounded">
             <div className="text-[9px] font-black text-amber-500 uppercase tracking-tighter mb-1">NOTE FROM WAITRESS</div>
             <p className="text-xs text-gray-200 uppercase font-bold leading-tight">{order.special_requests}</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t-2 border-[#333]">
        {isAllReady ? (
          <button 
            onClick={onCompleteTicket}
            className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-4 rounded text-sm transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            BUMP TICKET
          </button>
        ) : (
          <div className="text-center py-2 text-[10px] text-gray-600 font-black uppercase tracking-widest">
            {order.items.filter(i => i.status === 'ready').length} / {order.items.length} READY
          </div>
        )}
      </div>
    </motion.div>
  );
}
