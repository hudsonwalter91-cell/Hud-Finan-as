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
import { Account, AccountType } from '../types';
import { formatCurrency, cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  CreditCard, 
  Wallet, 
  Banknote, 
  PiggyBank,
  X,
  Trash2,
  MoreVertical,
  Edit2,
  Eye,
  EyeOff,
  Upload,
  AlertCircle
} from 'lucide-react';

const ACCOUNT_TYPES: { type: AccountType, label: string, icon: any }[] = [
  { type: 'wallet', label: 'Carteira', icon: Wallet },
  { type: 'checking', label: 'Conta Corrente', icon: CreditCard },
  { type: 'savings', label: 'Poupança', icon: PiggyBank },
  { type: 'other', label: 'Outros', icon: Banknote },
];

const BANKS = [
  { id: 'nubank', name: 'Nubank', color: '#8a05be', logo: 'https://logo.clearbit.com/nubank.com.br' },
  { id: 'itau', name: 'Itaú', color: '#ec7000', logo: 'https://logo.clearbit.com/itau.com.br' },
  { id: 'bradesco', name: 'Bradesco', color: '#cc092f', logo: 'https://logo.clearbit.com/bradesco.com.br' },
  { id: 'santander', name: 'Santander', color: '#ec0000', logo: 'https://logo.clearbit.com/santander.com.br' },
  { id: 'bb', name: 'Banco do Brasil', color: '#fcfc30', logo: 'https://logo.clearbit.com/bb.com.br' },
  { id: 'caixa', name: 'Caixa', color: '#0050a0', logo: 'https://logo.clearbit.com/caixa.gov.br' },
  { id: 'inter', name: 'Inter', color: '#ff7a00', logo: 'https://logo.clearbit.com/bancointer.com.br' },
  { id: 'c6', name: 'C6 Bank', color: '#212121', logo: 'https://logo.clearbit.com/c6bank.com.br' },
  { id: 'other', name: 'Outro', color: '#10b981', logo: null },
];

const COLORS = [
  '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#212121', '#8a05be', '#ec7000'
];

