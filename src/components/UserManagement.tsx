import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Usuario } from '../types';
import { logSecurityEvent } from '../utils/securityUtils';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

interface UserManagementProps {
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const { user: currentUser, createUser } = useAuth();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nome: '',
    tipo: 'usuario' as 'admin' | 'usuario'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersList: Usuario[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersList.push({
          id: doc.id,
          login: userData.email || '',
          nome: userData.nome,
          tipo: userData.tipo,
          ativo: userData.ativo,
          criadoPor: userData.criadoPor,
          dataCriacao: userData.criadoEm?.toDate()
        });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createUser) {
      toast.error('Função de criação de usuário não disponível');
      return;
    }

    try {
      const success = await createUser(newUser);
      
      if (success) {
        toast.success('Usuário criado com sucesso!');
        setNewUser({ email: '', password: '', nome: '', tipo: 'usuario' });
        setShowCreateForm(false);
        loadUsers();
        
        // Log de segurança
        await logSecurityEvent({
          userId: currentUser?.id || 'unknown',
          action: 'Usuário criado',
          severity: 'medium',
          details: `Usuário ${newUser.nome} criado por ${currentUser?.nome}`
        });
      } else {
        toast.error('Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'usuarios', userId);
      await updateDoc(userRef, {
        ativo: !currentStatus,
        dataAtualizacao: new Date()
      });
      
      toast.success(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsers();
      
      // Log de segurança
      await logSecurityEvent({
        userId: currentUser?.id || 'unknown',
        action: 'Status do usuário alterado',
        severity: 'medium',
        details: `Usuário ${userId} ${!currentStatus ? 'ativado' : 'desativado'} por ${currentUser?.nome}`
      });
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      return;
    }

    try {
      const userRef = doc(db, 'usuarios', userId);
      await deleteDoc(userRef);
      
      toast.success('Usuário excluído com sucesso!');
      loadUsers();
      
      // Log de segurança
      await logSecurityEvent({
        userId: currentUser?.id || 'unknown',
        action: 'Usuário excluído',
        severity: 'high',
        details: `Usuário ${userName} excluído por ${currentUser?.nome}`
      });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  if (loading) {
    return (
      <div className="modal show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-body text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="mt-2">Carregando usuários...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Gerenciamento de Usuários</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {currentUser?.tipo === 'admin' && (
              <div className="mb-3">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  {showCreateForm ? 'Cancelar' : 'Criar Novo Usuário'}
                </button>
              </div>
            )}

            {showCreateForm && (
              <div className="card mb-4">
                <div className="card-header">
                  <h6>Criar Novo Usuário</h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCreateUser}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Senha</label>
                        <input
                          type="password"
                          className="form-control"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          required
                          minLength={8}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nome</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newUser.nome}
                          onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo</label>
                        <select
                          className="form-select"
                          value={newUser.tipo}
                          onChange={(e) => setNewUser({ ...newUser, tipo: e.target.value as 'admin' | 'usuario' })}
                        >
                          <option value="usuario">Usuário</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-success">
                        Criar Usuário
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.nome}</td>
                      <td>{user.login}</td>
                      <td>
                        <span className={`badge ${user.tipo === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {user.tipo === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.ativo ? 'bg-success' : 'bg-secondary'}`}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        {user.dataCriacao ? new Date(user.dataCriacao).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {currentUser?.tipo === 'admin' && user.id !== currentUser.id && (
                            <>
                              <button
                                className={`btn btn-sm ${user.ativo ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => toggleUserStatus(user.id!, user.ativo || false)}
                                title={user.ativo ? 'Desativar' : 'Ativar'}
                              >
                                {user.ativo ? 'Desativar' : 'Ativar'}
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteUser(user.id!, user.nome)}
                                title="Excluir"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
