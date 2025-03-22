import { createClient } from '@supabase/supabase-js';
import { fetchWithRetry, getEnvironment } from './utils/networkUtils';
import { getEnvironmentSimple, minimalFetchWithRetry } from './utils/fallbacks';

// Define the type for our Supabase client (use any to avoid type issues)
type SupabaseClientType = any;

// Define a mock client type for development
type MockSupabaseClient = {
  auth: {
    signUp: (params: { email: string; password: string }) => Promise<any>;
    signInWithPassword: (params: { email: string; password: string }) => Promise<any>;
    signOut: () => Promise<any>;
    onAuthStateChange: (callback: (event: string, session: any) => void) => any;
    getSession: () => Promise<any>;
    getUser: () => Promise<any>;
    resetPasswordForEmail: (email: string) => Promise<any>;
    updateUser: (params: { password: string }) => Promise<any>;
  };
  from: (table: string) => any;
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: any) => Promise<any>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
      download: (path: string) => Promise<any>;
      list: (path?: string, options?: any) => Promise<any>;
      remove: (paths: string | string[]) => Promise<any>;
    };
  };
};

// URLs de fallback incluyendo direcciones IP alternativas en caso de problemas DNS
const SUPABASE_URLS = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'https://cxfnamwzbfrdaahfsqkc.supabase.co',
  // Agregar proxy CORS para casos extremos
  'https://corsproxy.io/?https://cxfnamwzbfrdaahfsqkc.supabase.co',
  'https://api.allorigins.win/raw?url=https://cxfnamwzbfrdaahfsqkc.supabase.co'
];

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhybm1ndHVnc2ZjeGthZ2pxcWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU5MDY1MDcsImV4cCI6MjAxMTQ4MjUwN30.4GiGYPPzXHJGd30GRz07t0uGnAQgJNBmq6JFHZ2EWUI';

// Add fallback detection
const currentEnvironment = 
  typeof getEnvironment === 'function' ? getEnvironment() 
  : typeof getEnvironmentSimple === 'function' ? getEnvironmentSimple()
  : 'unknown';

// Headers para las peticiones
const requestHeaders: Record<string, string> = {
  'X-Client-Info': 'supabase-js/2.38.4',
  'X-Origin': typeof window !== 'undefined' ? window.location.origin : 'localhost',
  'X-Client-Environment': currentEnvironment
};

// Opciones para el fetch según el entorno
const fetchOptions: RequestInit = {
  headers: requestHeaders,
  // Cambiar a 'same-origin' para evitar problemas de CORS
  credentials: 'same-origin' as RequestCredentials,
  mode: 'cors' as RequestMode
};

// Add fallback fetch
const enhancedFetch = 
  typeof fetchWithRetry === 'function' ? fetchWithRetry 
  : typeof minimalFetchWithRetry === 'function' ? minimalFetchWithRetry
  : fetch;

// Función optimizada para verificar disponibilidad de una URL con timeout
async function testUrl(url: string): Promise<boolean> {
  try {
    await fetchWithRetry(`${url}/ping`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit',
      headers: { 'Accept': 'application/json' }
    }, 2, 3000); // 2 intentos, 3 segundos de timeout
    
    return true;
  } catch (error) {
    return false;
  }
}

