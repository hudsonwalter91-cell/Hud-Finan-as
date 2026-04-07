import React, { useState, useEffect } from 'react';
import { 
  collection, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Category } from '../types';
import { cn } from '../utils';
import { motion } from 'motion/react';
import CategoryModal from '../components/CategoryModal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  Trash2, 
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
  GraduationCap,
  Coffee,
  Pizza,
  Bus,
  Fuel,
  Tv,
  Music,
  ShoppingCart,
  Stethoscope,
  Book,
  Gift,
  Landmark
} from 'lucide-react';

const ICONS = [
  { name: 'Utensils', icon: Utensils },
  { name: 'Coffee', icon: Coffee },
  { name: 'Pizza', icon: Pizza },
  { name: 'Car', icon: Car },
  { name: 'Bus', icon: Bus },
  { name: 'Fuel', icon: Fuel },
  { name: 'Home', icon: Home },
  { name: 'Gamepad', icon: Gamepad },
  { name: 'Tv', icon: Tv },
  { name: 'Music', icon: Music },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Landmark', icon: Landmark },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'Stethoscope', icon: Stethoscope },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Book', icon: Book },
  { name: 'Gift', icon: Gift },
  { name: 'Tag', icon: Tag },
];

export default function Categories({ user }: { user: any }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'income' | 'expense'>('expense');

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

  const handleDelete = async (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${categoryToDelete}`);
    } finally {
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = categories.filter(c => c.type === filter);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Categorias</h1>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Organize seus gastos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-10 w-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Type Tabs */}
      <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 shadow-inner">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "flex-1 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all duration-300",
              filter === t ? "bg-zinc-800 text-white shadow-sm scale-[1.01]" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t === 'income' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredCategories.map(cat => {
          const IconComp = ICONS.find(i => i.name === cat.icon)?.icon || Tag;
          return (
            <motion.div 
              layout
              key={cat.id}
              className="interactive-card relative flex flex-col items-center justify-center p-4 rounded-[24px] group overflow-hidden shadow-sm aspect-square"
            >
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
              >
                <IconComp size={20} />
              </div>
              <p className="font-bold text-[10px] text-center text-zinc-100 tracking-tight">{cat.name}</p>
              
              <button 
                onClick={() => handleDelete(cat.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-500 transition-all bg-zinc-800/50 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={14} />
              </button>

              {/* Subtle Gradient */}
              <div 
                className="absolute -right-10 -bottom-10 h-20 w-20 blur-[30px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700"
                style={{ backgroundColor: cat.color }}
              />
            </motion.div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-zinc-900/20 rounded-[24px] border border-dashed border-zinc-800/50">
            <Tag size={32} className="mx-auto text-zinc-800 mb-3" />
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Nenhuma categoria.</p>
          </div>
        )}
      </div>

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        initialType={filter}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Categoria"
        message="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
      />
    </motion.div>
  );
}
