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
    <div className="Bolsillo App-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="Bolsillo App-section-title">Gestionar Métodos de Pago</h2>
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
        <form onSubmit={handleAddMethod} className="space-y-4">
          <div>
            <label htmlFor="methodName" className="block text-sm font-medium mb-1">
              Nombre del Método de Pago
            </label>
            <div className="flex">
              <input
                type="text"
                id="methodName"
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                placeholder="Ej. Tarjeta de crédito, Efectivo, Transferencia"
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
                className="flex items-center justify-between p-3 rounded-lg border border-card-border bg-card-bg"
              >
                <span>{method.name}</span>
                <button
                  onClick={() => handleDeleteMethod(method.id)}
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