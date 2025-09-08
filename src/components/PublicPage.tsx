import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Tab, Tabs, Row, Col, Card, Table, Button, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import { FaUsers, FaFileDownload, FaSignInAlt, FaHome, FaTrophy, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { atletaService } from '../services/firebaseService';
import { documentosContabeisService, DocumentoContabil } from '../services/documentosContabeisService';
import { nominacaoService, NominacaoData } from '../services/nominacaoService';
import { Atleta } from '../types';
import './PublicPage.css';

const PublicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('atletas');
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoContabil[]>([]);
  const [nominacoes, setNominacoes] = useState<NominacaoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNominacaoModal, setShowNominacaoModal] = useState(false);
  const [nominacaoSelecionada, setNominacaoSelecionada] = useState<NominacaoData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar atletas, documentos e nominações em paralelo
      const [atletasData, documentosData, nominacoesData] = await Promise.all([
        atletaService.getAll(),
        documentosContabeisService.listarDocumentos(),
        nominacaoService.getAllNominacoes()
      ]);

      // Mostrar TODOS os atletas cadastrados no sistema
      setAtletas(atletasData);
      setDocumentos(documentosData);
      setNominacoes(nominacoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocumento = async (documento: DocumentoContabil) => {
    try {
      // Para usuários não logados, usar dados padrão
      await documentosContabeisService.downloadDocumento(
        documento, 
        'publico', 
        'usuario.publico@feperj.com'
      );
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const formatarDataNascimento = (dataNascimento?: Date) => {
    if (!dataNascimento) return 'N/A';
    return new Date(dataNascimento).getFullYear().toString();
  };

  const formatarSexo = (sexo: 'M' | 'F') => {
    return sexo === 'M' ? 'Masculino' : 'Feminino';
  };

  const formatarData = (data: Date) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarStatusCompeticao = (status: string) => {
    switch (status) {
      case 'AGENDADA':
        return { text: 'Agendada', variant: 'primary' };
      case 'REALIZADA':
        return { text: 'Realizada', variant: 'success' };
      case 'CANCELADA':
        return { text: 'Cancelada', variant: 'danger' };
      default:
        return { text: status, variant: 'secondary' };
    }
  };

  const handleVerCompeticao = (nominacao: NominacaoData) => {
    setNominacaoSelecionada(nominacao);
    setShowNominacaoModal(true);
  };

  const handleFecharModal = () => {
    setShowNominacaoModal(false);
    setNominacaoSelecionada(null);
  };

  if (loading) {
    return (
      <div className="public-page">
        <Navbar bg="primary" variant="dark" expand="lg" className="public-navbar">
          <Container>
            <Navbar.Brand>
              <FaHome className="me-2" />
              FEPERJ - Sistema de Powerlifting
            </Navbar.Brand>
            <Nav className="ms-auto">
              <Nav.Link onClick={() => navigate('/login')}>
                <FaSignInAlt className="me-1" />
                Entrar no Sistema
              </Nav.Link>
            </Nav>
          </Container>
        </Navbar>
        
        <Container className="mt-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Carregando dados...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="public-page">
      {/* Navbar Superior */}
      <Navbar bg="primary" variant="dark" expand="lg" className="public-navbar">
        <Container>
          <Navbar.Brand>
            <FaHome className="me-2" />
            FEPERJ - Sistema de Powerlifting
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link onClick={() => navigate('/login')}>
              <FaSignInAlt className="me-1" />
              Entrar no Sistema
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Tabs de Navegação */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k || 'atletas')}
          className="mb-4 public-tabs"
        >
          <Tab eventKey="atletas" title={
            <span>
              <FaUsers className="me-2" />
              Atletas
            </span>
          }>
            <Card>
              <Card.Header>
                <h4 className="mb-0">
                  <FaUsers className="me-2" />
                  Lista de Atletas Cadastrados
                </h4>
                <small className="text-muted">
                  Total de atletas cadastrados: {atletas.length}
                </small>
              </Card.Header>
              <Card.Body>
                {atletas.length === 0 ? (
                  <Alert variant="info">
                    Nenhum atleta cadastrado encontrado.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Sexo</th>
                          <th>Equipe</th>
                          <th>Ano de Nascimento</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atletas.map((atleta) => (
                          <tr key={atleta.id}>
                            <td>
                              <strong 
                                className="atleta-link"
                                onClick={() => navigate(`/atleta/${atleta.id}`)}
                                style={{ cursor: 'pointer', color: '#007bff' }}
                                title="Clique para ver detalhes do atleta"
                              >
                                {atleta.nome}
                              </strong>
                              {atleta.matricula && (
                                <>
                                  <br />
                                  <small className="text-muted">
                                    Matrícula: {atleta.matricula}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${atleta.sexo === 'M' ? 'bg-primary' : 'bg-pink'}`}>
                                {formatarSexo(atleta.sexo)}
                              </span>
                            </td>
                            <td>
                              {atleta.equipe?.nomeEquipe || 'N/A'}
                            </td>
                            <td>
                              {formatarDataNascimento(atleta.dataNascimento)}
                            </td>
                            <td>
                              <span className={`badge ${atleta.status === 'ATIVO' ? 'bg-success' : 'bg-secondary'}`}>
                                {atleta.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="prestacao" title={
            <span>
              <FaFileDownload className="me-2" />
              Prestação de Contas
            </span>
          }>
            <Card>
              <Card.Header>
                <h4 className="mb-0">
                  <FaFileDownload className="me-2" />
                  Documentos de Prestação de Contas
                </h4>
                <small className="text-muted">
                  Documentos disponíveis para download
                </small>
              </Card.Header>
              <Card.Body>
                {documentos.length === 0 ? (
                  <Alert variant="info">
                    Nenhum documento de prestação de contas disponível no momento.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Nome do Documento</th>
                          <th>Tipo</th>
                          <th>Formato</th>
                          <th>Data de Upload</th>
                          <th>Tamanho</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documentos.map((documento) => (
                          <tr key={documento.id}>
                            <td>
                              <strong>{documento.nome}</strong>
                            </td>
                            <td>
                              <span className={`badge ${
                                documento.tipo === 'DEMONSTRATIVO' ? 'bg-success' : 'bg-info'
                              }`}>
                                {documento.tipo === 'DEMONSTRATIVO' ? 'Demonstrativo' : 'Balancete'}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {documento.formato}
                              </span>
                            </td>
                            <td>
                              {new Date(documento.dataUpload).toLocaleDateString('pt-BR')}
                            </td>
                            <td>
                              {(documento.tamanho / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleDownloadDocumento(documento)}
                              >
                                <FaFileDownload className="me-1" />
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="nominacao" title={
            <span>
              <FaTrophy className="me-2" />
              Nominação
            </span>
          }>
            <Card>
              <Card.Header>
                <h4 className="mb-0">
                  <FaTrophy className="me-2" />
                  Competições Agendadas e Nominações
                </h4>
                <small className="text-muted">
                  Clique em uma competição para ver detalhes e atletas organizados por categoria de peso
                </small>
              </Card.Header>
              <Card.Body>
                {nominacoes.length === 0 ? (
                  <Alert variant="info">
                    Nenhuma competição agendada encontrada no momento.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Competição</th>
                          <th>Data</th>
                          <th>Local</th>
                          <th>Status</th>
                          <th>Modalidade</th>
                          <th>Inscritos</th>
                          <th>Aprovados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nominacoes.map((nominacao) => {
                          const statusInfo = formatarStatusCompeticao(nominacao.competicao.status);
                          
                          return (
                            <tr 
                              key={nominacao.competicao.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleVerCompeticao(nominacao)}
                              className="table-row-hover"
                            >
                              <td>
                                <strong style={{ color: '#007bff' }}>
                                  {nominacao.competicao.nomeCompeticao}
                                </strong>
                              </td>
                              <td>{formatarData(nominacao.competicao.dataCompeticao)}</td>
                              <td>{nominacao.competicao.local || 'N/A'}</td>
                              <td>
                                <Badge bg={statusInfo.variant}>
                                  {statusInfo.text}
                                </Badge>
                              </td>
                              <td>{nominacao.competicao.modalidade || 'N/A'}</td>
                              <td>
                                <Badge bg="info">
                                  {nominacao.totalInscritos}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg="success">
                                  {nominacao.totalAprovados}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Container>

      {/* Modal de Detalhes da Competição */}
      <Modal show={showNominacaoModal} onHide={handleFecharModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrophy className="me-2" />
            {nominacaoSelecionada?.competicao.nomeCompeticao}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {nominacaoSelecionada && (
            <div>
              {/* Informações da Competição */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Informações da Competição</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Data:</strong> {formatarData(nominacaoSelecionada.competicao.dataCompeticao)}</p>
                      <p><strong>Local:</strong> {nominacaoSelecionada.competicao.local || 'N/A'}</p>
                      <p><strong>Modalidade:</strong> {nominacaoSelecionada.competicao.modalidade || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Status:</strong> 
                        <Badge bg={formatarStatusCompeticao(nominacaoSelecionada.competicao.status).variant} className="ms-2">
                          {formatarStatusCompeticao(nominacaoSelecionada.competicao.status).text}
                        </Badge>
                      </p>
                      <p><strong>Total de Inscritos:</strong> {nominacaoSelecionada.totalInscritos}</p>
                      <p><strong>Total Aprovados:</strong> {nominacaoSelecionada.totalAprovados}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Lista de Atletas por Categoria de Peso */}
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    Atletas Nominados por Categoria de Peso ({nominacaoSelecionada.totalAprovados})
                  </h5>
                </Card.Header>
                <Card.Body>
                  {nominacaoSelecionada.atletasPorCategoria.length === 0 ? (
                    <Alert variant="info">
                      Nenhum atleta inscrito para esta competição ainda.
                    </Alert>
                  ) : (
                    <div>
                      {nominacaoSelecionada.atletasPorCategoria.map((categoria, index) => (
                        <div key={index} className="mb-4">
                          <h6 className="text-primary mb-3">
                            <Badge bg="primary" className="me-2">
                              {categoria.categoriaPeso}
                            </Badge>
                            ({categoria.atletas.length} atletas)
                          </h6>
                          <div className="table-responsive">
                            <Table striped hover size="sm">
                              <thead>
                                <tr>
                                  <th>Nome</th>
                                  <th>Equipe</th>
                                  <th>Categoria Idade</th>
                                  <th>Modalidade</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoria.atletas.map((inscricao) => (
                                  <tr key={inscricao.id}>
                                    <td>
                                      <strong>{inscricao.atleta?.nome || 'N/A'}</strong>
                                    </td>
                                    <td>{inscricao.atleta?.equipe?.nomeEquipe || 'N/A'}</td>
                                    <td>
                                      <Badge bg="info">
                                        {inscricao.categoriaIdade?.nome || 'N/A'}
                                      </Badge>
                                    </td>
                                    <td>
                                      <Badge bg="success">
                                        {inscricao.modalidade || 'N/A'}
                                      </Badge>
                                    </td>
                                    <td>
                                      <Badge bg={
                                        inscricao.statusInscricao === 'INSCRITO' 
                                          ? 'success' 
                                          : inscricao.statusInscricao === 'CANCELADO' 
                                          ? 'danger' 
                                          : 'secondary'
                                      }>
                                        {inscricao.statusInscricao || 'N/A'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleFecharModal}>
            <FaTimes className="me-1" />
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PublicPage;
