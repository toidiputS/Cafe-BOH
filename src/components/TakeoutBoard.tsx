import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrderStore } from '../store/useOrderStore';
import { formatDistanceToNow } from 'date-fns';
import { Package, CheckCircle, Clock, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Order } from '../types';

export default function TakeoutBoard() {
  const { orders, subscribeToOrders, updateOrderStatus } = useOrderStore();

  useEffect(() => {
    subscribeToOrders();
  }, [subscribeToOrders]);

  const takeoutOrders = orders.filter(o => 
    o.order_type === 'takeout' && 
    o.status !== 'delivered' && 
    o.status !== 'cancelled'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tighter uppercase">TAKEOUT / PICKUP BOARD</h2>
        <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase">
          {takeoutOrders.length} PENDING
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {takeoutOrders.map((order) => (
            <TakeoutCard 
              key={order.id} 
              order={order} 
              onReady={() => updateOrderStatus(order.id, 'ready')}
              onHandOff={() => updateOrderStatus(order.id, 'delivered')}
            />
          ))}
        </AnimatePresence>
      </div>

      {takeoutOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-[#333] rounded-xl">
          <Package className="w-12 h-12 mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">No Pickup Orders</p>
        </div>
      )}
    </div>
  );
}

function TakeoutCard({ order, onReady, onHandOff }: { order: Order, onReady: () => void, onHandOff: () => void }) {
  const isReady = order.status === 'ready';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden flex flex-col group",
        isReady && "border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.05)]"
      )}
    >
      <div className="p-4 bg-[#222] border-b border-[#333] flex justify-between items-center">
        <div className="font-black text-lg tracking-tighter text-amber-500">
           {order.customer_name?.toUpperCase() || 'EXTERNAL ORDER'}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(order.created_at))}
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="space-y-1 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="text-xs text-gray-300 flex justify-between">
              <span>{item.qty}x {item.name}</span>
              <span className={cn(
                "text-[9px] font-black uppercase",
                item.status === 'ready' ? "text-green-500" : "text-gray-600"
              )}>{item.status}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 bg-black/30 p-2 rounded border border-[#333]">
          <Smartphone className="w-4 h-4 text-amber-500" />
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
            NOTIFY AS: SMS / PUSH READY
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        {!isReady ? (
          <button 
            onClick={onReady}
            className="w-full bg-[#333] hover:bg-[#444] text-white py-3 rounded font-black text-xs transition-all flex items-center justify-center gap-2"
          >
            MARK AS READY
          </button>
        ) : (
          <button 
            onClick={onHandOff}
            className="w-full bg-green-500 hover:bg-green-600 text-black py-4 rounded font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
          >
            <CheckCircle className="w-4 h-4" /> HAND OFF TO CUSTOMER
          </button>
        )}
      </div>
    </motion.div>
  );
}
