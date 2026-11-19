import React, { useState } from 'react';
import { X, UserPlus, Cake, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { upsertCrmCustomer } from '../services/crmService';
import { formatCPF, formatPhone } from '../../lib/utils';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [origin, setOrigin] = useState<'site' | 'instagram' | 'whatsapp' | 'indicacao' | 'google'>('instagram');
  const [preferredSize, setPreferredSize] = useState('M');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [needsAttention, setNeedsAttention] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    upsertCrmCustomer({
      name: name.trim(),
      email: email.trim(),
      phone: formatPhone(phone),
      cpf: formatCPF(cpf),
      birthDate: birthDate || undefined,
      origin,
      preferredSizes: [preferredSize],
      needsManualAttention: needsAttention,
      addresses: city
        ? [
            {
              recipientName: name.trim(),
              cep: '00000-000',
              street: 'Cadastrado via CRM',
              number: 'S/N',
              neighborhood: 'Centro',
              city,
              state,
              isDefault: true,
            },
          ]
        : [],
    });

    setName('');
    setEmail('');
    setPhone('');
    setCpf('');
    setBirthDate('');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">
                Cadastrar Cliente no CRM
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sincroniza automaticamente com futuras compras pelo e-mail ou CPF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Larissa Monteiro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">E-mail *</label>
              <input
                type="email"
                required
                placeholder="larissa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">WhatsApp / Celular *</label>
              <input
                type="text"
                required
                placeholder="(11) 99999-8888"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-pink-600 dark:text-pink-400">
                🎂 Data de Aniversário
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-background border border-pink-500/40 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">CPF (opcional)</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Tamanho Preferido</label>
              <select
                value={preferredSize}
                onChange={(e) => setPreferredSize(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none"
              >
                <option value="PP">PP</option>
                <option value="P">P</option>
                <option value="M">M</option>
                <option value="G">G</option>
                <option value="GG">GG</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Origem da Cliente</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as any)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none"
              >
                <option value="instagram">Instagram (@adoro.aura)</option>
                <option value="whatsapp">WhatsApp Direto</option>
                <option value="site">Loja Virtual</option>
                <option value="indicacao">Indicação</option>
                <option value="google">Google</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none uppercase"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={needsAttention}
              onChange={(e) => setNeedsAttention(e.target.checked)}
              className="accent-rose-600 w-4 h-4"
            />
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Marcar como "Precisa de Atenção Imediata" na fila de hoje
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-muted text-foreground font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
