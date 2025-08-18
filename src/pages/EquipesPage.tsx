import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCrown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { equipeService, logService, usuarioService } from '../services/firebaseService';
import { Equipe, Usuario } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAdminPermission } from '../hooks/useAdminPermission';

const EquipesPage: React.FC = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [formData, setFormData] = useState({
    nomeEquipe: '',
    cidade: '',
    tecnico: '',
    telefone: '',
    email: ''
  });
  const { user } = useAuth();
  const { isAdmin, checkAdminPermission } = useAdminPermission();

  useEffect(() => {
    loadEquipes();
  }, []);

  const loadEquipes = async () => {
    try {
      setLoading(true);
      const data = await equipeService.getAll();
      
      // Buscar dados do chefe para cada equipe
      const equipesComChefe = await Promise.all(
        data.map(async (equipe) => {
          let chefe = null;
          if (equipe.idChefe) {
            try {
              chefe = await usuarioService.getById(equipe.idChefe);
            } catch (error) {
              console.warn('Erro ao buscar chefe da equipe:', error);
            }
          }
          return { ...equipe, chefe };
        })
      );
      
      setEquipes(equipesComChefe);
    } catch (error) {
      console.error(error, "Erro ao carregar equipes")
      toast.error('Erro ao carregar equipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação de segurança - apenas administradores podem gerenciar equipes
    if (!checkAdminPermission('gerenciar equipes')) {
      toast.error('Apenas administradores podem gerenciar equipes');
      return;
    }
    
    try {
      if (editingEquipe) {
        await equipeService.update(editingEquipe.id!, formData);
        toast.success('Equipe atualizada com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou equipe',
          detalhes: `Atualizou equipe: ${formData.nomeEquipe}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await equipeService.create(formData);
        toast.success('Equipe cadastrada com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Cadastrou equipe',
          detalhes: `Cadastrou nova equipe: ${formData.nomeEquipe}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      }

      setShowModal(false);
      setEditingEquipe(null);
      resetForm();
      loadEquipes();
    } catch (error) {
      toast.error('Erro ao salvar equipe');
      console.log(error, "Erro ao salver equipe")
    }
  };

  const handleEdit = (equipe: Equipe) => {
    // Verificação de segurança - apenas administradores podem editar equipes
    if (!checkAdminPermission('editar equipes')) {
      toast.error('Apenas administradores podem editar equipes');
      return;
    }
    
    setEditingEquipe(equipe);
    setFormData({
      nomeEquipe: equipe.nomeEquipe,
      cidade: equipe.cidade,
      tecnico: equipe.tecnico || '',
      telefone: equipe.telefone || '',
      email: equipe.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (equipe: Equipe) => {
    // Verificação de segurança - apenas administradores podem excluir equipes
    if (!checkAdminPermission('excluir equipes')) {
      toast.error('Apenas administradores podem excluir equipes');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir a equipe ${equipe.nomeEquipe}?`)) {
      try {
        await equipeService.delete(equipe.id!);
        toast.success('Equipe excluída com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Excluiu equipe',
          detalhes: `Excluiu equipe: ${equipe.nomeEquipe}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadEquipes();
      } catch (error) {
        toast.error('Erro ao excluir equipe');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nomeEquipe: '',
      cidade: '',
      tecnico: '',
      telefone: '',
      email: ''
    });
  };

  // Verificação de acesso - apenas administradores podem acessar
  if (!isAdmin) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Alert variant="danger" className="text-center" style={{ maxWidth: '500px' }}>
          <h4>🚫 Acesso Negado</h4>
          <p className="mb-0">
            Você não tem permissão para acessar a gestão de equipes. 
            Apenas administradores podem gerenciar equipes.
          </p>
        </Alert>
      </div>
    );
  }

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
        <div>
          <h2>👥 Gestão de Equipes</h2>
          <p className="text-muted mb-0">
            <Badge bg="warning" className="me-2">🔒 Admin Only</Badge>
            Apenas administradores podem gerenciar equipes
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingEquipe(null);
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus className="me-2" />
          Nova Equipe
        </Button>
      </div>

      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Nome da Equipe</th>
                <th>Cidade</th>
                <th>Chefe da Equipe</th>
                <th>Técnico</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipes.map((equipe) => (
                <tr key={equipe.id}>
                  <td>
                    <strong>{equipe.nomeEquipe}</strong>
                  </td>
                  <td>{equipe.cidade}</td>
                  <td>
                    {(equipe as any).chefe ? (
                      <Badge bg="warning">
                        <FaCrown className="me-1" />
                        {(equipe as any).chefe.nome}
                      </Badge>
                    ) : (
                      <Badge bg="secondary">Sem chefe</Badge>
                    )}
                  </td>
                  <td>{equipe.tecnico || '-'}</td>
                  <td>{equipe.telefone || '-'}</td>
                  <td>{equipe.email || '-'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(equipe)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(equipe)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {equipes.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhuma equipe cadastrada.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Informação:</strong> Equipes criadas automaticamente ao cadastrar usuários podem ser editadas aqui.
            </Alert>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Equipe *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nomeEquipe}
                    onChange={(e) => setFormData({...formData, nomeEquipe: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cidade *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Técnico</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.tecnico}
                    onChange={(e) => setFormData({...formData, tecnico: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefone</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingEquipe ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipesPage;
