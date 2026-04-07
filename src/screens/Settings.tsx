import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Moon, 
  Sun, 
  DollarSign, 
  Database, 
  Trash2, 
  ChevronRight,
  Shield,
  Smartphone,
  Tag,
  Plus,
  X,
  Utensils,
  Car,
  Home,
  Gamepad,
  Briefcase,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  TrendingUp,
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

const COLORS = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
];
import { cn, formatCurrency } from '../utils';
import { Category } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsScreen({ user }: { user: any }) {
  const [isResetting, setIsResetting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Tag', color: '#10b981' });
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  } | null>(null);

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategory.name) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'categories'), {
        ...newCategory,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      setNewCategory({ name: '', icon: 'Tag', color: '#10b981' });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmConfig({
      title: "Excluir Categoria",
      message: "Tem certeza que deseja excluir esta categoria?",
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'categories', id));
          setIsConfirmOpen(false);
        } catch (error) {
          console.error("Error deleting category:", error);
        }
      }
    });
    setIsConfirmOpen(true);
  };

  const handleResetData = () => {
    setConfirmConfig({
      title: "Resetar Todos os Dados",
      message: "ATENÇÃO: Isso excluirá permanentemente todas as suas transações, cartões e metas. Esta ação não pode ser desfeita.",
      variant: 'danger',
      onConfirm: async () => {
        if (!user) return;
        setIsResetting(true);
        try {
          const collections = ['transactions', 'accounts', 'goals', 'categories'];
          for (const col of collections) {
            const q = query(collection(db, col), where('uid', '==', user.uid));
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, col, d.id)));
            await Promise.all(deletePromises);
          }
          setIsConfirmOpen(false);
          window.location.reload();
        } catch (error) {
          console.error("Error resetting data:", error);
        } finally {
          setIsResetting(false);
        }
      }
    });
    setIsConfirmOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-8 max-w-xl mx-auto"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white">Ajustes</h1>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Configurações do aplicativo</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
          <SettingsIcon size={20} />
        </div>
      </header>

      {/* Profile Card */}
      <section className="relative overflow-hidden rounded-[32px] glass-card p-6 shadow-xl border border-zinc-800/50 group">
        <div className="relative z-10 flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-105 transition-transform duration-500">
            <User size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-white tracking-tight">Visitante</h3>
            <p className="text-zinc-500 text-[10px] font-mono opacity-70 mt-0.5">ID: {user?.uid?.slice(0, 12)}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/10">
              <Shield size={10} /> Conta Protegida
            </div>
          </div>
        </div>
        {/* Background Glow */}
        <div className="absolute -right-10 -top-10 h-32 w-32 bg-emerald-500/5 blur-[50px] rounded-full group-hover:opacity-100 transition-opacity" />
      </section>

      {/* Main Settings Groups */}
      <div className="space-y-6">
        {/* Categories Group */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Categorias Personalizadas</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {categories.length > 0 ? (
              <div className="bg-zinc-900/30 rounded-[24px] border border-zinc-800/50 divide-y divide-zinc-800/30 overflow-hidden">
                {categories.map(cat => (
                  <motion.div 
                    layout
                    key={cat.id}
                    className="flex items-center justify-between p-4 hover:bg-zinc-800/20 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: cat.color }}
                      >
                        {(() => {
                          const IconComp = ICONS.find(i => i.name === cat.icon)?.icon || Tag;
                          return <IconComp size={16} />;
                        })()}
                      </div>
                      <span className="font-bold text-[11px] text-zinc-100 tracking-tight">{cat.name}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-zinc-700 hover:text-red-500 transition-colors bg-zinc-800/50 rounded-lg opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center justify-center gap-4 p-10 rounded-[32px] border border-dashed border-zinc-800 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
              >
                <div className="h-14 w-14 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-800 border border-zinc-900 group-hover:text-emerald-500 transition-colors shadow-inner">
                  <Tag size={28} />
                </div>
                <div className="text-center">
                  <p className="font-black text-[11px] uppercase tracking-[0.2em]">Crie sua primeira categoria</p>
                  <p className="text-[9px] mt-1.5 opacity-60 font-medium">Toque para começar a organizar</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* App Preferences */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Preferências do App</h3>
          <div className="bg-zinc-900/30 rounded-[28px] border border-zinc-800/50 divide-y divide-zinc-800/30 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 hover:bg-zinc-800/20 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                  <Moon size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white tracking-tight">Modo Escuro</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Ativado por padrão</p>
                </div>
              </div>
              <div className="h-6 w-10 bg-emerald-500 rounded-full relative p-1 shadow-inner">
                <div className="h-4 w-4 bg-white rounded-full absolute right-1 shadow-sm" />
              </div>
            </div>

            <div className="flex items-center justify-between p-5 hover:bg-zinc-800/20 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-colors">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white tracking-tight">Moeda Principal</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Real Brasileiro (BRL)</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Segurança e Dados</h3>
          <div className="bg-zinc-900/30 rounded-[28px] border border-zinc-800/50 divide-y divide-zinc-800/30 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 hover:bg-zinc-800/20 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                  <Database size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white tracking-tight">Sincronização Cloud</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Backup em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ativo</span>
                <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              </div>
            </div>

            <button 
              onClick={handleResetData}
              disabled={isResetting}
              className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-zinc-950 transition-all shadow-inner">
                  <Trash2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-red-500 tracking-tight">Limpar Todos os Dados</p>
                  <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Ação irreversível</p>
                </div>
              </div>
              {isResetting ? (
                <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight size={18} className="text-zinc-700 group-hover:text-red-500 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* About Card */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Informações</h3>
          <div className="bg-zinc-900/30 rounded-[28px] border border-zinc-800/50 p-6 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:rotate-12 transition-transform duration-500">
                <Smartphone size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-tight">Mobills Clone v1.0</p>
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Build 2026.04.07</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium relative z-10">
              Aplicativo de controle financeiro pessoal focado em privacidade e simplicidade. 
              Seus dados são armazenados de forma segura e sincronizados automaticamente.
            </p>
            {/* Background Pattern */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <SettingsIcon size={120} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 pb-4 text-center space-y-2">
        <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-black">Mobills Clone App</p>
        <div className="flex items-center justify-center gap-4 text-[8px] text-zinc-800 font-black uppercase tracking-widest">
          <span>Termos</span>
          <div className="h-1 w-1 rounded-full bg-zinc-900" />
          <span>Privacidade</span>
        </div>
      </footer>

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 rounded-[32px] border border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black tracking-tight text-white">Nova Categoria</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddCategory} className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Nome da Categoria</label>
                      <input 
                        type="text" 
                        value={newCategory.name}
                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Ex: Alimentação"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white font-bold placeholder:text-zinc-700 focus:border-emerald-500 transition-all outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Ícone</label>
                      <div className="grid grid-cols-6 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        {ICONS.map(i => (
                          <button
                            key={i.name}
                            type="button"
                            onClick={() => setNewCategory({ ...newCategory, icon: i.name })}
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                              newCategory.icon === i.name ? "bg-emerald-500 text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            <i.icon size={16} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Cor</label>
                      <div className="grid grid-cols-5 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        {COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewCategory({ ...newCategory, color: c })}
                            className={cn(
                              "h-6 w-full rounded-md transition-all border-2",
                              newCategory.color === c ? "border-white" : "border-transparent"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving || !newCategory.name}
                    className="w-full bg-emerald-500 text-zinc-950 font-black py-4 rounded-xl hover:scale-[1.01] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
                  >
                    {isSaving ? 'CRIANDO...' : 'CRIAR CATEGORIA'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {confirmConfig && (
        <ConfirmModal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          variant={confirmConfig.variant}
        />
      )}
    </motion.div>
  );
}
