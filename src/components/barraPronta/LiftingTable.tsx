import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Badge, Form, Row, Col, Modal } from 'react-bootstrap';
import { RootState } from '../../store/barraProntaStore';
import { setAttemptOneIndexed, setOverrideEntryId } from '../../reducers/liftingReducer';
import { markAttempt } from '../../actions/barraProntaActions';
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
  const { lift } = useSelector((state: RootState) => state.lifting);
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<number>(1);
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
    setSelectedAttempt(attempt);
    
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
    dispatch(markAttempt(selectedEntry.id, lift, selectedAttempt, attemptStatus, weight) as any);
    
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
              <th className="text-center">Equipe</th>
              <th className="text-center">1ª Tentativa</th>
              <th className="text-center">2ª Tentativa</th>
              <th className="text-center">3ª Tentativa</th>
              <th className="text-center">Ações</th>
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
                  {entry.weightClass}
                </td>
                <td className="text-center">
                  {entry.team}
                </td>
                
                {/* 1ª Tentativa */}
                <td className={`text-center attempt-cell ${isCurrentAthlete(entry.id) && isCurrentAttempt(1) ? 'current-attempt' : ''}`}>
                  <div className="attempt-weight">
                    {getAttemptWeight(entry, 1) > 0 ? `${getAttemptWeight(entry, 1)} kg` : '-'}
                  </div>
                  <div className="attempt-status">
                    <Badge bg={getStatusVariant(getAttemptStatus(entry, 1))}>
                      {getStatusIcon(getAttemptStatus(entry, 1))} {getStatusLabel(getAttemptStatus(entry, 1))}
                    </Badge>
                  </div>
                </td>

                {/* 2ª Tentativa */}
                <td className={`text-center attempt-cell ${isCurrentAthlete(entry.id) && isCurrentAttempt(2) ? 'current-attempt' : ''}`}>
                  <div className="attempt-weight">
                    {getAttemptWeight(entry, 2) > 0 ? `${getAttemptWeight(entry, 2)} kg` : '-'}
                  </div>
                  <div className="attempt-status">
                    <Badge bg={getStatusVariant(getAttemptStatus(entry, 2))}>
                      {getStatusIcon(getAttemptStatus(entry, 2))} {getStatusLabel(getAttemptStatus(entry, 2))}
                    </Badge>
                  </div>
                </td>

                {/* 3ª Tentativa */}
                <td className={`text-center attempt-cell ${isCurrentAthlete(entry.id) && isCurrentAttempt(3) ? 'current-attempt' : ''}`}>
                  <div className="attempt-weight">
                    {getAttemptWeight(entry, 3) > 0 ? `${getAttemptWeight(entry, 3)} kg` : '-'}
                  </div>
                  <div className="attempt-status">
                    <Badge bg={getStatusVariant(getAttemptStatus(entry, 3))}>
                      {getStatusIcon(getAttemptStatus(entry, 3))} {getStatusLabel(getAttemptStatus(entry, 3))}
                    </Badge>
                  </div>
                </td>

                <td className="text-center">
                  <div className="action-buttons">
                    {[1, 2, 3].map((attempt) => (
                      <Button
                        key={attempt}
                        variant="primary"
                        size="sm"
                        className="me-1 mb-1"
                        onClick={() => openAttemptModal(entry, attempt)}
                        disabled={getAttemptStatus(entry, attempt) !== 0}
                      >
                        {attempt}ª Tentativa
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Modal para marcar tentativa */}
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
                <strong>Tentativa:</strong> {selectedAttempt}ª
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
