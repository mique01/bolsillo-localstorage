'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';

export type CategoryFormProps = {
  onClose: () => void;
  onCategoryAdded?: () => void;
  initialType?: 'income' | 'expense';
};

type Category = {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
};

export default function CategoryForm({ onClose, onCategoryAdded, initialType = 'expense' }: CategoryFormProps) {
  const { user } = useAuth();
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>(initialType);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar categorías
  useEffect(() => {
    if (!user) return;
    
    loadCategories();
  }, [user, categoryType]);

  const loadCategories = () => {
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories && user) {
      const allCategories = JSON.parse(storedCategories);
      // Filtrar categorías del tipo seleccionado y del usuario actual
      const filteredCategories = allCategories.filter(
        (cat: Category) => cat.userId === user.id && cat.type === categoryType
      );
      setCategories(filteredCategories);
    }
  };

  // Agregar nueva categoría
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para añadir categorías');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!categoryName) {
      setError('El nombre de la categoría es obligatorio');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Verificar si la categoría ya existe para este tipo
    const categoryExists = categories.some(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase() && cat.type === categoryType
    );

    if (categoryExists) {
      setError(`Ya existe una categoría de ${categoryType === 'income' ? 'ingreso' : 'gasto'} con ese nombre`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSaving(true);

    try {
      // Crear nueva categoría
      const newCategory: Category = {
        id: Date.now().toString(),
        userId: user.id,
        name: categoryName,
        type: categoryType
      };

      // Obtener categorías existentes
      const storedCategories = localStorage.getItem('categories');
      const existingCategories = storedCategories ? JSON.parse(storedCategories) : [];
      
      // Agregar nueva categoría
      const updatedCategories = [...existingCategories, newCategory];
      
      // Guardar en localStorage
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      
      // Actualizar estado
      setCategories(updatedCategories.filter((cat: Category) => cat.userId === user.id));
      setCategoryName('');
      setSuccess('Categoría guardada correctamente');
      
      // Llamar a la función de callback si existe
      if (onCategoryAdded) {
        onCategoryAdded();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar la categoría');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar categoría
  const handleDeleteCategory = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      try {
        // Obtener categorías existentes
        const storedCategories = localStorage.getItem('categories');
        if (!storedCategories) return;
        
        const allCategories = JSON.parse(storedCategories);
        
        // Filtrar la categoría a eliminar
        const updatedCategories = allCategories.filter((cat: Category) => cat.id !== id);
        
        // Guardar en localStorage
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        // Actualizar estado
        setCategories(updatedCategories.filter((cat: Category) => cat.userId === user?.id));
        
        setSuccess('Categoría eliminada correctamente');
        
        // Llamar a la función de callback si existe
        if (onCategoryAdded) {
          onCategoryAdded();
        }
        
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Error al eliminar la categoría');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  return (
    <div className="Bolsillo App-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="Bolsillo App-section-title">Gestionar Categorías</h2>
        <button onClick={onClose} className="Bolsillo App-icon-btn">
          <X size={18} />
        </button>
      </div>

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

      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tipo de Categoría</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${
                categoryType === 'expense'
                  ? 'bg-red-100/10 border-red-500/40 text-red-400'
                  : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => setCategoryType('expense')}
            >
              Gastos
            </button>
            <button
              type="button"
              className={`p-3 rounded-lg border flex items-center justify-center transition-colors ${
                categoryType === 'income'
                  ? 'bg-green-100/10 border-green-500/40 text-green-400'
                  : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => setCategoryType('income')}
            >
              Ingresos
            </button>
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium mb-1">
              Nombre de la Categoría
            </label>
            <div className="flex">
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                placeholder={categoryType === 'expense' ? 'Ej. Alimentación, Transporte' : 'Ej. Salario, Inversiones'}
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-r transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">
          {categoryType === 'expense' ? 'Categorías de Gastos' : 'Categorías de Ingresos'}
        </h3>
        
        {categories.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No hay categorías de {categoryType === 'expense' ? 'gastos' : 'ingresos'} definidas
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg border border-card-border bg-card-bg"
              >
                <span>{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="Bolsillo App-icon-btn text-accent-red"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 