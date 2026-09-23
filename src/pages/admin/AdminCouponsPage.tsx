import React, { useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import { getCoupons, saveCoupon, deleteCoupon } from '../../lib/dataClient';
import { Coupon } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => getCoupons());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [value, setValue] = useState(10);
  const [minSpend, setMinSpend] = useState(100);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    saveCoupon({
      code: code.toUpperCase(),
      discountType,
      value,
      minSpend,
      isActive: true,
    });
    setCoupons(getCoupons());
    setIsModalOpen(false);
    setCode('');
  };

  const handleDelete = (id: string) => {
    deleteCoupon(id);
    setCoupons(getCoupons());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Gestão de Cupons</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Cupons de Desconto</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Criar Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c) => (
          <div key={c.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-lg text-primary">{c.code}</span>
              <button onClick={() => handleDelete(c.id)} className="text-destructive p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs font-semibold text-foreground">
              {c.discountType === 'percentage' ? `${c.value}% OFF` : c.discountType === 'fixed' ? `${formatCurrency(c.value)} OFF` : 'Frete Grátis'}
            </div>
            <div className="text-[11px] text-muted-foreground">Mínimo: {formatCurrency(c.minSpend || 0)}</div>
            <div className="text-[11px] text-muted-foreground">Usos efetuados: {c.usedCount}</div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-card border border-border p-6 rounded-2xl w-full max-w-md space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-foreground">Novo Cupom de Desconto</h3>
            <div>
              <label className="block font-semibold mb-1">Código do Cupom</label>
              <input type="text" required placeholder="EX: AURA20" value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 uppercase outline-none" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Tipo de Desconto</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none">
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
                <option value="free_shipping">Frete Grátis</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Valor do Desconto</label>
              <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Mínimo de Compra (R$)</label>
              <input type="number" value={minSpend} onChange={(e) => setMinSpend(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-secondary rounded-xl font-semibold">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white font-bold rounded-xl shadow">Criar Cupom</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
