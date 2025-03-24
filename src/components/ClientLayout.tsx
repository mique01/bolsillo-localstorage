'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  BarChart3,
  Receipt,
  PiggyBank,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  DollarSign,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "../lib/hooks/useAuth";
import { DebugTool } from './DebugTool';

// Componente simple de carga
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
  </div>
);

// Layout principal simple
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-900">{children}</div>
);

// Navbar simple
const Navbar = ({ 
  showMenu, 
  setShowMenu 
}: { 
  showMenu: boolean; 
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>; 
}) => (
  <div className="fixed top-0 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700">
    <div className="flex items-center justify-between h-16 px-4">
      <Link href="/" className="flex items-center">
        <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md shadow-lg">
          <PiggyBank size={20} className="text-white" />
        </div>
        <span className="ml-2 text-lg font-semibold text-white">Bolsillo App</span>
      </Link>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-400 hover:text-white focus:outline-none md:hidden"
      >
        {showMenu ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  </div>
);

// Sidebar simple
const Sidebar = ({ showMenu }: { showMenu: boolean }) => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/transacciones', label: 'Transacciones', icon: Receipt },
    { path: '/comprobantes', label: 'Comprobantes', icon: DollarSign },
    { path: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
    { path: '/configuracion', label: 'Configuración', icon: Settings },
  ];
  
  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 border-r border-gray-700 shadow-lg transform transition-all duration-300 pt-16
      ${showMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex flex-col h-full">
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-700 rounded-full">
              <User size={20} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.profileType || 'Personal'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/30"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                <Icon size={20} className={`mr-3 transition-colors ${
                  isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'
                }`} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para manejar correctamente las rutas
const getFullPath = (path: string) => {
  // En el cliente, window.appConfig estará definido por el script inyectado
  const config = typeof window !== 'undefined' ? (window as any).appConfig || { basePath: '', isBasepathHandled: false } :
    { basePath: '', isBasepathHandled: false };

  // Determinar si estamos en localhost o IP local
  const isLocalEnv = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname));

  // Si estamos en localhost o IP local, siempre retornar el path sin prefijo
  if (isLocalEnv) {
    // Si el path comienza con /bolsilloapp-cursor, quitarlo
    if (path.startsWith('/bolsilloapp-cursor')) {
      return path.replace('/bolsilloapp-cursor', '');
    }
    return path;
  }

  // Para GitHub Pages
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  
  if (isGitHubPages) {
    // Asegurarse de que el path tenga el prefijo correcto
    if (!path.startsWith('/bolsilloapp-cursor') && !path.startsWith('bolsilloapp-cursor')) {
      // Si es la ruta raíz, manejarla especialmente
      if (path === '/' || path === '') {
        return '/bolsilloapp-cursor';
      }
      return `/bolsilloapp-cursor${path.startsWith('/') ? path : `/${path}`}`;
    }
    return path;
  }

  // Para otros entornos (como Vercel), simplemente usar la ruta sin modificar
  return path;
};

// Componente personalizado de Link para manejar correctamente las rutas
export const CustomLink = ({ href, ...props }: React.ComponentProps<typeof Link>) => {
  const fullHref = getFullPath(href.toString());
  return <Link href={fullHref} {...props} />;
};

function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isPublicRoute = ['/login', '/register', '/reset-password'].includes(pathname);

  // Handle mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMenu(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  // Handle auth redirect - debe estar AQUÍ para evitar problemas de hooks renderizados inconsistentemente
  useEffect(() => {
    if (!loading && !user && !isPublicRoute && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [user, loading, isPublicRoute, router, pathname]);

  // Handle logout
  const handleLogout = async () => {
    signOut();
    router.push('/login');
  };

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Durante la verificación, mostrar carga
  if (!user && !isPublicRoute) {
    return <LoadingScreen />;
  }

  // Don't show layout on public routes
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Overlay for mobile menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setShowMenu(false)}
        />
      )}
      
      {/* Navbar */}
      <Navbar showMenu={showMenu} setShowMenu={setShowMenu} />
      
      {/* Main Layout */}
      <div className="flex min-h-screen pt-16">
        <Sidebar showMenu={showMenu} />
        <main className="flex-1 p-4 md:p-8 transition-all duration-300 md:ml-64">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
} 