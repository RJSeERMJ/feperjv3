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

  // Agrupar por grupos
  const entriesByFlight = flights.reduce((acc, flight) => {
    acc[flight] = filteredEntries.filter(entry => entry.flight === flight);
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
    
    return { total, weighed, men, women };
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

              {/* Estatísticas dos Grupos */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Estatísticas dos Grupos</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {flights.map(flight => {
                  const stats = getFlightStats(flight);
                  return (
                    <Col key={flight} md={2} className="mb-3">
                      <div className="text-center p-3 border rounded">
                        <h4 className="text-primary mb-2">Grupo {flight}</h4>
                        <div className="mb-2">
                          <Badge bg="primary" className="me-1">{stats.total}</Badge>
                          <small>Total</small>
                        </div>
                        <div className="mb-2">
                          <Badge bg="success" className="me-1">{stats.weighed}</Badge>
                          <small>Pesados</small>
                        </div>
                        <div className="mb-2">
                          <Badge bg="info" className="me-1">{stats.men}M</Badge>
                          <Badge bg="warning" className="me-1">{stats.women}F</Badge>
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
                        {getWeightClassLabel(entry.weightClassKg, entry.sex)}
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
