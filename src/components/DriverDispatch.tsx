import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrderStore } from '../store/useOrderStore';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Navigation, Truck, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Order } from '../types';

export default function DriverDispatch() {
  const { orders, subscribeToOrders, updateOrderStatus } = useOrderStore();

  useEffect(() => {
    subscribeToOrders();
  }, [subscribeToOrders]);

  const deliveryOrders = orders.filter(o => 
    o.order_type === 'delivery' && 
    o.status !== 'delivered' && 
    o.status !== 'cancelled'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tighter uppercase">DRIVER DISPATCH FEED</h2>
        <Truck className="w-5 h-5 text-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {deliveryOrders.map((order) => (
            <DeliveryCard 
              key={order.id} 
              order={order} 
              onOutForDelivery={() => updateOrderStatus(order.id, 'in_progress')}
              onDelivered={() => updateOrderStatus(order.id, 'delivered')}
            />
          ))}
        </AnimatePresence>
      </div>

      {deliveryOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed border-[#333] rounded-xl">
          <Truck className="w-12 h-12 mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">No Pending Deliveries</p>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({ order, onOutForDelivery, onDelivered }: { order: Order, onOutForDelivery: () => void | Promise<void>, onDelivered: () => void | Promise<void>, key?: string }) {
  const isEnRoute = order.status === 'in_progress';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden flex flex-col"
    >
      <div className="p-4 bg-[#222] border-b border-[#333] flex justify-between items-center">
        <div className="font-black text-xs text-amber-500 uppercase tracking-widest">
           {order.customer_name || 'DELIVERY'}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          #{order.id.slice(0, 6).toUpperCase()}
        </div>
      </div>

      <div className="p-4 flex-1 space-y-4">
        <div className="flex gap-3">
          <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 h-fit">
            <MapPin className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black text-gray-500 uppercase mb-1 tracking-tighter">DESTINATION</div>
            <p className="text-sm font-bold text-gray-200 line-clamp-2">{order.delivery_address || 'Address missing'}</p>
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noreferrer"
              className="mt-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors uppercase tracking-widest"
            >
              OPEN NAVIGATION <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-3 rounded border border-[#333]">
           <div className="text-[9px] font-black text-gray-600 uppercase mb-2 tracking-tighter">ORDER SUMMARY</div>
           <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="text-[11px] font-bold text-gray-400 flex justify-between">
                  <span>{item.qty}x {item.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="p-4 mt-auto space-y-2">
        {!isEnRoute ? (
          <button 
            onClick={onOutForDelivery}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4 rounded font-black text-xs transition-all flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" /> MARK AS EN ROUTE
          </button>
        ) : (
          <button 
            onClick={onDelivered}
            className="w-full bg-green-500 hover:bg-green-600 text-black py-4 rounded font-black text-xs transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> CONFIRM DELIVERY
          </button>
        )}
      </div>
    </motion.div>
  );
}
