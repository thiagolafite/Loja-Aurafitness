import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useViaCep } from '../../hooks/useViaCep';
import { formatCPF, formatPhone, formatCEP } from '../../lib/utils';

export const CustomerAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('modo') === 'cadastro' ? 'register' : 'login';

  const { signInCustomer, signUpCustomer, signInAdmin, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Address State with ViaCEP
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const { fetchAddressByCep, loading: cepLoading } = useViaCep();

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
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      if (!loginEmail || !loginPassword) {
        setLoginError('Por favor, informe seu e-mail e senha de acesso.');
        setIsLoginLoading(false);
        return;
      }

      // Authenticate via Supabase Auth
      const res = await signInCustomer(loginEmail, loginPassword);
      if (res.success) {
        // Check if user is admin to redirect accordingly
        const { data: adminRecord } = await (await import('../../lib/supabaseClient')).supabase
          .from('admin_users')
          .select('id')
          .eq('email', loginEmail.trim())
          .maybeSingle();

        if (adminRecord) {
          navigate('/admin');
        } else {
          navigate('/minha-conta');
        }
      } else {
        const errorMsg = res.error?.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : res.error || 'Falha ao autenticar. Verifique seus dados.';
        setLoginError(errorMsg);
      }
    } catch (err) {
      setLoginError('Erro de conexão ao efetuar login. Tente novamente.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Submit Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsRegLoading(true);

    try {
      if (!regName || !regEmail || !regPassword) {
        setRegError('Preencha os campos obrigatórios (Nome, E-mail e Senha).');
        setIsRegLoading(false);
        return;
      }

      if (regPassword.length < 6) {
        setRegError('A senha deve conter no mínimo 6 caracteres.');
        setIsRegLoading(false);
        return;
      }

      if (regPassword !== regConfirmPassword) {
        setRegError('As senhas digitadas não coincidem!');
        setIsRegLoading(false);
        return;
      }

      const res = await signUpCustomer(
        regEmail,
        regPassword,
        regName,
        formatPhone(regPhone),
        formatCPF(regCpf)
      );

      if (res.success) {
        navigate('/minha-conta');
      } else {
        setRegError(res.error || 'Não foi possível concluir o cadastro. Verifique os dados.');
      }
    } catch (err) {
      setRegError('Erro ao processar cadastro. Tente novamente.');
    } finally {
      setIsRegLoading(false);
    }
  };

  // Submit Password Reset
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotNotice('');
    setIsForgotLoading(true);

    try {
      if (!forgotEmail) {
        setForgotError('Por favor, informe seu e-mail cadastrado.');
        setIsForgotLoading(false);
        return;
      }

      const res = await resetPassword(forgotEmail);
      if (res.success) {
        setForgotNotice(`Enviamos um link de redefinição de senha para o e-mail ${forgotEmail}. Verifique sua caixa de entrada e spam.`);
      } else {
        setForgotError(res.error || 'Não foi possível enviar o e-mail de recuperação.');
      }
    } catch (err) {
      setForgotError('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsForgotLoading(false);
    }
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
            : mode === 'forgot_password'
            ? 'Recuperar Senha'
            : 'Criar Novo Cadastro'}
        </h1>
        <p className="text-xs text-muted-foreground">
          Gerencie seus pedidos, favoritos, endereços e acompanhe suas entregas com segurança.
        </p>
      </div>

      {/* Tabs Switcher */}
      {mode !== 'forgot_password' && (
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-semibold text-foreground">Senha de Acesso *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setMode('forgot_password');
                    }}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
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
              disabled={isLoginLoading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoginLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{isLoginLoading ? 'Entrando...' : 'Entrar na Minha Conta'}</span>
            </button>
          </motion.form>
        ) : mode === 'forgot_password' ? (
          /* FORGOT PASSWORD FORM */
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleForgotSubmit}
            className="space-y-6 text-xs max-w-md mx-auto"
          >
            <div className="p-4 bg-primary/10 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-primary">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-xl text-foreground">Recuperação de Senha</h3>
              <p className="text-muted-foreground text-xs">
                Informe o e-mail associado à sua conta para receber as instruções de redefinição.
              </p>
            </div>

            {forgotNotice && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold">
                {forgotNotice}
              </div>
            )}

            {forgotError && (
              <div className="p-3.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-xs font-medium">
                {forgotError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-foreground mb-1">E-mail Cadastrado *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isForgotLoading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isForgotLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isForgotLoading ? 'Enviando link...' : 'Enviar Link de Redefinição'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-muted-foreground hover:text-primary font-semibold block text-center mx-auto pt-2"
            >
              ← Voltar para o Login
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
                  <MapPin className="w-4 h-4 text-primary" /> 2. Endereço Principal de Entrega (Opcional)
                </span>
                {cepLoading && (
                  <span className="text-[10px] text-primary font-normal animate-pulse">
                    Buscando CEP...
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">CEP</label>
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
                disabled={isRegLoading}
                className="py-3.5 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {isRegLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isRegLoading ? 'Criando Conta...' : 'Finalizar Cadastro Seguro'}</span>
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};
