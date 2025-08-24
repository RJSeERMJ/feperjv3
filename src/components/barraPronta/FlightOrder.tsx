import React, { useState, useEffect } from 'react';
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
  InputGroup
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Entry, Flight } from '../../types/barraProntaTypes';
import { updateEntry, setLiftingState } from '../../actions/barraProntaActions';
import { FaPlane, FaEdit, FaRandom, FaSave, FaFilter, FaWeightHanging } from 'react-icons/fa';

const FlightOrder: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  const lifting = useSelector((state: GlobalState) => state.lifting);
  
  const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterFlight, setFilterFlight] = useState<'all' | Flight>('all');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState(1);

  const flights: Flight[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Filtrar entradas
  const filteredEntries = registration.entries.filter(entry => {
    if (filterSex !== 'all' && entry.sex !== filterSex) return false;
    if (filterDivision !== 'all' && entry.division !== filterDivision) return false;
    if (filterFlight !== 'all' && entry.flight !== filterFlight) return false;
    return true;
  });

  // Função para calcular total parcial baseado nos movimentos
  const getPartialTotal = (entry: Entry): number => {
    let total = 0;

    // Agachamento (primeira tentativa)
    if (entry.squat1) {
      total += entry.squat1;
    }

    // Supino (primeira tentativa)
    if (entry.bench1) {
      total += entry.bench1;
    }

    // Terra (primeira tentativa)
    if (entry.deadlift1) {
      total += entry.deadlift1;
    }

    return total;
  };

  // Função para obter o peso do agachamento (para ordenação)
  const getSquatWeight = (entry: Entry): number => {
    return entry.squat1 || 0;
  };

  // Agrupar por grupos e ordenar por agachamento (crescente)
  const entriesByFlight = flights.reduce((acc, flight) => {
    const flightEntries = filteredEntries.filter(entry => entry.flight === flight);
    // Ordenar por peso do agachamento (crescente)
    acc[flight] = flightEntries.sort((a, b) => getSquatWeight(a) - getSquatWeight(b));
    return acc;
  }, {} as Record<Flight, Entry[]>);

  const handleAssignFlight = (entryId: number, flight: Flight) => {
    dispatch(updateEntry(entryId, { flight }));
  };

  const handleAssignDay = (entryId: number, day: number) => {
    dispatch(updateEntry(entryId, { day }));
  };

  const handleAssignPlatform = (entryId: number, platform: number) => {
    dispatch(updateEntry(entryId, { platform }));
  };

  const handleAutoAssignFlights = () => {
          if (window.confirm('Isso irá redistribuir automaticamente todos os atletas nos grupos. Continuar?')) {
      const entriesWithWeight = registration.entries
        .filter(entry => entry.bodyweightKg !== null)
        .sort((a, b) => (b.bodyweightKg || 0) - (a.bodyweightKg || 0));

      const entriesPerFlight = Math.ceil(entriesWithWeight.length / flights.length);
      
      entriesWithWeight.forEach((entry, index) => {
        const flightIndex = Math.floor(index / entriesPerFlight);
        const flight = flights[flightIndex] || flights[0];
        dispatch(updateEntry(entry.id, { flight }));
      });
    }
  };

  const handleSetLiftingState = () => {
    dispatch(setLiftingState({
      day: selectedDay,
      platform: selectedPlatform,
      flight: filterFlight !== 'all' ? filterFlight : 'A'
    }));
  };

  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  const getFlightStats = (flight: Flight) => {
    const entries = entriesByFlight[flight];
    const total = entries.length;
    const weighed = entries.filter(e => e.bodyweightKg !== null).length;
    const men = entries.filter(e => e.sex === 'M').length;
    const women = entries.filter(e => e.sex === 'F').length;
    
    // Calcular total parcial do grupo
    const groupTotal = entries.reduce((sum, entry) => sum + getPartialTotal(entry), 0);
    
    return { total, weighed, men, women, groupTotal };
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Ordem dos Grupos</h3>
              <p className="text-muted">Organize os atletas em grupos e plataformas</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={handleAutoAssignFlights}>
                <FaRandom className="me-2" />
                Auto Distribuir
              </Button>
              <Button variant="success" onClick={handleSetLiftingState}>
                <FaSave className="me-2" />
                Definir Estado
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filtros e Configurações */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5>Filtros</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
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
                <Col md={4}>
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
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Grupo</Form.Label>
                    <Form.Select
                      value={filterFlight}
                      onChange={(e) => setFilterFlight(e.target.value as 'all' | Flight)}
                    >
                      <option value="all">Todos</option>
                      {flights.map(flight => (
                        <option key={flight} value={flight}>Grupo {flight}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5>Estado de Levantamento</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Dia</Form.Label>
                    <Form.Select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    >
                      {Array.from({ length: meet.lengthDays }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Plataforma</Form.Label>
                    <Form.Select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(parseInt(e.target.value))}
                    >
                      {Array.from({ length: meet.platformsOnDays[selectedDay - 1] || 1 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Plataforma {i + 1}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

              {/* Resumo Geral */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>📊 Resumo Geral dos Grupos</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {flights.map(flight => {
                  const stats = getFlightStats(flight);
                  if (stats.total === 0) return null;
                  
                  return (
                    <Col key={flight} md={3} className="mb-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-primary">Grupo {flight}</h6>
                        <div className="h4 mb-1">{stats.total}</div>
                        <small className="text-muted">atletas</small>
                        <div className="mt-2">
                          <Badge bg="success" className="fs-6">
                            {stats.groupTotal} kg
                          </Badge>
                        </div>
                        <div className="mt-1">
                          <small className="text-muted">
                            M: {stats.men} | F: {stats.women}
                          </small>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Organização por Grupos */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Organização por Grupos</h5>
              <small className="text-muted">Atletas organizados por grupo e ordenados por peso do agachamento (crescente)</small>
            </Card.Header>
            <Card.Body>
              {flights.map(flight => {
                const flightEntries = entriesByFlight[flight];
                if (flightEntries.length === 0) return null;
                
                return (
                  <div key={flight} className="mb-4">
                                         <h6 className="text-primary border-bottom pb-2">
                       <Badge bg="primary" className="me-2">Grupo {flight}</Badge>
                       <span className="ms-3 text-muted">
                         {getFlightStats(flight).total} atletas
                       </span>
                     </h6>
                                         <Table responsive striped hover size="sm">
                       <thead>
                         <tr>
                           <th>Nome</th>
                           <th>Agachamento</th>
                           <th>Supino</th>
                           <th>Terra</th>
                         </tr>
                       </thead>
                       <tbody>
                         {flightEntries.map((entry, index) => (
                           <tr key={entry.id}>
                             <td>
                               <strong>{entry.name}</strong>
                               {entry.team && (
                                 <div className="text-muted small">{entry.team}</div>
                               )}
                             </td>
                             <td>
                               <Badge bg="primary">
                                 {entry.squat1 ? `${entry.squat1} kg` : '-'}
                               </Badge>
                             </td>
                             <td>
                               <Badge bg="info">
                                 {entry.bench1 ? `${entry.bench1} kg` : '-'}
                               </Badge>
                             </td>
                             <td>
                               <Badge bg="warning" text="dark">
                                 {entry.deadlift1 ? `${entry.deadlift1} kg` : '-'}
                               </Badge>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </Table>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de Atletas */}
      {filteredEntries.length === 0 ? (
        <Alert variant="info">
          <FaPlane className="me-2" />
          Nenhum atleta encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Atletas ({filteredEntries.length})</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Sexo</th>
                  <th>Divisão</th>
                  <th>Categoria</th>
                  <th>Peso</th>
                                      <th>Grupo</th>
                  <th>Dia</th>
                  <th>Plataforma</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{index + 1}</td>
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
                      <Badge bg="secondary">{entry.division}</Badge>
                    </td>
                    <td>
                      <Badge bg="success">
                        <FaWeightHanging className="me-1" />
                        {getWeightClassLabel(entry.weightClassKg || 0, entry.sex)}
                      </Badge>
                    </td>
                    <td>
                      {entry.bodyweightKg ? (
                        <strong>{entry.bodyweightKg} kg</strong>
                      ) : (
                        <span className="text-muted">Não pesado</span>
                      )}
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={entry.flight || ''}
                        onChange={(e) => handleAssignFlight(entry.id, e.target.value as Flight)}
                        style={{ width: '80px' }}
                      >
                        <option value="">-</option>
                        {flights.map(flight => (
                          <option key={flight} value={flight}>{flight}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={entry.day || ''}
                        onChange={(e) => handleAssignDay(entry.id, parseInt(e.target.value))}
                        style={{ width: '80px' }}
                      >
                        <option value="">-</option>
                        {Array.from({ length: meet.lengthDays }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={entry.platform || ''}
                        onChange={(e) => handleAssignPlatform(entry.id, parseInt(e.target.value))}
                        style={{ width: '80px' }}
                      >
                        <option value="">-</option>
                        {Array.from({ length: Math.max(...meet.platformsOnDays) }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          if (entry.flight) {
                            dispatch(setLiftingState({
                              day: entry.day || 1,
                              platform: entry.platform || 1,
                              flight: entry.flight
                            }));
                          }
                        }}
                        disabled={!entry.flight}
                      >
                        <FaPlane />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default FlightOrder;
