import React, { useState } from 'react';
import { Plus, Edit, Trash2, Sparkles, Search, Image as ImageIcon, Check, X, Tag, FileSpreadsheet, FolderPlus } from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, aiGenerateProductDescription, aiGenerateSeoMeta } from '../../lib/base44Client';
import { formatCurrency } from '../../lib/utils';
import { Product } from '../../types';
import { ProductImporterModal } from '../../components/admin/ProductImporterModal';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Filtered List
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenNewModal = () => {
    setEditingProduct({
      name: '',
      category: 'Leggings',
      price: 149.90,
      promotionalPrice: 129.90,
      sku: `AUR-${Date.now().toString().slice(-4)}`,
      barcode: '7891234560000',
      weight: 250,
      brand: 'Aura Fitness',
      description: '',
      fullDescription: '',
      images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'],
      sizes: ['P', 'M', 'G'],
      colors: [{ name: 'Verde Oliva', hex: '#5F6F3A' }],
      materials: ['Poliamida', 'Elastano'],
      stock: { 'P-Verde Oliva': 10, 'M-Verde Oliva': 15, 'G-Verde Oliva': 10 },
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      isActive: true,
      seo: { title: '', description: '', keywords: [] },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
      setProducts(getProducts());
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    saveProduct(editingProduct);
    setProducts(getProducts());
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Base44 AI Integration: Generate Product Description & SEO
  const handleGenerateAiDescription = async () => {
    if (!editingProduct?.name) {
      alert('Digite primeiro o nome do produto para a IA gerar a descrição.');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await aiGenerateProductDescription(
        editingProduct.name,
        editingProduct.category || 'Leggings',
        'Cós alto anatômico, tecnologia de alta compressão, zero transparência e efeito modelador.'
      );

      const seoRes = await aiGenerateSeoMeta(editingProduct.name, res.shortDescription);

      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              description: res.shortDescription,
              fullDescription: res.fullDescription,
              seo: {
                title: seoRes.seoTitle,
                description: seoRes.seoDescription,
                keywords: seoRes.keywords,
              },
            }
          : null
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Gestão de Catálogo</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Produtos & Variações</h1>
          <p className="text-xs text-muted-foreground mt-1">Cadastre e gerencie fotos, preços, estoque por tamanho e SEO.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Tabela/Imagens</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar por nome, SKU ou categoria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3.5">Imagem</th>
                <th className="p-3.5">Produto</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Preço</th>
                <th className="p-3.5">Estoque Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((prod) => {
                const totalStock = Object.values(prod.stock).reduce((a, b) => a + b, 0);
                return (
                  <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-10 h-12 object-cover rounded-lg border border-border"
                      />
                    </td>
                    <td className="p-3.5">
                      <span className="font-serif font-bold text-sm text-foreground block">{prod.name}</span>
                      <span className="text-[11px] text-muted-foreground">Avaliações: {prod.rating} ★ ({prod.reviewCount})</span>
                    </td>
                    <td className="p-3.5 font-medium">{prod.category}</td>
                    <td className="p-3.5 font-mono text-muted-foreground">{prod.sku}</td>
                    <td className="p-3.5">
                      {prod.promotionalPrice ? (
                        <div>
                          <span className="font-serif font-bold text-primary block">{formatCurrency(prod.promotionalPrice)}</span>
                          <span className="text-[10px] text-muted-foreground line-through">{formatCurrency(prod.price)}</span>
                        </div>
                      ) : (
                        <span className="font-serif font-bold text-foreground">{formatCurrency(prod.price)}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold ${totalStock === 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {totalStock} un.
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${prod.isActive ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                        {prod.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(prod)}
                        className="p-1.5 hover:bg-muted text-foreground rounded-lg"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 hover:bg-muted text-destructive rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / New Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-3xl rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-serif font-bold text-xl text-foreground">
                {editingProduct.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              {/* AI Auto Generator Banner Button */}
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif font-bold text-sm text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" /> Assistente de IA Base44
                  </h4>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Gere descrições completas e otimização SEO para o produto usando IA com 1 clique.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={isAiLoading}
                  className="bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors shadow-md disabled:opacity-50"
                >
                  {isAiLoading ? 'Gerando...' : 'Gerar com IA'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Categoria *</label>
                  <select
                    value={editingProduct.category || 'Leggings'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="Leggings">Leggings</option>
                    <option value="Tops">Tops</option>
                    <option value="Conjuntos">Conjuntos</option>
                    <option value="Regatas & Camisetas">Regatas & Camisetas</option>
                    <option value="Jaquetas">Jaquetas</option>
                    <option value="Shorts & Bermudas">Shorts & Bermudas</option>
                    <option value="Macacões">Macacões</option>
                    <option value="Acessórios">Acessórios</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Preço Normal (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.promotionalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, promotionalPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">URL da Imagem Principal</label>
                  <input
                    type="text"
                    value={editingProduct.images?.[0] || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Descrição Curta</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Descrição Completa Técnica</label>
                <textarea
                  rows={4}
                  value={editingProduct.fullDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="accent-primary"
                  />
                  <span>Produto em Destaque</span>
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isNewArrival || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                    className="accent-primary"
                  />
                  <span>Novidade</span>
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive ?? true}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="accent-primary"
                  />
                  <span>Ativo na Loja</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Importer Modal */}
      <ProductImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSuccess={() => setProducts(getProducts())}
      />
    </div>
  );
};
