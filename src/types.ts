export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'paid' | 'pending';
export type AccountType = 'wallet' | 'checking' | 'savings' | 'other';

export interface Account {
  id: string;
  name: string;
  balance: number;
  initialBalance: number;
  type: AccountType;
  color: string;
  icon: string;
  imageUrl?: string;
  uid: string;
  includeInTotal: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parentId?: string;
  uid: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  date: string;
  description: string;
  paymentMethod: string;
  status: TransactionStatus;
  uid: string;
  installments?: number;
  installmentIndex?: number;
  parentId?: string;
  isRecurring?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline?: string;
  uid: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  currency: string;
}
