import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Alert, Modal, Table, Spinner, Badge } from 'react-bootstrap';
import { FaWeightHanging, FaUsers, FaTrophy, FaChartBar, FaCog, FaHome, FaSave, FaFolderOpen, FaPlus, FaDownload, FaUpload, FaTrash } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/barraProntaStore';
import { createNewMeet, loadSavedMeetData, saveMeetData, updateMeet, addEntry, updateEntry, saveMeetToFile, loadMeetFromFile } from '../actions/barraProntaActions';
import { competicaoService, inscricaoService } from '../services/firebaseService';
import { barraProntaStateService } from '../services/barraProntaStateService';
import { usePageUnload } from '../hooks/usePageUnload';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { Competicao } from '../types';
import { CATEGORIAS_PESO_MASCULINO, CATEGORIAS_PESO_FEMININO, CATEGORIAS_IDADE } from '../config/categorias';
import MeetSetup from '../components/barraPronta/MeetSetup';
import Registration from '../components/barraPronta/Registration';
import WeighIns from '../components/barraPronta/WeighIns';
import FlightOrder from '../components/barraPronta/FlightOrder';
import ResultsMirror from '../components/barraPronta/ResultsMirror';
import LiftingPage from './LiftingPage';

const BarraProntaContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const meet = useSelector((state: RootState) => state.meet);
  const registration = useSelector((state: RootState) => state.registration);
  const [competicoesCarregadas, setCompeticoesCarregadas] = useState<Competicao[]>([]);
  const [nomeCompeticaoCombinado, setNomeCompeticaoCombinado] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    // Tentar carregar dados salvos ao iniciar
    dispatch(loadSavedMeetData() as any);
    
    // Aguardar um pouco e verificar se o estado foi restaurado
    const checkRestoration = setTimeout(() => {
      const restoredState = barraProntaStateService.forceRestoreState();
      if (restoredState && restoredState.meet?.name) {
        console.log('✅ [BARRA PRONTA] Estado restaurado com sucesso:', restoredState.meet.name);
      } else {
        console.log('ℹ️ [BARRA PRONTA] Nenhum estado anterior encontrado');
      }
    }, 1000);

    return () => clearTimeout(checkRestoration);
  }, [dispatch]);

  // Configurar persistência do estado
  useEffect(() => {
    // Configurar salvamento automático a cada 30 segundos
    const clearAutoSave = barraProntaStateService.setupAutoSave(30000);
    
    // Configurar salvamento antes de sair da página
    const clearBeforeUnload = barraProntaStateService.saveBeforeUnload();

    // Cleanup
    return () => {
      clearAutoSave();
      clearBeforeUnload();
    };
  }, []);

  // Salvar estado sempre que houver mudanças
  useEffect(() => {
    if (meet.name && meet.name.trim() !== '') {
      // Pequeno delay para evitar salvamentos excessivos
      const timeoutId = setTimeout(() => {
        barraProntaStateService.forceSaveState();
      }, 500); // Reduzido para 500ms para salvar mais rapidamente

      return () => clearTimeout(timeoutId);
    }
  }, [meet, registration]);

  // Verificar se há competição ativa para mostrar confirmação
  const hasActiveMeet = Boolean(meet.name && meet.name.trim() !== '');
  const confirmationMessage = `⚠️ ATENÇÃO: Você tem uma competição ativa "${meet.name}".\n\nSe você sair agora, a competição será salva automaticamente, mas é recomendado que você salve manualmente antes de sair.\n\nDeseja continuar e sair do Sistema Barra Pronta?`;

  // Usar hook para detectar saída da página
  usePageUnload(() => {
    if (hasActiveMeet) {
      console.log('🚪 [BARRA PRONTA] Salvando estado antes de sair da página...');
      barraProntaStateService.forceSaveState();
    }
  }, Boolean(hasActiveMeet));

  // Usar hook para interceptar navegação
  useNavigationGuard(
    hasActiveMeet,
    () => {
      console.log('💾 [BARRA PRONTA] Salvando competição antes de navegar...');
      barraProntaStateService.forceSaveState();
    },
    confirmationMessage
  );

  const handleNewMeet = () => {
    if (window.confirm('Tem certeza que deseja criar uma nova competição? Isso apagará todos os dados atuais.')) {
      dispatch(createNewMeet() as any);
      setCompeticoesCarregadas([]);
      setNomeCompeticaoCombinado(null);
      // Redirecionar para a aba de configuração
      setActiveTab('meet-setup');
    }
  };

  const handleLimparDados = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados da sessão atual? Esta ação não pode ser desfeita.')) {
      dispatch(createNewMeet() as any);
      setCompeticoesCarregadas([]);
      setNomeCompeticaoCombinado(null);
      alert('Todos os dados da sessão foram limpos com sucesso!');
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
    // Removido alerta de confirmação - carrega diretamente
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
      // Verificar se a competição já foi carregada
      if (competicoesCarregadas.some(c => c.id === competicao.id)) {
        alert('Esta competição já foi carregada!');
        return;
      }

      // Adicionar à lista de competições carregadas
      const novasCompeticoesCarregadas = [...competicoesCarregadas, competicao];
      setCompeticoesCarregadas(novasCompeticoesCarregadas);

      // Construir nome combinado
      const novoNome = competicoesCarregadas.length === 0 
        ? competicao.nomeCompeticao 
        : `${nomeCompeticaoCombinado || meet.name} + ${competicao.nomeCompeticao}`;
      setNomeCompeticaoCombinado(novoNome);

      // Se for a primeira competição, limpar o estado
      if (competicoesCarregadas.length === 0) {
        dispatch(createNewMeet() as any);
      }

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

      // Configurar dados da competição
      const meetData = {
        name: novoNome,
        lengthDays: 1,
        platformsOnDays: [1],
        divisions: divisions,
        weightClassesKgMen: weightClassesKgMen,
        weightClassesKgWomen: weightClassesKgWomen,
        weightClassesKgMx: [],
        formula: 'IPF' as const,
        combineSleevesAndWraps: false,
        combineSingleAndMulti: false,
        allow4thAttempts: false,
        roundTotalsDown: false,
        inKg: true,
        squatBarAndCollarsWeightKg: 25,
        benchBarAndCollarsWeightKg: 25,
        deadliftBarAndCollarsWeightKg: 25,
        plates: [
          { weightKg: 25, color: '#FF0000', pairCount: 10 },
          { weightKg: 20, color: '#0000FF', pairCount: 2 },
          { weightKg: 15, color: '#FFFF00', pairCount: 2 },
          { weightKg: 10, color: '#008000', pairCount: 2 },
          { weightKg: 5, color: '#000000', pairCount: 2 },
          { weightKg: 2.5, color: '#000000', pairCount: 2 },
          { weightKg: 1.25, color: '#000000', pairCount: 2 },
          { weightKg: 0.5, color: '#000000', pairCount: 2 },  
          { weightKg: 0.25, color: '#000000', pairCount: 2 }
        ],
        showAlternateUnits: false
      };

      // Dispatch para atualizar o estado da competição
      dispatch(updateMeet(meetData));

      // Carregar atletas inscritos na competição
      const inscricoes = await inscricaoService.getByCompeticao(competicao.id!);
      const atletasInscritos = inscricoes.filter(insc => insc.statusInscricao === 'INSCRITO');

      // Mapa para rastrear atletas unificados (CPF -> Entry)
      const atletasUnificados = new Map<string, any>();
      const entriesExistentes = registration.entries;

      // Primeiro, processar atletas existentes para o mapa de unificação
      entriesExistentes.forEach(entry => {
        // Criar chave única baseada em CPF, categoria peso, categoria idade e modalidade
        const chaveUnificacao = `${entry.cpf || 'sem-cpf'}-${entry.weightClassKg}-${entry.division}-${entry.equipment}`;
        atletasUnificados.set(chaveUnificacao, entry);
      });

      // Processar novos atletas da competição
      let entryId = registration.entries.length + 1;
      const novosAtletasAdicionados: any[] = [];

      for (const inscricao of atletasInscritos) {
        if (inscricao.atleta && inscricao.categoriaPeso && inscricao.categoriaIdade) {
          const cpf = inscricao.atleta.cpf;
          const categoriaPeso = inscricao.categoriaPeso.pesoMaximo;
          const categoriaIdade = inscricao.categoriaIdade.nome;
          const modalidade = inscricao.modalidade === 'CLASSICA' ? 'Raw' : 'Equipped';
          
          // Criar chave única para unificação
          const chaveUnificacao = `${cpf}-${categoriaPeso}-${categoriaIdade}-${modalidade}`;
          
          // Verificar se já existe um atleta com as mesmas características
          const atletaExistente = atletasUnificados.get(chaveUnificacao);
          
          if (atletaExistente) {
            // Atleta já existe - unificar movimentos
            const movimentosExistentes = atletaExistente.movements || '';
            const tipoCompeticao = competicao.tipoCompeticao || 'AST';
            
            // Adicionar novo tipo de competição aos movimentos se não existir
            const movimentosList = movimentosExistentes.split(', ').filter((m: string) => m.trim() !== '');
            if (!movimentosList.includes(tipoCompeticao)) {
              const novosMovimentos = movimentosList.length > 0 
                ? `${movimentosExistentes}, ${tipoCompeticao}`
                : tipoCompeticao;
              
              // Atualizar o atleta existente com os novos movimentos
              dispatch(updateEntry(atletaExistente.id, { movements: novosMovimentos }));
            }
          } else {
            // Novo atleta - criar nova entrada
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
              cpf: inscricao.atleta.cpf, // Adicionar CPF para unificação
              // Campos obrigatórios
              birthDate: inscricao.atleta.dataNascimento ? new Date(inscricao.atleta.dataNascimento).toISOString() : new Date().toISOString(),
              weightClass: inscricao.categoriaPeso.nome || 'Open',
              squatStatus: [0, 0, 0] as any,
              benchStatus: [0, 0, 0] as any,
              deadliftStatus: [0, 0, 0] as any,
              
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
              movements: competicao.tipoCompeticao || 'AST', // Usar tipo da competição
              sessionNumber: null,
              tested: false
            };

            dispatch(addEntry(entry) as any);
            novosAtletasAdicionados.push(entry);
            
            // Adicionar ao mapa de unificação
            atletasUnificados.set(chaveUnificacao, entry);
          }
        }
      }

      const totalAtletas = registration.entries.length + novosAtletasAdicionados.length;
      const mensagem = `Competição "${competicao.nomeCompeticao}" carregada com sucesso!\n\n` +
        `Total de competições carregadas: ${novasCompeticoesCarregadas.length}\n` +
        `Total de atletas: ${totalAtletas}\n` +
        `Novos atletas adicionados: ${novosAtletasAdicionados.length}\n\n` +
        `Nome da competição combinada: ${novoNome}\n\n` +
        `Tipo de competição: ${competicao.tipoCompeticao || 'AST'}\n` +
        `Movimentos configurados automaticamente conforme o tipo de competição.`;

      alert(mensagem);
      setShowLoadModal(false);
      
      // Redirecionar para a aba de inscrições para ver os atletas carregados
      setActiveTab('registration');
    } catch (error) {
      console.error('Erro ao carregar competição:', error);
      alert('Erro ao carregar competição. Tente novamente.');
    }
  };


  const formatDateForDisplay = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Funções para lidar com o modal de confirmação
  const handleConfirmExit = () => {
    if (hasActiveMeet) {
      console.log('💾 [BARRA PRONTA] Salvando competição antes de sair...');
      barraProntaStateService.forceSaveState();
    }
    setShowExitModal(false);
    if (pendingNavigation) {
      // Aqui você pode implementar a navegação se necessário
      console.log('🚀 [BARRA PRONTA] Navegando para:', pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <FaWeightHanging className="me-3" size={32} />
              <div>
                <h2 className="mb-0">Sistema Barra Pronta</h2>
                <p className="text-muted mb-0">Gerenciamento de Competições de Powerlifting</p>
              </div>
            </div>
            
            {/* Indicador de competição ativa */}
            {barraProntaStateService.hasActiveMeet() && (
              <div className="d-flex align-items-center">
                <Badge bg="success" className="me-2">
                  <FaTrophy className="me-1" />
                  Competição Ativa
                </Badge>
                <small className="text-muted">
                  {meet.name} - {meet.date}
                </small>
              </div>
            )}
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
                          <p><strong>Nome:</strong> {nomeCompeticaoCombinado || meet.name || 'Não configurado'}</p>
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

                        {/* Competições Carregadas */}
                        {competicoesCarregadas.length > 0 && (
                          <Alert variant="success" className="mt-4">
                            <h5>Competições Carregadas ({competicoesCarregadas.length})</h5>
                            <div className="row">
                              {competicoesCarregadas.map((competicao, index) => (
                                <div key={competicao.id} className="col-md-6 mb-2">
                                  <div className="border rounded p-2 border-secondary">
                                    <div>
                                      <strong>{competicao.nomeCompeticao}</strong>
                                      <br />
                                      <small className="text-muted">
                                        {competicao.local} - {formatDateForDisplay(competicao.dataCompeticao)}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2">
                              <small className="text-info">
                                💡 Dica: Os dados das competições são acumulados automaticamente
                              </small>
                            </div>
                          </Alert>
                        )}

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
                          
                          <Button variant="danger" onClick={handleLimparDados} className="w-100">
                            <FaTrash className="me-2" />
                            Limpar Dados
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
                  <ResultsMirror />
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

      {/* Modal de Confirmação de Saída */}
      <Modal show={showExitModal} onHide={handleCancelExit} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaWeightHanging className="me-2 text-warning" />
            Confirmar Saída do Sistema Barra Pronta
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-3">
              <FaWeightHanging size={48} className="text-warning" />
            </div>
            <h5 className="text-warning mb-3">⚠️ ATENÇÃO</h5>
            <p className="mb-3">
              Você tem uma competição ativa: <strong>"{meet.name}"</strong>
            </p>
            <p className="mb-3">
              Se você sair agora, a competição será salva automaticamente, mas é recomendado que você salve manualmente antes de sair.
            </p>
            <div className="alert alert-info">
              <small>
                <strong>Dica:</strong> Use o botão "Salvar Competição" antes de sair para garantir que todos os dados sejam preservados.
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelExit}>
            Cancelar
          </Button>
          <Button variant="warning" onClick={handleConfirmExit}>
            <FaSave className="me-2" />
            Salvar e Sair
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Wrapper com Provider do Redux
const BarraProntaPage: React.FC = () => {
  return (
    <BarraProntaContent />
  );
};

export default BarraProntaPage;
