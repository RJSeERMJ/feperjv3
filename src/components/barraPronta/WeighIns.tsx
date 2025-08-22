import React, { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Card, 
  Table,
  Modal,
  Badge,
  Alert,
  InputGroup
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Entry } from '../../types/barraProntaTypes';
import { updateEntry } from '../../actions/barraProntaActions';
import { FaWeightHanging, FaEdit, FaCheck, FaTimes, FaUser, FaFilter } from 'react-icons/fa';

const WeighIns: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [bodyweight, setBodyweight] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterWeighed, setFilterWeighed] = useState<'all' | 'weighed' | 'not-weighed'>('all');

  const handleWeighIn = (entry: Entry) => {
    setSelectedEntry(entry);
    setBodyweight(entry.bodyweightKg?.toString() || '');
    setLotNumber(entry.lotNumber?.toString() || '');
    setShowModal(true);
  };

  const handleSaveWeighIn = () => {
    if (!selectedEntry) return;

    const bodyweightNum = parseFloat(bodyweight);
    const lotNumberNum = parseInt(lotNumber);

    if (isNaN(bodyweightNum) || bodyweightNum <= 0) {
      alert('Peso corporal deve ser um número válido maior que zero!');
      return;
    }

    // Validar se o peso está dentro da categoria
    const weightClasses = selectedEntry.sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const maxWeight = Math.max(...weightClasses);
    
    if (bodyweightNum > maxWeight) {
      alert(`Peso corporal (${bodyweightNum}kg) excede o limite da categoria máxima (${maxWeight}kg)!`);
      return;
    }

    dispatch(updateEntry(selectedEntry.id, {
      bodyweightKg: bodyweightNum,
      lotNumber: isNaN(lotNumberNum) ? null : lotNumberNum
    }));

    setShowModal(false);
    setSelectedEntry(null);
    setBodyweight('');
    setLotNumber('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEntry(null);
    setBodyweight('');
    setLotNumber('');
  };

  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  const getWeightClassForBodyweight = (bodyweight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    for (let i = 0; i < classes.length; i++) {
      if (bodyweight <= classes[i]) {
        return classes[i];
      }
    }
    return classes[classes.length - 1]; // Categoria máxima
  };

  const isWeightValid = (bodyweight: number, targetWeightClass: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const targetIndex = classes.indexOf(targetWeightClass);
    
    if (targetIndex === 0) {
      // Primeira categoria: deve estar abaixo do limite
      return bodyweight <= targetWeightClass;
    } else if (targetIndex === classes.length - 1) {
      // Última categoria: deve estar acima do limite anterior
      const previousLimit = classes[targetIndex - 1];
      return bodyweight > previousLimit;
    } else {
      // Categorias intermediárias: deve estar entre o limite anterior e atual
      const previousLimit = classes[targetIndex - 1];
      return bodyweight > previousLimit && bodyweight <= targetWeightClass;
    }
  };

  // Filtrar entradas
  const filteredEntries = registration.entries.filter(entry => {
    if (filterSex !== 'all' && entry.sex !== filterSex) return false;
    if (filterDivision !== 'all' && entry.division !== filterDivision) return false;
    if (filterWeighed === 'weighed' && entry.bodyweightKg === null) return false;
    if (filterWeighed === 'not-weighed' && entry.bodyweightKg !== null) return false;
    return true;
  });

  const weighedCount = registration.entries.filter(entry => entry.bodyweightKg !== null).length;
  const totalCount = registration.entries.length;

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Pesagem</h3>
              <p className="text-muted">Registre o peso corporal dos atletas</p>
            </div>
            <div className="text-end">
              <Badge bg="success" className="fs-6">
                {weighedCount}/{totalCount} Atletas Pesados
              </Badge>
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
                <Form.Label>Status da Pesagem</Form.Label>
                <Form.Select
                  value={filterWeighed}
                  onChange={(e) => setFilterWeighed(e.target.value as 'all' | 'weighed' | 'not-weighed')}
                >
                  <option value="all">Todos</option>
                  <option value="weighed">Já Pesados</option>
                  <option value="not-weighed">Não Pesados</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setFilterSex('all');
                  setFilterDivision('all');
                  setFilterWeighed('all');
                }}
              >
                <FaFilter className="me-2" />
                Limpar Filtros
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredEntries.length === 0 ? (
        <Alert variant="info">
          <FaUser className="me-2" />
          Nenhum atleta encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Lista de Pesagem ({filteredEntries.length} atletas)</h5>
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
                  <th>Peso Corporal</th>
                  <th>Número do Lote</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => {
                  const isWeighed = entry.bodyweightKg !== null;
                  const weightClass = entry.weightClassKg;
                  const bodyweight = entry.bodyweightKg;
                  const isValidWeight = bodyweight ? isWeightValid(bodyweight, weightClass, entry.sex) : true;
                  
                  return (
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
                        {isWeighed ? (
                          <div>
                            <strong>{entry.bodyweightKg} kg</strong>
                            {!isValidWeight && (
                              <div className="text-danger small">
                                Peso fora da categoria!
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">Não pesado</span>
                        )}
                      </td>
                      <td>
                        {entry.lotNumber ? (
                          <Badge bg="warning" text="dark">
                            #{entry.lotNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {isWeighed ? (
                          <Badge bg={isValidWeight ? 'success' : 'danger'}>
                            {isValidWeight ? <FaCheck /> : <FaTimes />}
                            {isValidWeight ? 'Válido' : 'Inválido'}
                          </Badge>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Pendente
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant={isWeighed ? 'outline-primary' : 'primary'}
                          size="sm"
                          onClick={() => handleWeighIn(entry)}
                        >
                          <FaEdit className="me-1" />
                          {isWeighed ? 'Editar' : 'Pesar'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Modal de pesagem */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Pesagem - {selectedEntry?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Peso Corporal (kg) *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={bodyweight}
                      onChange={(e) => setBodyweight(e.target.value)}
                      placeholder="Ex: 75.5"
                      step="0.1"
                      min="0"
                    />
                    <InputGroup.Text>kg</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Categoria: {getWeightClassLabel(selectedEntry.weightClassKg, selectedEntry.sex)}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número do Lote</Form.Label>
                  <Form.Control
                    type="number"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="Ex: 123"
                    min="1"
                  />
                  <Form.Text className="text-muted">
                    Opcional - para controle interno
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}
          
          {selectedEntry && bodyweight && (
            <Alert variant="info">
              <h6>Informações do Atleta:</h6>
              <p><strong>Nome:</strong> {selectedEntry.name}</p>
              <p><strong>Sexo:</strong> {selectedEntry.sex === 'M' ? 'Masculino' : 'Feminino'}</p>
              <p><strong>Divisão:</strong> {selectedEntry.division}</p>
              <p><strong>Categoria:</strong> {getWeightClassLabel(selectedEntry.weightClassKg, selectedEntry.sex)}</p>
              <p><strong>Equipe:</strong> {selectedEntry.team || 'N/A'}</p>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveWeighIn}>
            Salvar Pesagem
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WeighIns;
