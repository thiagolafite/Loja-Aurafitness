import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, ShieldCheck, CreditCard, Lock, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#16271b] text-white/90 border-t border-emerald-950 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img
                src="/images/logo-aura.png"
                alt="Aura Fitness"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm font-light">
              Uma boutique de moda fitness feminina com peças exclusivas, unindo performance, conforto e elegância.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/adoro.aura/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/10 hover:bg-amber-400 hover:text-slate-900 text-white transition-colors"
                title="Instagram @adoro.aura"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:aurafitnesswork@gmail.com"
                className="p-2.5 rounded-full bg-white/10 hover:bg-amber-400 hover:text-slate-900 text-white transition-colors"
                title="E-mail aurafitnesswork@gmail.com"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Navegação</h4>
            <ul className="space-y-2 text-xs text-white/70 font-light">
              <li><Link to="/catalogo" className="hover:text-white transition-colors">Catálogo Completo</Link></li>
              <li><Link to="/catalogo?categoria=Leggings" className="hover:text-white transition-colors">Leggings High Waist</Link></li>
              <li><Link to="/catalogo?categoria=Tops" className="hover:text-white transition-colors">Tops & Sports Bras</Link></li>
              <li><Link to="/catalogo?categoria=Conjuntos" className="hover:text-white transition-colors">Conjuntos em Destaque</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog & Dicas Fitness</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Atendimento</h4>
            <ul className="space-y-2 text-xs text-white/70 font-light">
              <li><Link to="/minha-conta" className="hover:text-white transition-colors">Minha Conta</Link></li>
              <li><Link to="/meus-pedidos" className="hover:text-white transition-colors">Meus Pedidos</Link></li>
              <li><Link to="/favoritos" className="hover:text-white transition-colors">Lista de Desejos</Link></li>
              <li className="pt-1">
                <span className="block text-[11px] text-white/50">E-mail de Suporte:</span>
                <a href="mailto:aurafitnesswork@gmail.com" className="text-white hover:text-amber-300 font-medium">
                  aurafitnesswork@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Security & Payment */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Compra Segura</h4>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>SSL Criptografado 256-bit</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>PIX, Cartão (até 6x) e Boleto</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Garantia de Troca em 7 dias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50 font-light">
          <p>© 2026 Aura Fitness. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Privacidade</span>
            <span>•</span>
            <span>Termos de Uso</span>
            <span>•</span>
            <span className="text-white/70">Aura Fitness Boutique</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
