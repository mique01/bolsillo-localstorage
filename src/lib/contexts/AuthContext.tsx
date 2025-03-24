'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type User = {
  id: string;
  username: string;
  profileType?: string;
  createdAt: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  availableProfiles: User[];
  signIn: (username: string, profileType?: string) => void;
  signOut: () => void;
  switchProfile: (username: string) => void;
  registerProfile: (username: string, profileType: string) => boolean;
  deleteProfile: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableProfiles, setAvailableProfiles] = useState<User[]>([]);

  // Cargar perfiles disponibles
  const loadProfiles = () => {
    const storedUsers = localStorage.getItem('users');
    let parsedUsers: User[] = [];
    
    if (storedUsers) {
      parsedUsers = JSON.parse(storedUsers);
    }
    
    setAvailableProfiles(parsedUsers);
    return parsedUsers;
  };

  // Cargar perfiles al iniciar
  useEffect(() => {
    loadProfiles();
    
    // Verificar si hay un usuario en sesión
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Función para registrar nuevo perfil
  const registerProfile = (username: string, profileType: string = 'personal'): boolean => {
    const profiles = loadProfiles();
    
    // Verificar si ya existe un perfil con ese nombre
    if (profiles.some(p => p.username.toLowerCase() === username.toLowerCase())) {
      return false;
    }
    
    // Crear nuevo perfil
    const newUser: User = { 
      id: Date.now().toString(), 
      username, 
      profileType,
      createdAt: new Date().toISOString()
    };
    
    // Guardar en localStorage
    localStorage.setItem('users', JSON.stringify([...profiles, newUser]));
    setAvailableProfiles([...profiles, newUser]);
    
    // Automáticamente iniciar sesión
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setUser(newUser);
    
    // Inicializar datos para este usuario
    const initialConfig = { userId: newUser.id, liveWithOthers: false };
    localStorage.setItem(`config_${newUser.id}`, JSON.stringify(initialConfig));
    
    // Crear categorías por defecto
    const defaultCategories = [
      { id: 'cat_1', name: 'Alimentación', userId: newUser.id, type: 'expense' },
      { id: 'cat_2', name: 'Transporte', userId: newUser.id, type: 'expense' },
      { id: 'cat_3', name: 'Vivienda', userId: newUser.id, type: 'expense' },
      { id: 'cat_4', name: 'Salud', userId: newUser.id, type: 'expense' },
      { id: 'cat_5', name: 'Entretenimiento', userId: newUser.id, type: 'expense' },
      { id: 'cat_6', name: 'Sueldo', userId: newUser.id, type: 'income' },
      { id: 'cat_7', name: 'Freelance', userId: newUser.id, type: 'income' },
      { id: 'cat_8', name: 'Otros ingresos', userId: newUser.id, type: 'income' }
    ];
    
    const allCategories = JSON.parse(localStorage.getItem('categories') || '[]');
    localStorage.setItem('categories', JSON.stringify([...allCategories, ...defaultCategories]));
    
    // Crear métodos de pago por defecto
    const defaultPaymentMethods = [
      { id: 'pm_1', name: 'Efectivo', userId: newUser.id },
      { id: 'pm_2', name: 'Tarjeta de débito', userId: newUser.id },
      { id: 'pm_3', name: 'Tarjeta de crédito', userId: newUser.id },
      { id: 'pm_4', name: 'Transferencia', userId: newUser.id }
    ];
    
    const allPaymentMethods = JSON.parse(localStorage.getItem('payment_methods') || '[]');
    localStorage.setItem('payment_methods', JSON.stringify([...allPaymentMethods, ...defaultPaymentMethods]));
    
    return true;
  };

  // Función para eliminar perfil
  const deleteProfile = (userId: string) => {
    const profiles = loadProfiles().filter(p => p.id !== userId);
    localStorage.setItem('users', JSON.stringify(profiles));
    setAvailableProfiles(profiles);
    
    // Si el usuario actual es el eliminado, cerrar sesión
    if (user && user.id === userId) {
      signOut();
    }
  };

  // Iniciar sesión
  const signIn = (username: string, profileType?: string) => {
    const profiles = loadProfiles();
    const existingProfile = profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
    
    if (existingProfile) {
      // Usar perfil existente
      localStorage.setItem('currentUser', JSON.stringify(existingProfile));
      setUser(existingProfile);
    } else if (username.trim()) {
      // Crear nuevo perfil si no existe
      registerProfile(username, profileType || 'personal');
    }
  };

  // Cambiar entre perfiles
  const switchProfile = (username: string) => {
    const profiles = loadProfiles();
    const targetProfile = profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
    
    if (targetProfile) {
      localStorage.setItem('currentUser', JSON.stringify(targetProfile));
      setUser(targetProfile);
    }
  };

  // Cerrar sesión
  const signOut = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      availableProfiles, 
      signIn, 
      signOut, 
      switchProfile,
      registerProfile,
      deleteProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
} 