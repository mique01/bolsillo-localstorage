'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter, CalendarRange, Edit, Check, AlertCircle, Receipt, X, User, Image, FileText, File } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import CategoryForm from '../components/CategoryForm';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import { formatCurrency } from '../../lib/utils';
import Link from 'next/link';

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

type FilterOptions = {
  type: 'all' | 'income' | 'expense';
  dateRange: 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';
  startDate: string;
  endDate: string;
  searchTerm: string;
  category: string;
};

type Receipt = {
  id: string;
  userId: string;
  name: string;
  url: string;
  date: string;
};

// Definimos la interfaz para comprobantes en lugar de la anterior
interface Comprobante {
  id: string;
  userId: string;
  filename: string;
  fileType: string;
  fileUrl?: string;
  fileData?: string;
  folderId: string | null;
  description?: string;
  date: string;
  createdAt: string;
}

export default function TransaccionesPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [selectedComprobanteId, setSelectedComprobanteId] = useState<string | null>(null);
  const [showComprobanteSelector, setShowComprobanteSelector] = useState(false);
  const [comprobanteTransactionId, setComprobanteTransactionId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    searchTerm: '',
    category: '',
  });

  // Cargar transacciones y categorías
  useEffect(() => {
    if (!user) return;
    
    loadData();
  }, [user]);

  const loadData = () => {
    // Cargar transacciones
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      const allTransactions = JSON.parse(storedTransactions);
      // Filtrar transacciones del usuario actual
      const userTransactions = allTransactions.filter(
        (t: Transaction) => t.userId === user?.id
      );
      setTransactions(userTransactions);
      setFilteredTransactions(userTransactions);
    }

    // Cargar categorías
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      const allCategories = JSON.parse(storedCategories);
      // Extraer sólo los nombres de las categorías del usuario actual
      const userCategoryNames = allCategories
        .filter((cat: { userId: string }) => cat.userId === user?.id)
        .map((cat: { name: string }) => cat.name);
      setCategories(userCategoryNames);
    }
    
    // Cargar comprobantes
    const storedComprobantes = localStorage.getItem('comprobantes');
    if (storedComprobantes) {
      const allComprobantes = JSON.parse(storedComprobantes);
      const userComprobantes = allComprobantes.filter(
        (c: Comprobante) => c.userId === user?.id
      );
      setComprobantes(userComprobantes);
    }
  };

  // Manejar eliminación de transacción
  const handleDeleteTransaction = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        // Obtener transacciones existentes
        const storedTransactions = localStorage.getItem('transactions');
        if (!storedTransactions) return;
        
        const allTransactions = JSON.parse(storedTransactions);
        
        // Filtrar la transacción a eliminar
        const updatedTransactions = allTransactions.filter((t: Transaction) => t.id !== id);
        
        // Guardar en localStorage
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        // Actualizar estado
        setTransactions(updatedTransactions.filter((t: Transaction) => t.userId === user?.id));
        applyFilters(updatedTransactions.filter((t: Transaction) => t.userId === user?.id));
        
        setSuccess('Transacción eliminada correctamente');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Error al eliminar la transacción');
        setTimeout(() => setError(''), 3000);
      }
    }
  };
  
  // Iniciar edición de transacción
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };
  
  // Mostrar selector de comprobantes
  const handleShowComprobanteSelector = (transactionId: string) => {
    setComprobanteTransactionId(transactionId);
    setShowComprobanteSelector(true);
    // Encontrar el comprobante actual de la transacción, si existe
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction && transaction.receiptId) {
      setSelectedComprobanteId(transaction.receiptId);
    } else {
      setSelectedComprobanteId(null);
    }
  };
  
  // Asignar comprobante a transacción
  const handleAssignComprobante = () => {
    if (!comprobanteTransactionId) return;
    
    try {
      // Obtener transacciones existentes
      const storedTransactions = localStorage.getItem('transactions');
      if (!storedTransactions) return;
      
      const allTransactions = JSON.parse(storedTransactions);
      
      // Actualizar la transacción con el comprobante seleccionado
      const updatedTransactions = allTransactions.map((t: Transaction) => {
        if (t.id === comprobanteTransactionId) {
          return { ...t, receiptId: selectedComprobanteId };
        }
        return t;
      });
      
      // Guardar en localStorage
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      
      // Actualizar estado
      setTransactions(updatedTransactions.filter((t: Transaction) => t.userId === user?.id));
      applyFilters(updatedTransactions.filter((t: Transaction) => t.userId === user?.id));
      
      setSuccess('Comprobante asignado correctamente');
      setTimeout(() => setSuccess(''), 3000);
      setShowComprobanteSelector(false);
      setComprobanteTransactionId(null);
    } catch (err) {
      setError('Error al asignar el comprobante');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Aplicar filtros a transacciones
  const applyFilters = (transactionsToFilter = transactions) => {
    let filtered = [...transactionsToFilter];
    
    // Filtrar por tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filters.type);
    }
    
    // Filtrar por categoría
    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category);
    }
    
    // Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrar por rango de fechas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (filters.dateRange === 'today') {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= today;
      });
    } else if (filters.dateRange === 'thisWeek') {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfWeek;
      });
    } else if (filters.dateRange === 'thisMonth') {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth;
      });
    } else if (filters.dateRange === 'custom' && filters.startDate) {
      const startDate = new Date(filters.startDate);
      let endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      
      if (filters.endDate) {
        endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
      }
      
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    
    setFilteredTransactions(filtered);
  };

  // Manejar cambios en filtros
  const handleFilterChange = (name: keyof FilterOptions, value: string) => {
    const updatedFilters = { ...filters, [name]: value };
    
    if (name === 'dateRange' && value !== 'custom') {
      updatedFilters.startDate = '';
      updatedFilters.endDate = '';
    }
    
    setFilters(updatedFilters);
    setTimeout(() => applyFilters(), 0);
  };

  // Ordenar transacciones por fecha (más recientes primero)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Obtener información del comprobante
  const getReceiptInfo = (receiptId: string | null | undefined) => {
    if (!receiptId) return null;
    return comprobantes.find(c => c.id === receiptId);
  };

  // Renderizar el comprobante asociado
  const renderComprobante = (transaction: Transaction) => {
    if (!transaction.receiptId) return null;
    
    const comprobante = comprobantes.find(c => c.id === transaction.receiptId);
    if (!comprobante) return null;
    
    // Determinar qué icono mostrar según el tipo de archivo
    const isImage = comprobante.fileType.includes('image');
    
    return (
      <div className="flex items-center mt-1 text-blue-400 text-xs">
        <Receipt size={12} className="mr-1" />
        <span className="truncate max-w-[200px]" title={comprobante.filename}>
          {comprobante.filename}
        </span>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Transacciones</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Categorías
            </button>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={18} />
              Nueva Transacción
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-4 bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg flex items-center">
            <Check size={20} className="mr-2" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {/* Formulario de transacción (condicional) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <TransactionForm
                onClose={() => {
                  setShowForm(false);
                  setEditingTransaction(null);
                }}
                onTransactionAdded={() => {
                  loadData();
                  setShowForm(false);
                  setEditingTransaction(null);
                }}
                editTransaction={editingTransaction}
              />
            </div>
          </div>
        )}

        {/* Formulario de categorías (condicional) */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <CategoryForm onClose={() => setShowCategoryForm(false)} />
            </div>
          </div>
        )}
        
        {/* Filtros */}
        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-white">Filtros</h2>
            <button
              onClick={() => setFilterVisible(!filterVisible)}
              className="text-gray-400 hover:text-white"
            >
              {filterVisible ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {filterVisible && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todo</option>
                    <option value="today">Hoy</option>
                    <option value="thisWeek">Esta semana</option>
                    <option value="thisMonth">Este mes</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>

              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por descripción o categoría..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilters({
                      type: 'all',
                      dateRange: 'all',
                      startDate: '',
                      endDate: '',
                      searchTerm: '',
                      category: '',
                    });
                    setFilteredTransactions(transactions);
                  }}
                  className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de transacciones */}
        <div className="space-y-4">
          {sortedTransactions.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-gray-700">
              <p className="text-gray-400 mb-4">
                No hay transacciones registradas{filters.type !== 'all' || filters.category || filters.searchTerm || filters.dateRange !== 'all'
                  ? ' con los filtros aplicados'
                  : ''}.
              </p>
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={18} />
                <span>Agregar Transacción</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 border-b border-gray-700">
                    <th className="px-4 py-2 text-left text-gray-300 font-medium">Fecha</th>
                    <th className="px-4 py-2 text-left text-gray-300 font-medium">Descripción</th>
                    <th className="px-4 py-2 text-left text-gray-300 font-medium">Categoría</th>
                    <th className="px-4 py-2 text-left text-gray-300 font-medium">Método</th>
                    <th className="px-4 py-2 text-right text-gray-300 font-medium">Monto</th>
                    <th className="px-4 py-2 text-center text-gray-300 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedTransactions.map((transaction) => {
                    const receipt = getReceiptInfo(transaction.receiptId);
                    
                    return (
                      <tr key={transaction.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-300">{formatDate(transaction.date)}</td>
                        <td className="px-4 py-3 text-white">
                          <div className="flex items-start gap-2">
                            <span>{transaction.description}</span>
                            {receipt && (
                              <div className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded flex items-center">
                                <Receipt size={12} className="mr-1" />
                                {receipt.filename}
                              </div>
                            )}
                          </div>
                          {transaction.person && (
                            <div className="text-gray-400 text-xs mt-1">
                              Pagado por: {transaction.person}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{transaction.category}</td>
                        <td className="px-4 py-3 text-gray-300">{transaction.paymentMethod || '-'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleShowComprobanteSelector(transaction.id)}
                              className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-blue-400"
                              title="Asignar comprobante"
                            >
                              <Receipt size={16} />
                            </button>
                            <button
                              onClick={() => handleEditTransaction(transaction)}
                              className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-yellow-400"
                              title="Editar transacción"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-red-400"
                              title="Eliminar transacción"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de selección de comprobante */}
        {showComprobanteSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Asignar comprobante</h3>
                <button
                  onClick={() => setShowComprobanteSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              
              {comprobantes.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p>No hay comprobantes disponibles.</p>
                  <Link 
                    href="/comprobantes/nuevo" 
                    className="mt-3 inline-flex items-center text-blue-400 hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" />
                    Crear nuevo comprobante
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
                    <div
                      key="none"
                      onClick={() => setSelectedComprobanteId(null)}
                      className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                        selectedComprobanteId === null
                          ? 'bg-blue-900/20 border-blue-500'
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                      }`}
                    >
                      <div className="ml-3">
                        <p className="text-white">Sin comprobante</p>
                      </div>
                    </div>
                    
                    {comprobantes.map((comprobante) => (
                      <div
                        key={comprobante.id}
                        onClick={() => setSelectedComprobanteId(comprobante.id)}
                        className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                          selectedComprobanteId === comprobante.id
                            ? 'bg-blue-900/20 border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        }`}
                      >
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-600 rounded flex items-center justify-center">
                          {comprobante.fileType.includes('image') ? (
                            <Image size={20} className="text-blue-400" />
                          ) : comprobante.fileType.includes('pdf') ? (
                            <FileText size={20} className="text-red-400" />
                          ) : (
                            <File size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3 flex-1 truncate">
                          <p className="text-white truncate">{comprobante.filename}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(comprobante.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowComprobanteSelector(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAssignComprobante}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 