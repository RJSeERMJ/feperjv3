import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/barraProntaStore';
import { setDay, setPlatform, setFlight, setLift, setAttemptOneIndexed } from '../reducers/liftingReducer';
import { getLiftingOrder } from '../logic/liftingOrder';
import LiftingHeader from '../components/barraPronta/LiftingHeader';
import LeftCard from '../components/barraPronta/LeftCard';
import LiftingTable from '../components/barraPronta/LiftingTable';
import './LiftingPage.css';

const LiftingPage: React.FC = () => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);

  // Filtrar atletas pelo grupo atual
  const entriesInFlight = entries.filter((entry: any) => entry.flight === flight);

  // Obter a ordem de levantamentos
  const liftingOrder = getLiftingOrder(entriesInFlight, {
    day,
    platform,
    flight,
    lift,
    attemptOneIndexed,
    overrideEntryId: null,
    overrideAttempt: null
  });

  // Atualizar estado quando mudar
  useEffect(() => {
    if (liftingOrder.currentEntryId !== null) {
      dispatch(setAttemptOneIndexed(liftingOrder.attemptOneIndexed));
    }
  }, [liftingOrder.currentEntryId, liftingOrder.attemptOneIndexed, dispatch]);

  // Verificar se há tentativas pendentes
  const hasPendingAttempts = entriesInFlight.some((entry: any) => {
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [];
    return statusArray.some((status: any) => status === 0);
  });

  return (
    <div className="lifting-page">
      <div className="lifting-container">
        {/* Cabeçalho com controles */}
        <LiftingHeader />

        <div className="lifting-content">
          {/* Card da esquerda com informações do atleta atual */}
          <div className="left-panel">
            <LeftCard
              currentEntryId={liftingOrder.currentEntryId}
              nextEntryId={liftingOrder.nextEntryId}
              lift={lift}
              attemptOneIndexed={attemptOneIndexed}
              entries={entriesInFlight}
            />
          </div>

          {/* Tabela principal de levantamentos */}
          <div className="right-panel">
            <LiftingTable
              orderedEntries={liftingOrder.orderedEntries}
              currentEntryId={liftingOrder.currentEntryId}
              attemptOneIndexed={attemptOneIndexed}
            />
          </div>
        </div>

        {/* Estatísticas da sessão */}
        <div className="session-stats">
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-value">
                {entriesInFlight.filter((entry: any) => {
                  const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
                  const statusArray = entry[statusField] || [];
                  return statusArray.some((status: any) => status === 1);
                }).length}
              </div>
              <div className="stat-label">Good Lifts</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">
                {entriesInFlight.filter((entry: any) => {
                  const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
                  const statusArray = entry[statusField] || [];
                  return statusArray.some((status: any) => status === 2);
                }).length}
              </div>
              <div className="stat-label">No Lifts</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">
                {entriesInFlight.filter((entry: any) => {
                  const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
                  const statusArray = entry[statusField] || [];
                  return statusArray.some((status: any) => status === 3);
                }).length}
              </div>
              <div className="stat-label">DNS</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">
                {entriesInFlight.filter((entry: any) => {
                  const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
                  const statusArray = entry[statusField] || [];
                  return statusArray.some((status: any) => status === 0);
                }).length}
              </div>
              <div className="stat-label">Pendentes</div>
            </div>
          </div>
        </div>

        {/* Mensagem se não há tentativas pendentes */}
        {!hasPendingAttempts && (
          <div className="no-pending-attempts">
            <div className="alert alert-info">
              <strong>Parabéns!</strong> Todas as tentativas deste movimento foram concluídas.
              {lift === 'S' && <button 
                className="btn btn-primary ms-3" 
                onClick={() => dispatch(setLift('B'))}
              >
                Próximo: Supino
              </button>}
              {lift === 'B' && <button 
                className="btn btn-primary ms-3" 
                onClick={() => dispatch(setLift('D'))}
              >
                Próximo: Terra
              </button>}
              {lift === 'D' && <button 
                className="btn btn-primary ms-3" 
                onClick={() => dispatch(setLift('S'))}
              >
                Próximo: Agachamento
              </button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiftingPage;
