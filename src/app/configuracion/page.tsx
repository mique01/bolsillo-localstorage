'use client';

import { useState, useEffect } from 'react';
import { Save, Users, Trash2, PlusCircle, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

type Settings = {
  userId: string; 
  liveWithOthers: boolean;
  darkMode: boolean;
  currency: string;
  people?: string[];
};

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    userId: '',
    liveWithOthers: false,
    darkMode: true,
    currency: 'ARS',
    people: []
  });
  const [newPerson, setNewPerson] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar configuración del usuario actual
  useEffect(() => {
    if (!user) return;
    
    const configKey = `config_${user.id}`;
    const savedSettings = localStorage.getItem(configKey);
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...parsedSettings,
          userId: user.id,
          people: parsedSettings.people || []
        });
      } catch (error) {
        console.error("Error parsing settings:", error);
        // Inicializar con valores por defecto
        initializeSettings();
      }
    } else {
      // Inicializar con valores por defecto
      initializeSettings();
    }
  }, [user]);

  const initializeSettings = () => {
    if (!user) return;
    
    const defaultSettings: Settings = {
      userId: user.id,
      liveWithOthers: false,
      darkMode: true,
      currency: 'ARS',
      people: []
    };
    
    setSettings(defaultSettings);
    localStorage.setItem(`config_${user.id}`, JSON.stringify(defaultSettings));
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const saveSettings = (data: Settings) => {
    if (!user) return;
    localStorage.setItem(`config_${user.id}`, JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSuccessMessage('Configuración guardada correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerson.trim()) {
      setErrorMessage('Ingresa un nombre válido');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    // Verificar que no exista ya
    if (settings.people?.includes(newPerson.trim())) {
      setErrorMessage('Esta persona ya está en la lista');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    const updatedPeople = [...(settings.people || []), newPerson.trim()];
    const newSettings = { ...settings, people: updatedPeople };
    setSettings(newSettings);
    saveSettings(newSettings);
    setNewPerson('');
    setSuccessMessage('Persona agregada correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRemovePerson = (name: string) => {
    const updatedPeople = settings.people?.filter(p => p !== name) || [];
    const newSettings = { ...settings, people: updatedPeople };
    setSettings(newSettings);
    saveSettings(newSettings);
    setSuccessMessage('Persona eliminada correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
        </div>

        {successMessage && (
          <div className="flex items-start gap-2 bg-green-900/30 border border-green-500/50 text-green-200 p-3 rounded-lg">
            <Check size={18} className="flex-shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Preferencias personales */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
              <Users size={20} className="text-purple-400" />
              <span>Preferencias personales</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-200">Vivo con otras personas</span>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-600 rounded-full">
                    <input
                      type="checkbox"
                      className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                      checked={settings.liveWithOthers}
                      onChange={(e) => handleSettingChange('liveWithOthers', e.target.checked)}
                    />
                    <div 
                      className={`w-6 h-6 transform transition-transform duration-200 ease-in-out bg-white rounded-full ${
                        settings.liveWithOthers ? 'translate-x-6' : 'translate-x-0'
                      }`} 
                    />
                  </div>
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  {settings.liveWithOthers 
                    ? "Gestiona gastos e ingresos con otras personas" 
                    : "Gestiona tus gastos de forma individual"}
                </p>
              </div>

              {/* Lista de personas (solo si liveWithOthers está activado) */}
              {settings.liveWithOthers && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-3 text-gray-200">Personas</h3>
                  
                  {settings.people && settings.people.length > 0 ? (
                    <ul className="space-y-2 mb-4">
                      {settings.people.map((person, index) => (
                        <li 
                          key={index} 
                          className="flex items-center justify-between bg-gray-700 p-2 rounded-lg"
                        >
                          <span className="text-sm text-gray-200">{person}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemovePerson(person)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 mb-3">
                      No hay personas agregadas. Agrega a las personas con las que compartes gastos.
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPerson}
                      onChange={(e) => setNewPerson(e.target.value)}
                      placeholder="Nombre de la persona"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPerson}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <PlusCircle size={16} />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save size={20} />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
} 