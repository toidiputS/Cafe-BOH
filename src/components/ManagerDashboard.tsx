import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
  ReferenceArea, ReferenceLine, Label
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, Clock, AlertCircle, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Filter, ChevronDown, Download, Star, 
  Trophy, Medal, Target, Zap, Crown
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { OrderType, CustomerProfile } from '../types';

export default function ManagerDashboard() {
  const { orders } = useOrderStore();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);
      if (data) setCustomers(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.total_price || 0), 0);
  const totalPoints = customers.reduce((acc, c) => acc + c.total_points, 0);
  const activeStaffCount = 12; // Mock

  const orderVolumeData = [
    { name: '11:00', count: 18 },
    { name: '12:00', count: 42 },
    { name: '13:00', count: 68 },
    { name: '14:00', count: 35 },
    { name: '15:00', count: 22 },
    { name: '16:00', count: 28 },
    { name: '17:00', count: 54 },
    { name: '18:00', count: 82 },
    { name: '19:00', count: 94 },
    { name: '20:00', count: 88 },
    { name: '21:00', count: 45 },
    { name: '22:00', count: 22 },
  ];

  const orderTypeData = [
    { name: 'DINE-IN', value: orders.filter(o => o.order_type === 'dine_in').length },
    { name: 'TAKEOUT', value: orders.filter(o => o.order_type === 'takeout').length },
    { name: 'DELIVERY', value: orders.filter(o => o.order_type === 'delivery').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+12.5%"
          trend="up"
        />
        <StatCard 
          icon={<Users className="w-5 h-5 text-blue-500" />}
          label="Loyalty Members"
          value={customers.length.toString()}
          change="+8.2%"
          trend="up"
        />
        <StatCard 
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Active Reward Pts"
          value={totalPoints.toLocaleString()}
          change="+15.4%"
          trend="up"
        />
        <StatCard 
          icon={<ShoppingBag className="w-5 h-5 text-purple-500" />}
          label="Total Orders"
          value={orders.length.toString()}
          change="+3.1%"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Live Order Volume</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Hourly throughput performance</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 uppercase">Today</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderVolumeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #333', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                />
                {/* Highlight Peak Hour */}
                <ReferenceLine x="19:00" stroke="#f59e0b" strokeDasharray="3 3">
                  <Label 
                    value="PEAK HOUR" 
                    position="top" 
                    fill="#f59e0b" 
                    fontSize={8} 
                    fontWeight={900} 
                    offset={10}
                  />
                </ReferenceLine>
                <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loyalty Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> TOP GUESTS
              </h3>
              <Crown className="w-4 h-4 text-gray-700" />
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {customers.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-[#333] group hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border",
                      i === 0 ? "bg-amber-500 text-black border-amber-400" :
                      i === 1 ? "bg-slate-400 text-black border-slate-300" :
                      i === 2 ? "bg-orange-600 text-black border-orange-500" :
                      "bg-[#1A1A1A] text-gray-500 border-[#333]"
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter">{c.full_name}</p>
                      <p className="text-[8px] font-black text-gray-600 uppercase">{c.tier} MEMBER</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-amber-500">{c.total_points.toLocaleString()}</p>
                    <p className="text-[8px] font-black text-gray-700 uppercase">PTS</p>
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <div className="h-full flex items-center justify-center py-10">
                   <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest text-center">No members yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Order Method Distribution</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Breakdown by fulfillment channel</p>
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {orderTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #333', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">No order data available</div>
            )}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Automated Insights</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-[240px] leading-relaxed">
            {orders.length > 0 && orderTypeData.length > 0
              ? `${orderTypeData.sort((a, b) => b.value - a.value)[0].name} IS CURRENTLY YOUR HIGHEST VOLUME CHANNEL, ACCOUNTING FOR ${Math.round((orderTypeData.sort((a, b) => b.value - a.value)[0].value / orders.length) * 100)}% OF TOTAL TICKETS.`
              : "ANALYZE PERFORMANCE ACROSS ALL CHANNELS TO OPTIMIZE STAFFING AND PRODUCTION WORKFLOWS."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, trend }: any) {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] p-6 rounded-2xl shadow-xl group hover:border-amber-500/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-black/40 rounded-xl border border-[#333] group-hover:border-amber-500/30 transition-all">
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
          trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</h4>
        <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
      </div>
    </div>
  );
}
