import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { User, Briefcase, UserPlus, LogIn, Check, Info } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [profileType, setProfileType] = useState('personal');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, availableProfiles, registerProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (username.trim()) {
      // Verificar si el usuario ya existe
      const exists = availableProfiles.some(
        p => p.username.toLowerCase() === username.toLowerCase()
      );
      
      // Cambiar automáticamente el modo según si existe o no
      setMode(exists ? 'login' : 'register');
    }
  }, [username, availableProfiles]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Ingresa un nombre de usuario');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      signIn(username);
      setSuccess('Inicio de sesión exitoso');
      
      // Redireccionar después de 500ms para mostrar el mensaje de éxito
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err) {
      console.error(err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Ingresa un nombre de usuario');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const success = registerProfile(username, profileType);
      
      if (success) {
        setSuccess('Cuenta creada exitosamente');
        // Redireccionar después de 500ms para mostrar el mensaje de éxito
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        setError('Este nombre de usuario ya está en uso');
      }
    } catch (err) {
      console.error(err);
      setError('Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-gray-800/50 p-8 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700">
      {/* Selector de modo */}
      <div className="flex rounded-lg overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 flex justify-center items-center ${
            mode === 'login'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <LogIn size={16} className="mr-2" />
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 flex justify-center items-center ${
            mode === 'register'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <UserPlus size={16} className="mr-2" />
          Crear Cuenta
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 rounded-md p-3 text-sm flex items-start">
          <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-200 rounded-md p-3 text-sm flex items-start">
          <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
        {/* Campo de nombre de usuario */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-200">
            Nombre de usuario
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa tu nombre de usuario"
            />
          </div>
        </div>

        {/* Lista de perfiles disponibles si está en modo login */}
        {mode === 'login' && availableProfiles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Perfiles disponibles:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setUsername(profile.username)}
                  className={`text-left p-2 rounded border ${
                    username === profile.username
                      ? 'bg-blue-600/30 border-blue-500/50 text-white'
                      : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <User size={14} className="mr-2" />
                    <span className="text-sm font-medium">{profile.username}</span>
                  </div>
                  {profile.profileType && (
                    <span className="text-xs text-gray-400 block mt-1">
                      {profile.profileType}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Campo de tipo de perfil si está en modo registro */}
        {mode === 'register' && (
          <div>
            <label htmlFor="profileType" className="block text-sm font-medium text-gray-200">
              Tipo de perfil
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="profileType"
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="personal">Personal</option>
                <option value="negocio">Negocio</option>
                <option value="familiar">Familiar</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
            ${
              isLoading || !username.trim()
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}
            </>
          ) : (
            <>
              {mode === 'login' ? (
                <>
                  <LogIn size={16} className="mr-2" />
                  Iniciar Sesión
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  Crear Cuenta
                </>
              )}
            </>
          )}
        </button>
      </form>
    </div>
  );
} 