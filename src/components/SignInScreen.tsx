import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#1A1A1A] border border-[#333] p-8 rounded-lg text-center"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-gray-400 mb-6">
            We've sent a magic link to <span className="text-white font-medium">{email}</span>.
            Please follow the link to sign in.
          </p>
          <button 
            onClick={() => setSent(false)}
            className="text-amber-500 hover:text-amber-400 transition-colors font-medium flex items-center justify-center mx-auto gap-2"
          >
            Wrong email? Go back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A]">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold tracking-tighter text-amber-500 mb-2">BRIDGE BOH</h1>
          <p className="text-gray-400">Back of House Operations Portal</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A1A] border border-[#333] p-8 rounded-lg shadow-2xl"
        >
          {error?.includes('rate limit') && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <p className="text-xs text-red-500 font-bold mb-2 uppercase tracking-tighter">Email Rate Limit Exceeded</p>
              <button
                type="button"
                onClick={() => {
                   // Force bypass for the user to keep testing
                   useAuthStore.setState({ 
                    user: { id: 'dev-user', email: 'staff@bridgecafe.com' } as any,
                    role: 'manager',
                    initialized: true,
                    loading: false
                   });
                }}
                className="w-full bg-red-500 text-white font-black py-2 rounded text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Bypass Auth (Developer Mode)
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg mb-6">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">STATION AUTHORIZATION</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Enter your staff email. Once authorized, this device will stay logged in. You can switch stations using your <span className="text-amber-500 font-bold">Staff PIN (Default: 1234)</span>.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
                Staff Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#333] rounded-md py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  placeholder="name@bridgecafe.com"
                />
                <LogIn className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-bold py-4 rounded transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest pt-4">
              <div className="h-px flex-1 bg-[#333]" />
              <span>External Support</span>
              <div className="h-px flex-1 bg-[#333]" />
            </div>

            <button
              type="button"
              onClick={() => window.location.search = '?customer'}
              className="w-full bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/80 text-blue-500 font-black py-4 rounded uppercase tracking-widest transition-all mb-4"
            >
              GUEST SUPPORT PORTAL
            </button>

            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
              <div className="h-px flex-1 bg-[#333]" />
              <span>Quick Access Portals</span>
              <div className="h-px flex-1 bg-[#333]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { r: 'manager', l: 'Manager' },
                { r: 'waitress', l: 'Waitress' },
                { r: 'head_chef', l: 'Head Chef' },
                { r: 'expeditor', l: 'Expeditor' },
                { r: 'takeout_host', l: 'Takeout' },
                { r: 'driver', l: 'Driver' }
              ].map((p) => (
                <button
                  key={p.r}
                  type="button"
                  onClick={() => {
                    useAuthStore.setState({ 
                      user: { id: `dev-${p.r}`, email: `${p.r}@bridgecafe.com` } as any,
                      role: p.r as any,
                      initialized: true,
                      loading: false
                    });
                  }}
                  className="bg-[#0A0A0A] border border-[#333] hover:border-amber-500/40 hover:text-amber-500 text-[10px] font-black py-3 rounded uppercase tracking-tighter transition-all"
                >
                  {p.l}
                </button>
              ))}
            </div>
          </form>
        </motion.div>

        <p className="mt-8 text-center text-gray-600 text-xs uppercase tracking-widest">
          Authorized Personnel Only • Bridge Café Systems
        </p>
      </div>
    </div>
  );
}
