import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { markAttempt } from '../../actions/barraProntaActions';
import { Lift } from '../../types/barraProntaTypes';
import './LiftingFooter.css';

const LiftingFooter: React.FC = () => {
  const dispatch = useDispatch();
  const { day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive } = useSelector((state: RootState) => state.lifting);
  const { entries } = useSelector((state: RootState) => state.registration);
  const meet = useSelector((state: RootState) => state.meet);

  // Filtrar atletas pelo dia, plataforma e grupo atual
  const entriesInFlight = entries.filter((entry: any) => 
    entry.day === day && 
    entry.platform === platform && 
    entry.flight === flight
  );

  // Debug: mostrar estado atual
  console.log('🔍 LiftingFooter - Estado atual:', { 
    day, platform, flight, lift, attemptOneIndexed, 
    selectedEntryId, selectedAttempt, isAttemptActive 
  });
  console.log('🔍 LiftingFooter - Atletas disponíveis:', entriesInFlight.length);

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingFooter - Estado mudou, atualizando...', {
      day, platform, flight, lift, attemptOneIndexed,
      selectedEntryId, selectedAttempt, isAttemptActive,
      totalEntries: entries.length,
      filteredEntries: entriesInFlight.length
    });
  }, [day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive, entries, entriesInFlight]);

  // Handlers para os dropdowns
  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(event.target.value);
    console.log('🎯 handleDayChange chamado:', { newDay });
    dispatch({ type: 'lifting/setDay', payload: newDay });
  };

  const handlePlatformChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlatform = parseInt(event.target.value);
    console.log('🎯 handlePlatformChange chamado:', { newPlatform });
    dispatch({ type: 'lifting/setPlatform', payload: newPlatform });
  };

  const handleLiftChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLift = event.target.value as Lift;
    dispatch({ type: 'lifting/setLift', payload: newLift });
  };

  const handleFlightChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFlight = event.target.value;
    console.log('🎯 handleFlightChange chamado:', { newFlight });
    dispatch({ type: 'lifting/setFlight', payload: newFlight });
  };

  const handleAttemptChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAttempt = parseInt(event.target.value);
    console.log('🎯 handleAttemptChange chamado:', { newAttempt, selectedEntryId });
    
    dispatch({ type: 'lifting/setSelectedAttempt', payload: newAttempt });
    
    // Se há um atleta selecionado, atualizar a tentativa selecionada
    if (selectedEntryId) {
      console.log('✅ Atualizando tentativa para atleta selecionado:', selectedEntryId, newAttempt);
      dispatch({ type: 'lifting/selectAthleteAndAttempt', payload: { entryId: selectedEntryId, attempt: newAttempt } });
    }
  };

  const handleAthleteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const entryId = parseInt(event.target.value);
    console.log('🎯 handleAthleteChange chamado:', { entryId, selectedAttempt });
    
    if (entryId > 0) {
      // Selecionar atleta e tentativa atual
      console.log('✅ Selecionando atleta:', entryId, 'tentativa:', selectedAttempt);
      dispatch({ type: 'lifting/selectAthleteAndAttempt', payload: { entryId, attempt: selectedAttempt } });
    } else {
      // Desmarcar seleção
      console.log('❌ Desmarcando seleção');
      dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
      dispatch({ type: 'lifting/setAttemptActive', payload: false });
    }
  };

  // Handlers para as ações
  const handleGoodLift = () => {
    console.log('🎯 handleGoodLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      // Marcar tentativa como válida
      console.log('✅ Marcando Good Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 1, 0) as any);
      console.log(`Good Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
    } else {
      console.log('❌ Não é possível marcar Good Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  const handleNoLift = () => {
    console.log('🎯 handleNoLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      // Marcar tentativa como inválida
      console.log('✅ Marcando No Lift para:', selectedEntryId, selectedAttempt);
      dispatch(markAttempt(selectedEntryId, lift, selectedAttempt, 2, 0) as any);
      console.log(`No Lift marcado para atleta ${selectedEntryId}, tentativa ${selectedAttempt}`);
    } else {
      console.log('❌ Não é possível marcar No Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  const handleToggleWeights = () => {
    // Implementar alternar pesagens
    console.log('Alternar pesagens');
  };

  const handleToggleFullscreen = () => {
    // Implementar alternar tela cheia
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
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
    <div className="lifting-footer">
      <Row className="align-items-center">
        {/* Controles da esquerda */}
        <Col md={8}>
          <div className="left-controls">
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
        </Col>

        {/* Controles da direita */}
        <Col md={4}>
          <div className="right-controls">
            <div className="btn-group me-2" role="group">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleToggleWeights}
              >
                Alternar Pesagens
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleToggleFullscreen}
              >
                Alternar Tela Cheia
              </Button>
            </div>
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
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LiftingFooter;
