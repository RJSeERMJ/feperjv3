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
  ButtonGroup
} from 'react-bootstrap';
import { 
  FaTrophy, 
  FaMedal, 
  FaDownload, 
  FaChartBar,
  FaUsers,
  FaWeightHanging,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
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
}

interface ResultsByCategory {
  category: string;
  results: CalculatedResult[];
}

const Results: React.FC = () => {
  const { meet, registration } = useSelector((state: RootState) => state);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = todos os dias
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSex, setSelectedSex] = useState<'M' | 'F' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'total' | 'points' | 'squat' | 'bench' | 'deadlift'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
          }
        };
      })
      .filter(result => result.total > 0) // Apenas atletas com total válido
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
  }, [registration.entries, selectedDay, selectedDivision, selectedSex, sortBy, sortOrder]);

  // Agrupar resultados por categoria
  const resultsByCategory = useMemo((): ResultsByCategory[] => {
    const grouped: { [key: string]: CalculatedResult[] } = {};

    calculatedResults.forEach(result => {
      const category = `${result.entry.division} - ${result.entry.weightClass}`;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(result);
    });

    return Object.entries(grouped).map(([category, results]) => ({
      category,
      results: results.sort((a, b) => b.total - a.total)
    }));
  }, [calculatedResults]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalAthletes = calculatedResults.length;
    const totalWeight = calculatedResults.reduce((sum, r) => sum + r.total, 0);
    const avgTotal = totalAthletes > 0 ? totalWeight / totalAthletes : 0;
    const bestTotal = calculatedResults.length > 0 ? calculatedResults[0].total : 0;
    const bestPoints = calculatedResults.length > 0 ? calculatedResults[0].points : 0;

    return {
      totalAthletes,
      totalWeight,
      avgTotal: Math.round(avgTotal * 10) / 10,
      bestTotal,
      bestPoints: Math.round(bestPoints * 10) / 10
    };
  }, [calculatedResults]);

  // Função para exportar resultados como CSV
  const exportToCSV = () => {
    const headers = [
      'Posição',
      'Nome',
      'Equipe',
      'Divisão',
      'Categoria',
      'Peso Corporal',
      'Agachamento',
      'Supino',
      'Terra',
      'Total',
      'Pontos IPF GL'
    ];

    const csvData = calculatedResults.map((result, index) => [
      index + 1,
      result.entry.name,
      result.entry.team,
      result.entry.division,
      result.entry.weightClass,
      result.entry.bodyweightKg || '',
      result.squat,
      result.bench,
      result.deadlift,
      result.total,
      Math.round(result.points * 10) / 10
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const fileName = `${meet.name || 'Resultados'}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
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
            </div>
            <ButtonGroup>
              <Button variant="outline-primary" onClick={exportToCSV}>
                <FaDownload className="me-2" />
                Exportar CSV
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      {/* Estatísticas Gerais */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaUsers className="text-primary mb-2" size={24} />
              <h4>{stats.totalAthletes}</h4>
              <p className="text-muted mb-0">Atletas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaWeightHanging className="text-success mb-2" size={24} />
              <h4>{stats.bestTotal}kg</h4>
              <p className="text-muted mb-0">Maior Total</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaChartBar className="text-info mb-2" size={24} />
              <h4>{stats.bestPoints}</h4>
              <p className="text-muted mb-0">Melhor Pontuação</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FaTrophy className="text-warning mb-2" size={24} />
              <h4>{stats.avgTotal}kg</h4>
              <p className="text-muted mb-0">Média Total</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Filtros e Ordenação</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Dia</Form.Label>
                    <Form.Select 
                      value={selectedDay} 
                      onChange={(e) => setSelectedDay(Number(e.target.value))}
                    >
                      <option value={0}>Todos os dias</option>
                      {Array.from({ length: meet.lengthDays }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
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
                <Col md={3}>
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
                <Col md={3}>
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
                            <br />
                            <small className="text-muted">
                              {result.entry.division} - {result.entry.weightClass}
                            </small>
                          </div>
                        </td>
                        <td>{result.entry.team}</td>
                        <td>{result.entry.bodyweightKg || '-'}kg</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold">{result.squat}kg</span>
                            <Badge bg="secondary" className="ms-1">
                              {result.validAttempts.squat}/3
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold">{result.bench}kg</span>
                            <Badge bg="secondary" className="ms-1">
                              {result.validAttempts.bench}/3
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="fw-bold">{result.deadlift}kg</span>
                            <Badge bg="secondary" className="ms-1">
                              {result.validAttempts.deadlift}/3
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <span className="fw-bold text-primary fs-5">
                            {result.total}kg
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            {Math.round(result.points * 10) / 10}
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

      {/* Mensagem quando não há resultados */}
      {calculatedResults.length === 0 && (
        <Row>
          <Col>
            <Alert variant="info" className="text-center">
              <FaChartBar size={48} className="mb-3" />
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
