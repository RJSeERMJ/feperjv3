import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Card, 
  Table,
  Badge,
  Alert
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState } from '../../types/barraProntaTypes';
import { updateEntry } from '../../actions/barraProntaActions';
import { FaWeightHanging, FaCheck, FaTimes, FaUser, FaFilter, FaListOl } from 'react-icons/fa';

const WeighIns: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
  const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
   const [filterDay, setFilterDay] = useState<'all' | number>('all');
   const [filterFlight, setFilterFlight] = useState<'all' | string>('all');
   const [filterPlatform, setFilterPlatform] = useState<'all' | number>('all');
  const [filterWeighed, setFilterWeighed] = useState<'all' | 'weighed' | 'not-weighed'>('all');
  const [openMovementsDropdown, setOpenMovementsDropdown] = useState<number | null>(null);

  // Função para gerar números de lote únicos (1 a N atletas)
  const generateUniqueLotNumbers = (): number[] => {
    const totalAthletes = registration.entries.length;
    const numbers = Array.from({ length: totalAthletes }, (_, i) => i + 1);
    
    // Embaralhar os números para distribuição aleatória
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    return numbers;
  };

  // Função para atribuir números de lote únicos a todos os atletas
  const assignLotNumbersToAll = () => {
    const lotNumbers = generateUniqueLotNumbers();
    const entriesWithoutLot = registration.entries.filter(entry => !entry.lotNumber);
    
    entriesWithoutLot.forEach((entry, index) => {
      if (index < lotNumbers.length) {
        dispatch(updateEntry(entry.id, {
          lotNumber: lotNumbers[index]
        }));
      }
    });
  };



  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  const isWeightValid = (bodyweight: number, targetWeightClass: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const targetIndex = classes.indexOf(targetWeightClass);
    
    if (targetIndex === 0) {
      return bodyweight <= targetWeightClass;
    } else if (targetIndex === classes.length - 1) {
      const previousLimit = classes[targetIndex - 1];
      return bodyweight > previousLimit;
    } else {
      const previousLimit = classes[targetIndex - 1];
      return bodyweight > previousLimit && bodyweight <= targetWeightClass;
    }
  };

  // Filtrar entradas
  const filteredEntries = registration.entries.filter(entry => {
    if (filterSex !== 'all' && entry.sex !== filterSex) return false;
     if (filterDay !== 'all' && entry.day !== filterDay) return false;
     if (filterFlight !== 'all' && entry.flight !== filterFlight) return false;
     if (filterPlatform !== 'all' && entry.platform !== filterPlatform) return false;
    if (filterWeighed === 'weighed' && entry.bodyweightKg === null) return false;
    if (filterWeighed === 'not-weighed' && entry.bodyweightKg !== null) return false;
    return true;
  });

  const weighedCount = registration.entries.filter(entry => entry.bodyweightKg !== null).length;
  const totalCount = registration.entries.length;
  const lotNumbersAssigned = registration.entries.filter(entry => entry.lotNumber !== null).length;

  // Função para verificar se deve aplicar overflow automático
  const shouldAutoOverflow = useCallback(() => {
    // Verificar se há apenas 1 dia configurado
    const singleDay = meet.lengthDays === 1;
    
    // Verificar se há apenas 1 plataforma em todos os dias
    const singlePlatform = meet.platformsOnDays && meet.platformsOnDays.length > 0 && 
                          meet.platformsOnDays.every(platforms => platforms === 1);
    
    return { singleDay, singlePlatform };
  }, [meet.lengthDays, meet.platformsOnDays]);

  // Função para preencher automaticamente dia, plataforma e movimentos
  const autoFillDayAndPlatform = useCallback(() => {
    registration.entries.forEach(entry => {
      // Auto-preencher dia se não estiver definido
      if (entry.day === null) {
        const currentDay = Math.min(entry.id % meet.lengthDays + 1, meet.lengthDays);
        dispatch(updateEntry(entry.id, { day: currentDay }));
      }
      
      // Auto-preencher plataforma se houver apenas 1 plataforma no dia
      const currentDay = entry.day || 1;
      const platformsForDay = meet.platformsOnDays[currentDay - 1] || 1;
      if (platformsForDay === 1 && entry.platform === null) {
        dispatch(updateEntry(entry.id, { platform: 1 }));
      }
      
      // Removido: Auto-preenchimento de movimentos - agora é preenchimento manual
    });
  }, [meet.lengthDays, meet.platformsOnDays, registration.entries, dispatch]);

  // Executar auto-preenchimento quando o componente montar ou quando meet mudar
  useEffect(() => {
    // Garantir que as configurações existem antes de executar
    if (meet.lengthDays && meet.platformsOnDays) {
      autoFillDayAndPlatform();
    }
  }, [meet.lengthDays, meet.platformsOnDays, registration.entries.length, autoFillDayAndPlatform]);

  // Fechar dropdown quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMovementsDropdown !== null) {
        // Verificar se o clique foi fora do dropdown
        const target = event.target as Element;
        const dropdownContainer = document.querySelector(`[data-dropdown-id="${openMovementsDropdown}"]`);
        const buttonContainer = document.querySelector(`button[data-dropdown-id="${openMovementsDropdown}"]`);
        
        // Verificar se o clique foi em um checkbox
        const isCheckbox = target.closest('input[type="checkbox"]');
        if (isCheckbox) {
          console.log('Click on checkbox, not closing dropdown');
          return; // Não fechar se clicou em checkbox
        }
        
        if (dropdownContainer && !dropdownContainer.contains(target) && 
            buttonContainer && !buttonContainer.contains(target)) {
          console.log('Click outside dropdown, closing');
          setOpenMovementsDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMovementsDropdown]);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Pesagem e Configuração</h3>
              <p className="text-muted">Registre peso corporal, alturas e pesos das primeiras tentativas</p>
            </div>
            <div className="text-end">
               <div className="d-flex flex-column align-items-end">
                 <Badge bg="success" className="fs-6 mb-1">
                {weighedCount}/{totalCount} Atletas Pesados
              </Badge>
                 <Badge bg="info" className="fs-6">
                   {lotNumbersAssigned}/{totalCount} Lotes Atribuídos
                 </Badge>
               </div>
            </div>
          </div>
        </Col>
      </Row>

             {/* Botão para atribuir números de lote */}
       <Row className="mb-3">
         <Col>
           <Button 
             variant="outline-primary" 
             onClick={assignLotNumbersToAll}
             disabled={lotNumbersAssigned === totalCount}
           >
             <FaListOl className="me-2" />
             {lotNumbersAssigned === totalCount 
               ? 'Todos os Lotes Atribuídos' 
               : `Atribuir Números de Lote (${totalCount - lotNumbersAssigned} restantes)`
             }
           </Button>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h5>Filtros</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Sexo</Form.Label>
                <Form.Select
                  value={filterSex}
                  onChange={(e) => setFilterSex(e.target.value as 'all' | 'M' | 'F')}
                >
                  <option value="all">Todos</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                 <Form.Label>Dia</Form.Label>
                 <Form.Select
                   value={filterDay}
                   onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                   disabled={shouldAutoOverflow().singleDay}
                 >
                   <option value="all">Todos</option>
                   {Array.from({ length: meet.lengthDays }, (_, i) => (
                     <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                   ))}
                 </Form.Select>
                 {shouldAutoOverflow().singleDay && (
                   <Form.Text className="text-muted">
                     Auto: Apenas 1 dia configurado
                   </Form.Text>
                 )}
               </Form.Group>
             </Col>
             <Col md={2}>
               <Form.Group>
                 <Form.Label>Grupo</Form.Label>
                 <Form.Select
                   value={filterFlight}
                   onChange={(e) => setFilterFlight(e.target.value)}
                 >
                   <option value="all">Todos</option>
                   {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(flight => (
                     <option key={flight} value={flight}>Grupo {flight}</option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </Col>
                         <Col md={2}>
               <Form.Group>
                 <Form.Label>Plataforma</Form.Label>
                <Form.Select
                   value={filterPlatform}
                   onChange={(e) => setFilterPlatform(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                   disabled={shouldAutoOverflow().singlePlatform}
                >
                  <option value="all">Todas</option>
                   {Array.from({ length: meet.platformsOnDays[0] || 1 }, (_, i) => (
                     <option key={i + 1} value={i + 1}>Plataforma {i + 1}</option>
                  ))}
                </Form.Select>
                {shouldAutoOverflow().singlePlatform && (
                  <Form.Text className="text-muted">
                    Auto: Apenas 1 plataforma configurada
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status da Pesagem</Form.Label>
                <Form.Select
                  value={filterWeighed}
                  onChange={(e) => setFilterWeighed(e.target.value as 'all' | 'weighed' | 'not-weighed')}
                >
                  <option value="all">Todos</option>
                  <option value="weighed">Já Pesados</option>
                  <option value="not-weighed">Não Pesados</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setFilterSex('all');
                   setFilterDay('all');
                   setFilterFlight('all');
                   setFilterPlatform('all');
                  setFilterWeighed('all');
                }}
              >
                <FaFilter className="me-2" />
                Limpar Filtros
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filteredEntries.length === 0 ? (
        <Alert variant="info">
          <FaUser className="me-2" />
          Nenhum atleta encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Lista de Pesagem e Configuração ({filteredEntries.length} atletas)</h5>
            <small className="text-muted">
              Clique nas células para editar diretamente. Números de lote são únicos e sequenciais.
            </small>
            {(shouldAutoOverflow().singleDay || shouldAutoOverflow().singlePlatform) && (
              <div className="mt-2">
                <small className="text-info">
                  <strong>Overflow Automático Ativo:</strong>
                  {shouldAutoOverflow().singleDay && <span className="ms-2">• Dia: Auto-preenchido (1 dia configurado)</span>}
                  {shouldAutoOverflow().singlePlatform && <span className="ms-2">• Plataforma: Auto-preenchida (1 plataforma configurada)</span>}
                </small>
              </div>
            )}
            <div className="mt-2">
              <small className="text-muted">
                <strong>Configurações Atuais:</strong> {meet.lengthDays} dia(s), {meet.platformsOnDays.join(', ')} plataforma(s) por dia
              </small>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Table striped hover>
                                 <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr>
                  <th>Nome</th>
                  <th>Sexo</th>
                  <th>Categoria</th>
                  <th>Peso Corporal</th>
                  <th>Número do Lote</th>
                     <th>
                       Dia
                       {shouldAutoOverflow().singleDay && (
                         <Badge bg="success" className="ms-1" style={{ fontSize: '0.6em' }}>AUTO</Badge>
                       )}
                     </th>
                     <th>Grupo</th>
                     <th>
                       Plataforma
                       {shouldAutoOverflow().singlePlatform && (
                         <Badge bg="success" className="ms-1" style={{ fontSize: '0.6em' }}>AUTO</Badge>
                       )}
                     </th>
                     <th>Movimentos</th>
                     <th>Alt Agacho</th>
                     <th>A/S Supino</th>
                     <th>1ª Agacho</th>
                     <th>1ª Supino</th>
                     <th>1ª Terra</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => {
                  const isWeighed = entry.bodyweightKg !== null;
                  const weightClass = entry.weightClassKg || 0;
                  const bodyweight = entry.bodyweightKg;
                  const isValidWeight = bodyweight ? isWeightValid(bodyweight, weightClass, entry.sex) : true;
                  
                  return (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.name}</strong>
                        {entry.team && (
                          <div className="text-muted small">{entry.team}</div>
                        )}
                      </td>
                      <td>
                        <Badge bg={entry.sex === 'M' ? 'primary' : 'info'}>
                          {entry.sex === 'M' ? 'M' : 'F'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="success">
                          <FaWeightHanging className="me-1" />
                          {getWeightClassLabel(entry.weightClassKg || 0, entry.sex)}
                        </Badge>
                      </td>
                        
                                                                          {/* Peso Corporal */}
                         <td>
                           <div className="d-flex align-items-center">
                             <Form.Control
                               type="number"
                               value={entry.bodyweightKg || ''}
                               onChange={(e) => {
                                 const value = e.target.value;
                                 if (value === '' || !isNaN(parseFloat(value))) {
                                   dispatch(updateEntry(entry.id, { bodyweightKg: value === '' ? null : parseFloat(value) }));
                                 }
                               }}
                               placeholder="Peso"
                               step="0.1"
                               min="0"
                               size="sm"
                             />
                             <span className="ms-1">kg</span>
                              </div>
                           {entry.bodyweightKg && !isValidWeight && (
                             <div className="text-danger small">Peso fora da categoria!</div>
                        )}
                      </td>

                                                 {/* Número do Lote */}
                      <td>
                        {entry.lotNumber ? (
                          <Badge bg="warning" text="dark">
                            #{entry.lotNumber}
                          </Badge>
                        ) : (
                             <span className="text-muted">Auto</span>
                        )}
                      </td>

                         {/* Dia */}
                         <td>
                           {shouldAutoOverflow().singleDay ? (
                             <Badge bg="success" title="Auto-preenchido: Apenas 1 dia configurado">
                               {entry.day || 1}
                             </Badge>
                           ) : (
                             <Form.Select
                               size="sm"
                               value={entry.day || ''}
                               onChange={(e) => {
                                 const value = e.target.value;
                                 if (value === '' || !isNaN(parseInt(value))) {
                                   dispatch(updateEntry(entry.id, { day: value === '' ? 1 : parseInt(value) }));
                                 }
                               }}
                               style={{ width: '80px' }}
                             >
                               <option value="">-</option>
                               {Array.from({ length: meet.lengthDays }, (_, i) => (
                                 <option key={i + 1} value={i + 1}>{i + 1}</option>
                               ))}
                             </Form.Select>
                           )}
                         </td>

                         {/* Grupo */}
                         <td>
                           <Form.Select
                             size="sm"
                             value={entry.flight || ''}
                             onChange={(e) => {
                               const value = e.target.value;
                               if (value === '' || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].includes(value)) {
                                 dispatch(updateEntry(entry.id, { flight: value === '' ? null : value as any }));
                               }
                             }}
                             style={{ width: '80px' }}
                           >
                             <option value="">-</option>
                             {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(flight => (
                               <option key={flight} value={flight}>{flight}</option>
                             ))}
                           </Form.Select>
                         </td>

                         {/* Plataforma */}
                         <td>
                           {(() => {
                             const currentDay = entry.day || 1;
                             const platformsForDay = meet.platformsOnDays[currentDay - 1] || 1;
                             
                             if (shouldAutoOverflow().singlePlatform || platformsForDay === 1) {
                               return (
                                 <Badge bg="success" title="Auto-preenchido: Apenas 1 plataforma configurada">
                                   {entry.platform || 1}
                                 </Badge>
                               );
                             } else {
                               return (
                                 <Form.Select
                                   size="sm"
                                   value={entry.platform || ''}
                                   onChange={(e) => {
                                     const value = e.target.value;
                                     if (value === '' || !isNaN(parseInt(value))) {
                                       dispatch(updateEntry(entry.id, { platform: value === '' ? 1 : parseInt(value) }));
                                     }
                                   }}
                                   style={{ width: '80px' }}
                                 >
                                   <option value="">-</option>
                                   {Array.from({ length: platformsForDay }, (_, i) => (
                                     <option key={i + 1} value={i + 1}>P{i + 1}</option>
                                   ))}
                                 </Form.Select>
                               );
                             }
                           })()}
                         </td>

                         {/* Movimentos */}
                         <td>
                           <div className="position-relative">
                             <Button
                               variant="outline-secondary"
                               size="sm"
                               onClick={() => {
                                 // Toggle dropdown para este atleta específico
                                 const currentOpen = openMovementsDropdown === entry.id;
                                 setOpenMovementsDropdown(currentOpen ? null : entry.id);
                               }}
                               className="w-100 text-start d-flex justify-content-between align-items-center"
                               style={{ minHeight: '38px' }}
                               data-dropdown-id={entry.id}
                             >
                               <span className="text-truncate">
                                 {entry.movements || 'Selecionar...'}
                               </span>
                               <span className="ms-2">▼</span>
                             </Button>
                             
                             {openMovementsDropdown === entry.id && (
                               <div 
                                 className="position-absolute top-100 start-0 mt-1 bg-white border rounded shadow-lg p-2" 
                                 style={{ zIndex: 1000, minWidth: '200px' }}
                                 data-dropdown-id={entry.id}
                               >
                                 <div className="mb-2">
                                   <small className="text-muted">Selecione os movimentos:</small>
                                 </div>
                                 {[
                                   { key: 'A', label: 'Agachamento' },
                                   { key: 'S', label: 'Supino' },
                                   { key: 'T', label: 'Terra' },
                                   { key: 'AS', label: 'Agachamento + Supino' },
                                   { key: 'AT', label: 'Agachamento + Terra' },
                                   { key: 'ST', label: 'Supino + Terra' },
                                   { key: 'AST', label: 'Agachamento + Supino + Terra' }
                                 ].map(movement => (
                                   <Form.Check
                                     key={movement.key}
                                     type="checkbox"
                                     id={`movement-${entry.id}-${movement.key}`}
                                     label={movement.label}
                                     checked={(() => {
                                       const movements = entry.movements || '';
                                       const movementList = movements.split(', ').filter(m => m.trim() !== '');
                                       const isChecked = movementList.includes(movement.key);
                                       console.log(`Checkbox ${movement.key} for entry ${entry.id}:`, { movements, movementList, isChecked });
                                       return isChecked;
                                     })()}
                                     onChange={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       
                                       const isChecked = e.target.checked;
                                       const currentMovements = (entry.movements || '').split(', ').filter(m => m.trim() !== '');
                                       
                                       console.log(`Changing ${movement.key} for entry ${entry.id}:`, { 
                                         isChecked, 
                                         currentMovements, 
                                         before: entry.movements 
                                       });
                                       
                                       let newMovementList;
                                       if (isChecked) {
                                         // Adicionar movimento se não existir
                                         if (!currentMovements.includes(movement.key)) {
                                           newMovementList = [...currentMovements, movement.key];
                                         } else {
                                           newMovementList = currentMovements;
                                         }
                                       } else {
                                         // Remover movimento
                                         newMovementList = currentMovements.filter(m => m !== movement.key);
                                       }
                                       
                                       const newMovements = newMovementList.join(', ');
                                       console.log(`New movements for entry ${entry.id}:`, { newMovementList, newMovements });
                                       
                                       dispatch(updateEntry(entry.id, { movements: newMovements }));
                                     }}
                                     className="mb-1"
                                   />
                                 ))}
                                 <div className="mt-2 pt-2 border-top">
                                   <div className="d-flex gap-1">
                                     <Button
                                       variant="outline-danger"
                                       size="sm"
                                       onClick={() => {
                                         dispatch(updateEntry(entry.id, { movements: '' }));
                                         setOpenMovementsDropdown(null);
                                       }}
                                       className="flex-fill"
                                     >
                                       Limpar Todos
                                     </Button>
                                     <Button
                                       variant="outline-secondary"
                                       size="sm"
                                       onClick={() => setOpenMovementsDropdown(null)}
                                     >
                                       Fechar
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                         </td>

                                                                          {/* Altura do Agachamento */}
                         <td>
                           <div className="d-flex align-items-center">
                             <Form.Control
                               type="text"
                               value={entry.squatHeight || ''}
                               onChange={(e) => {
                                 const value = e.target.value;
                                 // Aceita qualquer combinação de números e letras
                                 if (value === '' || /^[A-Za-z0-9\s]+$/.test(value)) {
                                   dispatch(updateEntry(entry.id, { squatHeight: value === '' ? null : value }));
                                 }
                               }}
                               placeholder="Ex: 12 A, ABC, 123, A1B2"
                               maxLength={20}
                               size="sm"
                             />
                           </div>
                         </td>

                                                                          {/* Altura/Ajuste do Supino */}
                         <td>
                           <div className="d-flex align-items-center">
                             <Form.Control
                               type="text"
                               value={entry.benchHeight || ''}
                               onChange={(e) => {
                                 const value = e.target.value;
                                 // Aceita qualquer combinação de números e letras
                                 if (value === '' || /^[A-Za-z0-9\s]+$/.test(value)) {
                                   dispatch(updateEntry(entry.id, { benchHeight: value === '' ? null : value }));
                                 }
                               }}
                               placeholder="Ex: 12 A, ABC, 123, A1B2"
                               maxLength={20}
                               size="sm"
                             />
                           </div>
                         </td>

                                                                          {/* 1ª Tentativa Agachamento */}
                         <td>
                           <div className="d-flex align-items-center">
                             <Form.Control
                               type="number"
                               value={entry.squat1 || ''}
                               onChange={(e) => {
                                 const value = e.target.value;
                                 if (value === '' || !isNaN(parseFloat(value))) {
                                   dispatch(updateEntry(entry.id, { squat1: value === '' ? null : parseFloat(value) }));
                                 }
                               }}
                               placeholder="Peso"
                               step="0.5"
                               min="0"
                               size="sm"
                             />
                             <span className="ms-1">kg</span>
                           </div>
                         </td>

                        {/* 1ª Tentativa Supino */}
                        <td>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="number"
                              value={entry.bench1 || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || !isNaN(parseFloat(value))) {
                                  dispatch(updateEntry(entry.id, { bench1: value === '' ? null : parseFloat(value) }));
                                }
                              }}
                              placeholder="Peso"
                              step="0.5"
                              min="0"
                              size="sm"
                            />
                            <span className="ms-1">kg</span>
                          </div>
                        </td>

                        {/* 1ª Tentativa Terra */}
                        <td>
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="number"
                              value={entry.deadlift1 || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || !isNaN(parseFloat(value))) {
                                  dispatch(updateEntry(entry.id, { deadlift1: value === '' ? null : parseFloat(value) }));
                                }
                              }}
                              placeholder="Peso"
                              step="0.5"
                              min="0"
                              size="sm"
                            />
                            <span className="ms-1">kg</span>
                          </div>
                        </td>

                        {/* Status */}
                      <td>
                        {isWeighed ? (
                          <Badge bg={isValidWeight ? 'success' : 'danger'}>
                            {isValidWeight ? <FaCheck /> : <FaTimes />}
                            {isValidWeight ? 'Válido' : 'Inválido'}
                          </Badge>
                        ) : (
                          <Badge bg="warning" text="dark">
                            Pendente
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            </div>
          </Card.Body>
        </Card>
      )}

             {/* Instruções */}
       <Alert variant="info" className="mt-3">
         <h6>📋 Instruções de Uso:</h6>
         <ul className="mb-0">
           <li><strong>Peso Corporal:</strong> Digite o peso diretamente no campo. O sistema valida se está dentro da categoria do atleta.</li>
                       <li><strong>Número do Lote:</strong> Clique no botão "Atribuir Números de Lote" para gerar automaticamente números únicos de 1 a N atletas.</li>
                      <li><strong>Dia:</strong> {shouldAutoOverflow().singleDay ? 'Auto-preenchido (1 dia configurado)' : 'Selecione manualmente o dia da competição'}.</li>
           <li><strong>Plataforma:</strong> {shouldAutoOverflow().singlePlatform ? 'Auto-preenchida (1 plataforma configurada)' : 'Selecione manualmente a plataforma'}.</li>
           <li><strong>Movimentos:</strong> Preenchido automaticamente se apenas 1 movimento estiver permitido na competição. Caso contrário, configure manualmente (A=Agachamento, S=Supino, T=Terra).</li>
            <li><strong>Alturas:</strong> Configure livremente a altura da barra no agachamento e supino (aceita números, letras e combinações).</li>
           <li><strong>Primeiras Tentativas:</strong> Defina os pesos iniciais para cada movimento (Agachamento, Supino, Terra).</li>
           <li><strong>Validação:</strong> O sistema verifica se o peso corporal está dentro da categoria do atleta.</li>
           <li><strong>Dica:</strong> Use Tab para navegar rapidamente entre os campos.</li>
         </ul>
            </Alert>
    </Container>
  );
};

export default WeighIns;
