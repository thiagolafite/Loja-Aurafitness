import React, { useState } from 'react';
import { Plus, Edit, Trash2, Sparkles, X } from 'lucide-react';
import { getBlogPosts, saveBlogPost, deleteBlogPost, aiGenerateBlogPost } from '../../lib/dataClient';
import { BlogPost, BlogCategory } from '../../types';
import { formatDate } from '../../lib/utils';

export const AdminBlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(() => getBlogPosts());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');

  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

  const handleOpenNew = () => {
    setEditingPost({
      title: '',
      category: 'Moda Fitness',
      summary: '',
      content: '',
      readTimeMinutes: 5,
      imageUrl: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      author: {
        name: 'Isabella Mantovani',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      },
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title) return;
    saveBlogPost(editingPost);
    setPosts(getBlogPosts());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este artigo do blog?')) {
      deleteBlogPost(id);
      setPosts(getBlogPosts());
    }
  };

  const handleAiGenerateArticle = async () => {
    if (!aiTopicInput.trim()) {
      alert('Digite um tema para a IA escrever o artigo.');
      return;
    }

    setIsAiLoading(true);
    try {
      const generated = await aiGenerateBlogPost(aiTopicInput, editingPost?.category || 'Moda Fitness');
      setEditingPost((prev) =>
        prev
          ? {
              ...prev,
              title: generated.title,
              summary: generated.summary,
              content: generated.content,
            }
          : null
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Gestão de Conteúdo</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Artigos do Blog</h1>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-primary text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Artigo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-card border border-border p-5 rounded-2xl flex gap-4 shadow-sm">
            <img src={post.imageUrl} alt="" className="w-24 h-28 object-cover rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-1 text-xs">
              <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-[10px]">
                {post.category}
              </span>
              <h3 className="font-serif font-bold text-base text-foreground line-clamp-1">{post.title}</h3>
              <p className="text-muted-foreground line-clamp-2">{post.summary}</p>
              <div className="pt-2 flex justify-between items-center text-[11px] text-muted-foreground">
                <span>{formatDate(post.publishedAt)}</span>
                <button onClick={() => handleDelete(post.id)} className="text-destructive font-semibold">Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {isModalOpen && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg text-foreground">Editor de Artigo</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* AI Assistant Generator Banner */}
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl space-y-2">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" /> Assistente de Redação
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite um tema (Ex: Treino de Pernas e Hipertrofia)"
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAiGenerateArticle}
                  disabled={isAiLoading}
                  className="bg-primary text-white font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
                >
                  {isAiLoading ? 'Escrevendo...' : 'Gerar Artigo'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Título do Post</label>
                <input
                  type="text"
                  required
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none font-semibold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoria</label>
                <select
                  value={editingPost.category || 'Moda Fitness'}
                  onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value as BlogCategory })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none font-semibold"
                >
                  <option value="Treinos">Treinos</option>
                  <option value="Nutrição">Nutrição</option>
                  <option value="Moda Fitness">Moda Fitness</option>
                  <option value="Bem-estar">Bem-estar</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Resumo / Subtítulo</label>
                <textarea
                  rows={2}
                  value={editingPost.summary || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Conteúdo do Artigo (HTML / Texto Rico)</label>
                <textarea
                  rows={6}
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-secondary rounded-xl font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white font-bold rounded-xl shadow">Publicar Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
