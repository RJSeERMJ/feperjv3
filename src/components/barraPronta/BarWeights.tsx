import React from 'react';
import { Row, Col, Form, Card } from 'react-bootstrap';
import { FaWeightHanging } from 'react-icons/fa';

interface BarWeightsProps {
  squatBarAndCollarsWeightKg: number;
  benchBarAndCollarsWeightKg: number;
  deadliftBarAndCollarsWeightKg: number;
  onWeightChange: (lift: 'S' | 'B' | 'D', weight: number) => void;
}

const BarWeights: React.FC<BarWeightsProps> = ({
  squatBarAndCollarsWeightKg,
  benchBarAndCollarsWeightKg,
  deadliftBarAndCollarsWeightKg,
  onWeightChange
}) => {
  const handleWeightChange = (lift: 'S' | 'B' | 'D', value: string) => {
    const weight = parseFloat(value);
    if (!isNaN(weight) && weight >= 0 && weight <= 1000) {
      onWeightChange(lift, weight);
    }
  };

  const validateWeight = (weight: number): boolean => {
    return weight >= 5 && weight <= 1000;
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>
          <FaWeightHanging className="me-2" />
          Pesos das Barras e Colares
        </h5>
        <small className="text-muted">
          Configure o peso das barras e colares para cada movimento (em kg)
        </small>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Agachamento (kg)</strong>
              </Form.Label>
              <Form.Control
                type="number"
                value={squatBarAndCollarsWeightKg}
                onChange={(e) => handleWeightChange('S', e.target.value)}
                step="0.5"
                min="5"
                max="1000"
                isValid={validateWeight(squatBarAndCollarsWeightKg)}
                isInvalid={!validateWeight(squatBarAndCollarsWeightKg)}
              />
              <Form.Control.Feedback type="invalid">
                Peso deve estar entre 5 e 1000 kg
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Peso padrão: 20 kg
              </Form.Text>
            </Form.Group>
          </Col>
          
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Supino (kg)</strong>
              </Form.Label>
              <Form.Control
                type="number"
                value={benchBarAndCollarsWeightKg}
                onChange={(e) => handleWeightChange('B', e.target.value)}
                step="0.5"
                min="5"
                max="1000"
                isValid={validateWeight(benchBarAndCollarsWeightKg)}
                isInvalid={!validateWeight(benchBarAndCollarsWeightKg)}
              />
              <Form.Control.Feedback type="invalid">
                Peso deve estar entre 5 e 1000 kg
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Peso padrão: 20 kg
              </Form.Text>
            </Form.Group>
          </Col>
          
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>
                <strong>Terra (kg)</strong>
              </Form.Label>
              <Form.Control
                type="number"
                value={deadliftBarAndCollarsWeightKg}
                onChange={(e) => handleWeightChange('D', e.target.value)}
                step="0.5"
                min="5"
                max="1000"
                isValid={validateWeight(deadliftBarAndCollarsWeightKg)}
                isInvalid={!validateWeight(deadliftBarAndCollarsWeightKg)}
              />
              <Form.Control.Feedback type="invalid">
                Peso deve estar entre 5 e 1000 kg
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Peso padrão: 25 kg
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        <div className="alert alert-info">
          <strong>Nota:</strong> Estes pesos são adicionados automaticamente ao calcular o peso total da barra.
          As placas configuradas abaixo serão carregadas sobre estes pesos base.
        </div>
      </Card.Body>
    </Card>
  );
};

export default BarWeights;
