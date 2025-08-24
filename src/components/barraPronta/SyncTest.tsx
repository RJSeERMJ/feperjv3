import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';

const SyncTest: React.FC = () => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);

  const testSync = (action: string) => {
    console.log(`🧪 Teste de sincronização: ${action}`);
    
    switch (action) {
      case 'day':
        dispatch({ type: 'lifting/setDay', payload: day === 1 ? 2 : 1 });
        break;
      case 'platform':
        dispatch({ type: 'lifting/setPlatform', payload: platform === 1 ? 2 : 1 });
        break;
      case 'flight':
        dispatch({ type: 'lifting/setFlight', payload: flight === 'A' ? 'B' : 'A' });
        break;
      case 'lift':
        dispatch({ type: 'lifting/setLift', payload: lift === 'S' ? 'B' : lift === 'B' ? 'D' : 'S' });
        break;
      case 'attempt':
        dispatch({ type: 'lifting/setAttemptOneIndexed', payload: attemptOneIndexed === 1 ? 2 : 1 });
        break;
      case 'athlete':
        if (entries.length > 0) {
          const newId = selectedEntryId === entries[0].id ? (entries[1]?.id || entries[0].id) : entries[0].id;
          dispatch({ type: 'lifting/setSelectedEntryId', payload: newId });
        }
        break;
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header>
        <h6 className="mb-0">🧪 Teste de Sincronização</h6>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-6">
            <h6>Estado Atual:</h6>
            <div className="small">
              <div>Dia: {day}</div>
              <div>Plataforma: {platform}</div>
              <div>Grupo: {flight}</div>
              <div>Movimento: {lift === 'S' ? 'Agachamento' : lift === 'B' ? 'Supino' : 'Terra'}</div>
              <div>Tentativa: {attemptOneIndexed}</div>
              <div>Atleta Selecionado: {selectedEntryId || 'Nenhum'}</div>
              <div>Total de Atletas: {entries.length}</div>
            </div>
          </div>
          <div className="col-md-6">
            <h6>Testes:</h6>
            <div className="d-grid gap-2">
              <Button size="sm" variant="outline-primary" onClick={() => testSync('day')}>
                Alternar Dia
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => testSync('platform')}>
                Alternar Plataforma
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => testSync('flight')}>
                Alternar Grupo
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => testSync('lift')}>
                Próximo Movimento
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => testSync('attempt')}>
                Alternar Tentativa
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => testSync('athlete')}>
                Alternar Atleta
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SyncTest;
