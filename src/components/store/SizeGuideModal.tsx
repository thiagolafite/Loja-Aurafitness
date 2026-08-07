import React from 'react';
import { X, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sizeGuideData, sizeTips } from '../../data/sizeGuideData';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card text-card-foreground border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2 text-primary font-serif font-bold text-xl">
                <Ruler className="w-6 h-6" />
                <h2>Tabela de Medidas Aura Fitness</h2>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Consulte a tabela abaixo com as medidas corporais padrão em centímetros para escolher o tamanho ideal do seu look.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 text-foreground text-xs p-3 rounded-xl mb-4 font-medium">
              🌿 <strong>Dica da Aura:</strong> Nossas peças têm tecido com elastano — se você estiver entre dois tamanhos, recomendamos o menor para um ajuste mais justo.
            </div>

            <div className="overflow-x-auto rounded-xl border border-border mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary dark:bg-secondary-dark text-foreground font-semibold">
                  <tr>
                    <th className="p-3 border-b border-border">Tamanho</th>
                    <th className="p-3 border-b border-border">Busto</th>
                    <th className="p-3 border-b border-border">Cintura</th>
                    <th className="p-3 border-b border-border">Quadril</th>
                    <th className="p-3 border-b border-border">Coxa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sizeGuideData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold text-primary">{row.size}</td>
                      <td className="p-3">{row.busto}</td>
                      <td className="p-3">{row.cintura}</td>
                      <td className="p-3">{row.quadril}</td>
                      <td className="p-3">{row.coxa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-secondary/60 dark:bg-secondary-dark/60 p-4 rounded-xl space-y-2">
              <h4 className="font-semibold text-sm text-foreground mb-1">Como Medir o Seu Corpo:</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                {sizeTips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
