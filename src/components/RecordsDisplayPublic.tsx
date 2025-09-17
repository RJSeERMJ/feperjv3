import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Badge, 
  Button, 
  Row, 
  Col, 
  Form, 
  Alert, 
  Spinner,
  ButtonGroup,
  Tabs,
  Tab
} from 'react-bootstrap';
import { 
  FaFilter, 
  FaFilePdf, 
  FaInfoCircle,
  FaTrophy
} from 'react-icons/fa';
import { recordsService, Record } from '../services/recordsService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RecordsDisplayPublicProps {
  onRefresh?: () => void;
}

const RecordsDisplayPublic: React.FC<RecordsDisplayPublicProps> = ({ onRefresh }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'bench'>('all');
  
  // Estilos CSS inline para os cabeçalhos das tabelas
  const tableStyles = {
    cabec1: {
      fontFamily: 'Tahoma',
      fontWeight: 'normal',
      fontSize: '18px',
      textAlign: 'left' as const,
      padding: '2pt',
      backgroundColor: '#66b2ff',
      color: 'white'
    },
    cabec2: {
      fontFamily: 'Tahoma',
      fontWeight: 'normal',
      fontSize: '16px',
      padding: '2pt',
      backgroundColor: '#99ccff',
      color: '#0B610B'
    }
  };
  
  // Filtros
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedSex, setSelectedSex] = useState<string>('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('ALL');

  // Divisões disponíveis - todas as categorias de idade
  const divisions = ['ALL', 'SUBJR', 'JR', 'OPEN', 'MASTER1', 'MASTER2', 'MASTER3', 'MASTER4'];
  
  // Gêneros
  const sexes = ['ALL', 'M', 'F'];
  
  // Modalidades
  const equipments = ['ALL', 'CLASSICA', 'EQUIPADO'];

  useEffect(() => {
    loadRecords();
  }, []);

  // Recarregar records quando os filtros mudarem
  useEffect(() => {
    loadRecords();
  }, [selectedDivision, selectedSex, selectedEquipment]);

  // Carregar records do Firebase
  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando records com filtros:', {
        division: selectedDivision,
        sex: selectedSex,
        equipment: selectedEquipment
      });
      
      // Se há filtros ativos, usar getRecordsByFilters
      if (selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL') {
        console.log('🔍 Aplicando filtros específicos...');
        
        const filteredRecords = await recordsService.getRecordsByFilters(
          undefined, // movement - não filtrar por movimento aqui
          selectedDivision === 'ALL' ? undefined : selectedDivision,
          selectedSex === 'ALL' ? undefined : selectedSex,
          selectedEquipment === 'ALL' ? undefined : selectedEquipment
        );
        
        console.log(`✅ Records filtrados carregados: ${filteredRecords.length}`);
        console.log('📊 Records encontrados:', filteredRecords);
        setRecords(filteredRecords);
      } else {
        console.log('📥 Carregando todos os records...');
        const allRecords = await recordsService.getAll();
        console.log(`✅ Todos os records carregados: ${allRecords.length}`);
        console.log('📊 Todos os records:', allRecords);
        setRecords(allRecords);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar records:', error);
      setError(`Erro ao carregar records do Firebase: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar records baseado nos filtros selecionados
  const getFilteredRecords = () => {
    // Os records já vêm filtrados do Firebase, então retornar todos
    return records;
  };

  // Função para obter nome do movimento
  const getMovementDisplayName = (movement: string) => {
    const movementNames: { [key: string]: string } = {
      'squat': 'Agachamento',
      'bench': 'Supino',
      'bench_solo': 'Supino',
      'deadlift': 'Terra',
      'total': 'Total'
    };
    return movementNames[movement] || movement;
  };

  // Função para exportar PDF
  const handleExportPDF = (movement: string) => {
    try {
      // Verificar se há filtros ativos
      const hasActiveFiltersForExport = selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL';
      
      if (!hasActiveFiltersForExport) {
        alert('Configure os filtros antes de exportar os records');
        return;
      }
      
      const doc = new jsPDF();
      const filteredRecords = getFilteredRecords().filter(r => r.movement === movement);
      
      if (filteredRecords.length === 0) {
        alert('Nenhum record encontrado para exportar com os filtros selecionados');
        return;
      }
     
     // Cabeçalho
     doc.setFontSize(20);
     doc.text(`RECORDS - ${getMovementDisplayName(movement).toUpperCase()}`, 14, 20);
     
     // Organizar por categoria de peso
     const allWeightClasses = selectedSex === 'F' 
       ? ['Até 43,0 kg', '47,0 kg', '52,0 kg', '57,0 kg', '63,0 kg', '69,0 kg', '76,0 kg', '84,0 kg', '+84,0 kg']
       : ['Até 53,0 kg', '59,0 kg', '66,0 kg', '74,0 kg', '83,0 kg', '93,0 kg', '105,0 kg', '120,0 kg', '+120,0 kg'];
     
     const organizedByWeight: { [key: string]: Record | null } = {};
     
     // Mostrar apenas categorias com records
     allWeightClasses.forEach(weightClass => {
       const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
       if (recordsInClass.length > 0) {
         const bestRecord = recordsInClass.reduce((best, current) => 
           current.weight > best.weight ? current : best
         );
         organizedByWeight[weightClass] = bestRecord;
       }
     });
     
     // Criar lista de categorias com records
     const weightClasses = Object.keys(organizedByWeight);

     if (weightClasses.length === 0) {
       alert('Nenhum record encontrado para exportar com os filtros selecionados');
       return;
     }

     // Tabela de records
     const tableData = weightClasses.map(weightClass => {
       const record = organizedByWeight[weightClass];
       return [
         weightClass,
         record ? record.athleteName : '-',
         record ? `${record.weight} kg` : '-',
         record ? record.team || '-' : '-',
         record ? record.competition : '-',
         record ? new Date(record.date).toLocaleDateString('pt-BR') : '-'
       ];
     });
     
     autoTable(doc, {
       startY: 35,
       head: [['Categoria', 'Atleta', 'Marca', 'Equipe', 'Local', 'Data']],
       body: tableData,
       theme: 'grid',
       styles: { fontSize: 10 },
       headStyles: { fillColor: [66, 139, 202] },
       columnStyles: {
         0: { cellWidth: 30 },
         1: { cellWidth: 50 },
         2: { cellWidth: 25 },
         3: { cellWidth: 40 },
         4: { cellWidth: 50 },
         5: { cellWidth: 30 }
       }
     });
     
     // Salvar PDF
     doc.save(`records-${getMovementDisplayName(movement).toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
   } catch (error) {
     console.error('Erro ao gerar PDF:', error);
   }
 };

  // Renderizar tabela de records para uma categoria específica
  const renderRecordsTable = (movement: string) => {
    const filteredRecords = getFilteredRecords().filter(r => r.movement === movement);
    
    // Verificar se há filtros ativos (não "ALL")
    const hasActiveFilters = selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL';
    
    // Se não há filtros ativos (todos em "ALL"), mostrar mensagem
    if (!hasActiveFilters) {
      return (
        <Alert variant="info">
          <FaInfoCircle className="me-2" />
          <strong>Configure os filtros para visualizar os records</strong>
          <br />
          Selecione uma divisão de idade, sexo e modalidade para ver os records correspondentes.
        </Alert>
      );
    }
    
    // Se não há records mesmo com filtros ativos, mostrar mensagem
    if (filteredRecords.length === 0 && hasActiveFilters) {
      return (
        <Alert variant="warning">
          <FaInfoCircle className="me-2" />
          Nenhum record encontrado para os filtros selecionados.
        </Alert>
      );
    }

    // Organizar por categoria de peso
    const allWeightClasses = selectedSex === 'F' 
      ? ['Até 43,0 kg', '47,0 kg', '52,0 kg', '57,0 kg', '63,0 kg', '69,0 kg', '76,0 kg', '84,0 kg', '+84,0 kg']
      : ['Até 53,0 kg', '59,0 kg', '66,0 kg', '74,0 kg', '83,0 kg', '93,0 kg', '105,0 kg', '120,0 kg', '+120,0 kg'];
    
    const organizedByWeight: { [key: string]: Record | null } = {};
    
    // Mostrar apenas categorias com records
    allWeightClasses.forEach(weightClass => {
      const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
      if (recordsInClass.length > 0) {
        const bestRecord = recordsInClass.reduce((best, current) => 
          current.weight > best.weight ? current : best
        );
        organizedByWeight[weightClass] = bestRecord;
      }
    });
    
    // Criar lista de categorias com records
    const weightClasses = Object.keys(organizedByWeight);

    return (
      <div className="table-responsive">
        <Table className="table-sm table-bordered">
          <thead>
            <tr>
              <th colSpan={6} style={tableStyles.cabec1}>
                {getMovementDisplayName(movement).toUpperCase()}
              </th>
            </tr>
          </thead>
          <thead>
            <tr style={{height: '5px'}}>
              <th style={{...tableStyles.cabec2, width: '15%'}} className="text-center">Categoria</th>
              <th style={{...tableStyles.cabec2, width: '25%'}}>Atleta</th>
              <th style={{...tableStyles.cabec2, width: '10%'}} className="text-center">Marca</th>
              <th style={{...tableStyles.cabec2, width: '18%'}}>Equipe</th>
              <th style={{...tableStyles.cabec2, width: '18%'}}>Local</th>
              <th style={{...tableStyles.cabec2, width: '10%'}} className="text-center">Data</th>
            </tr>
          </thead>
          <tbody>
            {weightClasses.map(weightClass => {
              const record = organizedByWeight[weightClass];
              
              return (
                <tr key={weightClass}>
                  <td className="text-center">
                    <Badge bg="primary">
                      {weightClass}
                    </Badge>
                  </td>
                  <td>
                    <strong>{record ? record.athleteName : '-'}</strong>
                  </td>
                  <td className="text-center">
                    <strong className="text-primary">
                      {record ? `${record.weight} kg` : '-'}
                    </strong>
                  </td>
                  <td>{record ? record.team || '-' : '-'}</td>
                  <td>{record ? record.competition : '-'}</td>
                  <td className="text-center">
                    {record ? new Date(record.date).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  // Renderizar tabela de supino (aba separada)
  const renderSupinoTable = () => {
    const filteredRecords = getFilteredRecords().filter(r => r.movement === 'bench_solo');
    
    // Verificar se há filtros ativos (não "ALL")
    const hasActiveFilters = selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL';
    
    // Se não há filtros ativos (todos em "ALL"), mostrar mensagem
    if (!hasActiveFilters) {
      return (
        <Alert variant="info">
          <FaInfoCircle className="me-2" />
          <strong>Configure os filtros para visualizar os records de supino</strong>
          <br />
          Selecione uma divisão de idade, sexo e modalidade para ver os records correspondentes.
        </Alert>
      );
    }
    
    // Se não há records mesmo com filtros ativos, mostrar mensagem
    if (filteredRecords.length === 0 && hasActiveFilters) {
      return (
        <Alert variant="warning">
          <FaInfoCircle className="me-2" />
          Nenhum record de supino encontrado para os filtros selecionados.
        </Alert>
      );
    }

    // Organizar por categoria de peso
    const allWeightClasses = selectedSex === 'F' 
      ? ['Até 43,0 kg', '47,0 kg', '52,0 kg', '57,0 kg', '63,0 kg', '69,0 kg', '76,0 kg', '84,0 kg', '+84,0 kg']
      : ['Até 53,0 kg', '59,0 kg', '66,0 kg', '74,0 kg', '83,0 kg', '93,0 kg', '105,0 kg', '120,0 kg', '+120,0 kg'];
    
    const organizedByWeight: { [key: string]: Record | null } = {};
    
    // Mostrar apenas categorias com records
    allWeightClasses.forEach(weightClass => {
      const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
      if (recordsInClass.length > 0) {
        const bestRecord = recordsInClass.reduce((best, current) => 
          current.weight > best.weight ? current : best
        );
        organizedByWeight[weightClass] = bestRecord;
      }
    });
    
    // Criar lista de categorias com records
    const weightClasses = Object.keys(organizedByWeight);

    return (
      <div className="table-responsive">
        <Table className="table-sm table-bordered">
          <thead>
            <tr>
              <th colSpan={6} style={tableStyles.cabec1}>
                SUPINO - TODAS AS CATEGORIAS
              </th>
            </tr>
          </thead>
          <thead>
            <tr style={{height: '5px'}}>
              <th style={{...tableStyles.cabec2, width: '15%'}} className="text-center">Categoria</th>
              <th style={{...tableStyles.cabec2, width: '25%'}}>Atleta</th>
              <th style={{...tableStyles.cabec2, width: '10%'}} className="text-center">Marca</th>
              <th style={{...tableStyles.cabec2, width: '18%'}}>Equipe</th>
              <th style={{...tableStyles.cabec2, width: '18%'}}>Local</th>
              <th style={{...tableStyles.cabec2, width: '10%'}} className="text-center">Data</th>
            </tr>
          </thead>
          <tbody>
            {weightClasses.map(weightClass => {
              const record = organizedByWeight[weightClass];
              
              return (
                <tr key={weightClass}>
                  <td className="text-center">
                    <Badge bg="success">
                      {weightClass}
                    </Badge>
                  </td>
                  <td>
                    <strong>{record ? record.athleteName : '-'}</strong>
                  </td>
                  <td className="text-center">
                    <strong className="text-success">
                      {record ? `${record.weight} kg` : '-'}
                    </strong>
                  </td>
                  <td>{record ? record.team || '-' : '-'}</td>
                  <td>{record ? record.competition : '-'}</td>
                  <td className="text-center">
                    {record ? new Date(record.date).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <FaInfoCircle className="me-2" />
        {error}
      </Alert>
    );
  }

  return (
    <div>
      {/* Cabeçalho com filtros */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaTrophy className="me-2" />
              Records de Powerlifting
            </h5>
            <div>
              <Button 
                variant="outline-primary" 
                onClick={() => handleExportPDF('squat')}
                className="me-2"
              >
                <FaFilePdf className="me-1" />
                Exportar Agachamento
              </Button>
              <Button 
                variant="outline-success" 
                onClick={() => handleExportPDF('bench')}
                className="me-2"
              >
                <FaFilePdf className="me-1" />
                Exportar Supino
              </Button>
              <Button 
                variant="outline-warning" 
                onClick={() => handleExportPDF('deadlift')}
                className="me-2"
              >
                <FaFilePdf className="me-1" />
                Exportar Terra
              </Button>
              <Button 
                variant="outline-info" 
                onClick={() => handleExportPDF('total')}
              >
                <FaFilePdf className="me-1" />
                Exportar Total
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Divisão de Idade</Form.Label>
                <Form.Select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  {divisions.map(division => (
                    <option key={division} value={division}>
                      {division === 'ALL' ? 'Todas as divisões' : getDivisionName(division)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Sexo</Form.Label>
                <Form.Select
                  value={selectedSex}
                  onChange={(e) => setSelectedSex(e.target.value)}
                >
                  {sexes.map(sex => (
                    <option key={sex} value={sex}>
                      {sex === 'ALL' ? 'Ambos os sexos' : sex === 'M' ? 'Masculino' : 'Feminino'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Modalidade</Form.Label>
                <Form.Select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                >
                  {equipments.map(equipment => (
                    <option key={equipment} value={equipment}>
                      {equipment === 'ALL' ? 'Todas as modalidades' : getEquipmentName(equipment)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Abas de movimentos */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as 'all' | 'bench')}
        className="mb-4"
      >
        <Tab eventKey="all" title="🏋️ Todos os Movimentos">
          {/* Records de Agachamento */}
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <Badge bg="primary" className="me-2">
                  Agachamento
                </Badge>
                Records de Agachamento
              </h5>
            </Card.Header>
            <Card.Body>
              {renderRecordsTable('squat')}
            </Card.Body>
          </Card>

          {/* Records de Supino */}
          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <Badge bg="success" className="me-2">
                  Supino
                </Badge>
                Records de Supino
              </h5>
            </Card.Header>
            <Card.Body>
              {renderRecordsTable('bench')}
            </Card.Body>
          </Card>

          {/* Records de Terra */}
          <Card className="mb-4">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <Badge bg="warning" className="me-2">
                  Terra
                </Badge>
                Records de Terra
              </h5>
            </Card.Header>
            <Card.Body>
              {renderRecordsTable('deadlift')}
            </Card.Body>
          </Card>

          {/* Records de Total */}
          <Card className="mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <Badge bg="info" className="me-2">
                  Total
                </Badge>
                Records de Total
              </h5>
            </Card.Header>
            <Card.Body>
              {renderRecordsTable('total')}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="bench" title="💪 Apenas Supino">
          <div className="mb-3">
            <Button 
              variant="outline-success" 
              onClick={() => handleExportPDF('bench_solo')}
            >
              <FaFilePdf className="me-2" />
              Exportar Records de Supino
            </Button>
          </div>

          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <Badge bg="success" className="me-2">
                  Supino
                </Badge>
                Records de Supino - Todas as Categorias
              </h5>
            </Card.Header>
            <Card.Body>
              {renderSupinoTable()}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

// Função para obter nome da divisão
const getDivisionName = (division: string) => {
  const divisionNames: { [key: string]: string } = {
    'SUBJR': 'Sub-Junior',
    'JR': 'Junior',
    'OPEN': 'Open',
    'MASTER1': 'Master I',
    'MASTER2': 'Master II',
    'MASTER3': 'Master III',
    'MASTER4': 'Master IV'
  };
  return divisionNames[division] || division;
};

// Função para obter nome do equipamento
const getEquipmentName = (equipment: string) => {
  const equipmentNames: { [key: string]: string } = {
    'CLASSICA': 'Clássico',
    'EQUIPADO': 'Equipado'
  };
  return equipmentNames[equipment] || equipment;
};

export default RecordsDisplayPublic;