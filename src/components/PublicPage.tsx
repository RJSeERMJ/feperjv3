import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Tab, Tabs, Row, Col, Card, Table, Button, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import { FaUsers, FaFileDownload, FaSignInAlt, FaHome, FaTrophy, FaTimes, FaChartBar, FaMedal, FaCrown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { atletaService } from '../services/firebaseService';
import { documentosContabeisService, DocumentoContabil } from '../services/documentosContabeisService';
import { nominacaoService, NominacaoData } from '../services/nominacaoService';
import { resultadoImportadoService, ResultadoImportado } from '../services/resultadoImportadoService';
import { Atleta } from '../types';
import RecordsDisplayPublic from './RecordsDisplayPublic';
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
import './PublicPage.css';

const PublicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('atletas');
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoContabil[]>([]);
  const [nominacoes, setNominacoes] = useState<NominacaoData[]>([]);
  const [resultadosImportados, setResultadosImportados] = useState<ResultadoImportado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNominacaoModal, setShowNominacaoModal] = useState(false);
  const [nominacaoSelecionada, setNominacaoSelecionada] = useState<NominacaoData | null>(null);
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoImportado | null>(null);
  const [activeResultadoTab, setActiveResultadoTab] = useState<'atletas' | 'equipes' | 'estatisticas'>('atletas');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar atletas, documentos, nominações e resultados importados em paralelo
      const [atletasData, documentosData, nominacoesData, resultadosData] = await Promise.all([
        atletaService.getAll(),
        documentosContabeisService.listarDocumentos(),
        nominacaoService.getAllNominacoes(),
        resultadoImportadoService.getAll()
      ]);

      // Mostrar TODOS os atletas cadastrados no sistema
      setAtletas(atletasData);
      setDocumentos(documentosData);
      setNominacoes(nominacoesData);
      setResultadosImportados(resultadosData);
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

  const handleVerResultado = async (resultado: ResultadoImportado) => {
    try {
      // Buscar dados completos do resultado
      const resultadoCompleto = await resultadoImportadoService.getById(resultado.id!);
      if (resultadoCompleto) {
        setResultadoSelecionado(resultadoCompleto);
        setShowResultadoModal(true);
        setActiveResultadoTab('atletas');
      }
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    }
  };

  const handleFecharResultadoModal = () => {
    setShowResultadoModal(false);
    setResultadoSelecionado(null);
    setActiveResultadoTab('atletas');
  };

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

  // Função para exportar PDF
  const handleExportPDF = () => {
    if (!resultadoSelecionado) return;
    
    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.text('Resultados da Competição', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`${resultadoSelecionado.competitionName}`, 14, 30);
      doc.text(`${resultadoSelecionado.competitionCity} - ${formatarData(resultadoSelecionado.competitionDate)}`, 14, 37);
      doc.text(`Total de Atletas: ${resultadoSelecionado.totalAthletes}`, 14, 44);
      doc.text(`Data de Importação: ${formatarData(resultadoSelecionado.importDate)}`, 14, 51);
      
      // Resultados por categoria
      if (resultadoSelecionado.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Resultados por Categoria', 14, 20);
        
        let yPosition = 35;
        resultadoSelecionado.results.complete.forEach((category: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(14);
          doc.text(category.category, 14, yPosition);
          yPosition += 10;
          
          // Tabela de resultados da categoria com tentativas individuais
          const tableData = category.results.map((result: any, pos: number) => {
            return [
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
            ];
          });
          
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

      // Ranking de Equipes
      if (resultadoSelecionado.results?.teams) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Ranking das Equipes - Categoria OPEN', 14, 20);
        
        let yPosition = 35;
        
        // Informações sobre pontuação
        doc.setFontSize(10);
        doc.text('Pontuação: 1º=12, 2º=9, 3º=8, 4º=7, 5º=6, 6º=5, 7º=4, 8º=3, 9º=2, 10º+=1', 14, yPosition);
        yPosition += 10;
        doc.text('Contam apenas os 5 melhores atletas de cada equipe por modalidade e tipo de competição', 14, yPosition);
        yPosition += 15;
        
        Object.entries(resultadoSelecionado.results.teams).forEach(([key, teamData]: [string, any]) => {
          if (Array.isArray(teamData) && teamData.length > 0) {
            if (yPosition > 200) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(getCategoryDisplayName(key), 14, yPosition);
            yPosition += 10;
            
            // Tabela de ranking das equipes
            const teamTableData = teamData.map((team: any, index: number) => [
              index + 1,
              team.name,
              team.totalPoints || 0,
              team.firstPlaces || 0,
              team.secondPlaces || 0,
              team.thirdPlaces || 0,
              team.totalIPFPoints ? team.totalIPFPoints.toFixed(2) : '0.00',
              team.athletes ? team.athletes.length : 0
            ]);
            
            autoTable(doc, {
              startY: yPosition,
              head: [['Pos', 'Equipe', 'Total Pontos', '1ºs Lugares', '2ºs Lugares', '3ºs Lugares', 'Total IPF GL', 'Atletas']],
              body: teamTableData,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [40, 167, 69] }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 15;
          }
        });
      }

      // Melhores Tentativas
      if (resultadoSelecionado.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Melhores Tentativas por Movimento', 14, 20);
        
        let yPosition = 35;
        
        resultadoSelecionado.results.complete.forEach((category: any, index: number) => {
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(category.category, 14, yPosition);
          yPosition += 15;
          
          // Melhor Agachamento
          const bestSquat = category.results
            .filter((result: any) => result.entry.squat1 || result.entry.squat2 || result.entry.squat3)
            .sort((a: any, b: any) => {
              const aBest = Math.max(a.entry.squat1 || 0, a.entry.squat2 || 0, a.entry.squat3 || 0);
              const bBest = Math.max(b.entry.squat1 || 0, b.entry.squat2 || 0, b.entry.squat3 || 0);
              return bBest - aBest;
            })[0];
          
          if (bestSquat) {
            const bestWeight = Math.max(bestSquat.entry.squat1 || 0, bestSquat.entry.squat2 || 0, bestSquat.entry.squat3 || 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Melhor Agachamento: ${bestWeight} kg - ${bestSquat.entry.name} (${bestSquat.entry.team || 'Sem equipe'})`, 14, yPosition);
            yPosition += 8;
          }
          
          // Melhor Supino
          const bestBench = category.results
            .filter((result: any) => result.entry.bench1 || result.entry.bench2 || result.entry.bench3)
            .sort((a: any, b: any) => {
              const aBest = Math.max(a.entry.bench1 || 0, a.entry.bench2 || 0, a.entry.bench3 || 0);
              const bBest = Math.max(b.entry.bench1 || 0, b.entry.bench2 || 0, b.entry.bench3 || 0);
              return bBest - aBest;
            })[0];
          
          if (bestBench) {
            const bestWeight = Math.max(bestBench.entry.bench1 || 0, bestBench.entry.bench2 || 0, bestBench.entry.bench3 || 0);
            doc.text(`Melhor Supino: ${bestWeight} kg - ${bestBench.entry.name} (${bestBench.entry.team || 'Sem equipe'})`, 14, yPosition);
            yPosition += 8;
          }
          
          // Melhor Terra
          const bestDeadlift = category.results
            .filter((result: any) => result.entry.deadlift1 || result.entry.deadlift2 || result.entry.deadlift3)
            .sort((a: any, b: any) => {
              const aBest = Math.max(a.entry.deadlift1 || 0, a.entry.deadlift2 || 0, a.entry.deadlift3 || 0);
              const bBest = Math.max(b.entry.deadlift1 || 0, b.entry.deadlift2 || 0, b.entry.deadlift3 || 0);
              return bBest - aBest;
            })[0];
          
          if (bestDeadlift) {
            const bestWeight = Math.max(bestDeadlift.entry.deadlift1 || 0, bestDeadlift.entry.deadlift2 || 0, bestDeadlift.entry.deadlift3 || 0);
            doc.text(`Melhor Terra: ${bestWeight} kg - ${bestDeadlift.entry.name} (${bestDeadlift.entry.team || 'Sem equipe'})`, 14, yPosition);
            yPosition += 8;
          }
          
          // Melhor Total
          const bestTotal = category.results
            .filter((result: any) => result.total > 0)
            .sort((a: any, b: any) => b.total - a.total)[0];
          
          if (bestTotal) {
            doc.setFont('helvetica', 'bold');
            doc.text(`Melhor Total: ${bestTotal.total} kg - ${bestTotal.entry.name} (${bestTotal.entry.team || 'Sem equipe'}) - ${bestTotal.points.toFixed(2)} pontos IPF GL`, 14, yPosition);
            yPosition += 12;
          } else {
            yPosition += 8;
          }
        });
      }
      
      // Salvar PDF
      doc.save(`resultados-${resultadoSelecionado.competitionName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
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
                              <Badge bg={atleta.status === 'ATIVO' ? 'success' : 'secondary'}>
                                {atleta.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                              </Badge>
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

          <Tab eventKey="records" title={
            <span>
              <FaCrown className="me-2" />
              Records
            </span>
          }>
            <Card>
              <Card.Header>
                <h4 className="mb-0">
                  <FaCrown className="me-2" />
                  Records de Powerlifting
                </h4>
                <small className="text-muted">
                  Records oficiais da FEPERJ por divisão de idade, sexo e modalidade
                </small>
              </Card.Header>
              <Card.Body>
                <RecordsDisplayPublic />
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="resultados" title={
            <span>
              <FaTrophy className="me-2" />
              Resultados Importados
            </span>
          }>
            <Card>
              <Card.Header>
                <h4 className="mb-0">
                  <FaTrophy className="me-2" />
                  Resultados de Competições Importados
                </h4>
                <small className="text-muted">
                  Resultados de competições realizadas e importadas do sistema Barra Pronta
                </small>
              </Card.Header>
              <Card.Body>
                {resultadosImportados.length === 0 ? (
                  <Alert variant="info">
                    Nenhum resultado importado encontrado no momento.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>Competição</th>
                          <th>Data</th>
                          <th>Local</th>
                          <th>País</th>
                          <th>Atletas</th>
                          <th>Data Importação</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosImportados.map((resultado) => (
                          <tr key={resultado.id}>
                            <td>
                              <strong>{resultado.competitionName}</strong>
                            </td>
                            <td>
                              {formatarData(resultado.competitionDate)}
                            </td>
                            <td>
                              {resultado.competitionCity}
                            </td>
                            <td>
                              {resultado.competitionCountry}
                            </td>
                            <td>
                              <Badge bg="info">
                                {resultado.totalAthletes}
                              </Badge>
                            </td>
                            <td>
                              {formatarData(resultado.importDate)}
                            </td>
                            <td>
                              <Badge bg={resultado.status === 'COMPLETO' ? 'success' : 'warning'}>
                                {resultado.status}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleVerResultado(resultado)}
                              >
                                <FaTrophy className="me-1" />
                                Ver Resultados
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

      {/* Modal de Detalhes dos Resultados Importados */}
      <Modal show={showResultadoModal} onHide={handleFecharResultadoModal} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTrophy className="me-2" />
            {resultadoSelecionado?.competitionName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resultadoSelecionado && (
            <div>
              {/* Informações da Competição */}
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Informações da Competição</h5>
                    <Button variant="outline-primary" size="sm" onClick={handleExportPDF}>
                      <FaFileDownload className="me-1" />
                      Exportar PDF
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Nome:</strong> {resultadoSelecionado.competitionName}</p>
                      <p><strong>Data:</strong> {formatarData(resultadoSelecionado.competitionDate)}</p>
                      <p><strong>Cidade:</strong> {resultadoSelecionado.competitionCity}</p>
                      <p><strong>País:</strong> {resultadoSelecionado.competitionCountry}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Total de Atletas:</strong> 
                        <Badge bg="info" className="ms-2">
                          {resultadoSelecionado.totalAthletes}
                        </Badge>
                      </p>
                      <p><strong>Status:</strong> 
                        <Badge bg={resultadoSelecionado.status === 'COMPLETO' ? 'success' : 'warning'} className="ms-2">
                          {resultadoSelecionado.status}
                        </Badge>
                      </p>
                      <p><strong>Data de Importação:</strong> {formatarData(resultadoSelecionado.importDate)}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Abas de Navegação */}
              <Nav variant="tabs" activeKey={activeResultadoTab} onSelect={(k) => setActiveResultadoTab(k as 'atletas' | 'equipes' | 'estatisticas')}>
                <Nav.Item>
                  <Nav.Link eventKey="atletas">
                    <FaUsers className="me-1" />
                    Resultados por Atleta
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="equipes">
                    <FaTrophy className="me-1" />
                    Classificação por Equipe
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="estatisticas">
                    <FaChartBar className="me-1" />
                    Estatísticas
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {/* Conteúdo das Abas */}
              {activeResultadoTab === 'atletas' && (
                <div className="mt-3">
                  {resultadoSelecionado.results?.complete && resultadoSelecionado.results.complete.length > 0 ? (
                    <div>
                      {resultadoSelecionado.results.complete.map((category: any, index: number) => (
                        <Card key={index} className="mb-3">
                          <Card.Header>
                            <h6 className="mb-0">
                              <Badge bg="primary" className="me-2">
                                {getCategoryDisplayName(category.category)}
                              </Badge>
                              ({category.results.length} atletas)
                            </h6>
                          </Card.Header>
                          <Card.Body>
                            <div className="table-responsive">
                              <Table striped hover size="sm">
                                <thead>
                                  <tr>
                                    <th rowSpan={2}>Pos</th>
                                    <th rowSpan={2}>Atleta</th>
                                    <th rowSpan={2}>Equipe</th>
                                    <th colSpan={3}>Agachamento</th>
                                    <th colSpan={3}>Supino</th>
                                    <th colSpan={3}>Terra</th>
                                    <th rowSpan={2}>Total (kg)</th>
                                    <th rowSpan={2}>Pontos IPF GL</th>
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
                                  {category.results.map((result: any, pos: number) => {
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
                                      <tr key={pos}>
                                        <td>
                                          <Badge bg={pos < 3 ? 'warning' : 'secondary'}>
                                            {pos + 1}º
                                          </Badge>
                                        </td>
                                        <td>
                                          <strong>{result.entry.name}</strong>
                                        </td>
                                        <td>{result.entry.team || '-'}</td>
                                        {/* Tentativas de Agachamento */}
                                        <td>{renderAttempt(result.entry.squat1 || 0, result.entry.squat1 === bestSquat && bestSquat > 0)}</td>
                                        <td>{renderAttempt(result.entry.squat2 || 0, result.entry.squat2 === bestSquat && bestSquat > 0)}</td>
                                        <td>{renderAttempt(result.entry.squat3 || 0, result.entry.squat3 === bestSquat && bestSquat > 0)}</td>
                                        {/* Tentativas de Supino */}
                                        <td>{renderAttempt(result.entry.bench1 || 0, result.entry.bench1 === bestBench && bestBench > 0)}</td>
                                        <td>{renderAttempt(result.entry.bench2 || 0, result.entry.bench2 === bestBench && bestBench > 0)}</td>
                                        <td>{renderAttempt(result.entry.bench3 || 0, result.entry.bench3 === bestBench && bestBench > 0)}</td>
                                        {/* Tentativas de Terra */}
                                        <td>{renderAttempt(result.entry.deadlift1 || 0, result.entry.deadlift1 === bestDeadlift && bestDeadlift > 0)}</td>
                                        <td>{renderAttempt(result.entry.deadlift2 || 0, result.entry.deadlift2 === bestDeadlift && bestDeadlift > 0)}</td>
                                        <td>{renderAttempt(result.entry.deadlift3 || 0, result.entry.deadlift3 === bestDeadlift && bestDeadlift > 0)}</td>
                                        <td>
                                          <strong>{result.total} kg</strong>
                                        </td>
                                        <td>
                                          <strong>{result.points.toFixed(2)}</strong>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </Table>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info">
                      Nenhum resultado detalhado disponível para esta competição.
                    </Alert>
                  )}
                </div>
              )}

              {activeResultadoTab === 'equipes' && (
                <div className="mt-3">
                  {resultadoSelecionado.results?.teams && Object.keys(resultadoSelecionado.results.teams).length > 0 ? (
                    <div>
                      {/* Informações sobre o ranking */}
                      <Card className="mb-3 bg-light">
                        <Card.Body className="text-center">
                          <h6 className="text-primary mb-2">
                            <FaTrophy className="me-2" />
                            Ranking das Equipes - Categoria OPEN
                          </h6>
                          <p className="text-muted mb-1">
                            <strong>Pontuação:</strong> 1º=12, 2º=9, 3º=8, 4º=7, 5º=6, 6º=5, 7º=4, 8º=3, 9º=2, 10º+=1
                          </p>
                          <p className="text-muted mb-0">
                            Contam apenas os 5 melhores atletas de cada equipe por modalidade e tipo de competição
                          </p>
                        </Card.Body>
                      </Card>

                      {/* Rankings por modalidade e tipo de competição */}
                      {Object.entries(resultadoSelecionado.results.teams).map(([key, teamData]: [string, any]) => (
                        <Card key={key} className="mb-3">
                          <Card.Header>
                            <h6 className="mb-0">
                              <Badge bg="primary" className="me-2">
                                {getCategoryDisplayName(key)}
                              </Badge>
                              ({Array.isArray(teamData) ? teamData.length : 0} equipes)
                            </h6>
                          </Card.Header>
                          <Card.Body>
                            {Array.isArray(teamData) && teamData.length > 0 ? (
                              <div className="table-responsive">
                                <Table striped hover size="sm">
                                  <thead>
                                    <tr>
                                      <th>Pos</th>
                                      <th>Equipe</th>
                                      <th>Total Pontos</th>
                                      <th>1ºs Lugares</th>
                                      <th>2ºs Lugares</th>
                                      <th>3ºs Lugares</th>
                                      <th>Total IPF GL</th>
                                      <th>Atletas</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teamData.map((team: any, index: number) => (
                                      <tr key={team.name}>
                                        <td>
                                          <Badge bg={index < 3 ? 'warning' : 'secondary'}>
                                            {index + 1}º
                                          </Badge>
                                        </td>
                                        <td>
                                          <strong>{team.name}</strong>
                                        </td>
                                        <td>
                                          <strong>{team.totalPoints || 0}</strong>
                                        </td>
                                        <td>
                                          <Badge bg="success">
                                            {team.firstPlaces || 0}
                                          </Badge>
                                        </td>
                                        <td>
                                          <Badge bg="info">
                                            {team.secondPlaces || 0}
                                          </Badge>
                                        </td>
                                        <td>
                                          <Badge bg="warning">
                                            {team.thirdPlaces || 0}
                                          </Badge>
                                        </td>
                                        <td>
                                          <strong>{team.totalIPFPoints ? team.totalIPFPoints.toFixed(2) : '0.00'}</strong>
                                        </td>
                                        <td>
                                          <Badge bg="secondary">
                                            {team.athletes ? team.athletes.length : 0}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              </div>
                            ) : (
                              <Alert variant="info">
                                Nenhuma equipe encontrada para esta modalidade.
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert variant="info">
                      Nenhuma classificação por equipe disponível.
                    </Alert>
                  )}
                </div>
              )}


              {activeResultadoTab === 'estatisticas' && (
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
                            <li><strong>Total de Atletas:</strong> {resultadoSelecionado.totalAthletes}</li>
                            <li><strong>Categorias:</strong> {resultadoSelecionado.results?.complete?.length || 0}</li>
                            <li><strong>Modalidades:</strong> Clássica e Equipado</li>
                            <li><strong>Movimentos:</strong> AST, S, T</li>
                          </ul>
                        </Col>
                        <Col md={6}>
                          <h6>Distribuição por Modalidade</h6>
                          {resultadoSelecionado.results?.simplified ? (
                            <ul>
                              <li><strong>Resultados Simplificados:</strong> {resultadoSelecionado.results.simplified.length}</li>
                              <li><strong>Rankings de Equipes:</strong> {resultadoSelecionado.results.teams ? Object.keys(resultadoSelecionado.results.teams).length : 0}</li>
                            </ul>
                          ) : (
                            <p className="text-muted">Nenhuma estatística disponível</p>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Best Lifter - Melhores Atletas */}
                  <BestLifterStatsPublic resultado={resultadoSelecionado} />
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleFecharResultadoModal}>
            <FaTimes className="me-1" />
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

// Componente para exibir Best Lifter - Melhores Atletas na página pública
const BestLifterStatsPublic: React.FC<{ resultado: ResultadoImportado | null }> = ({ resultado }) => {
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

export default PublicPage;
