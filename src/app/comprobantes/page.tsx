'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Trash, Eye, ArrowUpToLine, Calendar, Search, Filter, FileText, ImageIcon, File } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

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

type FilterOptions = {
  searchTerm: string;
  dateRange: 'all' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string;
  endDate: string;
  fileType: 'all' | 'image' | 'pdf' | 'other';
};

export default function ComprobantesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [filteredComprobantes, setFilteredComprobantes] = useState<Comprobante[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    fileType: 'all',
  });

  const fileTypeOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Imágenes', value: 'image' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Otros', value: 'other' },
  ];

  const periodOptions = [
    { label: 'Todo', value: 'all' },
    { label: 'Este Mes', value: 'thisMonth' },
    { label: 'Mes Anterior', value: 'lastMonth' },
    { label: 'Personalizado', value: 'custom' },
  ];

  useEffect(() => {
    if (user) {
      loadComprobantes();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, comprobantes]);

  const loadComprobantes = () => {
    const storedComprobantes = localStorage.getItem('comprobantes');
    if (storedComprobantes && user) {
      try {
        const allComprobantes = JSON.parse(storedComprobantes);
        // Filtrar comprobantes del usuario actual
        const userComprobantes = allComprobantes.filter(
          (c: Comprobante) => c.userId === user.id
        );
        setComprobantes(userComprobantes);
        setFilteredComprobantes(userComprobantes);
      } catch (error) {
        console.error('Error parsing comprobantes:', error);
        setComprobantes([]);
        setFilteredComprobantes([]);
      }
    }
  };

  const handleDeleteComprobante = (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comprobante?')) {
      return;
    }

    const storedComprobantes = localStorage.getItem('comprobantes');
    if (storedComprobantes) {
      try {
        // Actualizar comprobantes
        const allComprobantes = JSON.parse(storedComprobantes);
        const updatedComprobantes = allComprobantes.filter((c: Comprobante) => c.id !== id);
        localStorage.setItem('comprobantes', JSON.stringify(updatedComprobantes));
        
        // Actualizar transacciones que usan este comprobante
        const storedTransactions = localStorage.getItem('transactions');
        if (storedTransactions) {
          const allTransactions = JSON.parse(storedTransactions);
          const updatedTransactions = allTransactions.map((t: any) => {
            if (t.receiptId === id) {
              return { ...t, receiptId: null };
            }
            return t;
          });
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        }
        
        loadComprobantes();
      } catch (error) {
        console.error('Error deleting comprobante:', error);
      }
    }
  };

  const handleViewComprobante = (id: string) => {
    router.push(`/comprobantes/${id}`);
  };

  const handleFilterChange = (name: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    let result = [...comprobantes];
    
    // Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.filename?.toLowerCase().includes(searchLower) || 
        c.description?.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtrar por tipo de archivo
    if (filters.fileType !== 'all') {
      if (filters.fileType === 'image') {
        result = result.filter(c => c.fileType.startsWith('image/'));
      } else if (filters.fileType === 'pdf') {
        result = result.filter(c => c.fileType === 'application/pdf');
      } else if (filters.fileType === 'other') {
        result = result.filter(c => !c.fileType.startsWith('image/') && c.fileType !== 'application/pdf');
      }
    }
    
    // Filtrar por rango de fechas
    if (filters.dateRange !== 'all') {
      const now = new Date();
      
      if (filters.dateRange === 'thisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        result = result.filter(c => new Date(c.date) >= startOfMonth);
      } else if (filters.dateRange === 'lastMonth') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        result = result.filter(c => {
          const date = new Date(c.date);
          return date >= startOfLastMonth && date <= endOfLastMonth;
        });
      } else if (filters.dateRange === 'custom' && filters.startDate) {
        const startDate = new Date(filters.startDate);
        let endDate = filters.endDate ? new Date(filters.endDate) : now;
        
        if (filters.endDate) {
          endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
        }
        
        result = result.filter(c => {
          const date = new Date(c.date);
          return date >= startDate && date <= endDate;
        });
      }
    }
    
    // Ordenar por fecha (más recientes primero)
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredComprobantes(result);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon size={16} className="text-accent-blue" />;
    } else if (fileType === 'application/pdf') {
      return <FileText size={16} className="text-accent-red" />;
    } else {
      return <File size={16} className="text-accent-green" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="Bolsillo App-page-title">Comprobantes</h1>
          <Link 
            href="/comprobantes/nuevo"
            className="Bolsillo App-btn-primary flex items-center justify-center"
          >
            <PlusCircle size={16} className="mr-2" />
            Nuevo Comprobante
          </Link>
        </div>

        <div className="Bolsillo App-card">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar comprobantes..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="Bolsillo App-input pl-10"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={filters.fileType}
                  onChange={(e) => handleFilterChange('fileType', e.target.value)}
                  className="Bolsillo App-select"
                >
                  {fileTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="Bolsillo App-select"
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

          {filters.dateRange === 'custom' && (
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-sm mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="Bolsillo App-input"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="Bolsillo App-input"
                />
              </div>
            </div>
          )}

          {filteredComprobantes.length === 0 ? (
            <div className="text-center py-10">
              <ArrowUpToLine size={40} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">No hay comprobantes</p>
              <Link 
                href="/comprobantes/nuevo" 
                className="Bolsillo App-btn-primary"
              >
                Subir comprobante
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComprobantes.map((comprobante) => (
                <div key={comprobante.id} className="Bolsillo App-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(comprobante.fileType)}
                    <h3 className="text-md font-medium truncate" title={comprobante.filename}>
                      {comprobante.filename}
                    </h3>
                  </div>
                  
                  {comprobante.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2" title={comprobante.description}>
                      {comprobante.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {formatDate(comprobante.date)}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewComprobante(comprobante.id)}
                        className="Bolsillo App-icon-btn"
                        title="Ver comprobante"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteComprobante(comprobante.id)}
                        className="Bolsillo App-icon-btn text-accent-red"
                        title="Eliminar comprobante"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 