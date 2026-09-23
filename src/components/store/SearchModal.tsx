import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '../../lib/dataClient';
import { formatCurrency } from '../../lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const allProducts = getProducts();

  const filteredProducts = searchTerm.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
      setSearchTerm('');
    }
  };

  const handleSelectProduct = (productId: string) => {
    navigate(`/produto/${productId}`);
    onClose();
    setSearchTerm('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative bg-card text-card-foreground border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-border flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Busque por leggings, tops, conjuntos ou peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-base placeholder:text-muted-foreground text-foreground"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {!searchTerm && (
                <div className="py-6 text-center text-muted-foreground">
                  <p className="text-sm">Digite o nome da peça ou categoria para começar a buscar.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Leggings', 'Verde Oliva', 'Tops Seamless', 'Conjuntos', 'Jaquetas'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchTerm(tag)}
                        className="text-xs bg-secondary text-secondary-foreground hover:bg-primary hover:text-white px-3 py-1.5 rounded-full transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchTerm && filteredProducts.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhum produto encontrado para "{searchTerm}".</p>
                </div>
              )}

              {filteredProducts.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Resultados ({filteredProducts.length})
                  </div>
                  {filteredProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-primary font-medium">{product.category}</span>
                        <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.promotionalPrice ? (
                            <>
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(product.promotionalPrice)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}

                  {filteredProducts.length > 5 && (
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full mt-3 py-2.5 text-center text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1"
                    >
                      Ver todos os {filteredProducts.length} produtos em Catálogo
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
