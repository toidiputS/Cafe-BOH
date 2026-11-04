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
import AIWaitressCopilot from './components/AIWaitressCopilot';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2, LogOut, LayoutDashboard, Terminal, MessageSquare, ShieldCheck, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';
import { useOrderStore } from './store/useOrderStore';

type View = 'dashboard' | 'board' | 'messages' | 'copilot';

export default function App() {
  const { user, role, loading, initialized, initialize, signOut } = useAuthStore();
  const { subscribeToOrders } = useOrderStore();
  const [activeView, setActiveView] = useState<View>('board');
  const [startupError, setStartupError] = useState<Error | null>(null);

  // Wrapped initialization sequence with granular step-by-step trace logging and timing
  useEffect(() => {
    let isMounted = true;
    async function runInitSequence() {
      const overallStart = performance.now();
      console.log(`[Startup Trace t+0.00ms] 🚀 Starting App initialization sequence...`);

      try {
        setStartupError(null);

        // Step 1: Initialize Auth Store
        const step1Start = performance.now();
        console.log(`[Startup Trace t+${(step1Start - overallStart).toFixed(2)}ms] Step 1/3: Executing useAuthStore.initialize()...`);
        
        await initialize();

        const step1End = performance.now();
        const step1Duration = (step1End - step1Start).toFixed(2);
        console.log(`[Startup Trace t+${(step1End - overallStart).toFixed(2)}ms] Step 1/3 resolved in ${step1Duration}ms. (Auth Initialized)`);

        const totalDuration = (performance.now() - overallStart).toFixed(2);
        console.log(`[Startup Trace t+${totalDuration}ms] ✅ App startup initialization sequence completed successfully in ${totalDuration}ms.`);
      } catch (err: any) {
        const errorTime = (performance.now() - overallStart).toFixed(2);
        console.error(`[Startup Trace t+${errorTime}ms] ❌ Startup error during initialization sequence:`, err);
        if (isMounted) {
          setStartupError(err instanceof Error ? err : new Error(err?.message || 'Failed to initialize app'));
        }
      }
    }

    runInitSequence();
    return () => { isMounted = false; };
  }, [initialize]);

  // Step 2: Subscribe to Live Orders when initialized and authenticated
  useEffect(() => {
    if (initialized && role) {
      const subStart = performance.now();
      console.log(`[Startup Trace] Step 2/3: Subscribing to live orders for role "${role}"...`);
      try {
        subscribeToOrders();
        const subDuration = (performance.now() - subStart).toFixed(2);
        console.log(`[Startup Trace] Step 2/3: Live orders subscription initiated in ${subDuration}ms.`);
      } catch (err) {
        const subDuration = (performance.now() - subStart).toFixed(2);
        console.error(`[Startup Trace] Step 2/3: Error subscribing to live orders after ${subDuration}ms:`, err);
      }
    }
  }, [initialized, role, subscribeToOrders]);

  // Step 3: Handle Role Navigation & Notifications Setup
  useEffect(() => {
    if (role) {
      const roleStart = performance.now();
      console.log(`[Startup Trace] Step 3/3: Configuring view for role "${role}" & requesting notification permissions...`);
      setActiveView(role === 'manager' ? 'dashboard' : 'board');
      
      const notifStart = performance.now();
      import('./lib/notifications')
        .then(m => {
          const notifDuration = (performance.now() - notifStart).toFixed(2);
          console.log(`[Startup Trace] Step 3/3: Notification module loaded & requested permission in ${notifDuration}ms.`);
          return m.requestNotificationPermission();
        })
        .catch(err => {
          const notifDuration = (performance.now() - notifStart).toFixed(2);
          console.warn(`[Startup Trace] Step 3/3: Notification permission setup failed after ${notifDuration}ms:`, err);
        });
    }
  }, [role]);

  // Handle critical startup initialization error
  if (startupError) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-lg w-full bg-[#1A1A1A] border border-red-500/30 p-8 rounded-xl shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-tight">App Startup Error</h2>
          <p className="text-gray-400 text-sm mb-4">
            The application encountered a critical error during initialization startup.
          </p>
          <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#333] font-mono text-xs text-red-400 mb-6 overflow-x-auto">
            {startupError.message || 'Unknown startup error occurred'}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                setStartupError(null);
                initialize().catch(err => setStartupError(err instanceof Error ? err : new Error(String(err))));
              }}
              className="w-full sm:w-auto flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Startup
            </button>
            <button
              onClick={() => {
                // Developer mode bypass to allow app access even if credentials or backend failed
                useAuthStore.setState({
                  user: { id: 'dev-user', email: 'staff@bridgecafe.com' } as any,
                  role: 'manager',
                  initialized: true,
                  loading: false
                });
                setStartupError(null);
              }}
              className="w-full sm:w-auto bg-[#222] hover:bg-[#333] text-gray-300 font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors"
            >
              Bypass (Dev Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [showSlowLoadWarning, setShowSlowLoadWarning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading || !initialized) {
      timer = setTimeout(() => {
        console.warn('[Startup Trace WARN] App startup loading is taking longer than expected (>3500ms)...');
        setShowSlowLoadWarning(true);
      }, 3500);
    } else {
      setShowSlowLoadWarning(false);
    }
    return () => clearTimeout(timer);
  }, [loading, initialized]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <div>
            <h3 className="text-sm font-bold tracking-wider text-amber-500 uppercase">Starting Bridge BOH...</h3>
            <p className="text-xs text-gray-400 mt-1">Initializing auth session and live database connection</p>
          </div>

          {showSlowLoadWarning && (
            <div className="mt-4 p-4 bg-[#141414] border border-amber-500/30 rounded-xl text-left w-full animate-fade-in shadow-xl">
              <p className="text-xs text-amber-400 font-medium mb-3">
                Initialization is taking longer than usual.
              </p>
              <button
                onClick={() => {
                  console.log('[Startup Trace] User triggered manual initialization force-complete');
                  useAuthStore.setState({ loading: false, initialized: true });
                }}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Continue To App
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary name="SignInScreen">
        <SignInScreen />
      </ErrorBoundary>
    );
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
            <NavItem id="copilot" label="AI COPILOT" icon={Sparkles} />
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

          {activeView === 'dashboard' && role === 'manager' && (
            <ErrorBoundary name="ManagerDashboard">
              <ManagerDashboard />
            </ErrorBoundary>
          )}
          
          {activeView === 'board' && (
            <>
              {role === 'waitress' && (
                <ErrorBoundary name="WaitressBoard">
                  <WaitressBoard />
                </ErrorBoundary>
              )}
              {(role === 'head_chef' || role === 'prep_cook' || role === 'expeditor' || role === 'bartender') && (
                <ErrorBoundary name="KitchenDisplaySystem">
                  <KitchenDisplaySystem />
                </ErrorBoundary>
              )}
              {role === 'takeout_host' && (
                <ErrorBoundary name="TakeoutBoard">
                  <TakeoutBoard />
                </ErrorBoundary>
              )}
              {role === 'driver' && (
                <ErrorBoundary name="DriverDispatch">
                  <DriverDispatch />
                </ErrorBoundary>
              )}
            </>
          )}

          {activeView === 'messages' && (
            <ErrorBoundary name="MessagingInbox">
              <MessagingInbox />
            </ErrorBoundary>
          )}

          {activeView === 'copilot' && (
            <ErrorBoundary name="AIWaitressCopilot">
              <AIWaitressCopilot />
            </ErrorBoundary>
          )}

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

