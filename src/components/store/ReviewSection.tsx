import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, ThumbsUp } from 'lucide-react';
import { getApprovedReviewsByProductId, addReview } from '../../lib/dataClient';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, productName }) => {
  const reviews = getApprovedReviewsByProductId(productId);
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorEmail, setAuthorEmail] = useState(user?.email || '');
  const [submitted, setSubmitted] = useState(false);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !authorName.trim()) return;

    addReview({
      productId,
      productName,
      customerName: authorName,
      customerEmail: authorEmail || 'cliente@aurafitness.com.br',
      rating,
      title: title || 'Excelente produto!',
      comment,
    });

    setSubmitted(true);
    setTitle('');
    setComment('');
  };

  return (
    <div className="mt-16 pt-10 border-t border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">
            Opinião de Quem Comprou
          </span>
          <h2 className="font-serif font-bold text-2xl text-foreground mt-1">
            Avaliações dos Clientes
          </h2>
        </div>

        <div className="flex items-center gap-4 bg-secondary dark:bg-secondary-dark p-4 rounded-2xl border border-border">
          <div className="text-center">
            <span className="text-3xl font-bold font-serif text-primary block leading-none">
              {averageRating}
            </span>
            <span className="text-xs text-muted-foreground">de 5.0</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="flex text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(averageRating))
                      ? 'fill-amber-500 stroke-none'
                      : 'stroke-muted-foreground fill-none'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">
              Baseado em {reviews.length} avaliações verificadas
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-card border border-border rounded-2xl text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-primary/40" />
              <p className="text-sm font-medium">Seja a primeira pessoa a avaliar este produto!</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {rev.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {rev.customerName}
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-normal flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" /> Compra Verificada
                        </span>
                      </h4>
                      <span className="text-[11px] text-muted-foreground">{formatDate(rev.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-500 stroke-none' : 'stroke-muted-foreground fill-none'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h5 className="font-semibold text-sm text-foreground">{rev.title}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>

                {rev.adminReply && (
                  <div className="bg-primary/5 border-l-2 border-primary p-3 rounded-r-xl text-xs space-y-1 mt-2">
                    <span className="font-bold text-primary block">Resposta Aura Fitness:</span>
                    <p className="text-foreground">{rev.adminReply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Submit Review Form */}
        <div className="lg:col-span-5 bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
          <h3 className="font-serif font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Deixe sua Avaliação
          </h3>

          {submitted ? (
            <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Avaliação Enviada!</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Sua mensagem passará por uma rápida moderação e em breve aparecerá no site. Obrigado!
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-semibold text-primary underline"
              >
                Escrever outra avaliação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Sua Nota</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-500 stroke-none'
                            : 'stroke-muted-foreground fill-none'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2 font-medium">
                    {rating} de 5 estrelas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Seu Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ana Paula"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Seu E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="ana@email.com"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Título da Avaliação</label>
                <input
                  type="text"
                  placeholder="Ex: Produto sensacional, recomendo!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Seu Comentário</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Conte como foi sua experiência com o produto, caimento, tecido, etc..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Publicar Avaliação
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
