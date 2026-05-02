import { useOrderStore } from '../store/useOrderStore';
import { DollarSign, Utensils, Users, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function ManagerDashboard() {
  const { orders } = useOrderStore();

  // Simple aggregation for the mockup/demo
  // In a real app, these values would come from more complex queries or a separate stats table
  const totalRevenue = orders.filter(o => o.status === 'delivered').length * 45; // Mock average ticket $45
  const activeOrdersCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const occupancyRate = Math.min(Math.round((activeOrdersCount / 20) * 100), 100); // Mock 20 tables

  const stats = [
    { label: 'LIVE REVENUE', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+12%', color: 'text-green-500' },
    { label: 'ACTIVE TICKETS', value: activeOrdersCount, icon: Utensils, trend: 'HIGH', color: 'text-amber-500' },
    { label: 'OCCUPANCY', value: `${occupancyRate}%`, icon: Users, trend: 'STABLE', color: 'text-blue-500' },
    { label: 'AVG TURN TIME', value: '42 MIN', icon: TrendingUp, trend: '-2m', color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-[#1A1A1A] border border-[#333] p-6 rounded-lg relative overflow-hidden group"
          >
            <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#333]">
                <stat.icon className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-widest">{stat.trend}</span>
            </div>
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</h3>
            <div className={cn("text-3xl font-black font-mono", stat.color)}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Map Mockup */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#333] rounded-lg p-6">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> TABLE OCCUPANCY MAP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]",
                  (i % 3 === 0) ? "bg-amber-500/10 border-amber-500/30" : "bg-[#0A0A0A] border-[#333]"
                )}
              >
                <span className="text-xs font-black text-gray-500 uppercase tracking-tighter">TABLE</span>
                <span className="text-3xl font-black font-mono leading-none">{i + 1}</span>
                <div className={cn(
                  "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                  (i % 3 === 0) ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-500"
                )}>
                  {(i % 3 === 0) ? "ORDERING" : "VACANT"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed Mockup */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#333] bg-[#222]">
            <h3 className="text-sm font-black uppercase tracking-widest">LIVE STAFF FEED</h3>
          </div>
          <div className="p-4 space-y-4">
            {[
              { name: 'Marco', role: 'Head Chef', action: 'BUMPED TICKET #42', time: '2m' },
              { name: 'Sarah', role: 'Waitress', action: 'FIRED NEW ORDER #44', time: '5m' },
              { name: 'Dave', role: 'Takeout', action: 'HANDED OFF TICKET #39', time: '12m' },
              { name: 'Elena', role: 'Waitress', action: 'SEATED TABLE 12', time: '15m' },
            ].map((log, i) => (
              <div key={i} className="flex gap-4 p-3 rounded bg-[#0A0A0A] border border-[#333] group hover:border-gray-500 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center font-black text-xs">
                  {log.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{log.name}</span>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{log.role}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{log.action}</p>
                </div>
                <div className="ml-auto text-[10px] font-bold text-gray-600">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
