import React, { useState } from 'react';
import { Row, Col, Form, Button, Card, Table, Badge } from 'react-bootstrap';
import { FaPlus, FaTrash, FaPalette } from 'react-icons/fa';
import { Plate } from '../../types/barraProntaTypes';

interface PlatesManagerProps {
  plates: readonly Readonly<Plate>[];
  onPlatesChange: (plates: readonly Readonly<Plate>[]) => void;
}

const PlatesManager: React.FC<PlatesManagerProps> = ({
  plates,
  onPlatesChange
}) => {
  const [newWeight, setNewWeight] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [newPairCount, setNewPairCount] = useState('1');

  // Cores padrão FEPERJ
  const defaultColors = [
    { value: '#FF0000', label: 'Vermelha (25kg)', weight: 25 },
    { value: '#0000FF', label: 'Azul (20kg)', weight: 20 },
    { value: '#FFFF00', label: 'Amarela (15kg)', weight: 15 },
    { value: '#008000', label: 'Verde (10kg)', weight: 10 },
    { value: '#000000', label: 'Preta (5kg)', weight: 5 },
    { value: '#000000', label: 'Preta (2.5kg)', weight: 2.5 },
    { value: '#000000', label: 'Preta (1.25kg)', weight: 1.25 },
    { value: '#000000', label: 'Preta (0.5kg)', weight: 0.5 },
    { value: '#000000', label: 'Preta (0.25kg)', weight: 0.25 }
  ];

  const handleAddPlate = () => {
    const weight = parseFloat(newWeight);
    const quantity = parseInt(newPairCount);
    
    if (!isNaN(weight) && weight > 0 && !isNaN(quantity) && quantity > 0) {
      // Verificar se já existe uma placa com esse peso
      const existingPlate = plates.find(p => p.weightKg === weight);
      if (existingPlate) {
        alert('Já existe uma placa com este peso. Use o botão de editar para modificar.');
        return;
      }

      const newPlate: Plate = {
        weightKg: weight,
        color: newColor,
        pairCount: quantity
      };

      const updatedPlates = [...plates, newPlate].sort((a, b) => b.weightKg - a.weightKg);
      onPlatesChange(updatedPlates);
      
      // Limpar campos
      setNewWeight('');
      setNewPairCount('1');
    } else {
      alert('Por favor, insira valores válidos para peso e quantidade.');
    }
  };

  const handleRemovePlate = (weight: number) => {
    const updatedPlates = plates.filter(p => p.weightKg !== weight);
    onPlatesChange(updatedPlates);
  };

  const handleQuickAdd = (color: string, weight: number) => {
    const existingPlate = plates.find(p => p.weightKg === weight);
    
    if (existingPlate) {
      // Se a placa já existe, aumentar a quantidade
      const updatedPlates = plates.map(p => 
        p.weightKg === weight 
          ? { ...p, pairCount: p.pairCount + 1 }
          : p
      );
      onPlatesChange(updatedPlates);
    } else {
      // Se a placa não existe, criar nova
      const newPlate: Plate = {
        weightKg: weight,
        color: color,
        pairCount: 1
      };

      const updatedPlates = [...plates, newPlate].sort((a, b) => b.weightKg - a.weightKg);
      onPlatesChange(updatedPlates);
    }
  };

  const getColorName = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      '#000000': 'Preta',
      '#008000': 'Verde',
      '#FFFF00': 'Amarela',
      '#FFFFFF': 'Branca',
      '#FF0000': 'Vermelha',
      '#0000FF': 'Azul',
      '#FFD700': 'Dourada'
    };
    return colorMap[color] || 'Personalizada';
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>
          <FaPalette className="me-2" />
          Configuração de Placas
        </h5>
        <small className="text-muted">
          Configure as placas disponíveis para carregamento das barras
        </small>
      </Card.Header>
      <Card.Body>
                 {/* Adicionar nova placa */}
         <Row className="mb-4">
           <Col md={3}>
             <Form.Group>
               <Form.Label>Peso (kg)</Form.Label>
               <Form.Control
                 type="number"
                 value={newWeight}
                 onChange={(e) => setNewWeight(e.target.value)}
                 placeholder="Ex: 25"
                 step="0.25"
                 min="0.25"
               />
             </Form.Group>
           </Col>
           <Col md={3}>
             <Form.Group>
               <Form.Label>Cor</Form.Label>
               <Form.Control
                 type="color"
                 value={newColor}
                 onChange={(e) => setNewColor(e.target.value)}
               />
             </Form.Group>
           </Col>
           <Col md={3}>
             <Form.Group>
               <Form.Label>Quantidade</Form.Label>
               <Form.Control
                 type="number"
                 value={newPairCount}
                 onChange={(e) => setNewPairCount(e.target.value)}
                 placeholder="1"
                 min="1"
                 max="100"
               />
             </Form.Group>
           </Col>
           <Col md={3}>
             <Form.Group>
               <Form.Label>&nbsp;</Form.Label>
               <Button 
                 variant="primary" 
                 onClick={handleAddPlate}
                 className="w-100"
                 disabled={!newWeight}
               >
                 <FaPlus className="me-2" />
                 Adicionar Placa
               </Button>
             </Form.Group>
           </Col>
         </Row>

                 {/* Placas padrão IPF */}
        <div className="mb-4">
                     <h6>Placas Padrão IPF (Clique para adicionar):</h6>
          <div className="d-flex flex-wrap gap-2">
            {defaultColors.map((colorOption) => (
              <Button
                key={colorOption.weight}
                variant="outline-secondary"
                size="sm"
                onClick={() => handleQuickAdd(colorOption.value, colorOption.weight)}

                style={{ 
                  borderColor: colorOption.value,
                  color: colorOption.value === '#FFFFFF' ? '#000' : colorOption.value
                }}
              >
                <div 
                  className="d-inline-block me-2" 
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colorOption.value,
                    borderRadius: '50%',
                    border: colorOption.value === '#FFFFFF' ? '1px solid #ccc' : 'none'
                  }}
                />
                {colorOption.weight}kg
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de placas configuradas */}
        <div>
          <h6>Placas Configuradas:</h6>
          {plates.length === 0 ? (
            <p className="text-muted">Nenhuma placa configurada. Adicione placas usando o formulário acima ou as opções padrão IPF.</p>
          ) : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Peso (kg)</th>
                  <th>Cor</th>
                  <th>Quantidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {plates.map((plate) => (
                  <tr key={plate.weightKg}>
                    <td>
                      <Badge bg="primary">{plate.weightKg} kg</Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="me-2"
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: plate.color,
                            borderRadius: '50%',
                            border: plate.color === '#FFFFFF' ? '1px solid #ccc' : 'none'
                          }}
                        />
                        {getColorName(plate.color)}
                      </div>
                    </td>
                    <td>
                      <Badge bg="secondary">{plate.pairCount || 1}</Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemovePlate(plate.weightKg)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

                 <div className="alert alert-info">
           <strong>Dica:</strong> As placas são ordenadas automaticamente por peso (maior para menor).
           Use as placas padrão IPF para configuração rápida ou crie placas personalizadas.
           Clique nas placas padrão para aumentar a quantidade automaticamente.
         </div>
      </Card.Body>
    </Card>
  );
};

export default PlatesManager;
