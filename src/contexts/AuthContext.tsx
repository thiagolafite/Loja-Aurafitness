import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomerProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getCustomers, saveCustomerProfile } from '../lib/dataClient';

interface AuthContextType {
  user: CustomerProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  // Supabase Auth Methods (Async)
  signInCustomer: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpCustomer: (email: string, password: string, name: string, phone?: string, cpf?: string) => Promise<{ success: boolean; error?: string }>;
  signInAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<void>;
  // Synchronous Legacy Fallbacks (for backwards compatibility)
  loginAsCustomer: (email: string) => boolean;
  registerCustomer: (data: Partial<CustomerProfile>) => CustomerProfile;
  loginAdmin: (email: string, pass: string) => boolean;
  logout: () => void;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch full profile from Supabase profiles table
  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser({
          id: data.id,
          name: data.name || 'Cliente Aura',
          email: data.email || email,
          cpf: data.cpf || '',
          phone: data.phone || '',
          addresses: [],
          savedPaymentMethods: data.saved_payment_methods || [],
          totalOrders: data.total_orders || 0,
          totalSpent: Number(data.total_spent) || 0,
          averageTicket: Number(data.average_ticket) || 0,
          lastAccess: data.last_access || new Date().toISOString(),
          wishlist: data.wishlist || [],
        });
      } else {
        // Create basic profile if none exists
        setUser({
          id: userId,
          name: email.split('@')[0],
          email: email,
          cpf: '',
          phone: '',
          addresses: [],
          totalOrders: 0,
          totalSpent: 0,
          averageTicket: 0,
          lastAccess: new Date().toISOString(),
          wishlist: [],
        });
      }

      // Check admin status in admin_users table
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      setIsAdmin(Boolean(adminData));
    } catch (err) {
      console.error('Error fetching Supabase profile:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Fallback mode for local development before Supabase keys are provided
      const customers = getCustomers();
      if (customers.length > 0) {
        setUser(customers[0]);
      }
      setIsAdmin(localStorage.getItem('aura_admin_authenticated') === 'true');
      setIsLoading(false);
      return;
    }

    // Supabase Auth listener
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase Auth: Sign In Customer
  const signInCustomer = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      // Local fallback
      const ok = loginAsCustomer(email);
      return { success: ok, error: ok ? undefined : 'Usuário não encontrado.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await fetchUserProfile(data.user.id, data.user.email || '');
    }

    return { success: true };
  };

  // Supabase Auth: Sign Up Customer
  const signUpCustomer = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    cpf?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const created = registerCustomer({ email, name, phone, cpf });
      return { success: Boolean(created) };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name,
          phone: phone || '',
          cpf: cpf || '',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await fetchUserProfile(data.user.id, data.user.email || '');
    }

    return { success: true };
  };

  // Supabase Auth: Sign In Admin (Real role verification)
  const signInAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const ok = loginAdmin(email, password);
      return { success: ok, error: ok ? undefined : 'Credenciais inválidas.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { data: adminRecord, error: adminErr } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (adminErr || !adminRecord) {
        await supabase.auth.signOut();
        return { success: false, error: 'Acesso negado: Este usuário não possui privilégios de administrador.' };
      }

      setIsAdmin(true);
      await fetchUserProfile(data.user.id, data.user.email || '');
      return { success: true };
    }

    return { success: false, error: 'Falha ao autenticar administrador.' };
  };

  // Supabase Auth: Password Reset
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  // Supabase Auth: Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('aura_admin_authenticated');
  };

  // Update Profile
  const updateProfile = async (data: Partial<CustomerProfile>) => {
    if (!user) return;

    if (isSupabaseConfigured()) {
      await supabase
        .from('profiles')
        .update({
          name: data.name ?? user.name,
          phone: data.phone ?? user.phone,
          cpf: data.cpf ?? user.cpf,
          wishlist: data.wishlist ?? user.wishlist,
          saved_payment_methods: data.savedPaymentMethods ?? user.savedPaymentMethods,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  // --- LEGACY SYNC METHODS (Fallbacks) ---
  const loginAsCustomer = (email: string): boolean => {
    const customers = getCustomers();
    const found = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const registerCustomer = (data: Partial<CustomerProfile>): CustomerProfile => {
    const created = saveCustomerProfile(data);
    setUser(created);
    return created;
  };

  const loginAdmin = (_email: string, pass: string): boolean => {
    // Only used if Supabase is not connected
    if (pass === 'AuraAdmin2026!' || pass === 'admin123' || pass === 'aura2026') {
      setIsAdmin(true);
      localStorage.setItem('aura_admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    signOut();
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('aura_admin_authenticated');
    if (isSupabaseConfigured()) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        signInCustomer,
        signUpCustomer,
        signInAdmin,
        signOut,
        resetPassword,
        updateProfile,
        loginAsCustomer,
        registerCustomer,
        loginAdmin,
        logout,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
