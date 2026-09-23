import React, { useState } from 'react';
import { Save, Check, Settings, Phone, QrCode, Truck, Globe } from 'lucide-react';
import { getStoreSettings, updateStoreSettings } from '../../lib/dataClient';
import { StoreSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(() => getStoreSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="border-b border-border pb-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Configurações Globais</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Configurações da Loja</h1>
        <p className="text-xs text-muted-foreground mt-1">Gerencie telefone do WhatsApp Seller, Chave PIX, regras de frete grátis e redes sociais.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> Configurações salvas com sucesso no sistema!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* WhatsApp & PIX Integrations */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Phone className="w-4 h-4 text-primary" /> WhatsApp Seller & Chave PIX
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">WhatsApp do Vendedor (Com DDD)</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Chave PIX Oficial</label>
              <input
                type="text"
                value={settings.pixKey}
                onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Rules */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Truck className="w-4 h-4 text-primary" /> Regras de Frete & Correios
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Valor Mínimo para Frete Grátis (R$)</label>
              <input
                type="number"
                value={settings.shipping.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, freeShippingThreshold: Number(e.target.value) },
                  })
                }
                className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Taxa de Frete Padrão (R$)</label>
              <input
                type="number"
                value={settings.shipping.defaultFlatRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shipping: { ...settings.shipping, defaultFlatRate: Number(e.target.value) },
                  })
                }
                className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Globe className="w-4 h-4 text-primary" /> Redes Sociais
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Instagram URL</label>
              <input
                type="text"
                value={settings.social.instagram}
                onChange={(e) =>
                  setSettings({ ...settings, social: { ...settings.social, instagram: e.target.value } })
                }
                className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Facebook URL</label>
              <input
                type="text"
                value={settings.social.facebook}
                onChange={(e) =>
                  setSettings({ ...settings, social: { ...settings.social, facebook: e.target.value } })
                }
                className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3.5 px-8 rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Salvar Configurações Globais
        </button>
      </form>
    </div>
  );
};
