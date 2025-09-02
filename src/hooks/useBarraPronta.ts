import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState } from '../store/barraProntaStore';
import { 
  getLiftName, 
  getAttemptWeight, 
  getAttemptStatus, 
  hasAttemptWeight,
  isAttemptMarked,
  getBestWeight,
  getAthleteTotal,
  getWeightField,
  getStatusField
} from '../utils/barraProntaUtils';
import type { Entry, Lift, LiftStatus } from '../types/barraProntaTypes';

/**
 * Hook customizado para gerenciar estado do Barra Pronta
 * Centraliza lógica comum usada em vários componentes
 */

/**
 * Hook para obter dados da competição
 */
export const useMeet = () => {
  const meet = useSelector((state: RootState) => state.meet);
  
  return {
    meet,
    // Métodos úteis
    getBarAndCollarsWeight: useCallback((lift: Lift) => {
      const weightFields = {
        S: 'squatBarAndCollarsWeightKg',
        B: 'benchBarAndCollarsWeightKg',
        D: 'deadliftBarAndCollarsWeightKg'
      } as const;
      
      return meet[weightFields[lift]] || 20;
    }, [meet]),
    
    getWeightClasses: useCallback((sex: 'M' | 'F') => {
      return sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    }, [meet])
  };
};

/**
 * Hook para obter dados de registro
 */
export const useRegistration = () => {
  const registration = useSelector((state: RootState) => state.registration);
  
  return {
    registration,
    entries: registration.entries,
    nextEntryId: registration.nextEntryId
  };
};

/**
 * Hook para obter dados de lifting
 */
export const useLifting = () => {
  const lifting = useSelector((state: RootState) => state.lifting);
  const dispatch = useDispatch();
  
  return {
    lifting,
    day: lifting.day,
    platform: lifting.platform,
    flight: lifting.flight,
    lift: lifting.lift,
    attemptOneIndexed: lifting.attemptOneIndexed,
    selectedEntryId: lifting.selectedEntryId,
    selectedAttempt: lifting.selectedAttempt,
    isAttemptActive: lifting.isAttemptActive,
    
    // Métodos úteis
    getLiftName: useCallback(() => getLiftName(lifting.lift), [lifting.lift]),
    
    setDay: useCallback((day: number) => {
      dispatch({ type: 'lifting/setDay', payload: day });
    }, [dispatch]),
    
    setPlatform: useCallback((platform: number) => {
      dispatch({ type: 'lifting/setPlatform', payload: platform });
    }, [dispatch]),
    
    setFlight: useCallback((flight: string) => {
      dispatch({ type: 'lifting/setFlight', payload: flight });
    }, [dispatch]),
    
    setLift: useCallback((lift: Lift) => {
      dispatch({ type: 'lifting/setLift', payload: lift });
    }, [dispatch]),
    
    setAttemptOneIndexed: useCallback((attempt: number) => {
      dispatch({ type: 'lifting/setAttemptOneIndexed', payload: attempt });
    }, [dispatch]),
    
    setSelectedEntryId: useCallback((entryId: number | null) => {
      dispatch({ type: 'lifting/setSelectedEntryId', payload: entryId });
    }, [dispatch]),
    
    setSelectedAttempt: useCallback((attempt: number) => {
      dispatch({ type: 'lifting/setSelectedAttempt', payload: attempt });
    }, [dispatch]),
    
    setAttemptActive: useCallback((active: boolean) => {
      dispatch({ type: 'lifting/setAttemptActive', payload: active });
    }, [dispatch])
  };
};

/**
 * Hook para filtrar atletas por dia, plataforma e grupo
 */
export const useFilteredEntries = () => {
  const { day, platform, flight } = useLifting();
  const { entries } = useRegistration();
  
  const filteredEntries = useMemo(() => {
    return entries.filter((entry: Entry) => 
      entry.day === day && 
      entry.platform === platform && 
      entry.flight === flight
    );
  }, [entries, day, platform, flight]);
  
  return {
    filteredEntries,
    totalEntries: entries.length,
    filteredCount: filteredEntries.length
  };
};

/**
 * Hook para trabalhar com tentativas de um atleta
 */
