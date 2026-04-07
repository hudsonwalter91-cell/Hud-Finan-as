import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  updateDoc,
  getDoc,
  runTransaction 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, Category, TransactionType, TransactionStatus, Account } from '../types';
import { formatCurrency, formatDate, cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  X,
  ChevronDown,
  Calendar,
  Tag,
  CreditCard,
  CheckCircle2,
  Clock,
  TrendingDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Repeat,
  Layers
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CategoryModal from '../components/CategoryModal';
import ConfirmModal from '../components/ConfirmModal';
import { startOfMonth, endOfMonth, addMonths, subMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: 'Utensils', color: '#ef4444', type: 'expense' },
  { name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { name: 'Moradia', icon: 'Home', color: '#f59e0b', type: 'expense' },
  { name: 'Lazer', icon: 'Gamepad', color: '#ec4899', type: 'expense' },
  { name: 'Salário', icon: 'DollarSign', color: '#10b981', type: 'income' },
  { name: 'Investimentos', icon: 'TrendingUp', color: '#8b5cf6', type: 'income' },
];

export default function Transactions({ user }: { user: any }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('new') === 'true');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    amount: 0,
    accountId: '',
    toAccountId: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'Dinheiro',
    status: 'paid',
    installments: 1,
    isRecurring: false
  });

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

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });
    return () => unsubscribe();
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default categories
        for (const cat of DEFAULT_CATEGORIES) {
          await addDoc(collection(db, 'categories'), { ...cat, uid: user.uid });
        }
      } else {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });
    return () => unsubscribe();
  }, [user]);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.amount || !formData.accountId) return;
    if (formData.type !== 'transfer' && !formData.categoryId) return;
    if (formData.type === 'transfer' && !formData.toAccountId) return;

    setIsSaving(true);
    try {
      if (editingTransaction) {
        await runTransaction(db, async (transaction) => {
          // 1. All Reads First
          const accountRef = doc(db, 'accounts', formData.accountId!);
          const oldAccountRef = doc(db, 'accounts', editingTransaction.accountId);
          const oldToAccountRef = editingTransaction.toAccountId ? doc(db, 'accounts', editingTransaction.toAccountId) : null;
          const toAccountRef = formData.toAccountId ? doc(db, 'accounts', formData.toAccountId) : null;

          // Collect unique refs to avoid redundant gets
          const refsToGet = new Set([accountRef.path, oldAccountRef.path]);
          if (oldToAccountRef) refsToGet.add(oldToAccountRef.path);
          if (toAccountRef) refsToGet.add(toAccountRef.path);

          const docsMap = new Map();
          for (const path of refsToGet) {
            const d = await transaction.get(doc(db, path));
            docsMap.set(path, d);
          }

          const accountDoc = docsMap.get(accountRef.path);
          const oldAccountDoc = docsMap.get(oldAccountRef.path);
          const oldToAccountDoc = oldToAccountRef ? docsMap.get(oldToAccountRef.path) : null;
          const toAccountDoc = toAccountRef ? docsMap.get(toAccountRef.path) : null;

          // 2. Logic and Writes
          if (!accountDoc?.exists()) {
            throw new Error("Account does not exist!");
          }

          const currentBalance = accountDoc.data().balance;
          let newBalance = currentBalance;

          // Revert old transaction balance impact if it was paid
          if (editingTransaction.status === 'paid' && oldAccountDoc?.exists()) {
            const oldBalance = oldAccountDoc.data().balance;
            let revertedBalance = oldBalance;
            
            if (editingTransaction.type === 'income') {
              revertedBalance = oldBalance - editingTransaction.amount;
            } else if (editingTransaction.type === 'expense' || editingTransaction.type === 'transfer') {
              revertedBalance = oldBalance + editingTransaction.amount;
            }
            
            if (editingTransaction.accountId === formData.accountId) {
              newBalance = revertedBalance;
            } else {
              transaction.update(oldAccountRef, { balance: revertedBalance });
            }

            if (editingTransaction.type === 'transfer' && oldToAccountRef && oldToAccountDoc?.exists()) {
              const oldToBalance = oldToAccountDoc.data().balance;
              const revertedToBalance = oldToBalance - editingTransaction.amount;
              
              if (editingTransaction.toAccountId === formData.accountId) {
                newBalance = revertedToBalance;
              } else {
                transaction.update(oldToAccountRef, { balance: revertedToBalance });
              }
            }
          }

          // Apply new transaction balance impact if paid
          if (formData.status === 'paid') {
            if (formData.type === 'income') {
              newBalance = newBalance + formData.amount!;
            } else if (formData.type === 'expense' || formData.type === 'transfer') {
              newBalance = newBalance - formData.amount!;
            }

            if (formData.type === 'transfer' && toAccountRef && toAccountDoc?.exists()) {
              const toBalance = toAccountDoc.data().balance;
              const newToBalance = toBalance + formData.amount!;
              transaction.update(toAccountRef, { balance: newToBalance });
            }
          }

          const transactionRef = doc(db, 'transactions', editingTransaction.id);
          const updateData: any = {
            ...formData,
            date: new Date(formData.date!).toISOString()
          };
          
          // Remove undefined values
          Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
          });

          transaction.update(transactionRef, updateData);

          if (formData.status === 'paid' || editingTransaction.status === 'paid') {
            transaction.update(accountRef, { balance: newBalance });
          }
        });
      } else {
        // New transaction logic (potentially multiple)
        const numRepetitions = formData.installments || 1;
        const parentId = crypto.randomUUID();
        const startDate = parseISO(formData.date!);

        for (let i = 0; i < numRepetitions; i++) {
          const currentDate = addMonths(startDate, i);
          const currentStatus = i === 0 ? formData.status : 'pending';
          
          await runTransaction(db, async (transaction) => {
            // 1. All Reads First
            const accountRef = doc(db, 'accounts', formData.accountId!);
            const toAccountRef = (currentStatus === 'paid' && formData.type === 'transfer' && formData.toAccountId) 
              ? doc(db, 'accounts', formData.toAccountId) 
              : null;

            const accountDoc = await transaction.get(accountRef);
            let toAccountDoc = null;
            if (toAccountRef) {
              toAccountDoc = await transaction.get(toAccountRef);
            }

            // 2. Logic and Writes
            if (!accountDoc.exists()) throw new Error("Account not found");

            const currentBalance = accountDoc.data().balance;
            
            const transactionRef = doc(collection(db, 'transactions'));
            const transactionData: any = {
              ...formData,
              uid: user.uid,
              date: currentDate.toISOString(),
              status: currentStatus,
            };

            if (numRepetitions > 1) {
              transactionData.parentId = parentId;
              transactionData.installmentIndex = i + 1;
              transactionData.installments = numRepetitions;
            }

            // Remove undefined values
            Object.keys(transactionData).forEach(key => {
              if (transactionData[key] === undefined) delete transactionData[key];
            });

            transaction.set(transactionRef, transactionData);

            if (currentStatus === 'paid') {
              let newBalance = currentBalance;
              if (formData.type === 'income') {
                newBalance = currentBalance + formData.amount!;
              } else if (formData.type === 'expense' || formData.type === 'transfer') {
                newBalance = currentBalance - formData.amount!;
              }
              transaction.update(accountRef, { balance: newBalance });

              if (toAccountRef && toAccountDoc?.exists()) {
                const toBalance = toAccountDoc.data().balance;
                transaction.update(toAccountRef, { balance: toBalance + formData.amount! });
              }
            }
          });
        }
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: 0,
        accountId: '',
        toAccountId: '',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'Dinheiro',
        status: 'paid',
        installments: 1,
        isRecurring: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      amount: t.amount,
      accountId: t.accountId,
      toAccountId: t.toAccountId || '',
      categoryId: t.categoryId,
      date: t.date.split('T')[0],
      description: t.description,
      paymentMethod: t.paymentMethod,
      status: t.status,
      installments: 1,
      isRecurring: false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (t: Transaction) => {
    setTransactionToDelete(t.id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    const t = transactions.find(tr => tr.id === transactionToDelete);
    if (!t) return;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. All Reads First
        const accountRef = doc(db, 'accounts', t.accountId);
        const accountDoc = await transaction.get(accountRef);

        let toAccountDoc = null;
        if (t.status === 'paid' && t.type === 'transfer' && t.toAccountId) {
          const toAccountRef = doc(db, 'accounts', t.toAccountId);
          toAccountDoc = await transaction.get(toAccountRef);
        }

        // 2. Logic and Writes
        if (accountDoc.exists()) {
          const currentBalance = accountDoc.data().balance;
          // Only reverse balance if it was paid
          if (t.status === 'paid') {
            let newBalance = currentBalance;
            if (t.type === 'income') {
              newBalance = currentBalance - t.amount;
            } else if (t.type === 'expense' || t.type === 'transfer') {
              newBalance = currentBalance + t.amount;
            }
            
            transaction.update(accountRef, { balance: newBalance });

            if (t.type === 'transfer' && t.toAccountId && toAccountDoc?.exists()) {
              const toBalance = toAccountDoc.data().balance;
              transaction.update(doc(db, 'accounts', t.toAccountId), { balance: toBalance - t.amount });
            }
          }
        }

        transaction.delete(doc(db, 'transactions', t.id));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${t.id}`);
    } finally {
      setTransactionToDelete(null);
    }
  };

  const handleToggleStatus = async (t: Transaction) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. All Reads First
        const transactionRef = doc(db, 'transactions', t.id);
        const accountRef = doc(db, 'accounts', t.accountId);
        const accountDoc = await transaction.get(accountRef);

        let toAccountDoc = null;
        const newStatus: TransactionStatus = t.status === 'paid' ? 'pending' : 'paid';
        let balanceAdjustment = 0;
        if (t.status === 'pending' && newStatus === 'paid') {
          balanceAdjustment = t.type === 'income' ? t.amount : -t.amount;
        } else if (t.status === 'paid' && newStatus === 'pending') {
          balanceAdjustment = t.type === 'income' ? -t.amount : t.amount;
        }

        if (balanceAdjustment !== 0 && t.type === 'transfer' && t.toAccountId) {
          const toAccountRef = doc(db, 'accounts', t.toAccountId);
          toAccountDoc = await transaction.get(toAccountRef);
        }

        // 2. Logic and Writes
        if (!accountDoc.exists()) throw new Error("Account not found");

        const currentBalance = accountDoc.data().balance;
        
        transaction.update(transactionRef, { status: newStatus });
        if (balanceAdjustment !== 0) {
          transaction.update(accountRef, { balance: currentBalance + balanceAdjustment });
          
          if (t.type === 'transfer' && t.toAccountId && toAccountDoc?.exists()) {
            const toBalance = toAccountDoc.data().balance;
            // If moving to paid, credit toAccount. If moving to pending, debit toAccount.
            const toAdjustment = (t.status === 'pending' && newStatus === 'paid') ? t.amount : -t.amount;
            transaction.update(doc(db, 'accounts', t.toAccountId), { balance: toBalance + toAdjustment });
          }
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${t.id}`);
    }
  };

  const filteredTransactions = transactions.filter(t => filter === 'all' || t.type === filter);

  const includedAccountIds = accounts
    .filter(a => a.includeInTotal !== false)
    .map(a => a.id);

  const monthSummary = transactions.reduce((acc, t) => {
    if (t.status === 'paid' && includedAccountIds.includes(t.accountId)) {
      if (t.type === 'income') acc.income += t.amount;
      else if (t.type === 'expense') acc.expense += t.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const currentMonthName = format(selectedDate, 'MMMM', { locale: ptBR });
  const currentYear = format(selectedDate, 'yyyy');

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));
  const handleCurrentMonth = () => setSelectedDate(new Date());

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Transações</h1>
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
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/categories')}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all shadow-sm"
            title="Categorias"
          >
            <Tag size={18} />
          </button>
          <button 
            onClick={() => setFilter(filter === 'all' ? 'expense' : filter === 'expense' ? 'income' : 'all')}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-500 transition-all shadow-sm"
          >
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Month Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[24px] space-y-2 shadow-sm group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em]">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <span>Receitas</span>
          </div>
          <p className="text-lg font-black text-emerald-500 tracking-tight truncate">{formatCurrency(monthSummary.income)}</p>
        </div>
        <div className="glass-card p-5 rounded-[24px] space-y-2 shadow-sm group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center gap-2 text-red-500 text-[9px] font-black uppercase tracking-[0.2em]">
            <div className="h-1 w-1 rounded-full bg-red-500" />
            <span>Despesas</span>
          </div>
          <p className="text-lg font-black text-red-500 tracking-tight truncate">{formatCurrency(monthSummary.expense)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-zinc-900/50 p-1 rounded-[20px] border border-zinc-800/50 shadow-inner overflow-x-auto no-scrollbar">
        {(['all', 'income', 'expense', 'transfer'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "flex-shrink-0 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
              filter === t ? "bg-zinc-800 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : t === 'expense' ? 'Despesas' : 'Transf.'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredTransactions.map(t => (
          <motion.div 
            layout
            key={t.id} 
            className="interactive-card flex items-center justify-between p-4 rounded-[24px] shadow-sm"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleToggleStatus(t)}
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center text-base transition-all duration-300",
                  t.status === 'paid' 
                    ? (t.type === 'income' ? "bg-emerald-500 text-zinc-950" : t.type === 'expense' ? "bg-red-500 text-zinc-950" : "bg-zinc-500 text-zinc-950")
                    : "bg-zinc-800 text-zinc-500 hover:text-amber-500"
                )}
              >
                {t.status === 'paid' ? (
                  t.type === 'income' ? <Plus size={20} /> : t.type === 'expense' ? <TrendingDown size={20} /> : <Repeat size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-black text-xs text-zinc-100 tracking-tight truncate">{t.description || 'Sem descrição'}</p>
                  {t.type === 'transfer' && (
                    <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-[0.1em] border border-zinc-700/50">
                      Transf.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-black uppercase tracking-[0.1em] mt-1 opacity-70 flex-wrap">
                  <span>{formatDate(t.date)}</span>
                  <div className="h-0.5 w-0.5 rounded-full bg-zinc-800" />
                  <div className="flex items-center gap-1.5">
                    {accounts.find(a => a.id === t.accountId)?.imageUrl ? (
                      <img 
                        src={accounts.find(a => a.id === t.accountId)?.imageUrl} 
                        alt="" 
                        className="h-3 w-3 rounded-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const acc = accounts.find(a => a.id === t.accountId);
                          (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + (acc?.name || 'Bank');
                        }}
                      />
                    ) : (
                      <div 
                        className="h-1.5 w-1.5 rounded-full" 
                        style={{ backgroundColor: accounts.find(a => a.id === t.accountId)?.color || '#10b981' }} 
                      />
                    )}
                    <span>{accounts.find(a => a.id === t.accountId)?.name || 'Conta excluída'}</span>
                  </div>
                  <div className="h-0.5 w-0.5 rounded-full bg-zinc-800" />
                  <span>{t.paymentMethod}</span>
                  {t.status === 'pending' && (
                    <span className="flex items-center gap-1 text-amber-500 font-black">
                      <Clock size={8} /> Pendente
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={cn(
                "font-black text-sm tracking-tighter",
                t.type === 'income' ? "text-emerald-500" : t.type === 'expense' ? "text-red-500" : "text-zinc-400"
              )}>
                {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
              </p>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={() => handleEdit(t)}
                  className="p-2 text-zinc-500 hover:text-white transition-all bg-zinc-800/50 rounded-lg hover:bg-zinc-700"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(t)}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-all bg-zinc-800/50 rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h2>
                  <button onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                  }} className="p-2 text-zinc-500 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveTransaction} className="space-y-4">
                  {/* Type Toggle */}
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        formData.type === 'expense' ? "bg-red-500 text-white shadow-lg" : "text-zinc-500"
                      )}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        formData.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500"
                      )}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'transfer' })}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                        formData.type === 'transfer' ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-500"
                      )}
                    >
                      Transf.
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="text-center py-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Valor</label>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-zinc-500">R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        className="w-40 bg-transparent text-3xl font-bold text-white text-center outline-none placeholder:text-zinc-800"
                        placeholder="0,00"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Account & Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                        {formData.type === 'transfer' ? 'De Conta' : 'Conta'}
                      </label>
                      <select 
                        required
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        className="input-field font-bold"
                      >
                        <option value="">Selecione</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    {formData.type === 'transfer' ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Para Conta</label>
                        <select 
                          required
                          value={formData.toAccountId}
                          onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                          className="input-field font-bold"
                        >
                          <option value="">Selecione</option>
                          {accounts.filter(acc => acc.id !== formData.accountId).map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Categoria</label>
                          <button 
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline"
                          >
                            + Nova
                          </button>
                        </div>
                        <select 
                          required
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="input-field font-bold"
                        >
                          <option value="">Selecione</option>
                          {categories.filter(c => c.type === formData.type).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Date & Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Data</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Pagamento</label>
                      <select 
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="input-field"
                      >
                        <option>Dinheiro</option>
                        <option>Cartão de Crédito</option>
                        <option>Cartão de Débito</option>
                        <option>PIX</option>
                        <option>Boleto</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Descrição</label>
                    <input 
                      type="text" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Aluguel, Supermercado..."
                      className="input-field"
                    />
                  </div>

                  {!editingTransaction && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                            formData.isRecurring ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                          )}>
                            <Repeat size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Recorrente / Parcelado</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Repetir mensalmente</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring, installments: !formData.isRecurring ? 2 : 1 })}
                          className={cn(
                            "w-10 h-5 rounded-full relative transition-colors",
                            formData.isRecurring ? "bg-emerald-500" : "bg-zinc-800"
                          )}
                        >
                          <motion.div 
                            animate={{ x: formData.isRecurring ? 22 : 2 }}
                            className="absolute top-0.5 h-4 w-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>

                      <AnimatePresence>
                        {formData.isRecurring && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Número de vezes</label>
                                <span className="text-xs font-bold text-emerald-500">{formData.installments}x</span>
                              </div>
                              <input 
                                type="range"
                                min="2"
                                max="100"
                                value={formData.installments}
                                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                              <p className="text-[10px] text-zinc-500 text-center italic">
                                A transação será repetida por {formData.installments} meses no dia {formData.date?.split('-')[2]}.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'paid' })}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        formData.status === 'paid' ? "bg-zinc-800 text-white" : "text-zinc-500"
                      )}
                    >
                      Efetivada
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'pending' })}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        formData.status === 'pending' ? "bg-amber-500/20 text-amber-500" : "text-zinc-500"
                      )}
                    >
                      Pendente
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSaving || !formData.amount || (formData.type !== 'transfer' && !formData.categoryId) || (formData.type === 'transfer' && !formData.toAccountId) || !formData.accountId}
                    className="btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'SALVANDO...' : 'SALVAR TRANSAÇÃO'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        user={user}
        initialType={formData.type === 'income' ? 'income' : 'expense'}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? O saldo das contas envolvidas será ajustado automaticamente."
      />
    </motion.div>
  );
}
