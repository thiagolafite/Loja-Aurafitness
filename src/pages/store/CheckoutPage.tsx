import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useViaCep } from '../../hooks/useViaCep';
import { createOrder, getStoreSettings } from '../../lib/base44Client';
import { formatCurrency, formatCPF, formatCEP, formatPhone } from '../../lib/utils';
import { generateWhatsAppOrderMessage } from '../../lib/whatsapp';
import confetti from 'canvas-confetti';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discountAmount, estimatedShipping, totalAmount, clearCart, appliedCoupon } = useCart();
  const { user } = useAuth();
  const { loading: loadingCep, error: cepError, fetchAddressByCep } = useViaCep();
  const settings = getStoreSettings();

  // Checkout Step: 1 = Personal Info, 2 = Address & Shipping, 3 = Payment & Confirmation
  const [step, setStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Address State
  const [cep, setCep] = useState(user?.addresses[0]?.cep || '');
  const [street, setStreet] = useState(user?.addresses[0]?.street || '');
  const [number, setNumber] = useState(user?.addresses[0]?.number || '');
  const [complement, setComplement] = useState(user?.addresses[0]?.complement || '');
  const [neighborhood, setNeighborhood] = useState(user?.addresses[0]?.neighborhood || '');
  const [city, setCity] = useState(user?.addresses[0]?.city || '');
  const [state, setState] = useState(user?.addresses[0]?.state || 'SP');

  // Shipping Method Selection
  const [selectedShippingMethod, setSelectedShippingMethod] = useState({
    id: 'express',
    name: 'Sedex Express Aura',
    deliveryDays: 2,
    price: subtotal >= 299 ? 0 : 14.90,
  });

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'boleto'>('pix');
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(
    user?.savedPaymentMethods?.[0]?.id || null
  );
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardInstallments, setCardInstallments] = useState('1');
  const [debitBank, setDebitBank] = useState('itau');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');

  // Validate and advance to Step 2
  const handleGoToStep2 = () => {
    setStep1Error('');
    const missing: string[] = [];
    if (!name.trim()) missing.push('Nome Completo');
    if (!email.trim()) missing.push('E-mail');
    if (!cpf.trim()) missing.push('CPF');
    if (!phone.trim()) missing.push('Telefone / WhatsApp');

    if (missing.length > 0) {
      setStep1Error(`Atenção: Preencha os campos obrigatórios para continuar: ${missing.join(', ')}.`);
      return;
    }
    setStep(2);
  };

  // Validate and advance to Step 3 (Payment)
  const handleGoToStep3 = () => {
    setStep2Error('');
    const missing: string[] = [];
    if (!cep.trim()) missing.push('CEP');
    if (!street.trim()) missing.push('Rua/Logradouro');
    if (!number.trim()) missing.push('Número');
    if (!neighborhood.trim()) missing.push('Bairro');
    if (!city.trim()) missing.push('Cidade');
    if (!state.trim()) missing.push('Estado (UF)');

    if (missing.length > 0) {
      setStep2Error(`Atenção: Preencha os campos de endereço obrigatórios: ${missing.join(', ')}.`);
      return;
    }
    setStep(3);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="font-serif font-bold text-2xl text-foreground">Não há itens para finalizar checkout</h2>
        <button
          onClick={() => navigate('/catalogo')}
          className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block"
        >
          Voltar à Loja
        </button>
      </div>
    );
  }

  // CEP Auto Lookup
  const handleCepBlur = async () => {
    if (cep.replace(/\D/g, '').length === 8) {
      const addr = await fetchAddressByCep(cep);
      if (addr) {
        setStreet(addr.street);
        setNeighborhood(addr.neighborhood);
        setCity(addr.city);
        setState(addr.state);
      }
    }
  };

  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
  const totalDiscounts = discountAmount + pixDiscount;
  const finalTotal = Math.max(0, subtotal - totalDiscounts + selectedShippingMethod.price);

  const handleFinishOrder = async () => {
    // Validate Step 1 personal info
    if (!name.trim() || !email.trim() || !cpf.trim() || !phone.trim()) {
      setStep(1);
      handleGoToStep2();
      return;
    }

    // Validate Step 2 shipping address
    if (!cep.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
      setStep(2);
      handleGoToStep3();
      return;
    }

    setIsSubmitting(true);

    const pixPayload = '00020126580014BR.GOV.BCB.PIX0136contato@aurafitness.com.br5204000053039865406274.705802BR5912AuraFitness6009SaoPaulo62070503***6304E2B1';
    const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`;

    let paymentDetailsObj = {};
    let initialStatus: 'pendente' | 'pago' = 'pago';

    if (paymentMethod === 'pix') {
      paymentDetailsObj = { pixQrCode: pixQrCodeUrl, pixCopyPaste: pixPayload };
      initialStatus = 'pendente';
    } else if (paymentMethod === 'credit_card') {
      paymentDetailsObj = {
        cardBrand: 'Mastercard / Visa',
        cardLastFour: cardNumber ? cardNumber.slice(-4) : '4242',
      };
      initialStatus = 'pago';
    } else if (paymentMethod === 'debit_card') {
      paymentDetailsObj = {
        cardBrand: `Débito Online (${debitBank.toUpperCase()})`,
        cardLastFour: 'DÉBITO VIRTUAL',
      };
      initialStatus = 'pago';
    } else {
      paymentDetailsObj = { boletoBarcode: '34191.79001 01043.510047 91020.150008 8 98210000027470' };
      initialStatus = 'pendente';
    }

    const newOrder = createOrder({
      customer: {
        name,
        email,
        cpf: formatCPF(cpf),
        phone: formatPhone(phone),
      },
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images[0],
        sku: item.product.sku,
        size: item.selectedSize,
        colorName: item.selectedColor.name,
        price: item.product.promotionalPrice || item.product.price,
        quantity: item.quantity,
        total: (item.product.promotionalPrice || item.product.price) * item.quantity,
      })),
      shippingAddress: {
        recipientName: name,
        cep: formatCEP(cep),
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
      shippingMethod: selectedShippingMethod,
      paymentMethod,
      paymentDetails: paymentDetailsObj,
      totals: {
        subtotal,
        discount: totalDiscounts,
        shipping: selectedShippingMethod.price,
        total: finalTotal,
      },
      status: initialStatus,
      couponCode: appliedCoupon?.code,
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log('Confetti triggered', e);
    }

    // Generate WhatsApp seller URL payload and open tab or save to order
    const whatsappMsgUrl = generateWhatsAppOrderMessage(newOrder, settings.whatsappNumber);

    clearCart();
    setIsSubmitting(false);

    // Redirect to Order Confirmation page with order ID and whatsapp link
    navigate(`/confirmacao-pedido/${newOrder.id}`, {
      state: { order: newOrder, whatsappUrl: whatsappMsgUrl },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Header Steps Indicator */}
      <div className="border-b border-border pb-6">
        <h1 className="font-serif font-bold text-3xl text-foreground">Checkout Seguro Aura Fitness</h1>
        <div className="flex items-center gap-4 mt-4 text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}>1</span>
            <span>Identificação</span>
          </div>
          <div className="h-0.5 w-8 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}>2</span>
            <span>Entrega & Frete</span>
          </div>
          <div className="h-0.5 w-8 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}>3</span>
            <span>Pagamento</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Steps Form */}
        <div className="lg:col-span-8 space-y-8">
          {/* STEP 1: Personal Identification */}
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 ${step !== 1 ? 'opacity-70' : ''}`}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> 1. Dados Pessoais
              </h2>
              {step > 1 && (
                <button onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline">
                  Editar
                </button>
              )}
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {step1Error && (
                  <div className="sm:col-span-2 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{step1Error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mariana Duarte"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                      step1Error && !name.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">E-mail para Confirmação *</label>
                  <input
                    type="email"
                    required
                    placeholder="mariana@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                      step1Error && !email.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                      step1Error && !cpf.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                      step1Error && !phone.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="button"
                    onClick={handleGoToStep2}
                    className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    Prosseguir para Endereço
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Address & Shipping Method */}
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 ${step !== 2 ? 'opacity-70' : ''}`}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> 2. Endereço & Escolha de Frete
              </h2>
              {step > 2 && (
                <button onClick={() => setStep(2)} className="text-xs text-primary font-semibold hover:underline">
                  Editar
                </button>
              )}
            </div>

            {step === 2 && (
              <div className="space-y-4">
                {step2Error && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{step2Error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">CEP * (Busca Automática)</label>
                    <input
                      type="text"
                      required
                      placeholder="01310-100"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onBlur={handleCepBlur}
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none font-medium ${
                        step2Error && !cep.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                    {loadingCep && <span className="text-[11px] text-primary">Buscando CEP...</span>}
                    {cepError && <span className="text-[11px] text-destructive">{cepError}</span>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground mb-1">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Av. Paulista"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                        step2Error && !street.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="1500"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                        step2Error && !number.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Complemento (Apto, Bloco)</label>
                    <input
                      type="text"
                      placeholder="Apto 42"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Bela Vista"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                        step2Error && !neighborhood.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Cidade *</label>
                    <input
                      type="text"
                      required
                      placeholder="São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none ${
                        step2Error && !city.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Estado (UF) *</label>
                    <input
                      type="text"
                      required
                      placeholder="SP"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`w-full bg-background border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none uppercase ${
                        step2Error && !state.trim() ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                  </div>
                </div>

                {/* Shipping Method Selection Options */}
                <div className="pt-4 border-t border-border">
                  <label className="block text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary" /> Selecione a Modalidade de Envio:
                  </label>
                  <div className="space-y-2">
                    <label
                      onClick={() =>
                        setSelectedShippingMethod({
                          id: 'express',
                          name: 'Sedex Express Aura',
                          deliveryDays: 2,
                          price: subtotal >= 299 ? 0 : 14.90,
                        })
                      }
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedShippingMethod.id === 'express'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingMethod.id === 'express'}
                          onChange={() => {}}
                          className="accent-primary"
                        />
                        <div>
                          <h4 className="font-semibold text-xs text-foreground">Sedex Express Aura</h4>
                          <span className="text-[11px] text-muted-foreground">Entrega rápida em até 2 dias úteis</span>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-sm text-primary">
                        {subtotal >= 299 ? 'GRÁTIS' : formatCurrency(14.90)}
                      </span>
                    </label>

                    <label
                      onClick={() =>
                        setSelectedShippingMethod({
                          id: 'standard',
                          name: 'PAC Econômico',
                          deliveryDays: 5,
                          price: subtotal >= 299 ? 0 : 9.90,
                        })
                      }
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedShippingMethod.id === 'standard'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingMethod.id === 'standard'}
                          onChange={() => {}}
                          className="accent-primary"
                        />
                        <div>
                          <h4 className="font-semibold text-xs text-foreground">PAC Econômico Correios</h4>
                          <span className="text-[11px] text-muted-foreground">Entrega padrão em até 5 dias úteis</span>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-sm text-primary">
                        {subtotal >= 299 ? 'GRÁTIS' : formatCurrency(9.90)}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoToStep3}
                    className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    Ir para Pagamento
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Payment Selection */}
          <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 ${step !== 3 ? 'opacity-70' : ''}`}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> 3. Forma de Pagamento
              </h2>
            </div>

            {step === 3 && (
              <div className="space-y-6">
                {/* Method Options: PIX, Credit, Debit, Boleto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'pix'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary text-primary font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">PIX (5% OFF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary text-primary font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-xs">Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debit_card')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'debit_card'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary text-primary font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    <span className="text-xs">Débito Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto')}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'boleto'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary text-primary font-bold'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">Boleto</span>
                  </button>
                </div>

                {/* PIX Details */}
                {paymentMethod === 'pix' && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Pagamento Instantâneo via PIX com 5% de Desconto!
                    </p>
                    <p>O QR Code oficial e a chave "Copia e Cola" serão exibidos imediatamente na tela de confirmação.</p>
                  </div>
                )}

                {/* Credit Card Details */}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 p-4 border border-border rounded-xl bg-background text-xs">
                    {user?.savedPaymentMethods && user.savedPaymentMethods.length > 0 && (
                      <div className="mb-4 pb-3 border-b border-border space-y-2">
                        <label className="block font-semibold text-foreground">Usar Cartão Salvo na Conta:</label>
                        <div className="grid grid-cols-1 gap-2">
                          {user.savedPaymentMethods.map((pm) => (
                            <label
                              key={pm.id}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                                selectedSavedCard === pm.id
                                  ? 'border-primary bg-primary/5 font-semibold'
                                  : 'border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="savedCard"
                                  checked={selectedSavedCard === pm.id}
                                  onChange={() => {
                                    setSelectedSavedCard(pm.id);
                                    if (pm.cardHolderName) setCardName(pm.cardHolderName);
                                  }}
                                  className="accent-primary"
                                />
                                <span>{pm.cardBrand || 'Cartão'} •••• {pm.cardLastFour || '4242'}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{pm.expiryDate}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-foreground mb-1">Nome Impresso no Cartão</label>
                      <input
                        type="text"
                        placeholder="MARIANA DUARTE"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3.5 py-2 uppercase focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8842"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-foreground mb-1">Validade</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-foreground mb-1">CVC / CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-foreground mb-1">Parcelamento</label>
                        <select
                          value={cardInstallments}
                          onChange={(e) => setCardInstallments(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl px-2 py-2 font-semibold focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="1">1x de {formatCurrency(finalTotal)} (s/ juros)</option>
                          <option value="2">2x de {formatCurrency(finalTotal / 2)} (s/ juros)</option>
                          <option value="3">3x de {formatCurrency(finalTotal / 3)} (s/ juros)</option>
                          <option value="6">6x de {formatCurrency(finalTotal / 6)} (s/ juros)</option>
                          <option value="10">10x de {formatCurrency(finalTotal / 10)} (s/ juros)</option>
                          <option value="12">12x de {formatCurrency(finalTotal / 12)} (s/ juros)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debit Card Details */}
                {paymentMethod === 'debit_card' && (
                  <div className="space-y-3 p-4 border border-border rounded-xl bg-background text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Selecione seu Banco para Débito Online:</label>
                      <select
                        value={debitBank}
                        onChange={(e) => setDebitBank(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2.5 font-semibold focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="itau">Banco Itaú Unibanco (Débito Direto / Itaú Shop)</option>
                        <option value="bradesco">Banco Bradesco (Débito Online / Bradesco Net)</option>
                        <option value="bb">Banco do Brasil (Débito em Conta)</option>
                        <option value="nubank">Nubank (Débito NuPay)</option>
                        <option value="inter">Banco Inter</option>
                        <option value="caixa">Caixa Econômica / Cartão Virtual Débito Elo</option>
                        <option value="santander">Banco Santander</option>
                      </select>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-800 dark:text-sky-300">
                      O pagamento por débito é aprovado instantaneamente pelo seu aplicativo bancário!
                    </div>
                  </div>
                )}

                {/* Boleto Details */}
                {paymentMethod === 'boleto' && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">Vencimento em 3 dias úteis</p>
                    <p>O código de barras do boleto bancário será exibido para cópia e impressão na confirmação do pedido.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 sticky top-24">
            <h3 className="font-serif font-bold text-lg text-foreground pb-3 border-b border-border">
              Resumo da Compra ({items.length})
            </h3>

            {/* Item List Preview */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-14 object-cover rounded-lg shrink-0 border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-foreground truncate">{item.product.name}</h5>
                    <span className="text-[11px] text-muted-foreground">
                      {item.quantity}x {item.selectedSize} / {item.selectedColor.name}
                    </span>
                  </div>
                  <span className="font-serif font-bold text-foreground">
                    {formatCurrency((item.product.promotionalPrice || item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-2 pt-3 border-t border-border text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Desconto Cupom</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Frete ({selectedShippingMethod.name})</span>
                <span>{selectedShippingMethod.price === 0 ? 'Grátis' : formatCurrency(selectedShippingMethod.price)}</span>
              </div>
              <div className="flex justify-between font-serif font-bold text-lg text-foreground pt-3 border-t border-border">
                <span>Total Final</span>
                <span className="text-primary">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Finish Button */}
            <button
              onClick={handleFinishOrder}
              disabled={isSubmitting || !name || !street}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-sm py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Gerando Pedido...' : 'Concluir Pedido & Pagar'}
              <CheckCircle className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Compra segura com notificação WhatsApp Seller
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
