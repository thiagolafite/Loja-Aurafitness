import React, { useState } from 'react';
import { Plus, Layers, Trash2 } from 'lucide-react';
import { getLookSets, saveLookSet, deleteLookSet, getProducts } from '../../lib/base44Client';
import { formatCurrency } from '../../lib/utils';
import { LookSet } from '../../types';

export const AdminSetsPage: React.FC = () => {
  const [sets, setSets] = useState<LookSet[]>(() => getLookSets());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const products = getProducts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [selectedProd1, setSelectedProd1] = useState(products[0]?.id || '');
  const [selectedProd2, setSelectedProd2] = useState(products[1]?.id || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = products.find((p) => p.id === selectedProd1);
    const p2 = products.find((p) => p.id === selectedProd2);

    const price1 = p1 ? p1.price : 150;
    const price2 = p2 ? p2.price : 120;
    const total = price1 + price2;
    const discounted = total * (1 - discountPercent / 100);

    saveLookSet({
      title,
      description,
      imageUrl: p1?.images[0] || 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80',
      productIds: [selectedProd1, selectedProd2],
      setDiscountPercentage: discountPercent,
      totalPrice: total,
      discountedPrice: discounted,
      isActive: true,
    });

    setSets(getLookSets());
    setIsModalOpen(false);
    setTitle('');
  };

  const handleDelete = (id: string) => {
    deleteLookSet(id);
    setSets(getLookSets());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Gestão de Monte Seu Look</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Conjuntos (Looks)</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Criar Conjunto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sets.map((look) => (
          <div key={look.id} className="bg-card border border-border p-5 rounded-2xl flex gap-4">
            <img src={look.imageUrl} alt="" className="w-24 h-28 object-cover rounded-xl shrink-0" />
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex justify-between items-start">
                <span className="font-serif font-bold text-base text-foreground">{look.title}</span>
                <button onClick={() => handleDelete(look.id)} className="text-destructive p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-muted-foreground line-clamp-2">{look.description}</p>
              <div className="pt-2 font-serif font-bold text-primary text-sm">
                {formatCurrency(look.discountedPrice)} <span className="text-muted-foreground text-xs line-through">{formatCurrency(look.totalPrice)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-card border border-border p-6 rounded-2xl w-full max-w-md space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-foreground">Novo Conjunto Look</h3>
            <div>
              <label className="block font-semibold mb-1">Título do Look</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Descrição</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Peça 1</label>
                <select value={selectedProd1} onChange={(e) => setSelectedProd1(e.target.value)} className="w-full bg-background border border-border rounded-xl px-2 py-2 outline-none">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Peça 2</label>
                <select value={selectedProd2} onChange={(e) => setSelectedProd2(e.target.value)} className="w-full bg-background border border-border rounded-xl px-2 py-2 outline-none">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-secondary rounded-xl font-semibold">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white font-bold rounded-xl shadow">Salvar Look</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
