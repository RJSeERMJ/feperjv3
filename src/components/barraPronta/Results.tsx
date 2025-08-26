import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Badge, 
  Alert,
  ButtonGroup,
  Nav,
  Navbar,
  NavDropdown
} from 'react-bootstrap';
import { 
  FaTrophy, 
  FaMedal, 
  FaDownload, 
  FaSortUp,
  FaSortDown,
  FaFileCsv,
  FaFilePdf,
  FaTable
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RootState } from '../../store/barraProntaStore';
import { Entry } from '../../types/barraProntaTypes';
import { calculateIPFGLPointsTotal } from '../../logic/ipfGLPoints';
import './Results.css';

interface CalculatedResult {
  entry: Entry;
  squat: number;
  bench: number;
  deadlift: number;
  total: number;
  points: number;
  validAttempts: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  bestAttempts: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  // Adicionado para a nova tabela
  squatAttempts: (number | null)[];
  benchAttempts: (number | null)[];
  deadliftAttempts: (number | null)[];
  squatStatus: number[];
  benchStatus: number[];
  deadliftStatus: number[];
  positions: {
    squat: number;
    bench: number;
    deadlift: number;
    total: number;
  };
}

interface ResultsByCategory {
  category: string;
  results: CalculatedResult[];
}

// Função para obter nome de exibição do equipamento (definida fora do componente)
const getEquipmentDisplayName = (equipment: string): string => {
  switch (equipment) {
    case 'Raw':
    case 'CLASSICA':
      return 'Clássica';
    case 'Equipped':
    case 'EQUIPADO':
      return 'Equipado';
    default:
      return equipment || 'Clássica';
  }
};

// Função para obter categoria de idade (definida fora do componente)
const getAgeCategory = (birthDate: string, sex: string): string => {
  if (!birthDate) return 'OP';
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (sex === 'M') {
    if (age < 18) return 'SJ';
    if (age < 23) return 'JR';
    if (age < 40) return 'OP';
    if (age < 50) return 'M1';
    if (age < 60) return 'M2';
    if (age < 70) return 'M3';
    if (age < 80) return 'M4';
    return 'M4';
  } else { // Feminino
    if (age < 18) return 'SJ';
    if (age < 23) return 'JR';
    if (age < 40) return 'OP';
    if (age < 50) return 'M1';
    if (age < 60) return 'M2';
    if (age < 70) return 'M3';
    if (age < 80) return 'M4';
    return 'M4';
  }
};

