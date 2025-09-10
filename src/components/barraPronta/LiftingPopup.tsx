import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { markAttempt } from '../../actions/barraProntaActions';
import { Lift } from '../../types/barraProntaTypes';
import LiftingTableMirror from './LiftingTableMirror';
import './LiftingPopup.css';

const LiftingPopup: React.FC = () => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);
  const meet = useSelector((state: RootState) => state.meet);

  // Estados para controle da janela popup
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Filtrar atletas pelo dia, plataforma e grupo atual
  const entriesInFlight = entries.filter((entry: any) => 
    entry.day === day && 
    entry.platform === platform && 
    entry.flight === flight
  );

  // Sistema de reload automático a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload(); // força reload como F5
    }, 1000); // 1000 ms para não ser muito agressivo

    return () => clearInterval(interval);
  }, []);

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingPopup - Estado mudou, atualizando...', {
      day, platform, flight, lift, attemptOneIndexed,
      selectedEntryId, selectedAttempt, isAttemptActive,
      totalEntries: entries.length,
      filteredEntries: entriesInFlight.length
    });
  }, [day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive, entries, entriesInFlight]);

  // NOVO useEffect: Detectar mudanças na ordem dos atletas e selecionar automaticamente
  const lastOrderHash = useRef<string>('');
  const isAutoSelecting = useRef<boolean>(false);
  
  useEffect(() => {
    // Evitar execução se já estiver selecionando automaticamente
    if (isAutoSelecting.current) {
      return;
    }
    
    // Se a ordem dos atletas mudou, selecionar automaticamente o primeiro
    if (entriesInFlight.length > 0) {
      // Obter a ordem dos atletas baseada no peso da tentativa atual
      const { getStableOrderByWeight } = require('../../logic/liftingOrder');
      const attemptsOrdered = getStableOrderByWeight(entriesInFlight, lift, attemptOneIndexed);
      
      // Criar hash da ordem atual para detectar mudanças
      const currentOrderHash = attemptsOrdered
        .map((attempt: any) => `${attempt.entryId}:${attempt.weight}`)
        .join('|');
      
      // Só executar se a ordem realmente mudou
      if (currentOrderHash !== lastOrderHash.current && attemptsOrdered.length > 0) {
        const firstAthlete = attemptsOrdered[0];
        
        // Verificar se o primeiro atleta da lista reorganizada está selecionado
        if (selectedEntryId !== firstAthlete.entryId) {
          console.log('🔄 LiftingPopup - Ordem mudou, selecionando primeiro atleta:', firstAthlete.entryId);
          
          // Marcar que está selecionando automaticamente para evitar loops
          isAutoSelecting.current = true;
          
          // Selecionar automaticamente o primeiro atleta
          dispatch({ type: 'lifting/setSelectedEntryId', payload: firstAthlete.entryId });
          dispatch({ type: 'lifting/setSelectedAttempt', payload: attemptOneIndexed });
          dispatch({ type: 'lifting/setAttemptActive', payload: true });
          
          console.log('✅ LiftingPopup - Primeiro atleta selecionado automaticamente:', firstAthlete.entryId);
          
          // Resetar flag após um delay para permitir que o estado se atualize
          setTimeout(() => {
            isAutoSelecting.current = false;
          }, 100);
        }
        
        // Atualizar hash da ordem
        lastOrderHash.current = currentOrderHash;
      }
    }
  }, [entriesInFlight, lift, attemptOneIndexed, selectedEntryId, dispatch]);

  // Detectar mudanças no tamanho da janela
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers para os dropdowns
  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(event.target.value);
    console.log('🎯 LiftingPopup - handleDayChange chamado:', { newDay });
    dispatch({ type: 'lifting/setDay', payload: newDay });
  };

  const handlePlatformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = parseInt(event.target.value);
    console.log('🎯 LiftingPopup - handlePlatformChange chamado:', { newPlatform });
    dispatch({ type: 'lifting/setPlatform', payload: newPlatform });
  };

  const handleLiftChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLift = event.target.value as Lift;
    dispatch({ type: 'lifting/setLift', payload: newLift });
  };

  const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFlight = event.target.value;
    console.log('🎯 LiftingPopup - handleFlightChange chamado:', { newFlight });
    dispatch({ type: 'lifting/setFlight', payload: newFlight });
  };

  const handleAttemptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAttempt = parseInt(event.target.value);
    console.log('🎯 LiftingPopup - handleAttemptChange chamado:', { newAttempt, selectedEntryId });
    
    dispatch({ type: 'lifting/setSelectedAttempt', payload: newAttempt });
    
    if (selectedEntryId) {
      console.log('✅ Atualizando tentativa para atleta selecionado:', selectedEntryId, newAttempt);
      dispatch({ type: 'lifting/selectAthleteAndAttempt', payload: { entryId: selectedEntryId, attempt: newAttempt } });
    }
  };

  const handleAthleteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const entryId = parseInt(event.target.value);
    console.log('🎯 LiftingPopup - handleAthleteChange chamado:', { entryId, selectedAttempt });
    
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
    console.log('🎯 LiftingPopup - handleGoodLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      console.log('✅ Marcando Good Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 1, 0) as any);
      console.log(`Good Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
    } else {
      console.log('❌ Não é possível marcar Good Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  const handleNoLift = () => {
    console.log('🎯 LiftingPopup - handleNoLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      console.log('✅ Marcando No Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 2, 0) as any);
      console.log(`No Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
    } else {
      console.log('❌ Não é possível marcar No Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
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
    
    entriesInFlight.forEach((entry: any) => {
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
      {/* Indicador de reload automático */}
      <div className="auto-update-indicator">
        <span className="update-status">🔄 Reload automático a cada 5 segundos</span>
        <span className="last-update">Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
      </div>

      {/* Cabeçalho */}
      <div className="popup-header">
        <h2>🏋️ Levantamentos - Tempo Real</h2>
        <div className="header-info">
          <span>Dia: {day}</span>
          <span>Plataforma: {platform}</span>
          <span>Grupo: {flight}</span>
          <span>Movimento: {lift}</span>
        </div>
      </div>

      {/* Controles superiores */}
      <div className="controls-section">
        <Row>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small text-muted">Dia</Form.Label>
              <Form.Select
                size="sm"
                value={day}
                onChange={handleDayChange}
                className="custom-select"
              >
                {generateDayOptions()}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small text-muted">Plataforma</Form.Label>
              <Form.Select
                size="sm"
                value={platform}
                onChange={handlePlatformChange}
                className="custom-select"
              >
                {generatePlatformOptions()}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small text-muted">Movimento</Form.Label>
              <Form.Select
                size="sm"
                value={lift}
                onChange={handleLiftChange}
                className="custom-select"
              >
                <option value="S">Agachamento</option>
                <option value="B">Supino</option>
                <option value="D">Levantamento Terra</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small text-muted">Grupo</Form.Label>
              <Form.Select
                size="sm"
                value={flight}
                onChange={handleFlightChange}
                className="custom-select"
              >
                {generateFlightOptions()}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small text-muted">Tentativa</Form.Label>
              <Form.Select
                size="sm"
                value={selectedAttempt}
                onChange={handleAttemptChange}
                className="custom-select"
              >
                <option value={1}>Tentativa 1</option>
                <option value={2}>Tentativa 2</option>
                <option value={3}>Tentativa 3</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small text-muted">Atleta</Form.Label>
              <Form.Select
                size="sm"
                value={selectedEntryId || 0}
                onChange={handleAthleteChange}
                className="custom-select"
              >
                {generateAthleteOptions()}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Botões de ação */}
      <div className="action-buttons">
        <Row>
          <Col md={6}>
            <div className="btn-group" role="group">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => console.log('Alternar pesagens')}
              >
                Alternar Pesagens
              </Button>
            </div>
          </Col>
          <Col md={6} className="text-end">
            <Button
              variant="danger"
              size="sm"
              className="me-2"
              onClick={handleNoLift}
              disabled={!isAttemptActive || !selectedEntryId}
            >
              Inválido
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleGoodLift}
              disabled={!isAttemptActive || !selectedEntryId}
            >
              Válido
            </Button>
          </Col>
        </Row>
      </div>

      {/* Tabela de levantamentos */}
      <div className="table-section">
        {entriesInFlight.length === 0 ? (
          <div className="no-athletes-message">
            <div className="alert alert-warning text-center">
              <strong>⚠️ Nenhum atleta encontrado</strong><br />
              Verifique as configurações de Dia, Plataforma e Grupo
            </div>
          </div>
        ) : (
          <LiftingTableMirror
            orderedEntries={entriesInFlight}
            currentEntryId={selectedEntryId}
            attemptOneIndexed={selectedAttempt}
          />
        )}
      </div>
    </div>
  );
};

export default LiftingPopup;