export default function Cards({ user }: { user: any }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    balance: 0,
    type: 'checking',
    color: '#10b981',
    imageUrl: '',
    includeInTotal: true
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'accounts'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name) return;

    setIsSaving(true);
    try {
      if (editingAccount) {
        await updateDoc(doc(db, 'accounts', editingAccount.id), {
          ...formData
        });
      } else {
        await addDoc(collection(db, 'accounts'), {
          ...formData,
          initialBalance: formData.balance,
          uid: user.uid
        });
      }
      setIsModalOpen(false);
      setEditingAccount(null);
      setFormData({ name: '', balance: 0, type: 'checking', color: '#10b981', imageUrl: '', includeInTotal: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'accounts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      balance: acc.balance,
      type: acc.type,
      color: acc.color,
      imageUrl: acc.imageUrl || '',
      includeInTotal: acc.includeInTotal ?? true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setAccountToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteDoc(doc(db, 'accounts', accountToDelete));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `accounts/${accountToDelete}`);
    } finally {
      setAccountToDelete(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 100KB for base64 storage in Firestore)
    if (file.size > 102400) {
      setError("A imagem é muito grande. Por favor, escolha uma imagem com menos de 100KB.");
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
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
          <h1 className="text-xl font-black tracking-tight text-white">Minhas Contas</h1>
          <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Gerencie suas contas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-10 w-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      <div className="grid gap-4">
        {accounts.map(acc => {
          const TypeIcon = ACCOUNT_TYPES.find(t => t.type === acc.type)?.icon || Banknote;
          return (
            <motion.div 
              layout
              key={acc.id}
              className="relative overflow-hidden rounded-[32px] glass-card p-6 shadow-md group hover:scale-[1.01] transition-all duration-500"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-500 border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
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
                      <TypeIcon size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white tracking-tight">{acc.name}</h3>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1 opacity-70">
                      {ACCOUNT_TYPES.find(t => t.type === acc.type)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => handleEdit(acc)}
                    className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors bg-zinc-800/50 rounded-lg hover:bg-emerald-500/10"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors bg-zinc-800/50 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-8 flex items-end justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Saldo Disponível</p>
                  <p className="text-2xl font-black tracking-tighter text-white group-hover:scale-[1.01] transition-transform duration-500 origin-left">{formatCurrency(acc.balance)}</p>
                </div>
                {acc.includeInTotal === false && (
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-amber-500 uppercase tracking-[0.1em] bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/10">
                    <EyeOff size={10} />
                    <span>Oculto</span>
                  </div>
                )}
              </div>
              {/* Decorative side bar */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                style={{ backgroundColor: acc.color }}
              />
              {/* Subtle Gradient */}
              <div className="absolute -right-20 -bottom-20 h-40 w-40 bg-white/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.div>
          );
        })}

        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-6 bg-zinc-900/30 rounded-[32px] border border-dashed border-zinc-800">
            <div className="h-16 w-16 rounded-[24px] bg-zinc-950 flex items-center justify-center text-zinc-800 border border-zinc-900 shadow-sm">
              <CreditCard size={32} />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black text-lg text-white tracking-tight">Nenhuma conta encontrada</p>
              <p className="text-xs max-w-[200px] text-zinc-500 font-medium leading-relaxed">Cadastre sua primeira conta para começar.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500 text-zinc-950 font-black px-6 py-3 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
            >
              <Plus size={16} />
              Cadastrar Conta
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 border-t sm:border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">{editingAccount ? 'Editar Conta' : 'Nova Conta'}</h2>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setEditingAccount(null);
                  setError(null);
                  setFormData({ name: '', balance: 0, type: 'checking', color: '#10b981', imageUrl: '', includeInTotal: true });
                }} className="p-2 text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-[32px] relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                        {formData.imageUrl ? (
                          <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + (formData.name || 'Bank');
                            }}
                          />
                        ) : (
                          <div className="text-emerald-500">
                            {React.createElement(ACCOUNT_TYPES.find(t => t.type === formData.type)?.icon || Banknote, { size: 32 })}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-white tracking-tight">{formData.name || 'Nome da Conta'}</p>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Prévia do Ícone</p>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          id="custom-logo" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <label 
                          htmlFor="custom-logo"
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest cursor-pointer hover:bg-zinc-800 hover:border-emerald-500/30 transition-all"
                        >
                          <Upload size={14} />
                          Fazer Upload
                        </label>
                        {formData.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-zinc-800 hover:border-red-500/30 transition-all"
                          >
                            <Trash2 size={14} />
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Background Glow */}
                    <div 
                      className="absolute inset-0 opacity-10 blur-[40px]"
                      style={{ backgroundColor: formData.color }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Instituições Populares</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {BANKS.map(bank => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          const isCustomImage = formData.imageUrl && !BANKS.some(b => b.logo === formData.imageUrl);
                          setFormData({ 
                            ...formData, 
                            name: bank.id !== 'other' ? bank.name : formData.name,
                            color: bank.color,
                            imageUrl: bank.id === 'other' ? (isCustomImage ? formData.imageUrl : '') : (bank.logo || '')
                          });
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2 group/btn",
                          (formData.imageUrl === bank.logo && bank.logo !== null) || (bank.id === 'other' && formData.imageUrl && !BANKS.some(b => b.logo === formData.imageUrl))
                            ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                            : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-800 group-hover/btn:scale-110 transition-transform">
                        {bank.logo ? (
                          <img 
                            src={bank.logo} 
                            alt={bank.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + bank.name;
                            }}
                          />
                        ) : (
                          bank.id === 'other' && formData.imageUrl && !BANKS.some(b => b.logo === formData.imageUrl) ? (
                            <img 
                              src={formData.imageUrl} 
                              alt="Custom" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + (formData.name || 'Bank');
                              }}
                            />
                          ) : (
                            <Banknote size={20} className="text-zinc-500" />
                          )
                        )}
                      </div>
                        <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-500 truncate w-full text-center">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cor Personalizada</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 transition-all",
                          formData.color === c ? "border-white scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome da Conta</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-sm focus:border-emerald-500 outline-none"
                    placeholder="Ex: Nubank, Carteira..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Saldo Inicial</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.balance ?? ''}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-4 text-xl font-black focus:border-emerald-500 outline-none"
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo de Conta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNT_TYPES.map(t => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t.type })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-sm transition-all",
                          formData.type === t.type 
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
                        )}
                      >
                        <t.icon size={18} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      formData.includeInTotal ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {formData.includeInTotal ? <Eye size={20} /> : <EyeOff size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">Somar no Total</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Dashboard e Resumos</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, includeInTotal: !formData.includeInTotal })}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      formData.includeInTotal ? "bg-emerald-500" : "bg-zinc-800"
                    )}
                  >
                    <motion.div 
                      animate={{ x: formData.includeInTotal ? 24 : 4 }}
                      className="absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving || !formData.name}
                  className="w-full bg-emerald-500 text-zinc-950 font-black py-5 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'SALVANDO...' : (editingAccount ? 'SALVAR ALTERAÇÕES' : 'CRIAR CONTA')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir esta conta? Todas as transações vinculadas a ela serão mantidas, mas a conta deixará de existir."
      />
    </motion.div>
  );
}
