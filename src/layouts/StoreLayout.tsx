import React from 'react';
import { Outlet } from 'react-router-dom';
import { PromoBanner } from '../components/store/PromoBanner';
import { Navbar } from '../components/store/Navbar';
import { Footer } from '../components/store/Footer';
import { CartDrawer } from '../components/store/CartDrawer';
import { WhatsAppButton } from '../components/store/WhatsAppButton';

export const StoreLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      <Navbar />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
};
