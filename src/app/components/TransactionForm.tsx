'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, X, Check, AlertCircle, Settings, User } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import CategoryForm from './CategoryForm';
import PaymentMethodsForm from './PaymentMethodsForm';

// Definir tipos
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

type Category = {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
};

type PaymentMethod = {
  id: string;
  userId: string;
  name: string;
};

type Settings = {
  userId: string;
  liveWithOthers: boolean;
  darkMode: boolean;
  currency: string;
  people?: string[];
};

type TransactionFormProps = {
  onClose: () => void;
  onTransactionAdded: () => void;
  editTransaction?: Transaction | null;
};

export default function TransactionForm({ onClose, onTransactionAdded, editTransaction }: TransactionFormProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar los datos de la transacción si estamos editando
  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setDate(editTransaction.date);
      setType(editTransaction.type);
      setSelectedCategory(editTransaction.category);
      setSelectedPaymentMethod(editTransaction.paymentMethod || '');
      setSelectedPerson(editTransaction.person || '');
    }
  }, [editTransaction]);

  useEffect(() => {
    if (!user) return;
    
    // Cargar configuración
    const configKey = `config_${user.id}`;
    const savedSettings = localStorage.getItem(configKey);
    if (savedSettings) {
      try {
        const userSettings = JSON.parse(savedSettings);
        setSettings(userSettings);
        if (userSettings.people && userSettings.people.length > 0 && userSettings.liveWithOthers) {
          setPeople(userSettings.people);
        }
      } catch (error) {
        console.error("Error parsing settings:", error);
      }
    }
    
    loadData();
  }, [user, type]);

  const loadData = () => {
    // Cargar categorías
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories && user) {
      const allCategories = JSON.parse(storedCategories);
      // Filtrar categorías del tipo seleccionado y del usuario actual
      const userCategories = allCategories.filter(
        (cat: Category) => cat.userId === user.id && cat.type === type
      );
      setCategories(userCategories);
      // Resetear la categoría seleccionada cuando cambia el tipo
      setSelectedCategory('');
    }
    
    // Cargar métodos de pago
    const storedPaymentMethods = localStorage.getItem('paymentMethods');
    if (storedPaymentMethods && user) {
      const allPaymentMethods = JSON.parse(storedPaymentMethods);
      // Filtrar métodos de pago del usuario actual
      const userPaymentMethods = allPaymentMethods.filter(
        (method: PaymentMethod) => method.userId === user.id
      );
      setPaymentMethods(userPaymentMethods);
      setSelectedPaymentMethod('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para registrar transacciones');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validaciones
    if (!description || !amount || !date || !selectedCategory) {
      setError('Por favor completa todos los campos obligatorios');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (type === 'expense' && !selectedPaymentMethod) {
      setError('Selecciona un método de pago');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSaving(true);

    try {
      // Obtener transacciones existentes
      const storedTransactions = localStorage.getItem('transactions');
      const existingTransactions = storedTransactions ? JSON.parse(storedTransactions) : [];
      
      // Si estamos editando, actualizamos la transacción existente
      if (editTransaction) {
        const updatedTransactions = existingTransactions.map((t: Transaction) => {
          if (t.id === editTransaction.id) {
            return {
              ...t,
              description,
              amount: parseFloat(amount),
              date,
              category: selectedCategory,
              type,
              paymentMethod: type === 'expense' ? selectedPaymentMethod : null,
              person: (type === 'expense' && settings?.liveWithOthers && selectedPerson) ? selectedPerson : null
            };
          }
          return t;
        });
        
        // Guardar en localStorage
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        setSuccess('Transacción actualizada correctamente');
      } else {
        // Crear nueva transacción
        const newTransaction = {
          id: Date.now().toString(),
          userId: user.id,
          description,
          amount: parseFloat(amount),
          date,
          category: selectedCategory,
          type,
          paymentMethod: type === 'expense' ? selectedPaymentMethod : null,
          person: (type === 'expense' && settings?.liveWithOthers && selectedPerson) ? selectedPerson : null
        };
        
        // Agregar nueva transacción
        const updatedTransactions = [...existingTransactions, newTransaction];
        
        // Guardar en localStorage
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        setSuccess('Transacción guardada correctamente');
      }
      
      setTimeout(() => {
        setSuccess('');
        // Resetear formulario
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setType('expense');
        setSelectedCategory('');
        setSelectedPaymentMethod('');
        setSelectedPerson('');
        // Notificar al componente padre
        onTransactionAdded();
        // Cerrar formulario
        onClose();
      }, 1500);
    } catch (err) {
      setError('Error al guardar la transacción');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryAdded = () => {
    setShowCategoryForm(false);
    loadData();
  };

  const handlePaymentMethodAdded = () => {
    setShowPaymentMethodForm(false);
    loadData();
  };

  return (
    <div className="relative bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-white">
          {editTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-start gap-2">
          <Check size={18} className="mt-0.5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Formulario de categorías (condicional) */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <CategoryForm 
              onClose={() => setShowCategoryForm(false)} 
              onCategoryAdded={handleCategoryAdded}
              initialType={type}
            />
          </div>
        </div>
      )}

      {/* Formulario de métodos de pago (condicional) */}
      {showPaymentMethodForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <PaymentMethodsForm 
              onClose={() => setShowPaymentMethodForm(false)} 
              onPaymentMethodAdded={handlePaymentMethodAdded}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
            Tipo
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`py-2 px-4 rounded-md flex justify-center items-center ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setType('expense')}
            >
              Gasto
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md flex justify-center items-center ${
                type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setType('income')}
            >
              Ingreso
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Descripción
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. Compra en supermercado"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
            Monto
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">
              {type === 'expense' ? 'Categoría de Gasto' : 'Categoría de Ingreso'}
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryForm(true)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Settings size={12} />
              Gestionar
            </button>
          </div>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {type === 'expense' && (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300">
                  Método de Pago
                </label>
                <button
                  type="button"
                  onClick={() => setShowPaymentMethodForm(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Settings size={12} />
                  Gestionar
                </button>
              </div>
              <select
                id="paymentMethod"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un método de pago</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {settings?.liveWithOthers && people.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="person" className="block text-sm font-medium text-gray-300">
                    Persona que Realizó el Gasto
                  </label>
                </div>
                <select
                  id="person"
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona una persona</option>
                  {people.map((person, index) => (
                    <option key={index} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {isSaving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <PlusCircle size={18} />
                <span>Guardar {type === 'expense' ? 'Gasto' : 'Ingreso'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 