import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Alert, Modal, Table, Spinner } from 'react-bootstrap';
import { FaWeightHanging, FaUsers, FaTrophy, FaChartBar, FaCog, FaHome, FaSave, FaFolderOpen, FaPlus } from 'react-icons/fa';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/barraProntaStore';
import { GlobalState } from '../types/barraProntaTypes';
import { createNewMeet, loadSavedMeetData, saveMeetData, updateMeet } from '../actions/barraProntaActions';
import { competicaoService } from '../services/firebaseService';
import { Competicao } from '../types';
import { CATEGORIAS_PESO_MASCULINO, CATEGORIAS_PESO_FEMININO, CATEGORIAS_IDADE } from '../config/categorias';
import MeetSetup from '../components/barraPronta/MeetSetup';
import Registration from '../components/barraPronta/Registration';
import WeighIns from '../components/barraPronta/WeighIns';
import FlightOrder from '../components/barraPronta/FlightOrder';
import Lifting from '../components/barraPronta/Lifting';
import Results from '../components/barraPronta/Results';

const BarraProntaContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);

  useEffect(() => {
    // Tentar carregar dados salvos ao iniciar
    dispatch(loadSavedMeetData() as any);
  }, [dispatch]);

  const handleNewMeet = () => {
    if (window.confirm('Tem certeza que deseja criar uma nova competição? Isso apagará todos os dados atuais.')) {
      dispatch(createNewMeet() as any);
      // Redirecionar para a aba de configuração
      setActiveTab('meet-setup');
    }
  };

  const handleSaveMeet = () => {
    dispatch(saveMeetData() as any);
    alert('Competição salva com sucesso!');
  };

  const handleLoadMeet = async () => {
    setLoading(true);
    try {
      const competicoesData = await competicaoService.getAll();
      // Filtrar apenas competições agendadas
      const competicoesAgendadas = competicoesData.filter(comp => comp.status === 'AGENDADA');
      setCompeticoes(competicoesAgendadas);
      setShowLoadModal(true);
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
      alert('Erro ao carregar competições. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompeticao = (competicao: Competicao) => {
    // Usar exatamente as categorias configuradas no sistema
    const weightClassesKgMen = CATEGORIAS_PESO_MASCULINO
      .map(cat => cat.pesoMaximo)
      .sort((a, b) => a - b);

    const weightClassesKgWomen = CATEGORIAS_PESO_FEMININO
      .map(cat => cat.pesoMaximo)
      .sort((a, b) => a - b);

    // Usar exatamente as divisões configuradas no sistema
    const divisions = CATEGORIAS_IDADE
      .map(cat => cat.nome);

    // Converter dados da competição para o formato do Barra Pronta
    const meetData = {
      name: competicao.nomeCompeticao,
      country: 'Brasil', // Valor padrão
      state: '', // Pode ser extraído do local se necessário
      city: competicao.local || '',
      federation: 'FEPERJ', // Valor padrão
      date: formatDate(competicao.dataCompeticao),
      lengthDays: 1, // Valor padrão
      platformsOnDays: [1], // Valor padrão
      ageCoefficients: {
        men: [],
        women: []
      },
      divisions: divisions, // Usar as divisões configuradas no sistema
      weightClassesKgMen: weightClassesKgMen, // Usar as classes de peso masculino configuradas
      weightClassesKgWomen: weightClassesKgWomen, // Usar as classes de peso feminino configuradas
      weightClassesKgMx: [],
      formula: 'IPF' as const,
      combineSleevesAndWraps: false,
      combineSingleAndMulti: false,
      allow4thAttempts: false,
      roundTotalsDown: false,
      inKg: true,
      squatBarAndCollarsWeightKg: 20,
      benchBarAndCollarsWeightKg: 20,
      deadliftBarAndCollarsWeightKg: 20,
      plates: [
        { weightKg: 25, color: '#000000', diameterMm: 450 },
        { weightKg: 20, color: '#000000', diameterMm: 450 },
        { weightKg: 15, color: '#000000', diameterMm: 450 },
        { weightKg: 10, color: '#000000', diameterMm: 450 },
        { weightKg: 5, color: '#000000', diameterMm: 450 },
        { weightKg: 2.5, color: '#000000', diameterMm: 450 },
        { weightKg: 1.25, color: '#000000', diameterMm: 450 }
      ],
      showAlternateUnits: false
    };

    // Dispatch para atualizar o estado da competição
    dispatch(updateMeet(meetData));

    alert(`Competição "${competicao.nomeCompeticao}" carregada com sucesso!\n\nCategorias carregadas:\n- Peso Masculino: ${weightClassesKgMen.length} classes\n- Peso Feminino: ${weightClassesKgWomen.length} classes\n- Divisões: ${divisions.length} categorias de idade`);
    setShowLoadModal(false);
    
    // Redirecionar para a aba de configuração para ver os dados carregados
    setActiveTab('meet-setup');
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <FaWeightHanging className="me-3" size={32} />
            <div>
              <h2 className="mb-0">Sistema Barra Pronta</h2>
              <p className="text-muted mb-0">Gerenciamento de Competições de Powerlifting</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'home')}>
                <Nav.Item>
                  <Nav.Link eventKey="home">
                    <FaHome className="me-2" />
                    Início
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="meet-setup">
                    <FaCog className="me-2" />
                    Configuração da Competição
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="registration">
                    <FaUsers className="me-2" />
                    Inscrições
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="weigh-ins">
                    <FaWeightHanging className="me-2" />
                    Pesagem
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="flight-order">
                    <FaTrophy className="me-2" />
                    Ordem de Voo
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="lifting">
                    <FaWeightHanging className="me-2" />
                    Levantamento
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="results">
                    <FaChartBar className="me-2" />
                    Resultados
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                <Tab.Pane active={activeTab === 'home'}>
                  <div className="text-center py-5">
                    <FaWeightHanging size={64} className="text-primary mb-4" />
                    <h3>Bem-vindo ao Sistema Barra Pronta</h3>
                    <p className="text-muted">
                      Sistema integrado para gerenciamento de competições de powerlifting.
                    </p>
                    
                    {/* Status da competição atual */}
                    <Alert variant="info" className="mt-4">
                      <h5>Status da Competição</h5>
                      <p><strong>Nome:</strong> {meet.name || 'Não configurado'}</p>
                      <p><strong>Local:</strong> {meet.city || 'Não configurado'}</p>
                      <p><strong>Data:</strong> {meet.date || 'Não configurado'}</p>
                      <p><strong>Atletas inscritos:</strong> {registration.entries.length}</p>
                    </Alert>

                    {/* Botões de ação */}
                    <div className="row mt-4">
                      <div className="col-md-4">
                        <Button variant="primary" onClick={handleNewMeet} className="w-100 mb-2">
                          <FaPlus className="me-2" />
                          Nova Competição
                        </Button>
                      </div>
                      <div className="col-md-4">
                        <Button variant="success" onClick={handleSaveMeet} className="w-100 mb-2">
                          <FaSave className="me-2" />
                          Salvar Competição
                        </Button>
                      </div>
                      <div className="col-md-4">
                        <Button variant="info" onClick={handleLoadMeet} className="w-100 mb-2">
                          <FaFolderOpen className="me-2" />
                          Carregar Competição
                        </Button>
                      </div>
                    </div>

                    <div className="row mt-4">
                      <div className="col-md-3">
                        <div className="border rounded p-3">
                          <FaCog className="text-primary mb-2" size={24} />
                          <h6>Configuração</h6>
                          <small className="text-muted">Configure sua competição</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded p-3">
                          <FaUsers className="text-primary mb-2" size={24} />
                          <h6>Inscrições</h6>
                          <small className="text-muted">Gerencie atletas</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded p-3">
                          <FaWeightHanging className="text-primary mb-2" size={24} />
                          <h6>Levantamento</h6>
                          <small className="text-muted">Controle as tentativas</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded p-3">
                          <FaChartBar className="text-primary mb-2" size={24} />
                          <h6>Resultados</h6>
                          <small className="text-muted">Visualize rankings</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'meet-setup'}>
                  <MeetSetup />
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'registration'}>
                  <Registration />
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'weigh-ins'}>
                  <WeighIns />
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'flight-order'}>
                  <FlightOrder />
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'lifting'}>
                  <Lifting />
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'results'}>
                  <Results />
                </Tab.Pane>
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal para carregar competições */}
      <Modal show={showLoadModal} onHide={() => setShowLoadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Carregar Competição</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Competições Agendadas</h5>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" className="me-3" />
              <span>Carregando competições...</span>
            </div>
          ) : competicoes.length === 0 ? (
            <p>Nenhuma competição agendada encontrada.</p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Nome da Competição</th>
                  <th>Local</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {competicoes.map((competicao) => (
                  <tr key={competicao.id}>
                    <td>{competicao.nomeCompeticao}</td>
                    <td>{competicao.local}</td>
                                         <td>{formatDateForDisplay(competicao.dataCompeticao)}</td>
                    <td>{competicao.status}</td>
                    <td>
                      <Button variant="info" size="sm" onClick={() => handleSelectCompeticao(competicao)}>
                        Selecionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLoadModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Wrapper com Provider do Redux
const BarraProntaPage: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BarraProntaContent />
      </PersistGate>
    </Provider>
  );
};

export default BarraProntaPage;
