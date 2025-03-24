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
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-white">Gestionar Categorías</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
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

      <div className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`py-2 px-4 rounded-md flex justify-center items-center ${
                categoryType === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setCategoryType('expense')}
            >
              Gastos
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md flex justify-center items-center ${
                categoryType === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setCategoryType('income')}
            >
              Ingresos
            </button>
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre de la Categoría
            </label>
            <div className="flex">
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={categoryType === 'expense' ? 'Ej. Alimentación, Transporte' : 'Ej. Salario, Inversiones'}
              />
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md flex items-center"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-3">
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
                className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded-md"
              >
                <span className="text-white">{category.name}</span>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-gray-400 hover:text-red-400 p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 