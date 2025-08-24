import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { updateEntry } from '../../actions/barraProntaActions';
import { Lift } from '../../types/barraProntaTypes';
import { getLiftingOrder, getStableOrderByWeight } from '../../logic/liftingOrder';
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

  // Obter a ordem de levantamentos atualizada
  const liftingOrder = getLiftingOrder(entriesInFlight, { day, platform, flight, lift, attemptOneIndexed, overrideEntryId: null, overrideAttempt: null, selectedEntryId, selectedAttempt, isAttemptActive });

  // Debug: mostrar estado atual
  console.log('🔍 LiftingFooter - Estado atual:', { 
    day, platform, flight, lift, attemptOneIndexed, 
    selectedEntryId, selectedAttempt, isAttemptActive 
  });
  console.log('🔍 LiftingFooter - Atletas disponíveis:', entriesInFlight.length);
  console.log('🔍 LiftingFooter - Ordem de levantamentos:', liftingOrder);

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingFooter - Estado mudou, atualizando...', {
      day, platform, flight, lift, attemptOneIndexed,
      selectedEntryId, selectedAttempt, isAttemptActive,
      totalEntries: entries.length,
      filteredEntries: entriesInFlight.length,
      liftingOrder
    });
  }, [day, platform, flight, lift, attemptOneIndexed, selectedEntryId, selectedAttempt, isAttemptActive, entries, entriesInFlight, liftingOrder]);

  // Função para obter o campo de status baseado no movimento atual
  const getStatusField = (): string => {
    switch (lift) {
      case 'S': return 'squatStatus';
      case 'B': return 'benchStatus';
      case 'D': return 'deadliftStatus';
      default: return '';
    }
  };

  // Função para obter o campo de peso baseado no movimento atual
  const getWeightField = (attempt: number): string => {
    switch (lift) {
      case 'S': return `squat${attempt}`;
      case 'B': return `bench${attempt}`;
      case 'D': return `deadlift${attempt}`;
      default: return '';
    }
  };

  // Função para obter o peso atual da tentativa
  const getCurrentAttemptWeight = (entryId: number, attempt: number): number => {
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return 0;
    
    const weightField = getWeightField(attempt);
    return (entry as any)[weightField] || 0;
  };

  // Função para navegar automaticamente para o próximo atleta/tentativa/lift
  const navigateToNext = () => {
    console.log('🔄 Navegando para o próximo...');
    console.log('🔍 Estado atual antes da navegação:', { selectedEntryId, selectedAttempt, isAttemptActive, lift, attemptOneIndexed });
    console.log('🔍 Total de atletas no voo:', entriesInFlight.length);
    
    // 1. Verificar se há próximo atleta na mesma tentativa atual
    const attemptsOrdered = getStableOrderByWeight(entriesInFlight, lift, attemptOneIndexed);
    console.log('🔍 Tentativas ordenadas por peso para tentativa', attemptOneIndexed, ':', attemptsOrdered);
    
    if (attemptsOrdered.length > 0) {
      const currentIndex = attemptsOrdered.findIndex(a => a.entryId === selectedEntryId);
      console.log('🔍 Índice do atleta atual na lista ordenada:', currentIndex);
      
      if (currentIndex !== -1 && currentIndex < attemptsOrdered.length - 1) {
        // Há próximo atleta na mesma tentativa
        const nextAthlete = attemptsOrdered[currentIndex + 1];
        console.log('✅ Navegando para próximo atleta na mesma tentativa:', nextAthlete.entryId, 'tentativa:', attemptOneIndexed);
        
        dispatch({ type: 'lifting/setSelectedEntryId', payload: nextAthlete.entryId });
        dispatch({ type: 'lifting/setSelectedAttempt', payload: attemptOneIndexed });
        dispatch({ type: 'lifting/setAttemptActive', payload: true });
        return;
      } else {
        console.log('🔍 Atleta atual é o último da tentativa ou não encontrado na lista ordenada');
      }
    } else {
      console.log('🔍 Nenhuma tentativa com peso definido para tentativa', attemptOneIndexed);
    }
    
    // 2. Se chegou ao último atleta da tentativa atual, verificar próxima tentativa
    if (attemptOneIndexed < 3) {
      console.log('🔍 Verificando próxima tentativa:', attemptOneIndexed + 1);
      const nextAttemptOrdered = getStableOrderByWeight(entriesInFlight, lift, attemptOneIndexed + 1);
      console.log('🔍 Tentativas ordenadas para próxima tentativa:', nextAttemptOrdered);
      
      if (nextAttemptOrdered.length > 0) {
        // Há atletas na próxima tentativa
        const firstAthlete = nextAttemptOrdered[0];
        console.log('✅ Navegando para próxima tentativa:', attemptOneIndexed + 1, 'atleta:', firstAthlete.entryId);
        
        dispatch({ type: 'lifting/setAttemptOneIndexed', payload: attemptOneIndexed + 1 });
        dispatch({ type: 'lifting/setSelectedEntryId', payload: firstAthlete.entryId });
        dispatch({ type: 'lifting/setSelectedAttempt', payload: attemptOneIndexed + 1 });
        dispatch({ type: 'lifting/setAttemptActive', payload: true });
        return;
      } else {
        console.log('🔍 Nenhuma tentativa com peso definido para próxima tentativa');
      }
    }
    
    // 3. Se chegou à última tentativa (3ª), verificar próximo levantamento
    if (attemptOneIndexed >= 3) {
      console.log('🔍 Verificando próximo levantamento');
      const nextLift = getNextLift(lift);
      console.log('🔍 Próximo lift:', nextLift);
      
      if (nextLift) {
        // Mudar para o próximo levantamento
        console.log('✅ Mudando para próximo levantamento:', nextLift);
        
        dispatch({ type: 'lifting/setLift', payload: nextLift });
        dispatch({ type: 'lifting/setAttemptOneIndexed', payload: 1 });
        
        // Verificar se há atletas no próximo levantamento
        const nextLiftAttempts = getStableOrderByWeight(entriesInFlight, nextLift, 1);
        console.log('🔍 Tentativas para próximo lift:', nextLiftAttempts);
        
        if (nextLiftAttempts.length > 0) {
          const firstAthlete = nextLiftAttempts[0];
          console.log('✅ Navegando para primeiro atleta do próximo lift:', firstAthlete.entryId);
          
          dispatch({ type: 'lifting/setSelectedEntryId', payload: firstAthlete.entryId });
          dispatch({ type: 'lifting/setSelectedAttempt', payload: 1 });
          dispatch({ type: 'lifting/setAttemptActive', payload: true });
        } else {
          // Não há atletas no próximo lift, resetar seleção
          console.log('🔄 Resetando seleção - não há atletas no próximo lift');
          dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
          dispatch({ type: 'lifting/setAttemptActive', payload: false });
        }
        return;
      } else {
        // Não há mais movimentos, apenas salvar e resetar
        console.log('🔄 Fim da competição - não há mais movimentos');
        dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
        dispatch({ type: 'lifting/setAttemptActive', payload: false });
        return;
      }
    }
    
    // 4. Se não há mais opções, resetar seleção
    console.log('🔄 Resetando seleção - fim da competição');
    dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
    dispatch({ type: 'lifting/setAttemptActive', payload: false });
    
    console.log('✅ Navegação concluída');
  };

  // Função auxiliar para determinar o próximo levantamento
  const getNextLift = (currentLift: Lift): Lift | null => {
    switch (currentLift) {
      case 'S': return 'B'; // Squat → Bench
      case 'B': return 'D'; // Bench → Deadlift
      case 'D': return null; // Deadlift é o último
      default: return null;
    }
  };

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

  // Handlers para as ações - AGORA SINCRONIZADOS COM A TABELA
  const handleGoodLift = () => {
    console.log('🎯 handleGoodLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      // Obter o peso atual da tentativa
      const currentWeight = getCurrentAttemptWeight(selectedEntryId, selectedAttempt);
      
      if (currentWeight <= 0) {
        alert('Defina o peso da tentativa primeiro!');
        return;
      }

      // Marcar tentativa como válida usando a mesma lógica da tabela
      console.log('✅ Marcando Good Lift para:', selectedEntryId, selectedAttempt, 'peso:', currentWeight);
      
      // Atualizar o status da tentativa
      const statusField = getStatusField();
      if (statusField) {
        const currentEntry = entriesInFlight.find(e => e.id === selectedEntryId);
        if (currentEntry) {
          const statusArray = (currentEntry as any)[statusField] || [0, 0, 0];
          const newStatusArray = [...statusArray];
          newStatusArray[selectedAttempt - 1] = 1; // Good Lift
          dispatch(updateEntry(selectedEntryId, { [statusField]: newStatusArray }));
          
          console.log('✅ Status atualizado para Good Lift');
          
          // Navegar automaticamente para o próximo - IMEDIATAMENTE
          navigateToNext();
        }
      }
    } else {
      console.log('❌ Não é possível marcar Good Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
  };

  const handleNoLift = () => {
    console.log('🎯 handleNoLift chamado:', { selectedEntryId, isAttemptActive, lift, selectedAttempt });
    
    if (selectedEntryId && isAttemptActive) {
      // Obter o peso atual da tentativa
      const currentWeight = getCurrentAttemptWeight(selectedEntryId, selectedAttempt);
      
      if (currentWeight <= 0) {
        alert('Defina o peso da tentativa primeiro!');
        return;
      }

      // Marcar tentativa como inválida usando a mesma lógica da tabela
      console.log('✅ Marcando No Lift para:', selectedEntryId, selectedAttempt, 'peso:', currentWeight);
      
      // Atualizar o status da tentativa
      const statusField = getStatusField();
      if (statusField) {
        const currentEntry = entriesInFlight.find(e => e.id === selectedEntryId);
        if (currentEntry) {
          const statusArray = (currentEntry as any)[statusField] || [0, 0, 0];
          const newStatusArray = [...statusArray];
          newStatusArray[selectedAttempt - 1] = 2; // No Lift
          dispatch(updateEntry(selectedEntryId, { [statusField]: newStatusArray }));
          
          console.log('✅ Status atualizado para No Lift');
          
          // Navegar automaticamente para o próximo - IMEDIATAMENTE
          navigateToNext();
        }
      }
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
              ❌ Inválido
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleGoodLift}
              disabled={!isAttemptActive || !selectedEntryId}
            >
              ✅ Válido
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LiftingFooter;
