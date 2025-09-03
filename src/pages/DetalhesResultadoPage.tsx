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
          
          // Tabela de resultados da categoria
          const tableData = category.results.map((result: any, pos: number) => [
            pos + 1,
            result.entry.name,
            result.entry.team || '-',
            result.total,
            result.points.toFixed(2)
          ]);
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Pos', 'Atleta', 'Equipe', 'Total (kg)', 'Pontos IPF GL']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
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
                            <th>Pos</th>
                            <th>Atleta</th>
                            <th>Equipe</th>
                            <th>Total (kg)</th>
                            <th>Pontos IPF GL</th>
                            <th>Modalidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.results.map((result: any, index: number) => (
                            <tr key={index}>
                              <td className="text-center">
                                {index === 0 && <FaMedal className="text-warning" />}
                                {index === 1 && <FaMedal className="text-secondary" />}
                                {index === 2 && <FaMedal className="text-bronze" />}
                                <span className="ms-1">{index + 1}</span>
                              </td>
                              <td><strong>{result.entry.name}</strong></td>
                              <td>{result.entry.team || '-'}</td>
                              <td className="text-center">{result.total}</td>
                              <td className="text-center">{result.points.toFixed(2)}</td>
                              <td className="text-center">
                                <Badge bg={result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA' ? 'primary' : 'success'}>
                                  {result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA' ? 'Clássica' : 'Equipado'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
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
          <Card>
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
        )}
      </Container>
    </div>
  );
};

export default DetalhesResultadoPage;
