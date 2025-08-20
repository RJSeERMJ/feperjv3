import React, { useState, useEffect } from 'react';
import { 
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
  Dropdown,
  Tabs,
  Tab
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUsers, 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaFileExport,
  FaUserCheck,
  FaUserTimes,
  FaChartBar
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { competicaoService, inscricaoService, atletaService, equipeService, logService } from '../services/firebaseService';
import { Competicao, InscricaoCompeticao, Atleta, Equipe } from '../types';
import { useAuth } from '../contexts/AuthContext';

const CompeticoesPage: React.FC = () => {
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInscricoesModal, setShowInscricoesModal] = useState(false);
  const [selectedCompeticao, setSelectedCompeticao] = useState<Competicao | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoCompeticao[]>([]);
  const [editingCompeticao, setEditingCompeticao] = useState<Competicao | null>(null);
  const [formData, setFormData] = useState({
    nomeCompeticao: '',
    dataCompeticao: '',
    valorInscricao: '',
    valorDobra: '',
    dataInicioInscricao: '',
    dataFimInscricao: '',
    dataNominacaoPreliminar: '',
    dataNominacaoFinal: '',
    local: '',
    descricao: '',
    status: 'AGENDADA' as 'AGENDADA' | 'REALIZADA' | 'CANCELADA',
    permiteDobraCategoria: false
  });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  // Atualizar datas de nominata quando data da competição mudar
  useEffect(() => {
    if (formData.dataCompeticao) {
      const dataCompeticao = new Date(formData.dataCompeticao);
      
      // Nominata preliminar: 60 dias antes
      const dataNominacaoPreliminar = new Date(dataCompeticao);
      dataNominacaoPreliminar.setDate(dataCompeticao.getDate() - 60);
      
      // Nominata final: 21 dias antes
      const dataNominacaoFinal = new Date(dataCompeticao);
      dataNominacaoFinal.setDate(dataCompeticao.getDate() - 21);
      
      setFormData(prev => ({
        ...prev,
        dataNominacaoPreliminar: dataNominacaoPreliminar.toISOString().split('T')[0],
        dataNominacaoFinal: dataNominacaoFinal.toISOString().split('T')[0]
      }));
    }
  }, [formData.dataCompeticao]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Se for admin, carrega todos os dados
      // Se for usuário comum, carrega apenas dados da sua equipe
      let atletasData: Atleta[];
      let equipesData: Equipe[];
      
      if (user?.tipo === 'admin') {
        [atletasData, equipesData] = await Promise.all([
          atletaService.getAll(),
          equipeService.getAll()
        ]);
      } else {
        // Usuário comum - só pode ver atletas da sua equipe
        if (!user?.idEquipe) {
          toast.error('Usuário não está vinculado a uma equipe');
          setAtletas([]);
          setEquipes([]);
          setCompeticoes([]);
          return;
        }
        
        const atletasDaEquipe = await atletaService.getAll();
        atletasData = atletasDaEquipe.filter(atleta => atleta.idEquipe === user.idEquipe);
        
        const equipeDoUsuario = await equipeService.getById(user.idEquipe);
        equipesData = equipeDoUsuario ? [equipeDoUsuario] : [];
      }
      
      const competicoesData = await competicaoService.getAll();
      
      setAtletas(atletasData);
      setEquipes(equipesData);
      setCompeticoes(competicoesData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se é admin
    if (user?.tipo !== 'admin') {
      toast.error('Apenas administradores podem gerenciar competições');
      return;
    }

    try {
      const competicaoData = {
        nomeCompeticao: formData.nomeCompeticao,
        dataCompeticao: new Date(formData.dataCompeticao),
        valorInscricao: parseFloat(formData.valorInscricao),
        valorDobra: formData.valorDobra ? parseFloat(formData.valorDobra) : undefined,
        dataInicioInscricao: new Date(formData.dataInicioInscricao),
        dataFimInscricao: new Date(formData.dataFimInscricao),
        dataNominacaoPreliminar: formData.dataNominacaoPreliminar ? new Date(formData.dataNominacaoPreliminar) : undefined,
        dataNominacaoFinal: formData.dataNominacaoFinal ? new Date(formData.dataNominacaoFinal) : undefined,
        local: formData.local,
        descricao: formData.descricao,
        status: formData.status,
        permiteDobraCategoria: formData.permiteDobraCategoria
      };

      if (editingCompeticao) {
        await competicaoService.update(editingCompeticao.id!, competicaoData);
        toast.success('Competição atualizada com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou competição',
          detalhes: `Atualizou competição: ${formData.nomeCompeticao}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await competicaoService.create(competicaoData);
        toast.success('Competição criada com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Criou competição',
          detalhes: `Criou competição: ${formData.nomeCompeticao}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar competição');
      console.error(error);
    }
  };

  const handleEdit = (competicao: Competicao) => {
    // Verificar se é admin
    if (user?.tipo !== 'admin') {
      toast.error('Apenas administradores podem editar competições');
      return;
    }
    
    setEditingCompeticao(competicao);
    setFormData({
      nomeCompeticao: competicao.nomeCompeticao,
      dataCompeticao: competicao.dataCompeticao.toISOString().split('T')[0],
      valorInscricao: competicao.valorInscricao.toString(),
      valorDobra: competicao.valorDobra?.toString() || '',
      dataInicioInscricao: competicao.dataInicioInscricao.toISOString().split('T')[0],
      dataFimInscricao: competicao.dataFimInscricao.toISOString().split('T')[0],
      dataNominacaoPreliminar: competicao.dataNominacaoPreliminar?.toISOString().split('T')[0] || '',
      dataNominacaoFinal: competicao.dataNominacaoFinal?.toISOString().split('T')[0] || '',
      local: competicao.local || '',
      descricao: competicao.descricao || '',
      status: competicao.status,
      permiteDobraCategoria: competicao.permiteDobraCategoria || false
    });
    setShowModal(true);
  };

  const handleInscricoes = async (competicao: Competicao) => {
    setSelectedCompeticao(competicao);
    try {
      const inscricoesData = await inscricaoService.getByCompeticao(competicao.id!);
      setInscricoes(inscricoesData);
      setShowInscricoesModal(true);
    } catch (error) {
      toast.error('Erro ao carregar inscrições');
      console.error(error);
    }
  };

  const handleDelete = async (competicao: Competicao) => {
    // Verificar se é admin
    if (user?.tipo !== 'admin') {
      toast.error('Apenas administradores podem excluir competições');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir a competição ${competicao.nomeCompeticao}?`)) {
      try {
        await competicaoService.delete(competicao.id!);
        toast.success('Competição excluída com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Excluiu competição',
          detalhes: `Excluiu competição: ${competicao.nomeCompeticao}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadData();
      } catch (error) {
        toast.error('Erro ao excluir competição');
        console.error(error);
      }
    }
  };

  const handleExportCSV = () => {
    try {
      // Verificar se é admin
      if (user?.tipo !== 'admin') {
        toast.error('Apenas administradores podem exportar dados');
        return;
      }

      // Preparar dados para CSV
      const csvContent = [
        ['Nome', 'Data', 'Local', 'Valor Inscrição', 'Valor Dobra', 'Status', 'Início Inscrições', 'Fim Inscrições', 'Descrição'],
        ...competicoes.map(competicao => [
          competicao.nomeCompeticao,
          competicao.dataCompeticao.toLocaleDateString('pt-BR'),
          competicao.local || '',
          `R$ ${competicao.valorInscricao.toFixed(2)}`,
          competicao.valorDobra ? `R$ ${competicao.valorDobra.toFixed(2)}` : '',
          competicao.status,
          competicao.dataInicioInscricao.toLocaleDateString('pt-BR'),
          competicao.dataFimInscricao.toLocaleDateString('pt-BR'),
          competicao.descricao || ''
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `competicoes_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar log
      logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Exportou lista de competições',
        detalhes: `Exportou ${competicoes.length} competições em CSV`,
        tipoUsuario: user?.tipo || 'usuario'
      }).catch(error => {
        console.warn('Erro ao registrar log de exportação:', error);
      });
      
      toast.success(`Lista de ${competicoes.length} competições exportada com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      nomeCompeticao: '',
      dataCompeticao: '',
      valorInscricao: '',
      valorDobra: '',
      dataInicioInscricao: '',
      dataFimInscricao: '',
      dataNominacaoPreliminar: '',
      dataNominacaoFinal: '',
      local: '',
      descricao: '',
      status: 'AGENDADA',
      permiteDobraCategoria: false
    });
    setEditingCompeticao(null);
  };

  const filteredCompeticoes = competicoes.filter(competicao =>
    competicao.nomeCompeticao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (competicao.local && competicao.local.toLowerCase().includes(searchTerm.toLowerCase())) ||
    competicao.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AGENDADA':
        return <Badge bg="primary">Agendada</Badge>;
      case 'REALIZADA':
        return <Badge bg="success">Realizada</Badge>;
      case 'CANCELADA':
        return <Badge bg="danger">Cancelada</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🏆 Gestão de Competições</h2>
          {user?.tipo !== 'admin' && (
            <p className="text-muted mb-0">
              Visualização apenas - Apenas administradores podem gerenciar competições
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          {user?.tipo === 'admin' && (
            <>
              <Button 
                variant="outline-success" 
                onClick={handleExportCSV}
                title="Exportar lista de competições em CSV"
              >
                <FaFileExport className="me-2" />
                Exportar CSV
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setEditingCompeticao(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                <FaPlus className="me-2" />
                Nova Competição
              </Button>
            </>
          )}
        </div>
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
                  placeholder="Buscar por nome, local ou status..."
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
                <th>Data</th>
                <th>Local</th>
                <th>Valor Inscrição</th>
                <th>Status</th>
                <th>Inscrições</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompeticoes.map((competicao) => (
                <tr key={competicao.id}>
                  <td>
                    <strong>{competicao.nomeCompeticao}</strong>
                    {competicao.permiteDobraCategoria && (
                      <Badge bg="warning" className="ms-2">Dobra</Badge>
                    )}
                  </td>
                  <td>
                    <div>
                      <FaCalendarAlt className="me-1" />
                      {competicao.dataCompeticao.toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td>
                    {competicao.local && (
                      <div>
                        <FaMapMarkerAlt className="me-1" />
                        {competicao.local}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <FaMoneyBillWave className="me-1" />
                      R$ {competicao.valorInscricao.toFixed(2)}
                      {competicao.valorDobra && (
                        <span className="text-muted ms-1">
                          (Dobra: R$ {competicao.valorDobra.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(competicao.status)}</td>
                  <td>
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={() => handleInscricoes(competicao)}
                    >
                      <FaUsers className="me-1" />
                      Ver Inscrições
                    </Button>
                  </td>
                  <td>
                    {user?.tipo === 'admin' && (
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Ações
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEdit(competicao)}>
                            <FaEdit className="me-2" />
                            Editar
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDelete(competicao)}>
                            <FaTrash className="me-2" />
                            Excluir
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredCompeticoes.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhuma competição encontrada.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCompeticao ? 'Editar Competição' : 'Nova Competição'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Informação:</strong> Apenas administradores podem criar e editar competições.
              <br />
              <strong>📅 Datas Automáticas:</strong> As datas de nominata preliminar (60 dias antes) e final (21 dias antes) são calculadas automaticamente baseadas na data da competição.
            </Alert>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Competição *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nomeCompeticao}
                    onChange={(e) => setFormData({...formData, nomeCompeticao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data da Competição *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataCompeticao}
                    onChange={(e) => setFormData({...formData, dataCompeticao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Local</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.local}
                    onChange={(e) => setFormData({...formData, local: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    required
                  >
                    <option value="AGENDADA">Agendada</option>
                    <option value="REALIZADA">Realizada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor da Inscrição (R$) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorInscricao}
                    onChange={(e) => setFormData({...formData, valorInscricao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor da Dobra (R$)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorDobra}
                    onChange={(e) => setFormData({...formData, valorDobra: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Início das Inscrições *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataInicioInscricao}
                    onChange={(e) => setFormData({...formData, dataInicioInscricao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fim das Inscrições *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataFimInscricao}
                    onChange={(e) => setFormData({...formData, dataFimInscricao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nominata Preliminar 
                    <Badge bg="info" className="ms-2">Auto: 60 dias antes</Badge>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNominacaoPreliminar}
                    onChange={(e) => setFormData({...formData, dataNominacaoPreliminar: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    Calculada automaticamente 60 dias antes da competição
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nominata Final 
                    <Badge bg="info" className="ms-2">Auto: 21 dias antes</Badge>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNominacaoFinal}
                    onChange={(e) => setFormData({...formData, dataNominacaoFinal: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    Calculada automaticamente 21 dias antes da competição
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Permite dobra de categoria"
                    checked={formData.permiteDobraCategoria}
                    onChange={(e) => setFormData({...formData, permiteDobraCategoria: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingCompeticao ? 'Atualizar' : 'Criar'} Competição
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Inscrições */}
      <Modal show={showInscricoesModal} onHide={() => setShowInscricoesModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" />
            Inscrições - {selectedCompeticao?.nomeCompeticao}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="inscritos" className="mb-3">
            <Tab eventKey="inscritos" title="Inscritos">
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Equipe</th>
                    <th>Data Inscrição</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Dobra</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.filter(i => i.statusInscricao === 'INSCRITO').map((inscricao) => (
                    <tr key={inscricao.id}>
                      <td>
                        <div>
                          <strong>{inscricao.atleta?.nome}</strong>
                          <br />
                          <small className="text-muted">{inscricao.atleta?.cpf}</small>
                        </div>
                      </td>
                      <td>{inscricao.atleta?.equipe?.nomeEquipe || '-'}</td>
                      <td>
                        {inscricao.dataInscricao?.toLocaleDateString('pt-BR') || '-'}
                      </td>
                      <td>
                        <Badge bg="success">
                          <FaUserCheck className="me-1" />
                          Inscrito
                        </Badge>
                      </td>
                      <td>
                        R$ {inscricao.valorIndividual?.toFixed(2) || selectedCompeticao?.valorInscricao.toFixed(2)}
                      </td>
                      <td>
                        {inscricao.temDobra ? (
                          <Badge bg="warning">Sim</Badge>
                        ) : (
                          <Badge bg="secondary">Não</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {inscricoes.filter(i => i.statusInscricao === 'INSCRITO').length === 0 && (
                <Alert variant="info" className="text-center">
                  Nenhum atleta inscrito nesta competição.
                </Alert>
              )}
            </Tab>
            <Tab eventKey="cancelados" title="Cancelados">
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Equipe</th>
                    <th>Data Inscrição</th>
                    <th>Status</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.filter(i => i.statusInscricao === 'CANCELADO').map((inscricao) => (
                    <tr key={inscricao.id}>
                      <td>
                        <div>
                          <strong>{inscricao.atleta?.nome}</strong>
                          <br />
                          <small className="text-muted">{inscricao.atleta?.cpf}</small>
                        </div>
                      </td>
                      <td>{inscricao.atleta?.equipe?.nomeEquipe || '-'}</td>
                      <td>
                        {inscricao.dataInscricao?.toLocaleDateString('pt-BR') || '-'}
                      </td>
                      <td>
                        <Badge bg="danger">
                          <FaUserTimes className="me-1" />
                          Cancelado
                        </Badge>
                      </td>
                      <td>{inscricao.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {inscricoes.filter(i => i.statusInscricao === 'CANCELADO').length === 0 && (
                <Alert variant="info" className="text-center">
                  Nenhuma inscrição cancelada.
                </Alert>
              )}
            </Tab>
            <Tab eventKey="estatisticas" title="Estatísticas">
              <Row>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.statusInscricao === 'INSCRITO').length}</h3>
                      <p className="text-muted">Total de Inscritos</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.statusInscricao === 'CANCELADO').length}</h3>
                      <p className="text-muted">Inscrições Canceladas</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.temDobra).length}</h3>
                      <p className="text-muted">Atletas com Dobra</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={12}>
                  <Card>
                    <Card.Header>
                      <FaChartBar className="me-2" />
                      Inscrições por Equipe
                    </Card.Header>
                    <Card.Body>
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Equipe</th>
                            <th>Total de Inscritos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(new Set(inscricoes
                            .filter(i => i.statusInscricao === 'INSCRITO')
                            .map(i => i.atleta?.equipe?.nomeEquipe)))
                            .filter(equipe => equipe)
                            .map(equipe => (
                              <tr key={equipe}>
                                <td>{equipe}</td>
                                <td>
                                  {inscricoes.filter(i => 
                                    i.statusInscricao === 'INSCRITO' && 
                                    i.atleta?.equipe?.nomeEquipe === equipe
                                  ).length}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInscricoesModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CompeticoesPage;
