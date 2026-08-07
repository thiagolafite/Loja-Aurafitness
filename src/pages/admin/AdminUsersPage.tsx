import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  Lock,
  Mail,
  User,
  KeyRound,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'gerente' | 'estoque' | 'atendimento';
  roleLabel: string;
  active: boolean;
  createdAt: string;
}

const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-1',
    name: 'Thiago Lafite (Master Admin)',
    email: 'admin@aurafitness.com.br',
    role: 'super_admin',
    roleLabel: 'Super Administrador Geral',
    active: true,
    createdAt: new Date().toLocaleDateString('pt-BR'),
  },
  {
    id: 'usr-2',
    name: 'Isabella Mantovani',
    email: 'isabella@aurafitness.com.br',
    role: 'gerente',
    roleLabel: 'Gerente de Vendas & Campanhas',
    active: true,
    createdAt: new Date().toLocaleDateString('pt-BR'),
  },
  {
    id: 'usr-3',
    name: 'Carlos Eduardo',
    email: 'carlos@aurafitness.com.br',
    role: 'estoque',
    roleLabel: 'Operador de Estoque & Produtos',
    active: true,
    createdAt: new Date().toLocaleDateString('pt-BR'),
  },
];

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('aura_admin_users');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'super_admin' | 'gerente' | 'estoque' | 'atendimento'>('gerente');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const roleLabels = {
    super_admin: 'Super Administrador Geral',
    gerente: 'Gerente de Vendas & Campanhas',
    estoque: 'Operador de Estoque & Produtos',
    atendimento: 'Atendimento & SAC',
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      roleLabel: roleLabels[role],
      active: true,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };

    const updated = [newUser, ...users];
    setUsers(updated);
    localStorage.setItem('aura_admin_users', JSON.stringify(updated));

    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPassword('');
    setSuccessMsg(`Novo usuário administrativo "${name}" cadastrado com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    localStorage.setItem('aura_admin_users', JSON.stringify(updated));
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
    setUsers(updated);
    localStorage.setItem('aura_admin_users', JSON.stringify(updated));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">
            Segurança & Controle de Acessos
          </span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">
            Usuários Administrativos & Níveis de Acesso
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre novos administradores e atribua permissões personalizadas para a equipe.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Novo Usuário Admin
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Master Admin Card Info */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Credenciais do Administrador Mestre (Owner):</span>
        </div>
        <p className="text-xs text-amber-900/80 dark:text-amber-200">
          E-mail Mestre: <strong className="font-mono text-foreground">admin@aurafitness.com.br</strong> | Senha Mestra Oficial: <strong className="font-mono text-foreground">AuraAdmin2026!</strong>
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Total: <strong>{filteredUsers.length}</strong> administradores
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-4">Administrador</th>
                <th className="p-4">E-mail de Acesso</th>
                <th className="p-4">Cargo / Nível</th>
                <th className="p-4">Data Cadastro</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-bold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono">{u.email}</td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-[10px] uppercase">
                      {u.roleLabel}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.createdAt}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        u.active
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {u.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    {u.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg transition-colors"
                        title="Remover Acesso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-card border border-border p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-xs shadow-2xl"
          >
            <div className="border-b border-border pb-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Novo Administrador
                </span>
                <h3 className="font-serif font-bold text-xl text-foreground">Cadastrar Acesso</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground font-bold text-base px-2"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold mb-1">Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">E-mail Corporativo *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="amanda@aurafitness.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Senha de Acesso *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Nível de Permissão / Cargo *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gerente">Gerente de Vendas & Campanhas</option>
                <option value="estoque">Operador de Estoque & Produtos</option>
                <option value="atendimento">Atendimento & SAC</option>
                <option value="super_admin">Super Administrador Geral</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 bg-secondary text-foreground font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md"
              >
                Cadastrar Acesso
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
