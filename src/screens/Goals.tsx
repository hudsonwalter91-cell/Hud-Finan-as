import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Goal } from '../types';
import { formatCurrency, cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  Target, 
  X, 
  Trash2, 
  TrendingUp,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function Goals({ user }: { user: any }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Goal>>({
    name: '',
    targetValue: 0,
    currentValue: 0,
    deadline: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goals'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name) return;

    try {
      await addDoc(collection(db, 'goals'), {
        ...formData,
        uid: user.uid
      });
      setIsModalOpen(false);
      setFormData({ name: '', targetValue: 0, currentValue: 0, deadline: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
    }
  };

  const handleDelete = async (id: string) => {
    setGoalToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await deleteDoc(doc(db, 'goals', goalToDelete));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `goals/${goalToDelete}`);
    } finally {
      setGoalToDelete(null);
    }
  };

  const handleUpdateAmount = async (id: string, current: number, increment: number) => {
    const newAmount = Math.max(0, current + increment);
    await updateDoc(doc(db, 'goals', id), { currentValue: newAmount });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Metas</h1>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Planeje seu futuro</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-10 w-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="grid gap-4">
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
          const isCompleted = progress >= 100;

          return (
            <motion.div 
              layout
              key={goal.id}
              className="relative overflow-hidden rounded-[32px] glass-card p-6 shadow-md group hover:scale-[1.01] transition-all duration-500"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-inner transition-all duration-500 group-hover:scale-110",
                    isCompleted ? "text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-zinc-500"
                  )}>
                    {isCompleted ? <CheckCircle2 size={24} /> : <Target size={24} />}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white tracking-tight">{goal.name}</h3>
                    <div className="flex items-center gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-[0.1em] mt-1 opacity-70">
                      <Calendar size={10} className="text-emerald-500" />
                      <span>Até {new Date(goal.deadline!).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors bg-zinc-800/50 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-8 space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Progresso Atual</p>
                    <p className="text-xl font-black tracking-tighter text-white group-hover:scale-[1.01] transition-transform duration-500 origin-left">
                      {formatCurrency(goal.currentValue)} <span className="text-zinc-500 text-xs font-normal tracking-normal opacity-50">/ {formatCurrency(goal.targetValue)}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-base font-black tracking-tighter",
                      isCompleted ? "text-emerald-500" : "text-white"
                    )}>{progress.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50 p-0.5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 shadow-sm",
                      isCompleted ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-emerald-500/80"
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleUpdateAmount(goal.id, goal.currentValue, 100)}
                    className="flex-1 bg-zinc-950/50 border border-zinc-800 text-[8px] font-black uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-zinc-500 hover:text-white shadow-sm"
                  >
                    + R$ 100
                  </button>
                  <button 
                    onClick={() => handleUpdateAmount(goal.id, goal.currentValue, 500)}
                    className="flex-1 bg-zinc-950/50 border border-zinc-800 text-[8px] font-black uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-zinc-500 hover:text-white shadow-sm"
                  >
                    + R$ 500
                  </button>
                </div>
              </div>
              
              {/* Subtle Gradient */}
              <div className="absolute -right-20 -bottom-20 h-40 w-40 bg-emerald-500/5 blur-[80px] rounded-full group-hover:opacity-100 transition-opacity duration-700" />
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-6 bg-zinc-900/20 rounded-[32px] border border-dashed border-zinc-800/50">
            <div className="h-20 w-20 rounded-[24px] bg-zinc-950 flex items-center justify-center text-zinc-800 border border-zinc-900 shadow-sm relative group">
              <Target size={40} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="text-center space-y-2 px-6">
              <p className="font-black text-lg text-white tracking-tight">Nenhuma meta definida</p>
              <p className="text-[11px] max-w-[200px] text-zinc-500 font-medium leading-relaxed opacity-70">Defina seus objetivos financeiros e acompanhe seu progresso.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500 text-zinc-950 font-black px-6 py-3 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
            >
              <Plus size={16} />
              Criar Meta
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-lg glass-card rounded-t-[32px] sm:rounded-[32px] p-8 border-t sm:border border-zinc-800 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-xl font-black tracking-tight text-white">Nova Meta</h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-500 hover:text-white transition-colors border border-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">O que você quer conquistar?</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full py-4 px-5 rounded-xl text-sm"
                    placeholder="Ex: Viagem para Europa..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Valor Alvo</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                      className="input-field w-full py-4 px-5 rounded-xl text-lg font-black tracking-tighter"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Já Guardado</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.currentValue || ''}
                      onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
                      className="input-field w-full py-4 px-5 rounded-xl text-lg font-black tracking-tighter"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Prazo Final</label>
                  <input 
                    type="date" 
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="input-field w-full py-4 px-5 rounded-xl text-sm"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-500 text-zinc-950 font-black py-4 rounded-xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-widest text-[10px]"
                >
                  Criar Meta
                </button>
              </form>
              {/* Subtle Gradient */}
              <div className="absolute -right-20 -bottom-20 h-48 w-48 bg-emerald-500/5 blur-[100px] rounded-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Meta"
        message="Tem certeza que deseja excluir esta meta? Seu progresso será perdido."
      />
    </motion.div>
  );
}
