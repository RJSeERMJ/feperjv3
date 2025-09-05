import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaTrophy, FaMedal, FaCalendarAlt, FaMapMarkerAlt, FaWeight } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { atletaService } from '../services/firebaseService';
import { atletaResultadosService, AtletaResultado } from '../services/atletaResultadosService';
import { Atleta } from '../types';
import './AtletaDetalhesPage.css';

const AtletaDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [resultados, setResultados] = useState<AtletaResultado[]>([]);
  const [melhoresResultados, setMelhoresResultados] = useState({
    melhorAgachamento: 0,
    melhorSupino: 0,
    melhorTerra: 0,
    melhorTotal: 0
  });
  const [top5Classificacoes, setTop5Classificacoes] = useState<AtletaResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadAtletaData();
    }
  }, [id]);

  const loadAtletaData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Carregando dados do atleta ID:', id);

      // Carregar dados do atleta primeiro
      console.log('📋 Buscando dados do atleta...');
      const atletaData = await atletaService.getById(id!);
      console.log('✅ Dados do atleta carregados:', atletaData);

      if (!atletaData) {
        console.log('❌ Atleta não encontrado');
        setError('Atleta não encontrado');
        return;
      }

      // Carregar resultados em paralelo (pode falhar se não houver dados)
      console.log('📊 Buscando resultados do atleta...');
      let resultadosData: AtletaResultado[] = [];
      let melhoresData = {
        melhorAgachamento: 0,
        melhorSupino: 0,
        melhorTerra: 0,
        melhorTotal: 0
      };
      let top5Data: AtletaResultado[] = [];

      try {
        [resultadosData, melhoresData, top5Data] = await Promise.all([
          atletaResultadosService.getResultadosByAtleta(id!),
          atletaResultadosService.getMelhoresResultados(id!),
          atletaResultadosService.getTop5Classificacoes(id!)
        ]);
        console.log('✅ Resultados carregados:', { resultadosData, melhoresData, top5Data });
      } catch (resultadoError) {
        console.warn('⚠️ Erro ao carregar resultados (continuando sem resultados):', resultadoError);
        // Continuar sem resultados se não houver dados
      }

      setAtleta(atletaData);
      setResultados(resultadosData);
      setMelhoresResultados(melhoresData);
      setTop5Classificacoes(top5Data);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do atleta:', error);
      setError(`Erro ao carregar dados do atleta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data?: Date) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarDataNascimento = (dataNascimento?: Date) => {
    if (!dataNascimento) return 'N/A';
    return new Date(dataNascimento).getFullYear().toString();
  };

  const formatarSexo = (sexo: 'M' | 'F') => {
    return sexo === 'M' ? 'Masculino' : 'Feminino';
  };

  const getMedalIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <FaMedal className="text-warning" title="Ouro" />;
      case 2:
        return <FaMedal className="text-secondary" title="Prata" />;
      case 3:
        return <FaMedal className="text-warning" style={{ color: '#CD7F32' }} title="Bronze" />;
      default:
        return <span className="badge bg-secondary">{posicao}º</span>;
    }
  };

  if (loading) {
    return (
      <div className="atleta-detalhes-page">
        <Container className="mt-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Carregando dados do atleta...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !atleta) {
    return (
      <div className="atleta-detalhes-page">
        <Container className="mt-4">
          <Alert variant="danger">
            {error || 'Atleta não encontrado'}
          </Alert>
          <Button variant="outline-primary" onClick={() => navigate('/publico')}>
            <FaArrowLeft className="me-2" />
            Voltar para Lista de Atletas
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="atleta-detalhes-page">
      <Container className="mt-4">
        {/* Botão Voltar */}
        <div className="mb-4">
          <Button variant="outline-primary" onClick={() => navigate('/publico')}>
            <FaArrowLeft className="me-2" />
            Voltar para Lista de Atletas
          </Button>
        </div>

        {/* Cabeçalho do Atleta */}
        <Card className="mb-4">
          <Card.Header className="atleta-header">
            <Row className="align-items-center">
              <Col md={8}>
                <h2 className="mb-0">
                  <FaTrophy className="me-2" />
                  {atleta.nome}
                </h2>
                <p className="mb-0 text-muted">
                  {atleta.equipe?.nomeEquipe || 'N/A'} • {atleta.matricula || 'N/A'}
                </p>
              </Col>
              <Col md={4} className="text-end">
                <Badge bg={atleta.status === 'ATIVO' ? 'success' : 'secondary'} className="fs-6">
                  {atleta.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                </Badge>
              </Col>
            </Row>
          </Card.Header>
        </Card>

        <Row>
          {/* Coluna Esquerda - Informações Pessoais */}
          <Col md={4}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Informações Pessoais</h5>
              </Card.Header>
              <Card.Body>
                <div className="atleta-info">
                  <div className="info-row">
                    <strong>Sexo:</strong>
                    <span>{formatarSexo(atleta.sexo)}</span>
                  </div>
                  <div className="info-row">
                    <strong>Data de Nascimento:</strong>
                    <span>{formatarDataNascimento(atleta.dataNascimento)}</span>
                  </div>
                  <div className="info-row">
                    <strong>Equipe:</strong>
                    <span>{atleta.equipe?.nomeEquipe || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <strong>Email:</strong>
                    <span>{atleta.email || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <strong>Telefone:</strong>
                    <span>{atleta.telefone || 'N/A'}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Melhores Resultados */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaWeight className="me-2" />
                  Melhores Resultados
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="melhores-resultados">
                  <div className="resultado-item">
                    <span className="movimento">Agachamento</span>
                    <span className="peso">{melhoresResultados.melhorAgachamento} kg</span>
                  </div>
                  <div className="resultado-item">
                    <span className="movimento">Supino</span>
                    <span className="peso">{melhoresResultados.melhorSupino} kg</span>
                  </div>
                  <div className="resultado-item">
                    <span className="movimento">Terra</span>
                    <span className="peso">{melhoresResultados.melhorTerra} kg</span>
                  </div>
                  <div className="resultado-item total">
                    <span className="movimento">Total</span>
                    <span className="peso">{melhoresResultados.melhorTotal} kg</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Coluna Direita - Resultados */}
          <Col md={8}>
            {/* Top 5 Melhores Classificações */}
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Top 5 Melhores Classificações
                </h5>
              </Card.Header>
              <Card.Body>
                {top5Classificacoes.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped hover size="sm">
                      <thead>
                        <tr>
                          <th>Ano</th>
                          <th>Competição</th>
                          <th>Divisão</th>
                          <th>Categoria</th>
                          <th>Resultado</th>
                          <th>Classificação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top5Classificacoes.map((resultado, index) => (
                          <tr key={resultado.id}>
                            <td>{formatarData(resultado.competitionDate).split('/')[2]}</td>
                            <td>{resultado.competitionName}</td>
                            <td>{resultado.division}</td>
                            <td>{resultado.weightClass}</td>
                            <td>{resultado.total} kg</td>
                            <td className="text-center">
                              {getMedalIcon(resultado.position)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info">
                    Nenhuma classificação encontrada para este atleta.
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* Histórico Completo de Competições */}
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  <FaCalendarAlt className="me-2" />
                  Histórico de Competições
                </h5>
              </Card.Header>
              <Card.Body>
                {resultados.length === 0 ? (
                  <Alert variant="info">
                    Nenhuma competição encontrada para este atleta.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Competição</th>
                          <th>Local</th>
                          <th>Divisão</th>
                          <th>Categoria</th>
                          <th>Agachamento</th>
                          <th>Supino</th>
                          <th>Terra</th>
                          <th>Total</th>
                          <th>Classificação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.map((resultado) => (
                          <tr key={resultado.id}>
                            <td>{formatarData(resultado.competitionDate)}</td>
                            <td>{resultado.competitionName}</td>
                            <td>
                              <FaMapMarkerAlt className="me-1" />
                              {resultado.competitionCity}
                            </td>
                            <td>{resultado.division}</td>
                            <td>{resultado.weightClass}</td>
                            <td>{resultado.squat} kg</td>
                            <td>{resultado.bench} kg</td>
                            <td>{resultado.deadlift} kg</td>
                            <td className="fw-bold">{resultado.total} kg</td>
                            <td className="text-center">
                              {resultado.position > 0 ? getMedalIcon(resultado.position) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AtletaDetalhesPage;
