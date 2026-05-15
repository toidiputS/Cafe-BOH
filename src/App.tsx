/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import SignInScreen from './components/SignInScreen';
import WaitressBoard from './components/WaitressBoard';
import KitchenDisplaySystem from './components/KitchenDisplaySystem';
import TakeoutBoard from './components/TakeoutBoard';
import DriverDispatch from './components/DriverDispatch';
import MessagingInbox from './components/MessagingInbox';
import ManagerDashboard from './components/ManagerDashboard';
import { Loader2, LogOut, LayoutDashboard, Terminal, MessageSquare, ShieldCheck } from 'lucide-react';
import { cn } from './lib/utils';
import { useOrderStore } from './store/useOrderStore';

type View = 'dashboard' | 'board' | 'messages';

export default function App() {
  const { user, role, loading, initialized, initialize, signOut } = useAuthStore();
  const { subscribeToOrders } = useOrderStore();
  const [activeView, setActiveView] = useState<View>('board');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && role) {
      subscribeToOrders();
    }
  }, [initialized, role, subscribeToOrders]);

  // Set default view based on role
  useEffect(() => {
    if (role === 'manager') setActiveView('dashboard');
    else if (role) setActiveView('board');
  }, [role]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  const NavItem = ({ id, label, icon: Icon }: { id: View, label: string, icon: any }) => (
    <button
      onClick={() => setActiveView(id)}
      className={cn(
        "flex items-center gap-2 px-4 h-16 transition-all border-b-2 relative",
        activeView === id 
          ? "border-amber-500 text-amber-500 bg-amber-500/5 font-bold" 
          : "border-transparent text-gray-500 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {activeView === id && (
        <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full opacity-50" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-amber-500/30 flex flex-col">
      <header className="h-16 border-b border-[#333] flex items-center justify-between px-6 bg-[#1A1A1A] sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-amber-500 font-bold tracking-tighter text-xl">BRIDGE BOH</span>
            <div className="h-6 w-px bg-[#333]" />
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded tracking-wider">
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <nav className="flex items-center">
            {role === 'manager' && <NavItem id="dashboard" label="MGR PANEL" icon={ShieldCheck} />}
            {(role !== 'manager') && <NavItem id="board" label="LIVE BOARD" icon={activeView === 'board' ? Terminal : LayoutDashboard} />}
            <NavItem id="messages" label="MESSAGES" icon={MessageSquare} />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs hidden lg:inline font-mono">STAFF_ID: {user.id.slice(0, 8)}</span>
          <button 
            onClick={() => signOut()}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-[1800px] mx-auto">
          {/* Quick Station Switcher (Developer/Manager Only) */}
          <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest leading-none mb-1">STATION OVERRIDE</h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Bypasses Magic Link for testing</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['manager', 'waitress', 'head_chef', 'expeditor', 'bartender', 'takeout_host', 'driver'].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    useAuthStore.setState({ role: r as any });
                    if (r === 'manager') setActiveView('dashboard');
                    else setActiveView('board');
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border",
                    role === r 
                      ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20" 
                      : "bg-[#0A0A0A] border-[#333] text-gray-500 hover:border-amber-500/50 hover:text-amber-500"
                  )}
                >
                  {r.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          {activeView === 'dashboard' && role === 'manager' && <ManagerDashboard />}
          
          {activeView === 'board' && (
            <>
              {role === 'waitress' && <WaitressBoard />}
              {(role === 'head_chef' || role === 'prep_cook' || role === 'expeditor' || role === 'bartender') && <KitchenDisplaySystem />}
              {role === 'takeout_host' && <TakeoutBoard />}
              {role === 'driver' && <DriverDispatch />}
            </>
          )}

          {activeView === 'messages' && <MessagingInbox />}

          {!role && (
            <div className="text-center p-20">
              <h2 className="text-xl font-bold text-red-500 mb-2">Access Restricted</h2>
              <p className="text-gray-400">Your account does not have a staff role assigned. Please contact your manager.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
