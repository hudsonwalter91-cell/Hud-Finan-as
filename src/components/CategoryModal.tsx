import React, { useState } from 'react';
import { 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Category } from '../types';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Tag,
  Utensils,
  Car,
  Home,
  Gamepad,
  DollarSign,
  TrendingUp,
  Briefcase,
  ShoppingBag,
  HeartPulse,
  GraduationCap
} from 'lucide-react';

const ICONS = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Car', icon: Car },
  { name: 'Home', icon: Home },
  { name: 'Gamepad', icon: Gamepad },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Tag', icon: Tag },
];

const COLORS = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  initialType?: 'income' | 'expense';
}

export default function CategoryModal({ isOpen, onClose, user, initialType = 'expense' }: CategoryModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    type: initialType,
    color: COLORS[0],
    icon: 'Tag'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'categories'), {
        ...formData,
        uid: user.uid
      });
      onClose();
      setFormData({ name: '', type: initialType, color: COLORS[0], icon: 'Tag' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="w-full max-w-lg bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 border-t sm:border border-zinc-800 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Nova Categoria</h2>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Toggle */}
              <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                      formData.type === t ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500"
                    )}
                  >
                    {t === 'income' ? 'Receita' : 'Despesa'}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm focus:border-emerald-500 outline-none"
                  placeholder="Ex: Mercado, Freelance..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(i => (
                    <button
                      key={i.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: i.name })}
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                        formData.icon === i.name ? "bg-emerald-500 text-zinc-950" : "bg-zinc-950 text-zinc-500 border border-zinc-800"
                      )}
                    >
                      <i.icon size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cor</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={cn(
                        "h-10 w-full rounded-xl transition-all border-2",
                        formData.color === c ? "border-white" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving || !formData.name}
                className="w-full bg-emerald-500 text-zinc-950 font-black py-5 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'SALVANDO...' : 'Salvar Categoria'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
