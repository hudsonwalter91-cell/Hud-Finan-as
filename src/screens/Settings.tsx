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
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Moon, 
  Sun, 
  DollarSign, 
  Database, 
  Trash2, 
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  Tag,
  Plus,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../utils';
import { Category } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsScreen({ user }: { user: any }) {
  const [isResetting, setIsResetting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📁', color: '#10b981' });
  
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
      setNewCategory({ name: '', icon: '📁', color: '#10b981' });
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header>
        <h1 className="text-xl font-black tracking-tight text-white">Configurações</h1>
        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Personalize sua experiência</p>
      </header>

      {/* Profile Section */}
      <section className="glass-card rounded-[24px] border border-zinc-800/50 p-6 flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
          <User size={24} />
        </div>
        <div>
          <h3 className="font-black text-base text-white tracking-tight">Usuário Local</h3>
          <p className="text-zinc-500 text-[10px] font-mono opacity-70">{user?.uid?.slice(0, 12)}...</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/10">
            <Shield size={10} /> Sincronizado
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Tag size={16} />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em]">Categorias</h3>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-emerald-500 hover:text-emerald-400 transition-colors p-1"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="grid gap-2">
          {categories.map(cat => (
            <motion.div 
              layout
              key={cat.id}
              className="flex items-center justify-between bg-zinc-900/30 rounded-xl p-3 border border-zinc-800/30 hover:border-zinc-700/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: cat.color }}
                >
                  <span className="text-lg">{cat.icon}</span>
                </div>
                <span className="font-black text-xs text-zinc-100 tracking-tight">{cat.name}</span>
              </div>
              <button 
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
          
          {categories.length === 0 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-[24px] border border-dashed border-zinc-800 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-800 border border-zinc-900 group-hover:text-emerald-500 transition-colors">
                <Tag size={24} />
              </div>
              <div className="text-center">
                <p className="font-black text-[10px] uppercase tracking-widest">Nenhuma Categoria</p>
                <p className="text-[9px] mt-0.5 opacity-60">Toque para adicionar</p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Settings Groups */}
      <div className="space-y-3">
        <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Preferências</h3>
        <div className="bg-zinc-900/50 rounded-[24px] border border-zinc-800/50 divide-y divide-zinc-800/50 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
                <Moon size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white tracking-tight">Tema Escuro</p>
                <p className="text-[9px] text-zinc-500">Padrão do sistema</p>
              </div>
            </div>
            <div className="h-5 w-8 bg-emerald-500 rounded-full relative p-0.5">
              <div className="h-4 w-4 bg-zinc-950 rounded-full absolute right-0.5" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white tracking-tight">Moeda</p>
                <p className="text-[9px] text-zinc-500">Real Brasileiro (BRL)</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-zinc-700" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Dados & Backup</h3>
        <div className="bg-zinc-900/50 rounded-[24px] border border-zinc-800/50 divide-y divide-zinc-800/50 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
                <Database size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-white tracking-tight">Sincronização Cloud</p>
                <p className="text-[9px] text-zinc-500">Backup automático ativado</p>
              </div>
            </div>
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          <button 
            onClick={handleResetData}
            disabled={isResetting}
            className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                <Trash2 size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-red-500 tracking-tight">Resetar Todos os Dados</p>
                <p className="text-[9px] text-zinc-500">Limpar histórico e configurações</p>
              </div>
            </div>
            {isResetting && <div className="h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Sobre</h3>
        <div className="bg-zinc-900/50 rounded-[24px] border border-zinc-800/50 p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
              <Smartphone size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-tight">Mobills Clone PWA</p>
              <p className="text-[9px] text-zinc-500">Versão 1.0.0</p>
            </div>
          </div>
          <p className="text-[9px] text-zinc-600 leading-relaxed font-medium">
            Este é um aplicativo de controle financeiro pessoal focado em privacidade e simplicidade. 
            Seus dados são armazenados de forma segura no Firebase Firestore.
          </p>
        </div>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[8px] text-zinc-700 uppercase tracking-[0.2em] font-black">Desenvolvido com ❤️ para você</p>
      </div>

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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Ícone</label>
                        <select 
                          value={newCategory.icon}
                          onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white font-bold focus:border-emerald-500 transition-all outline-none appearance-none"
                        >
                          {['📁', '🍔', '🛒', '🚗', '🏠', '🎁', '💊', '🎓', '✈️', '🎮', '💡', '💰'].map(emoji => (
                            <option key={emoji} value={emoji}>{emoji}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Cor</label>
                        <input 
                          type="color" 
                          value={newCategory.color}
                          onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-full h-[54px] bg-zinc-950 border border-zinc-800 rounded-xl p-2 cursor-pointer focus:border-emerald-500 transition-all outline-none"
                        />
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
