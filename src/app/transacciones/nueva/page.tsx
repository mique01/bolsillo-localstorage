'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function NuevaTransaccionPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newTransaction = {
        id: Date.now().toString(),
        description,
        amount: parseFloat(amount),
        category,
        type,
        date: new Date().toISOString(),
        userId: user?.id
      };

      // Get existing transactions
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      // Add new transaction
      localStorage.setItem('transactions', JSON.stringify([...existingTransactions, newTransaction]));

      router.push('/transacciones');
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Nueva Transacción</h2>
        
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
            {isLoading ? 'Guardando...' : 'Crear Transacción'}
          </button>
        </form>
      </div>
    </div>
  );
} 