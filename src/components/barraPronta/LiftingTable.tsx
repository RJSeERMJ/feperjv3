import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Badge, Form, Row, Col, Modal } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { markAttempt, updateEntry } from '../../actions/barraProntaActions';
import { LiftStatus, Lift } from '../../types/barraProntaTypes';
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
  const [localSelectedAttempt, setLocalSelectedAttempt] = useState<number>(1);
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

  // Obter o label do status
  const getStatusLabel = (status: LiftStatus): string => {
    switch (status) {
      case 1: return 'Good Lift';
      case 2: return 'No Lift';
      case 3: return 'DNS';
      default: return 'Pendente';
    }
  };

  // Obter a cor do status
  const getStatusVariant = (status: LiftStatus): string => {
    switch (status) {
      case 1: return 'success';
      case 2: return 'danger';
      case 3: return 'warning';
      default: return 'secondary';
    }
  };

  // Obter o ícone do status
  const getStatusIcon = (status: LiftStatus): string => {
    switch (status) {
      case 1: return '✅';
      case 2: return '❌';
      case 3: return '⏸️';
      default: return '⏳';
    }
  };

  // Abrir modal para marcar tentativa
  const openAttemptModal = (entry: any, attempt: number) => {
    setSelectedEntry(entry);
    setLocalSelectedAttempt(attempt);
    
    // Carregar peso atual se existir
    const currentWeight = getAttemptWeight(entry, attempt);
    setAttemptWeight(currentWeight > 0 ? currentWeight.toString() : '');
    
    // Carregar status atual se existir
    const currentStatus = getAttemptStatus(entry, attempt);
    setAttemptStatus(currentStatus || 1);
    
    setShowAttemptModal(true);
  };

  // Salvar tentativa
  const saveAttempt = () => {
    if (!selectedEntry || !attemptWeight) return;
    
    const weight = parseFloat(attemptWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Peso deve ser um número válido maior que zero!');
      return;
    }

    // Despachar a ação para marcar a tentativa
    dispatch(markAttempt(selectedEntry.id, lift, localSelectedAttempt, attemptStatus, weight));
    
    // Fechar modal e limpar estado
    setShowAttemptModal(false);
    setSelectedEntry(null);
    setAttemptWeight('');
    setAttemptStatus(1);
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

  // Função para obter o campo de status baseado no movimento atual
  const getStatusField = (): string => {
    switch (lift) {
      case 'S': return 'squatStatus';
      case 'B': return 'benchStatus';
      case 'D': return 'deadliftStatus';
      default: return '';
    }
  };

  // Função para atualizar o peso de uma tentativa
  const updateAttemptWeight = (entryId: number, attempt: number, weight: string) => {
    const weightField = getWeightField(attempt);
    const statusField = getStatusField();
    
    if (weightField && statusField) {
      const weightValue = weight === '' ? null : parseFloat(weight);
      
      // Atualizar o peso
      dispatch(updateEntry(entryId, { [weightField]: weightValue }));
      
      // Se não há status definido, definir como pendente (0)
      const currentEntry = orderedEntries.find(e => e.id === entryId);
      if (currentEntry) {
        const statusArray = currentEntry[statusField] || [0, 0, 0];
        if (statusArray[attempt - 1] === undefined || statusArray[attempt - 1] === 0) {
          const newStatusArray = [...statusArray];
          newStatusArray[attempt - 1] = 0; // Pendente
          dispatch(updateEntry(entryId, { [statusField]: newStatusArray }));
        }
      }
    }
  };

  // Função para atualizar o status de uma tentativa
  const updateAttemptStatus = (entryId: number, attempt: number, status: LiftStatus) => {
    const statusField = getStatusField();
    
    if (statusField) {
      const currentEntry = orderedEntries.find(e => e.id === entryId);
      if (currentEntry) {
        const statusArray = currentEntry[statusField] || [0, 0, 0];
        const newStatusArray = [...statusArray];
        newStatusArray[attempt - 1] = status;
        dispatch(updateEntry(entryId, { [statusField]: newStatusArray }));
      }
    }
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
            {orderedEntries.map((entry, index) => (
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
                <td className={`text-center attempt-cell ${isCurrentAthlete(entry.id) && isCurrentAttempt(1) ? 'current-attempt' : ''} ${isAttemptSelected(entry.id, 1) ? 'selected-attempt' : ''}`}>
                  <div className="attempt-input-container">
                    <div className="attempt-weight-input">
                      <Form.Control
                        type="number"
                        value={getAttemptWeight(entry, 1) || ''}
                        onChange={(e) => updateAttemptWeight(entry.id, 1, e.target.value)}
                        placeholder="Peso"
                        step="0.5"
                        min="0"
                        size="sm"
                        className="weight-input"
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-selector">
                      <Form.Select
                        size="sm"
                        value={getAttemptStatus(entry, 1) || 0}
                        onChange={(e) => updateAttemptStatus(entry.id, 1, parseInt(e.target.value) as LiftStatus)}
                        className="status-select"
                      >
                        <option value={0}>⏳ Pendente</option>
                        <option value={1}>✅ Good Lift</option>
                        <option value={2}>❌ No Lift</option>
                        <option value={3}>⏸️ DNS</option>
                      </Form.Select>
                    </div>
                  </div>
                </td>

                {/* 2ª Tentativa */}
                <td className={`text-center attempt-cell ${isCurrentAthlete(entry.id) && isCurrentAttempt(2) ? 'current-attempt' : ''} ${isAttemptSelected(entry.id, 2) ? 'selected-attempt' : ''}`}>
                  <div className="attempt-input-container">
                    <div className="attempt-weight-input">
                      <Form.Control
                        type="number"
                        value={getAttemptWeight(entry, 2) || ''}
                        onChange={(e) => updateAttemptWeight(entry.id, 2, e.target.value)}
                        placeholder="Peso"
                        step="0.5"
                        min="0"
                        size="sm"
                        className="weight-input"
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-selector">
                      <Form.Select
                        size="sm"
                        value={getAttemptStatus(entry, 2) || 0}
                        onChange={(e) => updateAttemptStatus(entry.id, 2, parseInt(e.target.value) as LiftStatus)}
                        className="status-select"
                      >
                        <option value={0}>⏳ Pendente</option>
                        <option value={1}>✅ Good Lift</option>
                        <option value={2}>❌ No Lift</option>
                        <option value={3}>⏸️ DNS</option>
                      </Form.Select>
                    </div>
                  </div>
                </td>

                {/* 3ª Tentativa */}
                <td className={`text-center attempt-cell ${isCurrentAthlete(entry.id) && isCurrentAttempt(3) ? 'current-attempt' : ''} ${isAttemptSelected(entry.id, 3) ? 'selected-attempt' : ''}`}>
                  <div className="attempt-input-container">
                    <div className="attempt-weight-input">
                      <Form.Control
                        type="number"
                        value={getAttemptWeight(entry, 3) || ''}
                        onChange={(e) => updateAttemptWeight(entry.id, 3, e.target.value)}
                        placeholder="Peso"
                        step="0.5"
                        min="0"
                        size="sm"
                        className="weight-input"
                      />
                      <span className="ms-1">kg</span>
                    </div>
                    <div className="attempt-status-selector">
                      <Form.Select
                        size="sm"
                        value={getAttemptStatus(entry, 3) || 0}
                        onChange={(e) => updateAttemptStatus(entry.id, 3, parseInt(e.target.value) as LiftStatus)}
                        className="status-select"
                      >
                        <option value={0}>⏳ Pendente</option>
                        <option value={1}>✅ Good Lift</option>
                        <option value={2}>❌ No Lift</option>
                        <option value={3}>⏸️ DNS</option>
                      </Form.Select>
                    </div>
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
                <strong>Tentativa:</strong> {localSelectedAttempt}ª
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
          <Button variant="primary" onClick={saveAttempt} disabled={!attemptWeight}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LiftingTable;
