import React, { useState } from 'react';
import { User, MapPin, Shield, Check, Save, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatCPF, formatPhone } from '../../lib/utils';

export const AccountPage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Default address fields
  const defaultAddr = user?.addresses[0] || {
    street: 'Av. Paulista',
    number: '1500',
    complement: 'Apto 42',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
  };

  const [street, setStreet] = useState(defaultAddr.street);
  const [number, setNumber] = useState(defaultAddr.number);
  const [complement, setComplement] = useState(defaultAddr.complement || '');
  const [neighborhood, setNeighborhood] = useState(defaultAddr.neighborhood);
  const [city, setCity] = useState(defaultAddr.city);
  const [state, setState] = useState(defaultAddr.state);
  const [cep, setCep] = useState(defaultAddr.cep);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      cpf: formatCPF(cpf),
      phone: formatPhone(phone),
      addresses: [
        {
          recipientName: name,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          cep,
          isDefault: true,
        },
      ],
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-border pb-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Painel do Cliente</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Minha Conta</h1>
        <p className="text-xs text-muted-foreground mt-1">Gerencie seus dados pessoais, telefone, CPF e endereços salvos.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Perfil e endereço atualizados com sucesso!
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Personal Details */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
            <User className="w-5 h-5 text-primary" /> Dados Pessoais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-foreground mb-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
            <MapPin className="w-5 h-5 text-primary" /> Endereço Principal de Entrega
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-foreground mb-1">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-foreground mb-1">Rua / Logradouro</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">UF</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none uppercase"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods Details */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4" id="pagamento">
          <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
            <CreditCard className="w-5 h-5 text-primary" /> Formas de Pagamento Cadastradas
          </h2>

          <div className="space-y-3">
            {user?.savedPaymentMethods && user.savedPaymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.savedPaymentMethods.map((pm) => (
                  <div key={pm.id} className="p-4 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {pm.cardBrand || 'CARTÃO'}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-foreground block">
                          •••• •••• •••• {pm.cardLastFour || '4242'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Titular: {pm.cardHolderName || user.name} • Exp: {pm.expiryDate || '12/28'}
                        </span>
                      </div>
                    </div>
                    {pm.isDefault && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md uppercase">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-muted/30 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                Nenhum cartão de crédito cadastrado ainda. Salve seus dados ao realizar um pedido ou no cadastro!
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3.5 px-8 rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Salvar Alterações no Perfil
        </button>
      </form>
    </div>
  );
};
