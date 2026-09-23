import React from 'react';
import { MessageCircle } from 'lucide-react';
import { generateWhatsAppDirectContact } from '../../lib/whatsapp';
import { getStoreSettings } from '../../lib/dataClient';

export const WhatsAppButton: React.FC = () => {
  const settings = getStoreSettings();
  const whatsappUrl = generateWhatsAppDirectContact(
    settings.whatsappNumber,
    'Olá Aura Fitness! Gostaria de atendimento personalizado para escolher meu look.'
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group animate-pulse-glow"
      aria-label="Atendimento via WhatsApp Aura Fitness"
    >
      <MessageCircle className="w-7 h-7 fill-white stroke-none" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-medium text-xs pl-0 group-hover:pl-2">
        Fale com um Especialista
      </span>
    </a>
  );
};
