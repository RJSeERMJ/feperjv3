import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Card, Badge } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { Lift } from '../../types/barraProntaTypes';
import { recordsService } from '../../services/recordsService';
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
  
  // Estado para controlar a verificação de records
  const [recordInfo, setRecordInfo] = useState<{
    isRecord: boolean;
    recordDivisions: string[];
    currentRecords: any[];
    recordDetails: Array<{
      division: string;
      currentRecord: number;
      isNewRecord: boolean;
    }>;
  } | null>(null);
  const [isCheckingRecord, setIsCheckingRecord] = useState(false);

  // Encontrar o atleta atual
  const currentEntry = currentEntryId ? entries.find((e: any) => e.id === currentEntryId) : null;
  
  // Encontrar o próximo atleta
  const nextEntry = nextEntryId ? entries.find((e: any) => e.id === nextEntryId) : null;

  // Obter o peso atual baseado no movimento e tentativa
  const getCurrentWeight = useCallback((): number => {
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
  }, [currentEntry, lift, attemptOneIndexed, currentEntryId]);

  // Obter o nome do movimento
  const getLiftName = (): string => {
    switch (lift) {
      case 'S': return 'Agachamento';
      case 'B': return 'Supino';
      case 'D': return 'Terra';
      default: return 'Movimento';
    }
  };

  // Obter o tipo de competição do atleta
  const getCompetitionType = (entry: any): string => {
    if (!entry?.movements) return 'N/A';
    
    // Se há vírgula, pegar o primeiro tipo
    if (entry.movements.includes(',')) {
      return entry.movements.split(',')[0].trim();
    }
    
    return entry.movements.trim();
  };


  // Função para verificar se o peso atual é record
  const checkRecord = useCallback(async (weight: number, entry: any) => {
    if (!weight || weight <= 0 || !entry) {
      setRecordInfo(null);
      return;
    }

    setIsCheckingRecord(true);
    try {
      // Mapear movimento para o formato do recordsService
      const movementMap: { [key in Lift]: 'squat' | 'bench' | 'deadlift' } = {
        'S': 'squat',
        'B': 'bench',
        'D': 'deadlift'
      };

      const movement = movementMap[lift];
      
      // Obter tipo de competição (assumindo que está no meet ou pode ser inferido)
      const competitionType = meet.allowedMovements?.join('') || 'AST';

      const result = await recordsService.checkRecordAttempt(
        weight,
        movement,
        {
          sex: entry.sex,
          age: entry.age,
          weightClass: entry.weightClass,
          division: entry.division,
          equipment: entry.equipment,
          movements: entry.movements // Adicionar tipos de competição do atleta
        },
        competitionType
      );

      setRecordInfo(result);
    } catch (error) {
      console.error('❌ Erro ao verificar record:', error);
      setRecordInfo(null);
    } finally {
      setIsCheckingRecord(false);
    }
  }, [lift, meet.allowedMovements]);

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
      
      // Verificar se é record quando o peso muda
      const currentWeight = getCurrentWeight();
      if (currentWeight > 0) {
        checkRecord(currentWeight, currentEntry);
      } else {
        setRecordInfo(null);
      }
    } else {
      setRecordInfo(null);
    }
  }, [currentEntryId, nextEntryId, lift, attemptOneIndexed, day, platform, flight, entries, currentEntry, checkRecord, getCurrentWeight]);

  return (
    <div className="left-card-container">
      {/* Card do Atleta Atual */}
      {currentEntry && (
        <Card className="current-athlete-card mb-3">
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
                <Badge bg="warning" text="dark" className="me-1">
                  {currentEntry.team || 'Sem equipe'}
                </Badge>
                <Badge bg="primary" className="me-1">
                  {getCompetitionType(currentEntry)}
                </Badge>
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
                
                {/* Indicativo de Record */}
                {isCheckingRecord && (
                  <div className="record-checking">
                    <small className="text-muted">Verificando record...</small>
                  </div>
                )}
                
                {recordInfo && recordInfo.isRecord && !isCheckingRecord && (
                  <div className="record-indicator">
                    <div className="record-badge">
                      🏆 RECORD
                    </div>
                    <div className="record-divisions">
                      {recordInfo.recordDetails
                        .filter(detail => detail.isNewRecord)
                        .map((detail, index) => (
                          <span key={index} className="record-division">
                            {detail.division}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
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
                <Badge bg="warning" text="dark" className="me-1">
                  {nextEntry.team || 'Sem equipe'}
                </Badge>
                <Badge bg="primary" className="me-1">
                  {getCompetitionType(nextEntry)}
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
