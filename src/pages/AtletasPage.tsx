import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { atletaService, categoriaService, equipeService, logService } from '../services/firebaseService';
import { Atleta, Categoria, Equipe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAccessControl } from '../hooks/useAccessControl';

const AtletasPage: React.FC = () => {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
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
    idCategoria: '',
    idEquipe: '',
    endereco: '',
    observacoes: ''
  });
  const [cpfError, setCpfError] = useState('');
  const { user } = useAuth();
  const { isAdmin, getUserTeamId, canModify, canDelete, getAccessInfo } = useAccessControl();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar atletas baseado no acesso do usuário
      const userTeamId = getUserTeamId();
      const atletasData = await atletaService.getAll(userTeamId);
      setAtletas(atletasData);

      // Carregar categorias
      const categoriasData = await categoriaService.getAll();
      setCategorias(categoriasData);

      // Carregar equipes baseado no acesso do usuário
      const equipesData = await equipeService.getAll(userTeamId);
      setEquipes(equipesData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Função para validar CPF (validação simplificada)
  const validateCPF = (cpf: string): boolean => {
    // Remover caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verificar se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      setCpfError('CPF deve ter exatamente 11 números');
      return false;
    }
    
    // Verificar se são apenas números de 0 a 9
    if (!/^\d{11}$/.test(cleanCPF)) {
      setCpfError('CPF deve conter apenas números de 0 a 9');
      return false;
    }
    
    // Verificar se todos os dígitos são iguais (opcional)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      setCpfError('CPF não pode ter todos os dígitos iguais');
      return false;
    }
    
    setCpfError('');
    return true;
  };

  // Função para verificar se CPF já existe
  const checkCPFExists = async (cpf: string, excludeId?: string): Promise<boolean> => {
    try {
      const existingAtleta = await atletaService.getByCpf(cpf);
      if (existingAtleta && existingAtleta.id !== excludeId) {
        setCpfError('CPF já cadastrado no sistema');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Função para testar CPF (apenas para desenvolvimento)
  const testCPF = (cpf: string) => {
    console.log('Testando CPF:', cpf);
    const isValid = validateCPF(cpf);
    console.log('CPF válido:', isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar CPF
    if (!validateCPF(formData.cpf)) {
      return;
    }
    
    // Verificar se CPF já existe
    const cpfExists = await checkCPFExists(formData.cpf, editingAtleta?.id);
    if (cpfExists) {
      return;
    }
    
    // Verificar se o usuário pode modificar
    if (!canModify(formData.idEquipe)) {
      toast.error('Você não tem permissão para modificar dados desta equipe');
      return;
    }
    
    try {
      // Preparar dados do atleta
      const atletaData = {
        nome: formData.nome,
        cpf: formData.cpf,
        sexo: formData.sexo,
        email: formData.email,
        telefone: formData.telefone || undefined,
        dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
        dataFiliacao: formData.dataFiliacao ? new Date(formData.dataFiliacao) : new Date(),
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        altura: formData.altura ? parseFloat(formData.altura) : undefined,
        maiorTotal: formData.maiorTotal ? parseFloat(formData.maiorTotal) : undefined,
        status: isAdmin() ? formData.status : 'ATIVO',
        idCategoria: formData.idCategoria || undefined,
        idEquipe: formData.idEquipe || getUserTeamId() || undefined,
        endereco: formData.endereco || undefined,
        observacoes: formData.observacoes || undefined
      };

      if (editingAtleta) {
        await atletaService.update(editingAtleta.id!, atletaData);
        toast.success('Atleta atualizado com sucesso!');
        
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou atleta',
          detalhes: `Atualizou atleta: ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await atletaService.create(atletaData);
        toast.success('Atleta cadastrado com sucesso!');
        
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
    }
  };

  const handleEdit = (atleta: Atleta) => {
    // Verificar se o usuário pode modificar este atleta
    if (!canModify(atleta.idEquipe)) {
      toast.error('Você não tem permissão para editar este atleta');
      return;
    }

    setEditingAtleta(atleta);
    setFormData({
      nome: atleta.nome,
      cpf: atleta.cpf,
      sexo: atleta.sexo,
      email: atleta.email,
      telefone: atleta.telefone || '',
      dataNascimento: atleta.dataNascimento ? new Date(atleta.dataNascimento).toISOString().split('T')[0] : '',
      dataFiliacao: atleta.dataFiliacao ? new Date(atleta.dataFiliacao).toISOString().split('T')[0] : '',
      peso: atleta.peso?.toString() || '',
      altura: atleta.altura?.toString() || '',
      maiorTotal: atleta.maiorTotal?.toString() || '',
      status: atleta.status,
      idCategoria: atleta.idCategoria || '',
      idEquipe: atleta.idEquipe || '',
      endereco: atleta.endereco || '',
      observacoes: atleta.observacoes || ''
    });
    setCpfError('');
    setShowModal(true);
  };

  const handleDelete = async (atleta: Atleta) => {
    // Verificar se o usuário pode excluir este atleta
    if (!canDelete(atleta.idEquipe)) {
      toast.error('Você não tem permissão para excluir este atleta');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o atleta ${atleta.nome}?`)) {
      try {
        await atletaService.delete(atleta.id!);
        toast.success('Atleta excluído com sucesso!');
        
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
      dataFiliacao: '',
      peso: '',
      altura: '',
      maiorTotal: '',
      status: 'ATIVO',
      idCategoria: '',
      idEquipe: getUserTeamId() || '',
      endereco: '',
      observacoes: ''
    });
    setCpfError('');
  };

  // Função para formatar CPF
  const formatCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para lidar com mudança no CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (value.length <= 11) {
      setFormData({...formData, cpf: value});
      setCpfError('');
    }
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
          <h2>🏃‍♂️ Gestão de Atletas</h2>
          <Badge bg={accessInfo.color} className="mt-2">
            {accessInfo.label}: {accessInfo.description}
          </Badge>
        </div>
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
              {atletas.map((atleta) => (
                <tr key={atleta.id}>
                  <td>{atleta.nome}</td>
                  <td>{formatCPF(atleta.cpf)}</td>
                  <td>
                    <Badge bg={atleta.sexo === 'M' ? 'primary' : 'danger'}>
                      {atleta.sexo === 'M' ? 'Masculino' : 'Feminino'}
                    </Badge>
                  </td>
                  <td>{atleta.email}</td>
                  <td>
                    {atleta.equipe ? (
                      <Badge bg="success">{atleta.equipe.nomeEquipe}</Badge>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    <Badge bg={atleta.status === 'ATIVO' ? 'success' : 'secondary'}>
                      {atleta.status}
                    </Badge>
                  </td>
                  <td>{atleta.maiorTotal ? `${atleta.maiorTotal}kg` : '-'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(atleta)}
                      disabled={!canModify(atleta.idEquipe)}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(atleta)}
                      disabled={!canDelete(atleta.idEquipe)}
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {atletas.length === 0 && (
            <Alert variant="info" className="text-center">
              {isAdmin() ? 'Nenhum atleta cadastrado.' : 'Nenhum atleta encontrado para sua equipe.'}
            </Alert>
          )}
        </Card.Body>
      </Card>

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
                    onChange={handleCPFChange}
                    placeholder="00000000000"
                    maxLength={11}
                    required
                    isInvalid={!!cpfError}
                  />
                  <Form.Control.Feedback type="invalid">
                    {cpfError}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Digite apenas números (11 dígitos)
                  </Form.Text>
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
                  <Form.Label>Data de Nascimento</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </Form.Group>
              </Col>
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
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Equipe</Form.Label>
                  <Form.Select
                    value={formData.idEquipe}
                    onChange={(e) => setFormData({...formData, idEquipe: e.target.value})}
                    disabled={!isAdmin()} // Apenas admin pode escolher equipe
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'ATIVO' | 'INATIVO'})}
                    disabled={!isAdmin()} // Apenas admin pode editar status
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </Form.Select>
                  {!isAdmin() && (
                    <Form.Text className="text-muted">
                      Apenas administradores podem alterar o status
                    </Form.Text>
                  )}
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
