'use client';

import { useEffect, useState } from 'react';

/**
 * Componente para gestionar el estado de la aplicación
 * - Verifica la disponibilidad de localStorage
 * - Muestra un indicador de estado de la aplicación
 */
export default function ConnectionManager() {
  const [appStatus, setAppStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  useEffect(() => {
    function checkAppStatus() {
      try {
        // Verificar si localStorage está disponible
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        setAppStatus('ready');
      } catch (error) {
        console.error('Error checking app status:', error);
        setAppStatus('error');
      }
    }

    checkAppStatus();
  }, []);

  // Solo mostrar indicador visual cuando hay problemas
  if (appStatus === 'ready') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {appStatus === 'checking' && (
        <div className="bg-yellow-800 text-yellow-200 py-1 px-3 rounded-full text-xs flex items-center">
          <span className="animate-pulse mr-1">●</span>
          Verificando estado de la aplicación...
        </div>
      )}
      {appStatus === 'error' && (
        <div className="bg-red-800 text-red-200 py-1 px-3 rounded-full text-xs flex items-center">
          <span className="mr-1">●</span>
          Error: localStorage no disponible
        </div>
      )}
    </div>
  );
}