const Results: React.FC = () => {
  const { meet, registration } = useSelector((state: RootState) => state);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = todos os dias
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSex, setSelectedSex] = useState<'M' | 'F' | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'total' | 'points' | 'squat' | 'bench' | 'deadlift'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'complete' | 'simplified' | 'detailed'>('complete');

  // Função para verificar se deve aplicar overflow automático
  const shouldAutoOverflow = () => {
    // Verificar se há apenas 1 dia configurado
    const singleDay = meet.lengthDays === 1;
    
    // Verificar se há apenas 1 plataforma em todos os dias
    const singlePlatform = meet.platformsOnDays && meet.platformsOnDays.length > 0 && 
                          meet.platformsOnDays.every(platforms => platforms === 1);
    
    return { singleDay, singlePlatform };
  };

  // Calcular resultados para cada atleta
  const calculatedResults = useMemo((): CalculatedResult[] => {
    return registration.entries
      .filter(entry => {
        // Filtrar por dia se selecionado
        if (selectedDay > 0 && entry.day !== selectedDay) return false;
        // Filtrar por divisão se selecionado
        if (selectedDivision !== 'all' && entry.division !== selectedDivision) return false;
        // Filtrar por sexo se selecionado
        if (selectedSex !== 'all' && entry.sex !== selectedSex) return false;
        // Filtrar por equipamento/modalidade se selecionado
        if (selectedEquipment !== 'all' && entry.equipment !== selectedEquipment) return false;
        return true;
      })
      .map(entry => {
        // Calcular melhores tentativas para cada movimento
        const squatAttempts = [entry.squat1, entry.squat2, entry.squat3];
        const benchAttempts = [entry.bench1, entry.bench2, entry.bench3];
        const deadliftAttempts = [entry.deadlift1, entry.deadlift2, entry.deadlift3];

        // Obter status das tentativas
        const squatStatus = entry.squatStatus || [0, 0, 0];
        const benchStatus = entry.benchStatus || [0, 0, 0];
        const deadliftStatus = entry.deadliftStatus || [0, 0, 0];

        // Calcular melhores tentativas válidas
        const getBestValidAttempt = (attempts: (number | null)[], status: number[]): number => {
          let best = 0;
          attempts.forEach((attempt, index) => {
            if (attempt && status[index] === 1) { // 1 = Good Lift
              best = Math.max(best, Math.abs(attempt));
            }
          });
          return best;
        };

        const bestSquat = getBestValidAttempt(squatAttempts, squatStatus);
        const bestBench = getBestValidAttempt(benchAttempts, benchStatus);
        const bestDeadlift = getBestValidAttempt(deadliftAttempts, deadliftStatus);

        // Calcular total
        const total = bestSquat + bestBench + bestDeadlift;

        // Calcular pontos IPF GL
        const points = calculateIPFGLPointsTotal(
          bestSquat,
          bestBench,
          bestDeadlift,
          entry.bodyweightKg || 0,
          entry.sex,
          entry.equipment === 'Raw' ? 'Sleeves' : 'Single-ply'
        );

        // Contar tentativas válidas
        const validSquat = squatStatus.filter(s => s === 1).length;
        const validBench = benchStatus.filter(s => s === 1).length;
        const validDeadlift = deadliftStatus.filter(s => s === 1).length;

        return {
          entry,
          squat: bestSquat,
          bench: bestBench,
          deadlift: bestDeadlift,
          total,
          points,
          validAttempts: {
            squat: validSquat,
            bench: validBench,
            deadlift: validDeadlift
          },
          bestAttempts: {
            squat: bestSquat,
            bench: bestBench,
            deadlift: bestDeadlift
          },
          // Adicionado para a nova tabela
          squatAttempts: squatAttempts,
          benchAttempts: benchAttempts,
          deadliftAttempts: deadliftAttempts,
          squatStatus: squatStatus,
          benchStatus: benchStatus,
          deadliftStatus: deadliftStatus,
          positions: {
            squat: 0, // Será preenchido pelo backend
            bench: 0, // Será preenchido pelo backend
            deadlift: 0, // Será preenchido pelo backend
            total: 0 // Será preenchido pelo backend
          }
        };
      })
      .filter(result => result.total > 0) // Apenas atletas com total válido
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
  }, [registration.entries, selectedDay, selectedDivision, selectedSex, selectedEquipment, sortBy, sortOrder]);

  // Agrupar resultados por categoria
  const resultsByCategory = useMemo((): ResultsByCategory[] => {
    const grouped: { [key: string]: CalculatedResult[] } = {};

    calculatedResults.forEach(result => {
      const equipmentName = getEquipmentDisplayName(result.entry.equipment || 'Raw');
      const category = `${result.entry.division} - ${result.entry.weightClass} - ${equipmentName}`;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    });

    // Calcular posições dentro de cada categoria
    Object.values(grouped).forEach(categoryResults => {
      // Ordenar por total para calcular posições
      categoryResults.sort((a, b) => b.total - a.total);
      
      // Calcular posições por movimento
      const squatResults = [...categoryResults].sort((a, b) => b.squat - a.squat);
      const benchResults = [...categoryResults].sort((a, b) => b.bench - a.bench);
      const deadliftResults = [...categoryResults].sort((a, b) => b.deadlift - a.deadlift);
      
      categoryResults.forEach(result => {
        result.positions.squat = squatResults.findIndex(r => r.entry.id === result.entry.id) + 1;
        result.positions.bench = benchResults.findIndex(r => r.entry.id === result.entry.id) + 1;
        result.positions.deadlift = deadliftResults.findIndex(r => r.entry.id === result.entry.id) + 1;
        result.positions.total = categoryResults.findIndex(r => r.entry.id === result.entry.id) + 1;
      });
    });

    return Object.entries(grouped).map(([category, results]) => ({
      category,
      results: results.sort((a, b) => b.total - a.total)
    }));
  }, [calculatedResults]);



  // Função para exportar resultados como CSV
  const exportToCSV = () => {
    let csvContent = '';
    
    // Cabeçalho do arquivo
    csvContent += `"${meet.name || 'Resultados da Competição'}"\n`;
    csvContent += `"${meet.city} - ${meet.date}"\n\n`;
    
    // Exportar cada categoria separadamente
    resultsByCategory.forEach((category, categoryIndex) => {
      csvContent += `"${category.category}"\n`;
      
      // Cabeçalhos da tabela detalhada (mesma estrutura da visualização)
      const headers = [
        'POS',
        'Atleta',
        'UF',
        'Equipe',
        'Nascimento',
        'Peso',
        'A1',
        'A2',
        'A3',
        'Melhor',
        'Pos',
        'S1',
        'S2',
        'S3',
        'Melhor',
        'Pos',
        'T1',
        'T2',
        'T3',
        'Melhor',
        'Pos',
        'Total',
        'Indice GL'
      ];
      
      csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
      
      // Dados dos atletas
      category.results.forEach((result, index) => {
        const ageCategory = getAgeCategory(result.entry.birthDate || '', result.entry.sex);
        const isClassic = result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA';
        
        const row = [
          index + 1, // POS
          result.entry.name,
          result.entry.state || '-',
          result.entry.team || '-',
          result.entry.birthDate ? new Date(result.entry.birthDate).toLocaleDateString('pt-BR') : '-',
          result.entry.bodyweightKg || '-',
          result.squatAttempts[0] || '-',
          result.squatAttempts[1] || '-',
          result.squatAttempts[2] || '-',
          result.squat,
          result.positions.squat,
          result.benchAttempts[0] || '-',
          result.benchAttempts[1] || '-',
          result.benchAttempts[2] || '-',
          result.bench,
          result.positions.bench,
          result.deadliftAttempts[0] || '-',
          result.deadliftAttempts[1] || '-',
          result.deadliftAttempts[2] || '-',
          result.deadlift,
          result.positions.deadlift,
          result.total,
          result.points.toFixed(2)
        ];
        
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });
      
      // Espaço entre categorias
      csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const fileName = `${meet.name || 'Resultados'}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  };

  // Função para exportar resultados como PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape'); // Mudança para orientação paisagem
    
    // Título do documento
    doc.setFontSize(16);
    doc.text(meet.name || 'Resultados da Competição', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`${meet.city} - ${meet.date}`, 14, 30);
    
    let yPosition = 40;
    
    // Exportar cada categoria separadamente
    resultsByCategory.forEach((category, categoryIndex) => {
      // Título da categoria
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(category.category, 14, yPosition);
      
      yPosition += 12;
      
      // Cabeçalhos da tabela detalhada (mesma estrutura da visualização)
      const headers1 = [
        'POS',
        'Atleta',
        'UF',
        'Equipe',
        'Nasc.',
        'Peso',
        'A1',
        'A2',
        'A3',
        'Melhor',
        'Pos',
        'S1',
        'S2',
        'S3',
        'Melhor',
        'Pos',
        'T1',
        'T2',
        'T3',
        'Melhor',
        'Pos',
        'Total',
        'Indice GL'
      ];
      
      // Dados dos atletas
      const tableData = category.results.map((result, index) => {
        const ageCategory = getAgeCategory(result.entry.birthDate || '', result.entry.sex);
        const isClassic = result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA';
        
        return [
          index + 1, // POS
          result.entry.name,
          result.entry.state || '-',
          result.entry.team || '-',
          result.entry.birthDate ? new Date(result.entry.birthDate).toLocaleDateString('pt-BR') : '-',
          result.entry.bodyweightKg || '-',
          result.squatAttempts[0] || '-',
          result.squatAttempts[1] || '-',
          result.squatAttempts[2] || '-',
          result.squat,
          result.positions.squat,
          result.benchAttempts[0] || '-',
          result.benchAttempts[1] || '-',
          result.benchAttempts[2] || '-',
          result.bench,
          result.positions.bench,
          result.deadliftAttempts[0] || '-',
          result.deadliftAttempts[1] || '-',
          result.deadliftAttempts[2] || '-',
          result.deadlift,
          result.positions.deadlift,
          result.total,
          result.points.toFixed(2)
        ];
      });
      
      autoTable(doc, {
        head: [headers1],
        body: tableData,
        startY: yPosition,
        margin: { top: 10 },
        styles: {
          fontSize: 6,
          cellPadding: 1
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      
      // Atualizar posição Y para próxima categoria
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Adicionar nova página se necessário
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    doc.save(`${meet.name || 'Resultados'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Função para obter ícone de medalha
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <FaMedal className="text-warning" />;
      case 2: return <FaMedal className="text-secondary" />;
      case 3: return <FaMedal className="text-danger" />;
      default: return null;
    }
  };

  // Componente para a aba de melhores atletas
  const SimplifiedResults = () => {
    // Agrupar por sexo e modalidade, ordenando por pontos IPF GL
    const maleClassicResults = calculatedResults
      .filter(result => result.entry.sex === 'M' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
      .sort((a, b) => b.points - a.points);
    
    const maleEquippedResults = calculatedResults
      .filter(result => result.entry.sex === 'M' && result.entry.equipment === 'Equipped')
      .sort((a, b) => b.points - a.points);
    
    const femaleClassicResults = calculatedResults
      .filter(result => result.entry.sex === 'F' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
      .sort((a, b) => b.points - a.points);
    
    const femaleEquippedResults = calculatedResults
      .filter(result => result.entry.sex === 'F' && result.entry.equipment === 'Equipped')
      .sort((a, b) => b.points - a.points);

    return (
      <div>
        {/* Resumo geral da competição */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-light">
              <Card.Body className="text-center">
                <h4 className="text-primary mb-3">
                  <FaTrophy className="me-2" />
                  Melhores Atletas da Competição
                </h4>
                <Row>
                  <Col md={3}>
                    <div className="border-end">
                      <h5 className="text-success">{calculatedResults.length}</h5>
                      <small className="text-muted">Total de Atletas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h5 className="text-info">{maleClassicResults.length + maleEquippedResults.length}</h5>
                      <small className="text-muted">Masculino</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h5 className="text-warning">{femaleClassicResults.length + femaleEquippedResults.length}</h5>
                      <small className="text-muted">Feminino</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h5 className="text-warning">
                        {calculatedResults.reduce((max, result) => Math.max(max, result.total), 0)}
                      </h5>
                      <small className="text-muted">Maior Total</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div>
                      <h5 className="text-danger">
                        {calculatedResults.reduce((max, result) => Math.max(max, result.points), 0).toFixed(2)}
                      </h5>
                      <small className="text-muted">Maior Pontuação IPF GL</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Masculino Clássico */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Masculino Clássico ({maleClassicResults.length} atletas)
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Pos</th>
                      <th>Atleta</th>
                      <th>Equipe</th>
                      <th>Peso</th>
                      <th>Agachamento</th>
                      <th>Supino</th>
                      <th>Terra</th>
                      <th>Total</th>
                      <th>Pontos IPF GL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maleClassicResults.map((result, index) => (
                      <tr key={result.entry.id}>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            {getMedalIcon(index + 1)}
                            <span className="ms-1 fw-bold">{index + 1}º</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{result.entry.name}</strong>
                          </div>
                        </td>
                        <td>{result.entry.team}</td>
                        <td>{result.entry.bodyweightKg || '-'}kg</td>
                        <td>
                          <span className="fw-bold">{result.squat}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.bench}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.deadlift}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold text-primary fs-5">
                            {result.total}kg
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
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

        {/* Masculino Equipado */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Masculino Equipado ({maleEquippedResults.length} atletas)
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Pos</th>
                      <th>Atleta</th>
                      <th>Equipe</th>
                      <th>Peso</th>
                      <th>Agachamento</th>
                      <th>Supino</th>
                      <th>Terra</th>
                      <th>Total</th>
                      <th>Pontos IPF GL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maleEquippedResults.map((result, index) => (
                      <tr key={result.entry.id}>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            {getMedalIcon(index + 1)}
                            <span className="ms-1 fw-bold">{index + 1}º</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{result.entry.name}</strong>
                          </div>
                        </td>
                        <td>{result.entry.team}</td>
                        <td>{result.entry.bodyweightKg || '-'}kg</td>
                        <td>
                          <span className="fw-bold">{result.squat}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.bench}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.deadlift}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold text-primary fs-5">
                            {result.total}kg
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
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

        {/* Feminino Clássico */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Feminino Clássico ({femaleClassicResults.length} atletas)
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Pos</th>
                      <th>Atleta</th>
                      <th>Equipe</th>
                      <th>Peso</th>
                      <th>Agachamento</th>
                      <th>Supino</th>
                      <th>Terra</th>
                      <th>Total</th>
                      <th>Pontos IPF GL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {femaleClassicResults.map((result, index) => (
                      <tr key={result.entry.id}>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            {getMedalIcon(index + 1)}
                            <span className="ms-1 fw-bold">{index + 1}º</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{result.entry.name}</strong>
                          </div>
                        </td>
                        <td>{result.entry.team}</td>
                        <td>{result.entry.bodyweightKg || '-'}kg</td>
                        <td>
                          <span className="fw-bold">{result.squat}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.bench}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.deadlift}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold text-primary fs-5">
                            {result.total}kg
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
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

        {/* Feminino Equipado */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-danger text-white">
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Feminino Equipado ({femaleEquippedResults.length} atletas)
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Pos</th>
                      <th>Atleta</th>
                      <th>Equipe</th>
                      <th>Peso</th>
                      <th>Agachamento</th>
                      <th>Supino</th>
                      <th>Terra</th>
                      <th>Total</th>
                      <th>Pontos IPF GL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {femaleEquippedResults.map((result, index) => (
                      <tr key={result.entry.id}>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center">
                            {getMedalIcon(index + 1)}
                            <span className="ms-1 fw-bold">{index + 1}º</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{result.entry.name}</strong>
                          </div>
                        </td>
                        <td>{result.entry.team}</td>
                        <td>{result.entry.bodyweightKg || '-'}kg</td>
                        <td>
                          <span className="fw-bold">{result.squat}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.bench}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold">{result.deadlift}kg</span>
                        </td>
                        <td>
                          <span className="fw-bold text-primary fs-5">
                            {result.total}kg
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
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

        {/* Melhores marcas por movimento */}
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Melhores Marcas por Movimento
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-primary">Agachamento</h6>
                      <h4 className="text-primary">
                        {calculatedResults.reduce((max, result) => Math.max(max, result.squat), 0)}kg
                      </h4>
                      <small className="text-muted">
                        {calculatedResults.find(result => 
                          result.squat === calculatedResults.reduce((max, r) => Math.max(max, r.squat), 0)
                        )?.entry.name}
                      </small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-success">Supino</h6>
                      <h4 className="text-success">
                        {calculatedResults.reduce((max, result) => Math.max(max, result.bench), 0)}kg
                      </h4>
                      <small className="text-muted">
                        {calculatedResults.find(result => 
                          result.bench === calculatedResults.reduce((max, r) => Math.max(max, r.bench), 0)
                        )?.entry.name}
                      </small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-warning">Terra</h6>
                      <h4 className="text-warning">
                        {calculatedResults.reduce((max, result) => Math.max(max, result.deadlift), 0)}kg
                      </h4>
                      <small className="text-muted">
                        {calculatedResults.find(result => 
                          result.deadlift === calculatedResults.reduce((max, r) => Math.max(max, r.deadlift), 0)
                        )?.entry.name}
                      </small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Componente para exibir tentativa individual
const AttemptDisplay: React.FC<{ 
  attempt: number | null; 
  status: number; 
  isBest: boolean;
  className?: string;
}> = ({ attempt, status, isBest, className = '' }) => {
  if (!attempt) return <td className={`text-center ${className}`}>-</td>;
  
  const isGoodLift = status === 1;
  const isNoLift = status === 2;
  
  return (
    <td className={`text-center ${className} ${isBest ? 'fw-bold text-success' : ''} ${isNoLift ? 'text-danger' : ''}`}>
      {attempt}
    </td>
  );
};

    // Componente para tabela de resultados completos
  const DetailedResultsTable: React.FC<{ results: CalculatedResult[] }> = ({ results }) => {
    return (
      <div className="overflow-auto">
        <table className="complete-results-table">
          <thead>
            <tr>
              <th colSpan={6}>
                Até {results[0]?.entry.weightClass} kg - {getAgeCategory(results[0]?.entry.birthDate || '', results[0]?.entry.sex)} - {getEquipmentDisplayName(results[0]?.entry.equipment || 'Raw')}
              </th>
              <th colSpan={5}>Agachamento</th>
              <th colSpan={5}>Supino</th>
              <th colSpan={5}>Levantamento Terra</th>
              <th colSpan={2}>Resultado</th>
            </tr>
            <tr>
              <th>POS</th>
              <th>Atleta</th>
              <th>UF</th>
              <th>Equipe</th>
              <th>Nascimento</th>
              <th>Peso</th>
              <th>A1</th>
              <th>A2</th>
              <th>A3</th>
              <th>Melhor</th>
              <th>Pos</th>
              <th>S1</th>
              <th>S2</th>
              <th>S3</th>
              <th>Melhor</th>
              <th>Pos</th>
              <th>T1</th>
              <th>T2</th>
              <th>T3</th>
              <th>Melhor</th>
              <th>Pos</th>
              <th>Total</th>
              <th>Indice GL</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
                <tr key={result.entry.id}>
                  {/* Posição */}
                  <td className="text-center">
                    <div className="d-flex align-items-center justify-content-center">
                      {getMedalIcon(index + 1)}
                      <span className="ms-1 fw-bold">{index + 1}</span>
                    </div>
                  </td>
                  
                  {/* Dados do atleta */}
                  <td className="athlete">{result.entry.name}</td>
                  <td className="text-center">{result.entry.state || '-'}</td>
                  <td className="team">{result.entry.team || '-'}</td>
                  <td className="text-center">{result.entry.birthDate ? new Date(result.entry.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="text-center">{result.entry.bodyweightKg || '-'}</td>
                  
                  {/* Agachamento */}
                  <td>
                    <span className={`attempt ${result.squatAttempts[0] && result.squatStatus[0] === 1 ? 'valid' : result.squatAttempts[0] && result.squatStatus[0] === 2 ? 'invalid' : 'empty'}`}>
                      {result.squatAttempts[0] || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`attempt ${result.squatAttempts[1] && result.squatStatus[1] === 1 ? 'valid' : result.squatAttempts[1] && result.squatStatus[1] === 2 ? 'invalid' : 'empty'}`}>
                      {result.squatAttempts[1] || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`attempt ${result.squatAttempts[2] && result.squatStatus[2] === 1 ? 'valid' : result.squatAttempts[2] && result.squatStatus[2] === 2 ? 'invalid' : 'empty'}`}>
                      {result.squatAttempts[2] || '-'}
                    </span>
                  </td>
                  <td className="fw-bold text-success">{result.squat}</td>
                  <td>{result.positions.squat}</td>
                  
                  {/* Supino */}
                  <td>
                    <span className={`attempt ${result.benchAttempts[0] && result.benchStatus[0] === 1 ? 'valid' : result.benchAttempts[0] && result.benchStatus[0] === 2 ? 'invalid' : 'empty'}`}>
                      {result.benchAttempts[0] || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`attempt ${result.benchAttempts[1] && result.benchStatus[1] === 1 ? 'valid' : result.benchAttempts[1] && result.benchStatus[1] === 2 ? 'invalid' : 'empty'}`}>
                      {result.benchAttempts[1] || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`attempt ${result.benchAttempts[2] && result.benchStatus[2] === 1 ? 'valid' : result.benchAttempts[2] && result.benchStatus[2] === 2 ? 'invalid' : 'empty'}`}>
                      {result.benchAttempts[2] || '-'}
                    </span>
                  </td>
                  <td className="fw-bold text-success">{result.bench}</td>
                  <td>{result.positions.bench}</td>
                  
                  {/* Levantamento Terra */}
                  <td>
                    <span className={`attempt ${result.deadliftAttempts[0] && result.deadliftStatus[0] === 1 ? 'valid' : result.deadliftAttempts[0] && result.deadliftStatus[0] === 2 ? 'invalid' : 'empty'}`}>
                      {result.deadliftAttempts[0] || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`attempt ${result.deadliftAttempts[1] && result.deadliftStatus[1] === 1 ? 'valid' : result.deadliftAttempts[1] && result.deadliftStatus[1] === 2 ? 'invalid' : 'empty'}`}>
                      {result.deadliftAttempts[1] || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`attempt ${result.deadliftAttempts[2] && result.deadliftStatus[2] === 1 ? 'valid' : result.deadliftAttempts[2] && result.deadliftStatus[2] === 2 ? 'invalid' : 'empty'}`}>
                      {result.deadliftAttempts[2] || '-'}
                    </span>
                  </td>
                  <td className="fw-bold text-success">{result.deadlift}</td>
                  <td>{result.positions.deadlift}</td>
                  
                  {/* Total */}
                  <td className="total">{result.total}</td>
                  <td className="indice">{result.points.toFixed(2)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
        );
  };


    return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-0">
                <FaTrophy className="me-2 text-warning" />
                Resultados da Competição
              </h2>
              <p className="text-muted mb-0">
                {meet.name} - {meet.city} - {meet.date}
              </p>
              {(shouldAutoOverflow().singleDay || shouldAutoOverflow().singlePlatform) && (
                <small className="text-info">
                  <strong>Configuração:</strong> {meet.lengthDays} dia(s), {meet.platformsOnDays.join(', ')} plataforma(s) por dia
                </small>
              )}
            </div>
            <ButtonGroup>
              <Button variant="outline-primary" onClick={exportToCSV}>
                <FaFileCsv className="me-2" />
                Exportar CSV
              </Button>
              <Button variant="outline-primary" onClick={exportToPDF}>
                <FaFilePdf className="me-2" />
                Exportar PDF
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      {/* Sistema de Abas */}
      <Row className="mb-4">
        <Col>
          <Nav variant="tabs" className="border-bottom">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'complete'}
                onClick={() => setActiveTab('complete')}
                className="fw-bold"
              >
                <FaTrophy className="me-2" />
                Resultados Completos
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'detailed'}
                onClick={() => setActiveTab('detailed')}
                className="fw-bold"
              >
                <FaTable className="me-2" />
                Resultados Detalhados
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                          <Nav.Link 
              active={activeTab === 'simplified'}
              onClick={() => setActiveTab('simplified')}
              className="fw-bold"
            >
              <FaMedal className="me-2" />
              Melhores Atletas
            </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>



      {/* Conteúdo das Abas */}
      {activeTab === 'complete' && (
        <>
          {/* Filtros */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Filtros e Ordenação</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Dia</Form.Label>
                        <Form.Select 
                          value={selectedDay} 
                          onChange={(e) => setSelectedDay(Number(e.target.value))}
                          disabled={shouldAutoOverflow().singleDay}
                        >
                          <option value={0}>Todos os dias</option>
                          {Array.from({ length: meet.lengthDays }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                          ))}
                        </Form.Select>
                        {shouldAutoOverflow().singleDay && (
                          <Form.Text className="text-muted">
                            Auto: Apenas 1 dia configurado
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Divisão</Form.Label>
                        <Form.Select 
                          value={selectedDivision} 
                          onChange={(e) => setSelectedDivision(e.target.value)}
                        >
                          <option value="all">Todas as divisões</option>
                          {meet.divisions.map(div => (
                            <option key={div} value={div}>{div}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Sexo</Form.Label>
                        <Form.Select 
                          value={selectedSex} 
                          onChange={(e) => setSelectedSex(e.target.value as 'M' | 'F' | 'all')}
                        >
                          <option value="all">Todos</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Modalidade</Form.Label>
                        <Form.Select 
                          value={selectedEquipment} 
                          onChange={(e) => setSelectedEquipment(e.target.value)}
                        >
                          <option value="all">Todas</option>
                          <option value="Raw">Clássica</option>
                          <option value="Equipped">Equipado</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Ordenar por</Form.Label>
                        <Form.Select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value as any)}
                        >
                          <option value="total">Total</option>
                          <option value="points">Pontos IPF GL</option>
                          <option value="squat">Agachamento</option>
                          <option value="bench">Supino</option>
                          <option value="deadlift">Terra</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col>
                      <ButtonGroup>
                        <Button 
                          variant={sortOrder === 'desc' ? 'primary' : 'outline-primary'}
                          onClick={() => setSortOrder('desc')}
                        >
                          <FaSortDown className="me-1" />
                          Decrescente
                        </Button>
                        <Button 
                          variant={sortOrder === 'asc' ? 'primary' : 'outline-primary'}
                          onClick={() => setSortOrder('asc')}
                        >
                          <FaSortUp className="me-1" />
                          Crescente
                        </Button>
                      </ButtonGroup>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Renderizar conteúdo baseado na aba ativa */}
      {activeTab === 'complete' && (
        <>
          {/* Resultados por Categoria */}
          {resultsByCategory.map((category, categoryIndex) => (
            <Row key={categoryIndex} className="mb-4">
              <Col>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <FaTrophy className="me-2 text-warning" />
                      {category.category}
                      <Badge bg="info" className="ms-2">
                        {category.results.length} atletas
                      </Badge>
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive striped hover className="mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Pos</th>
                          <th>Atleta</th>
                          <th>Equipe</th>
                          <th>Peso</th>
                          <th>Modalidade</th>
                          <th>Agachamento</th>
                          <th>Supino</th>
                          <th>Terra</th>
                          <th>Total</th>
                          <th>Pontos IPF GL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.results.map((result, index) => (
                          <tr key={result.entry.id}>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                {getMedalIcon(index + 1)}
                                <span className="ms-1 fw-bold">{index + 1}º</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{result.entry.name}</strong>
                              </div>
                            </td>
                            <td>{result.entry.team}</td>
                            <td>{result.entry.bodyweightKg || '-'}kg</td>
                            <td>
                              <Badge bg={result.entry.equipment === 'Equipped' ? 'primary' : 'success'}>
                                {getEquipmentDisplayName(result.entry.equipment || 'Raw')}
                              </Badge>
                            </td>
                            <td>
                              <span className="fw-bold">{result.squat}kg</span>
                            </td>
                            <td>
                              <span className="fw-bold">{result.bench}kg</span>
                            </td>
                            <td>
                              <span className="fw-bold">{result.deadlift}kg</span>
                            </td>
                            <td>
                              <span className="fw-bold text-primary fs-5">
                                {result.total}kg
                              </span>
                            </td>
                            <td>
                              <span className="fw-bold text-success">
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
        </>
      )}

      {activeTab === 'detailed' && (
        <>
          {/* Resultados Detalhados */}
          {resultsByCategory.map((category, categoryIndex) => (
            <Row key={categoryIndex} className="mb-4">
              <Col>
                <Card>
                  <Card.Body className="p-0">
                    <DetailedResultsTable results={category.results} />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ))}
        </>
      )}

      {activeTab === 'simplified' && (
        <SimplifiedResults />
      )}

      {/* Mensagem quando não há resultados */}
      {calculatedResults.length === 0 && (
        <Row>
          <Col>
            <Alert variant="info" className="text-center">
              <FaTrophy size={48} className="mb-3" />
              <h4>Nenhum resultado encontrado</h4>
              <p>
                Não há resultados para os filtros selecionados. 
                Verifique se os atletas completaram suas tentativas.
              </p>
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Results;
