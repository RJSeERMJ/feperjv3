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
  Tab
} from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { GlobalState, Entry, Formula } from '../../types/barraProntaTypes';
import { FaTrophy, FaMedal, FaChartBar, FaDownload, FaFilter } from 'react-icons/fa';

const Results: React.FC = () => {
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
  const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterWeightClass, setFilterWeightClass] = useState('all');
  const [activeTab, setActiveTab] = useState('absolute');

  // Função para calcular pontuação IPF
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

  // Função para obter melhor tentativa
  const getBestLift = (entry: Entry, lift: 'S' | 'B' | 'D'): number => {
    const liftPrefix = lift.toLowerCase();
    const attempts = [
      entry[`${liftPrefix}1` as keyof Entry] as number | null,
      entry[`${liftPrefix}2` as keyof Entry] as number | null,
      entry[`${liftPrefix}3` as keyof Entry] as number | null,
      entry[`${liftPrefix}4` as keyof Entry] as number | null
    ].filter(weight => weight !== null && weight > 0);
    
    return attempts.length > 0 ? Math.max(...attempts.filter((w): w is number => w !== null)) : 0;
  };

  // Função para calcular total
  const getTotal = (entry: Entry): number => {
    const squat = getBestLift(entry, 'S');
    const bench = getBestLift(entry, 'B');
    const deadlift = getBestLift(entry, 'D');
    
    if (squat > 0 && bench > 0 && deadlift > 0) {
      return squat + bench + deadlift;
    }
    return 0;
  };

  // Função para calcular pontos baseado na fórmula
  const calculatePoints = (entry: Entry): number => {
    const total = getTotal(entry);
    const bodyweight = entry.bodyweightKg || 0;
    
    if (total <= 0 || bodyweight <= 0) return 0;
    
    switch (meet.formula) {
      case 'IPF':
        return calculateIPFPoints(total, bodyweight, entry.sex);
      case 'Wilks':
        return calculateWilksPoints(total, bodyweight, entry.sex);
      default:
        return total; // Fallback para total absoluto
    }
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
    const validEntries = registration.entries
      .filter(entry => {
        const total = getTotal(entry);
        if (total <= 0) return false;
        if (filterSex !== 'all' && entry.sex !== filterSex) return false;
        if (filterDivision !== 'all' && entry.division !== filterDivision) return false;
        if (filterWeightClass !== 'all' && entry.weightClassKg.toString() !== filterWeightClass) return false;
        return true;
      })
      .map(entry => ({
        ...entry,
        squat: getBestLift(entry, 'S'),
        bench: getBestLift(entry, 'B'),
        deadlift: getBestLift(entry, 'D'),
        total: getTotal(entry),
        points: calculatePoints(entry)
      }));

    // Ordenar por pontos (ou total absoluto se não há pontos)
    return validEntries.sort((a, b) => {
      if (activeTab === 'absolute') {
        return b.total - a.total;
      } else {
        return b.points - a.points;
      }
    });
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
    return `${entry.sex === 'M' ? 'Masculino' : 'Feminino'} - ${getWeightClassLabel(entry.weightClassKg, entry.sex)} - ${entry.division}`;
  };

  const exportResults = () => {
    // Implementação básica de exportação
    const csvContent = processedResults.map(entry => 
      `${entry.name},${entry.sex},${entry.division},${getWeightClassLabel(entry.weightClassKg, entry.sex)},${entry.squat},${entry.bench},${entry.deadlift},${entry.total},${entry.points}`
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
        onSelect={(k) => setActiveTab(k || 'absolute')}
        className="mb-4"
      >
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
                            {getWeightClassLabel(entry.weightClassKg, entry.sex)}
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
