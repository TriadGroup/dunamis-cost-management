import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLeaderOrDelegate: boolean;
  activateDelegation: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock user for MVP
  const [user] = useState<User>({
    id: 'user_123',
    name: 'João Silva',
    email: 'joao@missao.org',
    role: 'missionary',
    teamId: 'team_abc',
    baseId: 'base_sp'
  });
  
  const [delegationActive, setDelegationActive] = useState(false);

  const isLeaderOrDelegate = 
    user.role === 'leader' || 
    user.role === 'coordinator' || 
    user.role === 'admin' || 
    delegationActive;

  const activateDelegation = (code: string) => {
    // Mock validation for MVP
    if (code === '938-124') {
      setDelegationActive(true);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, isLeaderOrDelegate, activateDelegation }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
