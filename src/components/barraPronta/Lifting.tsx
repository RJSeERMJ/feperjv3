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
  InputGroup,
  Modal
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Entry, Lift } from '../../types/barraProntaTypes';
import { updateEntry, setLiftingState } from '../../actions/barraProntaActions';
import { FaWeightHanging, FaCheck, FaTimes, FaPlay, FaCog, FaChartBar } from 'react-icons/fa';

const Lifting: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  const lifting = useSelector((state: GlobalState) => state.lifting);
  
  const [currentWeight, setCurrentWeight] = useState('');
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<1 | 2 | 3 | 4>(1);
  const [attemptResult, setAttemptResult] = useState<'good' | 'no-lift' | null>(null);
  const [attemptWeight, setAttemptWeight] = useState('');

  const lifts: { key: Lift; name: string }[] = [
    { key: 'S', name: 'Agachamento' },
    { key: 'B', name: 'Supino' },
    { key: 'D', name: 'Terra' }
  ];

  // Filtrar entradas do voo atual
  const currentFlightEntries = registration.entries.filter(entry => 
    entry.flight === lifting.flight &&
    entry.day === lifting.day &&
    entry.platform === lifting.platform
  ).sort((a, b) => (a.lotNumber || 0) - (b.lotNumber || 0));

  const handleLiftChange = (lift: Lift) => {
    dispatch(setLiftingState({ lift }));
  };

  const handleAttemptClick = (entry: Entry, attempt: 1 | 2 | 3 | 4) => {
    setSelectedEntry(entry);
    setSelectedAttempt(attempt);
    
    // Carregar peso atual da tentativa
    const currentAttemptWeight = getAttemptWeight(entry, lifting.lift, attempt);
    setAttemptWeight(currentAttemptWeight?.toString() || '');
    setAttemptResult(getAttemptResult(entry, lifting.lift, attempt));
    
    setShowAttemptModal(true);
  };

  const handleSaveAttempt = () => {
    if (!selectedEntry) return;

    const weight = parseFloat(attemptWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Peso deve ser um número válido maior que zero!');
      return;
    }

    const liftPrefix = lifting.lift.toLowerCase();
    const attemptField = `${liftPrefix}${selectedAttempt}` as keyof Entry;
    
    // Salvar peso com sinal negativo se for no-lift
    const finalWeight = attemptResult === 'no-lift' ? -Math.abs(weight) : weight;
    
    dispatch(updateEntry(selectedEntry.id, {
      [attemptField]: finalWeight
    }));

    setShowAttemptModal(false);
    setSelectedEntry(null);
    setAttemptWeight('');
    setAttemptResult(null);
  };

  const getAttemptWeight = (entry: Entry, lift: Lift, attempt: 1 | 2 | 3 | 4): number | null => {
    const liftPrefix = lift.toLowerCase();
    const field = `${liftPrefix}${attempt}` as keyof Entry;
    return entry[field] as number | null;
  };

  const getAttemptResult = (entry: Entry, lift: Lift, attempt: 1 | 2 | 3 | 4): 'good' | 'no-lift' | null => {
    const weight = getAttemptWeight(entry, lift, attempt);
    if (weight === null) return null;
    return weight > 0 ? 'good' : 'no-lift';
  };

  const getBestLift = (entry: Entry, lift: Lift): number => {
    const liftPrefix = lift.toLowerCase();
    const attempts = [
      entry[`${liftPrefix}1` as keyof Entry] as number | null,
      entry[`${liftPrefix}2` as keyof Entry] as number | null,
      entry[`${liftPrefix}3` as keyof Entry] as number | null,
      entry[`${liftPrefix}4` as keyof Entry] as number | null
    ].filter(weight => weight !== null && weight > 0);
    
    return attempts.length > 0 ? Math.max(...attempts.filter((w): w is number => w !== null)) : 0;
  };

  const getTotal = (entry: Entry): number => {
    const squat = getBestLift(entry, 'S');
    const bench = getBestLift(entry, 'B');
    const deadlift = getBestLift(entry, 'D');
    
    // Total só é válido se tiver ao menos uma tentativa boa em cada movimento
    if (squat > 0 && bench > 0 && deadlift > 0) {
      return squat + bench + deadlift;
    }
    return 0;
  };

  const getAttemptBadge = (weight: number | null) => {
    if (weight === null) {
      return <Badge bg="secondary">-</Badge>;
    }
    if (weight > 0) {
      return <Badge bg="success"><FaCheck /> {weight}kg</Badge>;
    } else {
      return <Badge bg="danger"><FaTimes /> {Math.abs(weight)}kg</Badge>;
    }
  };

  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  const getNextAttempt = (entry: Entry, lift: Lift): 1 | 2 | 3 | 4 | null => {
    const liftPrefix = lift.toLowerCase();
    for (let attempt = 1; attempt <= 4; attempt++) {
      const field = `${liftPrefix}${attempt}` as keyof Entry;
      if (entry[field] === null) {
        return attempt as 1 | 2 | 3 | 4;
      }
    }
    return null;
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Levantamento</h3>
              <p className="text-muted">Controle das tentativas em tempo real</p>
            </div>
            <div className="d-flex gap-2">
              <Badge bg="primary" className="fs-6">
                Dia {lifting.day} | Plataforma {lifting.platform} | Voo {lifting.flight}
              </Badge>
            </div>
          </div>
        </Col>
      </Row>

      {/* Controle de Movimento */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Movimento Atual</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Selecionar Movimento</Form.Label>
                <div className="d-flex gap-2">
                  {lifts.map(({ key, name }) => (
                    <Button
                      key={key}
                      variant={lifting.lift === key ? 'primary' : 'outline-primary'}
                      onClick={() => handleLiftChange(key)}
                      className="flex-fill"
                    >
                      <FaWeightHanging className="me-2" />
                      {name}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Informações do Voo</Form.Label>
                <div className="p-2 bg-light rounded">
                  <div><strong>Movimento:</strong> {lifts.find(l => l.key === lifting.lift)?.name}</div>
                  <div><strong>Atletas no Voo:</strong> {currentFlightEntries.length}</div>
                  <div><strong>Voo:</strong> {lifting.flight} | <strong>Dia:</strong> {lifting.day} | <strong>Plataforma:</strong> {lifting.platform}</div>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lista de Atletas */}
      {currentFlightEntries.length === 0 ? (
        <Alert variant="warning">
          <FaWeightHanging className="me-2" />
          Nenhum atleta encontrado no voo atual. Verifique a configuração de voos.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Atletas - {lifts.find(l => l.key === lifting.lift)?.name} ({currentFlightEntries.length} atletas)</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Peso</th>
                  <th>1ª Tentativa</th>
                  <th>2ª Tentativa</th>
                  <th>3ª Tentativa</th>
                  {meet.allow4thAttempts && <th>4ª Tentativa</th>}
                  <th>Melhor</th>
                  <th>Total</th>
                  <th>Próxima</th>
                </tr>
              </thead>
              <tbody>
                {currentFlightEntries.map((entry, index) => {
                  const nextAttempt = getNextAttempt(entry, lifting.lift);
                  const bestLift = getBestLift(entry, lifting.lift);
                  const total = getTotal(entry);
                  
                  return (
                    <tr key={entry.id} className={nextAttempt ? 'table-warning' : ''}>
                      <td>
                        <Badge bg="dark">#{entry.lotNumber || '-'}</Badge>
                      </td>
                      <td>
                        <strong>{entry.name}</strong>
                        <div className="text-muted small">
                          {entry.sex === 'M' ? 'Masculino' : 'Feminino'} | {entry.division}
                        </div>
                      </td>
                      <td>
                        <Badge bg="success">
                          {getWeightClassLabel(entry.weightClassKg, entry.sex)}
                        </Badge>
                      </td>
                      <td>
                        <strong>{entry.bodyweightKg || '-'} kg</strong>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => handleAttemptClick(entry, 1)}
                        >
                          {getAttemptBadge(getAttemptWeight(entry, lifting.lift, 1))}
                        </Button>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => handleAttemptClick(entry, 2)}
                        >
                          {getAttemptBadge(getAttemptWeight(entry, lifting.lift, 2))}
                        </Button>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => handleAttemptClick(entry, 3)}
                        >
                          {getAttemptBadge(getAttemptWeight(entry, lifting.lift, 3))}
                        </Button>
                      </td>
                      {meet.allow4thAttempts && (
                        <td>
                          <Button
                            variant="link"
                            className="p-0"
                            onClick={() => handleAttemptClick(entry, 4)}
                          >
                            {getAttemptBadge(getAttemptWeight(entry, lifting.lift, 4))}
                          </Button>
                        </td>
                      )}
                      <td>
                        {bestLift > 0 ? (
                          <Badge bg="primary">{bestLift} kg</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {total > 0 ? (
                          <Badge bg="success">{total} kg</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {nextAttempt ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAttemptClick(entry, nextAttempt)}
                          >
                            <FaPlay className="me-1" />
                            {nextAttempt}ª
                          </Button>
                        ) : (
                          <Badge bg="secondary">Completo</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Modal de Tentativa */}
      <Modal show={showAttemptModal} onHide={() => setShowAttemptModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Registrar Tentativa - {selectedEntry?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <Row>
              <Col md={12}>
                <Alert variant="info">
                  <h6>Informações da Tentativa:</h6>
                  <p><strong>Atleta:</strong> {selectedEntry.name}</p>
                  <p><strong>Movimento:</strong> {lifts.find(l => l.key === lifting.lift)?.name}</p>
                  <p><strong>Tentativa:</strong> {selectedAttempt}ª</p>
                  <p><strong>Categoria:</strong> {getWeightClassLabel(selectedEntry.weightClassKg, selectedEntry.sex)}</p>
                </Alert>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Peso Tentado (kg) *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={attemptWeight}
                      onChange={(e) => setAttemptWeight(e.target.value)}
                      placeholder="Ex: 100"
                      step="0.5"
                      min="0"
                    />
                    <InputGroup.Text>kg</InputGroup.Text>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Resultado *</Form.Label>
                  <div className="d-flex gap-2">
                    <Button
                      variant={attemptResult === 'good' ? 'success' : 'outline-success'}
                      onClick={() => setAttemptResult('good')}
                      className="flex-fill"
                    >
                      <FaCheck className="me-2" />
                      Boa (Branca)
                    </Button>
                    <Button
                      variant={attemptResult === 'no-lift' ? 'danger' : 'outline-danger'}
                      onClick={() => setAttemptResult('no-lift')}
                      className="flex-fill"
                    >
                      <FaTimes className="me-2" />
                      Nula (Vermelha)
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttemptModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveAttempt}
            disabled={!attemptWeight || !attemptResult}
          >
            Salvar Tentativa
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Lifting;
