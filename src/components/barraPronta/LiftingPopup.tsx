import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { markAttempt } from '../../actions/barraProntaActions';
import { Lift } from '../../types/barraProntaTypes';
import LiftingTable from './LiftingTable';
import './LiftingPopup.css';

const LiftingPopup: React.FC = () => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);
  const meet = useSelector((state: RootState) => state.meet);

  // Debug: mostrar estado atual
  console.log('🔍 LiftingPopup - Estado atual:', { 
    day, platform, flight, lift, attemptOneIndexed, 
    selectedEntryId, selectedAttempt, isAttemptActive 
  });
  console.log('🔍 LiftingPopup - Total de atletas:', entries.length);

  // Estados para controle da janela popup
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  // Filtrar atletas pelo dia, plataforma e grupo atual
  const entriesInFlight = entries.filter((entry: any) => 
    entry.day === day && 
    entry.platform === platform && 
    entry.flight === flight
  );

  console.log('🔍 LiftingPopup - Atletas filtrados:', entriesInFlight.length, { day, platform, flight });

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingPopup - Estado mudou, atualizando...', {
      day, platform, flight, lift, attemptOneIndexed,
      selectedEntryId, selectedAttempt, isAttemptActive,
      totalEntries: entries.length,
      filteredEntries: entriesInFlight.length
    });
  }, [day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive, entries, entriesInFlight]);

  // Detectar mudanças no tamanho da janela
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Definir tamanho inicial

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handlers para os dropdowns
  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(event.target.value);
    console.log('🎯 Popup - handleDayChange chamado:', { newDay });
    dispatch({ type: 'lifting/setDay', payload: newDay });
  };

  const handlePlatformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = parseInt(event.target.value);
    console.log('🎯 Popup - handlePlatformChange chamado:', { newPlatform });
    dispatch({ type: 'lifting/setPlatform', payload: newPlatform });
  };

  const handleLiftChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLift = event.target.value as Lift;
    dispatch({ type: 'lifting/setLift', payload: newLift });
  };

  const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFlight = event.target.value;
    console.log('🎯 Popup - handleFlightChange chamado:', { newFlight });
    dispatch({ type: 'lifting/setFlight', payload: newFlight });
  };

  const handleAttemptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAttempt = parseInt(event.target.value);
    console.log('🎯 Popup - handleAttemptChange chamado:', { newAttempt, selectedEntryId });
    
    dispatch({ type: 'lifting/setSelectedAttempt', payload: newAttempt });
    
    if (selectedEntryId) {
      console.log('✅ Atualizando tentativa para atleta selecionado:', selectedEntryId, newAttempt);
      dispatch({ type: 'lifting/selectAthleteAndAttempt', payload: { entryId: selectedEntryId, attempt: newAttempt } });
    }
  };

  const handleAthleteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const entryId = parseInt(event.target.value);
    console.log('🎯 Popup - handleAthleteChange chamado:', { entryId, selectedAttempt });
    
    if (entryId > 0) {
      console.log('✅ Selecionando atleta:', entryId, 'tentativa:', selectedAttempt);
      dispatch({ type: 'lifting/selectAthleteAndAttempt', payload: { entryId, attempt: selectedAttempt } });
    } else {
      console.log('❌ Desmarcando seleção');
      dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
      dispatch({ type: 'lifting/setAttemptActive', payload: false });
    }
  };

  // Handlers para as ações
  const handleGoodLift = () => {
    console.log('🎯 Popup - handleGoodLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      console.log('✅ Marcando Good Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 1, 0) as any);
      console.log(`Good Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
      
      // CORREÇÃO: Navegar automaticamente para o próximo após marcar Good Lift
      // Implementar lógica similar ao LiftingFooter
      navigateToNextAfterAttempt();
    } else {
      console.log('❌ Não é possível marcar Good Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  const handleNoLift = () => {
    console.log('🎯 Popup - handleNoLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      console.log('✅ Marcando No Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 2, 0) as any);
      console.log(`No Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
      
      // CORREÇÃO: Navegar automaticamente para o próximo após marcar No Lift
      // Implementar lógica similar ao LiftingFooter
      navigateToNextAfterAttempt();
    } else {
      console.log('❌ Não é possível marcar No Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  // CORREÇÃO: Função para navegar para o próximo após marcar tentativa
  const navigateToNextAfterAttempt = () => {
    // Implementar lógica de navegação similar ao LiftingFooter
    // Por enquanto, apenas resetar a seleção para permitir seleção manual
    dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
    dispatch({ type: 'lifting/setAttemptActive', payload: false });
    console.log('🔄 Tentativa marcada, resetando seleção para próxima seleção manual');
  };

  // Função para fechar a janela popup
  const closePopup = () => {
    window.close();
  };

  // Função para maximizar a janela popup
  const maximizePopup = () => {
    if (window.screen.availWidth && window.screen.availHeight) {
      window.resizeTo(window.screen.availWidth - 40, window.screen.availHeight - 40);
      window.moveTo(20, 20);
    }
  };

  // Função para minimizar a janela popup
  const minimizePopup = () => {
    window.resizeTo(400, 300);
    window.moveTo(20, 20);
  };

  // Gerar opções para os dropdowns
  const generateDayOptions = () => {
    const days = [];
    for (let i = 1; i <= (meet.lengthDays || 2); i++) {
      days.push(<option key={i} value={i}>Dia {i}</option>);
    }
    return days;
  };

  const generatePlatformOptions = () => {
    const platforms = [];
    const maxPlatforms = meet.platformsOnDays?.[day - 1] || 1;
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

  const generateAthleteOptions = () => {
    const options = [
      <option key="0" value="0">Selecione um atleta</option>
    ];
    
    entriesInFlight.forEach(entry => {
      options.push(
        <option key={entry.id} value={entry.id}>
          {entry.name} - {entry.weightClass}
        </option>
      );
    });
    
    return options;
  };

  return (
    <div className="lifting-popup">
      {/* Cabeçalho da janela popup */}
      <div className="popup-header">
        <div className="header-title">
          <span>🏋️ Tabela de Levantamentos - {lift === 'S' ? 'Agachamento' : lift === 'B' ? 'Supino' : 'Levantamento Terra'}</span>
          <span className="popup-indicator">🪟</span>
        </div>
        <div className="header-controls">
          <Button size="sm" variant="outline-secondary" onClick={minimizePopup} title="Minimizar">
            <span>−</span>
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={maximizePopup} title="Maximizar">
            <span>⧉</span>
          </Button>
          <Button size="sm" variant="outline-danger" onClick={closePopup} title="Fechar">
            <span>✕</span>
          </Button>
        </div>
      </div>

      {/* Conteúdo da janela popup - APENAS TABELA DE VISUALIZAÇÃO */}
      <div className="popup-content">
        {/* Tabela de levantamentos - APENAS PARA VISUALIZAÇÃO */}
        <div className="table-section">
          {entriesInFlight.length === 0 ? (
            <div className="no-athletes-message">
              <div className="alert alert-info text-center">
                <strong>📊 Aguardando dados da tela principal...</strong><br />
                Configure os levantamentos na tela principal para ver os dados aqui
              </div>
            </div>
          ) : (
            <LiftingTable
              orderedEntries={entriesInFlight}
              currentEntryId={selectedEntryId}
              attemptOneIndexed={selectedAttempt}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LiftingPopup;
