import React, { useState } from 'react';
import { Star, CheckCircle, XCircle, MessageSquare, AlertOctagon } from 'lucide-react';
import { getReviews, updateReviewStatus } from '../../lib/dataClient';
import { formatDate } from '../../lib/utils';
import { Review } from '../../types';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(() => getReviews());
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  const handleStatusChange = (id: string, status: Review['status']) => {
    updateReviewStatus(id, status, replyText[id]);
    setReviews(getReviews());
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Moderação de Conteúdo</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Avaliações dos Clientes</h1>
        <p className="text-xs text-muted-foreground mt-1">Aprove, rejeite ou responda comentários enviados na página de produto.</p>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary block">{rev.productName}</span>
                <h4 className="font-serif font-semibold text-sm text-foreground">{rev.title}</h4>
                <span className="text-[11px] text-muted-foreground">Por: {rev.customerName} ({rev.customerEmail}) • {formatDate(rev.createdAt)}</span>
              </div>

              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-500 stroke-none' : 'stroke-muted-foreground'}`} />
                ))}
              </div>
            </div>

            <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl">{rev.comment}</p>

            {/* Admin Reply Input */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-semibold text-primary block">Resposta da Aura Fitness:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva uma resposta oficial para este cliente..."
                  defaultValue={rev.adminReply || ''}
                  onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>
            </div>

            {/* Moderation Actions */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className={`font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full ${rev.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : rev.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                Status: {rev.status}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(rev.id, 'approved')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                </button>
                <button
                  onClick={() => handleStatusChange(rev.id, 'rejected')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Rejeitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
