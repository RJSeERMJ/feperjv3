import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCrown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usuarioService, logService } from '../services/firebaseService';
import { Usuario } from '../types';
import { useAuth } from '../contexts/AuthContext';

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    login: '',
    nome: '',
    senha: '',
    tipo: 'usuario' as 'admin' | 'usuario'
  });
  const { user } = useAuth();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getAll();
      setUsuarios(data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUsuario) {
        await usuarioService.update(editingUsuario.id!, formData);
        toast.success('Usuário atualizado com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou usuário',
          detalhes: `Atualizou usuário: ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await usuarioService.create(formData);
        toast.success('Usuário cadastrado com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Cadastrou usuário',
          detalhes: `Cadastrou novo usuário: ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      }

      setShowModal(false);
      setEditingUsuario(null);
      resetForm();
      loadUsuarios();
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      login: usuario.login,
      nome: usuario.nome,
      senha: '',
      tipo: usuario.tipo
    });
    setShowModal(true);
  };

  const handleDelete = async (usuario: Usuario) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}?`)) {
      try {
        await usuarioService.delete(usuario.id!);
        toast.success('Usuário excluído com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Excluiu usuário',
          detalhes: `Excluiu usuário: ${usuario.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadUsuarios();
      } catch (error) {
        toast.error('Erro ao excluir usuário');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      login: '',
      nome: '',
      senha: '',
      tipo: 'usuario'
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>👤 Gestão de Usuários</h2>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingUsuario(null);
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus className="me-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Login</th>
                <th>Tipo</th>
                <th>Equipe</th>
                <th>Chefe de Equipe</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nome}</td>
                  <td>{usuario.login}</td>
                  <td>
                    <Badge bg={usuario.tipo === 'admin' ? 'danger' : 'primary'}>
                      {usuario.tipo === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </td>
                  <td>
                    {usuario.equipe ? (
                      <Badge bg="success">{usuario.equipe.nomeEquipe}</Badge>
                    ) : usuario.tipo === 'admin' ? (
                      <Badge bg="secondary">Não aplicável</Badge>
                    ) : (
                      <Badge bg="warning">Sem equipe</Badge>
                    )}
                  </td>
                  <td>
                    {usuario.chefeEquipe ? (
                      <Badge bg="warning">
                        <FaCrown className="me-1" />
                        Chefe
                      </Badge>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    {usuario.dataCriacao ? 
                      new Date(usuario.dataCriacao).toLocaleDateString('pt-BR') : 
                      '-'
                    }
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(usuario)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(usuario)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {usuarios.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhum usuário cadastrado.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Informação:</strong> Usuários do tipo "Usuário" serão automaticamente criados como chefes de equipe com o mesmo nome.
            </Alert>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Login *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.login}
                    onChange={(e) => setFormData({...formData, login: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Senha {editingUsuario ? '(deixe em branco para manter)' : '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    required={!editingUsuario}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo *</Form.Label>
                  <Form.Select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as 'admin' | 'usuario'})}
                  >
                    <option value="usuario">Usuário</option>
                    <option value="admin">Administrador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.tipo === 'usuario' && (
              <Alert variant="warning" className="mt-3">
                <FaCrown className="me-2" />
                <strong>Chefe de Equipe:</strong> Este usuário será automaticamente criado como chefe da equipe "{formData.nome}".
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingUsuario ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UsuariosPage;
