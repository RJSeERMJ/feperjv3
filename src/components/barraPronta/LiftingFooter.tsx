import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { updateEntry } from '../../actions/barraProntaActions';
import { Lift, LiftStatus, LiftingState } from '../../types/barraProntaTypes';
import { getLiftingOrder, getStableOrderByWeight } from '../../logic/liftingOrder';
import { useTimer } from '../../hooks/useTimer';
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
  const liftingOrder = getLiftingOrder(entriesInFlight, { day, platform, flight, lift, attemptOneIndexed, overrideEntryId: null, overrideAttempt: null, selectedEntryId, selectedAttempt, isAttemptActive, attemptTimers: new Map() } as LiftingState);

  // Debug: mostrar estado atual
  console.log('🔍 LiftingFooter - Estado atual:', { 
    day, platform, flight, lift, attemptOneIndexed, 
    selectedEntryId, selectedAttempt, isAttemptActive 
  });
  console.log('🔍 LiftingFooter - Atletas disponíveis:', entriesInFlight.length);
  console.log('🔍 LiftingFooter - Ordem de levantamentos:', liftingOrder);

  // Função para sincronizar o estado da tentativa atual
  const syncAttemptState = () => {
    // Se não há tentativa selecionada, usar a tentativa atual do sistema
    if (!selectedEntryId || !isAttemptActive) {
      console.log('🔄 Sincronizando estado: usando tentativa atual do sistema:', attemptOneIndexed);
      return;
    }
    
    // Se a tentativa selecionada é diferente da tentativa atual do sistema, sincronizar
    if (selectedAttempt !== attemptOneIndexed) {
      console.log('🔄 Sincronizando estado: atualizando selectedAttempt para:', attemptOneIndexed);
      dispatch({ type: 'lifting/setSelectedAttempt', payload: attemptOneIndexed });
    }
  };

  // NOVA FUNÇÃO: Selecionar automaticamente o primeiro atleta da lista reorganizada
  const lastOrderHash = useRef<string>('');
  const isAutoSelecting = useRef<boolean>(false);
  
  const autoSelectFirstAthlete = () => {
    // Evitar execução se já estiver selecionando automaticamente
    if (isAutoSelecting.current) {
      return;
    }
    
    // Obter a ordem atual dos atletas baseada no peso da tentativa atual
    const attemptsOrdered = getStableOrderByWeight(entriesInFlight, lift, attemptOneIndexed);
    
    // Criar hash da ordem atual para detectar mudanças
    const currentOrderHash = attemptsOrdered
      .map(attempt => `${attempt.entryId}:${attempt.weight}`)
      .join('|');
    
    // Só executar se a ordem realmente mudou
    if (currentOrderHash !== lastOrderHash.current && attemptsOrdered.length > 0) {
      const firstAthlete = attemptsOrdered[0];
      
      // Verificar se o primeiro atleta já está selecionado
      if (selectedEntryId !== firstAthlete.entryId) {
        console.log('🔄 Seleção automática: primeiro atleta da lista reorganizada:', firstAthlete.entryId);
        
        // Marcar que está selecionando automaticamente para evitar loops
        isAutoSelecting.current = true;
        
        // Selecionar automaticamente o primeiro atleta
        dispatch({ type: 'lifting/setSelectedEntryId', payload: firstAthlete.entryId });
        dispatch({ type: 'lifting/setSelectedAttempt', payload: attemptOneIndexed });
        dispatch({ type: 'lifting/setAttemptActive', payload: true });
        
        console.log('✅ Atleta selecionado automaticamente:', firstAthlete.entryId, 'tentativa:', attemptOneIndexed);
        
        // Resetar flag após um delay para permitir que o estado se atualize
        setTimeout(() => {
          isAutoSelecting.current = false;
        }, 100);
      } else {
        console.log('🔄 Primeiro atleta já está selecionado:', firstAthlete.entryId);
      }
      
      // Atualizar hash da ordem
      lastOrderHash.current = currentOrderHash;
    } else if (attemptsOrdered.length === 0) {
      console.log('🔄 Nenhum atleta com peso definido para tentativa:', attemptOneIndexed);
      
      // Se não há atletas com peso definido, desmarcar seleção
      if (selectedEntryId) {
        console.log('🔄 Desmarcando seleção - não há atletas disponíveis');
        dispatch({ type: 'lifting/setSelectedEntryId', payload: null });
        dispatch({ type: 'lifting/setAttemptActive', payload: false });
      }
    }
  };

  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingFooter - Estado mudou, atualizando...', {
      day, platform, flight, lift, attemptOneIndexed,
      selectedEntryId, selectedAttempt, isAttemptActive,
      totalEntries: entries.length,
      filteredEntries: entriesInFlight.length,
      liftingOrder
    });
    
    // Sincronizar estado da tentativa
    syncAttemptState();
    
    // NOVA FUNCIONALIDADE: Selecionar automaticamente o primeiro atleta
    autoSelectFirstAthlete();
  }, [day, platform, flight, lift, attemptOneIndexed, entries, entriesInFlight, liftingOrder]);

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

  // NOVA FUNÇÃO: Obter o status da tentativa anterior
  const getPreviousAttemptStatus = (entryId: number, attempt: number): LiftStatus => {
    if (attempt <= 1) return 0; // Primeira tentativa não tem anterior
    
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return 0;
    
    const statusField = getStatusField();
    const statusArray = (entry as any)[statusField] || [];
    
    return statusArray[attempt - 2] || 0; // attempt - 2 porque array é 0-indexed
  };

  // NOVA FUNÇÃO: Calcular peso automático quando timer expira
  const calculateAutoWeight = (entryId: number, attempt: number): number => {
    if (attempt <= 1) return 0; // Primeira tentativa não tem peso automático
    
    const previousWeight = getCurrentAttemptWeight(entryId, attempt - 1);
    const previousStatus = getPreviousAttemptStatus(entryId, attempt);
    
    if (previousWeight <= 0) return 0;
    
    // Se tentativa anterior foi válida (Good Lift), aumenta 2,5kg
    if (previousStatus === 1) {
      return previousWeight + 2.5;
    }
    // Se tentativa anterior foi inválida (No Lift), repete o mesmo peso
    else if (previousStatus === 2) {
      return previousWeight;
    }
    
    return 0; // Para outros status, não aplica peso automático
  };

  // NOVA FUNÇÃO: Aplicar peso automático quando timer expira
  const applyAutoWeight = (entryId: number, attempt: number) => {
    const autoWeight = calculateAutoWeight(entryId, attempt);
    
    if (autoWeight > 0) {
      const weightField = getWeightField(attempt);
      const previousStatus = getPreviousAttemptStatus(entryId, attempt);
      const statusText = previousStatus === 1 ? 'válida' : 'inválida';
      
      console.log(`⏰ Timer expirado: Aplicando peso automático ${autoWeight}kg (tentativa anterior foi ${statusText})`);
      
      dispatch(updateEntry(entryId, { [weightField]: autoWeight }));
      
      // Mostrar alerta informativo
      alert(`⏰ TEMPO EXCEDIDO!\nPeso automático aplicado: ${autoWeight}kg\n(Tentativa anterior foi ${statusText})`);
    } else {
      console.log('⏰ Timer expirado: Não foi possível aplicar peso automático');
      alert('⏰ TEMPO EXCEDIDO!\nNão foi possível aplicar peso automático.');
    }
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
        
        // CORREÇÃO: Não resetar attemptOneIndexed, apenas atualizar selectedAttempt
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
        // CORREÇÃO: Manter attemptOneIndexed como 1 apenas para o novo lift
        // dispatch({ type: 'lifting/setAttemptOneIndexed', payload: 1 });
        
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

  // Função para verificar se uma tentativa já foi definida
  const isAttemptAlreadyDefined = (entryId: number, attempt: number): boolean => {
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return false;
    
    const weightField = getWeightField(attempt);
    const weight = (entry as any)[weightField];
    
    return weight && weight > 0;
  };

  // Função para verificar se uma tentativa já foi marcada (Good/No Lift)
  const isAttemptAlreadyMarked = (entryId: number, attempt: number): boolean => {
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return false;
    
    const statusField = getStatusField();
    const statusArray = (entry as any)[statusField] || [];
    
    return statusArray[attempt - 1] === 1 || statusArray[attempt - 1] === 2;
  };

  // NOVA FUNÇÃO: Obter o status de uma tentativa
  const getAttemptStatus = (entryId: number, attempt: number): LiftStatus => {
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return 0;
    
    const statusField = getStatusField();
    const statusArray = (entry as any)[statusField] || [];
    
    return statusArray[attempt - 1] || 0;
  };

  // NOVA FUNÇÃO: Verificar se o peso é válido (inteligente - diferencia No Lift vs Good Lift)
  const isWeightValid = (entryId: number, attempt: number): boolean => {
    if (attempt === 1) return true; // Primeira tentativa sempre válida
    
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return false;
    
    const currentWeight = getCurrentAttemptWeight(entryId, attempt);
    if (currentWeight <= 0) return false;
    
    // Verificar regras baseadas no status da tentativa anterior
    const previousAttempt = attempt - 1;
    const previousWeight = getCurrentAttemptWeight(entryId, previousAttempt);
    const previousStatus = getAttemptStatus(entryId, previousAttempt);
    
    // Se não há peso anterior ou status anterior, usar regra padrão
    if (previousWeight <= 0 || previousStatus === 0) {
      return true;
    }
    
    // REGRA INTELIGENTE:
    // - Se tentativa anterior foi "No Lift" (inválida): permite mesmo peso OU maior
    // - Se tentativa anterior foi "Good Lift" (válida): permite apenas peso maior
    if (previousStatus === 2) { // No Lift (inválida)
      // Permite mesmo peso ou maior
      return currentWeight >= previousWeight;
    } else if (previousStatus === 1) { // Good Lift (válida)
      // Permite apenas peso maior
      return currentWeight > previousWeight;
    }
    
    // Para outros status (DNS, etc.), usar regra padrão
    return currentWeight > previousWeight;
  };

  // NOVA FUNÇÃO: Obter mensagem de erro para peso inválido (inteligente)
  const getWeightValidationMessage = (entryId: number, attempt: number): string | null => {
    if (attempt === 1) return null;
    
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return null;
    
    const currentWeight = getCurrentAttemptWeight(entryId, attempt);
    if (currentWeight <= 0) return 'Peso deve ser maior que zero';
    
    // Verificar regras baseadas no status da tentativa anterior
    const previousAttempt = attempt - 1;
    const previousWeight = getCurrentAttemptWeight(entryId, previousAttempt);
    const previousStatus = getAttemptStatus(entryId, previousAttempt);
    
    // Se não há peso anterior ou status anterior, não há erro
    if (previousWeight <= 0 || previousStatus === 0) {
      return null;
    }
    
    // MENSAGENS ESPECÍFICAS BASEADAS NO STATUS ANTERIOR:
    if (previousStatus === 2) { // No Lift (inválida)
      if (currentWeight < previousWeight) {
        return `Após No Lift, peso deve ser igual ou maior que ${previousWeight}kg (${previousAttempt}ª tentativa)`;
      }
    } else if (previousStatus === 1) { // Good Lift (válida)
      if (currentWeight <= previousWeight) {
        return `Após Good Lift, peso deve ser maior que ${previousWeight}kg (${previousAttempt}ª tentativa)`;
      }
    } else {
      // Para outros status (DNS, etc.), usar regra padrão
      if (currentWeight <= previousWeight) {
        return `Peso deve ser maior que ${previousWeight}kg (${previousAttempt}ª tentativa)`;
      }
    }
    
    return null;
  };

  // Função para verificar se é possível marcar uma tentativa
  const canMarkAttempt = (entryId: number, attempt: number): boolean => {
    // Verificar se a tentativa tem peso definido
    if (!isAttemptAlreadyDefined(entryId, attempt)) {
      console.log('❌ Tentativa não pode ser marcada: peso não definido');
      return false;
    }
    
    // NOVA LÓGICA: Permitir edição de tentativas já marcadas
    if (isAttemptAlreadyMarked(entryId, attempt)) {
      console.log('✅ Tentativa já marcada - permitindo edição');
      return true; // Permitir edição
    }
    
    // NOVA VERIFICAÇÃO: Verificar se o peso é válido (progressivo)
    if (!isWeightValid(entryId, attempt)) {
      console.log('❌ Tentativa não pode ser marcada: peso não é progressivo');
      return false;
    }
    
    return true;
  };

  // NOVA FUNÇÃO: Verificar se uma tentativa pode ser editada
  const canEditAttempt = (entryId: number, attempt: number): boolean => {
    const entry = entriesInFlight.find(e => e.id === entryId);
    if (!entry) return false;
    
    // Sempre permitir edição da tentativa atual
    if (attempt === attemptOneIndexed) return true;
    
    // Permitir edição de tentativas já marcadas (para correções)
    return isAttemptAlreadyMarked(entryId, attempt);
  };

  // NOVA FUNÇÃO: Verificar se próxima tentativa deve abrir após No Attempt
  const shouldOpenNextAttemptAfterNoAttempt = (entryId: number, attempt: number): boolean => {
    if (attempt >= 3) return false; // Última tentativa
    
    const currentStatus = getAttemptStatus(entryId, attempt);
    return currentStatus === 3; // No Attempt
  };

  // NOVO TIMER: Usar o hook personalizado com comportamento corrigido
  const timer = useTimer({
    duration: 60, // 60 segundos
    onExpire: () => {
      // Quando o timer expira, aplicar peso automático em vez de marcar como No Attempt
      if (selectedEntryId && selectedAttempt) {
        console.log('⏰ Timer expirado para atleta:', selectedEntryId, 'tentativa:', selectedAttempt);
        
        // Aplicar peso automático baseado no status da tentativa anterior
        applyAutoWeight(selectedEntryId, selectedAttempt);
        
        // NÃO parar o timer - ele continua contando para o próximo atleta
        console.log('⏰ Timer continua contando para próximo atleta');
      }
    }
  });

  // Função para iniciar timer quando marcar uma tentativa
  const startAttemptTimer = () => {
    timer.start();
    console.log('⏰ Timer iniciado para próxima tentativa do atleta atual');
  };

  // Função para verificar se uma tentativa pode ser marcada (SEM verificação de tempo)
  const canMarkAttemptWithTimeCheck = (entryId: number, attempt: number): boolean => {
    // REMOVIDO: Verificação de tempo expirado - timer não bloqueia marcação
    return canMarkAttempt(entryId, attempt);
  };

  // NOVA FUNÇÃO: Mostrar mensagens de erro para tentativas
  const showAttemptErrorMessage = (entryId: number, attempt: number) => {
    if (!isAttemptAlreadyDefined(entryId, attempt)) {
      alert('❌ Esta tentativa não pode ser marcada: peso não definido');
    } else if (!isWeightValid(entryId, attempt)) {
      const errorMessage = getWeightValidationMessage(entryId, attempt);
      alert(`❌ Esta tentativa não pode ser marcada: ${errorMessage}`);
    } else {
      alert('❌ Esta tentativa não pode ser marcada por motivo desconhecido');
    }
  };

  // NOVA FUNÇÃO: Mostrar status atual da tentativa para edição
  const showCurrentAttemptStatus = (entryId: number, attempt: number) => {
    const currentStatus = getAttemptStatus(entryId, attempt);
    let statusText = '';
    
    switch (currentStatus) {
      case 1:
        statusText = 'Good Lift';
        break;
      case 2:
        statusText = 'No Lift';
        break;
      case 3:
        statusText = 'No Attempt';
        break;
      default:
        statusText = 'Pendente';
    }
    
    console.log(`📝 Editando tentativa ${attempt} - Status atual: ${statusText}`);
    return statusText;
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
      // Verificar se a tentativa pode ser marcada (SEM verificação de tempo)
      if (!canMarkAttemptWithTimeCheck(selectedEntryId, selectedAttempt)) {
        // Mostrar mensagem de erro específica
        showAttemptErrorMessage(selectedEntryId, selectedAttempt);
        return;
      }
      
      // Obter o peso atual da tentativa
      const currentWeight = getCurrentAttemptWeight(selectedEntryId, selectedAttempt);
      
      if (currentWeight <= 0) {
        alert('Defina o peso da tentativa primeiro!');
        return;
      }

      // Verificar se é uma edição ou nova marcação
      const isEditing = isAttemptAlreadyMarked(selectedEntryId, selectedAttempt);
      const currentStatus = isEditing ? showCurrentAttemptStatus(selectedEntryId, selectedAttempt) : 'Nova';
      
      console.log(`✅ ${isEditing ? 'Editando' : 'Marcando'} Good Lift para:`, selectedEntryId, selectedAttempt, 'peso:', currentWeight, isEditing ? `(Status anterior: ${currentStatus})` : '');
      
      // Atualizar o status da tentativa
      const statusField = getStatusField();
      if (statusField) {
        const currentEntry = entriesInFlight.find(e => e.id === selectedEntryId);
        if (currentEntry) {
          const statusArray = (currentEntry as any)[statusField] || [0, 0, 0];
          const newStatusArray = [...statusArray];
          newStatusArray[selectedAttempt - 1] = 1; // Good Lift
          dispatch(updateEntry(selectedEntryId, { [statusField]: newStatusArray }));
          
          console.log(`✅ Status ${isEditing ? 'alterado' : 'atualizado'} para Good Lift`);
          
          // INICIAR TIMER para próxima tentativa do mesmo atleta
          startAttemptTimer();
          
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
      // Verificar se a tentativa pode ser marcada (SEM verificação de tempo)
      if (!canMarkAttemptWithTimeCheck(selectedEntryId, selectedAttempt)) {
        // Mostrar mensagem de erro específica
        showAttemptErrorMessage(selectedEntryId, selectedAttempt);
        return;
      }
      
      // Obter o peso atual da tentativa
      const currentWeight = getCurrentAttemptWeight(selectedEntryId, selectedAttempt);
      
      if (currentWeight <= 0) {
        alert('Defina o peso da tentativa primeiro!');
        return;
      }

      // Verificar se é uma edição ou nova marcação
      const isEditing = isAttemptAlreadyMarked(selectedEntryId, selectedAttempt);
      const currentStatus = isEditing ? showCurrentAttemptStatus(selectedEntryId, selectedAttempt) : 'Nova';
      
      console.log(`✅ ${isEditing ? 'Editando' : 'Marcando'} No Lift para:`, selectedEntryId, selectedAttempt, 'peso:', currentWeight, isEditing ? `(Status anterior: ${currentStatus})` : '');
      
      // Atualizar o status da tentativa
      const statusField = getStatusField();
      if (statusField) {
        const currentEntry = entriesInFlight.find(e => e.id === selectedEntryId);
        if (currentEntry) {
          const statusArray = (currentEntry as any)[statusField] || [0, 0, 0];
          const newStatusArray = [...statusArray];
          newStatusArray[selectedAttempt - 1] = 2; // No Lift
          dispatch(updateEntry(selectedEntryId, { [statusField]: newStatusArray }));
          
          console.log(`✅ Status ${isEditing ? 'alterado' : 'atualizado'} para No Lift`);
          
          // INICIAR TIMER para próxima tentativa do mesmo atleta
          startAttemptTimer();
          
          // Navegar automaticamente para o próximo - IMEDIATAMENTE
          navigateToNext();
        }
      }
    } else {
      console.log('❌ Não é possível marcar No Lift:', { selectedEntryId, isAttemptActive });
      alert('Selecione um atleta e uma tentativa primeiro!');
    }
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
              {/* Timer indicator no lugar do botão Alternar Pesagens */}
              {timer.isActive ? (
                <div className={`timer-display-btn ${timer.getTimerClass()}`}>
                  <span className="timer-text">
                    ⏰ {timer.formattedTime}
                  </span>
                </div>
              ) : (
                <div className="timer-display-btn timer-inactive">
                  <span className="timer-text">⏰ --</span>
                </div>
              )}
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
