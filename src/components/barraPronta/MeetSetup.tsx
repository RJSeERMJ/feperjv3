import React, { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Card, 
  Alert,
  Table,
  Badge
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Plate } from '../../types/barraProntaTypes';
import { updateMeet } from '../../actions/barraProntaActions';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import BarWeights from './BarWeights';
import PlatesManager from './PlatesManager';

const MeetSetup: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  
     const [formData, setFormData] = useState({
     name: meet.name,
     country: meet.country,
     state: meet.state,
     city: meet.city,
     federation: meet.federation,
     date: meet.date,
     lengthDays: meet.lengthDays,
     platformsOnDays: meet.platformsOnDays,
     formula: meet.formula,
     combineSleevesAndWraps: meet.combineSleevesAndWraps,
     combineSingleAndMulti: meet.combineSingleAndMulti,
     allow4thAttempts: meet.allow4thAttempts,
     roundTotalsDown: meet.roundTotalsDown,
     inKg: meet.inKg,
     squatBarAndCollarsWeightKg: meet.squatBarAndCollarsWeightKg,
     benchBarAndCollarsWeightKg: meet.benchBarAndCollarsWeightKg,
     deadliftBarAndCollarsWeightKg: meet.deadliftBarAndCollarsWeightKg,
     showAlternateUnits: meet.showAlternateUnits
   });

     // Atualizar formData quando o estado do Redux mudar
   React.useEffect(() => {
     setFormData({
       name: meet.name,
       country: meet.country,
       state: meet.state,
       city: meet.city,
       federation: meet.federation,
       date: meet.date,
       lengthDays: meet.lengthDays,
       platformsOnDays: meet.platformsOnDays,
       formula: meet.formula,
       combineSleevesAndWraps: meet.combineSleevesAndWraps,
       combineSingleAndMulti: meet.combineSingleAndMulti,
       allow4thAttempts: meet.allow4thAttempts,
       roundTotalsDown: meet.roundTotalsDown,
       inKg: meet.inKg,
       squatBarAndCollarsWeightKg: meet.squatBarAndCollarsWeightKg,
       benchBarAndCollarsWeightKg: meet.benchBarAndCollarsWeightKg,
       deadliftBarAndCollarsWeightKg: meet.deadliftBarAndCollarsWeightKg,
       showAlternateUnits: meet.showAlternateUnits
     });
   }, [meet]);

  const [newDivision, setNewDivision] = useState('');
  const [newWeightClass, setNewWeightClass] = useState('');
  const [weightClassSex, setWeightClassSex] = useState<'M' | 'F'>('M');

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBarWeightChange = (lift: 'S' | 'B' | 'D', weight: number) => {
    let updateData: any = {};
    
    switch (lift) {
      case 'S':
        updateData = { squatBarAndCollarsWeightKg: weight };
        break;
      case 'B':
        updateData = { benchBarAndCollarsWeightKg: weight };
        break;
      case 'D':
        updateData = { deadliftBarAndCollarsWeightKg: weight };
        break;
    }
    
    dispatch(updateMeet(updateData));
  };

  const handlePlatesChange = (plates: readonly Readonly<Plate>[]) => {
    dispatch(updateMeet({ plates }));
  };

  const addDivision = () => {
    if (newDivision.trim()) {
      const updatedDivisions = [...meet.divisions, newDivision.trim()];
      dispatch(updateMeet({ divisions: updatedDivisions }));
      setNewDivision('');
    }
  };

  const removeDivision = (index: number) => {
    const updatedDivisions = meet.divisions.filter((_, i) => i !== index);
    dispatch(updateMeet({ divisions: updatedDivisions }));
  };

  const addWeightClass = () => {
    if (newWeightClass.trim()) {
      const weight = parseFloat(newWeightClass);
      if (!isNaN(weight)) {
        if (weightClassSex === 'M') {
          const updatedClasses = [...meet.weightClassesKgMen, weight].sort((a, b) => a - b);
          dispatch(updateMeet({ weightClassesKgMen: updatedClasses }));
        } else {
          const updatedClasses = [...meet.weightClassesKgWomen, weight].sort((a, b) => a - b);
          dispatch(updateMeet({ weightClassesKgWomen: updatedClasses }));
        }
        setNewWeightClass('');
      }
    }
  };

  const removeWeightClass = (weight: number, sex: 'M' | 'F') => {
    if (sex === 'M') {
      const updatedClasses = meet.weightClassesKgMen.filter(w => w !== weight);
      dispatch(updateMeet({ weightClassesKgMen: updatedClasses }));
    } else {
      const updatedClasses = meet.weightClassesKgWomen.filter(w => w !== weight);
      dispatch(updateMeet({ weightClassesKgWomen: updatedClasses }));
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h3>Configuração da Competição</h3>
          <p className="text-muted">Configure os detalhes básicos da sua competição</p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Informações Básicas</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nome da Competição *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Campeonato Estadual 2024"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data da Competição *</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>País</Form.Label>
                    <Form.Control
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cidade</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Federação</Form.Label>
                    <Form.Control
                      type="text"
                      name="federation"
                      value={formData.federation}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duração (dias)</Form.Label>
                    <Form.Control
                      type="number"
                      name="lengthDays"
                      value={formData.lengthDays}
                      onChange={handleInputChange}
                      min="1"
                      max="7"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nº Plataformas</Form.Label>
                    <Form.Control
                      type="number"
                      name="platformsOnDays"
                      value={formData.platformsOnDays[0] || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const newPlatforms = Array(formData.lengthDays).fill(value);
                        handleInputChange({
                          target: {
                            name: 'platformsOnDays',
                            value: newPlatforms
                          }
                        } as any);
                      }}
                      min="1"
                      max="10"
                      placeholder="Ex: 3"
                    />
                    <Form.Text className="text-muted">
                      Número de plataformas disponíveis por dia
                    </Form.Text>
                  </Form.Group>
                </Col>

              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5>Regras da Competição</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fórmula de Pontuação</Form.Label>
                    <Form.Select
                      name="formula"
                      value={formData.formula}
                      onChange={handleInputChange}
                    >
                      <option value="IPF">IPF</option>
                      <option value="Wilks">Wilks</option>
                      <option value="Dots">Dots</option>
                      <option value="Glossbrenner">Glossbrenner</option>
                      <option value="Schwartz">Schwartz</option>
                      <option value="NASA">NASA</option>
                      <option value="Reshel">Reshel</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unidades</Form.Label>
                    <Form.Select
                      name="inKg"
                      value={formData.inKg ? 'true' : 'false'}
                      onChange={(e) => setFormData(prev => ({ ...prev, inKg: e.target.value === 'true' }))}
                    >
                      <option value="true">Quilogramas (kg)</option>
                      <option value="false">Libras (lbs)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    name="combineSleevesAndWraps"
                    checked={formData.combineSleevesAndWraps}
                    onChange={handleInputChange}
                    label="Combinar Mangas e Bandagens"
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    name="combineSingleAndMulti"
                    checked={formData.combineSingleAndMulti}
                    onChange={handleInputChange}
                    label="Combinar Single e Multi"
                    className="mb-2"
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    name="allow4thAttempts"
                    checked={formData.allow4thAttempts}
                    onChange={handleInputChange}
                    label="Permitir 4ª Tentativa"
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    name="roundTotalsDown"
                    checked={formData.roundTotalsDown}
                    onChange={handleInputChange}
                    label="Arredondar Totais para Baixo"
                    className="mb-2"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Componente de Pesos das Barras */}
          <BarWeights
            squatBarAndCollarsWeightKg={meet.squatBarAndCollarsWeightKg}
            benchBarAndCollarsWeightKg={meet.benchBarAndCollarsWeightKg}
            deadliftBarAndCollarsWeightKg={meet.deadliftBarAndCollarsWeightKg}
            onWeightChange={handleBarWeightChange}
          />

          {/* Componente de Gerenciamento de Placas */}
          <PlatesManager
            plates={meet.plates}
            onPlatesChange={handlePlatesChange}
          />
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Divisões</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex mb-3">
                <Form.Control
                  type="text"
                  value={newDivision}
                  onChange={(e) => setNewDivision(e.target.value)}
                  placeholder="Nova divisão"
                  className="me-2"
                />
                <Button variant="primary" onClick={addDivision}>
                  <FaPlus />
                </Button>
              </div>
              
              <div>
                {meet.divisions.map((division, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <Badge bg="primary">{division}</Badge>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeDivision(index)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5>Categorias de Peso</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex mb-3">
                <Form.Control
                  type="number"
                  value={newWeightClass}
                  onChange={(e) => setNewWeightClass(e.target.value)}
                  placeholder="Peso (kg)"
                  className="me-2"
                  step="0.5"
                />
                <Form.Select
                  value={weightClassSex}
                  onChange={(e) => setWeightClassSex(e.target.value as 'M' | 'F')}
                  className="me-2"
                  style={{ width: '80px' }}
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                </Form.Select>
                <Button variant="primary" onClick={addWeightClass}>
                  <FaPlus />
                </Button>
              </div>

              <div>
                <h6>Masculino:</h6>
                <div className="mb-3">
                  {meet.weightClassesKgMen.map((weight, index) => (
                    <Badge key={index} bg="success" className="me-1 mb-1">
                      {weight}kg
                      <Button
                        variant="link"
                        size="sm"
                        className="text-white p-0 ms-1"
                        onClick={() => removeWeightClass(weight, 'M')}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>

                <h6>Feminino:</h6>
                <div>
                  {meet.weightClassesKgWomen.map((weight, index) => (
                    <Badge key={index} bg="info" className="me-1 mb-1">
                      {weight}kg
                      <Button
                        variant="link"
                        size="sm"
                        className="text-white p-0 ms-1"
                        onClick={() => removeWeightClass(weight, 'F')}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="d-flex justify-content-center">
            <Alert variant="info" className="text-center mb-0">
              <FaSave className="me-2" />
              <strong>Salvamento Automático:</strong> Todas as alterações são salvas automaticamente no sistema. 
              Use o botão "Salvar para Arquivo" na tela inicial para fazer backup da competição.
            </Alert>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default MeetSetup;
