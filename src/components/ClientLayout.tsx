'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Receipt,
  PiggyBank,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../lib/hooks/useAuth";

// Componente simple de carga
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-black">
    <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
  </div>
);

// Layout principal simple
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-black">{children}</div>
);

// Navbar
const Navbar = ({ 
  showMenu, 
  setShowMenu,
  user
}: { 
  showMenu: boolean; 
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  user: any;
}) => (
  <header className="fixed top-0 right-0 left-0 lg:left-64 z-10 h-16 bg-gray-900 border-b border-gray-800">
    <div className="flex items-center justify-between h-full px-4">
      <div className="flex items-center">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-white focus:outline-none lg:hidden"
        >
          {showMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <User size={16} className="text-gray-300" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.username || user?.email}</p>
            <p className="text-xs text-gray-400">Usuario</p>
          </div>
        </div>
      </div>
    </div>
  </header>
);

// Sidebar
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
    <aside className={`fixed z-20 inset-y-0 left-0 w-64 bg-gray-900 transform transition-transform duration-300 lg:translate-x-0 ${
      showMenu ? '-translate-x-full' : 'translate-x-0'
    }`}>
      <div className="flex flex-col h-full">
        {/* App Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Bolsillo App
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={18} className="mr-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-400 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
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

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Durante la verificación, mostrar carga
  if (!user && !isPublicRoute) {
    return <LoadingScreen />;
  }

  // Si es una ruta pública como login, mostrar sin sidebar ni header
  if (isPublicRoute) {
    return <MainLayout>{children}</MainLayout>;
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar showMenu={showMenu} />
      
      <div className="flex-1 lg:ml-64">
        <Navbar showMenu={showMenu} setShowMenu={setShowMenu} user={user} />
        
        <main className="pt-16 px-4 h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout; 