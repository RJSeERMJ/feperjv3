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
  const [activeResultadoTab, setActiveResultadoTab] = useState<'atletas' | 'equipes' | 'estatisticas' | 'melhor-atleta'>('atletas');
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

  // Função para exportar PDF com todas as abas
  const handleExportPDF = () => {
    if (!resultadoSelecionado) return;
    
    try {
          const doc = new jsPDF('landscape');
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.text('Resultados da Competição', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`${resultadoSelecionado.competitionName}`, 14, 30);
      doc.text(`${resultadoSelecionado.competitionCity} - ${formatarData(resultadoSelecionado.competitionDate)}`, 14, 37);
      doc.text(`Total de Atletas: ${resultadoSelecionado.totalAthletes}`, 14, 44);
      doc.text(`Data de Importação: ${formatarData(resultadoSelecionado.importDate)}`, 14, 51);
      
      // ===== ABA 1: RESULTADOS POR ATLETA =====
      if (resultadoSelecionado.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('RESULTADOS POR ATLETA', 14, 20);
        
        let yPosition = 35;
        resultadoSelecionado.results.complete.forEach((category: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(14);
          doc.text(category.category, 14, yPosition);
          yPosition += 10;
          
          // Tabela de resultados da categoria
          const tableData = category.results.map((result: any, pos: number) => {
            return [
              pos + 1,
              result.entry.name,
              result.entry.bodyweightKg ? result.entry.bodyweightKg + 'kg' : 'N/A',
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
            head: [['Pos', 'Atleta', 'Peso', 'Equipe', 'A1', 'A2', 'A3', 'S1', 'S2', 'S3', 'T1', 'T2', 'T3', 'Total (kg)', 'Pontos IPF GL']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 7 },
            headStyles: { fillColor: [66, 139, 202] },
            columnStyles: {
              0: { cellWidth: 12 },
              1: { cellWidth: 35 },
              2: { cellWidth: 18 },
              3: { cellWidth: 25 },
              4: { cellWidth: 15 },
              5: { cellWidth: 15 },
              6: { cellWidth: 15 },
              7: { cellWidth: 15 },
              8: { cellWidth: 15 },
              9: { cellWidth: 15 },
              10: { cellWidth: 15 },
              11: { cellWidth: 15 },
              12: { cellWidth: 18 },
              13: { cellWidth: 18 }
            },
            margin: { top: 20, right: 14, bottom: 20, left: 14 },
            pageBreak: 'auto',
            tableWidth: 'wrap'
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        });
      }

      // ===== ABA 2: CLASSIFICAÇÃO POR EQUIPE =====
      if (resultadoSelecionado.results?.teams) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('CLASSIFICAÇÃO POR EQUIPE', 14, 20);
        
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
              headStyles: { fillColor: [40, 167, 69] },
              columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 60 },
                2: { cellWidth: 30 },
                3: { cellWidth: 30 },
                4: { cellWidth: 30 },
                5: { cellWidth: 30 },
                6: { cellWidth: 35 },
                7: { cellWidth: 25 }
              }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 15;
          }
        });
      }

      // ===== ABA 3: ESTATÍSTICAS =====
      if (resultadoSelecionado.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('ESTATÍSTICAS DA COMPETIÇÃO', 14, 20);
        
        let yPosition = 35;
        
        // Estatísticas gerais
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
        doc.text('Resumo Geral:', 14, yPosition);
        yPosition += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`• Total de Atletas: ${resultadoSelecionado.totalAthletes}`, 20, yPosition);
        yPosition += 8;
        doc.text(`• Categorias: ${resultadoSelecionado.results.complete.length}`, 20, yPosition);
        yPosition += 8;
        doc.text(`• Data: ${formatarData(resultadoSelecionado.competitionDate)}`, 20, yPosition);
        yPosition += 8;
        doc.text(`• Local: ${resultadoSelecionado.competitionCity}`, 20, yPosition);
          yPosition += 15;
          
        // Contar atletas por sexo
        const maleAthletes = resultadoSelecionado.results.complete.reduce((sum: number, category: any) => 
          sum + category.results.filter((result: any) => result.entry.sex === 'M').length, 0
        );
        const femaleAthletes = resultadoSelecionado.results.complete.reduce((sum: number, category: any) => 
          sum + category.results.filter((result: any) => result.entry.sex === 'F').length, 0
        );
        
        doc.setFont('helvetica', 'bold');
        doc.text('Distribuição por Sexo:', 14, yPosition);
        yPosition += 10;
        
            doc.setFont('helvetica', 'normal');
        doc.text(`• Masculino: ${maleAthletes} atletas`, 20, yPosition);
            yPosition += 8;
        doc.text(`• Feminino: ${femaleAthletes} atletas`, 20, yPosition);
        yPosition += 15;
        
        // Melhores tentativas
        doc.setFont('helvetica', 'bold');
        doc.text('Melhores Tentativas:', 14, yPosition);
        yPosition += 10;
        
        const bestSquat = Math.max(...resultadoSelecionado.results.complete.flatMap((category: any) => 
          category.results.map((result: any) => Math.max(result.entry.squat1 || 0, result.entry.squat2 || 0, result.entry.squat3 || 0))
        ));
        const bestBench = Math.max(...resultadoSelecionado.results.complete.flatMap((category: any) => 
          category.results.map((result: any) => Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0))
        ));
        const bestDeadlift = Math.max(...resultadoSelecionado.results.complete.flatMap((category: any) => 
          category.results.map((result: any) => Math.max(result.entry.deadlift1 || 0, result.entry.deadlift2 || 0, result.entry.deadlift3 || 0))
        ));
        const bestTotal = Math.max(...resultadoSelecionado.results.complete.flatMap((category: any) => 
          category.results.map((result: any) => result.total || 0)
        ));
        const bestIPFPoints = Math.max(...resultadoSelecionado.results.complete.flatMap((category: any) => 
          category.results.map((result: any) => result.points || 0)
        ));
        
        doc.setFont('helvetica', 'normal');
        doc.text(`• Melhor Agachamento: ${bestSquat} kg`, 20, yPosition);
            yPosition += 8;
        doc.text(`• Melhor Supino: ${bestBench} kg`, 20, yPosition);
        yPosition += 8;
        doc.text(`• Melhor Terra: ${bestDeadlift} kg`, 20, yPosition);
        yPosition += 8;
        doc.text(`• Melhor Total: ${bestTotal} kg`, 20, yPosition);
        yPosition += 8;
        doc.text(`• Melhor IPF GL Points: ${bestIPFPoints.toFixed(2)}`, 20, yPosition);
        yPosition += 15;
        
        // Distribuição por categoria
        doc.setFont('helvetica', 'bold');
        doc.text('Distribuição por Categoria:', 14, yPosition);
        yPosition += 10;
        
        resultadoSelecionado.results.complete.forEach((category: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          const maleCount = category.results.filter((r: any) => r.entry.sex === 'M').length;
          const femaleCount = category.results.filter((r: any) => r.entry.sex === 'F').length;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`• ${category.category}: ${category.results.length} atletas (${maleCount}M, ${femaleCount}F)`, 20, yPosition);
            yPosition += 8;
        });
      }

      // ===== ABA 4: MELHOR ATLETA (BEST LIFTER) =====
      if (resultadoSelecionado.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('MELHOR ATLETA - BEST LIFTER IPF', 14, 20);
        
        let yPosition = 35;
        
        // Informações sobre o Best Lifter
        doc.setFontSize(10);
        doc.text('Resultados baseados na fórmula oficial IPF GL Points, seguindo as regras oficiais da Federação', 14, yPosition);
        yPosition += 10;
        doc.text('Prêmios são atribuídos apenas para categorias com 3+ atletas', 14, yPosition);
        yPosition += 10;
        doc.text('Ordenação: 1º IPF GL Points, 2º Peso corporal (mais leve), 3º Ordem de inscrição', 14, yPosition);
        yPosition += 15;
        
        // Converter dados para Best Lifter
        const entries = resultadoSelecionado.results.complete.flatMap(category => 
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
        
        if (bestLifterCategories.length > 0) {
          doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
          doc.text(`Categorias Válidas para Best Lifter: ${bestLifterCategories.length}`, 14, yPosition);
          yPosition += 15;
          
          bestLifterCategories.forEach((category: any, categoryIndex: number) => {
            if (yPosition > 200) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${category.sex === 'M' ? 'Masculino' : 'Feminino'} ${category.equipment} ${category.ageDivision} (${category.eventType})`, 14, yPosition);
            yPosition += 10;
            
            // Tabela de Best Lifter
            const bestLifterTableData = category.results.map((result: any) => [
              result.position,
              result.entry.name,
              result.entry.team || '-',
              result.bodyweight,
              category.eventType === 'SBD' ? Math.max(result.entry.squat1 || 0, result.entry.squat2 || 0, result.entry.squat3 || 0) : '-',
              Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0),
              category.eventType === 'SBD' ? Math.max(result.entry.deadlift1 || 0, result.entry.deadlift2 || 0, result.entry.deadlift3 || 0) : '-',
              result.total,
              result.points.toFixed(2)
            ]);
            
            const headers = category.eventType === 'SBD' 
              ? ['Pos', 'Atleta', 'Equipe', 'Peso', 'Agachamento', 'Supino', 'Terra', 'Total', 'IPF GL']
              : ['Pos', 'Atleta', 'Equipe', 'Peso', 'Supino', 'Total', 'IPF GL'];
            
            autoTable(doc, {
              startY: yPosition,
              head: [headers],
              body: bestLifterTableData,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [52, 144, 220] },
              columnStyles: category.eventType === 'SBD' ? {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 35 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 },
                5: { cellWidth: 30 },
                6: { cellWidth: 30 },
                7: { cellWidth: 25 },
                8: { cellWidth: 25 }
              } : {
                0: { cellWidth: 20 },
                1: { cellWidth: 60 },
                2: { cellWidth: 40 },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 }
              }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 15;
          });
        } else {
          doc.setFontSize(12);
          doc.text('Nenhuma categoria válida para Best Lifter (mínimo 3 atletas por categoria)', 14, yPosition);
        }
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
                <Nav.Item>
                  <Nav.Link eventKey="melhor-atleta">
                    <FaTrophy className="me-1" />
                    Melhor Atleta
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
                                    <th rowSpan={2}>Peso</th>
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
                                        <td>
                                          <span className="fw-bold">
                                            {result.entry.bodyweightKg ? `${result.entry.bodyweightKg} kg` : 'N/A'}
                                          </span>
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
                  <TeamRankingPublic resultado={resultadoSelecionado} />
                </div>
              )}


              {activeResultadoTab === 'estatisticas' && (
                <div className="mt-3">
                  {/* Estatísticas Gerais */}
                  <CompetitionStatsPublic resultado={resultadoSelecionado} />
                              </div>
              )}

              {activeResultadoTab === 'melhor-atleta' && (
                <div className="mt-3">
                  {/* Best Lifter - Melhores Atletas */}
                  <BestLifterStatsPublic resultado={resultadoSelecionado} />
                    </div>
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

// Componente para exibir Estatísticas da Competição na página pública
const CompetitionStatsPublic: React.FC<{ resultado: ResultadoImportado | null }> = ({ resultado }) => {
  if (!resultado?.results?.complete) {
    return (
      <Alert variant="info" className="text-center">
        <FaChartBar size={48} className="mb-3" />
        <h4>Nenhum resultado disponível</h4>
        <p>Não há dados suficientes para calcular estatísticas.</p>
      </Alert>
    );
  }

  // Calcular estatísticas gerais
  const totalAthletes = resultado.totalAthletes;
  const totalCategories = resultado.results.complete.length;
  
  // Contar atletas por sexo
  const maleAthletes = resultado.results.complete.reduce((sum: number, category: any) => 
    sum + category.results.filter((result: any) => result.entry.sex === 'M').length, 0
  );
  const femaleAthletes = resultado.results.complete.reduce((sum: number, category: any) => 
    sum + category.results.filter((result: any) => result.entry.sex === 'F').length, 0
  );

  // Contar atletas por equipamento
  const classicAthletes = resultado.results.complete.reduce((sum: number, category: any) => 
    sum + category.results.filter((result: any) => 
      result.entry.equipment === 'Raw' || result.entry.equipment === 'Classico' || result.entry.equipment === 'CLASSICA'
    ).length, 0
  );
  const equippedAthletes = resultado.results.complete.reduce((sum: number, category: any) => 
    sum + category.results.filter((result: any) => 
      result.entry.equipment === 'Equipped' || result.entry.equipment === 'Equipado' || result.entry.equipment === 'EQUIPADO'
    ).length, 0
  );

  // Calcular melhores totais por movimento
  const bestSquat = Math.max(...resultado.results.complete.flatMap((category: any) => 
    category.results.map((result: any) => Math.max(result.entry.squat1 || 0, result.entry.squat2 || 0, result.entry.squat3 || 0))
  ));
  const bestBench = Math.max(...resultado.results.complete.flatMap((category: any) => 
    category.results.map((result: any) => Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0))
  ));
  const bestDeadlift = Math.max(...resultado.results.complete.flatMap((category: any) => 
    category.results.map((result: any) => Math.max(result.entry.deadlift1 || 0, result.entry.deadlift2 || 0, result.entry.deadlift3 || 0))
  ));
  const bestTotal = Math.max(...resultado.results.complete.flatMap((category: any) => 
    category.results.map((result: any) => result.total || 0)
  ));

  // Calcular melhor IPF GL Points
  const bestIPFPoints = Math.max(...resultado.results.complete.flatMap((category: any) => 
    category.results.map((result: any) => result.points || 0)
  ));

  // Contar equipes únicas
  const uniqueTeams = new Set();
  resultado.results.complete.forEach((category: any) => {
    category.results.forEach((result: any) => {
      if (result.entry.team && result.entry.team.trim() !== '') {
        uniqueTeams.add(result.entry.team);
      }
    });
  });

  return (
    <div>
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
                <li><strong>Total de Atletas:</strong> {totalAthletes}</li>
                <li><strong>Categorias:</strong> {totalCategories}</li>
                <li><strong>Equipes:</strong> {uniqueTeams.size}</li>
                <li><strong>Data:</strong> {new Date(resultado.competitionDate).toLocaleDateString('pt-BR')}</li>
                <li><strong>Local:</strong> {resultado.competitionCity}</li>
                          </ul>
                        </Col>
                        <Col md={6}>
              <h6>Distribuição por Sexo</h6>
                            <ul>
                <li><strong>Masculino:</strong> {maleAthletes} atletas</li>
                <li><strong>Feminino:</strong> {femaleAthletes} atletas</li>
                            </ul>
              <h6>Distribuição por Equipamento</h6>
              <ul>
                <li><strong>Clássico:</strong> {classicAthletes} atletas</li>
                <li><strong>Equipado:</strong> {equippedAthletes} atletas</li>
              </ul>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

      {/* Melhores Tentativas */}
      <Card className="mb-4">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            <FaTrophy className="me-2" />
            Melhores Tentativas da Competição
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <h4 className="text-primary">{bestSquat}kg</h4>
                <p className="mb-0">Melhor Agachamento</p>
            </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <h4 className="text-success">{bestBench}kg</h4>
                <p className="mb-0">Melhor Supino</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded">
                <h4 className="text-info">{bestDeadlift}kg</h4>
                <p className="mb-0">Melhor Terra</p>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center p-3 border rounded bg-primary text-white">
                <h4>{bestTotal}kg</h4>
                <p className="mb-0">Melhor Total</p>
              </div>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6}>
              <div className="text-center p-3 border rounded bg-success text-white">
                <h4>{bestIPFPoints.toFixed(2)}</h4>
                <p className="mb-0">Melhor IPF GL Points</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="text-center p-3 border rounded bg-info text-white">
                <h4>{uniqueTeams.size}</h4>
                <p className="mb-0">Total de Equipes</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Distribuição por Categoria */}
      <Card className="mb-4">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">
            <FaUsers className="me-2" />
            Distribuição por Categoria
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {resultado.results.complete.map((category: any, index: number) => (
              <Col md={6} lg={4} key={index} className="mb-3">
                <Card className="h-100">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">{category.category}</h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-1"><strong>Atletas:</strong> {category.results.length}</p>
                    <p className="mb-1"><strong>Masculino:</strong> {category.results.filter((r: any) => r.entry.sex === 'M').length}</p>
                    <p className="mb-0"><strong>Feminino:</strong> {category.results.filter((r: any) => r.entry.sex === 'F').length}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
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
          <div>
            {/* Resumo das categorias válidas */}
            <Row className="mb-4">
              <Col>
                <Card className="bg-success text-white">
                  <Card.Body className="text-center">
                    <h6 className="mb-2">
                      <FaTrophy className="me-2" />
                      Categorias Válidas para Best Lifter
                    </h6>
                    <p className="mb-0">
                      {bestLifterCategories.length} categoria{bestLifterCategories.length !== 1 ? 's' : ''} com 3+ atletas
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {bestLifterCategories.map((category: BestLifterCategory, categoryIndex: number) => (
            <Row key={categoryIndex} className="mb-4">
              <Col>
                  <Card className="border-0 shadow-sm">
                  <Card.Header className={`text-white ${
                    category.sex === 'M' 
                      ? (category.equipment === 'Classico' ? 'bg-success' : 'bg-primary')
                      : (category.equipment === 'Classico' ? 'bg-warning' : 'bg-danger')
                  }`}>
                      <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <FaTrophy className="me-2" />
                      {category.sex === 'M' ? 'Masculino' : 'Feminino'} {' '}
                      {getEquipmentDisplayNameForBestLifter(category.equipment)} {' '}
                      {getAgeDivisionDisplayName(category.ageDivision)} {' '}
                      ({getEventTypeDisplayName(category.eventType)})
                    </h6>
                        <Badge bg="light" text="dark">
                          {category.results.length} atletas
                        </Badge>
                      </div>
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
                            <tr key={result.entry.id} className={result.position <= 3 ? 'table-warning' : ''}>
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
            ))}
          </div>
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
      </Card.Body>
    </Card>
  );
};

// Componente para exibir Ranking de Equipes na página pública
const TeamRankingPublic: React.FC<{ resultado: ResultadoImportado | null }> = ({ resultado }) => {
  if (!resultado?.results?.complete) {
    return (
      <Alert variant="info" className="text-center">
        <FaTrophy size={48} className="mb-3" />
        <h4>Nenhum resultado disponível</h4>
        <p>Não há dados suficientes para calcular o ranking de equipes.</p>
      </Alert>
    );
  }

  // Função para calcular pontos de equipe baseado na posição
  const getTeamPoints = (position: number): number => {
    if (position === 1) return 12;
    if (position === 2) return 9;
    if (position === 3) return 8;
    if (position === 4) return 7;
    if (position === 5) return 6;
    if (position === 6) return 5;
    if (position === 7) return 4;
    if (position === 8) return 3;
    if (position === 9) return 2;
    return 1; // 10º em diante
  };

  // Função para calcular ranking de equipes
  const calculateTeamRanking = (equipment: 'Raw' | 'Equipped' | 'Classico' | 'Equipado', competitionType?: string) => {
    const teamsMap = new Map<string, any>();
    
    // Processar cada categoria de resultados
    if (resultado.results?.complete) {
      resultado.results.complete.forEach((category: any) => {
        // Filtrar apenas atletas da categoria OPEN
        const openAthletes = category.results.filter((result: any) => 
          result.entry.division === 'OP' || result.entry.division === 'Open' || !result.entry.division
        );

        // Separar atletas classificados e desclassificados
        const qualifiedAthletes = openAthletes.filter((result: any) => !result.isDisqualified);
        const disqualifiedAthletes = openAthletes.filter((result: any) => result.isDisqualified);

        // Ordenar atletas classificados por total (descendente)
        qualifiedAthletes.sort((a: any, b: any) => b.total - a.total);
        
        // Ordenar atletas desclassificados por total (descendente)
        disqualifiedAthletes.sort((a: any, b: any) => b.total - a.total);
        
        // Reunir: classificados primeiro, depois desclassificados
        const sortedOpenAthletes = [...qualifiedAthletes, ...disqualifiedAthletes];

        // Atribuir posições e pontos
        sortedOpenAthletes.forEach((result: any, index: number) => {
          const teamName = result.entry.team || 'Sem Equipe';
          const position = result.isDisqualified ? 0 : index + 1;
          const teamPoints = result.isDisqualified ? 0 : getTeamPoints(position);

          if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, {
              name: teamName,
              athletes: [],
              totalPoints: 0,
              firstPlaces: 0,
              secondPlaces: 0,
              thirdPlaces: 0,
              totalIPFPoints: 0
            });
          }

          const team = teamsMap.get(teamName)!;
          team.athletes.push({
            name: result.entry.name,
            position,
            teamPoints,
            ipfPoints: result.points,
            weightClass: result.entry.weightClass || '0',
            sex: result.entry.sex || 'M',
            equipment: result.entry.equipment || 'Raw',
            movements: result.entry.movements || ''
          });
        });
      });
    }

    // Calcular totais das equipes
    teamsMap.forEach(team => {
      // Ordenar atletas por pontos de equipe (decrescente)
      team.athletes.sort((a: any, b: any) => b.teamPoints - a.teamPoints);
      
      // Pegar apenas os 5 melhores
      const top5 = team.athletes.slice(0, 5);
      
      team.totalPoints = top5.reduce((sum: any, athlete: any) => sum + athlete.teamPoints, 0);
      team.firstPlaces = top5.filter((a: any) => a.teamPoints === 12).length;
      team.secondPlaces = top5.filter((a: any) => a.teamPoints === 9).length;
      team.thirdPlaces = top5.filter((a: any) => a.teamPoints === 8).length;
      team.totalIPFPoints = top5.reduce((sum: any, athlete: any) => sum + athlete.ipfPoints, 0);
    });
    
    // Converter para array e ordenar
    const teamsArray = Array.from(teamsMap.values());
    
    // Ordenar por critérios de desempate
    teamsArray.sort((a, b) => {
      // 1. Total de pontos
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      // 2. Mais 1ºs lugares
      if (b.firstPlaces !== a.firstPlaces) {
        return b.firstPlaces - a.firstPlaces;
      }
      
      // 3. Mais 2ºs lugares
      if (b.secondPlaces !== a.secondPlaces) {
        return b.secondPlaces - a.secondPlaces;
      }
      
      // 4. Mais 3ºs lugares
      if (b.thirdPlaces !== a.thirdPlaces) {
        return b.thirdPlaces - a.thirdPlaces;
      }
      
      // 5. Maior somatório de pontos IPF
      return b.totalIPFPoints - a.totalIPFPoints;
    });

    return teamsArray;
  };

  // Obter tipos de competição únicos dos atletas
  const competitionTypes = new Set<string>();
  if (resultado.results?.complete) {
    resultado.results.complete.forEach((category: any) => {
      category.results.forEach((result: any) => {
        if (result.entry.movements) {
          const types = result.entry.movements.split(', ').filter((t: string) => t.trim());
          types.forEach((type: string) => competitionTypes.add(type));
        }
      });
    });
  }
  
  const competitionTypesArray = Array.from(competitionTypes).sort();

            return (
    <div>
      {/* Informações sobre o ranking */}
      <Card className="mb-4 bg-light">
        <Card.Body className="text-center">
          <h6 className="text-primary mb-2">
            <FaTrophy className="me-2" />
            Ranking das Equipes - Categoria OPEN
          </h6>
          <p className="text-muted mb-1">
            <strong>Pontuação:</strong> 1º=12, 2º=9, 3º=8, 4º=7, 5º=6, 6º=5, 7º=4, 8º=3, 9º=2, 10º+=1
          </p>
          <p className="text-muted mb-1">
            Contam apenas os 5 melhores atletas de cada equipe por modalidade e tipo de competição
          </p>
          <p className="text-warning mb-0">
            <strong>Regra:</strong> Ranking de equipes só é válido com 3 ou mais equipes por modalidade
          </p>
          {competitionTypesArray.length > 0 && (
            <p className="text-info mt-2 mb-0">
              <strong>Tipos de competição encontrados:</strong> {competitionTypesArray.join(', ')}
            </p>
          )}
        </Card.Body>
      </Card>

      {/* Rankings por tipo de competição */}
      {competitionTypesArray.map(competitionType => {
        const classicTeams = calculateTeamRanking('Classico', competitionType);
        const equippedTeams = calculateTeamRanking('Equipado', competitionType);
        
        return (
          <Row key={competitionType} className="mb-4">
                <Col>
              <Card className="border-info">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">
                    <FaTrophy className="me-2" />
                    Ranking Equipes - Tipo {competitionType}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {/* Equipes Clássicas */}
                    <Col md={6}>
                      <Card className="border-success">
                        <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">
                        <FaTrophy className="me-2" />
                            Clássico ({classicTeams.length} equipes)
                      </h6>
                    </Card.Header>
                    <Card.Body>
                          {classicTeams.length >= 3 ? (
                            <div className="table-responsive">
                              <Table striped hover size="sm">
                                <thead>
                                  <tr>
                                    <th>Pos</th>
                                    <th>Equipe</th>
                                    <th>Total</th>
                                    <th>1ºs</th>
                                    <th>2ºs</th>
                                    <th>3ºs</th>
                                    <th>IPF GL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classicTeams.map((team: any, index: number) => (
                                    <tr key={team.name}>
                                      <td>
                                        <Badge bg={index < 3 ? 'warning' : 'secondary'}>
                                          {index + 1}º
                                        </Badge>
                                      </td>
                                      <td>
                                        <strong>{team.name}</strong>
                                        <br />
                                        <small className="text-muted">
                                          {team.athletes.length} atletas
                                        </small>
                                      </td>
                                      <td>
                                        <strong className="text-primary">{team.totalPoints}</strong>
                                      </td>
                                      <td>
                                        <Badge bg="success">{team.firstPlaces}</Badge>
                                      </td>
                                      <td>
                                        <Badge bg="info">{team.secondPlaces}</Badge>
                                      </td>
                                      <td>
                                        <Badge bg="warning">{team.thirdPlaces}</Badge>
                                      </td>
                                      <td>
                                        <strong>{team.totalIPFPoints.toFixed(2)}</strong>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <Alert variant="warning" className="text-center">
                              <FaTrophy className="mb-2" />
                              <h6>Ranking Inválido</h6>
                              <p className="mb-0">
                                Mínimo de 3 equipes necessário para ranking válido.
                                <br />
                                Encontradas: {classicTeams.length} equipes
                              </p>
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Equipes Equipadas */}
                    <Col md={6}>
                      <Card className="border-primary">
                        <Card.Header className="bg-primary text-white">
                          <h6 className="mb-0">
                            <FaTrophy className="me-2" />
                            Equipado ({equippedTeams.length} equipes)
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          {equippedTeams.length >= 3 ? (
                            <div className="table-responsive">
                              <Table striped hover size="sm">
                                <thead>
                                  <tr>
                                    <th>Pos</th>
                                    <th>Equipe</th>
                                    <th>Total</th>
                                    <th>1ºs</th>
                                    <th>2ºs</th>
                                    <th>3ºs</th>
                                    <th>IPF GL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {equippedTeams.map((team: any, index: number) => (
                                    <tr key={team.name}>
                                      <td>
                                        <Badge bg={index < 3 ? 'warning' : 'secondary'}>
                                          {index + 1}º
                                        </Badge>
                                      </td>
                                      <td>
                                        <strong>{team.name}</strong>
                                        <br />
                                        <small className="text-muted">
                                          {team.athletes.length} atletas
                                        </small>
                                      </td>
                                      <td>
                                        <strong className="text-primary">{team.totalPoints}</strong>
                                      </td>
                                      <td>
                                        <Badge bg="success">{team.firstPlaces}</Badge>
                                      </td>
                                      <td>
                                        <Badge bg="info">{team.secondPlaces}</Badge>
                                      </td>
                                      <td>
                                        <Badge bg="warning">{team.thirdPlaces}</Badge>
                                      </td>
                                      <td>
                                        <strong>{team.totalIPFPoints.toFixed(2)}</strong>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <Alert variant="warning" className="text-center">
                              <FaTrophy className="mb-2" />
                              <h6>Ranking Inválido</h6>
                              <p className="mb-0">
                                Mínimo de 3 equipes necessário para ranking válido.
                                <br />
                                Encontradas: {equippedTeams.length} equipes
                              </p>
                            </Alert>
                          )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
      </Card.Body>
    </Card>
            </Col>
          </Row>
        );
      })}

      {competitionTypesArray.length === 0 && (
        <Alert variant="info" className="text-center">
          <FaTrophy size={48} className="mb-3" />
          <h4>Nenhum tipo de competição encontrado</h4>
          <p>Não há dados suficientes para calcular rankings de equipes.</p>
        </Alert>
      )}
    </div>
  );
};

export default PublicPage;
