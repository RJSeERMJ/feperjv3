import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Form, 
  Modal,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  InputGroup
} from 'react-bootstrap';
import { 
  FaMoneyBillWave, 
  FaUsers, 
  FaFileUpload, 
  FaFileAlt,
  FaDownload,
  FaEdit,
  FaCog,
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaPlus
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { 
  equipeService, 
  atletaService, 
  competicaoService, 
  inscricaoService,
  anuidadeService,
  pagamentoService,
  documentoService
} from '../services/firebaseService';
import { Equipe, Atleta, Competicao, InscricaoCompeticao } from '../types';

interface Anuidade {
  id?: string;
  valor: number;
  dataCriacao: Date;
  dataAtualizacao?: Date;
  ativo: boolean;
}

interface PagamentoAnuidade {
  id?: string;
  idAtleta: string;
  idEquipe: string;
  valor: number;
  dataPagamento: Date;
  status: 'PAGO' | 'PENDENTE';
  observacoes?: string;
}

interface DocumentoContabil {
  id?: string;
  nome: string;
  tipo: 'DEMONSTRATIVO' | 'BALANCETE';
  formato: 'PDF' | 'CSV';
  url: string;
  dataUpload: Date;
  ativo: boolean;
}

const FinanceiroPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoCompeticao[]>([]);
  const [anuidade, setAnuidade] = useState<Anuidade | null>(null);
  const [pagamentosAnuidade, setPagamentosAnuidade] = useState<PagamentoAnuidade[]>([]);
  const [documentosContabeis, setDocumentosContabeis] = useState<DocumentoContabil[]>([]);
  
  // Estados para modais
  const [showConfigAnuidadeModal, setShowConfigAnuidadeModal] = useState(false);
  const [showDetalhesEquipeModal, setShowDetalhesEquipeModal] = useState(false);
  const [showPrestacaoContasModal, setShowPrestacaoContasModal] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  
  // Estados para formulários
  const [valorAnuidade, setValorAnuidade] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<'DEMONSTRATIVO' | 'BALANCETE'>('DEMONSTRATIVO');
  
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados básicos
      const [equipesData, atletasData, competicoesData, inscricoesData] = await Promise.all([
        equipeService.getAll(),
        atletaService.getAll(),
        competicaoService.getAll(),
        inscricaoService.getAll()
      ]);

      setEquipes(equipesData);
      setAtletas(atletasData);
      setCompeticoes(competicoesData);
      setInscricoes(inscricoesData);

      // Carregar dados financeiros do Firebase
      const [anuidadeData, pagamentosData, documentosData] = await Promise.all([
        anuidadeService.getAtivo(),
        pagamentoService.getAll(),
        documentoService.getAll()
      ]);

      setAnuidade(anuidadeData);
      setPagamentosAnuidade(pagamentosData);
      setDocumentosContabeis(documentosData);

    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para Dashboard Financeiro
  const calcularValorTotalCompeticoes = () => {
    return competicoes.reduce((total, competicao) => {
      const inscricoesCompeticao = inscricoes.filter(insc => insc.idCompeticao === competicao.id);
      return total + (inscricoesCompeticao.length * competicao.valorInscricao);
    }, 0);
  };

  const calcularValorTotalAnuidades = () => {
    if (!anuidade) return 0;
    return atletas.length * anuidade.valor;
  };

  const calcularValorPagoAnuidades = () => {
    return pagamentosAnuidade
      .filter(pag => pag.status === 'PAGO')
      .reduce((total, pag) => total + pag.valor, 0);
  };

  const calcularValorPendenteAnuidades = () => {
    return calcularValorTotalAnuidades() - calcularValorPagoAnuidades();
  };

  // Funções para Configuração de Anuidade
  const handleSalvarAnuidade = async () => {
    if (!valorAnuidade || parseFloat(valorAnuidade) <= 0) {
      toast.error('Valor da anuidade deve ser maior que zero');
      return;
    }

    try {
      const novaAnuidade: Anuidade = {
        valor: parseFloat(valorAnuidade),
        dataCriacao: new Date(),
        ativo: true
      };

      await anuidadeService.create(novaAnuidade);
      
      toast.success('Valor da anuidade configurado com sucesso!');
      setShowConfigAnuidadeModal(false);
      setValorAnuidade('');
      loadData();
    } catch (error) {
      toast.error('Erro ao configurar anuidade');
      console.error(error);
    }
  };

  // Funções para Prestação de Contas
  const handleUploadDocumento = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      // Upload para Firebase Storage
      const url = await documentoService.uploadDocumento(selectedFile, tipoDocumento);
      
      const documento: DocumentoContabil = {
        nome: selectedFile.name,
        tipo: tipoDocumento,
        formato: selectedFile.name.endsWith('.pdf') ? 'PDF' : 'CSV',
        url: url,
        dataUpload: new Date(),
        ativo: true
      };

      await documentoService.create(documento);
      
      toast.success('Documento enviado com sucesso!');
      setShowPrestacaoContasModal(false);
      setSelectedFile(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao enviar documento');
      console.error(error);
    }
  };

  // Funções para Detalhes da Equipe
  const handleDetalhesEquipe = (equipe: Equipe) => {
    setSelectedEquipe(equipe);
    setShowDetalhesEquipeModal(true);
  };

  const getAtletasEquipe = (idEquipe: string) => {
    return atletas.filter(atleta => atleta.idEquipe === idEquipe);
  };

  const getInscricoesEquipe = (idEquipe: string) => {
    const atletasEquipe = getAtletasEquipe(idEquipe);
    const idsAtletas = atletasEquipe.map(atleta => atleta.id);
    return inscricoes.filter(insc => idsAtletas.includes(insc.idAtleta));
  };

  const calcularValorCompeticoesEquipe = (idEquipe: string) => {
    const inscricoesEquipe = getInscricoesEquipe(idEquipe);
    return inscricoesEquipe.reduce((total, insc) => {
      const competicao = competicoes.find(comp => comp.id === insc.idCompeticao);
      return total + (competicao?.valorInscricao || 0);
    }, 0);
  };

  const getStatusAnuidadeAtleta = (idAtleta: string) => {
    const pagamento = pagamentosAnuidade.find(pag => pag.idAtleta === idAtleta);
    return pagamento?.status || 'PENDENTE';
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
          <h2>💰 Sistema Financeiro</h2>
          <p className="text-muted mb-0">
            {user?.tipo === 'admin' 
              ? 'Gestão financeira completa da federação'
              : 'Informações financeiras da sua equipe'
            }
          </p>
        </div>
        {user?.tipo === 'admin' && (
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => setShowConfigAnuidadeModal(true)}
            >
              <FaCog className="me-2" />
              Configurar Anuidade
            </Button>
            <Button 
              variant="outline-success" 
              onClick={() => setShowPrestacaoContasModal(true)}
            >
              <FaFileUpload className="me-2" />
              Prestação de Contas
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultActiveKey="dashboard" className="mb-4">
        <Tab eventKey="dashboard" title="Dashboard Financeiro">
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaMoneyBillWave className="text-primary mb-2" size={24} />
                  <h3>R$ {calcularValorTotalCompeticoes().toFixed(2)}</h3>
                  <p className="text-muted">Total Competições</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaUsers className="text-success mb-2" size={24} />
                  <h3>R$ {calcularValorTotalAnuidades().toFixed(2)}</h3>
                  <p className="text-muted">Total Anuidades</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaCheckCircle className="text-success mb-2" size={24} />
                  <h3>R$ {calcularValorPagoAnuidades().toFixed(2)}</h3>
                  <p className="text-muted">Anuidades Pagas</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaTimesCircle className="text-warning mb-2" size={24} />
                  <h3>R$ {calcularValorPendenteAnuidades().toFixed(2)}</h3>
                  <p className="text-muted">Anuidades Pendentes</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {user?.tipo === 'admin' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">📊 Resumo por Equipe</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Equipe</th>
                      <th>Total Atletas</th>
                      <th>Valor Competições</th>
                      <th>Anuidades Pagas</th>
                      <th>Anuidades Pendentes</th>
                      <th>Total Devido</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipes.map(equipe => {
                      const atletasEquipe = getAtletasEquipe(equipe.id!);
                      const valorCompeticoes = calcularValorCompeticoesEquipe(equipe.id!);
                      const anuidadesPagas = atletasEquipe.filter(atleta => 
                        getStatusAnuidadeAtleta(atleta.id!) === 'PAGO'
                      ).length * (anuidade?.valor || 0);
                      const anuidadesPendentes = atletasEquipe.filter(atleta => 
                        getStatusAnuidadeAtleta(atleta.id!) === 'PENDENTE'
                      ).length * (anuidade?.valor || 0);
                      const totalDevido = valorCompeticoes + anuidadesPendentes;

                      return (
                        <tr key={equipe.id}>
                          <td>
                            <strong>{equipe.nomeEquipe}</strong>
                            <br />
                            <small className="text-muted">{equipe.cidade}</small>
                          </td>
                          <td>{atletasEquipe.length}</td>
                          <td>R$ {valorCompeticoes.toFixed(2)}</td>
                          <td>R$ {anuidadesPagas.toFixed(2)}</td>
                          <td>R$ {anuidadesPendentes.toFixed(2)}</td>
                          <td>
                            <strong>R$ {totalDevido.toFixed(2)}</strong>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleDetalhesEquipe(equipe)}
                            >
                              <FaEye className="me-1" />
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>

        {user?.tipo !== 'admin' && (
          <Tab eventKey="minha-equipe" title="Minha Equipe">
            <Card>
              <Card.Header>
                <h5 className="mb-0">💰 Informações Financeiras da Minha Equipe</h5>
              </Card.Header>
              <Card.Body>
                {user?.idEquipe ? (
                  <div>
                    <Row className="mb-4">
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4>R$ {calcularValorCompeticoesEquipe(user.idEquipe).toFixed(2)}</h4>
                            <p className="text-muted">Total Competições</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4>R$ {(getAtletasEquipe(user.idEquipe).length * (anuidade?.valor || 0)).toFixed(2)}</h4>
                            <p className="text-muted">Total Anuidades</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4>{getAtletasEquipe(user.idEquipe).length}</h4>
                            <p className="text-muted">Total Atletas</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <Table responsive striped>
                      <thead>
                        <tr>
                          <th>Atleta</th>
                          <th>CPF</th>
                          <th>Status Anuidade</th>
                          <th>Valor Anuidade</th>
                          <th>Data Pagamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAtletasEquipe(user.idEquipe).map(atleta => {
                          const statusAnuidade = getStatusAnuidadeAtleta(atleta.id!);
                          const pagamento = pagamentosAnuidade.find(pag => pag.idAtleta === atleta.id);
                          
                          return (
                            <tr key={atleta.id}>
                              <td>
                                <strong>{atleta.nome}</strong>
                              </td>
                              <td>{atleta.cpf}</td>
                              <td>
                                <Badge bg={statusAnuidade === 'PAGO' ? 'success' : 'warning'}>
                                  {statusAnuidade === 'PAGO' ? 'PAGO' : 'PENDENTE'}
                                </Badge>
                              </td>
                              <td>R$ {(anuidade?.valor || 0).toFixed(2)}</td>
                              <td>
                                {pagamento?.dataPagamento 
                                  ? pagamento.dataPagamento.toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="warning" className="text-center">
                    Você não está associado a nenhuma equipe.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Tab>
        )}

        <Tab eventKey="prestacao" title="Prestação de Contas">
            <Card>
              <Card.Header>
                <h5 className="mb-0">📋 Documentos Contábeis</h5>
              </Card.Header>
              <Card.Body>
                {documentosContabeis.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    Nenhum documento contábil enviado ainda.
                  </Alert>
                ) : (
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Formato</th>
                        <th>Data Upload</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosContabeis.map(doc => (
                        <tr key={doc.id}>
                          <td>{doc.nome}</td>
                          <td>
                            <Badge bg={doc.tipo === 'DEMONSTRATIVO' ? 'primary' : 'success'}>
                              {doc.tipo}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={doc.formato === 'PDF' ? 'danger' : 'warning'}>
                              {doc.formato}
                            </Badge>
                          </td>
                          <td>{doc.dataUpload.toLocaleDateString('pt-BR')}</td>
                          <td>
                            <Badge bg={doc.ativo ? 'success' : 'secondary'}>
                              {doc.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                                                     <td>
                             <Button 
                               variant="outline-primary" 
                               size="sm"
                               onClick={() => window.open(doc.url, '_blank')}
                             >
                               <FaDownload className="me-1" />
                               Download
                             </Button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>
        )}
      </Tabs>

      {/* Modal de Configuração de Anuidade */}
      <Modal show={showConfigAnuidadeModal} onHide={() => setShowConfigAnuidadeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCog className="me-2" />
            Configurar Valor da Anuidade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>ℹ️ Informação:</strong> Configure o valor da anuidade que será cobrado de todos os atletas.
          </Alert>
          
          <Form.Group>
            <Form.Label>Valor da Anuidade (R$)</Form.Label>
            <InputGroup>
              <InputGroup.Text>R$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={valorAnuidade}
                onChange={(e) => setValorAnuidade(e.target.value)}
                placeholder="0,00"
              />
            </InputGroup>
          </Form.Group>

          {anuidade && (
            <Alert variant="warning" className="mt-3">
              <strong>⚠️ Valor Atual:</strong> R$ {anuidade.valor.toFixed(2)}
              <br />
              <small>Configurado em: {anuidade.dataCriacao.toLocaleDateString('pt-BR')}</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigAnuidadeModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSalvarAnuidade}>
            Salvar Configuração
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Prestação de Contas */}
      <Modal show={showPrestacaoContasModal} onHide={() => setShowPrestacaoContasModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileUpload className="me-2" />
            Prestação de Contas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>ℹ️ Informação:</strong> Faça upload de documentos contábeis para prestação de contas.
          </Alert>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Documento</Form.Label>
                <Form.Select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as 'DEMONSTRATIVO' | 'BALANCETE')}
                >
                  <option value="DEMONSTRATIVO">Demonstrativo Contábil de Caixa</option>
                  <option value="BALANCETE">Balancete</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Arquivo (PDF ou CSV)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Form.Text className="text-muted">
                  Aceita arquivos PDF ou CSV
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {selectedFile && (
            <Alert variant="success">
              <strong>✅ Arquivo selecionado:</strong> {selectedFile.name}
              <br />
              <small>Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrestacaoContasModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUploadDocumento} disabled={!selectedFile}>
            Enviar Documento
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Detalhes da Equipe */}
      <Modal show={showDetalhesEquipeModal} onHide={() => setShowDetalhesEquipeModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" />
            Detalhes Financeiros - {selectedEquipe?.nomeEquipe}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEquipe && (
            <div>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h4>R$ {calcularValorCompeticoesEquipe(selectedEquipe.id!).toFixed(2)}</h4>
                      <p className="text-muted">Total Competições</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h4>R$ {(getAtletasEquipe(selectedEquipe.id!).length * (anuidade?.valor || 0)).toFixed(2)}</h4>
                      <p className="text-muted">Total Anuidades</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h4>{getAtletasEquipe(selectedEquipe.id!).length}</h4>
                      <p className="text-muted">Total Atletas</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Tabs defaultActiveKey="atletas">
                <Tab eventKey="atletas" title="Atletas e Anuidades">
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Atleta</th>
                        <th>CPF</th>
                        <th>Status Anuidade</th>
                        <th>Valor Anuidade</th>
                        <th>Data Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAtletasEquipe(selectedEquipe.id!).map(atleta => {
                        const statusAnuidade = getStatusAnuidadeAtleta(atleta.id!);
                        const pagamento = pagamentosAnuidade.find(pag => pag.idAtleta === atleta.id);
                        
                        return (
                          <tr key={atleta.id}>
                            <td>
                              <strong>{atleta.nome}</strong>
                            </td>
                            <td>{atleta.cpf}</td>
                            <td>
                              <Badge bg={statusAnuidade === 'PAGO' ? 'success' : 'warning'}>
                                {statusAnuidade === 'PAGO' ? 'PAGO' : 'PENDENTE'}
                              </Badge>
                            </td>
                            <td>R$ {(anuidade?.valor || 0).toFixed(2)}</td>
                            <td>
                              {pagamento?.dataPagamento 
                                ? pagamento.dataPagamento.toLocaleDateString('pt-BR')
                                : '-'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Tab>
                
                <Tab eventKey="competicoes" title="Competições">
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Competição</th>
                        <th>Data</th>
                        <th>Atletas Inscritos</th>
                        <th>Valor por Atleta</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competicoes.map(competicao => {
                        const inscricoesCompeticao = getInscricoesEquipe(selectedEquipe.id!)
                          .filter(insc => insc.idCompeticao === competicao.id);
                        
                        if (inscricoesCompeticao.length === 0) return null;
                        
                        return (
                          <tr key={competicao.id}>
                            <td>
                              <strong>{competicao.nomeCompeticao}</strong>
                            </td>
                            <td>{competicao.dataCompeticao.toLocaleDateString('pt-BR')}</td>
                            <td>{inscricoesCompeticao.length}</td>
                            <td>R$ {competicao.valorInscricao.toFixed(2)}</td>
                            <td>
                              <strong>R$ {(inscricoesCompeticao.length * competicao.valorInscricao).toFixed(2)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Tab>
              </Tabs>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalhesEquipeModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FinanceiroPage;