// Modificar la función createSupabaseClient para intentar múltiples URLs
export const createSupabaseClient = async () => {
  // Intentar conexión con cada URL hasta encontrar una que funcione
  let lastError = null;

  for (const supabaseUrl of SUPABASE_URLS) {
    if (!supabaseUrl) continue; // Omitir URLs vacías

    try {
      console.log(`Intentando conectar a Supabase en: ${supabaseUrl}`);

      // Verificar primero si podemos acceder al dominio con un fetch básico
      try {
        const testResponse = await fetchWithRetry(`${supabaseUrl}/ping`, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          headers: { 'Accept': 'application/json' }
        }, 2, 5000);
        
        console.log(`Respuesta de prueba: ${testResponse.status}`);
      } catch (pingError) {
        console.warn(`No se pudo hacer ping a ${supabaseUrl}:`, pingError);
        // Continuar de todos modos, la conexión real podría funcionar
      }

      // Función mejorada de fetch para el cliente de Supabase
      const enhancedFetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
        // Para recursos críticos, usar nuestro fetchWithRetry
        const isAuthRequest = 
          (typeof url === 'string' && url.includes('/auth/')) || 
          (url instanceof URL && url.pathname.includes('/auth/'));
        
        if (isAuthRequest) {
          // Usar más reintentos y un timeout más largo para peticiones de autenticación
          return fetchWithRetry(
            typeof url === 'string' ? url : url.toString(),
            {
              ...options,
              ...fetchOptions,
              credentials: 'same-origin', // Cambiar a same-origin
              mode: 'cors',
              headers: {
                ...options.headers,
                ...requestHeaders
              }
            },
            3, // 3 reintentos
            15000 // 15 segundos timeout
          );
        }
        
        // Para el resto de peticiones, usar la implementación normal pero con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Usar DNS directo para bypass si es necesario
        const urlString = typeof url === 'string' ? url : url.toString();
        const modifiedUrl = urlString.replace(
          'cxfnamwzbfrdaahfsqkc.supabase.co',
          typeof window !== 'undefined' && window.localStorage.getItem('use_direct_ip') === 'true' 
            ? (localStorage.getItem('supabase_direct_ip') || 'cxfnamwzbfrdaahfsqkc.supabase.co')
            : 'cxfnamwzbfrdaahfsqkc.supabase.co'
        );

        try {
          const response = await fetch(modifiedUrl, {
            ...options,
            ...fetchOptions,
            credentials: 'same-origin', // Cambiar a same-origin
            mode: 'cors',
            headers: {
              ...options.headers,
              ...requestHeaders
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const client = createClient(supabaseUrl, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'supabase-auth',
        },
        global: {
          headers: requestHeaders,
          fetch: enhancedFetch
        }
      });
      
      // Verificar conexión haciendo una llamada de prueba
      try {
        const { data, error } = await client.auth.getSession();
        if (!error) {
          console.log("Conexión a Supabase establecida correctamente");

          // Guardar este URL que funcionó para futuros usos
          if (typeof window !== 'undefined') {
            localStorage.setItem('working_supabase_url', supabaseUrl);
          }

          return client;
        }
      } catch (sessionError) {
        console.warn("Error al verificar sesión:", sessionError);
        // No es crítico, el cliente podría funcionar para otras operaciones
      }

      return client; // Retornar el cliente aunque la prueba de sesión falle

    } catch (error) {
      console.error(`Error al conectar con ${supabaseUrl}:`, error);
      lastError = error;
      // Continuar con la siguiente URL
    }
  }

  // Si llegamos aquí, todas las URLs fallaron
  console.error("No se pudo conectar con ninguna URL de Supabase. Último error:", lastError);

  // Crear un cliente con la primera URL como fallback final
  const defaultUrl = SUPABASE_URLS[0] || 'https://cxfnamwzbfrdaahfsqkc.supabase.co';
  return createClient(defaultUrl, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
};

// Exportamos una sola instancia del cliente, que se inicializa bajo demanda
let supabaseInstance: SupabaseClientType | null = null;

export const getSupabase = async (): Promise<SupabaseClientType> => {
  if (!supabaseInstance) {
    supabaseInstance = await createSupabaseClient();
  }
  return supabaseInstance;
};

// Para compatibilidad con código existente, crear una instancia sincrónica
// pero advertir que debe migrarse a la versión asíncrona
const supabase = createClient(
  SUPABASE_URLS[0] || 'https://cxfnamwzbfrdaahfsqkc.supabase.co', 
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: requestHeaders,
      fetch: (url, options) => {
        // Añadir CORS y credentials a todas las peticiones
        return fetch(url, {
          ...options,
          credentials: 'same-origin',
          mode: 'cors',
          headers: {
            ...options?.headers,
            ...requestHeaders
          }
        });
      }
    }
  }
);

export default supabase; 