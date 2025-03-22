'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import supabase, { getSupabase } from '../supabase';

// Import the reset instance function or declare a variable
let supabaseInstance: any = null;

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  isOnline: boolean;
  resetPassword: (email: string) => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Función para detectar cambios en la conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Verificar la conexión inicial
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      // Agregar event listeners para cambios en la conexión
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Función para verificar si hay una sesión guardada en localStorage
  const checkLocalSession = (): { user: User | null; lastLogin: number } => {
    try {
      const localSession = localStorage.getItem('supabase_auth_session');
      if (localSession) {
        const parsedSession = JSON.parse(localSession);
        return {
          user: parsedSession.user || null,
          lastLogin: parsedSession.timestamp || 0
        };
      }
    } catch (error) {
      console.error('Error al leer la sesión local:', error);
    }
    return { user: null, lastLogin: 0 };
  };

  // Función para guardar la sesión en localStorage
  const saveLocalSession = (userData: User) => {
    try {
      localStorage.setItem('supabase_auth_session', JSON.stringify({
        user: userData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error al guardar la sesión local:', error);
    }
  };

  // Verificar si la sesión local está expirada (más de 24 horas)
  const isLocalSessionExpired = (lastLogin: number): boolean => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    return now - lastLogin > oneDay;
  };

  useEffect(() => {
    const checkAndSetSession = async () => {
      try {
        setIsLoading(true);
        
        // Verificar si estamos en línea o no
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        
        if (online) {
          // Intentar obtener la sesión de Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error al obtener la sesión:', error);
            const { user: localUser, lastLogin } = checkLocalSession();
            
            // Usar sesión local solo si existe y no está expirada
            if (localUser && !isLocalSessionExpired(lastLogin)) {
              setUser(localUser);
              setIsLoggedIn(true);
              console.log('Usando sesión local debido a error en Supabase');
            } else {
              setUser(null);
              setIsLoggedIn(false);
              localStorage.removeItem('supabase_auth_session');
            }
          } else {
            setSession(data.session);
            setUser(data.session?.user || null);
            setIsLoggedIn(!!data.session);
            
            // Guardar sesión en localStorage para acceso offline
            if (data.session?.user) {
              saveLocalSession(data.session.user);
            }
          }
        } else {
          // Estamos offline, usar datos en localStorage
          console.log('Modo offline: intentando usar sesión local');
          const { user: localUser, lastLogin } = checkLocalSession();
          
          if (localUser && !isLocalSessionExpired(lastLogin)) {
            setUser(localUser);
            setIsLoggedIn(true);
            console.log('Iniciado sesión desde cache local');
          } else {
            setUser(null);
            setIsLoggedIn(false);
            console.log('Sesión local expirada o no encontrada');
          }
        }
      } catch (error) {
        console.error('Error en checkAndSetSession:', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Ejecutar al inicio
    checkAndSetSession();
    
    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user || null);
        setIsLoggedIn(!!session);
        
        // Guardar en localStorage si hay usuario
        if (session?.user) {
          saveLocalSession(session.user);
        }
        
        // Si se cierra sesión, limpiar localStorage
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase_auth_session');
        }
      }
    );
    
    // Limpiar suscripción al desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Verificar si la sesión actual es válida
  const checkSession = async (): Promise<boolean> => {
    try {
      // Si estamos offline, verificar sesión local
      if (!isOnline) {
        const { user: localUser, lastLogin } = checkLocalSession();
        return !!localUser && !isLocalSessionExpired(lastLogin);
      }
      
      // Intentar obtener sesión de Supabase
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error al verificar sesión:', error);
        return false;
      }
      
      return !!data.session;
    } catch (error) {
      console.error('Error en checkSession:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // First check if we have connectivity issues
      const useDirectIp = typeof window !== 'undefined' && 
        localStorage.getItem('use_direct_ip') === 'true';
      
      // Try to get a client with the right configuration
      const client = await getSupabase();
      
      // Use a more resilient sign-in approach
      let { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('CORS')) {
          
          console.log("Trying alternative authentication method due to network issues");
          
          // Set direct IP mode and retry
          if (typeof window !== 'undefined') {
            localStorage.setItem('use_direct_ip', 'true');
          }
          
          // Get a fresh client with new settings
          supabaseInstance = null;
          const newClient = await getSupabase();
          
          // Retry the signin
          const result = await newClient.auth.signInWithPassword({
            email,
            password,
          });
          
          data = result.data;
          error = result.error;
        }
      }
      
      if (error) throw error;
      
      if (!data?.user) {
        throw new Error('No user returned from Supabase');
      }
      
      setUser(data.user);
      setIsLoggedIn(true);
      
      // Guardar información de conectividad
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_successful_login', new Date().toISOString());
        localStorage.setItem('user_email', email);
      }
      
      console.log('Conectado correctamente con Supabase');
    } catch (error) {
      console.error('Error específico de auth:', error);
      
      // Intentar soluciones para problemas de conexión
      if (typeof window !== 'undefined' && error instanceof Error && 
          (error.message.includes('fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED') || 
           error.message.includes('NetworkError') || error.message.includes('CORS'))) {
        
        // Guardar información del error para diagnóstico
        localStorage.setItem('auth_error', JSON.stringify({
          message: error.message,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }));
        
        console.log("Activando modo de compatibilidad para DNS...");
        localStorage.setItem('use_direct_ip', 'true');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string): Promise<any> => {
    try {
      setIsLoading(true);
      
      // Verificar si estamos offline
      if (!isOnline) {
        throw new Error('No hay conexión a internet. No es posible registrarse sin conexión.');
      }
      
      // Crear un timeout para evitar que la petición se cuelgue indefinidamente
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout al intentar conectar con el servidor de autenticación'));
        }, 15000); // 15 segundos
      });
      
      // Intentar registrar usuario con Supabase
      const authPromise = supabase.auth.signUp({ email, password });
      
      // Usar Promise.race para manejar el timeout
      const result = await Promise.race([authPromise, timeoutPromise]);
      const { data, error } = result as { data: { session: Session | null; user: User | null }; error: any };
      
      if (error) {
        return error;
      }
      
      return null;
    } catch (error) {
      console.error('Error en signUp:', error);
      return error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Si estamos offline, solo limpiar la sesión local
      if (!isOnline) {
        localStorage.removeItem('supabase_auth_session');
        setUser(null);
        setSession(null);
        setIsLoggedIn(false);
        console.log('Sesión cerrada localmente (modo offline)');
        return;
      }
      
      // Intentar cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        // A pesar del error, limpiamos la sesión local
        localStorage.removeItem('supabase_auth_session');
      }
      
      // Limpiar estado de autenticación
      setUser(null);
      setSession(null);
      setIsLoggedIn(false);
      
      console.log('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error en signOut:', error);
      
      // Intentar limpiar de todos modos
      localStorage.removeItem('supabase_auth_session');
      setUser(null);
      setSession(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Verificar si estamos offline
      if (!isOnline) {
        throw new Error('No hay conexión a internet. No es posible resetear la contraseña sin conexión.');
      }
      
      // Intentar enviar email de reseteo de contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error en resetPassword:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: SupabaseAuthContextType = {
    user,
    session,
    isLoading,
    isLoggedIn,
    signIn,
    signUp,
    signOut,
    checkSession,
    isOnline,
    resetPassword
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  
  if (!context) {
    throw new Error('useSupabaseAuth debe ser utilizado dentro de un SupabaseAuthProvider');
  }
  
  return context;
} 