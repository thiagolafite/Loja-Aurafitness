import React, { useState } from 'react';
import { Shield, UserPlus, CheckCircle } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState([
    { id: 'usr-1', name: 'Isabella Mantovani', email: 'isabella@aurafitness.com.br', role: 'Administrador Geral', active: true },
    { id: 'usr-2', name: 'Carlos Eduardo', email: 'carlos@aurafitness.com.br', role: 'Gerente de Estoque', active: true },
    { id: 'usr-3', name: 'Mariana Duarte', email: 'suporte@aurafitness.com.br', role: 'Atendimento & SAC', active: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Acessos Administrativos</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Usuários & Permissões</h1>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
            <tr>
              <th className="p-3.5">Usuário</th>
              <th className="p-3.5">E-mail</th>
              <th className="p-3.5">Cargo / Nível</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> {u.name}
                </td>
                <td className="p-3.5 text-muted-foreground">{u.email}</td>
                <td className="p-3.5 font-semibold text-primary">{u.role}</td>
                <td className="p-3.5 font-bold text-emerald-600">Ativo</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
