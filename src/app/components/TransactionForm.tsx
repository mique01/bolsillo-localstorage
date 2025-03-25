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
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
  initialValues?: Transaction | null;
};

export default function TransactionForm({ onSubmit, onCancel, initialValues }: TransactionFormProps) {
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
    if (initialValues) {
      setDescription(initialValues.description);
      setAmount(initialValues.amount.toString());
      setDate(initialValues.date);
      setType(initialValues.type);
      setSelectedCategory(initialValues.category);
      setSelectedPaymentMethod(initialValues.paymentMethod || '');
      setSelectedPerson(initialValues.person || '');
    }
  }, [initialValues]);

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
      
      // Solo resetear la categoría si es un cambio de tipo y no estamos editando
      if (!initialValues) {
        setSelectedCategory('');
      }
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
      
      // Solo resetear el método de pago si no estamos editando
      if (!initialValues) {
        setSelectedPaymentMethod('');
      }
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
      // Si estamos editando, actualizamos la transacción existente
      if (initialValues) {
        const updatedTransaction: Transaction = {
          ...initialValues,
          description,
          amount: parseFloat(amount),
          date,
          category: selectedCategory,
          type,
          paymentMethod: type === 'expense' ? selectedPaymentMethod : null,
          person: (type === 'expense' && settings?.liveWithOthers && selectedPerson) ? selectedPerson : null
        };
        
        onSubmit(updatedTransaction);
        setSuccess('Transacción actualizada correctamente');
      } else {
        // Crear nueva transacción
        const newTransaction: Omit<Transaction, 'id' | 'userId'> = {
          description,
          amount: parseFloat(amount),
          date,
          category: selectedCategory,
          type,
          paymentMethod: type === 'expense' ? selectedPaymentMethod : null,
          person: (type === 'expense' && settings?.liveWithOthers && selectedPerson) ? selectedPerson : null
        };
        
        // Enviar al componente padre
        onSubmit(newTransaction as Transaction);
        setSuccess('Transacción guardada correctamente');
      }
      
      setTimeout(() => {
        setSuccess('');
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
    <div className="relative">
      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2 bg-accent-red/10 border border-accent-red/20 text-accent-red">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg flex items-start gap-2 bg-accent-green/10 border border-accent-green/20 text-accent-green">
          <Check size={18} className="mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de transacción */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${
              type === 'income'
                ? 'bg-green-100/10 border-green-500/40 text-green-400'
                : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${
              type === 'expense'
                ? 'bg-red-100/10 border-red-500/40 text-red-400'
                : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Gasto
          </button>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Descripción
          </label>
          <input
            type="text"
            id="description"
            placeholder="Descripción de la transacción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Monto */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Monto
          </label>
          <input
            type="number"
            id="amount"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Fecha */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Categoría */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="category" className="block text-sm font-medium">
              Categoría
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryForm(true)}
              className="text-xs text-primary flex items-center"
            >
              <PlusCircle size={14} className="mr-1" />
              Nueva Categoría
            </button>
          </div>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="Bolsillo App-select"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Método de pago (solo para gastos) */}
        {type === 'expense' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="paymentMethod" className="block text-sm font-medium">
                Método de Pago
              </label>
              <button
                type="button"
                onClick={() => setShowPaymentMethodForm(true)}
                className="text-xs text-primary flex items-center"
              >
                <PlusCircle size={14} className="mr-1" />
                Nuevo Método
              </button>
            </div>
            <select
              id="paymentMethod"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="Bolsillo App-select"
              required
            >
              <option value="">Selecciona un método de pago</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selección de persona (solo para gastos y si vive con otras personas) */}
        {type === 'expense' && settings?.liveWithOthers && people.length > 0 && (
          <div>
            <label htmlFor="person" className="block text-sm font-medium mb-1">
              Pagado por
            </label>
            <div className="flex items-center">
              <select
                id="person"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="Bolsillo App-select"
              >
                <option value="">Sin asignar</option>
                {people.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
              <div className="ml-2">
                <User size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : initialValues ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>

      {/* Modal de categorías */}
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

      {/* Modal de métodos de pago */}
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
    </div>
  );
} 