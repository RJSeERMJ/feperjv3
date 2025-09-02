import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useLifting, useMeet } from '../../hooks/useBarraPronta';
import { getLiftName, getAttemptWeight, formatWeight } from '../../utils/barraProntaUtils';
import BarLoad from './BarLoad';
import './LeftCard.css';

interface LeftCardProps {
  currentEntryId: number | null;
  nextEntryId: number | null;
  lift: string;
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
  const { getBarAndCollarsWeight } = useMeet();

  // Encontrar o atleta atual
  const currentEntry = currentEntryId ? entries.find((e: any) => e.id === currentEntryId) : null;
  
  // Encontrar o próximo atleta
  const nextEntry = nextEntryId ? entries.find((e: any) => e.id === nextEntryId) : null;

  // Obter o peso atual baseado no movimento e tentativa
  const getCurrentWeight = (): number => {
    if (!currentEntry) return 0;
    return getAttemptWeight(currentEntry, lift as any, attemptOneIndexed);
  };

  // Obter o nome do movimento
  const getCurrentLiftName = (): string => {
    return getLiftName(lift as any);
  };

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
                <Badge bg="warning" text="dark">
                  {currentEntry.team || 'Sem equipe'}
                </Badge>
              </div>
            </div>

            {/* Visualização da Carga da Barra */}
            {getCurrentWeight() > 0 && (
              <div className="bar-load-section mt-3">
                <div className="loading-bar">
                  <div className="attempt-text">{formatWeight(getCurrentWeight())}</div>
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
          <Card.Body>
            <div className="athlete-info">
              <h6 className="athlete-name">Próximo: {nextEntry.name}</h6>
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

            {/* Visualização da Carga da Barra do Próximo */}
            {(() => {
              const nextWeight = getAttemptWeight(nextEntry, lift as any, attemptOneIndexed);
              return nextWeight > 0 ? (
                <div className="bar-load-section mt-3">
                  <div className="loading-bar">
                    <div className="attempt-text">{formatWeight(nextWeight)}</div>
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

      {/* Card de Informações da Sessão */}
      <Card className="session-info-card mt-3">
        <Card.Body>
          <h6 className="session-title">{getCurrentLiftName()}</h6>
          <div className="session-details">
            <div className="detail-item">
              <span className="detail-label">Tentativa:</span>
              <span className="detail-value">{attemptOneIndexed}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Atletas:</span>
              <span className="detail-value">{entries.length}</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LeftCard;
