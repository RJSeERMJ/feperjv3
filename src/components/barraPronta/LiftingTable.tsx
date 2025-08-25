import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Badge, Form, Modal, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { markAttempt, updateEntry } from '../../actions/barraProntaActions';
import { LiftStatus } from '../../types/barraProntaTypes';
import { getStableOrderByWeight } from '../../logic/liftingOrder';
import { selectPlates, getPlateColor } from '../../logic/barLoad';
import BarLoad from './BarLoad';
import './LiftingTable.css';

interface LiftingTableProps {
  orderedEntries: any[];
  currentEntryId: number | null;
  attemptOneIndexed: number;
}

const LiftingTable: React.FC<LiftingTableProps> = ({
  orderedEntries,
  currentEntryId,
  attemptOneIndexed,
}) => {
  const dispatch = useDispatch();
  const { lift, selectedEntryId, selectedAttempt, isAttemptActive } = useSelector((state: RootState) => state.lifting);
  const meet = useSelector((state: RootState) => state.meet);

  // Debug: mostrar estado atual
  console.log('🔍 LiftingTable - Estado atual:', { 
    lift, selectedEntryId, selectedAttempt, isAttemptActive 
  });
  
  // Monitorar mudanças no estado para sincronização automática
  useEffect(() => {
    console.log('🔄 LiftingTable - Estado mudou, atualizando...', {
      lift, selectedEntryId, selectedAttempt, isAttemptActive,
      orderedEntries: orderedEntries.length,
      currentEntryId, attemptOneIndexed
    });
  }, [lift, selectedEntryId, selectedAttempt, isAttemptActive, orderedEntries, currentEntryId, attemptOneIndexed]);



  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [attemptWeight, setAttemptWeight] = useState<string>('');
  const [attemptStatus, setAttemptStatus] = useState<LiftStatus>(1);

  // Obter o status de uma tentativa
  const getAttemptStatus = (entry: any, attempt: number): LiftStatus => {
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [];
    return statusArray[attempt - 1] || 0;
  };

  // Obter o peso de uma tentativa
  const getAttemptWeight = (entry: any, attempt: number): number => {
    const weightField = lift === 'S' ? `squat${attempt}` : lift === 'B' ? `bench${attempt}` : `deadlift${attempt}`;
    return entry[weightField] || 0;
  };

  // Verificar se é o atleta atual
  const isCurrentAthlete = (entryId: number): boolean => {
    return entryId === currentEntryId;
  };

  // Verificar se é a tentativa atual
  const isCurrentAttempt = (attempt: number): boolean => {
    return attempt === attemptOneIndexed;
  };

  // Verificar se uma tentativa está selecionada no footer
  const isAttemptSelected = (entryId: number, attempt: number): boolean => {
    const isSelected = selectedEntryId === entryId && selectedAttempt === attempt && isAttemptActive;
    console.log('🎯 isAttemptSelected:', { entryId, attempt, selectedEntryId, selectedAttempt, isAttemptActive, isSelected });
    return isSelected;
  };

  // Função para verificar se uma tentativa está disponível para preenchimento
  const isAttemptAvailable = (entry: any, attempt: number): boolean => {
    if (attempt === 1) return true; // Primeira tentativa sempre disponível
    
    // Verificar se tempo foi excedido
    if (checkTimeExceeded(entry.id, attempt)) {
      return false; // Bloquear se tempo foi excedido
    }
    
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [0, 0, 0];
    
    // Verificar se a tentativa anterior foi marcada (válida ou inválida)
    const previousAttempt = statusArray[attempt - 2]; // attempt - 2 porque array é 0-indexed
    
    // NOVA LÓGICA: Permitir próxima tentativa após No Attempt
    if (previousAttempt === 3) { // No Attempt
      return true; // Próxima tentativa deve abrir para verificação
    }
    
    return previousAttempt === 1 || previousAttempt === 2; // 1 = Good Lift, 2 = No Lift
  };

  // NOVA FUNÇÃO: Verificar se o peso é válido (inteligente - diferencia No Lift vs Good Lift)
  const isWeightValid = (entry: any, attempt: number, newWeight: number): boolean => {
    if (attempt === 1) return true; // Primeira tentativa sempre válida
    
    // Verificar se o peso é maior que zero
    if (newWeight <= 0) return false;
    
    // Verificar regras baseadas no status da tentativa anterior
    const previousAttempt = attempt - 1;
    const previousWeight = getAttemptWeight(entry, previousAttempt);
    const previousStatus = getAttemptStatus(entry, previousAttempt);
    
    // Se não há peso anterior ou status anterior, usar regra padrão
    if (previousWeight <= 0 || previousStatus === 0) {
      return true;
    }
    
    // REGRA INTELIGENTE:
    // - Se tentativa anterior foi "No Lift" (inválida): permite mesmo peso OU maior
    // - Se tentativa anterior foi "Good Lift" (válida): permite apenas peso maior
    if (previousStatus === 2) { // No Lift (inválida)
      // Permite mesmo peso ou maior
      return newWeight >= previousWeight;
    } else if (previousStatus === 1) { // Good Lift (válida)
      // Permite apenas peso maior
      return newWeight > previousWeight;
    }
    
    // Para outros status (DNS, etc.), usar regra padrão
    return newWeight > previousWeight;
  };

  // NOVA FUNÇÃO: Obter mensagem de erro para peso inválido (inteligente)
  const getWeightValidationMessage = (entry: any, attempt: number, newWeight: number): string | null => {
    if (attempt === 1) return null;
    
    if (newWeight <= 0) return 'Peso deve ser maior que zero';
    
    // Verificar regras baseadas no status da tentativa anterior
    const previousAttempt = attempt - 1;
    const previousWeight = getAttemptWeight(entry, previousAttempt);
    const previousStatus = getAttemptStatus(entry, previousAttempt);
    
    // Se não há peso anterior ou status anterior, não há erro
    if (previousWeight <= 0 || previousStatus === 0) {
      return null;
    }
    
    // MENSAGENS ESPECÍFICAS BASEADAS NO STATUS ANTERIOR:
    if (previousStatus === 2) { // No Lift (inválida)
      if (newWeight < previousWeight) {
        return `Após No Lift, peso deve ser igual ou maior que ${previousWeight}kg (${previousAttempt}ª tentativa)`;
      }
    } else if (previousStatus === 1) { // Good Lift (válida)
      if (newWeight <= previousWeight) {
        return `Após Good Lift, peso deve ser maior que ${previousWeight}kg (${previousAttempt}ª tentativa)`;
      }
    } else {
      // Para outros status (DNS, etc.), usar regra padrão
      if (newWeight <= previousWeight) {
        return `Peso deve ser maior que ${previousWeight}kg (${previousAttempt}ª tentativa)`;
      }
    }
    
    return null;
  };

  // NOVA FUNÇÃO: Calcular peso mínimo baseado na nova lógica inteligente
  const getMinWeightForAttempt = (entry: any, attempt: number): number => {
    if (attempt === 1) return 0; // Primeira tentativa não tem restrição
    
    const previousAttempt = attempt - 1;
    const previousWeight = getAttemptWeight(entry, previousAttempt);
    const previousStatus = getAttemptStatus(entry, previousAttempt);
    
    // Se não há peso anterior, não há restrição
    if (previousWeight <= 0) return 0;
    
    // REGRA INTELIGENTE:
    // - Se tentativa anterior foi "No Lift" (inválida): permite mesmo peso
    // - Se tentativa anterior foi "Good Lift" (válida): deve ser maior
    if (previousStatus === 2) { // No Lift (inválida)
      return previousWeight; // Permite mesmo peso
    } else if (previousStatus === 1) { // Good Lift (válida)
      return previousWeight + 0.5; // Deve ser maior
    }
    
    // Para outros status (DNS, etc.), usar regra padrão
    return previousWeight + 0.5;
  };

  // NOVA FUNÇÃO: Verificar se uma tentativa deve ser marcada como No Attempt
  const shouldMarkAsNoAttempt = (entry: any, attempt: number): boolean => {
    // Se é a primeira tentativa, não marcar como No Attempt
    if (attempt === 1) return false;
    
    // Verificar se a tentativa anterior foi marcada
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [];
    
    // Se a tentativa anterior foi No Attempt, a atual deve abrir para verificação
    const previousStatus = statusArray[attempt - 2]; // attempt - 2 porque array é 0-indexed
    if (previousStatus === 3) { // No Attempt
      return false; // Não marcar automaticamente, deixar usuário decidir
    }
    
    // Se a tentativa anterior foi marcada (válida ou inválida), verificar se atual está vazia
    if (previousStatus === 1 || previousStatus === 2) { // Good Lift ou No Lift
      const weightField = lift === 'S' ? `squat${attempt}` : lift === 'B' ? `bench${attempt}` : `deadlift${attempt}`;
      const currentWeight = entry[weightField];
      
      // Se não há peso definido, marcar como No Attempt
      return !currentWeight || currentWeight <= 0;
    }
    
    return false;
  };

  // NOVA FUNÇÃO: Verificar se próxima tentativa deve abrir após No Attempt
  const shouldOpenNextAttemptAfterNoAttempt = (entry: any, attempt: number): boolean => {
    if (attempt >= 3) return false; // Última tentativa
    
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [];
    const currentStatus = statusArray[attempt - 1];
    
    // Se a tentativa atual é No Attempt, próxima deve abrir
    return currentStatus === 3;
  };

  // Função para obter a classe CSS baseada na disponibilidade da tentativa
  const getAttemptCellClass = (entry: any, attempt: number): string => {
    const baseClass = `text-center attempt-cell`;
    const isCurrent = isCurrentAthlete(entry.id) && isCurrentAttempt(attempt);
    const isSelected = isAttemptSelected(entry.id, attempt);
    const isAvailable = isAttemptAvailable(entry, attempt);
    const isTimeExpired = checkTimeExceeded(entry.id, attempt);
    
    let classes = baseClass;
    
    if (isCurrent) classes += ' current-attempt';
    if (isSelected) classes += ' selected-attempt';
    if (!isAvailable) classes += ' blocked-attempt';
    if (isTimeExpired) classes += ' time-expired';
    
    return classes;
  };

  // Função para obter a categoria de peso formatada
  const getWeightClassDisplay = (entry: any): string => {
    // Se já tem weightClass formatado, usar ele
    if (entry.weightClass && entry.weightClass.trim()) {
      return entry.weightClass;
    }
    
    // Se não tem, criar baseado no weightClassKg
    if (entry.weightClassKg && entry.weightClassKg > 0) {
      const classes = entry.sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
      const index = classes.indexOf(entry.weightClassKg);
      if (index === classes.length - 1) {
        return `${entry.weightClassKg}+ kg`;
      }
      return `${entry.weightClassKg} kg`;
    }
    
    // Fallback
    return 'N/A';
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

  // Função para atualizar o peso de uma tentativa
  const updateAttemptWeight = (entryId: number, attempt: number, weight: string) => {
    const weightField = getWeightField(attempt);
    
    if (weightField) {
      const weightValue = weight === '' ? null : parseFloat(weight);
      
      // Atualizar o peso imediatamente (sem validação durante digitação)
      dispatch(updateEntry(entryId, { [weightField]: weightValue }));
    }
  };

  // NOVA FUNÇÃO: Validar e processar peso quando usuário clicar fora da célula
  const handleWeightBlur = (entryId: number, attempt: number, weight: string) => {
    const weightField = getWeightField(attempt);
    
    if (weightField) {
      const weightValue = weight === '' ? null : parseFloat(weight);
      
      // VERIFICAÇÃO DE TEMPO EXCEDIDO: Bloquear inserção se tempo foi excedido
      if (checkTimeExceeded(entryId, attempt)) {
        showTimeExceededAlertOnce(entryId, attempt);
        alert('⏰ TEMPO EXCEDIDO: Não é possível inserir peso após 1 minuto da marcação da tentativa!');
        return; // Bloquear inserção de peso após tempo excedido
      }
      
      // VALIDAÇÃO: Verificar se o peso é válido apenas quando clicar fora
      if (weightValue !== null) {
        const entry = orderedEntries.find(e => e.id === entryId);
        if (entry && !isWeightValid(entry, attempt, weightValue)) {
          const errorMessage = getWeightValidationMessage(entry, attempt, weightValue);
          alert(`❌ Peso inválido: ${errorMessage}`);
          
          // Reverter para o valor anterior se inválido
          const previousWeight = getAttemptWeight(entry, attempt);
          dispatch(updateEntry(entryId, { [weightField]: previousWeight }));
          return;
        }
      }
      
      // VERIFICAÇÃO AUTOMÁTICA: Marcar como DNS se necessário
      if (weightValue === null) {
        const currentEntry = orderedEntries.find(e => e.id === entryId);
        if (currentEntry && shouldMarkAsNoAttempt(currentEntry, attempt)) {
          const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
          const statusArray = (currentEntry as any)[statusField] || [0, 0, 0];
          const newStatusArray = [...statusArray];
          newStatusArray[attempt - 1] = 3; // 3 = No Attempt
          dispatch(updateEntry(entryId, { [statusField]: newStatusArray }));
          console.log(`🔄 Tentativa ${attempt} marcada automaticamente como No Attempt para atleta ${entryId}`);
        }
      }
      
      // A reorganização da tabela acontece automaticamente via useMemo
      // quando o estado mudar (após a validação)
    }
  };

  // Função para atualizar o status de uma tentativa - REMOVIDA
  // Agora o status é controlado apenas pelos botões do Footer
  // const updateAttemptStatus = (entryId: number, attempt: number, status: LiftStatus) => { ... };

  // Reorganizar entradas por peso das tentativas usando useMemo (ORDEM ESTÁVEL)
  const orderedEntriesByWeight = useMemo(() => {
    if (!orderedEntries || orderedEntries.length === 0) return [];
    
    // Obter a tentativa atual baseada no attemptOneIndexed
    const currentAttempt = attemptOneIndexed;
    
    // Organizar por peso para a tentativa atual (ORDEM ESTÁVEL)
    const attemptsOrdered = getStableOrderByWeight(orderedEntries, lift, currentAttempt);
    
    // Se não há tentativas com peso definido para esta tentativa, manter ordem original
    if (attemptsOrdered.length === 0) {
      return orderedEntries;
    }
    
    // Criar mapa de ordem baseada no peso
    const weightOrderMap = new Map<number, number>();
    attemptsOrdered.forEach((attempt, index) => {
      weightOrderMap.set(attempt.entryId, index);
    });
    
    // Reorganizar as entradas baseada na ordem de peso (ESTÁVEL)
    const reorderedEntries = [...orderedEntries].sort((a, b) => {
      const aOrder = weightOrderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = weightOrderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      
      // Entradas com peso definido vêm primeiro (ordenadas por peso - ESTÁVEL)
      if (aOrder !== Number.MAX_SAFE_INTEGER && bOrder !== Number.MAX_SAFE_INTEGER) {
        return aOrder - bOrder;
      }
      
      // Entradas sem peso vêm depois, mantendo ordem original
      if (aOrder === Number.MAX_SAFE_INTEGER && bOrder === Number.MAX_SAFE_INTEGER) {
        return 0;
      }
      
      // Entradas com peso vêm antes das sem peso
      return aOrder === Number.MAX_SAFE_INTEGER ? 1 : -1;
    });
    
    return reorderedEntries;
  }, [orderedEntries, lift, attemptOneIndexed]); // Dependências que causam reorganização

  // NOVO useEffect: Detectar mudanças na ordem dos atletas e selecionar automaticamente
  const lastOrderHash = useRef<string>('');
  const isAutoSelecting = useRef<boolean>(false);
  
  useEffect(() => {
    // Evitar execução se já estiver selecionando automaticamente
    if (isAutoSelecting.current) {
      return;
    }
    
    // Criar hash da ordem atual para detectar mudanças
    const currentOrderHash = orderedEntriesByWeight
      .map(entry => `${entry.id}:${getAttemptWeight(entry, attemptOneIndexed)}`)
      .join('|');
    
    // Só executar se a ordem realmente mudou
    if (currentOrderHash !== lastOrderHash.current && orderedEntriesByWeight.length > 0) {
      const firstAthlete = orderedEntriesByWeight[0];
      
      // Verificar se o primeiro atleta da lista reorganizada está selecionado
      if (selectedEntryId !== firstAthlete.id) {
        console.log('🔄 LiftingTable - Ordem mudou, selecionando primeiro atleta:', firstAthlete.id);
        
        // Marcar que está selecionando automaticamente para evitar loops
        isAutoSelecting.current = true;
        
        // Disparar ação para selecionar o primeiro atleta
        dispatch({ type: 'lifting/setSelectedEntryId', payload: firstAthlete.id });
        dispatch({ type: 'lifting/setSelectedAttempt', payload: attemptOneIndexed });
        dispatch({ type: 'lifting/setAttemptActive', payload: true });
        
        console.log('✅ LiftingTable - Primeiro atleta selecionado automaticamente:', firstAthlete.id);
        
        // Resetar flag após um delay para permitir que o estado se atualize
        setTimeout(() => {
          isAutoSelecting.current = false;
        }, 100);
      }
      
      // Atualizar hash da ordem
      lastOrderHash.current = currentOrderHash;
    }
  }, [orderedEntriesByWeight, selectedEntryId, attemptOneIndexed, dispatch]);

  // Função para renderizar carregamento da barra para uma tentativa
  const renderBarLoad = (entry: any, attempt: number) => {
    const weight = getAttemptWeight(entry, attempt);
    if (!weight || weight <= 0) return null;
    
    // Obter peso da barra + colares baseado no movimento
    const getBarAndCollarsWeight = (): number => {
      switch (lift) {
        case 'S': return meet.squatBarAndCollarsWeightKg || 20;
        case 'B': return meet.benchBarAndCollarsWeightKg || 20;
        case 'D': return meet.deadliftBarAndCollarsWeightKg || 20;
        default: return 20;
      }
    };
    
    // Calcular anilhas necessárias
    const loading = selectPlates(weight, getBarAndCollarsWeight(), meet.plates || [], true);
    
    // Verificar se há erro no carregamento
    const hasError = loading.some(plate => plate.weightAny < 0);
    
    if (hasError) {
      return (
        <div className="bar-load-error">
          <small className="text-danger">❌ Peso não possível</small>
        </div>
      );
    }
    
    return (
      <div className="bar-load-preview">
        <small className="text-muted">Barra: {weight}kg</small>
        <div className="plates-preview">
          {loading.slice(0, 3).map((plate, index) => (
            <div
              key={index}
              className="plate-preview"
              style={{
                backgroundColor: plate.color,
                border: plate.color === '#FFFFFF' ? '1px solid #ccc' : 'none'
              }}
            />
          ))}
          {loading.length > 3 && (
            <span className="more-plates">+{loading.length - 3}</span>
          )}
        </div>
      </div>
    );
  };

  // NOVA FUNÇÃO: Timer para controle de tempo após marcar tentativa
  const [attemptTimers, setAttemptTimers] = useState<Map<string, { startTime: number, isActive: boolean }>>(new Map());
  const [showTimeExceededAlert, setShowTimeExceededAlert] = useState(false);

  // Função para iniciar timer após marcar tentativa
  const startAttemptTimer = (entryId: number, attempt: number) => {
    const timerKey = `${entryId}-${attempt}`;
    const startTime = Date.now();
    
    setAttemptTimers(prev => new Map(prev.set(timerKey, { startTime, isActive: true })));
    
    console.log('⏰ Timer iniciado para tentativa:', { entryId, attempt, startTime });
  };

  // Função para verificar se tempo foi excedido
  const checkTimeExceeded = (entryId: number, attempt: number): boolean => {
    if (!attemptTimers || !(attemptTimers instanceof Map)) {
      return false;
    }
    const timerKey = `${entryId}-${attempt}`;
    const timer = attemptTimers.get(timerKey);
    
    if (!timer || !timer.isActive) return false;
    
    const elapsedTime = Date.now() - timer.startTime;
    const oneMinute = 60 * 1000; // 1 minuto em milissegundos
    
    return elapsedTime > oneMinute;
  };

  // Função para mostrar alerta de tempo excedido
  const showTimeExceededAlertOnce = (entryId: number, attempt: number) => {
    if (checkTimeExceeded(entryId, attempt) && !showTimeExceededAlert) {
      setShowTimeExceededAlert(true);
      alert('⚠️ ATENÇÃO: Tempo excedido! Esta tentativa foi marcada há mais de 1 minuto. Verifique se o peso foi inserido corretamente.');
      
      // Resetar alerta após mostrar
      setTimeout(() => setShowTimeExceededAlert(false), 100);
    }
  };

  // NOVA FUNÇÃO: Marcar automaticamente como No Attempt quando tempo expira
  const markAsNoAttemptIfTimeExceeded = (entryId: number, attempt: number) => {
    if (checkTimeExceeded(entryId, attempt)) {
      const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
      const entry = orderedEntries.find(e => e.id === entryId);
      
      if (entry) {
        const statusArray = (entry as any)[statusField] || [0, 0, 0];
        const currentStatus = statusArray[attempt - 1];
        
        // Só marcar como No Attempt se ainda não foi marcada
        if (currentStatus === 0) {
          const newStatusArray = [...statusArray];
          newStatusArray[attempt - 1] = 3; // 3 = No Attempt
          dispatch(updateEntry(entryId, { [statusField]: newStatusArray }));
          console.log(`⏰ Timer expirado: Tentativa ${attempt} marcada automaticamente como No Attempt para atleta ${entryId}`);
          
          // Desativar timer
          setAttemptTimers(prev => {
            const newMap = new Map(prev);
            newMap.delete(`${entryId}-${attempt}`);
            return newMap;
          });
        }
      }
    }
  };

  // NOVO useEffect: Monitorar timers e marcar como No Attempt quando expirarem
  useEffect(() => {
    if (!attemptTimers || !(attemptTimers instanceof Map)) {
      return;
    }
    
    const timerInterval = setInterval(() => {
      attemptTimers.forEach((timer, key) => {
        if (timer.isActive) {
          const [entryId, attempt] = key.split('-').map(Number);
          markAsNoAttemptIfTimeExceeded(entryId, attempt);
        }
      });
      
      // Forçar re-render para atualizar o tempo na interface
      setAttemptTimers(prev => new Map(prev));
    }, 1000); // Verificar a cada segundo

    return () => clearInterval(timerInterval);
  }, [attemptTimers, lift, orderedEntries]);

  // NOVA FUNÇÃO: Verificar se uma tentativa pode ser editada (incluindo verificação de tempo)
  const canEditAttemptWithTimeCheck = (entry: any, attempt: number): boolean => {
    // Verificar se tempo foi excedido
    if (checkTimeExceeded(entry.id, attempt)) {
      return false; // Bloquear edição se tempo foi excedido
    }
    
    // Sempre permitir edição da tentativa atual
    if (attempt === attemptOneIndexed) return true;
    
    // Permitir edição de tentativas já marcadas (para correções)
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [];
    const currentStatus = statusArray[attempt - 1];
    
    return currentStatus === 1 || currentStatus === 2; // Good Lift ou No Lift
  };

  // NOVA FUNÇÃO: Obter tempo restante para uma tentativa
  const getRemainingTime = (entryId: number, attempt: number): number => {
    if (!attemptTimers || !(attemptTimers instanceof Map)) {
      return 0;
    }
    const timerKey = `${entryId}-${attempt}`;
    const timer = attemptTimers.get(timerKey);
    
    if (!timer || !timer.isActive) return 0;
    
    const elapsedTime = Date.now() - timer.startTime;
    const oneMinute = 60 * 1000; // 1 minuto em milissegundos
    const remainingTime = Math.max(0, oneMinute - elapsedTime);
    
    return Math.ceil(remainingTime / 1000); // Retorna segundos restantes
  };

  // NOVA FUNÇÃO: Verificar se uma tentativa tem timer ativo
  const hasActiveTimer = (entryId: number, attempt: number): boolean => {
    if (!attemptTimers || !(attemptTimers instanceof Map)) {
      return false;
    }
    const timerKey = `${entryId}-${attempt}`;
    const timer = attemptTimers.get(timerKey);
    return timer?.isActive || false;
  };

  // NOVA FUNÇÃO: Verificar se o timer está urgente (últimos 10 segundos)
  const isTimerUrgent = (entryId: number, attempt: number): boolean => {
    const remainingTime = getRemainingTime(entryId, attempt);
    return remainingTime <= 10 && remainingTime > 0;
  };

  // NOVA FUNÇÃO: Obter classe CSS para o timer countdown
  const getTimerCountdownClass = (entryId: number, attempt: number): string => {
    let classes = 'status-icon timer-countdown';
    if (isTimerUrgent(entryId, attempt)) {
      classes += ' urgent';
    }
    return classes;
  };

  // Função para verificar se uma tentativa pode ser editada
  const canEditAttempt = (entry: any, attempt: number): boolean => {
    return canEditAttemptWithTimeCheck(entry, attempt);
  };

  return (
    <div className="lifting-table-container">
      <div className="table-header mb-3">
        <h5 className="mb-0">
          🏋️ Tabela de Levantamentos - {lift === 'S' ? 'Agachamento' : lift === 'B' ? 'Supino' : 'Terra'}
        </h5>
      </div>

      <div className="table-responsive">
        <Table className="lifting-table" bordered hover>
          <thead>
            <tr className="table-header-row">
              <th className="text-center">#</th>
              <th>Atleta</th>
              <th className="text-center">Categoria</th>
              <th className="text-center">Peso (kg)</th>
              <th className="text-center">Nº Lote</th>
              <th className="text-center">Equipe</th>
              <th className="text-center">1ª Tentativa</th>
              <th className="text-center">2ª Tentativa</th>
              <th className="text-center">3ª Tentativa</th>
            </tr>
          </thead>
          <tbody>
            {orderedEntriesByWeight.map((entry, index) => (
              <tr
                key={entry.id}
                className={`table-row ${isCurrentAthlete(entry.id) ? 'current-athlete-row' : ''}`}
              >
                <td className="text-center fw-bold">
                  {index + 1}
                </td>
                <td>
                  <div className="athlete-info">
                    <div className="athlete-name">{entry.name}</div>
                    <div className="athlete-details">
                      <Badge bg="secondary" className="me-1">
                        {entry.sex === 'M' ? 'M' : 'F'}
                      </Badge>
                      <Badge bg="info">
                        {entry.weightClass}
                      </Badge>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  {getWeightClassDisplay(entry)}
                </td>
                <td className="text-center">
                  {entry.bodyweightKg ? `${entry.bodyweightKg} kg` : '-'}
                </td>
                <td className="text-center">
                  {entry.lotNumber || '-'}
                </td>
                <td className="text-center">
                  {entry.team}
                </td>
                
                {/* 1ª Tentativa */}
                <td className={getAttemptCellClass(entry, 1)}>
                  <div className="attempt-input-container">
                    <div className="attempt-weight-input">
                      <Form.Control
                        type="number"
                        value={getAttemptWeight(entry, 1) || ''}
                        onChange={(e) => updateAttemptWeight(entry.id, 1, e.target.value)}
                        onBlur={(e) => handleWeightBlur(entry.id, 1, e.target.value)}
                        placeholder="Peso"
                        step="0.5"
                        min="0"
                        size="sm"
                        className="weight-input"
                        disabled={false} // Primeira tentativa sempre disponível
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-indicator">
                      <div className={`status-visual status-${getAttemptStatus(entry, 1)}`}>
                        {getAttemptStatus(entry, 1) === 1 && <span className="status-icon">✅</span>}
                        {getAttemptStatus(entry, 1) === 2 && <span className="status-icon">❌</span>}
                        {getAttemptStatus(entry, 1) === 3 && <span className="status-icon">⏸️</span>}
                        {getAttemptStatus(entry, 1) === 0 && (
                          hasActiveTimer(entry.id, 1) ? (
                            <span className={getTimerCountdownClass(entry.id, 1)}>
                              {getRemainingTime(entry.id, 1)}s
                            </span>
                          ) : (
                            <span className="status-icon">⏳</span>
                          )
                        )}
                      </div>
                      {/* Timer visual */}
                      {hasActiveTimer(entry.id, 1) && (
                        <div className="timer-indicator">
                          <small className="text-danger">
                            ⏰ {getRemainingTime(entry.id, 1)}s
                          </small>
                        </div>
                      )}
                    </div>
                    {renderBarLoad(entry, 1)}
                  </div>
                </td>

                {/* 2ª Tentativa */}
                <td className={getAttemptCellClass(entry, 2)}>
                  <div className="attempt-input-container">
                    <div className="attempt-weight-input">
                      <Form.Control
                        type="number"
                        value={getAttemptWeight(entry, 2) || ''}
                        onChange={(e) => updateAttemptWeight(entry.id, 2, e.target.value)}
                        onBlur={(e) => handleWeightBlur(entry.id, 2, e.target.value)}
                        placeholder={(() => {
                          const minWeight = getMinWeightForAttempt(entry, 2);
                          return minWeight > 0 ? `Mín: ${minWeight}kg` : 'Peso';
                        })()}
                        step="0.5"
                        min={getMinWeightForAttempt(entry, 2)}
                        size="sm"
                        className={`weight-input ${shouldMarkAsNoAttempt(entry, 2) ? 'no-attempt' : ''}`}
                        disabled={!isAttemptAvailable(entry, 2)}
                        data-min-weight={getMinWeightForAttempt(entry, 2)}
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-indicator">
                      <div className={`status-visual status-${getAttemptStatus(entry, 2)}`}>
                        {getAttemptStatus(entry, 2) === 1 && <span className="status-icon">✅</span>}
                        {getAttemptStatus(entry, 2) === 2 && <span className="status-icon">❌</span>}
                        {getAttemptStatus(entry, 2) === 3 && <span className="status-icon">⏸️</span>}
                        {getAttemptStatus(entry, 2) === 0 && (
                          hasActiveTimer(entry.id, 2) ? (
                            <span className={getTimerCountdownClass(entry.id, 2)}>
                              {getRemainingTime(entry.id, 2)}s
                            </span>
                          ) : (
                            <span className="status-icon">⏳</span>
                          )
                        )}
                      </div>
                      {/* Timer visual */}
                      {hasActiveTimer(entry.id, 2) && (
                        <div className="timer-indicator">
                          <small className="text-danger">
                            ⏰ {getRemainingTime(entry.id, 2)}s
                          </small>
                        </div>
                      )}
                    </div>
                    {shouldMarkAsNoAttempt(entry, 2) && (
                      <div className="no-attempt-indicator">
                        <small className="text-warning">⚠️ No Attempt</small>
                      </div>
                    )}
                    {renderBarLoad(entry, 2)}
                  </div>
                </td>

                {/* 3ª Tentativa */}
                <td className={getAttemptCellClass(entry, 3)}>
                  <div className="attempt-input-container">
                    <div className="attempt-weight-input">
                      <Form.Control
                        type="number"
                        value={getAttemptWeight(entry, 3) || ''}
                        onChange={(e) => updateAttemptWeight(entry.id, 3, e.target.value)}
                        onBlur={(e) => handleWeightBlur(entry.id, 3, e.target.value)}
                        placeholder={(() => {
                          const minWeight = getMinWeightForAttempt(entry, 3);
                          return minWeight > 0 ? `Mín: ${minWeight}kg` : 'Peso';
                        })()}
                        step="0.5"
                        min={getMinWeightForAttempt(entry, 3)}
                        size="sm"
                        className={`weight-input ${shouldMarkAsNoAttempt(entry, 3) ? 'no-attempt' : ''}`}
                        disabled={!isAttemptAvailable(entry, 3)}
                        data-min-weight={getMinWeightForAttempt(entry, 3)}
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-indicator">
                      <div className={`status-visual status-${getAttemptStatus(entry, 3)}`}>
                        {getAttemptStatus(entry, 3) === 1 && <span className="status-icon">✅</span>}
                        {getAttemptStatus(entry, 3) === 2 && <span className="status-icon">❌</span>}
                        {getAttemptStatus(entry, 3) === 3 && <span className="status-icon">⏸️</span>}
                        {getAttemptStatus(entry, 3) === 0 && (
                          hasActiveTimer(entry.id, 3) ? (
                            <span className={getTimerCountdownClass(entry.id, 3)}>
                              {getRemainingTime(entry.id, 3)}s
                            </span>
                          ) : (
                            <span className="status-icon">⏳</span>
                          )
                        )}
                      </div>
                      {/* Timer visual */}
                      {hasActiveTimer(entry.id, 3) && (
                        <div className="timer-indicator">
                          <small className="text-danger">
                            ⏰ {getRemainingTime(entry.id, 3)}s
                          </small>
                        </div>
                      )}
                    </div>
                    {shouldMarkAsNoAttempt(entry, 3) && (
                      <div className="no-attempt-indicator">
                        <small className="text-warning">⚠️ No Attempt</small>
                      </div>
                    )}
                    {renderBarLoad(entry, 3)}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Modal para marcar tentativa - mantido para compatibilidade */}
      <Modal show={showAttemptModal} onHide={() => setShowAttemptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Marcar Tentativa - {selectedEntry?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <div>
              <div className="mb-3">
                <strong>Atleta:</strong> {selectedEntry.name}
                <br />
                <strong>Movimento:</strong> {lift === 'S' ? 'Agachamento' : lift === 'B' ? 'Supino' : 'Terra'}
                <br />
                <strong>Tentativa:</strong> {attemptOneIndexed}ª
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Peso (kg) *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.5"
                  value={attemptWeight}
                  onChange={(e) => setAttemptWeight(e.target.value)}
                  placeholder="Digite o peso"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Resultado *</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    name="attemptStatus"
                    id="good"
                    label="Good Lift"
                    checked={attemptStatus === 1}
                    onChange={() => setAttemptStatus(1)}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    name="attemptStatus"
                    id="no-lift"
                    label="No Lift"
                    checked={attemptStatus === 2}
                    onChange={() => setAttemptStatus(2)}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    name="attemptStatus"
                    id="dns"
                    label="DNS"
                    checked={attemptStatus === 3}
                    onChange={() => setAttemptStatus(3)}
                  />
                </div>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttemptModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => {
            if (!selectedEntry || !attemptWeight) return;
            
            const weight = parseFloat(attemptWeight);
            if (isNaN(weight) || weight <= 0) {
              alert('Peso deve ser um número válido maior que zero!');
              return;
            }

            // Despachar a ação para marcar a tentativa
            dispatch(markAttempt(selectedEntry.id, lift, attemptOneIndexed, attemptStatus, weight));
            
            // Fechar modal e limpar estado
            setShowAttemptModal(false);
            setSelectedEntry(null);
            setAttemptWeight('');
            setAttemptStatus(1);
          }} disabled={!attemptWeight}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LiftingTable;
