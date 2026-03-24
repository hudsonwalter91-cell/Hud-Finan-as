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
  onAuthStateChanged,
  signInAnonymously
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
  // Use a fixed guest user to remove login requirement entirely
  // We use a constant UID so the user's data persists across sessions in this environment
  const [user] = useState<any>({ 
    uid: 'guest-user', 
    displayName: 'Visitante',
    email: 'guest@example.com'
  });
  const [loading, setLoading] = useState(false);

  // No useEffect needed for auth anymore as we are in "No Login" mode

  if (loading || !user) {
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
