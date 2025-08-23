import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Badge, Image } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { Lift } from '../../types/barraProntaTypes';
import BarLoad from '../barraPronta/BarLoad';
import './LeftCard.css';

interface LeftCardProps {
  currentEntryId: number | null;
  nextEntryId: number | null;
  lift: Lift;
  attemptOneIndexed: number;
  entries: any[];
}

const LeftCard: React.FC<LeftCardProps> = ({
  currentEntryId,
  nextEntryId,
  lift,
  attemptOneIndexed,
  entries
}) => {
  const meet = useSelector((state: RootState) => state.meet);

  // Encontrar o atleta atual
  const currentEntry = currentEntryId ? entries.find((e: any) => e.id === currentEntryId) : null;
  
  // Encontrar o próximo atleta
  const nextEntry = nextEntryId ? entries.find((e: any) => e.id === nextEntryId) : null;

  // Obter o peso atual baseado no movimento e tentativa
  const getCurrentWeight = (): number => {
    if (!currentEntry) return 0;
    
    const weightField = lift === 'S' ? `squat${attemptOneIndexed}` : 
                       lift === 'B' ? `bench${attemptOneIndexed}` : 
                       `deadlift${attemptOneIndexed}`;
    
    return currentEntry[weightField] || 0;
  };

  // Obter o nome do movimento
  const getLiftName = (): string => {
    switch (lift) {
      case 'S': return 'Agachamento';
      case 'B': return 'Supino';
      case 'D': return 'Terra';
      default: return 'Movimento';
    }
  };

  // Obter o peso da barra + colares
  const getBarWeight = (): number => {
    switch (lift) {
      case 'S': return meet.squatBarAndCollarsWeightKg;
      case 'B': return meet.benchBarAndCollarsWeightKg;
      case 'D': return meet.deadliftBarAndCollarsWeightKg;
      default: return 20;
    }
  };

  return (
    <div className="left-card-container">
      {/* Card do Atleta Atual */}
      {currentEntry && (
        <Card className="current-athlete-card mb-3">
          <Card.Header className="current-athlete-header">
            <h5 className="mb-0">🏋️ Atleta Atual</h5>
          </Card.Header>
          <Card.Body>
            <div className="athlete-info">
              <h6 className="athlete-name">{currentEntry.name}</h6>
              <div className="athlete-details">
                <Badge bg="secondary" className="me-1">
                  {currentEntry.sex === 'M' ? 'M' : 'F'}
                </Badge>
                <Badge bg="info" className="me-1">
                  {currentEntry.weightClass}
                </Badge>
                <Badge bg="warning" text="dark">
                  {currentEntry.team || 'Sem equipe'}
                </Badge>
              </div>
            </div>
            
            <div className="lift-info mt-3">
              <h6 className="lift-title">{getLiftName()} - {attemptOneIndexed}ª Tentativa</h6>
              <div className="weight-display">
                <span className="weight-value">{getCurrentWeight()} kg</span>
                <span className="weight-label">Peso da Tentativa</span>
              </div>
            </div>

            {/* Visualização da Carga da Barra */}
            <div className="bar-load-section mt-3">
              <h6 className="bar-load-title">Carga da Barra</h6>
              <BarLoad 
                weightKg={getCurrentWeight()}
                rackInfo={getBarWeight().toString()}
              />
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Card do Próximo Atleta */}
      {nextEntry && (
        <Card className="next-athlete-card">
          <Card.Header className="next-athlete-header">
            <h5 className="mb-0">⏭️ Próximo Atleta</h5>
          </Card.Header>
          <Card.Body>
            <div className="athlete-info">
              <h6 className="athlete-name">{nextEntry.name}</h6>
              <div className="athlete-details">
                <Badge bg="secondary" className="me-1">
                  {nextEntry.sex === 'M' ? 'M' : 'F'}
                </Badge>
                <Badge bg="info" className="me-1">
                  {nextEntry.weightClass}
                </Badge>
                <Badge bg="warning" text="dark">
                  {nextEntry.team || 'Sem equipe'}
                </Badge>
              </div>
            </div>
            
            <div className="next-lift-info mt-3">
              <h6 className="next-lift-title">Próximo: {getLiftName()}</h6>
              <div className="next-weight-display">
                <span className="next-weight-value">
                  {(() => {
                    const weightField = lift === 'S' ? `squat${attemptOneIndexed}` : 
                                       lift === 'B' ? `bench${attemptOneIndexed}` : 
                                       `deadlift${attemptOneIndexed}`;
                    return nextEntry[weightField] || 'Não definido';
                  })()} kg
                </span>
                <span className="next-weight-label">Peso da Próxima Tentativa</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Card de Informações da Competição */}
      <Card className="competition-info-card mt-3">
        <Card.Header>
          <h6 className="mb-0">📋 Informações da Competição</h6>
        </Card.Header>
        <Card.Body>
          <div className="competition-details">
            <div className="detail-item">
              <span className="detail-label">Competição:</span>
              <span className="detail-value">{meet.name || 'Não definida'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Local:</span>
              <span className="detail-value">{meet.city}, {meet.state}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data:</span>
              <span className="detail-value">{meet.date || 'Não definida'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Federação:</span>
              <span className="detail-value">{meet.federation}</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LeftCard;
