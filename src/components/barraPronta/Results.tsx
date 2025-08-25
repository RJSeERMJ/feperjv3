import React, { useState, useMemo } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Card, 
  Table,
  Badge,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  OverlayTrigger
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { GlobalState, Entry, Formula, LiftStatus } from '../../types/barraProntaTypes';
import { calculateIPFGLPointsTotal, calculateIPFGLPointsBench } from '../../logic/ipfGLPoints';
import { FaTrophy, FaMedal, FaChartBar, FaDownload, FaFilter, FaInfoCircle } from 'react-icons/fa';

// Componente para ranking por índice (IPF GL Points)
const IndexRanking: React.FC<{ sex: 'M' | 'F' }> = ({ sex }) => {
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);

  // Função para calcular total baseado nos movimentos selecionados
  const getTotal = (entry: Entry): number => {
    const movements = entry.movements || '';
    let total = 0;
    let hasValidLifts = false;

    // Se não há movimentos definidos, não calcular total
    if (!movements || movements.trim() === '') {
      return 0;
    }

    // Verificar se inclui Agachamento (A)
    if (movements.includes('A')) {
      const squat = entry.squat1 || 0;
      if (squat > 0) {
        total += squat;
        hasValidLifts = true;
      }
    }

    // Verificar se inclui Supino (S)
    if (movements.includes('S')) {
      const bench = entry.bench1 || 0;
      if (bench > 0) {
        total += bench;
        hasValidLifts = true;
      }
    }

    // Verificar se inclui Terra (T)
    if (movements.includes('T')) {
      const deadlift = entry.deadlift1 || 0;
      if (deadlift > 0) {
        total += deadlift;
        hasValidLifts = true;
      }
    }

    return hasValidLifts ? total : 0;
  };

  // Função para calcular pontuação IPF GL Points
  const calculateIPFGLPoints = (entry: Entry): number => {
    const total = getTotal(entry);
    const bodyweight = entry.bodyweightKg || 0;
    
    if (total <= 0 || bodyweight <= 0) return 0;
    
    // Normalizar equipamento para IPF GL Points
    let equipment: 'Sleeves' | 'Single-ply' = 'Sleeves';
    if (entry.equipment === 'Single-ply' || entry.equipment === 'Multi-ply' || entry.equipment === 'Unlimited') {
      equipment = 'Single-ply';
    }
    
    // Determinar o evento baseado nos movimentos selecionados
    const movements = entry.movements || '';
    let event: 'SBD' | 'B' = 'SBD';
    
    // Se apenas supino, usar evento B
    if (movements === 'S') {
      event = 'B';
    }
    
    // Calcular apenas com os movimentos selecionados
    const squat = movements.includes('A') ? getBestLift(entry, 'S') : 0;
    const bench = movements.includes('S') ? getBestLift(entry, 'B') : 0;
    const deadlift = movements.includes('T') ? getBestLift(entry, 'D') : 0;
    
    if (event === 'B') {
      // Para evento apenas supino (S)
      return calculateIPFGLPointsBench(bench, bodyweight, entry.sex, equipment);
    } else {
      // Para evento total (AST = SBD)
      return calculateIPFGLPointsTotal(squat, bench, deadlift, bodyweight, entry.sex, equipment);
    }
  };

  // Função para obter melhor tentativa (CORRIGIDA)
  const getBestLift = (entry: Entry, lift: 'S' | 'B' | 'D'): number => {
    const liftPrefix = lift.toLowerCase();
    const statusField = `${liftPrefix}Status` as keyof Entry;
    const statusArray = (entry[statusField] as LiftStatus[]) || [];
    
    // Obter tentativas e seus status
    const attempts = [
      { weight: entry[`${liftPrefix}1` as keyof Entry] as number | null, status: statusArray[0] || 0 },
      { weight: entry[`${liftPrefix}2` as keyof Entry] as number | null, status: statusArray[1] || 0 },
      { weight: entry[`${liftPrefix}3` as keyof Entry] as number | null, status: statusArray[2] || 0 },
      { weight: entry[`${liftPrefix}4` as keyof Entry] as number | null, status: statusArray[3] || 0 }
    ];
    
    // Filtrar apenas tentativas válidas (Good Lift = status 1)
    const validAttempts = attempts
      .filter(attempt => attempt.status === 1 && attempt.weight !== null && attempt.weight > 0)
      .map(attempt => attempt.weight as number);
    
    return validAttempts.length > 0 ? Math.max(...validAttempts) : 0;
  };

  // Função para obter categoria de peso
  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  // Função para obter badge de posição
  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge bg="warning" text="dark">🥇 {position}</Badge>;
    if (position === 2) return <Badge bg="secondary">🥈 {position}</Badge>;
    if (position === 3) return <Badge bg="warning">🥉 {position}</Badge>;
    return <Badge bg="light" text="dark">{position}</Badge>;
  };

  // Filtrar atletas por sexo e calcular pontuação IPF GL
  const indexResults = registration.entries
    .filter(entry => entry.sex === sex)
    .map(entry => {
      const total = getTotal(entry);
      const ipfGLPoints = calculateIPFGLPoints(entry);
      
      // Debug: mostrar atletas com resultados válidos
      if (total > 0 && ipfGLPoints > 0) {
        console.log(`📊 IndexRanking - ${sex === 'M' ? 'Masculino' : 'Feminino'}:`, {
          id: entry.id,
          name: entry.name,
          total,
          ipfGLPoints
        });
      }
      
      return {
        ...entry,
        total,
        ipfGLPoints
      };
    })
    .filter(entry => entry.total > 0 && entry.ipfGLPoints > 0)
    .sort((a, b) => b.ipfGLPoints - a.ipfGLPoints);

  return (
    <div>
      {indexResults.length === 0 ? (
        <Alert variant="info">
          <FaTrophy className="me-2" />
          Nenhum atleta {sex === 'M' ? 'masculino' : 'feminino'} encontrado com resultados válidos.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>
              Ranking por Índice - {sex === 'M' ? 'Masculino' : 'Feminino'} ({indexResults.length} atletas)
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="ipf-tooltip">
                    <strong>IPF GL Points:</strong> Sistema oficial de pontuação da IPF que normaliza 
                    a performance baseada no peso corporal e equipamento usado. 
                    Quanto maior a pontuação, melhor a performance relativa.
                  </Tooltip>
                }
              >
                <FaInfoCircle className="ms-2 text-info" style={{ cursor: 'help' }} />
              </OverlayTrigger>
            </h5>
            <small className="text-muted">Ordenado por IPF GL Points (maior pontuação primeiro)</small>
          </Card.Header>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Peso</th>
                  <th>Movimentos</th>
                  <th>Total</th>
                  <th>IPF GL Points</th>
                </tr>
              </thead>
              <tbody>
                {indexResults.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{getPositionBadge(index + 1)}</td>
                    <td>
                      <strong>{entry.name}</strong>
                      {entry.team && (
                        <div className="text-muted small">{entry.team}</div>
                      )}
                    </td>
                    <td>
                      <Badge bg="success">
                        {getWeightClassLabel(entry.weightClassKg || 0, entry.sex)}
                      </Badge>
                    </td>
                    <td><strong>{entry.bodyweightKg} kg</strong></td>
                    <td>
                      <Badge bg="info">
                        {entry.movements || '-'}
                      </Badge>
                    </td>
                    <td><Badge bg="success" className="fs-6">{entry.total} kg</Badge></td>
                    <td>
                      <OverlayTrigger
                        placement="left"
                        overlay={
                          <Tooltip id={`ipf-details-${entry.id}`}>
                            <div>
                              <strong>Detalhes da Pontuação:</strong><br />
                              Total: {entry.total}kg<br />
                              Peso Corporal: {entry.bodyweightKg}kg<br />
                              Equipamento: {entry.equipment || 'Sleeves'}<br />
                              Movimentos: {entry.movements || 'SBD'}
                            </div>
                          </Tooltip>
                        }
                      >
                        <Badge bg="primary" className="fs-6" style={{ cursor: 'help' }}>
                          {entry.ipfGLPoints.toFixed(2)}
                        </Badge>
                      </OverlayTrigger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

const Results: React.FC = () => {
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
  const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterWeightClass, setFilterWeightClass] = useState('all');
  const [activeTab, setActiveTab] = useState('index');

  // Função para calcular total baseado nos movimentos selecionados
  const getTotal = (entry: Entry): number => {
    const movements = entry.movements || '';
    let total = 0;
    let hasValidLifts = false;

    // Se não há movimentos definidos, não calcular total
    if (!movements || movements.trim() === '') {
      return 0;
    }

    // Verificar se inclui Agachamento (A)
    if (movements.includes('A')) {
      const squat = getBestLift(entry, 'S');
      if (squat > 0) {
        total += squat;
        hasValidLifts = true;
      }
    }

    // Verificar se inclui Supino (S)
    if (movements.includes('S')) {
      const bench = getBestLift(entry, 'B');
      if (bench > 0) {
        total += bench;
        hasValidLifts = true;
      }
    }

    // Verificar se inclui Terra (T)
    if (movements.includes('T')) {
      const deadlift = getBestLift(entry, 'D');
      if (deadlift > 0) {
        total += deadlift;
        hasValidLifts = true;
      }
    }

    return hasValidLifts ? total : 0;
  };

  // Função para calcular pontuação IPF GL Points (oficial)
  const calculateIPFGLPoints = (entry: Entry): number => {
    const total = getTotal(entry);
    const bodyweight = entry.bodyweightKg || 0;
    
    if (total <= 0 || bodyweight <= 0) return 0;
    
    // Normalizar equipamento para IPF GL Points
    let equipment: 'Sleeves' | 'Single-ply' = 'Sleeves';
    if (entry.equipment === 'Single-ply' || entry.equipment === 'Multi-ply' || entry.equipment === 'Unlimited') {
      equipment = 'Single-ply';
    }
    
    // Determinar o evento baseado nos movimentos selecionados
    const movements = entry.movements || '';
    let event: 'SBD' | 'B' = 'SBD';
    
    // Se apenas supino, usar evento B
    if (movements === 'S') {
      event = 'B';
    }
    
    // Calcular apenas com os movimentos selecionados
    const squat = movements.includes('A') ? getBestLift(entry, 'S') : 0;
    const bench = movements.includes('S') ? getBestLift(entry, 'B') : 0;
    const deadlift = movements.includes('T') ? getBestLift(entry, 'D') : 0;
    
    if (event === 'B') {
      // Para evento apenas supino (S)
      return calculateIPFGLPointsBench(bench, bodyweight, entry.sex, equipment);
    } else {
      // Para evento total (AST = SBD)
      return calculateIPFGLPointsTotal(squat, bench, deadlift, bodyweight, entry.sex, equipment);
    }
  };

  // Função para calcular pontuação IPF (versão simplificada)
  const calculateIPFPoints = (total: number, bodyweight: number, sex: 'M' | 'F'): number => {
    if (total <= 0 || bodyweight <= 0) return 0;
    
    // Coeficientes simplificados IPF (versão aproximada)
    const coefficients = sex === 'M' 
      ? { a: 1199.72839, b: 1025.18162, c: 0.00921 }
      : { a: 610.32796, b: 1045.59282, c: 0.03048 };
    
    const denominator = coefficients.a - coefficients.b * Math.exp(-coefficients.c * bodyweight);
    return Math.round((500 * total / denominator) * 100) / 100;
  };

  // Função para calcular pontuação Wilks
  const calculateWilksPoints = (total: number, bodyweight: number, sex: 'M' | 'F'): number => {
    if (total <= 0 || bodyweight <= 0) return 0;
    
    // Coeficientes Wilks simplificados
    const coefficients = sex === 'M'
      ? { a: -216.0475144, b: 16.2606339, c: -0.002388645, d: -0.00113732, e: 7.01863E-06, f: -1.291E-08 }
      : { a: 594.31747775582, b: -27.23842536447, c: 0.82112226871, d: -0.00930733913, e: 4.731582E-05, f: -9.054E-08 };
    
    const x = bodyweight;
    const denominator = coefficients.a + coefficients.b * x + coefficients.c * Math.pow(x, 2) + 
                       coefficients.d * Math.pow(x, 3) + coefficients.e * Math.pow(x, 4) + 
                       coefficients.f * Math.pow(x, 5);
    
    return Math.round((total * 500 / denominator) * 100) / 100;
  };

  // Função para obter melhor tentativa (CORRIGIDA)
  const getBestLift = (entry: Entry, lift: 'S' | 'B' | 'D'): number => {
    const liftPrefix = lift.toLowerCase();
    const statusField = `${liftPrefix}Status` as keyof Entry;
    const statusArray = (entry[statusField] as LiftStatus[]) || [];
    
    // Obter tentativas e seus status
    const attempts = [
      { weight: entry[`${liftPrefix}1` as keyof Entry] as number | null, status: statusArray[0] || 0 },
      { weight: entry[`${liftPrefix}2` as keyof Entry] as number | null, status: statusArray[1] || 0 },
      { weight: entry[`${liftPrefix}3` as keyof Entry] as number | null, status: statusArray[2] || 0 },
      { weight: entry[`${liftPrefix}4` as keyof Entry] as number | null, status: statusArray[3] || 0 }
    ];
    
    // Filtrar apenas tentativas válidas (Good Lift = status 1)
    const validAttempts = attempts
      .filter(attempt => attempt.status === 1 && attempt.weight !== null && attempt.weight > 0)
      .map(attempt => attempt.weight as number);
    
    // Debug: mostrar tentativas válidas
    if (validAttempts.length > 0) {
      console.log(`📊 getBestLift - ${lift}:`, {
        entryId: entry.id,
        entryName: entry.name,
        validAttempts,
        bestLift: Math.max(...validAttempts)
      });
    }
    
    return validAttempts.length > 0 ? Math.max(...validAttempts) : 0;
  };

  // Função para calcular pontos baseado na fórmula
  const calculatePoints = (entry: Entry): number => {
    const total = getTotal(entry);
    const bodyweight = entry.bodyweightKg || 0;
    
    if (total <= 0 || bodyweight <= 0) return 0;
    
    switch (meet.formula) {
      case 'IPF GL Points':
        return calculateIPFGLPoints(entry);
      case 'IPF':
        return calculateIPFPoints(total, bodyweight, entry.sex);
      case 'Wilks':
        return calculateWilksPoints(total, bodyweight, entry.sex);
      default:
        return total; // Fallback para total absoluto
    }
  };

  // Função para obter label dos movimentos
  const getMovementsLabel = (movements: string): string => {
    if (!movements || movements.trim() === '') {
      return 'Não definido';
    }
    
    const labels: { [key: string]: string } = {
      'AST': 'Agachamento + Supino + Terra',
      'AS': 'Agachamento + Supino',
      'AT': 'Agachamento + Terra',
      'ST': 'Supino + Terra',
      'A': 'Apenas Agachamento',
      'S': 'Apenas Supino',
      'T': 'Apenas Terra'
    };
    return labels[movements] || movements;
  };

  // Função para obter categoria de peso
  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  // Processar resultados
  const processedResults = useMemo(() => {
    console.log('🔄 Results - Processando resultados...', {
      totalEntries: registration.entries.length,
      filterSex,
      filterDivision,
      filterWeightClass,
      activeTab
    });
    
    const validEntries = registration.entries
      .filter(entry => {
        const total = getTotal(entry);
        if (total <= 0) return false;
        if (filterSex !== 'all' && entry.sex !== filterSex) return false;
        if (filterDivision !== 'all' && entry.division !== filterDivision) return false;
        if (filterWeightClass !== 'all' && (entry.weightClassKg || 0).toString() !== filterWeightClass) return false;
        return true;
      })
      .map(entry => {
        const squat = getBestLift(entry, 'S');
        const bench = getBestLift(entry, 'B');
        const deadlift = getBestLift(entry, 'D');
        const total = getTotal(entry);
        const points = calculatePoints(entry);
        
        // Debug: mostrar atletas com resultados válidos
        if (total > 0) {
          console.log(`📊 Results - Atleta com resultados:`, {
            id: entry.id,
            name: entry.name,
            squat,
            bench,
            deadlift,
            total,
            points
          });
        }
        
        return {
          ...entry,
          squat,
          bench,
          deadlift,
          total,
          points
        };
      });

    // Ordenar por pontos (ou total absoluto se não há pontos)
    const sortedResults = validEntries.sort((a, b) => {
      if (activeTab === 'absolute') {
        return b.total - a.total;
      } else {
        return b.points - a.points;
      }
    });
    
    console.log(`✅ Results - Processamento concluído: ${sortedResults.length} atletas válidos`);
    
    return sortedResults;
  }, [registration.entries, meet.formula, filterSex, filterDivision, filterWeightClass, activeTab]);

  // Agrupar por categoria
  const resultsByCategory = useMemo(() => {
    const grouped: { [key: string]: typeof processedResults } = {};
    
    processedResults.forEach(entry => {
      const categoryKey = `${entry.sex}-${entry.weightClassKg}-${entry.division}`;
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(entry);
    });

    // Ordenar cada categoria
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (activeTab === 'absolute') {
          return b.total - a.total;
        } else {
          return b.points - a.points;
        }
      });
    });

    return grouped;
  }, [processedResults, activeTab]);

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge bg="warning"><FaTrophy /> 1º</Badge>;
    if (position === 2) return <Badge bg="secondary"><FaMedal /> 2º</Badge>;
    if (position === 3) return <Badge bg="dark"><FaMedal /> 3º</Badge>;
    return <Badge bg="light" text="dark">{position}º</Badge>;
  };

  const getCategoryDisplayName = (categoryKey: string, entries: typeof processedResults) => {
    if (entries.length === 0) return categoryKey;
    const entry = entries[0];
    return `${entry.sex === 'M' ? 'Masculino' : 'Feminino'} - ${getWeightClassLabel(entry.weightClassKg || 0, entry.sex)} - ${entry.division}`;
  };

  const exportResults = () => {
    // Implementação básica de exportação
    const csvContent = processedResults.map(entry => 
      `${entry.name},${entry.sex},${entry.division},${getWeightClassLabel(entry.weightClassKg || 0, entry.sex)},${entry.squat},${entry.bench},${entry.deadlift},${entry.total},${entry.points}`
    ).join('\n');
    
    const header = 'Nome,Sexo,Divisão,Categoria,Agachamento,Supino,Terra,Total,Pontos\n';
    const csv = header + csvContent;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${meet.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Resultados</h3>
              <p className="text-muted">Rankings e classificações finais</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={exportResults}>
                <FaDownload className="me-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Filtros</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Sexo</Form.Label>
                <Form.Select
                  value={filterSex}
                  onChange={(e) => setFilterSex(e.target.value as 'all' | 'M' | 'F')}
                >
                  <option value="all">Todos</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Divisão</Form.Label>
                <Form.Select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {meet.divisions.map((division, index) => (
                    <option key={index} value={division}>{division}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Categoria</Form.Label>
                <Form.Select
                  value={filterWeightClass}
                  onChange={(e) => setFilterWeightClass(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {(filterSex === 'all' 
                    ? [...meet.weightClassesKgMen, ...meet.weightClassesKgWomen]
                    : filterSex === 'M' 
                      ? meet.weightClassesKgMen 
                      : meet.weightClassesKgWomen
                  ).map((weight, index) => (
                    <option key={index} value={weight}>{weight}kg</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setFilterSex('all');
                  setFilterDivision('all');
                  setFilterWeightClass('all');
                }}
              >
                <FaFilter className="me-2" />
                Limpar Filtros
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs de Resultados */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'index')}
        className="mb-4"
      >
        <Tab eventKey="index" title={<><FaChartBar className="me-2" />Índice</>}>
          <Tabs defaultActiveKey="male" className="mt-3">
            <Tab eventKey="male" title="Masculino">
              <IndexRanking sex="M" />
            </Tab>
            <Tab eventKey="female" title="Feminino">
              <IndexRanking sex="F" />
            </Tab>
          </Tabs>
        </Tab>
        <Tab eventKey="absolute" title={<><FaChartBar className="me-2" />Absoluto</>}>
          {processedResults.length === 0 ? (
            <Alert variant="info">
              <FaTrophy className="me-2" />
              Nenhum resultado encontrado com os filtros aplicados.
            </Alert>
          ) : (
            <Card>
              <Card.Header>
                <h5>Ranking Absoluto ({processedResults.length} atletas)</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Nome</th>
                      <th>Sexo</th>
                      <th>Categoria</th>
                      <th>Peso</th>
                      <th>Agachamento</th>
                      <th>Supino</th>
                      <th>Terra</th>
                      <th>Total</th>
                      {meet.formula !== 'IPF' && <th>Pontos {meet.formula}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {processedResults.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{getPositionBadge(index + 1)}</td>
                        <td>
                          <strong>{entry.name}</strong>
                          {entry.team && (
                            <div className="text-muted small">{entry.team}</div>
                          )}
                        </td>
                        <td>
                          <Badge bg={entry.sex === 'M' ? 'primary' : 'info'}>
                            {entry.sex === 'M' ? 'M' : 'F'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="success">
                            {getWeightClassLabel(entry.weightClassKg || 0, entry.sex)}
                          </Badge>
                        </td>
                        <td><strong>{entry.bodyweightKg} kg</strong></td>
                        <td><Badge bg="primary">{entry.squat} kg</Badge></td>
                        <td><Badge bg="warning" text="dark">{entry.bench} kg</Badge></td>
                        <td><Badge bg="danger">{entry.deadlift} kg</Badge></td>
                        <td><Badge bg="success" className="fs-6">{entry.total} kg</Badge></td>
                        {meet.formula !== 'IPF' && (
                          <td><Badge bg="info">{entry.points}</Badge></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>
        
        <Tab eventKey="categories" title={<><FaMedal className="me-2" />Por Categoria</>}>
          {Object.keys(resultsByCategory).length === 0 ? (
            <Alert variant="info">
              <FaTrophy className="me-2" />
              Nenhum resultado encontrado com os filtros aplicados.
            </Alert>
          ) : (
            <div>
              {Object.entries(resultsByCategory).map(([categoryKey, entries]) => (
                <Card key={categoryKey} className="mb-4">
                  <Card.Header>
                    <h5>{getCategoryDisplayName(categoryKey, entries)} ({entries.length} atletas)</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Nome</th>
                          <th>Peso</th>
                          <th>Agachamento</th>
                          <th>Supino</th>
                          <th>Terra</th>
                          <th>Total</th>
                          {meet.formula !== 'IPF' && <th>Pontos {meet.formula}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((entry, index) => (
                          <tr key={entry.id}>
                            <td>{getPositionBadge(index + 1)}</td>
                            <td>
                              <strong>{entry.name}</strong>
                              {entry.team && (
                                <div className="text-muted small">{entry.team}</div>
                              )}
                            </td>
                            <td><strong>{entry.bodyweightKg} kg</strong></td>
                            <td><Badge bg="primary">{entry.squat} kg</Badge></td>
                            <td><Badge bg="warning" text="dark">{entry.bench} kg</Badge></td>
                            <td><Badge bg="danger">{entry.deadlift} kg</Badge></td>
                            <td><Badge bg="success" className="fs-6">{entry.total} kg</Badge></td>
                            {meet.formula !== 'IPF' && (
                              <td><Badge bg="info">{entry.points}</Badge></td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Results;
