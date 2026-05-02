import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MessageSquare, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import type { Order } from '../types';

export default function WaitressBoard() {
  const { orders, subscribeToOrders, updateOrderStatus } = useOrderStore();

  useEffect(() => {
    subscribeToOrders();
  }, [subscribeToOrders]);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {activeOrders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus }: { order: Order, onUpdateStatus: (status: Order['status']) => void }) {
  const timeElapsed = formatDistanceToNow(new Date(order.created_at));
  
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'new': return 'bg-amber-500';
      case 'in_progress': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden flex flex-col h-full",
        order.priority && "border-red-500/50 ring-1 ring-red-500/20"
      )}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-[#333] flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black font-mono tracking-tighter">TABLE {order.table_number || 'T?' }</span>
            {order.priority && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{timeElapsed} ago</span>
          </div>
        </div>
        <div className={cn("px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-black", getStatusColor(order.status))}>
          {order.status}
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 p-4 space-y-2 max-h-[300px] overflow-y-auto">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start gap-4 py-2 border-b border-[#333] last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{item.qty}x</span>
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              {item.mods?.length > 0 && (
                <div className="text-[11px] text-amber-500/80 mt-1 pl-6">
                  {item.mods.join(' • ')}
                </div>
              )}
              {item.customizations && (
                <div className="text-[11px] text-gray-400 mt-1 pl-6 italic">
                  "{item.customizations}"
                </div>
              )}
            </div>
            <div className={cn(
              "w-2 h-2 rounded-full mt-1.5",
              item.status === 'ready' ? "bg-green-500" : item.status === 'fired' ? "bg-amber-500" : "bg-gray-700"
            )} />
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {order.special_requests && (
        <div className="px-4 py-2 bg-amber-500/5 border-y border-[#333]">
          <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
            <MessageSquare className="w-3 h-3" />
            Special Requests
          </div>
          <p className="text-xs text-gray-300 italic">{order.special_requests}</p>
        </div>
      )}

      {/* Action Area */}
      <div className="p-4 mt-auto">
        {order.status === 'new' && (
          <button 
            onClick={() => onUpdateStatus('in_progress')}
            className="w-full bg-[#333] hover:bg-[#444] text-white py-3 rounded flex items-center justify-center gap-2 text-sm font-bold transition-colors"
          >
            START ORDER <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {order.status === 'in_progress' && (
          <div className="text-center text-xs text-gray-500 font-medium">
            Waiting for kitchen...
          </div>
        )}
        {order.status === 'ready' && (
          <button 
            onClick={() => onUpdateStatus('delivered')}
            className="w-full bg-green-500 hover:bg-green-600 text-black py-3 rounded flex items-center justify-center gap-2 text-sm font-bold transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> MARK DELIVERED
          </button>
        )}
      </div>
    </motion.div>
  );
}
