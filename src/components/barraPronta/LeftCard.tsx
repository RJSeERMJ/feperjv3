import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Badge, Image } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { Lift } from '../../types/barraProntaTypes';
import BarLoad from './BarLoad';
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
  const { day, platform, flight } = useSelector((state: RootState) => state.lifting);

  // Encontrar o atleta atual
  const currentEntry = currentEntryId ? entries.find((e: any) => e.id === currentEntryId) : null;
  
  // Encontrar o próximo atleta
  const nextEntry = nextEntryId ? entries.find((e: any) => e.id === nextEntryId) : null;

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LeftCard - Estado mudou, atualizando...', {
      currentEntryId, nextEntryId, lift, attemptOneIndexed,
      day, platform, flight,
      totalEntries: entries.length,
      currentEntry: currentEntry?.name,
      currentWeight: getCurrentWeight()
    });
    
    // Forçar re-render se o atleta atual mudou
    if (currentEntry) {
      console.log('✅ LeftCard - Atleta atual atualizado:', currentEntry.name, 'peso:', getCurrentWeight());
    }
  }, [currentEntryId, nextEntryId, lift, attemptOneIndexed, day, platform, flight, entries, currentEntry]);

  // Obter o peso atual baseado no movimento e tentativa
  const getCurrentWeight = (): number => {
    if (!currentEntry) return 0;
    
    const weightField = lift === 'S' ? `squat${attemptOneIndexed}` : 
                       lift === 'B' ? `bench${attemptOneIndexed}` : 
                       `deadlift${attemptOneIndexed}`;
    
    const weight = (currentEntry as any)[weightField] || 0;
    
    // Debug: mostrar peso atual
    console.log('🔍 LeftCard - Peso atual:', { 
      currentEntryId, 
      lift, 
      attemptOneIndexed, 
      weightField, 
      weight,
      currentEntry: currentEntry?.name 
    });
    
    return weight;
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
            {getCurrentWeight() > 0 && (
              <div className="bar-load-section mt-3">
                <div className="loading-bar">
                  <div className="attempt-text">{getCurrentWeight()}kg</div>
                  <div className="bar-area">
                    <BarLoad 
                      weightKg={getCurrentWeight()}
                      rackInfo={(() => {
                        if (lift === 'S' && currentEntry.squatHeight) {
                          return currentEntry.squatHeight;
                        } else if (lift === 'B' && currentEntry.benchHeight) {
                          return currentEntry.benchHeight;
                        }
                        return "";
                      })()}
                    />
                  </div>
                </div>
              </div>
            )}
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
                    return (nextEntry as any)[weightField] || 'Não definido';
                  })()} kg
                </span>
                <span className="next-weight-label">Peso da Próxima Tentativa</span>
              </div>
            </div>

            {/* Visualização da Carga da Barra do Próximo Atleta */}
            {(() => {
              const weightField = lift === 'S' ? `squat${attemptOneIndexed}` : 
                                 lift === 'B' ? `bench${attemptOneIndexed}` : 
                                 `deadlift${attemptOneIndexed}`;
              const nextWeight = (nextEntry as any)[weightField];
              return nextWeight && nextWeight > 0 ? (
                <div className="bar-load-section mt-3">
                  <div className="loading-bar">
                    <div className="attempt-text">{nextWeight}kg</div>
                    <div className="bar-area">
                      <BarLoad 
                        weightKg={nextWeight}
                        rackInfo={(() => {
                          if (lift === 'S' && nextEntry.squatHeight) {
                            return nextEntry.squatHeight;
                          } else if (lift === 'B' && nextEntry.benchHeight) {
                            return nextEntry.benchHeight;
                          }
                          return "";
                        })()}
                      />
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </Card.Body>
        </Card>
      )}


    </div>
  );
};

export default LeftCard;
