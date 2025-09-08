import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Badge, 
  Alert,
  Spinner,
  Nav,
  Navbar
} from 'react-bootstrap';
import { 
  FaArrowLeft, 
  FaFilePdf, 
  FaDownload, 
  FaTrophy, 
  FaMedal,
  FaUsers,
  FaChartBar,
  FaCalendarAlt,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { resultadoImportadoService, ResultadoImportado } from '../services/resultadoImportadoService';
import { formatarData } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  calculateBestLifterResults,
  getAgeDivisionDisplayName,
  getEquipmentDisplayNameForBestLifter,
  getEventTypeDisplayName,
  type BestLifterCategory,
  type BestLifterResult
} from '../logic/ipfGLPoints';
import './DetalhesResultadoPage.css';

const DetalhesResultadoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<ResultadoImportado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'atletas' | 'equipes' | 'estatisticas'>('atletas');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadResultado();
    }
  }, [id]);

  // Função para converter chaves técnicas em nomes legíveis
  const getCategoryDisplayName = (key: string): string => {
    const categoryMap: { [key: string]: string } = {
      'astClassic': 'AST - Clássico',
      'astEquipped': 'AST - Equipado',
      'sClassic': 'Supino - Clássico',
      'sEquipped': 'Supino - Equipado',
      'tClassic': 'Terra - Clássico',
      'tEquipped': 'Terra - Equipado'
    };
    
    return categoryMap[key] || key;
  };

  const loadResultado = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError('ID da competição não fornecido');
        return;
      }

      const resultadoData = await resultadoImportadoService.getById(id);
      if (resultadoData) {
        setResultado(resultadoData);
      } else {
        setError('Competição não encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar resultado:', error);
      setError('Erro ao carregar dados da competição');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!resultado) return;
    
    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.text('Resultados da Competição', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`${resultado.competitionName}`, 14, 30);
      doc.text(`${resultado.competitionCity} - ${formatarData(resultado.competitionDate)}`, 14, 37);
      doc.text(`Total de Atletas: ${resultado.totalAthletes}`, 14, 44);
      doc.text(`Data de Importação: ${formatarData(resultado.importDate)}`, 14, 51);
      
      // Resultados por categoria
      if (resultado.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Resultados por Categoria', 14, 20);
        
        let yPosition = 35;
        resultado.results.complete.forEach((category: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(14);
          doc.text(category.category, 14, yPosition);
          yPosition += 10;
          
          // Tabela de resultados da categoria com tentativas individuais
          const tableData = category.results.map((result: any, pos: number) => [
            pos + 1,
            result.entry.name,
            result.entry.team || '-',
            result.entry.squat1 || '-',
            result.entry.squat2 || '-',
            result.entry.squat3 || '-',
            result.entry.bench1 || '-',
            result.entry.bench2 || '-',
            result.entry.bench3 || '-',
            result.entry.deadlift1 || '-',
            result.entry.deadlift2 || '-',
            result.entry.deadlift3 || '-',
            result.total,
            result.points.toFixed(2)
          ]);
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Pos', 'Atleta', 'Equipe', 'A1', 'A2', 'A3', 'S1', 'S2', 'S3', 'T1', 'T2', 'T3', 'Total (kg)', 'Pontos IPF GL']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 7 },
            headStyles: { fillColor: [66, 139, 202] },
            columnStyles: {
              0: { cellWidth: 15 }, // Pos
              1: { cellWidth: 40 }, // Atleta
              2: { cellWidth: 30 }, // Equipe
              3: { cellWidth: 15 }, // A1
              4: { cellWidth: 15 }, // A2
              5: { cellWidth: 15 }, // A3
              6: { cellWidth: 15 }, // S1
              7: { cellWidth: 15 }, // S2
              8: { cellWidth: 15 }, // S3
              9: { cellWidth: 15 }, // T1
              10: { cellWidth: 15 }, // T2
              11: { cellWidth: 15 }, // T3
              12: { cellWidth: 20 }, // Total
              13: { cellWidth: 20 }  // Pontos
            }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        });
      }
      
      // Ranking de equipes
      if (resultado.results?.teams) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Ranking de Equipes', 14, 20);
        
        let yPosition = 35;
                 Object.entries(resultado.results.teams).forEach(([key, teams]: [string, any]) => {
           if (yPosition > 250) {
             doc.addPage();
             yPosition = 20;
           }
           
           doc.setFontSize(12);
           doc.text(getCategoryDisplayName(key), 14, yPosition);
           yPosition += 8;
          
          if (teams && Array.isArray(teams)) {
            const tableData = teams.map((team: any, pos: number) => [
              pos + 1,
              team.name,
              team.totalPoints,
              team.firstPlaces,
              team.secondPlaces,
              team.thirdPlaces
            ]);
            
            autoTable(doc, {
              startY: yPosition,
              head: [['Pos', 'Equipe', 'Pontos', '1º', '2º', '3º']],
              body: tableData,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [66, 139, 202] }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 15;
          }
        });
      }
      
      // Salvar PDF
      doc.save(`resultados_${resultado.competitionName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
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

  if (error || !resultado) {
    return (
      <Container fluid>
        <Alert variant="danger">
          <h4>❌ Erro</h4>
          <p>{error || 'Competição não encontrada'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/competicoes')}>
            <FaArrowLeft className="me-2" />
            Voltar para Competições
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="detalhes-resultado-page">
      {/* Header */}
      <Navbar bg="light" className="mb-4">
        <Container fluid>
          <Navbar.Brand>
            <FaTrophy className="me-2" />
            Detalhes da Competição
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/competicoes')}
              className="me-2"
            >
              <FaArrowLeft className="me-2" />
              Voltar
            </Button>
            <Button 
              variant="success" 
              onClick={handleExportPDF}
            >
              <FaFilePdf className="me-2" />
              Exportar PDF
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid>
        {/* Informações da Competição */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">
              <FaCalendarAlt className="me-2" />
              {resultado.competitionName}
            </h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Data:</strong> {formatarData(resultado.competitionDate)}</p>
                <p><strong>Cidade:</strong> {resultado.competitionCity}</p>
                <p><strong>País:</strong> {resultado.competitionCountry}</p>
              </Col>
              <Col md={6}>
                <p><strong>Total de Atletas:</strong> {resultado.totalAthletes}</p>
                <p><strong>Data de Importação:</strong> {formatarData(resultado.importDate)}</p>
                <p><strong>Status:</strong> 
                  <Badge bg="success" className="ms-2">{resultado.status}</Badge>
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Abas de Navegação */}
        <Row className="mb-4">
          <Col>
            <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)}>
              <Nav.Item>
                <Nav.Link eventKey="atletas">
                  <FaUsers className="me-2" />
                  Ranking de Atletas
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="equipes">
                  <FaTrophy className="me-2" />
                  Ranking de Equipes
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="estatisticas">
                  <FaChartBar className="me-2" />
                  Estatísticas
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        {/* Conteúdo das Abas */}
        {activeTab === 'atletas' && (
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Ranking de Atletas por Categoria
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {resultado.results?.complete ? (
                <div>
                  {resultado.results.complete.map((category: any, categoryIndex: number) => (
                    <div key={categoryIndex} className="mb-4">
                      <div className="category-header">
                        <h6 className="mb-0">{category.category}</h6>
                      </div>
                      <Table striped bordered hover responsive className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th rowSpan={2}>Pos</th>
                            <th rowSpan={2}>Atleta</th>
                            <th rowSpan={2}>Equipe</th>
                            <th colSpan={3}>Agachamento</th>
                            <th colSpan={3}>Supino</th>
                            <th colSpan={3}>Terra</th>
                            <th rowSpan={2}>Total (kg)</th>
                            <th rowSpan={2}>Pontos IPF GL</th>
                            <th rowSpan={2}>Modalidade</th>
                          </tr>
                          <tr>
                            <th>A1</th>
                            <th>A2</th>
                            <th>A3</th>
                            <th>S1</th>
                            <th>S2</th>
                            <th>S3</th>
                            <th>T1</th>
                            <th>T2</th>
                            <th>T3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.results.map((result: any, index: number) => {
                            // Calcular melhores tentativas
                            const bestSquat = Math.max(result.entry.squat1 || 0, result.entry.squat2 || 0, result.entry.squat3 || 0);
                            const bestBench = Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0);
                            const bestDeadlift = Math.max(result.entry.deadlift1 || 0, result.entry.deadlift2 || 0, result.entry.deadlift3 || 0);
                            
                            // Função para renderizar tentativa individual
                            const renderAttempt = (attempt: number, isBest: boolean) => {
                              if (attempt > 0) {
                                return (
                                  <span className={isBest ? 'text-success fw-bold' : ''}>
                                    {attempt}
                                    {isBest && <FaMedal className="ms-1 text-warning" />}
                                  </span>
                                );
                              }
                              return <span className="text-muted">-</span>;
                            };

                            return (
                              <tr key={index}>
                                <td className="text-center">
                                  {index === 0 && <FaMedal className="text-warning" />}
                                  {index === 1 && <FaMedal className="text-secondary" />}
                                  {index === 2 && <FaMedal className="text-bronze" />}
                                  <span className="ms-1">{index + 1}</span>
                                </td>
                                <td><strong>{result.entry.name}</strong></td>
                                <td>{result.entry.team || '-'}</td>
                                {/* Tentativas de Agachamento */}
                                <td className="text-center">{renderAttempt(result.entry.squat1 || 0, result.entry.squat1 === bestSquat && bestSquat > 0)}</td>
                                <td className="text-center">{renderAttempt(result.entry.squat2 || 0, result.entry.squat2 === bestSquat && bestSquat > 0)}</td>
                                <td className="text-center">{renderAttempt(result.entry.squat3 || 0, result.entry.squat3 === bestSquat && bestSquat > 0)}</td>
                                {/* Tentativas de Supino */}
                                <td className="text-center">{renderAttempt(result.entry.bench1 || 0, result.entry.bench1 === bestBench && bestBench > 0)}</td>
                                <td className="text-center">{renderAttempt(result.entry.bench2 || 0, result.entry.bench2 === bestBench && bestBench > 0)}</td>
                                <td className="text-center">{renderAttempt(result.entry.bench3 || 0, result.entry.bench3 === bestBench && bestBench > 0)}</td>
                                {/* Tentativas de Terra */}
                                <td className="text-center">{renderAttempt(result.entry.deadlift1 || 0, result.entry.deadlift1 === bestDeadlift && bestDeadlift > 0)}</td>
                                <td className="text-center">{renderAttempt(result.entry.deadlift2 || 0, result.entry.deadlift2 === bestDeadlift && bestDeadlift > 0)}</td>
                                <td className="text-center">{renderAttempt(result.entry.deadlift3 || 0, result.entry.deadlift3 === bestDeadlift && bestDeadlift > 0)}</td>
                                <td className="text-center"><strong>{result.total}</strong></td>
                                <td className="text-center"><strong>{result.points.toFixed(2)}</strong></td>
                                <td className="text-center">
                                  <Badge bg={result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA' ? 'primary' : 'success'}>
                                    {result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA' ? 'Clássica' : 'Equipado'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert variant="info" className="m-3">
                  <strong>ℹ️ Informação:</strong> Nenhum resultado detalhado disponível para esta competição.
                </Alert>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'equipes' && (
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <FaTrophy className="me-2" />
                Ranking de Equipes por Modalidade
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {resultado.results?.teams ? (
                <div>
                  {Object.entries(resultado.results.teams).map(([key, teams]: [string, any]) => (
                    <div key={key} className="mb-4">
                                             <div className="category-header">
                         <h6 className="mb-0">{getCategoryDisplayName(key)}</h6>
                       </div>
                      {teams && Array.isArray(teams) ? (
                        <Table striped bordered hover responsive className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Pos</th>
                              <th>Equipe</th>
                              <th>Pontos</th>
                              <th>1º Lugar</th>
                              <th>2º Lugar</th>
                              <th>3º Lugar</th>
                              <th>Total IPF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teams.map((team: any, index: number) => (
                              <tr key={index}>
                                <td className="text-center">
                                  {index === 0 && <FaTrophy className="text-warning" />}
                                  {index === 1 && <FaTrophy className="text-secondary" />}
                                  {index === 2 && <FaTrophy className="text-bronze" />}
                                  <span className="ms-1">{index + 1}</span>
                                </td>
                                <td><strong>{team.name}</strong></td>
                                <td className="text-center">{team.totalPoints}</td>
                                <td className="text-center">{team.firstPlaces}</td>
                                <td className="text-center">{team.secondPlaces}</td>
                                <td className="text-center">{team.thirdPlaces}</td>
                                <td className="text-center">{team.totalIPFPoints?.toFixed(2) || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <Alert variant="info" className="m-3">
                          Nenhum ranking de equipe disponível para {key}
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert variant="info" className="m-3">
                  <strong>ℹ️ Informação:</strong> Nenhum ranking de equipe disponível para esta competição.
                </Alert>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'estatisticas' && (
          <>
            {/* Estatísticas Gerais */}
            <Card className="mb-4">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <FaChartBar className="me-2" />
                  Estatísticas da Competição
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Resumo Geral</h6>
                    <ul>
                      <li><strong>Total de Atletas:</strong> {resultado.totalAthletes}</li>
                      <li><strong>Categorias:</strong> {resultado.results?.complete?.length || 0}</li>
                      <li><strong>Modalidades:</strong> Clássica e Equipado</li>
                      <li><strong>Movimentos:</strong> AST, S, T</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6>Distribuição por Modalidade</h6>
                    {resultado.results?.simplified ? (
                      <ul>
                        <li><strong>Resultados Simplificados:</strong> {resultado.results.simplified.length}</li>
                        <li><strong>Rankings de Equipes:</strong> {resultado.results.teams ? Object.keys(resultado.results.teams).length : 0}</li>
                      </ul>
                    ) : (
                      <p className="text-muted">Nenhuma estatística disponível</p>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Best Lifter - Melhores Atletas */}
            <BestLifterStats resultado={resultado} />
          </>
        )}
      </Container>
    </div>
  );
};

// Componente para exibir Best Lifter - Melhores Atletas
const BestLifterStats: React.FC<{ resultado: ResultadoImportado | null }> = ({ resultado }) => {
  if (!resultado?.results?.complete) {
    return (
      <Card>
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <FaTrophy className="me-2" />
            Best Lifter - Melhores Atletas
          </h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="text-center">
            <FaTrophy size={48} className="mb-3" />
            <h4>Nenhum resultado disponível</h4>
            <p>Não há dados suficientes para calcular o Best Lifter.</p>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  // Converter dados do resultado importado para o formato esperado pela função calculateBestLifterResults
  const entries = resultado.results.complete.flatMap(category => 
    category.results.map((result: any) => ({
      id: result.entry.id || Math.random().toString(),
      name: result.entry.name,
      sex: result.entry.sex || 'M',
      age: result.entry.age || 25,
      division: result.entry.division || 'OP',
      weightClass: result.entry.weightClass || '0',
      bodyweightKg: result.entry.bodyweightKg || 0,
      equipment: result.entry.equipment || 'Raw',
      movements: result.entry.movements || 'AST',
      squat1: result.entry.squat1 || 0,
      squat2: result.entry.squat2 || 0,
      squat3: result.entry.squat3 || 0,
      bench1: result.entry.bench1 || 0,
      bench2: result.entry.bench2 || 0,
      bench3: result.entry.bench3 || 0,
      deadlift1: result.entry.deadlift1 || 0,
      deadlift2: result.entry.deadlift2 || 0,
      deadlift3: result.entry.deadlift3 || 0,
      team: result.entry.team || ''
    }))
  );

  // Calcular resultados de Best Lifter
  const bestLifterCategories = calculateBestLifterResults(entries);

  // Estatísticas gerais
  const totalAthletes = entries.length;
  const totalCategories = bestLifterCategories.length;
  const totalMedals = bestLifterCategories.reduce((sum: number, category: BestLifterCategory) => sum + category.results.length, 0);

  // Função para obter ícone de medalha
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <FaMedal className="text-warning" />;
      case 2: return <FaMedal className="text-secondary" />;
      case 3: return <FaMedal className="text-danger" />;
      default: return null;
    }
  };

  return (
    <Card>
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">
          <FaTrophy className="me-2" />
          Best Lifter - Melhor Atleta IPF
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <p className="text-muted text-center">
            Resultados baseados na fórmula oficial IPF GL Points, seguindo as regras oficiais da Federação
          </p>
        </div>

        {/* Estatísticas gerais */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-light">
              <Card.Body className="text-center">
                <h6 className="text-primary mb-3">Estatísticas do Best Lifter</h6>
                <Row>
                  <Col md={3}>
                    <div className="border-end">
                      <h4 className="text-success">{totalAthletes}</h4>
                      <small className="text-muted">Total de Atletas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h4 className="text-info">{totalCategories}</h4>
                      <small className="text-muted">Categorias Válidas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h4 className="text-warning">{totalMedals}</h4>
                      <small className="text-muted">Medalhas Atribuídas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div>
                      <h4 className="text-danger">
                        {Math.max(...entries.map(entry => {
                          const bestSquat = Math.max(entry.squat1 || 0, entry.squat2 || 0, entry.squat3 || 0);
                          const bestBench = Math.max(entry.bench1 || 0, entry.bench2 || 0, entry.bench3 || 0);
                          const bestDeadlift = Math.max(entry.deadlift1 || 0, entry.deadlift2 || 0, entry.deadlift3 || 0);
                          return bestSquat + bestBench + bestDeadlift;
                        }))}kg
                      </h4>
                      <small className="text-muted">Maior Total</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Explicação das regras */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-info text-white">
              <Card.Body>
                <h6 className="mb-2">
                  <FaTrophy className="me-2" />
                  Regras do Best Lifter IPF
                </h6>
                <ul className="mb-0 small">
                  <li>Prêmios são atribuídos apenas para categorias com 3+ atletas</li>
                  <li>Ordenação: 1º IPF GL Points, 2º Peso corporal (mais leve), 3º Ordem de inscrição</li>
                  <li>Divisões: Sub-Junior (SJ), Junior (JR), Open (OP), Master I-IV (M1-M4)</li>
                  <li>Equipamentos: Clássico (Raw) e Equipado separadamente</li>
                  <li>Eventos: Powerlifting (SBD) e Supino (B) com parâmetros específicos</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Categorias de Best Lifter */}
        {bestLifterCategories.length > 0 ? (
          bestLifterCategories.map((category: BestLifterCategory, categoryIndex: number) => (
            <Row key={categoryIndex} className="mb-4">
              <Col>
                <Card>
                  <Card.Header className={`text-white ${
                    category.sex === 'M' 
                      ? (category.equipment === 'Classico' ? 'bg-success' : 'bg-primary')
                      : (category.equipment === 'Classico' ? 'bg-warning' : 'bg-danger')
                  }`}>
                    <h6 className="mb-0">
                      <FaTrophy className="me-2" />
                      {category.sex === 'M' ? 'Masculino' : 'Feminino'} {' '}
                      {getEquipmentDisplayNameForBestLifter(category.equipment)} {' '}
                      {getAgeDivisionDisplayName(category.ageDivision)} {' '}
                      ({getEventTypeDisplayName(category.eventType)})
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive className="mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center">Pos</th>
                          <th>Atleta</th>
                          <th>Equipe</th>
                          <th>Peso (kg)</th>
                          {category.eventType === 'SBD' && (
                            <>
                              <th>Agachamento</th>
                              <th>Supino</th>
                              <th>Terra</th>
                            </>
                          )}
                          {category.eventType === 'B' && (
                            <th>Supino</th>
                          )}
                          <th>Total</th>
                          <th>IPF GL Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.results.map((result: BestLifterResult) => (
                          <tr key={result.entry.id}>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                {getMedalIcon(result.position)}
                                <span className="ms-2 fw-bold">{result.position}º</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{result.entry.name}</strong>
                                <br />
                                <small className="text-muted">
                                  {result.entry.team || 'Sem equipe'}
                                </small>
                              </div>
                            </td>
                            <td>{result.entry.team || '-'}</td>
                            <td className="text-center">
                              <span className="fw-bold">{result.bodyweight}kg</span>
                            </td>
                            {category.eventType === 'SBD' && (
                              <>
                                <td className="text-center">
                                  <span className="fw-bold">
                                    {Math.max(result.entry.squat1 || 0, result.entry.squat2 || 0, result.entry.squat3 || 0)}kg
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className="fw-bold">
                                    {Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0)}kg
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className="fw-bold">
                                    {Math.max(result.entry.deadlift1 || 0, result.entry.deadlift2 || 0, result.entry.deadlift3 || 0)}kg
                                  </span>
                                </td>
                              </>
                            )}
                            {category.eventType === 'B' && (
                              <td className="text-center">
                                <span className="fw-bold">
                                  {Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0)}kg
                                </span>
                              </td>
                            )}
                            <td className="text-center">
                              <span className="fw-bold text-primary fs-5">
                                {result.total}kg
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="fw-bold text-success fs-5">
                                {result.points.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ))
        ) : (
          <Row>
            <Col>
              <Alert variant="warning" className="text-center">
                <FaTrophy size={48} className="mb-3" />
                <h4>Nenhuma categoria válida para Best Lifter</h4>
                <p>
                  Para atribuir prêmios de Best Lifter, é necessário que cada categoria tenha pelo menos 3 atletas.
                  <br />
                  Categorias com menos de 3 atletas não recebem prêmios conforme as regras oficiais da IPF.
                </p>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Categorias sem prêmios (menos de 3 atletas) */}
        {(() => {
          const invalidCategories = bestLifterCategories
            .filter((category: BestLifterCategory) => !category.hasMinimumAthletes);
          
          if (invalidCategories.length > 0) {
            return (
              <Row className="mb-4">
                <Col>
                  <Card className="bg-warning">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0">
                        <FaTrophy className="me-2" />
                        Categorias sem Prêmios (Menos de 3 Atletas)
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-2 small">
                        As seguintes categorias não recebem prêmios de Best Lifter por não atenderem ao mínimo de 3 atletas:
                      </p>
                      <ul className="mb-0 small">
                        {invalidCategories.map((category: BestLifterCategory, index: number) => (
                          <li key={index}>
                            {category.sex === 'M' ? 'Masculino' : 'Feminino'} {' '}
                            {getEquipmentDisplayNameForBestLifter(category.equipment)} {' '}
                            {getAgeDivisionDisplayName(category.ageDivision)} {' '}
                            ({getEventTypeDisplayName(category.eventType)}) - 
                            {category.results.length} atleta{category.results.length !== 1 ? 's' : ''}
                          </li>
                        ))}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            );
          }
          return null;
        })()}
      </Card.Body>
    </Card>
  );
};

export default DetalhesResultadoPage;
