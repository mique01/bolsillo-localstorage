import { useAuth as useAuthContext } from '../../lib/contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
} 