import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Card, 
  Table,
  Modal,
  Badge,
  Alert,
  InputGroup
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Entry } from '../../types/barraProntaTypes';
import { updateEntry } from '../../actions/barraProntaActions';
import { FaWeightHanging, FaEdit, FaCheck, FaTimes, FaUser, FaFilter, FaRuler, FaDumbbell } from 'react-icons/fa';

const WeighIns: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
     const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
   const [filterDay, setFilterDay] = useState<'all' | number>('all');
   const [filterFlight, setFilterFlight] = useState<'all' | string>('all');
   const [filterPlatform, setFilterPlatform] = useState<'all' | number>('all');
   const [filterWeighed, setFilterWeighed] = useState<'all' | 'weighed' | 'not-weighed'>('all');

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
             <FaDumbbell className="me-2" />
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
            <Col md={3}>
              <Form.Group>
                <Form.Label>Sexo</Form.Label>
                <Form.Select
                  value={filterSex}
                  onChange={(e) => setFilterSex(e.target.value as 'all' | 'M' | 'F')}
                >
                  <option value="all">Todos</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </Form.Select>
              </Form.Group>
            </Col>
                         <Col md={3}>
               <Form.Group>
                 <Form.Label>Dia</Form.Label>
                 <Form.Select
                   value={filterDay}
                   onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                 >
                   <option value="all">Todos</option>
                   {Array.from({ length: meet.lengthDays }, (_, i) => (
                     <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </Col>
             <Col md={3}>
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
                         <Col md={3}>
               <Form.Group>
                 <Form.Label>Plataforma</Form.Label>
                 <Form.Select
                   value={filterPlatform}
                   onChange={(e) => setFilterPlatform(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                 >
                   <option value="all">Todas</option>
                   {Array.from({ length: meet.platformsOnDays[0] || 1 }, (_, i) => (
                     <option key={i + 1} value={i + 1}>Plataforma {i + 1}</option>
                   ))}
                 </Form.Select>
               </Form.Group>
             </Col>
             <Col md={3}>
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
                     <th>Dia</th>
                     <th>Grupo</th>
                     <th>Plataforma</th>
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
                    const weightClass = entry.weightClassKg;
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
                             {getWeightClassLabel(entry.weightClassKg, entry.sex)}
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
                           <Form.Select
                             size="sm"
                             value={entry.day || ''}
                             onChange={(e) => {
                               const value = e.target.value;
                               if (value === '' || !isNaN(parseInt(value))) {
                                 dispatch(updateEntry(entry.id, { day: value === '' ? null : parseInt(value) }));
                               }
                             }}
                             style={{ width: '80px' }}
                           >
                             <option value="">-</option>
                             {Array.from({ length: meet.lengthDays }, (_, i) => (
                               <option key={i + 1} value={i + 1}>{i + 1}</option>
                             ))}
                           </Form.Select>
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
                           <Form.Select
                             size="sm"
                             value={entry.platform || ''}
                             onChange={(e) => {
                               const value = e.target.value;
                               if (value === '' || !isNaN(parseInt(value))) {
                                 dispatch(updateEntry(entry.id, { platform: value === '' ? null : parseInt(value) }));
                               }
                             }}
                             style={{ width: '80px' }}
                           >
                             <option value="">-</option>
                             {Array.from({ length: meet.platformsOnDays[0] || 1 }, (_, i) => (
                               <option key={i + 1} value={i + 1}>P{i + 1}</option>
                             ))}
                           </Form.Select>
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
                             <span className="ms-1 text-muted">(texto livre)</span>
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
                             <span className="ms-1 text-muted">(texto livre)</span>
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
            <li><strong>Dia e Grupo:</strong> Organize os atletas por dia da competição e grupo de competição.</li>
            <li><strong>Plataforma:</strong> Defina em qual plataforma cada atleta competirá.</li>
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
