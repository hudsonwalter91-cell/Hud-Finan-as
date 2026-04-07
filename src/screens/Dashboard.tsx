import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, Category, Account } from '../types';
import { formatCurrency, cn } from '../utils';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  ChevronRight,
  Plus,
  Repeat,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { startOfMonth, endOfMonth, isAfter, isBefore, parseISO, format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Dashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'accounts'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'accounts');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const start = startOfMonth(selectedDate).toISOString();
    const end = endOfMonth(selectedDate).toISOString();

    // Query 1: All transactions for the selected month (for income/expense summary)
    const qMonth = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc')
    );

    // Query 2: All pending transactions (to calculate predicted balance correctly)
    const qPending = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubMonth = onSnapshot(qMonth, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => {
      unsubMonth();
      unsubPending();
    };
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });
    return () => unsubscribe();
  }, [user]);

  const includedAccountIds = accounts
    .filter(a => a.includeInTotal !== false)
    .map(a => a.id);

  const filteredTransactions = transactions.filter(t => includedAccountIds.includes(t.accountId));

  const summary = filteredTransactions.reduce((acc, t) => {
    if (t.status === 'paid') {
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const endOfSelectedMonth = endOfMonth(selectedDate).toISOString();
  
  const pendingSummary = pendingTransactions
    .filter(t => includedAccountIds.includes(t.accountId) && t.date <= endOfSelectedMonth)
    .reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });

  const totalBalance = accounts
    .filter(a => a.includeInTotal !== false)
    .reduce((acc, a) => acc + a.balance, 0);
  const predictedBalance = totalBalance + pendingSummary.income - pendingSummary.expense;
  const currentMonthName = format(selectedDate, 'MMMM', { locale: ptBR });
  const currentYear = format(selectedDate, 'yyyy');

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));
  const handleCurrentMonth = () => setSelectedDate(new Date());

  const chartData = categories
    .filter(c => c.type === 'expense')
    .map(cat => {
      const total = transactions
        .filter(t => t.categoryId === cat.id && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: cat.name, value: total };
    })
    .filter(d => d.value > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Olá!</h1>
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleCurrentMonth}
              className="text-zinc-100 text-xs font-bold capitalize hover:text-emerald-500 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
            >
              {currentMonthName} {currentYear}
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
        <Link 
          to="/cards"
          className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 shadow-sm hover:bg-zinc-800 transition-colors active:scale-95"
        >
          <Wallet size={20} />
        </Link>
      </header>

      {/* Balance Card */}
      <section className="relative overflow-hidden rounded-[32px] glass-card p-6 sm:p-8 shadow-md group">
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 sm:gap-0">
            <div className="space-y-1">
              <p className="text-zinc-500 text-[9px] uppercase tracking-[0.2em] font-black opacity-70">Saldo Atual</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-white group-hover:scale-[1.01] transition-transform duration-500 origin-left">
                {formatCurrency(totalBalance)}
              </h2>
            </div>
            <div className="sm:text-right space-y-1">
              <div className="flex items-center sm:justify-end gap-2 text-zinc-500 text-[9px] uppercase tracking-[0.2em] font-black opacity-70">
                <Clock size={10} />
                <span>Saldo Previsto</span>
              </div>
              <p className={cn(
                "text-base sm:text-lg font-black tracking-tight",
                predictedBalance >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                {formatCurrency(predictedBalance)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-12 pt-6 border-t border-zinc-800/30">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">
                  <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span>Recebido</span>
                </div>
                <p className="text-base font-black text-emerald-500 tracking-tight">{formatCurrency(summary.income)}</p>
              </div>
              {pendingSummary.income > 0 && (
                <div className="space-y-1 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-emerald-500/80 text-[8px] font-black uppercase tracking-[0.2em]">
                    <Clock size={8} />
                    <span>A Receber</span>
                  </div>
                  <p className="text-xs font-black text-emerald-500/80 tracking-tight">+{formatCurrency(pendingSummary.income)}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-500 text-[9px] font-black uppercase tracking-[0.2em]">
                  <div className="h-1 w-1 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <span>Gasto</span>
                </div>
                <p className="text-base font-black text-red-500 tracking-tight">{formatCurrency(summary.expense)}</p>
              </div>
              {pendingSummary.expense > 0 && (
                <div className="space-y-1 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-red-500/80 text-[8px] font-black uppercase tracking-[0.2em]">
                    <Clock size={8} />
                    <span>A Pagar</span>
                  </div>
                  <p className="text-xs font-black text-red-500/80 tracking-tight">-{formatCurrency(pendingSummary.expense)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Decorative Gradients */}
        <div className="absolute -right-20 -top-20 h-64 w-64 bg-emerald-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-red-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </section>

      {/* Accounts Horizontal List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Minhas Contas</h3>
          <Link to="/cards" className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em]">Ver todas</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
          {accounts.map(acc => (
            <motion.div 
              key={acc.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/cards')}
              className="flex-shrink-0 w-32 glass-card p-4 rounded-[24px] border border-zinc-800/50 relative overflow-hidden group cursor-pointer"
            >
              <div className="relative z-10 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-inner overflow-hidden">
                  {acc.imageUrl ? (
                    <img 
                      src={acc.imageUrl} 
                      alt={acc.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + acc.name;
                      }}
                    />
                  ) : (
                    <Wallet size={16} className="text-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white truncate tracking-tight">{acc.name}</p>
                  <p className="text-[10px] font-black text-zinc-500 tracking-tighter mt-0.5">{formatCurrency(acc.balance)}</p>
                </div>
              </div>
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 opacity-40"
                style={{ backgroundColor: acc.color }}
              />
            </motion.div>
          ))}
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cards')}
            className="flex-shrink-0 w-32 border border-dashed border-zinc-800 rounded-[24px] flex flex-col items-center justify-center gap-2 p-4 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all"
          >
            <Plus size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">Nova Conta</span>
          </motion.button>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/transactions?type=expense&new=true')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/40 border border-zinc-800 rounded-[24px] hover:bg-zinc-800/40 hover:border-red-500/30 hover:scale-[1.01] transition-all duration-300 active:scale-[0.98] shadow-sm group"
        >
          <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:bg-red-500 group-hover:text-zinc-950 transition-all duration-300 shadow-inner">
            <TrendingDown size={24} />
          </div>
          <p className="font-black text-[9px] text-zinc-400 group-hover:text-zinc-100 uppercase tracking-[0.2em] transition-colors">Nova Despesa</p>
        </button>
        <button 
          onClick={() => navigate('/transactions?type=income&new=true')}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/40 border border-zinc-800 rounded-[24px] hover:bg-zinc-900/40 hover:border-emerald-500/30 hover:scale-[1.01] transition-all duration-300 active:scale-[0.98] shadow-sm group"
        >
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all duration-300 shadow-inner">
            <TrendingUp size={24} />
          </div>
          <p className="font-black text-[9px] text-zinc-400 group-hover:text-zinc-100 uppercase tracking-[0.2em] transition-colors">Nova Receita</p>
        </button>
      </section>

      {/* Categories Chart */}
      {chartData.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] px-1">Gastos por Categoria</h3>
          <div className="h-64 w-full bg-zinc-900 rounded-[28px] border border-zinc-800 p-5 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-zinc-800" />
            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Transações Recentes</h3>
          </div>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] hover:text-emerald-400 transition-colors"
          >
            Ver tudo
          </button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 5).map(t => (
            <div key={t.id} className="interactive-card flex items-center justify-between p-4 rounded-[24px] shadow-sm">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center shadow-inner transition-colors duration-300",
                  t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : t.type === 'expense' ? "bg-red-500/10 text-red-500" : "bg-zinc-500/10 text-zinc-500"
                )}>
                  {t.type === 'income' ? <Plus size={20} /> : t.type === 'expense' ? <TrendingDown size={20} /> : <Repeat size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs text-zinc-100 tracking-tight truncate">{t.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em]">{t.paymentMethod}</p>
                    {t.status === 'pending' && (
                      <span className="flex items-center gap-1 text-[8px] text-amber-500 font-black uppercase tracking-[0.1em] bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/10">
                        <Clock size={8} /> Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className={cn(
                "font-black text-sm tracking-tighter",
                t.type === 'income' ? "text-emerald-500" : t.type === 'expense' ? "text-red-500" : "text-zinc-400"
              )}>
                {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-12 bg-zinc-900/20 rounded-[32px] border border-dashed border-zinc-800/50">
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Nenhuma transação este mês.</p>
            </div>
          )}
        </div>
      </section>

      {/* Alerts */}
      <section className="bg-amber-500/5 border border-amber-500/10 rounded-[20px] p-4 flex gap-3 items-center shadow-sm">
        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
          <AlertCircle size={18} />
        </div>
        <div>
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Lembrete</p>
          <p className="text-zinc-400 text-[10px] mt-0.5">Você tem contas vencendo em breve.</p>
        </div>
      </section>
    </motion.div>
  );
}
