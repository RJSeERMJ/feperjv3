import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Tab, Tabs, Row, Col, Card, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FaUsers, FaFileDownload, FaSignInAlt, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { atletaService } from '../services/firebaseService';
import { documentosContabeisService, DocumentoContabil } from '../services/documentosContabeisService';
import { Atleta } from '../types';
import './PublicPage.css';

const PublicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('atletas');
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoContabil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar atletas e documentos em paralelo
      const [atletasData, documentosData] = await Promise.all([
        atletaService.getAll(),
        documentosContabeisService.listarDocumentos()
      ]);

      // Mostrar TODOS os atletas cadastrados no sistema
      setAtletas(atletasData);
      setDocumentos(documentosData);
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
        </Tabs>
      </Container>
    </div>
  );
};

export default PublicPage;
