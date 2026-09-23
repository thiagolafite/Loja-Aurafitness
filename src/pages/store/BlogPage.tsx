import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, User, ArrowRight, Search } from 'lucide-react';
import { getBlogPosts } from '../../lib/dataClient';
import { formatDate } from '../../lib/utils';
import { BlogCategory } from '../../types';

export const BlogPage: React.FC = () => {
  const allPosts = getBlogPosts().filter((p) => p.isPublished);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: BlogCategory[] = ['Treinos', 'Nutrição', 'Moda Fitness', 'Bem-estar', 'Lifestyle'];

  const filteredPosts = allPosts.filter((post) => {
    if (selectedCategory && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchSummary = post.summary.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Blog Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Conteúdo & Performance</span>
        <h1 className="font-serif font-bold text-4xl text-foreground">Blog Aura Fitness</h1>
        <p className="text-sm text-muted-foreground">
          Dicas de moda esportiva, nutrição pré-treino, tendências e estratégias para elevar sua performance física e mental.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === '' ? 'bg-primary text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos os Artigos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar matérias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-2">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="font-serif font-bold text-lg text-foreground">Nenhum artigo encontrado</h3>
          <p className="text-xs text-muted-foreground">Tente alterar os termos de busca ou categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-md">
                  {post.category}
                </span>
              </Link>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTimeMinutes} min de leitura</span>
                    <span>•</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>

                  <Link to={`/blog/${post.slug}`} className="block group-hover:text-primary transition-colors">
                    <h3 className="font-serif font-bold text-xl text-foreground line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted-foreground line-clamp-3 mt-2 leading-relaxed">
                    {post.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-medium text-foreground">{post.author.name}</span>
                  </div>

                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Ler artigo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
};
