import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, FileText, MapPin, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useViaCep } from '../../hooks/useViaCep';
import { formatCPF, formatPhone, formatCEP } from '../../lib/utils';
import { SavedPaymentMethod } from '../../types';

export const CustomerAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('modo') === 'cadastro' ? 'register' : 'login';

  const { loginAsCustomer, registerCustomer } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Address State with ViaCEP
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const { fetchAddressByCep, loading: cepLoading, error: cepError } = useViaCep();

  // Saved Payment Method Option
  const [addPayment, setAddPayment] = useState(false);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const [regError, setRegError] = useState('');

  // Handle CEP Blur
  const handleCepBlur = async () => {
    if (!cep) return;
    const data = await fetchAddressByCep(cep);
    if (data) {
      setStreet(data.street || '');
      setNeighborhood(data.neighborhood || '');
      setCity(data.city || '');
      setState(data.state || '');
    }
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail) {
      setLoginError('Por favor, informe seu e-mail de cadastro.');
      return;
    }

    const success = loginAsCustomer(loginEmail);
    if (success) {
      navigate('/minha-conta');
    } else {
      setLoginError('E-mail não encontrado. Crie uma conta no formulário ao lado!');
    }
  };

  // Quick Demo Login
  const handleQuickDemoLogin = (email: string) => {
    loginAsCustomer(email);
    navigate('/minha-conta');
  };

  // Submit Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName || !regEmail || !regPassword) {
      setRegError('Preencha os campos obrigatórios (Nome, E-mail e Senha).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não coincidem!');
      return;
    }

    const savedPaymentMethods: SavedPaymentMethod[] = [];
    if (addPayment && cardNumber) {
      savedPaymentMethods.push({
        id: `card-${Date.now()}`,
        type: 'credit_card',
        cardHolderName: cardHolder || regName,
        cardLastFour: cardNumber.slice(-4) || '4242',
        cardBrand: 'Visa',
        expiryDate: cardExpiry || '12/28',
        isDefault: true,
      });
    }

    const created = registerCustomer({
      name: regName,
      email: regEmail,
      cpf: formatCPF(regCpf),
      phone: formatPhone(regPhone),
      addresses: [
        {
          recipientName: regName,
          cep: formatCEP(cep),
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          isDefault: true,
        },
      ],
      savedPaymentMethods,
      wishlist: [],
    });

    if (created) {
      navigate('/minha-conta');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Title */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Área de Clientes Aura</span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-foreground">
          {mode === 'login' ? 'Acesse Sua Conta' : 'Crie Seu Cadastro de Cliente'}
        </h1>
        <p className="text-xs text-muted-foreground">
          Gerencie seus pedidos, favoritos, cartões salvos e endereços de entrega.
        </p>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="flex justify-center">
        <div className="bg-muted p-1 rounded-2xl inline-flex gap-1 border border-border shadow-inner">
          <button
            onClick={() => setMode('login')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'login'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar na Conta
          </button>
          <button
            onClick={() => setMode('register')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              mode === 'register'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>
      </div>

      {/* Forms Container */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-lg max-w-3xl mx-auto">
        {mode === 'login' ? (
          <motion.form
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLoginSubmit}
            className="space-y-6 text-xs max-w-md mx-auto"
          >
            {loginError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3.5 rounded-xl text-xs font-medium">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-foreground mb-1">E-mail de Cadastro *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Entrar na Minha Conta</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Login Option */}
            <div className="pt-6 border-t border-border space-y-3 text-center">
              <span className="text-[11px] text-muted-foreground block font-medium">
                Ou acesse com a conta de demonstração cadastrada:
              </span>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('mariana.duarte@gmail.com')}
                className="w-full py-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Acessar como Mariana Duarte (Cliente Demo)</span>
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.form
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleRegisterSubmit}
            className="space-y-6 text-xs"
          >
            {regError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3.5 rounded-xl text-xs font-medium">
                {regError}
              </div>
            )}

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-2">
                <User className="w-4 h-4 text-primary" /> 1. Dados Pessoais de Cadastro
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Duarte"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Confirmar Senha *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">CPF (opcional)</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={regCpf}
                    onChange={(e) => setRegCpf(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-2">
                <MapPin className="w-4 h-4 text-primary" /> 2. Endereço Principal para Entregas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onBlur={handleCepBlur}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                  {cepLoading && <span className="text-[10px] text-primary">Buscando CEP...</span>}
                  {cepError && <span className="text-[10px] text-destructive">{cepError}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-foreground mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Rua ou Avenida"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Número</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Complemento</label>
                  <input
                    type="text"
                    placeholder="Apto, Bloco, etc."
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">UF</label>
                  <input
                    type="text"
                    placeholder="SP"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Formas de Pagamento Salvas */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> 3. Cadastrar Forma de Pagamento Preferida
                </h3>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-primary">
                  <input
                    type="checkbox"
                    checked={addPayment}
                    onChange={(e) => setAddPayment(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>Adicionar Cartão Agora</span>
                </label>
              </div>

              {addPayment && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-foreground mb-1">Nome no Cartão</label>
                    <input
                      type="text"
                      placeholder="Como impresso no cartão"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      placeholder="•••• •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Validade (MM/AA)</label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Cadastro de Cliente</span>
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
};
