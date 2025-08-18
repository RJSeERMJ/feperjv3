import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCrown, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { equipeService, logService, usuarioService } from '../services/firebaseService';
import { Equipe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAccessControl } from '../hooks/useAccessControl';

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
    email: '',
    observacoes: ''
  });
  const { user } = useAuth();
  const { isAdmin, getUserTeamId, canModify, canDelete, getAccessInfo } = useAccessControl();

  useEffect(() => {
    loadEquipes();
  }, []);

  const loadEquipes = async () => {
    try {
      setLoading(true);
      
      // Carregar equipes baseado no acesso do usuário
      const userTeamId = getUserTeamId();
      const data = await equipeService.getAll(userTeamId);
      
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
    
    // Verificar se o usuário pode modificar
    if (!canModify(editingEquipe?.id)) {
      toast.error('Você não tem permissão para modificar dados desta equipe');
      return;
    }
    
    try {
      await equipeService.update(editingEquipe!.id!, formData);
      toast.success('Equipe atualizada com sucesso!');
      
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Atualizou equipe',
        detalhes: `Atualizou equipe: ${formData.nomeEquipe}`,
        tipoUsuario: user?.tipo || 'usuario'
      });

      setShowModal(false);
      setEditingEquipe(null);
      resetForm();
      loadEquipes();
    } catch (error) {
      toast.error('Erro ao salvar equipe');
      console.log(error, "Erro ao salvar equipe")
    }
  };

  const handleEdit = (equipe: Equipe) => {
    // Verificar se o usuário pode modificar esta equipe
    if (!canModify(equipe.id)) {
      toast.error('Você não tem permissão para editar esta equipe');
      return;
    }

    setEditingEquipe(equipe);
    setFormData({
      nomeEquipe: equipe.nomeEquipe,
      cidade: equipe.cidade,
      tecnico: equipe.tecnico || '',
      telefone: equipe.telefone || '',
      email: equipe.email || '',
      observacoes: (equipe as any).observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (equipe: Equipe) => {
    // Verificar se o usuário pode excluir esta equipe
    if (!canDelete(equipe.id)) {
      toast.error('Você não tem permissão para excluir esta equipe');
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
      email: '',
      observacoes: ''
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

  const accessInfo = getAccessInfo();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👥 Gestão de Equipes</h2>
          <Badge bg={accessInfo.color} className="mt-2">
            {accessInfo.label}: {accessInfo.description}
          </Badge>
        </div>
        <div className="d-flex align-items-center">
          <Alert variant="info" className="mb-0 me-3" style={{ fontSize: '0.9rem' }}>
            <FaInfoCircle className="me-2" />
            <strong>Info:</strong> Equipes são criadas automaticamente ao cadastrar usuários
          </Alert>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Nome da Equipe</th>
                <th>Estado</th>
                <th>Chefe da Equipe</th>
                <th>Técnico</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Observações</th>
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
                    {(equipe as any).observacoes ? (
                      <span title={(equipe as any).observacoes}>
                        {(equipe as any).observacoes.length > 30 
                          ? `${(equipe as any).observacoes.substring(0, 30)}...` 
                          : (equipe as any).observacoes}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(equipe)}
                      disabled={!canModify(equipe.id)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(equipe)}
                      disabled={!canDelete(equipe.id)}
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
              {isAdmin() 
                ? 'Nenhuma equipe cadastrada. Cadastre usuários para criar equipes automaticamente.'
                : 'Nenhuma equipe encontrada para seu acesso.'
              }
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Editar Equipe
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Informação:</strong> Esta equipe foi criada automaticamente. Você pode editar os dados aqui.
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
                  <Form.Label>Estado *</Form.Label>
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

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações sobre a equipe..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Atualizar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipesPage;
