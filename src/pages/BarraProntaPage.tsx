import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Alert, Modal, Table, Spinner } from 'react-bootstrap';
import { FaWeightHanging, FaUsers, FaTrophy, FaChartBar, FaCog, FaHome, FaSave, FaFolderOpen, FaPlus, FaDownload, FaUpload } from 'react-icons/fa';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/barraProntaStore';
import { GlobalState, LiftStatus } from '../types/barraProntaTypes';
import { createNewMeet, loadSavedMeetData, saveMeetData, updateMeet, addEntry, saveMeetToFile, loadMeetFromFile } from '../actions/barraProntaActions';
import { competicaoService, inscricaoService } from '../services/firebaseService';
import { Competicao } from '../types';
import { CATEGORIAS_PESO_MASCULINO, CATEGORIAS_PESO_FEMININO, CATEGORIAS_IDADE } from '../config/categorias';
import MeetSetup from '../components/barraPronta/MeetSetup';
import Registration from '../components/barraPronta/Registration';
import WeighIns from '../components/barraPronta/WeighIns';
import FlightOrder from '../components/barraPronta/FlightOrder';
import Lifting from '../components/barraPronta/Lifting';
import Results from '../components/barraPronta/Results';
import LiftingPage from './LiftingPage';

const BarraProntaContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleSaveToFile = async () => {
    try {
      setLoading(true);
      await dispatch(saveMeetToFile() as any);
      alert('Competição salva para arquivo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar para arquivo:', error);
      alert('Erro ao salvar para arquivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromFile = () => {
    // Confirmar se o usuário quer apagar dados existentes
    if (meet.name || registration.entries.length > 0) {
      if (!window.confirm('Tem certeza que deseja carregar um arquivo? Isso apagará todos os dados atuais da competição.')) {
        return;
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar extensão do arquivo
    if (!file.name.endsWith('.barrapronta') && !file.name.endsWith('.json')) {
      setFileError('Por favor, selecione um arquivo .barrapronta ou .json válido');
      return;
    }

    setLoading(true);
    setFileError('');

    try {
      // Limpar dados existentes antes de carregar (mesmo comportamento de "Nova Competição")
      dispatch(createNewMeet() as any);
      
      // Aguardar um momento para garantir que a limpeza foi processada
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Agora carregar o arquivo
      await dispatch(loadMeetFromFile(file) as any);
      alert('Competição carregada do arquivo com sucesso!');
      
      // Limpar o input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setFileError(error.message || 'Erro ao carregar arquivo');
      console.error('Erro ao carregar arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMeet = async () => {
    // Confirmar se o usuário quer apagar dados existentes
    if (meet.name || registration.entries.length > 0) {
      if (!window.confirm('Tem certeza que deseja carregar uma competição do sistema? Isso apagará todos os dados atuais da competição.')) {
        return;
      }
    }
    
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

  const handleSelectCompeticao = async (competicao: Competicao) => {
    try {
      // Limpar dados existentes antes de carregar (mesmo comportamento de "Nova Competição")
      dispatch(createNewMeet() as any);
      
      // Aguardar um momento para garantir que a limpeza foi processada
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
          { weightKg: 25, color: '#FF0000', pairCount: 10 },
          { weightKg: 20, color: '#0000FF', pairCount: 10 },
          { weightKg: 15, color: '#FFFF00', pairCount: 10 },
          { weightKg: 10, color: '#008000', pairCount: 10 },
          { weightKg: 5, color: '#000000', pairCount: 10 },
          { weightKg: 2.5, color: '#000000', pairCount: 10 },
          { weightKg: 1.25, color: '#000000', pairCount: 10 }
        ],
        showAlternateUnits: false
      };

      // Dispatch para atualizar o estado da competição
      dispatch(updateMeet(meetData));

      // Carregar atletas inscritos na competição
      const inscricoes = await inscricaoService.getByCompeticao(competicao.id!);
      const atletasInscritos = inscricoes.filter(insc => insc.statusInscricao === 'INSCRITO');

      // Converter inscrições para o formato do Barra Pronta
      let entryId = 1;
      for (const inscricao of atletasInscritos) {
        if (inscricao.atleta && inscricao.categoriaPeso && inscricao.categoriaIdade) {
                     const entry = {
             id: entryId++,
             name: inscricao.atleta.nome,
             sex: inscricao.atleta.sexo,
             age: new Date().getFullYear() - new Date(inscricao.atleta.dataNascimento || new Date()).getFullYear(),
             division: inscricao.categoriaIdade.nome,
             weightClassKg: inscricao.categoriaPeso.pesoMaximo,
             equipment: inscricao.modalidade === 'CLASSICA' ? 'Raw' : 'Equipped',
             team: inscricao.atleta.equipe?.nomeEquipe || '',
             country: 'Brasil',
             state: inscricao.atleta.equipe?.cidade || 'RJ',
             notes: inscricao.observacoes || '',
             // Campos obrigatórios
             birthDate: inscricao.atleta.dataNascimento ? new Date(inscricao.atleta.dataNascimento).toISOString() : new Date().toISOString(),
             weightClass: inscricao.categoriaPeso.nome || 'Open',
             squatStatus: [0, 0, 0] as LiftStatus[],
             benchStatus: [0, 0, 0] as LiftStatus[],
             deadliftStatus: [0, 0, 0] as LiftStatus[],
             
             // Campos de tentativas
             squat1: null, squat2: null, squat3: null,
             bench1: null, bench2: null, bench3: null,
             deadlift1: null, deadlift2: null, deadlift3: null,
             bodyweightKg: null,
             lotNumber: null,
             squatHeight: null,
             benchHeight: null,
             platform: 1,
             flight: 'A',
             day: 1,
             movements: 'AST', // Padrão: Agachamento + Supino + Terra
             sessionNumber: null,
             tested: false
           };

          dispatch(addEntry(entry) as any);
        }
      }

      const mensagem = `Competição "${competicao.nomeCompeticao}" carregada com sucesso!\n\n` +
        `Categorias carregadas:\n` +
        `- Peso Masculino: ${weightClassesKgMen.length} classes\n` +
        `- Peso Feminino: ${weightClassesKgWomen.length} classes\n` +
        `- Divisões: ${divisions.length} categorias de idade\n\n` +
        `Atletas inscritos: ${atletasInscritos.length} atletas carregados automaticamente`;

      alert(mensagem);
      setShowLoadModal(false);
      
      // Redirecionar para a aba de inscrições para ver os atletas carregados
      setActiveTab('registration');
    } catch (error) {
      console.error('Erro ao carregar competição:', error);
      alert('Erro ao carregar competição. Tente novamente.');
    }
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
                    Ordem dos Grupos
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
                  <Row>
                    {/* Coluna esquerda - Texto de boas-vindas e status */}
                    <Col lg={8}>
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
                          <div className="mt-2">
                            <small className="text-success">
                              <FaSave className="me-1" />
                              Salvamento automático ativo - Todas as alterações são salvas automaticamente
                            </small>
                          </div>
                        </Alert>

                        {/* Cards informativos */}
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
                    </Col>

                    {/* Coluna direita - Botões de ação verticais */}
                    <Col lg={4}>
                      <div className="py-5">
                        <h4 className="text-center mb-4">Ações</h4>
                        
                        {/* Botões principais */}
                        <div className="d-grid gap-3">
                          <Button variant="primary" onClick={handleNewMeet} className="w-100">
                            <FaPlus className="me-2" />
                            Nova Competição
                          </Button>
                          
                          <Button variant="success" onClick={handleSaveMeet} className="w-100">
                            <FaSave className="me-2" />
                            Salvar no Sistema
                          </Button>
                          
                          <Button variant="warning" onClick={handleSaveToFile} className="w-100">
                            <FaDownload className="me-2" />
                            Salvar para Arquivo
                          </Button>
                          
                          <Button variant="info" onClick={handleLoadFromFile} className="w-100">
                            <FaUpload className="me-2" />
                            Carregar de Arquivo
                          </Button>
                          
                          <Button variant="secondary" onClick={handleLoadMeet} className="w-100">
                            <FaFolderOpen className="me-2" />
                            Carregar do Sistema
                          </Button>
                        </div>

                        {/* Input file oculto para carregar arquivos */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".barrapronta,.json"
                          style={{ display: 'none' }}
                          onChange={handleFileInputChange}
                        />

                        {/* Exibir erros de arquivo */}
                        {fileError && (
                          <Alert variant="danger" className="mt-3">
                            {fileError}
                          </Alert>
                        )}

                        {/* Loading para operações de arquivo */}
                        {loading && (
                          <div className="text-center mt-3">
                            <Spinner animation="border" size="sm" className="me-2" />
                            <span>Processando arquivo...</span>
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
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
                
                <Tab.Pane active={activeTab === 'results'}>
                  <Results />
                </Tab.Pane>
                
                <Tab.Pane active={activeTab === 'lifting'}>
                  <LiftingPage />
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
