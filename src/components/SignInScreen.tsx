import { useState } from 'react';
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
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

            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <div className="h-px flex-1 bg-[#333]" />
              <span>STATION AUTHENTICATION REQUIRED</span>
              <div className="h-px flex-1 bg-[#333]" />
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
