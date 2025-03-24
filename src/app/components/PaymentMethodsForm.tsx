'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';

type PaymentMethodsFormProps = {
  onClose: () => void;
  onPaymentMethodAdded?: () => void;
};

type PaymentMethod = {
  id: string;
  userId: string;
  name: string;
};

export default function PaymentMethodsForm({ onClose, onPaymentMethodAdded }: PaymentMethodsFormProps) {
  const { user } = useAuth();
  const [methodName, setMethodName] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar métodos de pago
  useEffect(() => {
    if (!user) return;
    
    loadPaymentMethods();
  }, [user]);

  const loadPaymentMethods = () => {
    const storedMethods = localStorage.getItem('paymentMethods');
    if (storedMethods && user) {
      const allMethods = JSON.parse(storedMethods);
      // Filtrar métodos del usuario actual
      const filteredMethods = allMethods.filter(
        (method: PaymentMethod) => method.userId === user.id
      );
      setPaymentMethods(filteredMethods);
    }
  };

  // Agregar nuevo método de pago
  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para gestionar métodos de pago');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!methodName.trim()) {
      setError('Por favor ingresa un nombre para el método de pago');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Verificar que no exista ya un método con el mismo nombre
    const methodExists = paymentMethods.some(
      (method) => method.name.toLowerCase() === methodName.trim().toLowerCase()
    );

    if (methodExists) {
      setError('Ya existe un método de pago con ese nombre');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setIsSaving(true);

    // Crear nuevo método
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      userId: user.id,
      name: methodName.trim()
    };

    try {
      // Obtener métodos existentes
      const storedMethods = localStorage.getItem('paymentMethods');
      const existingMethods = storedMethods ? JSON.parse(storedMethods) : [];
      
      // Agregar nuevo método
      const updatedMethods = [...existingMethods, newMethod];
      
      // Guardar en localStorage
      localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      
      setSuccess('Método de pago guardado correctamente');
      setMethodName('');
      setTimeout(() => setSuccess(''), 2000);
      
      // Actualizar la lista de métodos
      loadPaymentMethods();
      
      // Notificar al componente padre
      if (onPaymentMethodAdded) {
        onPaymentMethodAdded();
      }
    } catch (err) {
      setError('Error al guardar el método de pago');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar método de pago
  const handleDeleteMethod = (methodId: string) => {
    if (!user) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
      try {
        // Obtener métodos existentes
        const storedMethods = localStorage.getItem('paymentMethods');
        if (!storedMethods) return;
        
        const allMethods = JSON.parse(storedMethods);
        
        // Filtrar el método a eliminar
        const updatedMethods = allMethods.filter((method: PaymentMethod) => method.id !== methodId);
        
        // Guardar en localStorage
        localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
        
        setSuccess('Método de pago eliminado correctamente');
        setTimeout(() => setSuccess(''), 2000);
        
        // Actualizar la lista de métodos
        loadPaymentMethods();
        
        // Notificar al componente padre
        if (onPaymentMethodAdded) {
          onPaymentMethodAdded();
        }
      } catch (err) {
        setError('Error al eliminar el método de pago');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-white">Gestionar Métodos de Pago</h2>
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
        <form onSubmit={handleAddMethod} className="space-y-4">
          <div>
            <label htmlFor="methodName" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del Método de Pago
            </label>
            <div className="flex">
              <input
                type="text"
                id="methodName"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. Tarjeta de crédito, Efectivo, Transferencia"
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
          Métodos de Pago Disponibles
        </h3>
        
        {paymentMethods.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No hay métodos de pago definidos
          </p>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded-md"
              >
                <span className="text-white">{method.name}</span>
                <button
                  onClick={() => handleDeleteMethod(method.id)}
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