export const useAthleteAttempts = (entry: Entry) => {
  const { lift, attemptOneIndexed } = useLifting();
  
  const currentWeight = useMemo(() => 
    getAttemptWeight(entry, lift, attemptOneIndexed), 
    [entry, lift, attemptOneIndexed]
  );
  
  const currentStatus = useMemo(() => 
    getAttemptStatus(entry, lift, attemptOneIndexed), 
    [entry, lift, attemptOneIndexed]
  );
  
  const hasCurrentWeight = useMemo(() => 
    hasAttemptWeight(entry, lift, attemptOneIndexed), 
    [entry, lift, attemptOneIndexed]
  );
  
  const isCurrentMarked = useMemo(() => 
    isAttemptMarked(entry, lift, attemptOneIndexed), 
    [entry, lift, attemptOneIndexed]
  );
  
  const bestWeight = useMemo(() => 
    getBestWeight(entry, lift), 
    [entry, lift]
  );
  
  const totalWeight = useMemo(() => 
    getAthleteTotal(entry), 
    [entry]
  );
  
  // Obter dados de todas as tentativas do movimento atual
  const attempts = useMemo(() => {
    return [1, 2, 3].map(attempt => ({
      attempt,
      weight: getAttemptWeight(entry, lift, attempt),
      status: getAttemptStatus(entry, lift, attempt),
      hasWeight: hasAttemptWeight(entry, lift, attempt),
      isMarked: isAttemptMarked(entry, lift, attempt),
      isCurrent: attempt === attemptOneIndexed
    }));
  }, [entry, lift, attemptOneIndexed]);
  
  return {
    currentWeight,
    currentStatus,
    hasCurrentWeight,
    isCurrentMarked,
    bestWeight,
    totalWeight,
    attempts,
    
    // Métodos úteis
    getAttemptWeight: useCallback((attempt: number) => 
      getAttemptWeight(entry, lift, attempt), 
      [entry, lift]
    ),
    
    getAttemptStatus: useCallback((attempt: number) => 
      getAttemptStatus(entry, lift, attempt), 
      [entry, lift]
    ),
    
    hasAttemptWeight: useCallback((attempt: number) => 
      hasAttemptWeight(entry, lift, attempt), 
      [entry, lift]
    ),
    
    isAttemptMarked: useCallback((attempt: number) => 
      isAttemptMarked(entry, lift, attempt), 
      [entry, lift]
    )
  };
};

/**
 * Hook para trabalhar com a ordem de levantamentos
 */
export const useLiftingOrder = () => {
  const { filteredEntries } = useFilteredEntries();
  const { lift, attemptOneIndexed } = useLifting();
  
  const orderedEntries = useMemo(() => {
    // Ordenar por peso da tentativa atual
    return [...filteredEntries].sort((a, b) => {
      const weightA = getAttemptWeight(a, lift, attemptOneIndexed);
      const weightB = getAttemptWeight(b, lift, attemptOneIndexed);
      
      // Se ambos têm peso definido, ordenar por peso (decrescente)
      if (weightA > 0 && weightB > 0) {
        return weightB - weightA;
      }
      
      // Se apenas um tem peso, ele vai primeiro
      if (weightA > 0) return -1;
      if (weightB > 0) return 1;
      
      // Se nenhum tem peso, manter ordem original
      return 0;
    });
  }, [filteredEntries, lift, attemptOneIndexed]);
  
  const currentEntry = useMemo(() => 
    orderedEntries[0] || null, 
    [orderedEntries]
  );
  
  const nextEntry = useMemo(() => 
    orderedEntries[1] || null, 
    [orderedEntries]
  );
  
  return {
    orderedEntries,
    currentEntry,
    nextEntry,
    totalOrdered: orderedEntries.length
  };
};

/**
 * Hook para trabalhar com estatísticas da competição
 */
export const useCompetitionStats = () => {
  const { entries } = useRegistration();
  const { filteredEntries } = useFilteredEntries();
  const { lift } = useLifting();
  
  const stats = useMemo(() => {
    const totalAthletes = entries.length;
    const currentAthletes = filteredEntries.length;
    
    // Contar tentativas por status
    const attemptStats = filteredEntries.reduce((acc, entry) => {
      [1, 2, 3].forEach(attempt => {
        const status = getAttemptStatus(entry, lift, attempt);
        acc[status] = (acc[status] || 0) + 1;
      });
      return acc;
    }, {} as Record<LiftStatus, number>);
    
    // Contar atletas com peso definido
    const athletesWithWeight = filteredEntries.filter(entry => 
      hasAttemptWeight(entry, lift, 1) || 
      hasAttemptWeight(entry, lift, 2) || 
      hasAttemptWeight(entry, lift, 3)
    ).length;
    
    // Contar atletas com tentativas marcadas
    const athletesWithAttempts = filteredEntries.filter(entry => 
      isAttemptMarked(entry, lift, 1) || 
      isAttemptMarked(entry, lift, 2) || 
      isAttemptMarked(entry, lift, 3)
    ).length;
    
    return {
      totalAthletes,
      currentAthletes,
      athletesWithWeight,
      athletesWithAttempts,
      attemptStats,
      pendingAttempts: attemptStats[0] || 0,
      goodLifts: attemptStats[1] || 0,
      noLifts: attemptStats[2] || 0,
      noAttempts: attemptStats[3] || 0
    };
  }, [entries, filteredEntries, lift]);
  
  return stats;
};
