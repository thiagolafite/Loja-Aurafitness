import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  User,
  Instagram,
  Youtube,
  Menu,
  X,
  ShieldAlert,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SearchModal } from './SearchModal';
import { AdminLoginModal } from '../admin/AdminLoginModal';
import { getProducts, getStoreSections } from '../../lib/dataClient';
import { Product, StoreSection } from '../../types';
import {
  STORE_CATEGORIES,
  normalizeCategoryName,
  getCategoryPhoto,
  getStoredCategories,
  AvailableCategory,
  isProductMatchingCategory,
} from '../../lib/productClassifier';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { totalItemCount, openCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin, logoutAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());
  const [storeSections, setStoreSections] = useState<StoreSection[]>(() => getStoreSections());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [isCategoriesMobileExpanded, setIsCategoriesMobileExpanded] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
    setCategories(getStoredCategories());
    setStoreSections(getStoreSections());
    const syncCats = () => {
      setCategories(getStoredCategories());
      setProducts(getProducts());
    };
    const syncProds = () => {
      setCategories(getStoredCategories());
      setProducts(getProducts());
    };
    const syncSections = () => setStoreSections(getStoreSections());
    window.addEventListener('aura_categories_updated', syncCats);
    window.addEventListener('aura_products_updated', syncProds);
    window.addEventListener('aura_sections_updated', syncSections);
    window.addEventListener('storage', syncCats);
    window.addEventListener('storage', syncSections);
    return () => {
      window.removeEventListener('aura_categories_updated', syncCats);
      window.removeEventListener('aura_products_updated', syncProds);
      window.removeEventListener('aura_sections_updated', syncSections);
      window.removeEventListener('storage', syncCats);
      window.removeEventListener('storage', syncSections);
    };
  }, []);

  const visibleMenuCategories = categories;

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'LANÇAMENTOS', path: '/catalogo?ordenar=mais-recentes' },
    { name: 'PROMOÇÃO', path: '/catalogo?promocao=true' },
    { name: 'MAIS VENDIDOS', path: '/catalogo?ordenar=mais-vendidos' },
    { name: 'CONJUNTOS', path: '/catalogo?categoria=Conjuntos' },
    { name: 'MACACÃO', path: '/catalogo?categoria=Macacão' },
    { name: 'MACAQUINHO', path: '/catalogo?categoria=Macaquinho' },
    { name: 'BLOG', path: '/blog' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 shadow-xl select-none">
        {/* Very Top Bar com Degradê Feminino Delicado */}
        <div className="bg-gradient-to-r from-[#0d2818] via-[#164024] to-[#0d2818] text-rose-100 text-[11px] text-center py-1.5 px-4 font-medium tracking-wider border-b border-rose-300/20 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Frete Grátis acima de R$299 • Modelagem que valoriza suas curvas ✨</span>
        </div>

        {/* Main Header Bar */}
        <div className="bg-gradient-to-r from-[#11351e] via-[#1a4a2b] to-[#123820] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-white/10">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-rose-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo Aura Fitness - Right Aligned Stacked with Sirenik font */}
          <Link to="/" className="flex flex-col items-end justify-center leading-none group py-0.5 select-none text-right">
            <span className="font-sirenik text-3xl sm:text-4xl font-normal tracking-[0.08em] text-[#fbf5ed] group-hover:text-rose-200 transition-colors drop-shadow-sm">
              Aura
            </span>
            <span className="font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-amber-300/95 group-hover:text-rose-100 uppercase -mt-0.5">
              Fitness
            </span>
          </Link>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Icons */}
            <div className="hidden sm:flex items-center gap-2 text-rose-100/80">
              <a
                href="https://www.instagram.com/adoro.aura/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white hover:scale-110 transition-all p-1"
                title="Instagram @adoro.aura"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white hover:scale-110 transition-all p-1"
                title="Youtube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <span className="text-white/20 mx-1">|</span>
            </div>

            {/* Pill Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Buscar looks dos sonhos..."
                onClick={() => setIsSearchOpen(true)}
                readOnly
                className="bg-black/20 border border-white/15 hover:border-rose-300/40 text-white placeholder-rose-100/60 pl-8 pr-4 py-1 text-xs rounded-full h-8 w-52 focus:outline-none cursor-pointer transition-all shadow-inner"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-200/80" />
            </div>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden text-rose-100 hover:text-white p-1"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-rose-100 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-rose-200" />}
            </button>

            {/* Customer User Account */}
            {user ? (
              <div className="relative group">
                <Link
                  to="/minha-conta"
                  className="flex items-center gap-1.5 text-rose-100 hover:text-white py-1 px-2.5 rounded-full hover:bg-white/10 border border-white/10 transition-colors"
                  title="Minha Conta"
                >
                  <User className="w-4 h-4 text-amber-300" />
                  <span className="hidden md:inline text-xs font-semibold">
                    Olá, {user.name.split(' ')[0]}
                  </span>
                </Link>

                {/* Customer Dropdown */}
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0f2e1a] border border-rose-300/30 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50 text-xs text-white backdrop-blur-md">
                  <Link
                    to="/minha-conta"
                    className="block px-4 py-2 hover:bg-white/10 transition-colors"
                  >
                    👤 Minha Conta
                  </Link>
                  <Link
                    to="/meus-pedidos"
                    className="block px-4 py-2 hover:bg-white/10 transition-colors"
                  >
                    🛍️ Meus Pedidos
                  </Link>
                  <Link
                    to="/favoritos"
                    className="block px-4 py-2 hover:bg-white/10 transition-colors"
                  >
                    ❤️ Meus Favoritos
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 hover:bg-amber-950/60 text-amber-300 font-bold transition-colors border-t border-white/10"
                    >
                      🛡️ Painel de Administração
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-rose-950/60 text-rose-300 transition-colors border-t border-white/10 mt-1"
                  >
                    🚪 Sair da Conta
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-rose-100 hover:text-white px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold border border-rose-200/30 transition-all shadow-sm"
                title="Entrar ou Cadastrar"
              >
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Entrar / Cadastrar</span>
              </Link>
            )}

            {/* Shopping Bag Icon */}
            <button
              onClick={openCart}
              className="text-rose-100 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors relative"
              title="Sacola de Compras"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-extrabold shadow">
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* Admin Badge - Só aparece quando o usuário estiver logado E tiver permissão de administrador */}
            {user && isAdmin && (
              <div className="flex items-center gap-1">
                <Link
                  to="/admin"
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 hover:bg-amber-300 transition-colors shadow-sm"
                  title="Acessar Painel Admin"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Painel Admin</span>
                </Link>
                <button
                  onClick={logoutAdmin}
                  className="p-1.5 text-rose-300 hover:text-rose-100 transition-colors"
                  title="Sair do Modo Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Row (Lower Header Bar) with Categories Mega-Menu */}
        <nav className="bg-[#ECF2E9] text-[#164024] hidden lg:flex items-center justify-center gap-7 py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-t border-[#164024]/10 shadow-sm">
          <Link
            to="/"
            className="hover:text-emerald-700 transition-colors py-0.5 relative hover:after:w-full after:w-0 after:h-0.5 after:bg-emerald-700 after:absolute after:bottom-0 after:left-0 after:transition-all"
          >
            HOME
          </Link>

          {/* Interactive Categories Mega-Menu Trigger */}
          <div
            className="relative py-1"
            onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
            onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
          >
            <button
              onClick={() => {
                navigate('/catalogo');
              }}
              className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors py-0.5 text-xs font-semibold uppercase tracking-wider relative group"
            >
              <span className="text-[#164024] font-extrabold">CATEGORIAS</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isCategoriesDropdownOpen ? 'rotate-180 text-emerald-700' : 'text-[#164024]/70'
                }`}
              />
            </button>

            {/* Mega-Menu Dropdown */}
            <AnimatePresence>
              {isCategoriesDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[580px] bg-[#1a3816] border border-[#3b682d] rounded-2xl shadow-2xl overflow-hidden z-50 text-white p-5 backdrop-blur-md"
                >
                  {/* Mega-Menu Header */}
                  <div className="flex items-center justify-between border-b border-[#2d5624] pb-3 mb-3.5">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-amber-200/90 block">
                        EXPLORE NOSSAS PEÇAS
                      </span>
                      <h4 className="font-serif font-bold text-base text-white">
                        Categorias Aura Fitness
                      </h4>
                    </div>
                    <Link
                      to="/catalogo"
                      onClick={() => setIsCategoriesDropdownOpen(false)}
                      className="text-[11px] font-bold text-amber-300 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10"
                    >
                      <span>Ver Tudo ({products.length} peças)</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* 2-Column Categories Grid */}
                  <div className="grid grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {visibleMenuCategories.map((cat) => {
                      const count = products.filter(
                        (p) => isProductMatchingCategory(p, cat.name)
                      ).length;

                      return (
                        <Link
                          key={cat.name}
                          to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                          onClick={() => setIsCategoriesDropdownOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/15 hover:border-amber-300/40 border border-transparent transition-all group/item text-left"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 group-hover/item:scale-105 transition-transform shadow-sm">
                            <img
                              src={getCategoryPhoto(cat.name, products)}
                              alt={cat.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-white group-hover/item:text-amber-200 transition-colors truncate">
                                {cat.name}
                              </span>
                              {count > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                  {count} {count === 1 ? 'peça' : 'peças'}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/60 line-clamp-1 mt-0.5">
                              {cat.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Mega-Menu Footer */}
                  <div className="mt-4 pt-3 border-t border-[#2d5624] flex items-center justify-between text-xs text-white/70">
                    <span className="text-[11px] flex items-center gap-1.5 text-[#b2c8a9]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Peças modeladoras com zero transparência</span>
                    </span>
                    <Link
                      to="/catalogo"
                      onClick={() => setIsCategoriesDropdownOpen(false)}
                      className="text-[11px] font-bold text-amber-300 hover:underline"
                    >
                      Ir para o Catálogo &rarr;
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Seções da Loja em Destaque nos Menus (ex: Moda Verão, Black Friday) */}
          {storeSections
            .filter((s) => s.active && s.showInMenu)
            .map((sec) => (
              <Link
                key={sec.id}
                to={`/catalogo?secao=${encodeURIComponent(sec.slug)}`}
                className="hover:text-emerald-700 text-[#164024] font-bold transition-all py-0.5 relative flex items-center gap-1.5 group"
              >
                <span>{sec.name}</span>
                {sec.badge && (
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm uppercase">
                    {sec.badge}
                  </span>
                )}
              </Link>
            ))}

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="hover:text-emerald-700 transition-colors py-0.5 relative hover:after:w-full after:w-0 after:h-0.5 after:bg-emerald-700 after:absolute after:bottom-0 after:left-0 after:transition-all"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-[#1f3d19] text-white border-t border-[#2d5624] px-6 py-4 space-y-3"
            >
              <div className="flex flex-col gap-1 font-semibold text-xs uppercase tracking-wider">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-amber-200 py-2 border-b border-[#2b5223]"
                >
                  HOME
                </Link>

                {/* Seções em Destaque no Menu Mobile (Moda Verão, Black Friday) */}
                {storeSections
                  .filter((sec) => sec.active && sec.showInMenu)
                  .map((sec) => (
                    <Link
                      key={sec.id}
                      to={`/catalogo?secao=${encodeURIComponent(sec.slug)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-amber-300 font-bold py-2 border-b border-[#2b5223] flex items-center justify-between"
                    >
                      <span>{sec.name}</span>
                      {sec.badge && (
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                          {sec.badge}
                        </span>
                      )}
                    </Link>
                  ))}

                {/* Mobile Categories Accordion */}
                <div className="border-b border-[#2b5223] py-2">
                  <button
                    onClick={() => setIsCategoriesMobileExpanded(!isCategoriesMobileExpanded)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-left text-amber-300 py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🏷️</span>
                      <span>CATEGORIAS DA LOJA</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isCategoriesMobileExpanded ? 'rotate-180 text-amber-200' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isCategoriesMobileExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-2 pt-2 pb-1 space-y-1.5 border-l border-white/20 ml-2 mt-2"
                      >
                        {visibleMenuCategories.map((cat) => {
                          const count = products.filter(
                            (p) => isProductMatchingCategory(p, cat.name)
                          ).length;

                          return (
                            <Link
                              key={cat.name}
                              to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center justify-between text-xs text-white/90 hover:text-white py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                              <span className="flex items-center gap-2.5">
                                <img
                                  src={getCategoryPhoto(cat.name, products)}
                                  alt={cat.name}
                                  className="w-6 h-6 rounded-md object-cover object-top border border-white/20 shrink-0"
                                />
                                <span className="font-medium">{cat.name}</span>
                              </span>
                              {count > 0 && (
                                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                                  {count}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                        <Link
                          to="/catalogo"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block text-[11px] text-amber-300 font-bold pt-2 px-2 hover:underline"
                        >
                          👉 Ver Todas as Categorias ({products.length} peças)
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {navLinks.slice(1).map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:text-amber-200 py-2 border-b border-[#2b5223]"
                  >
                    {link.name}
                  </Link>
                ))}

                {user && isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-amber-300 font-bold py-2 border-b border-[#2b5223]"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-300" />
                    <span>Painel Administrativo</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
      />
    </>
  );
};
