import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Form, 
  InputGroup,
  Modal,
  Alert,
  Spinner,
  Badge,
  Dropdown
} from 'react-bootstrap';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { atletaService, equipeService, categoriaService, logService } from '../services/firebaseService';
import { Atleta, Equipe, Categoria } from '../types';
import { useAuth } from '../contexts/AuthContext';

const AtletasPage: React.FC = () => {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAtleta, setEditingAtleta] = useState<Atleta | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    sexo: 'M' as 'M' | 'F',
    email: '',
    telefone: '',
    dataNascimento: '',
    dataFiliacao: '',
    peso: '',
    altura: '',
    maiorTotal: '',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
    idEquipe: '',
    endereco: '',
    observacoes: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [atletasData, equipesData, categoriasData] = await Promise.all([
        atletaService.getAll(),
        equipeService.getAll(),
        categoriaService.getAll()
      ]);
      setAtletas(atletasData);
      setEquipes(equipesData);
      setCategorias(categoriasData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const atletaData = {
        ...formData,
        dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
        dataFiliacao: new Date(formData.dataFiliacao),
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        altura: formData.altura ? parseFloat(formData.altura) : undefined,
        maiorTotal: formData.maiorTotal ? parseFloat(formData.maiorTotal) : undefined,
        idEquipe: formData.idEquipe || undefined
      };

      if (editingAtleta) {
        await atletaService.update(editingAtleta.id!, atletaData);
        toast.success('Atleta atualizado com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou atleta',
          detalhes: `Atualizou dados do atleta ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await atletaService.create(atletaData);
        toast.success('Atleta cadastrado com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Cadastrou atleta',
          detalhes: `Cadastrou novo atleta: ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      }

      setShowModal(false);
      setEditingAtleta(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar atleta');
      console.error(error);
    }
  };

  const handleEdit = (atleta: Atleta) => {
    setEditingAtleta(atleta);
    setFormData({
      nome: atleta.nome,
      cpf: atleta.cpf,
      sexo: atleta.sexo,
      email: atleta.email,
      telefone: atleta.telefone || '',
      dataNascimento: atleta.dataNascimento ? atleta.dataNascimento.toISOString().split('T')[0] : '',
      dataFiliacao: atleta.dataFiliacao.toISOString().split('T')[0],
      peso: atleta.peso?.toString() || '',
      altura: atleta.altura?.toString() || '',
      maiorTotal: atleta.maiorTotal?.toString() || '',
      status: atleta.status,
      idEquipe: atleta.idEquipe || '',
      endereco: atleta.endereco || '',
      observacoes: atleta.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (atleta: Atleta) => {
    if (window.confirm(`Tem certeza que deseja excluir o atleta ${atleta.nome}?`)) {
      try {
        await atletaService.delete(atleta.id!);
        toast.success('Atleta excluído com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Excluiu atleta',
          detalhes: `Excluiu atleta: ${atleta.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadData();
      } catch (error) {
        toast.error('Erro ao excluir atleta');
        console.error(error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      sexo: 'M',
      email: '',
      telefone: '',
      dataNascimento: '',
      dataFiliacao: new Date().toISOString().split('T')[0],
      peso: '',
      altura: '',
      maiorTotal: '',
      status: 'ATIVO',
      idEquipe: '',
      endereco: '',
      observacoes: ''
    });
  };

  const filteredAtletas = atletas.filter(atleta =>
    atleta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    atleta.cpf.includes(searchTerm) ||
    atleta.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2>👥 Gestão de Atletas</h2>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingAtleta(null);
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus className="me-2" />
          Novo Atleta
        </Button>
      </div>

      <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nome, CPF ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Sexo</th>
                <th>Email</th>
                <th>Equipe</th>
                <th>Status</th>
                <th>Maior Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAtletas.map((atleta) => (
                <tr key={atleta.id}>
                  <td>{atleta.nome}</td>
                  <td>{atleta.cpf}</td>
                  <td>
                    <Badge bg={atleta.sexo === 'M' ? 'primary' : 'danger'}>
                      {atleta.sexo === 'M' ? 'M' : 'F'}
                    </Badge>
                  </td>
                  <td>{atleta.email}</td>
                  <td>{atleta.equipe?.nomeEquipe || '-'}</td>
                  <td>
                    <Badge bg={atleta.status === 'ATIVO' ? 'success' : 'secondary'}>
                      {atleta.status}
                    </Badge>
                  </td>
                  <td>{atleta.maiorTotal ? `${atleta.maiorTotal}kg` : '-'}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Ações
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEdit(atleta)}>
                          <FaEdit className="me-2" />
                          Editar
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDelete(atleta)}>
                          <FaTrash className="me-2" />
                          Excluir
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredAtletas.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhum atleta encontrado.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAtleta ? 'Editar Atleta' : 'Novo Atleta'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
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
                  <Form.Label>CPF *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexo *</Form.Label>
                  <Form.Select
                    value={formData.sexo}
                    onChange={(e) => setFormData({...formData, sexo: e.target.value as 'M' | 'F'})}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Nascimento</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Filiação *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataFiliacao}
                    onChange={(e) => setFormData({...formData, dataFiliacao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Equipe</Form.Label>
                  <Form.Select
                    value={formData.idEquipe}
                    onChange={(e) => setFormData({...formData, idEquipe: e.target.value})}
                  >
                    <option value="">Selecione uma equipe</option>
                    {equipes.map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nomeEquipe}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Peso (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({...formData, peso: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Altura (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.altura}
                    onChange={(e) => setFormData({...formData, altura: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Maior Total (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.maiorTotal}
                    onChange={(e) => setFormData({...formData, maiorTotal: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'ATIVO' | 'INATIVO'})}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingAtleta ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AtletasPage;
