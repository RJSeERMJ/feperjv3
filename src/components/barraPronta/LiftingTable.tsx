import React, { useState, useEffect, useMemo } from 'react';
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
    
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [0, 0, 0];
    
    // Verificar se a tentativa anterior foi marcada (válida ou inválida)
    const previousAttempt = statusArray[attempt - 2]; // attempt - 2 porque array é 0-indexed
    return previousAttempt === 1 || previousAttempt === 2; // 1 = Good Lift, 2 = No Lift
  };

  // NOVA FUNÇÃO: Verificar se o peso é válido (progressivo)
  const isWeightValid = (entry: any, attempt: number, newWeight: number): boolean => {
    if (attempt === 1) return true; // Primeira tentativa sempre válida
    
    // Verificar se o peso é maior que zero
    if (newWeight <= 0) return false;
    
    // Verificar se é maior que a tentativa anterior
    for (let i = attempt - 1; i >= 1; i--) {
      const previousWeight = getAttemptWeight(entry, i);
      if (previousWeight > 0 && newWeight <= previousWeight) {
        return false; // Peso deve ser maior que o anterior
      }
    }
    
    return true;
  };

  // NOVA FUNÇÃO: Obter mensagem de erro para peso inválido
  const getWeightValidationMessage = (entry: any, attempt: number, newWeight: number): string | null => {
    if (attempt === 1) return null;
    
    if (newWeight <= 0) return 'Peso deve ser maior que zero';
    
    // Verificar se é maior que a tentativa anterior
    for (let i = attempt - 1; i >= 1; i--) {
      const previousWeight = getAttemptWeight(entry, i);
      if (previousWeight > 0 && newWeight <= previousWeight) {
        return `Peso deve ser maior que ${previousWeight}kg (${i}ª tentativa)`;
      }
    }
    
    return null;
  };

  // NOVA FUNÇÃO: Verificar se uma tentativa deve ser marcada como DNS
  const shouldMarkAsDNS = (entry: any, attempt: number): boolean => {
    // Se é a primeira tentativa, não marcar como DNS
    if (attempt === 1) return false;
    
    // Verificar se a tentativa anterior foi marcada
    const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
    const statusArray = entry[statusField] || [0, 0, 0];
    const previousAttempt = statusArray[attempt - 2];
    
    // Se a tentativa anterior foi marcada (Good/No Lift) e a atual não tem peso, marcar como DNS
    if ((previousAttempt === 1 || previousAttempt === 2) && !getAttemptWeight(entry, attempt)) {
      return true;
    }
    
    return false;
  };

  // Função para obter a classe CSS baseada na disponibilidade da tentativa
  const getAttemptCellClass = (entry: any, attempt: number): string => {
    const baseClass = `text-center attempt-cell`;
    const isCurrent = isCurrentAthlete(entry.id) && isCurrentAttempt(attempt);
    const isSelected = isAttemptSelected(entry.id, attempt);
    const isAvailable = isAttemptAvailable(entry, attempt);
    
    let classes = baseClass;
    
    if (isCurrent) classes += ' current-attempt';
    if (isSelected) classes += ' selected-attempt';
    if (!isAvailable) classes += ' blocked-attempt';
    
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
        if (currentEntry && shouldMarkAsDNS(currentEntry, attempt)) {
          const statusField = lift === 'S' ? 'squatStatus' : lift === 'B' ? 'benchStatus' : 'deadliftStatus';
          const statusArray = (currentEntry as any)[statusField] || [0, 0, 0];
          const newStatusArray = [...statusArray];
          newStatusArray[attempt - 1] = 3; // 3 = DNS (Did Not Start)
          dispatch(updateEntry(entryId, { [statusField]: newStatusArray }));
          console.log(`🔄 Tentativa ${attempt} marcada automaticamente como DNS para atleta ${entryId}`);
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
                        {getAttemptStatus(entry, 1) === 0 && <span className="status-icon">⏳</span>}
                      </div>
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
                        placeholder={getAttemptWeight(entry, 1) ? `Mín: ${getAttemptWeight(entry, 1) + 0.5}kg` : 'Peso'}
                        step="0.5"
                        min={getAttemptWeight(entry, 1) ? getAttemptWeight(entry, 1) + 0.5 : 0}
                        size="sm"
                        className={`weight-input ${shouldMarkAsDNS(entry, 2) ? 'dns-attempt' : ''}`}
                        disabled={!isAttemptAvailable(entry, 2)}
                        data-min-weight={getAttemptWeight(entry, 1) ? getAttemptWeight(entry, 1) + 0.5 : 0}
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-indicator">
                      <div className={`status-visual status-${getAttemptStatus(entry, 2)}`}>
                        {getAttemptStatus(entry, 2) === 1 && <span className="status-icon">✅</span>}
                        {getAttemptStatus(entry, 2) === 2 && <span className="status-icon">❌</span>}
                        {getAttemptStatus(entry, 2) === 3 && <span className="status-icon">⏸️</span>}
                        {getAttemptStatus(entry, 2) === 0 && <span className="status-icon">⏳</span>}
                      </div>
                    </div>
                    {shouldMarkAsDNS(entry, 2) && (
                      <div className="dns-indicator">
                        <small className="text-warning">⚠️ DNS (Desistência)</small>
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
                          const weight2 = getAttemptWeight(entry, 2);
                          const weight1 = getAttemptWeight(entry, 1);
                          if (weight2) return `Mín: ${weight2 + 0.5}kg`;
                          if (weight1) return `Mín: ${weight1 + 0.5}kg`;
                          return 'Peso';
                        })()}
                        step="0.5"
                        min={getAttemptWeight(entry, 2) ? getAttemptWeight(entry, 2) + 0.5 : 
                             getAttemptWeight(entry, 1) ? getAttemptWeight(entry, 1) + 0.5 : 0}
                        size="sm"
                        className={`weight-input ${shouldMarkAsDNS(entry, 3) ? 'dns-attempt' : ''}`}
                        disabled={!isAttemptAvailable(entry, 3)}
                        data-min-weight={getAttemptWeight(entry, 2) ? getAttemptWeight(entry, 2) + 0.5 : 
                                       getAttemptWeight(entry, 1) ? getAttemptWeight(entry, 1) + 0.5 : 0}
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-indicator">
                      <div className={`status-visual status-${getAttemptStatus(entry, 3)}`}>
                        {getAttemptStatus(entry, 3) === 1 && <span className="status-icon">✅</span>}
                        {getAttemptStatus(entry, 3) === 3 && <span className="status-icon">⏸️</span>}
                        {getAttemptStatus(entry, 3) === 0 && <span className="status-icon">⏳</span>}
                      </div>
                    </div>
                    {shouldMarkAsDNS(entry, 3) && (
                      <div className="dns-indicator">
                        <small className="text-warning">⚠️ DNS (Desistência)</small>
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
