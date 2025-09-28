import React, { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Card, 
  Table,
  Badge,
  Alert,
} from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { GlobalState, Entry, Flight } from '../../types/barraProntaTypes';
import { updateEntry, setLiftingState } from '../../actions/barraProntaActions';
import { FaPlane, FaRandom, FaWeightHanging, FaDownload, FaUpload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const FlightOrder: React.FC = () => {
  const dispatch = useDispatch();
  const meet = useSelector((state: GlobalState) => state.meet);
  const registration = useSelector((state: GlobalState) => state.registration);
  
  const [filterSex, setFilterSex] = useState<'all' | 'M' | 'F'>('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterFlight, setFilterFlight] = useState<'all' | Flight>('all');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState(1);

  const flights: Flight[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Filtrar entradas
  const filteredEntries = registration.entries.filter(entry => {
    if (filterSex !== 'all' && entry.sex !== filterSex) return false;
    if (filterDivision !== 'all' && entry.division !== filterDivision) return false;
    if (filterFlight !== 'all' && entry.flight !== filterFlight) return false;
    return true;
  });



  // Função para obter o peso do agachamento (para ordenação)
  const getSquatWeight = (entry: Entry): number => {
    return entry.squat1 || 0;
  };

  // Agrupar por grupos e ordenar por agachamento (crescente)
  const entriesByFlight = flights.reduce((acc, flight) => {
    const flightEntries = filteredEntries.filter(entry => entry.flight === flight);
    // Ordenar por peso do agachamento (crescente)
    acc[flight] = flightEntries.sort((a, b) => getSquatWeight(a) - getSquatWeight(b));
    return acc;
  }, {} as Record<Flight, Entry[]>);

  const handleAssignFlight = (entryId: number, flight: Flight) => {
    dispatch(updateEntry(entryId, { flight }));
  };

  const handleAssignDay = (entryId: number, day: number) => {
    dispatch(updateEntry(entryId, { day }));
  };

  const handleAssignPlatform = (entryId: number, platform: number) => {
    dispatch(updateEntry(entryId, { platform }));
  };

  // Função para exportar Excel
  const handleExportCSV = () => {
    const excelData = registration.entries.map(entry => ({
      'ID': entry.id,
      'Nome': entry.name,
      'Equipe': entry.team || '',
      'Sexo': entry.sex,
      'Divisão': entry.division,
      'Categoria de Peso': getWeightClassLabel(entry.weightClassKg || 0, entry.sex),
      'Peso Corporal': entry.bodyweightKg || '',
      'Modalidade': entry.movements || '',
      'Equipamento': entry.equipment || '',
      'Grupo': entry.flight || '',
      'Dia': entry.day || '',
      'Plataforma': entry.platform || '',
      'Agachamento 1': entry.squat1 || '',
      'Agachamento 2': entry.squat2 || '',
      'Agachamento 3': entry.squat3 || '',
      'Supino 1': entry.bench1 || '',
      'Supino 2': entry.bench2 || '',
      'Supino 3': entry.bench3 || '',
      'Terra 1': entry.deadlift1 || '',
      'Terra 2': entry.deadlift2 || '',
      'Terra 3': entry.deadlift3 || ''
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Ordem de Grupos');
    
    // Gerar arquivo Excel
    XLSX.writeFile(wb, 'Ordem de Grupo Configuravel.xlsx');
  };

  // Função para importar Excel
  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processExcelFile(file);
      }
    };
    input.click();
  };

  // Função para processar arquivo Excel
  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Obter primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          alert('Arquivo Excel vazio ou inválido.');
          return;
        }
        
        // Primeira linha são os cabeçalhos
        const headers = jsonData[0] as string[];
        const errors: string[] = [];
        const updates: Array<{id: number, updates: Partial<Entry>}> = [];

        // Processar cada linha (pular cabeçalho)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;

          // Criar objeto com os dados da linha
          const rowData: { [key: string]: any } = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
          });

          // Validar dados
          const id = parseInt(rowData['ID']);
          if (isNaN(id)) {
            errors.push(`Linha ${i + 1}: ID inválido`);
            continue;
          }

          // Verificar se atleta existe
          const existingEntry = registration.entries.find(entry => entry.id === id);
          if (!existingEntry) {
            errors.push(`Linha ${i + 1}: Atleta com ID ${id} não encontrado`);
            continue;
          }

          // Validar grupo
          const group = rowData['Grupo'];
          if (group && !flights.includes(group as Flight)) {
            errors.push(`Linha ${i + 1}: Grupo "${group}" inválido. Grupos válidos: ${flights.join(', ')}`);
            continue;
          }

          // Validar dia
          const day = parseInt(rowData['Dia']);
          if (rowData['Dia'] && (isNaN(day) || day < 1 || day > meet.lengthDays)) {
            errors.push(`Linha ${i + 1}: Dia "${rowData['Dia']}" inválido. Dias válidos: 1 a ${meet.lengthDays}`);
            continue;
          }

          // Validar plataforma
          const platform = parseInt(rowData['Plataforma']);
          if (rowData['Plataforma'] && (isNaN(platform) || platform < 1 || platform > (meet.platformsOnDays[day - 1] || 1))) {
            errors.push(`Linha ${i + 1}: Plataforma "${rowData['Plataforma']}" inválida para o dia ${day}`);
            continue;
          }

          // Preparar atualizações
          const entryUpdates: Partial<Entry> = {};
          if (group) entryUpdates.flight = group as Flight;
          if (rowData['Dia']) entryUpdates.day = day;
          if (rowData['Plataforma']) entryUpdates.platform = platform;

          if (Object.keys(entryUpdates).length > 0) {
            updates.push({ id, updates: entryUpdates });
          }
        }

        // Se há erros, mostrar e não importar
        if (errors.length > 0) {
          alert(`Erros encontrados no Excel:\n\n${errors.join('\n')}\n\nImportação cancelada.`);
          return;
        }

        // Se não há erros, aplicar atualizações
        if (updates.length > 0) {
          updates.forEach(({ id, updates }) => {
            dispatch(updateEntry(id, updates));
          });
          alert(`Excel importado com sucesso!\n\n${updates.length} atletas atualizados.`);
        } else {
          alert('Nenhuma alteração encontrada no Excel.');
        }
      } catch (error) {
        alert('Erro ao processar arquivo Excel. Verifique se o arquivo está no formato correto.');
        console.error('Erro ao processar Excel:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAutoAssignFlights = () => {
    if (window.confirm('Isso irá redistribuir automaticamente todos os atletas nos grupos com balanceamento inteligente. Continuar?')) {
      // Obter todos os atletas com peso definido
      const entriesWithWeight = registration.entries
        .filter(entry => entry.bodyweightKg !== null);

      if (entriesWithWeight.length === 0) {
        alert('Nenhum atleta com peso definido encontrado.');
        return;
      }

      // Função para determinar a modalidade do atleta
      const getAthleteModality = (entry: Entry): string => {
        const movements = entry.movements || '';
        const equipment = entry.equipment || 'Raw';
        
        if (movements.includes('SBD')) {
          return equipment === 'Raw' ? 'Power Clássico' : 'Power Equipado';
        } else if (movements.includes('B')) {
          return equipment === 'Raw' ? 'Supino Clássico' : 'Supino Equipado';
        }
        return 'Outros';
      };

      // Função para obter categoria de peso
      const getWeightCategory = (weight: number): string => {
        if (weight <= 59) return 'até 59kg';
        if (weight <= 66) return 'até 66kg';
        if (weight <= 74) return 'até 74kg';
        if (weight <= 83) return 'até 83kg';
        if (weight <= 93) return 'até 93kg';
        if (weight <= 105) return 'até 105kg';
        if (weight <= 120) return 'até 120kg';
        return '120kg+';
      };

      // Agrupar atletas por modalidade, categoria de peso e idade
      const groupedAthletes: { [key: string]: Entry[] } = {};
      
      entriesWithWeight.forEach(entry => {
        const modality = getAthleteModality(entry);
        const weightCategory = getWeightCategory(entry.bodyweightKg || 0);
        const ageCategory = entry.division || 'Open';
        const sex = entry.sex;
        
        const groupKey = `${modality}-${weightCategory}-${ageCategory}-${sex}`;
        
        if (!groupedAthletes[groupKey]) {
          groupedAthletes[groupKey] = [];
        }
        groupedAthletes[groupKey].push(entry);
      });

      // Distribuir atletas usando o mínimo de grupos possível
      const maxAthletesPerFlight = 15;
      const flightCounts: { [key: string]: number } = {};
      const usedFlights: string[] = [];
      
      // Inicializar contadores de voos
      flights.forEach(flight => {
        flightCounts[flight] = 0;
      });

      // Processar cada grupo de atletas
      Object.entries(groupedAthletes).forEach(([groupKey, athletes]) => {
        const totalAthletes = athletes.length;
        
        if (totalAthletes <= maxAthletesPerFlight) {
          // Se cabe em um voo, colocar todos juntos
          // Primeiro, tentar usar um voo já utilizado
          let selectedFlight = usedFlights.find(flight => 
            flightCounts[flight] + totalAthletes <= maxAthletesPerFlight
          );
          
          // Se não cabe em nenhum voo usado, usar um novo voo
          if (!selectedFlight) {
            selectedFlight = flights.find(flight => 
              flightCounts[flight] + totalAthletes <= maxAthletesPerFlight
            );
          }
          
          if (selectedFlight) {
            const flight = selectedFlight; // Garantir que não é undefined
            athletes.forEach(entry => {
              dispatch(updateEntry(entry.id, { flight: flight as Flight }));
              flightCounts[flight] = (flightCounts[flight] || 0) + 1;
            });
            
            // Marcar voo como usado se não estava na lista
            if (!usedFlights.includes(flight)) {
              usedFlights.push(flight);
            }
          } else {
            // Se não cabe em nenhum voo, usar o voo com menos atletas
            const minFlightEntry = Object.entries(flightCounts)
              .reduce((min, current) => 
                current[1] < min[1] ? current : min
              );
            const minFlight = minFlightEntry[0];
            
            athletes.forEach(entry => {
              dispatch(updateEntry(entry.id, { flight: minFlight as Flight }));
              flightCounts[minFlight] += 1;
            });
            
            if (!usedFlights.includes(minFlight)) {
              usedFlights.push(minFlight);
            }
          }
        } else {
          // Se não cabe em um voo, calcular o mínimo de voos necessários
          const minFlightsNeeded = Math.ceil(totalAthletes / maxAthletesPerFlight);
          const athletesPerFlight = Math.ceil(totalAthletes / minFlightsNeeded);
          
          // Usar apenas os voos necessários, priorizando voos já utilizados
          const availableFlights = flights.filter(flight => 
            flightCounts[flight] + athletesPerFlight <= maxAthletesPerFlight
          );
          
          // Combinar voos já usados com voos disponíveis
          const usedAvailableFlights = usedFlights.filter(flight => 
            flightCounts[flight] + athletesPerFlight <= maxAthletesPerFlight
          );
          
          let selectedFlights: string[] = [];
          
          if (usedAvailableFlights.length >= minFlightsNeeded) {
            // Usar apenas voos já utilizados
            selectedFlights = usedAvailableFlights.slice(0, minFlightsNeeded);
          } else if (availableFlights.length >= minFlightsNeeded) {
            // Usar voos já utilizados + voos disponíveis
            selectedFlights = [
              ...usedAvailableFlights,
              ...availableFlights.slice(0, minFlightsNeeded - usedAvailableFlights.length)
            ];
          } else {
            // Usar todos os voos disponíveis (fallback)
            selectedFlights = availableFlights.slice(0, minFlightsNeeded);
          }
          
          // Distribuir atletas entre os voos selecionados
          athletes.forEach((entry, index) => {
            const flightIndex = index % selectedFlights.length;
            const flight = selectedFlights[flightIndex];
            dispatch(updateEntry(entry.id, { flight: flight as Flight }));
            flightCounts[flight] += 1;
          });
          
          // Marcar voos como utilizados
          selectedFlights.forEach(flight => {
            if (!usedFlights.includes(flight)) {
              usedFlights.push(flight);
            }
          });
        }
      });

      // Exibir estatísticas da distribuição (apenas grupos utilizados)
      const usedFlightsStats = usedFlights.map(flight => 
        `Grupo ${flight}: ${flightCounts[flight]} atletas`
      ).join('\n');
      
      alert(`Distribuição concluída!\n\n${usedFlightsStats}\n\nTotal: ${entriesWithWeight.length} atletas\nGrupos utilizados: ${usedFlights.length}`);
    }
  };



  const getWeightClassLabel = (weight: number, sex: 'M' | 'F') => {
    const classes = sex === 'M' ? meet.weightClassesKgMen : meet.weightClassesKgWomen;
    const index = classes.indexOf(weight);
    if (index === classes.length - 1) {
      return `${weight}+ kg`;
    }
    return `${weight} kg`;
  };

  const getFlightStats = (flight: Flight) => {
    const entries = entriesByFlight[flight];
    const total = entries.length;
    
    return { total };
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Ordem dos Grupos</h3>
              <p className="text-muted">Organize os atletas em grupos e plataformas</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-success" onClick={handleExportCSV}>
                <FaDownload className="me-2" />
                Exportar Excel
              </Button>
              <Button variant="outline-info" onClick={handleImportCSV}>
                <FaUpload className="me-2" />
                Importar Excel
              </Button>
              <Button variant="outline-primary" onClick={handleAutoAssignFlights}>
                <FaRandom className="me-2" />
                Auto Distribuir
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filtros e Configurações */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5>Filtros</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
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
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Divisão</Form.Label>
                    <Form.Select
                      value={filterDivision}
                      onChange={(e) => setFilterDivision(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      {meet.divisions.map((division, index) => (
                        <option key={index} value={division}>{division}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Grupo</Form.Label>
                    <Form.Select
                      value={filterFlight}
                      onChange={(e) => setFilterFlight(e.target.value as 'all' | Flight)}
                    >
                      <option value="all">Todos</option>
                      {flights.map(flight => (
                        <option key={flight} value={flight}>Grupo {flight}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5>Estado de Levantamento</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Dia</Form.Label>
                    <Form.Select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    >
                      {Array.from({ length: meet.lengthDays }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Dia {i + 1}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Plataforma</Form.Label>
                    <Form.Select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(parseInt(e.target.value))}
                    >
                      {Array.from({ length: meet.platformsOnDays[selectedDay - 1] || 1 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Plataforma {i + 1}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>



      {/* Organização por Grupos */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5>Organização por Grupos</h5>
              <small className="text-muted">Atletas organizados por grupo e ordenados por peso do agachamento (crescente)</small>
            </Card.Header>
            <Card.Body>
              {flights.map(flight => {
                const flightEntries = entriesByFlight[flight];
                if (flightEntries.length === 0) return null;
                
                return (
                  <div key={flight} className="mb-4">
                                         <h6 className="text-primary border-bottom pb-2">
                       <Badge bg="primary" className="me-2">Grupo {flight}</Badge>
                       <span className="ms-3 text-muted">
                         {getFlightStats(flight).total} atletas
                       </span>
                     </h6>
                                         <Table responsive striped hover size="sm">
                       <thead>
                         <tr>
                           <th>Nome</th>
                           <th>Agachamento</th>
                           <th>Supino</th>
                           <th>Terra</th>
                         </tr>
                       </thead>
                       <tbody>
                         {flightEntries.map((entry, index) => (
                           <tr key={entry.id}>
                             <td>
                               <strong>{entry.name}</strong>
                               {entry.team && (
                                 <div className="text-muted small">{entry.team}</div>
                               )}
                             </td>
                             <td>
                               <Badge bg="primary">
                                 {entry.squat1 ? `${entry.squat1} kg` : '-'}
                               </Badge>
                             </td>
                             <td>
                               <Badge bg="info">
                                 {entry.bench1 ? `${entry.bench1} kg` : '-'}
                               </Badge>
                             </td>
                             <td>
                               <Badge bg="warning" text="dark">
                                 {entry.deadlift1 ? `${entry.deadlift1} kg` : '-'}
                               </Badge>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </Table>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de Atletas */}
      {filteredEntries.length === 0 ? (
        <Alert variant="info">
          <FaPlane className="me-2" />
          Nenhum atleta encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <Card>
          <Card.Header>
            <h5>Atletas ({filteredEntries.length})</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Sexo</th>
                  <th>Divisão</th>
                  <th>Categoria</th>
                  <th>Peso</th>
                                      <th>Grupo</th>
                  <th>Dia</th>
                  <th>Plataforma</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>{index + 1}</td>
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
                      <Badge bg="secondary">{entry.division}</Badge>
                    </td>
                    <td>
                      <Badge bg="success">
                        <FaWeightHanging className="me-1" />
                        {getWeightClassLabel(entry.weightClassKg || 0, entry.sex)}
                      </Badge>
                    </td>
                    <td>
                      {entry.bodyweightKg ? (
                        <strong>{entry.bodyweightKg} kg</strong>
                      ) : (
                        <span className="text-muted">Não pesado</span>
                      )}
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={entry.flight || ''}
                        onChange={(e) => handleAssignFlight(entry.id, e.target.value as Flight)}
                        style={{ width: '80px' }}
                      >
                        <option value="">-</option>
                        {flights.map(flight => (
                          <option key={flight} value={flight}>{flight}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={entry.day || ''}
                        onChange={(e) => handleAssignDay(entry.id, parseInt(e.target.value))}
                        style={{ width: '80px' }}
                      >
                        <option value="">-</option>
                        {Array.from({ length: meet.lengthDays }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={entry.platform || ''}
                        onChange={(e) => handleAssignPlatform(entry.id, parseInt(e.target.value))}
                        style={{ width: '80px' }}
                      >
                        <option value="">-</option>
                        {Array.from({ length: Math.max(...meet.platformsOnDays) }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          if (entry.flight) {
                            dispatch(setLiftingState({
                              day: entry.day || 1,
                              platform: entry.platform || 1,
                              flight: entry.flight
                            }));
                          }
                        }}
                        disabled={!entry.flight}
                      >
                        <FaPlane />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default FlightOrder;
