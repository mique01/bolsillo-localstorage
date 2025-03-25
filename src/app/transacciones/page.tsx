'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { PlusCircle, Trash, PencilIcon, ReceiptText, ArrowDownCircle, ArrowUpCircle, Calendar, Filter, Search } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import { formatCurrency } from '../../lib/utils';

type Transaction = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  paymentMethod?: string | null;
  person?: string | null;
  receiptId?: string | null;
};

type FilterOption = {
  label: string;
  value: 'all' | 'income' | 'expense';
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'all' | 'thisMonth' | 'lastMonth'>('thisMonth');

  const filterOptions: FilterOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expenses', value: 'expense' },
  ];

  const periodOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = () => {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      try {
        const parsedTransactions = JSON.parse(storedTransactions);
        // Filtramos para mostrar solo las transacciones del usuario actual
        const userTransactions = parsedTransactions.filter(
          (t: Transaction) => t.userId === user?.id
        );
        setTransactions(userTransactions);
      } catch (error) {
        console.error('Error parsing transactions:', error);
        setTransactions([]);
      }
    }
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'userId'>) => {
    const transaction = {
      ...newTransaction,
      id: nanoid(),
      userId: user?.id || '',
    };

    const storedTransactions = localStorage.getItem('transactions');
    let allTransactions = [];

    if (storedTransactions) {
      allTransactions = JSON.parse(storedTransactions);
    }

    allTransactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(allTransactions));
    setShowForm(false);
    loadTransactions();
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    const storedTransactions = localStorage.getItem('transactions');
    
    if (storedTransactions) {
      let allTransactions = JSON.parse(storedTransactions);
      const index = allTransactions.findIndex((t: Transaction) => t.id === updatedTransaction.id);
      
      if (index !== -1) {
        allTransactions[index] = updatedTransaction;
        localStorage.setItem('transactions', JSON.stringify(allTransactions));
        setEditingTransaction(null);
        setShowForm(false);
        loadTransactions();
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      return;
    }

    const storedTransactions = localStorage.getItem('transactions');
    
    if (storedTransactions) {
      let allTransactions = JSON.parse(storedTransactions);
      allTransactions = allTransactions.filter((t: Transaction) => t.id !== id);
      localStorage.setItem('transactions', JSON.stringify(allTransactions));
      loadTransactions();
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleCreateReceipt = (transactionId: string) => {
    router.push(`/comprobantes/nuevo?transactionId=${transactionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit' 
    });
  };

  // Filtrar transacciones por tipo (ingresos, gastos o todos)
  const filterTransactionsByType = (transactions: Transaction[]) => {
    if (filterType === 'all') return transactions;
    return transactions.filter(t => t.type === filterType);
  };

  // Filtrar transacciones por búsqueda (descripción o categoría)
  const filterTransactionsBySearch = (transactions: Transaction[]) => {
    if (!searchQuery) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(
      t => 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query)
    );
  };

  // Filtrar transacciones por período
  const filterTransactionsByPeriod = (transactions: Transaction[]) => {
    if (period === 'all') return transactions;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      
      if (period === 'thisMonth') {
        return transactionMonth === currentMonth && transactionYear === currentYear;
      } else if (period === 'lastMonth') {
        // Para el mes anterior, si el mes actual es enero, necesitamos ir al año anterior
        if (currentMonth === 0) {
          return transactionMonth === 11 && transactionYear === currentYear - 1;
        } else {
          return transactionMonth === currentMonth - 1 && transactionYear === currentYear;
        }
      }
      
      return true;
    });
  };

  // Aplicar todos los filtros en secuencia
  const filteredTransactions = filterTransactionsByPeriod(
    filterTransactionsBySearch(
      filterTransactionsByType(transactions)
    )
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <button 
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors"
          >
            <PlusCircle size={16} className="mr-2" />
            Add Transaction
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
            <h2 className="text-lg font-medium mb-4">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <TransactionForm 
              onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
              onCancel={() => {
                setEditingTransaction(null);
                setShowForm(false);
              }}
              initialValues={editingTransaction}
            />
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="rounded-md bg-gray-700 border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'all' | 'thisMonth' | 'lastMonth')}
                  className="rounded-md bg-gray-700 border border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="pb-3 text-left">Description</th>
                  <th className="pb-3 text-left">Category</th>
                  <th className="pb-3 text-left">Date</th>
                  <th className="pb-3 text-left">Method</th>
                  <th className="pb-3 text-left">Person</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-700">
                      <td className="py-3 truncate-text max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-800' : 'bg-red-800'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowDownCircle size={14} className="text-green-400" />
                            ) : (
                              <ArrowUpCircle size={14} className="text-red-400" />
                            )}
                          </span>
                          {transaction.description}
                        </div>
                      </td>
                      <td className="py-3">{transaction.category}</td>
                      <td className="py-3">{formatDate(transaction.date)}</td>
                      <td className="py-3">{transaction.paymentMethod || '-'}</td>
                      <td className="py-3">{transaction.person || '-'}</td>
                      <td className={`py-3 text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditTransaction(transaction)}
                            className="p-1.5 rounded-full hover:bg-gray-700"
                            title="Edit"
                          >
                            <PencilIcon size={14} />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-1.5 rounded-full hover:bg-gray-700 text-red-400"
                            title="Delete"
                          >
                            <Trash size={14} />
                          </button>
                          
                          {transaction.type === 'expense' && !transaction.receiptId && (
                            <button 
                              onClick={() => handleCreateReceipt(transaction.id)}
                              className="p-1.5 rounded-full hover:bg-gray-700"
                              title="Generate Receipt"
                            >
                              <ReceiptText size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 