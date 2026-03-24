import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Category } from '../types';
import { formatCurrency, cn } from '../utils';
import { motion } from 'motion/react';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Reports({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(docs);

      // Group by month for the last 6 months
      const stats = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const monthTransactions = docs.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= start && tDate <= end && t.status === 'paid';
        });

        const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        stats.push({
          name: format(date, 'MMM', { locale: ptBR }),
          income,
          expense,
          balance: income - expense
        });
      }
      setMonthlyStats(stats);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return () => unsubscribe();
  }, [user]);

  const categoryData = categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const total = transactions
        .filter(t => t.categoryId === cat.id && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: cat.name, value: total };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-8"
    >
      <header>
        <h1 className="text-xl font-black tracking-tight text-white">Relatórios</h1>
        <p className="text-zinc-500 text-sm font-medium">Análise detalhada das suas finanças</p>
      </header>

      {/* Monthly Evolution */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-zinc-500 px-2">
          <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
            <BarChart3 size={20} className="text-emerald-500" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Evolução Mensal</h3>
        </div>
        <div className="h-80 w-full glass-card rounded-[40px] p-8 modern-shadow relative overflow-hidden group">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="#52525b" 
                fontSize={10} 
                fontWeight="900"
                tickLine={false} 
                axisLine={false} 
                dy={15}
                tickFormatter={(v) => v.toUpperCase()}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                fontWeight="900"
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(v) => `R$${v}`} 
              />
              <Tooltip 
                cursor={{ fill: '#27272a', opacity: 0.2 }}
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  border: '1px solid #27272a', 
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  padding: '16px'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: '900' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} barSize={16} />
              <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
          {/* Subtle Gradient */}
          <div className="absolute -right-20 -bottom-20 h-48 w-48 bg-emerald-500/5 blur-[100px] rounded-full group-hover:opacity-100 transition-opacity duration-700" />
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-zinc-500 px-2">
          <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
            <PieChartIcon size={20} className="text-emerald-500" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Gastos por Categoria</h3>
        </div>
        <div className="grid gap-4">
          {categoryData.map((data, index) => {
            const total = categoryData.reduce((acc, d) => acc + d.value, 0);
            const percentage = (data.value / total) * 100;
            
            return (
              <motion.div 
                key={data.name} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="interactive-card p-6 rounded-[32px] space-y-5 group relative overflow-hidden"
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-3 w-3 rounded-full shadow-[0_0_12px_currentColor]" 
                      style={{ color: COLORS[index % COLORS.length], backgroundColor: 'currentColor' }} 
                    />
                    <span className="text-sm font-black text-zinc-100 tracking-tight truncate max-w-[150px] sm:max-w-none">{data.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white block tracking-tight">{formatCurrency(data.value)}</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/50 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                {/* Subtle Gradient */}
                <div className="absolute -right-10 -bottom-10 h-24 w-24 bg-white/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            );
          })}
          {categoryData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/30 rounded-[32px] border border-dashed border-zinc-800 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-800 border border-zinc-900">
                <PieChartIcon size={32} />
              </div>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Nenhum gasto registrado</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
