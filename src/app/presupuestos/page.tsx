'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash, Filter, ArrowRight, Calendar, PieChart, Save, X, Trash2, AlertCircle, Check 
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import { formatCurrency } from '../../lib/utils';

type Budget = {
  id: string;
  userId: string;
  category: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
};

type Transaction = {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
};

export default function PresupuestosPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  
  // Cargar presupuestos, transacciones y categorías
  useEffect(() => {
    if (!user) return;
    
    // Cargar categorías
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      const allCategories = JSON.parse(storedCategories);
      // Filtrar categorías de gastos de este usuario
      setCategories(allCategories.filter((c: Category) => 
        c.userId === user.id && c.type === 'expense'
      ));
    }
    
    // Cargar presupuestos
    const storedBudgets = localStorage.getItem('budgets');
    if (storedBudgets) {
      const allBudgets = JSON.parse(storedBudgets);
      setBudgets(allBudgets.filter((b: Budget) => b.userId === user.id));
    }
    
    // Cargar transacciones
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      const allTransactions = JSON.parse(storedTransactions);
      setTransactions(allTransactions.filter((t: Transaction) => 
        t.userId === user.id && t.type === 'expense'
      ));
    }
  }, [user]);

  // Calcular gastos totales por categoría
  const getSpentByCategory = (categoryName: string) => {
    return transactions
      .filter(t => t.category === categoryName)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Función para añadir/editar presupuesto
  const handleSaveBudget = () => {
    if (!user) return;
    if (!selectedCategory || !budgetAmount || isNaN(parseFloat(budgetAmount))) {
      setError('Por favor, selecciona una categoría y establece un monto válido');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Verificar si ya existe un presupuesto para esta categoría (si no estamos editando)
    if (!editingBudgetId && budgets.some(b => b.category === selectedCategory)) {
      setError('Ya existe un presupuesto para esta categoría');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const now = new Date().toISOString();
    
    if (editingBudgetId) {
      // Actualizar presupuesto existente
      const updatedBudgets = budgets.map(budget => 
        budget.id === editingBudgetId 
          ? {
              ...budget,
              amount: parseFloat(budgetAmount),
              updatedAt: now
            } 
          : budget
      );
      
      setBudgets(updatedBudgets);
      saveBudgets(updatedBudgets);
      setSuccess('Presupuesto actualizado correctamente');
    } else {
      // Crear nuevo presupuesto
      const newBudget: Budget = {
        id: Date.now().toString(),
        userId: user.id,
        category: selectedCategory,
        amount: parseFloat(budgetAmount),
        createdAt: now,
        updatedAt: now
      };
      
      const updatedBudgets = [...budgets, newBudget];
      setBudgets(updatedBudgets);
      saveBudgets(updatedBudgets);
      setSuccess('Presupuesto creado correctamente');
    }
    
    setTimeout(() => setSuccess(''), 3000);
    resetForm();
  };

  // Guardar presupuestos en localStorage
  const saveBudgets = (budgetsData: Budget[]) => {
    // Leer todos los presupuestos existentes
    const storedBudgets = localStorage.getItem('budgets');
    let allBudgets = storedBudgets ? JSON.parse(storedBudgets) : [];
    
    // Filtrar los presupuestos que no son de este usuario
    allBudgets = allBudgets.filter((b: Budget) => b.userId !== user?.id);
    
    // Agregar los presupuestos del usuario actual
    allBudgets = [...allBudgets, ...budgetsData];
    
    // Guardar todo
    localStorage.setItem('budgets', JSON.stringify(allBudgets));
  };

  // Resetear formulario
  const resetForm = () => {
    setSelectedCategory('');
    setBudgetAmount('');
    setEditingBudgetId(null);
    setShowForm(false);
  };

  // Función para editar presupuesto
  const handleEditBudget = (budget: Budget) => {
    setSelectedCategory(budget.category);
    setBudgetAmount(budget.amount.toString());
    setEditingBudgetId(budget.id);
    setShowForm(true);
  };

  // Función para eliminar presupuesto
  const handleDeleteBudget = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
      const updatedBudgets = budgets.filter(b => b.id !== id);
      setBudgets(updatedBudgets);
      saveBudgets(updatedBudgets);
      setSuccess('Presupuesto eliminado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Presupuestos</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={18} />
              <span>Nuevo Presupuesto</span>
            </button>
          )}
        </div>

        {success && (
          <div className="bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-start gap-2">
            <Check size={18} className="mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Formulario para agregar/editar presupuesto */}
        {showForm && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white">
                {editingBudgetId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Categoría de Gasto
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!!editingBudgetId}
                  className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Monto del Presupuesto
                </label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveBudget}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Save size={18} />
                  <span>{editingBudgetId ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de presupuestos */}
        <div className="grid gap-4 mb-8">
          {budgets.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-700">
              <p className="text-gray-400">
                No hay presupuestos definidos. Crea uno para comenzar a gestionar tus gastos.
              </p>
            </div>
          ) : (
            budgets.map((budget) => {
              const spent = getSpentByCategory(budget.category);
              const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              const isOverBudget = percentage > 100;
              
              return (
                <div key={budget.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white">{budget.category}</h3>
                      <div className="text-sm text-gray-400">
                        Presupuesto: {formatCurrency(budget.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-blue-400"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-1 flex justify-between items-center text-sm">
                    <span className="text-gray-300">
                      Gastado: {formatCurrency(spent)}
                    </span>
                    <span className={isOverBudget ? 'text-red-400' : 'text-green-400'}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isOverBudget 
                          ? 'bg-gradient-to-r from-red-500 to-red-400' 
                          : percentage > 70 
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                            : 'bg-gradient-to-r from-green-500 to-green-400'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 