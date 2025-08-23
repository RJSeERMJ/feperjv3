import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Badge, Row, Col } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { setLift, nextLift, previousLift } from '../../reducers/liftingReducer';
import { Lift } from '../../types/barraProntaTypes';
import './LiftingHeader.css';

const LiftingHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { lift, day, platform, flight } = useSelector((state: RootState) => state.lifting);

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

  return (
    <div className="lifting-header">
      <Row className="align-items-center">
        <Col md={4}>
          <div className="competition-info">
            <h4 className="mb-0">
              <Badge bg="primary" className="me-2">Dia {day}</Badge>
              <Badge bg="secondary" className="me-2">Plataforma {platform}</Badge>
              <Badge bg="info">Grupo {flight}</Badge>
            </h4>
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
