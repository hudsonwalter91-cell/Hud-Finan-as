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
  onAuthStateChanged 
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
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
          className="mb-10 flex h-24 w-24 items-center justify-center rounded-[32px] bg-emerald-500 text-zinc-950 shadow-2xl shadow-emerald-500/30 relative z-10"
        >
          <LayoutDashboard size={48} strokeWidth={2.5} />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative z-10"
        >
          <h1 className="mb-3 text-4xl font-black tracking-tighter text-white">Mobills Clone</h1>
          <p className="mb-10 max-w-xs text-zinc-400 font-medium leading-relaxed">Controle suas finanças de forma simples, inteligente e elegante.</p>
          
          <button 
            onClick={handleLogin}
            className="flex w-full max-w-xs items-center justify-center gap-4 rounded-2xl bg-white px-8 py-5 font-black text-zinc-950 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
          >
            <img src="https://www.gstatic.com/firebase/explore/google.svg" alt="Google" className="h-6 w-6" />
            ENTRAR COM GOOGLE
          </button>
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
