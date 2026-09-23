import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, Share2, Calendar, User, Bookmark } from 'lucide-react';
import { getBlogPostBySlug, getBlogPosts } from '../../lib/dataClient';
import { formatDate } from '../../lib/utils';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = getBlogPostBySlug(slug || '');
  const allPosts = getBlogPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 2);

  if (!post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-foreground">Artigo não encontrado</h2>
        <Link to="/blog" className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block">
          Voltar ao Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back Button */}
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Voltar para matérias do Blog
      </Link>

      {/* Article Header */}
      <div className="space-y-4">
        <span className="bg-primary/10 text-primary font-bold text-xs uppercase px-3 py-1 rounded-full">
          {post.category}
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-foreground leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-4 border-b border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={post.author.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
            <div>
              <span className="font-bold text-foreground block">{post.author.name}</span>
              <span className="text-[11px]">Publicado em {formatDate(post.publishedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> {post.readTimeMinutes} min de leitura</span>
          </div>
        </div>
      </div>

      {/* Featured Cover Image */}
      <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-xl border border-border">
        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* Content Body */}
      <div
        className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm space-y-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Related Posts Footer */}
      {relatedPosts.length > 0 && (
        <div className="pt-12 border-t border-border space-y-6">
          <h3 className="font-serif font-bold text-xl text-foreground">Outros Artigos que Você Pode Gostar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedPosts.map((rel) => (
              <Link
                key={rel.id}
                to={`/blog/${rel.slug}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary transition-colors group"
              >
                <img src={rel.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase">{rel.category}</span>
                  <h4 className="font-serif font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {rel.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
