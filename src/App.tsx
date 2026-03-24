import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  PieChart, 
  Settings as SettingsIcon, 
  Plus,
  Target,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { auth, db } from './firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';
import { AlertCircle, Mail, Lock, User as UserIcon, ArrowRight, Github } from 'lucide-react';

// Screens (to be implemented)
import Dashboard from './screens/Dashboard';
import Transactions from './screens/Transactions';
import Cards from './screens/Cards';
import Reports from './screens/Reports';
import Goals from './screens/Goals';
import Categories from './screens/Categories';
import Settings from './screens/Settings';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center justify-center gap-1 p-1 transition-all relative group min-w-[56px]",
      active ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
    )}
  >
    <div className={cn(
      "transition-transform duration-300 group-active:scale-90",
      active && "scale-110"
    )}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={cn(
      "text-[8px] font-black uppercase tracking-[0.1em] transition-all",
      active ? "opacity-100 translate-y-0" : "opacity-60"
    )}>{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
      />
    )}
  </Link>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setError(null);
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError("Erro ao entrar com Google. Tente o login por e-mail.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    try {
      if (emailMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("E-mail ou senha incorretos.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else if (error.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (error.code === 'auth/invalid-email') {
        setError("E-mail inválido.");
      } else {
        setError("Ocorreu um erro. Verifique se o login por e-mail está ativado no Firebase.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-emerald-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <LayoutDashboard size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-500 text-zinc-950 shadow-2xl shadow-emerald-500/30 relative z-10"
        >
          <LayoutDashboard size={40} strokeWidth={2.5} />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 w-full max-w-sm"
        >
          <h1 className="mb-2 text-3xl font-black tracking-tighter text-white">Mobills Clone</h1>
          <p className="mb-8 text-zinc-400 text-sm font-medium leading-relaxed">Controle suas finanças de forma simples e elegante.</p>
          
          <AnimatePresence mode="wait">
            {authMode === 'google' ? (
              <motion.div
                key="google-auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button 
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="flex w-full items-center justify-center gap-4 rounded-2xl bg-white px-8 py-4 font-black text-zinc-950 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5 disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebase/explore/google.svg" alt="Google" className="h-5 w-5" />
                  {authLoading ? 'ENTRANDO...' : 'ENTRAR COM GOOGLE'}
                </button>
                
                <button 
                  onClick={() => setAuthMode('email')}
                  className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors"
                >
                  Ou usar e-mail e senha
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="email-auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-[10px] font-black uppercase text-left">
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  {emailMode === 'signup' && (
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="text"
                        placeholder="Seu Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input 
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 font-black text-zinc-950 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {authLoading ? 'PROCESSANDO...' : (emailMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA')}
                    <ArrowRight size={18} />
                  </button>
                </form>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setEmailMode(emailMode === 'login' ? 'signup' : 'login')}
                    className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors"
                  >
                    {emailMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                  </button>
                  <button 
                    onClick={() => setAuthMode('google')}
                    className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    Voltar para Google
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-[10px] uppercase tracking-[0.4em] text-zinc-700 font-black relative z-10"
        >
          Desenvolvido com IA Studio
        </motion.p>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
        {/* Main Content */}
        <main className="flex-1 pb-24 w-full max-w-xl mx-auto relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/transactions" element={<Transactions user={user} />} />
              <Route path="/cards" element={<Cards user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
              <Route path="/goals" element={<Goals user={user} />} />
              <Route path="/categories" element={<Categories user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
            <NavigationLinks />
          </div>
        </nav>
      </div>
    </Router>
  );
}

function NavigationLinks() {
  const location = useLocation();
  return (
    <>
      <NavItem to="/" icon={LayoutDashboard} label="Início" active={location.pathname === '/'} />
      <NavItem to="/transactions" icon={ArrowUpRight} label="Transações" active={location.pathname === '/transactions'} />
      
      {/* Central Add Button */}
      <Link 
        to="/transactions?new=true"
        className="flex items-center justify-center -mt-5 relative group"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950 shadow-md transition-all group-hover:scale-105 group-active:scale-95 group-hover:rotate-90 ring-[3px] ring-zinc-950">
          <Plus size={22} strokeWidth={2.5} />
        </div>
      </Link>

      <NavItem to="/reports" icon={PieChart} label="Relatórios" active={location.pathname === '/reports'} />
      <NavItem to="/settings" icon={SettingsIcon} label="Ajustes" active={location.pathname === '/settings'} />
    </>
  );
}
