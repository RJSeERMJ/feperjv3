import React, { useState, useMemo } from 'react';
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
  Alert
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Entry } from '../../types/barraProntaTypes';
import { addEntry, updateEntry, deleteEntry } from '../../actions/barraProntaActions';
import { FaPlus, FaEdit, FaTrash, FaUser, FaWeightHanging } from 'react-icons/fa';

const Registration: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sex: 'M' as 'M' | 'F',
    age: '',
    division: 'Open',
    weightClassKg: 0,
    equipment: 'Raw',
    team: '',
    country: 'Brasil',
    state: 'RJ',
    notes: '',
    tipoAtleta: 'NORMAL' as 'NORMAL' | 'CONVIDADO'
  });


  // Função para obter o nome do equipamento
  const getEquipmentName = (equipment: string) => {
    switch (equipment) {
      case 'Raw': return 'Clássico';
      case 'Equipped': return 'Equipado';
      default: return equipment;
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Nome é obrigatório!');
      return;
    }

    const entry: Entry = {
      id: editingEntry ? editingEntry.id : registration.nextEntryId,
      name: formData.name,
      sex: formData.sex,
      birthDate: new Date().toISOString(),
      age: parseInt(formData.age) || 0,
      weightClass: getWeightClassLabel(formData.weightClassKg, formData.sex),
      weightClassKg: formData.weightClassKg,
      division: formData.division,
      equipment: formData.equipment,
      team: formData.team,
      country: formData.country,
      state: formData.state,
      notes: formData.notes,
      tipoAtleta: formData.tipoAtleta,
      // Campos de tentativas
      squat1: null, squat2: null, squat3: null,
      bench1: null, bench2: null, bench3: null,
      deadlift1: null, deadlift2: null, deadlift3: null,
      bodyweightKg: null,
      lotNumber: null,
      squatHeight: null,
      benchHeight: null,
      platform: 1,
      flight: 'A',
      day: 1,
      movements: 'AST', // Padrão: Agachamento + Supino + Terra
      sessionNumber: null,
      squatStatus: [0, 0, 0],
      benchStatus: [0, 0, 0],
      deadliftStatus: [0, 0, 0],
      tested: false
    };

    if (editingEntry) {
      dispatch(updateEntry(editingEntry.id, entry));
    } else {
      dispatch(addEntry(entry));
    }

    handleCloseModal();
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      sex: entry.sex,
      age: entry.age.toString(),
      division: entry.division || '',
      weightClassKg: entry.weightClassKg || 0,
      equipment: entry.equipment || 'Raw',
      team: entry.team,
      country: entry.country || 'Brasil',
      state: entry.state || '',
      notes: entry.notes || '',
      tipoAtleta: entry.tipoAtleta || 'NORMAL'
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este atleta?')) {
      dispatch(deleteEntry(id));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({
      name: '',
      sex: 'M',
      age: '',
      division: 'Open',
      weightClassKg: 0,
      equipment: 'Raw',
      team: '',
      country: 'Brasil',
      state: 'RJ',
      notes: '',
      tipoAtleta: 'NORMAL'
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

  // Função para detectar atletas com múltiplas divisões E dobra de categoria FEPERJ
  const detectMultipleDivisions = useMemo(() => {
    const athleteDivisions = new Map<string, { 
      name: string, 
      divisions: string[], 
      entries: Entry[], 
      hasDobraCategoria: boolean,
      dobraCategoriaInfo?: string,
      hasValidDobra: boolean // Nova propriedade para validar dobra real
    }>();
    
    // Agrupar atletas por CPF ou nome
    registration.entries.forEach(entry => {
      const key = entry.cpf || entry.name; // Usar CPF se disponível, senão nome
      
      if (!athleteDivisions.has(key)) {
        athleteDivisions.set(key, {
          name: entry.name,
          divisions: [],
          entries: [],
          hasDobraCategoria: false,
          hasValidDobra: false
        });
      }
      
      const athlete = athleteDivisions.get(key)!;
      const division = entry.division || '';
      if (!athlete.divisions.includes(division)) {
        athlete.divisions.push(division);
      }
      athlete.entries.push(entry);
      
      // DETECÇÃO DE DOBRA DE CATEGORIA FEPERJ
      // Verificar se tem dados de dobraCategoria nos notes (estrutura do banco FEPERJ)
      if (entry.notes) {
        // Procurar por padrões de dobraCategoria nos notes
        if (entry.notes.includes('dobraCategoria') || 
            entry.notes.includes('categoriaIdade') ||
            entry.notes.includes('categoriaPeso') ||
            entry.notes.includes('dobra')) {
          athlete.hasDobraCategoria = true;
          
          // Tentar extrair informações específicas da dobra
          const dobraMatch = entry.notes.match(/dobraCategoria[:\s]*([^,]+)/i);
          if (dobraMatch) {
            athlete.dobraCategoriaInfo = dobraMatch[1].trim();
          }
        }
      }
    });
    
    // CORREÇÃO: Validar dobra real - só considera dobrando se tem múltiplas categorias de idade
    athleteDivisions.forEach(athlete => {
      // Critério 1: Tem múltiplas divisões de idade (dobra tradicional)
      if (athlete.divisions.length > 1) {
        athlete.hasValidDobra = true;
      }
      
      // Critério 2: Tem dobraCategoria com informação específica (não apenas "Dobra FEPERJ" genérica)
      if (athlete.hasDobraCategoria && athlete.dobraCategoriaInfo && 
          athlete.dobraCategoriaInfo.toLowerCase() !== 'dobra feperj' &&
          athlete.dobraCategoriaInfo.trim() !== '') {
        athlete.hasValidDobra = true;
      }
    });
    
    // Retornar apenas atletas que REALMENTE estão dobrando
    return Array.from(athleteDivisions.entries())
      .filter(([_, athlete]) => athlete.hasValidDobra)
      .map(([key, athlete]) => ({
        key,
        name: athlete.name,
        divisions: athlete.divisions,
        entries: athlete.entries,
        hasDobraCategoria: athlete.hasDobraCategoria,
        dobraCategoriaInfo: athlete.dobraCategoriaInfo
      }));
  }, [registration.entries]);

  // Função para verificar se um atleta está dobrando
  const isAthleteDobra = (entry: Entry) => {
    const athleteKey = entry.cpf || entry.name;
    const athleteData = detectMultipleDivisions.find(athlete => athlete.key === athleteKey);
    
    // CORREÇÃO: Se está na lista detectMultipleDivisions, significa que passou pela validação hasValidDobra
    // Então pode retornar true diretamente
    return athleteData !== undefined;
  };

  // Função para obter a categoria de dobra de um atleta baseada nos dados FEPERJ
  const getAthleteDobraCategory = (entry: Entry) => {
    const athleteKey = entry.cpf || entry.name;
    const athleteData = detectMultipleDivisions.find(athlete => athlete.key === athleteKey);
    
    // CORREÇÃO: Se está na lista detectMultipleDivisions, significa que passou pela validação hasValidDobra
    if (athleteData) {
      // PRIORIDADE 1: Se tem dobraCategoria com informação específica (não genérica)
      if (athleteData.hasDobraCategoria && athleteData.dobraCategoriaInfo && 
          athleteData.dobraCategoriaInfo.toLowerCase() !== 'dobra feperj') {
        return athleteData.dobraCategoriaInfo;
      }
      
      // PRIORIDADE 2: Se tem múltiplas divisões (dobra tradicional)
      if (athleteData.divisions.length > 1) {
        const currentDivision = entry.division || '';
        const otherDivision = athleteData.divisions.find(div => div !== currentDivision);
        return otherDivision || '';
      }
      
      // PRIORIDADE 3: Se tem dobraCategoria mas não conseguiu extrair info específica válida
      if (athleteData.hasDobraCategoria) {
        return 'Dobra FEPERJ';
      }
    }
    
    return '';
  };


  // Verificar se a competição permite dobra (baseado nos dados salvos da competição)
  const allowsDobra = useMemo(() => {
    // Verificar se há configuração específica de dobra na competição
    // Se há mais de uma divisão configurada, permite dobra
    const hasMultipleDivisions = meet.divisions && meet.divisions.length > 1;
    
    // Verificar se há atletas dobrando (como indicador de que a competição permite)
    const hasAthletesDobra = detectMultipleDivisions.length > 0;
    
    // Verificar se a competição foi carregada do sistema FEPERJ
    // (indicado pela presença de atletas com CPF)
    const hasFEPERJData = registration.entries.some(entry => entry.cpf);
    
    // Permitir dobra se:
    // 1. Há múltiplas divisões configuradas OU
    // 2. Há atletas dobrando OU  
    // 3. A competição foi carregada do FEPERJ (que pode ter regras de dobra)
    return hasMultipleDivisions || hasAthletesDobra || hasFEPERJData;
  }, [meet.divisions, detectMultipleDivisions.length, registration.entries]);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Inscrições</h3>
              <p className="text-muted">Gerencie os atletas inscritos na competição</p>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaPlus className="me-2" />
              Adicionar Atleta
            </Button>
          </div>
        </Col>
      </Row>

      {/* Estatísticas */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-primary">{registration.entries.length}</h3>
              <p className="mb-0">Total de Atletas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-success">{registration.entries.filter(e => e.sex === 'M').length}</h3>
              <p className="mb-0">Masculino</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-info">{registration.entries.filter(e => e.sex === 'F').length}</h3>
              <p className="mb-0">Feminino</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{new Set(registration.entries.map(e => e.team).filter(t => t)).size}</h3>
              <p className="mb-0">Equipes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h3 className="text-warning">{detectMultipleDivisions.length}</h3>
              <p className="mb-0">Dobrando</p>
              {detectMultipleDivisions.length > 0 && (
                <small className="text-muted">
                  {detectMultipleDivisions.reduce((acc, athlete) => acc + athlete.divisions.length, 0)} total
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h3 className={allowsDobra ? "text-warning" : "text-secondary"}>
                {allowsDobra ? "Sim" : "Não"}
              </h3>
              <p className="mb-0">Permite Dobra</p>
              {allowsDobra && (
                <small className="text-warning">
                  <strong>
                    {(() => {
                      if (meet.divisions && meet.divisions.length > 1) return "Configurado";
                      if (registration.entries.some(entry => entry.cpf)) return "FEPERJ";
                      if (detectMultipleDivisions.length > 0) return "Detectado";
                      return "Ativo";
                    })()}
                  </strong>
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Informações sobre carregamento automático */}
      {registration.entries.length > 0 && (
        <Alert variant="info" className="mb-4">
          <h6>📋 Atletas Carregados Automaticamente</h6>
          <p className="mb-2">
            Esta competição foi carregada do sistema FEPERJ com <strong>{registration.entries.length} atletas</strong> inscritos.
            Os atletas já estão distribuídos por suas respectivas categorias de peso, idade e modalidade.
          </p>
          <p className="mb-0">
            <strong>Dica:</strong> Você pode adicionar atletas extras manualmente usando o botão "Adicionar Atleta" acima.
          </p>
        </Alert>
      )}


      {registration.entries.length === 0 ? (
        <Alert variant="info">
          <FaUser className="me-2" />
          Nenhum atleta inscrito ainda. Clique em "Adicionar Atleta" para começar.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Atletas Inscritos ({registration.entries.length})</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Sexo</th>
                  <th>Idade</th>
                  <th>Divisão de Idade</th>
                  {allowsDobra && <th>Dobra</th>}
                  <th>Categoria de Peso</th>
                  <th>Modalidade</th>
                  <th>Equipe</th>
                  <th>Tipo de Atleta</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                 {registration.entries.map((entry, index) => {
                   const isDobra = isAthleteDobra(entry);
                   
                   return (
                     <tr 
                       key={entry.id}
                       className={isDobra ? 'table-warning' : ''}
                     >
                       <td>
                         {index + 1}
                         {isDobra && (
                           <div className="d-flex align-items-center mt-1">
                             <span className="badge bg-warning text-dark me-1" style={{ fontSize: '0.7em' }}>
                               DOBRA
                             </span>
                           </div>
                         )}
                       </td>
                       <td>
                         <div className="d-flex align-items-center">
                           <strong>{entry.name}</strong>
                           {isDobra && (
                             <Badge 
                               bg="warning" 
                               text="dark"
                               className="ms-2"
                               style={{ fontSize: '0.7em' }}
                             >
                               DOBRA
                             </Badge>
                           )}
                         </div>
                         {entry.notes && (
                           <div className="text-muted small">{entry.notes}</div>
                         )}
                       </td>
                    <td>
                      <Badge bg={entry.sex === 'M' ? 'primary' : 'info'}>
                        {entry.sex === 'M' ? 'Masculino' : 'Feminino'}
                      </Badge>
                    </td>
                    <td>{entry.age} anos</td>
                    <td>
                      <Badge bg="secondary">{entry.division}</Badge>
                    </td>
                    {allowsDobra && (
                      <td>
                        {(() => {
                          const isDobra = isAthleteDobra(entry);
                          const dobraCategory = getAthleteDobraCategory(entry);
                          
                          if (isDobra && dobraCategory) {
                            return <Badge bg="info">{dobraCategory}</Badge>;
                          } else if (isDobra) {
                            return <Badge bg="warning" text="dark">Dobra</Badge>;
                          } else {
                            return <span className="text-muted">-</span>;
                          }
                        })()}
                      </td>
                    )}
                    <td>
                      <Badge bg="success">
                        <FaWeightHanging className="me-1" />
                        {getWeightClassLabel(entry.weightClassKg || 0, entry.sex)}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="warning" text="dark">
                        {getEquipmentName(entry.equipment || 'Raw')}
                      </Badge>
                    </td>
                    <td>{entry.team || '-'}</td>
                    <td>
                      <Badge bg={entry.tipoAtleta === 'CONVIDADO' ? 'info' : 'secondary'}>
                        {entry.tipoAtleta === 'CONVIDADO' ? 'Convidado' : 'Normal'}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(entry)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                   );
                 })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Modal para adicionar/editar atleta */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEntry ? 'Editar Atleta' : 'Adicionar Atleta'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nome Completo *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome do atleta"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sexo</Form.Label>
                <Form.Select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Idade</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="120"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Divisão de Idade</Form.Label>
                <Form.Select
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                >
                  {meet.divisions.map((division, index) => (
                    <option key={index} value={division}>{division}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Categoria de Peso (kg)</Form.Label>
                <Form.Select
                  name="weightClassKg"
                  value={formData.weightClassKg}
                  onChange={handleInputChange}
                >
                  <option value={0}>Selecione...</option>
                  {(formData.sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen).map((weight, index) => (
                    <option key={index} value={weight}>
                      {getWeightClassLabel(weight, formData.sex)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Modalidade</Form.Label>
                <Form.Select
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                >
                  <option value="Raw">Clássico</option>
                  <option value="Equipped">Equipado</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Equipe</Form.Label>
                <Form.Control
                  type="text"
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                  placeholder="Nome da equipe"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Atleta</Form.Label>
                <Form.Select
                  name="tipoAtleta"
                  value={formData.tipoAtleta}
                  onChange={handleInputChange}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="CONVIDADO">Convidado</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {formData.tipoAtleta === 'CONVIDADO' ? 
                    'Atletas convidados não têm restrições de idade/peso' : 
                    'Atletas normais seguem as regras de categoria'
                  }
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>País</Form.Label>
                <Form.Control
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Observações</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observações adicionais"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingEntry ? 'Atualizar' : 'Adicionar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Registration;
