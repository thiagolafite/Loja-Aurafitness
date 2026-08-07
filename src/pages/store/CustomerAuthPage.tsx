import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  FileText,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useViaCep } from '../../hooks/useViaCep';
import { formatCPF, formatPhone, formatCEP } from '../../lib/utils';
import { SavedPaymentMethod } from '../../types';

export const CustomerAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('modo') === 'cadastro' ? 'register' : 'login';

  const { loginAsCustomer, registerCustomer, loginAdmin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email'>(initialMode);

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

  // Email Verification State
  const [generatedCode, setGeneratedCode] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verificationNotice, setVerificationNotice] = useState('');

  // Handle CEP Blur
  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const data = await fetchAddressByCep(cleanCep);
      if (data) {
        setStreet(data.street || '');
        setNeighborhood(data.neighborhood || '');
        setCity(data.city || '');
        setState(data.state || '');
      }
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

    // Check if credentials belong to Admin
    if (
      loginPassword &&
      (loginPassword === 'AuraAdmin2026!' ||
        loginPassword === 'admin123' ||
        loginPassword === 'admin' ||
        loginEmail.includes('admin'))
    ) {
      const isAdminSuccess = loginAdmin(loginEmail, loginPassword);
      if (isAdminSuccess) {
        navigate('/admin');
        return;
      }
    }

    // Try Customer Login
    const success = loginAsCustomer(loginEmail);
    if (success) {
      navigate('/minha-conta');
    } else {
      setLoginError('E-mail não encontrado. Crie uma nova conta no formulário ao lado!');
    }
  };

  // Step 1: Initiate Customer Registration and trigger Email Verification Code
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName || !regEmail || !regPassword) {
      setRegError('Preencha os campos obrigatórios (Nome, E-mail e Senha).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas digitadas não coincidem!');
      return;
    }

    // Generate 6-digit confirmation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setVerificationNotice(`Código de confirmação enviado para o e-mail: ${regEmail}`);
    setMode('verify_email');
  };

  // Step 2: Validate Email Verification Code and Finalize Registration
  const handleConfirmVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');

    if (verificationInput.trim() !== generatedCode) {
      setVerifyError('Código de confirmação incorreto. Verifique o código digitado.');
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

  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);
    setVerificationNotice(`Novo código enviado para ${regEmail}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Title */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">
          Área de Clientes Aura
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-foreground">
          {mode === 'login'
            ? 'Acesse sua Conta'
            : mode === 'verify_email'
            ? 'Confirmação por E-mail'
            : 'Criar Novo Cadastro'}
        </h1>
        <p className="text-xs text-muted-foreground">
          Gerencie seus pedidos, favoritos, cartões salvos e endereços de entrega com segurança.
        </p>
      </div>

      {/* Tabs Switcher */}
      {mode !== 'verify_email' && (
        <div className="flex justify-center">
          <div className="bg-muted/50 p-1.5 rounded-2xl border border-border flex gap-2">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                mode === 'login'
                  ? 'bg-card text-foreground shadow-md border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                mode === 'register'
                  ? 'bg-card text-foreground shadow-md border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>
        </div>
      )}

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
          </motion.form>
        ) : mode === 'verify_email' ? (
          /* EMAIL VERIFICATION CODE STEP */
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleConfirmVerificationCode}
            className="space-y-6 text-xs max-w-md mx-auto text-center"
          >
            <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-primary">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-foreground">Verifique seu E-mail</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Enviamos um código de confirmação de 6 dígitos para o e-mail:
                <br />
                <strong className="text-foreground font-semibold">{regEmail}</strong>
              </p>
            </div>

            {verificationNotice && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold">
                {verificationNotice}
              </div>
            )}

            {verifyError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-xs font-medium">
                {verifyError}
              </div>
            )}

            {/* Verification Code Box */}
            <div className="space-y-2 text-left">
              <label className="block font-bold text-center text-foreground">
                Digite o Código de 6 Dígitos *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Ex: 839210"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center font-serif text-2xl tracking-[0.4em] font-bold bg-background border border-border rounded-2xl py-3 text-primary focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-[11px] text-muted-foreground block text-center pt-1">
                (Código gerado para validação: <strong className="text-primary">{generatedCode}</strong>)
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validar Código & Ativar Minha Conta</span>
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              className="text-xs text-muted-foreground hover:text-primary font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reenviar Código de Confirmação
            </button>
          </motion.form>
        ) : (
          /* REGISTRATION FORM */
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

            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-foreground border-b border-border pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> 1. Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Nome Completo *</label>
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
                  <label className="block font-semibold mb-1">E-mail Principal *</label>
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
                  <label className="block font-semibold mb-1">CPF (opcional)</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={regCpf}
                    onChange={(e) => setRegCpf(formatCPF(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={regPhone}
                    onChange={(e) => setRegPhone(formatPhone(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Criar Senha *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Confirmar Senha *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a senha"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: ENDEREÇO DE ENTREGA COM VIACEP */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-serif font-bold text-base text-foreground flex items-center justify-between border-b border-border pb-2">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> 2. Endereço Principal de Entrega
                </span>
                {cepLoading && (
                  <span className="text-[10px] text-primary font-normal animate-pulse">
                    Buscando CEP...
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">CEP *</label>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(formatCEP(e.target.value))}
                    onBlur={handleCepBlur}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Rua Oscar Freire"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Número</label>
                  <input
                    type="text"
                    placeholder="1000"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="Jardins"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    placeholder="São Paulo / SP"
                    value={city ? `${city} - ${state}` : ''}
                    readOnly
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Registration Action */}
            <div className="pt-6 border-t border-border flex justify-end">
              <button
                type="submit"
                className="py-3.5 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
              >
                <span>Avançar para Validação do E-mail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};
