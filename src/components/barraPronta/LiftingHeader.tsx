import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Badge, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { setLift, nextLift, previousLift, setDay, setPlatform, setFlight } from '../../reducers/liftingReducer';
import { Lift } from '../../types/barraProntaTypes';
import './LiftingHeader.css';

const LiftingHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { lift, day, platform, flight } = useSelector((state: RootState) => state.lifting);
  const meet = useSelector((state: RootState) => state.meet);

  const getLiftLabel = (liftType: Lift): string => {
    switch (liftType) {
      case 'S': return 'Agachamento';
      case 'B': return 'Supino';
      case 'D': return 'Terra';
      default: return 'Desconhecido';
    }
  };

  const getLiftIcon = (liftType: Lift): string => {
    switch (liftType) {
      case 'S': return '🏋️';
      case 'B': return '💪';
      case 'D': return '🔥';
      default: return '❓';
    }
  };

  const handleLiftChange = (newLift: Lift) => {
    dispatch(setLift(newLift));
  };

  const handleNextLift = () => {
    dispatch(nextLift());
  };

  const handlePreviousLift = () => {
    dispatch(previousLift());
  };

  // Funções para manipular os dropdowns
  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(event.target.value);
    dispatch(setDay(newDay));
  };

  const handlePlatformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = parseInt(event.target.value);
    dispatch(setPlatform(newPlatform));
  };

  const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFlight = event.target.value;
    dispatch(setFlight(newFlight));
  };

  // Gerar opções para os dropdowns
  const generateDayOptions = () => {
    const days = [];
    for (let i = 1; i <= meet.lengthDays; i++) {
      days.push(<option key={i} value={i}>Dia {i}</option>);
    }
    return days;
  };

  const generatePlatformOptions = () => {
    const platforms = [];
    const maxPlatforms = meet.platformsOnDays[day - 1] || 1;
    for (let i = 1; i <= maxPlatforms; i++) {
      platforms.push(<option key={i} value={i}>Plataforma {i}</option>);
    }
    return platforms;
  };

  const generateFlightOptions = () => {
    const flights = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return flights.map(flight => (
      <option key={flight} value={flight}>Grupo {flight}</option>
    ));
  };

  // Debug: verificar valores
  console.log('=== DEBUG HEADER ===');
  console.log('Current state:', { day, platform, flight });
  console.log('Meet data:', meet);
  console.log('=== FIM DEBUG HEADER ===');

  // Função de teste para verificar se os handlers funcionam
  const testHandlers = () => {
    console.log('=== TESTE HANDLERS ===');
    console.log('Testando mudança de dia para 2...');
    dispatch(setDay(2));
    console.log('Testando mudança de plataforma para 2...');
    dispatch(setPlatform(2));
    console.log('Testando mudança de flight para B...');
    dispatch(setFlight('B'));
    console.log('=== FIM TESTE ===');
  };

  return (
    <div className="lifting-header">
      <Row className="align-items-center">
        <Col md={4}>
          <div className="competition-info">
            <h5 className="mb-3">Configuração da Sessão</h5>
                                      <Row>
               <Col md={4}>
                 <Form.Group>
                   <Form.Label className="small text-muted">Dia</Form.Label>
                   <select
                     value={day}
                     onChange={handleDayChange}
                     className="form-select-sm"
                   >
                     {generateDayOptions()}
                   </select>
                 </Form.Group>
               </Col>
               <Col md={4}>
                 <Form.Group>
                   <Form.Label className="small text-muted">Plataforma</Form.Label>
                   <select
                     value={platform}
                     onChange={handlePlatformChange}
                     className="form-select-sm"
                   >
                     {generatePlatformOptions()}
                   </select>
                 </Form.Group>
               </Col>
               <Col md={4}>
                 <Form.Group>
                   <Form.Label className="small text-muted">Grupo</Form.Label>
                   <select
                     value={flight}
                     onChange={handleFlightChange}
                     className="form-select-sm"
                   >
                     {generateFlightOptions()}
                   </select>
                 </Form.Group>
               </Col>
             </Row>
             
             {/* Botão de teste temporário */}
             <Row className="mt-2">
               <Col>
                 <button 
                   onClick={testHandlers}
                   className="btn btn-sm btn-outline-warning"
                   style={{ fontSize: '10px', padding: '2px 6px' }}
                 >
                   Testar Handlers
                 </button>
                 <small className="text-white ms-2">
                   Valores: Dia {day}, Plataforma {platform}, Grupo {flight}
                 </small>
               </Col>
             </Row>
           </div>
        </Col>
        
        <Col md={4} className="text-center">
          <div className="current-lift">
            <h2 className="mb-2">
              {getLiftIcon(lift)} {getLiftLabel(lift)}
            </h2>
            <div className="lift-navigation">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handlePreviousLift}
                className="me-2"
              >
                ← Anterior
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleNextLift}
              >
                Próximo →
              </Button>
            </div>
          </div>
        </Col>
        
        <Col md={4}>
          <div className="lift-selector">
            <div className="btn-group w-100" role="group">
              <Button
                variant={lift === 'S' ? 'primary' : 'outline-primary'}
                onClick={() => handleLiftChange('S')}
                className="flex-fill"
              >
                Agachamento
              </Button>
              <Button
                variant={lift === 'B' ? 'primary' : 'outline-primary'}
                onClick={() => handleLiftChange('B')}
                className="flex-fill"
              >
                Supino
              </Button>
              <Button
                variant={lift === 'D' ? 'primary' : 'outline-primary'}
                onClick={() => handleLiftChange('D')}
                className="flex-fill"
              >
                Terra
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LiftingHeader;
