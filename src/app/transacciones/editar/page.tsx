'use client';

import React, { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../../lib/hooks/useAuth';

function EditarTransaccionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('id');
  const { user } = useAuth();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transactionId) {
      // Load transaction from localStorage
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const transaction = transactions.find((t: any) => t.id === transactionId);
      
      if (transaction) {
        setDescription(transaction.description);
        setAmount(transaction.amount.toString());
        setCategory(transaction.category);
        setType(transaction.type);
      }
    }
  }, [transactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get all transactions
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      // Update the specific transaction
      const updatedTransactions = transactions.map((t: any) => {
        if (t.id === transactionId) {
          return {
            ...t,
            description,
            amount: parseFloat(amount),
            category,
            type,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });

      // Save back to localStorage
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      router.push('/transacciones');
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Editar Transacción</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
              Descripción
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
              Monto
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">
              Categoría
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 text-white shadow-sm px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Tipo
            </label>
            <div className="mt-1 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={type === 'income'}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                  className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4 bg-gray-700 border-gray-600"
                />
                <span className="ml-2 text-gray-300">Ingreso</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                  className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4 bg-gray-700 border-gray-600"
                />
                <span className="ml-2 text-gray-300">Gasto</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Guardando...' : 'Actualizar Transacción'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EditarTransaccion() {
  return (
    <Suspense fallback={<div className="p-6 flex justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>}>
      <EditarTransaccionContent />
    </Suspense>
  );
} 