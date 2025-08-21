import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Table, 
  Badge, 
  Alert,
  Spinner,
  Form,
  Modal
} from 'react-bootstrap';
import { 
  FaChartBar, 
  FaDownload, 
  FaUsers, 
  FaTrophy, 
  FaMoneyBillWave,
  FaFileAlt,
  FaCalendarAlt,
  FaPrint
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { 
  atletaService, 
  equipeService, 
  competicaoService, 
  inscricaoService 
} from '../services/firebaseService';
import { Atleta, Equipe, Competicao, InscricaoCompeticao } from '../types';

interface RelatorioStats {
  totalAtletas: number;
  totalEquipes: number;
  totalCompeticoes: number;
  totalInscricoes: number;
  atletasAtivos: number;
  atletasInativos: number;
  competicoesRealizadas: number;
  competicoesAgendadas: number;
}

const RelatoriosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RelatorioStats>({
    totalAtletas: 0,
    totalEquipes: 0,
    totalCompeticoes: 0,
    totalInscricoes: 0,
    atletasAtivos: 0,
    atletasInativos: 0,
    competicoesRealizadas: 0,
    competicoesAgendadas: 0
  });
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoCompeticao[]>([]);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [tipoRelatorio, setTipoRelatorio] = useState<'atletas' | 'equipes' | 'competicoes'>('atletas');
  
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [atletasData, equipesData, competicoesData, inscricoesData] = await Promise.all([
        atletaService.getAll(),
        equipeService.getAll(),
        competicaoService.getAll(),
        inscricaoService.getAll()
      ]);

      setAtletas(atletasData);
      setEquipes(equipesData);
      setCompeticoes(competicoesData);
      setInscricoes(inscricoesData);

      // Calcular estatísticas
      const atletasAtivos = atletasData.filter(a => a.status === 'ATIVO').length;
      const atletasInativos = atletasData.filter(a => a.status === 'INATIVO').length;
      const competicoesRealizadas = competicoesData.filter(c => c.status === 'REALIZADA').length;
      const competicoesAgendadas = competicoesData.filter(c => c.status === 'AGENDADA').length;

      setStats({
        totalAtletas: atletasData.length,
        totalEquipes: equipesData.length,
        totalCompeticoes: competicoesData.length,
        totalInscricoes: inscricoesData.length,
        atletasAtivos,
        atletasInativos,
        competicoesRealizadas,
        competicoesAgendadas
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados para relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarRelatorio = (tipo: 'atletas' | 'equipes' | 'competicoes') => {
    setTipoRelatorio(tipo);
    setShowRelatorioModal(true);
  };

  const handleExportarRelatorio = () => {
    // Implementar exportação de relatório
    toast.info('Funcionalidade de exportação será implementada em breve');
    setShowRelatorioModal(false);
  };

  const handleImprimirRelatorio = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            <FaChartBar className="me-2" />
            Relatórios do Sistema
          </h2>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <FaUsers className="text-primary mb-2" size={30} />
              <h4>{stats.totalAtletas}</h4>
              <p className="text-muted mb-0">Total de Atletas</p>
              <small className="text-success">
                {stats.atletasAtivos} ativos / {stats.atletasInativos} inativos
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <FaUsers className="text-success mb-2" size={30} />
              <h4>{stats.totalEquipes}</h4>
              <p className="text-muted mb-0">Total de Equipes</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <FaTrophy className="text-warning mb-2" size={30} />
              <h4>{stats.totalCompeticoes}</h4>
              <p className="text-muted mb-0">Total de Competições</p>
              <small className="text-info">
                {stats.competicoesRealizadas} realizadas / {stats.competicoesAgendadas} agendadas
              </small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <FaFileAlt className="text-info mb-2" size={30} />
              <h4>{stats.totalInscricoes}</h4>
              <p className="text-muted mb-0">Total de Inscrições</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Botões de Relatórios */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Relatório de Atletas
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Relatório detalhado com informações de todos os atletas cadastrados.
              </p>
              <Button 
                variant="primary" 
                onClick={() => handleGerarRelatorio('atletas')}
                className="w-100"
              >
                <FaDownload className="me-2" />
                Gerar Relatório
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Relatório de Equipes
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Relatório com informações das equipes e seus atletas.
              </p>
              <Button 
                variant="success" 
                onClick={() => handleGerarRelatorio('equipes')}
                className="w-100"
              >
                <FaDownload className="me-2" />
                Gerar Relatório
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                <FaTrophy className="me-2" />
                Relatório de Competições
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Relatório de competições e inscrições realizadas.
              </p>
              <Button 
                variant="warning" 
                onClick={() => handleGerarRelatorio('competicoes')}
                className="w-100"
              >
                <FaDownload className="me-2" />
                Gerar Relatório
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Relatório */}
      <Modal show={showRelatorioModal} onHide={() => setShowRelatorioModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaChartBar className="me-2" />
            Relatório de {tipoRelatorio === 'atletas' ? 'Atletas' : tipoRelatorio === 'equipes' ? 'Equipes' : 'Competições'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Row>
              <Col md={6}>
                <Button variant="outline-primary" onClick={handleImprimirRelatorio}>
                  <FaPrint className="me-2" />
                  Imprimir
                </Button>
              </Col>
              <Col md={6} className="text-end">
                <Button variant="outline-success" onClick={handleExportarRelatorio}>
                  <FaDownload className="me-2" />
                  Exportar PDF
                </Button>
              </Col>
            </Row>
          </div>

          {tipoRelatorio === 'atletas' && (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Equipe</th>
                  <th>Status</th>
                  <th>Data Filiação</th>
                </tr>
              </thead>
              <tbody>
                {atletas.map(atleta => (
                  <tr key={atleta.id}>
                    <td>{atleta.nome}</td>
                    <td>{atleta.cpf}</td>
                    <td>{atleta.equipe?.nomeEquipe || '-'}</td>
                    <td>
                      <Badge bg={atleta.status === 'ATIVO' ? 'success' : 'secondary'}>
                        {atleta.status}
                      </Badge>
                    </td>
                    <td>{atleta.dataFiliacao.toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {tipoRelatorio === 'equipes' && (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>Nome da Equipe</th>
                  <th>Cidade</th>
                  <th>Técnico</th>
                  <th>Total Atletas</th>
                  <th>Data Criação</th>
                </tr>
              </thead>
              <tbody>
                {equipes.map(equipe => {
                  const atletasEquipe = atletas.filter(a => a.idEquipe === equipe.id);
                  return (
                    <tr key={equipe.id}>
                      <td>{equipe.nomeEquipe}</td>
                      <td>{equipe.cidade}</td>
                      <td>{equipe.tecnico || '-'}</td>
                      <td>
                        <Badge bg="info">{atletasEquipe.length}</Badge>
                      </td>
                      <td>{equipe.dataCriacao?.toLocaleDateString('pt-BR') || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}

          {tipoRelatorio === 'competicoes' && (
            <Table responsive striped>
              <thead>
                <tr>
                  <th>Competição</th>
                  <th>Data</th>
                  <th>Local</th>
                  <th>Status</th>
                  <th>Inscrições</th>
                </tr>
              </thead>
              <tbody>
                {competicoes.map(competicao => {
                  const inscricoesCompeticao = inscricoes.filter(i => i.idCompeticao === competicao.id);
                  return (
                    <tr key={competicao.id}>
                      <td>{competicao.nomeCompeticao}</td>
                      <td>{competicao.dataCompeticao.toLocaleDateString('pt-BR')}</td>
                      <td>{competicao.local || '-'}</td>
                      <td>
                        <Badge bg={
                          competicao.status === 'REALIZADA' ? 'success' : 
                          competicao.status === 'AGENDADA' ? 'warning' : 'danger'
                        }>
                          {competicao.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="info">{inscricoesCompeticao.length}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRelatorioModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RelatoriosPage;
