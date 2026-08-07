import React, { createContext, useContext, useState } from 'react';
import { CustomerProfile } from '../types';
import { getCustomers, saveCustomerProfile } from '../lib/base44Client';

interface AuthContextType {
  user: CustomerProfile | null;
  isAdmin: boolean;
  loginAsCustomer: (email: string) => boolean;
  registerCustomer: (data: Partial<CustomerProfile>) => CustomerProfile;
  logout: () => void;
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  updateProfile: (data: Partial<CustomerProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerProfile | null>(() => {
    const customers = getCustomers();
    return customers.length > 0 ? customers[0] : null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('aura_admin_authenticated') === 'true';
  });

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

  const logout = () => {
    setUser(null);
  };

  const loginAdmin = (email: string, pass: string): boolean => {
    // Valid passwords for admin access
    const validPasses = ['admin', 'admin123', '123456', 'aura2026'];
    const validEmail = email.toLowerCase().includes('admin') || email.toLowerCase().includes('aura');

    if (validPasses.includes(pass) || (validEmail && validPasses.includes(pass))) {
      setIsAdmin(true);
      localStorage.setItem('aura_admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('aura_admin_authenticated');
  };

  const updateProfile = (data: Partial<CustomerProfile>) => {
    if (!user) return;
    const updated = saveCustomerProfile({ ...user, ...data });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loginAsCustomer,
        registerCustomer,
        logout,
        loginAdmin,
        logoutAdmin,
        updateProfile,
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
