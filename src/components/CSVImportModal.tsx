import React, { useState, useRef } from 'react';
import { 
  Modal, 
  Button, 
  Form, 
  Alert, 
  Spinner,
  Table,
  Badge,
  Card,
  Row,
  Col
} from 'react-bootstrap';
import { 
  FaFileCsv, 
  FaUpload, 
  FaCheck, 
  FaTimes, 
  FaDownload,
  FaInfoCircle,
  FaFileUpload
} from 'react-icons/fa';
import { recordsService, CSVRecord } from '../services/recordsService';
import { useAdminPermission } from '../hooks/useAdminPermission';
import { obterCategoriasPeso } from '../config/categorias';

interface CSVImportModalProps {
  show: boolean;
  onHide: () => void;
  onImportComplete: () => void;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({ show, onHide, onImportComplete }) => {
  const { isAdmin } = useAdminPermission();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ success: number; errors: number } | null>(null);
  
  // Configurações do tipo de record
  const [selectedEquipment, setSelectedEquipment] = useState<string>('CLASSICA');
  const [selectedSex, setSelectedSex] = useState<string>('F');
  const [selectedMovement, setSelectedMovement] = useState<string>('squat');
  const [selectedDivision, setSelectedDivision] = useState<string>('OPEN');
  
  // Dados para preenchimento manual
  const [manualRecords, setManualRecords] = useState<CSVRecord[]>([]);
  
  // Referência para input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Obter categorias de peso baseadas no sexo selecionado
  const categoriasPeso = obterCategoriasPeso(selectedSex as 'M' | 'F');

  // Inicializar records manuais quando configurações mudarem
  React.useEffect(() => {
    initializeManualRecords();
  }, [selectedMovement, selectedDivision, selectedSex, selectedEquipment]);

  // Função para inicializar records manuais
  const initializeManualRecords = () => {
    console.log('🔄 Inicializando records manuais...');
    console.log('🏋️ Categorias de peso:', categoriasPeso);
    console.log('🔧 Configurações:', {
      movement: selectedMovement,
      division: selectedDivision,
      sex: selectedSex,
      equipment: selectedEquipment
    });
    
    const initialRecords = categoriasPeso.map(categoria => ({
      movement: selectedMovement,
      division: selectedDivision,
      sex: selectedSex,
      equipment: selectedEquipment,
      weightClass: categoria.nome,
      weight: 0,
      athleteName: '',
      team: '',
      competition: '',
      date: ''
    }));
    
    console.log('📊 Records iniciais criados:', initialRecords);
    setManualRecords(initialRecords);
  };

  // Função para atualizar record manual
  const updateManualRecord = (categoriaNome: string, field: keyof CSVRecord, value: string | number) => {
    console.log(`🔄 Atualizando record: ${categoriaNome}, campo: ${field}, valor: ${value}`);
    
    setManualRecords(prev => {
      const updated = prev.map(record => 
        record.weightClass === categoriaNome 
          ? { ...record, [field]: value }
          : record
      );
      
      console.log('📊 Records atualizados:', updated);
      return updated;
    });
  };

     // Função para baixar modelo CSV
   const downloadCSVTemplate = () => {
     console.log('📥 Iniciando download do modelo CSV...');
     console.log('🏋️ Categorias de peso disponíveis:', categoriasPeso.map(cat => `"${cat.nome}"`));
     
     const headers = ['Categoria de peso', 'Nome do atleta', 'Marca', 'Equipe', 'Local da competição', 'Data'];
     
     // Criar dados de exemplo baseados nas configurações selecionadas
     const exampleData = categoriasPeso.map(categoria => [
       categoria.nome, // Usar o nome exato da categoria (ex: "Até 43,0 kg")
       'Nome do Atleta',
       '0',
       'Nome da Equipe',
       'Local da Competição',
       'dd/mm/aaaa'
     ]);
     
     console.log('📋 Dados de exemplo:', exampleData);
     
     // Criar CSV
     const csvContent = [
       headers.join(','),
       ...exampleData.map(row => row.join(','))
     ].join('\n');
     
     console.log('📄 Conteúdo do CSV gerado:', csvContent);
     
     // Criar e baixar arquivo
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     const url = URL.createObjectURL(blob);
     link.setAttribute('href', url);
     const filename = `modelo_records_${selectedMovement}_${selectedDivision}_${selectedSex}_${selectedEquipment}_${new Date().toISOString().split('T')[0]}.csv`;
     link.setAttribute('download', filename);
     link.style.visibility = 'hidden';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     
     console.log('✅ Modelo CSV baixado com sucesso:', filename);
     
     // Mostrar mensagem de sucesso
     setSuccess(`✅ Modelo CSV baixado com sucesso!\n\nArquivo: ${filename}\nCategorias incluídas: ${categoriasPeso.length}\n\nPreencha o arquivo e carregue-o de volta para preencher automaticamente os campos.`);
     setError(null);
   };

  // Função para processar arquivo CSV carregado
  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        console.log('📄 Conteúdo do CSV carregado:', csvContent);
        
        const lines = csvContent.split('\n');
        console.log('📊 Linhas encontradas:', lines.length);
        console.log('📋 Linhas:', lines);
        
        if (lines.length < 2) {
          setError('Arquivo CSV inválido. Deve ter pelo menos cabeçalho e uma linha de dados.');
          return;
        }

        // Pular cabeçalho e processar linhas de dados
        const dataLines = lines.slice(1);
        console.log('📝 Linhas de dados (sem cabeçalho):', dataLines);
        
        const loadedRecords: CSVRecord[] = [];
        
        dataLines.forEach((line, index) => {
          if (line.trim()) {
            const values = line.split(',').map(v => v.trim());
            console.log(`🔍 Processando linha ${index + 1}:`, values);
            
            if (values.length >= 6) {
              const [weightClass, athleteName, weight, team, competition, date] = values;
              console.log(`📏 Categoria encontrada: "${weightClass}"`);
              console.log(`🏋️ Categorias disponíveis:`, categoriasPeso.map(cat => `"${cat.nome}"`));
              
              // Verificar se a categoria tem conteúdo válido
              if (!weightClass || weightClass === '') {
                console.log(`⚠️ Categoria vazia na linha ${index + 1}, pulando...`);
                return;
              }
              
              // Encontrar a categoria correspondente
              const categoria = categoriasPeso.find(cat => cat.nome === weightClass);
              console.log(`✅ Categoria correspondente encontrada:`, categoria);
              
              if (categoria) {
                const newRecord = {
                  movement: selectedMovement,
                  division: selectedDivision,
                  sex: selectedSex,
                  equipment: selectedEquipment,
                  weightClass: weightClass,
                  weight: parseFloat(weight) || 0,
                  athleteName: athleteName || '',
                  team: team || '',
                  competition: competition || '',
                  date: date || ''
                };
                console.log(`➕ Record criado:`, newRecord);
                loadedRecords.push(newRecord);
              } else {
                console.log(`❌ Categoria "${weightClass}" não encontrada nas categorias disponíveis`);
                console.log(`🔍 Tentando encontrar correspondência parcial...`);
                
                // Tentar encontrar correspondência parcial (case-insensitive)
                const partialMatch = categoriasPeso.find(cat => 
                  cat.nome.toLowerCase().includes(weightClass.toLowerCase()) ||
                  weightClass.toLowerCase().includes(cat.nome.toLowerCase())
                );
                
                if (partialMatch) {
                  console.log(`✅ Correspondência parcial encontrada: "${partialMatch.nome}" para "${weightClass}"`);
                  const newRecord = {
                    movement: selectedMovement,
                    division: selectedDivision,
                    sex: selectedSex,
                    equipment: selectedEquipment,
                    weightClass: partialMatch.nome, // Usar o nome exato da categoria
                    weight: parseFloat(weight) || 0,
                    athleteName: athleteName || '',
                    team: team || '',
                    competition: competition || '',
                    date: date || ''
                  };
                  console.log(`➕ Record criado com correspondência parcial:`, newRecord);
                  loadedRecords.push(newRecord);
                } else {
                  console.log(`❌ Nenhuma correspondência encontrada para "${weightClass}"`);
                }
              }
            } else {
              console.log(`⚠️ Linha ${index + 1} tem apenas ${values.length} valores, precisa de 6`);
            }
          }
        });

        console.log(`📊 Total de records carregados:`, loadedRecords.length);
        console.log(`📋 Records carregados:`, loadedRecords);

        if (loadedRecords.length > 0) {
          // Atualizar os records manuais com os dados carregados
          setManualRecords(prev => prev.map(record => {
            const loadedRecord = loadedRecords.find(lr => lr.weightClass === record.weightClass);
            return loadedRecord || record;
          }));
          
          setSuccess(`✅ ${loadedRecords.length} records carregados do arquivo CSV com sucesso!`);
          setError(null);
        } else {
          setError('Nenhum record válido encontrado no arquivo CSV. Verifique se as categorias de peso correspondem exatamente às disponíveis no sistema.');
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar CSV:', error);
        setError('Erro ao processar arquivo CSV. Verifique o formato.');
      }
    };
    
    reader.readAsText(file);
  };

  // Função para lidar com seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        processCSVFile(file);
      } else {
        setError('Por favor, selecione um arquivo CSV válido.');
      }
    }
  };

  // Função para importar records
  const handleImport = async () => {
    console.log('🚀 Iniciando importação de records...');
    console.log('📊 Records manuais:', manualRecords);
    
    const recordsToImport = manualRecords.filter(r => r.athleteName && r.weight > 0);
    console.log('✅ Records válidos para importação:', recordsToImport);
    
    if (recordsToImport.length === 0) {
      setError('Preencha pelo menos um record válido (atleta e peso)');
      return;
    }
    
    // Confirmação para importação
    const confirmMessage = `⚠️ ATENÇÃO!\n\nVocê está prestes a importar ${recordsToImport.length} records para Firebase.\n\nO sistema irá:\n• Manter records existentes que são melhores\n• Atualizar apenas quando o novo record for superior\n• Adicionar novos records para categorias vazias\n\nTem certeza que deseja continuar?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      setImporting(true);
      setError(null);
      
      console.log('📤 Enviando records para Firebase...');
      const results = await recordsService.importFromCSV(recordsToImport);
      console.log('📊 Resultados da importação:', results);
      
      setImportResults(results);
      
      if (results.success > 0) {
        setSuccess(`✅ Importação concluída com sucesso!\n${results.success} records processados\n${results.errors} erros encontrados\n\nℹ️ Records antigos foram mantidos quando eram melhores.`);
        onImportComplete();
      } else {
        setError('Nenhum record foi importado. Verifique os dados.');
      }
      
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      setError(`Erro durante a importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setImporting(false);
    }
  };

  // Função para limpar formulário
  const handleClear = () => {
    setManualRecords([]);
    setError(null);
    setSuccess(null);
    setImportResults(null);
    setSelectedEquipment('CLASSICA');
    setSelectedSex('F');
    setSelectedMovement('squat');
    setSelectedDivision('OPEN');
    initializeManualRecords();
    
    // Limpar input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para fechar modal
  const handleClose = () => {
    handleClear();
    onHide();
  };

  // Verificar se o usuário é admin
  if (!isAdmin) {
    return (
      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileCsv className="me-2" />
            Acesso Negado
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <Alert variant="danger">
            <h4>🚫 Acesso Restrito</h4>
            <p>Apenas administradores podem importar records via Firebase.</p>
            <p>Se você acredita que deveria ter acesso a esta funcionalidade, entre em contato com um administrador.</p>
          </Alert>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} size="xl">
             <Modal.Header closeButton>
         <Modal.Title>
           <FaUpload className="me-2" />
           Sistema de Records - Configuração e Importação
         </Modal.Title>
       </Modal.Header>
      
      <Modal.Body>
                 {/* Instruções */}
         <Alert variant="info" className="mb-3">
           <FaInfoCircle className="me-2" />
           <strong>ℹ️ Sistema Completo de Records:</strong>
           <ul className="mb-0 mt-2">
             <li><strong>1. Configuração:</strong> Selecione Movimento, Categoria de Idade, Modalidade e Sexo</li>
             <li><strong>2. Categorias de Peso:</strong> São ajustadas automaticamente baseadas no sexo selecionado</li>
             <li><strong>3. Template CSV:</strong> Use "Baixar Modelo CSV" para obter um template preenchível</li>
             <li><strong>4. Importação CSV:</strong> Use "Carregar CSV" para preencher automaticamente os campos</li>
             <li><strong>5. Preenchimento Manual:</strong> Preencha apenas os campos dos records que deseja importar</li>
             <li><strong>6. Sistema Inteligente:</strong> Records antigos são mantidos quando são melhores</li>
             <li><strong>7. Atualização:</strong> Novos records só substituem quando são superiores</li>
           </ul>
         </Alert>
        
                 {/* Configurações do tipo de record */}
         <Card className="mb-3">
           <Card.Header className="bg-primary text-white">
             <h6 className="mb-0">
               <FaInfoCircle className="me-2" />
               Configurações do Record - Selecione as Categorias
             </h6>
           </Card.Header>
           <Card.Body>
             <Row>
               <Col md={3}>
                 <Form.Group>
                   <Form.Label><strong>Movimento:</strong></Form.Label>
                   <Form.Select 
                     value={selectedMovement} 
                     onChange={(e) => setSelectedMovement(e.target.value)}
                     className="form-select-lg"
                   >
                     <option value="squat">🏋️ Agachamento</option>
                     <option value="bench">💪 Supino</option>
                     <option value="deadlift">🏋️ Terra</option>
                     <option value="total">🏆 Total</option>
                   </Form.Select>
                 </Form.Group>
               </Col>
               <Col md={3}>
                 <Form.Group>
                   <Form.Label><strong>Categoria de Idade:</strong></Form.Label>
                   <Form.Select 
                     value={selectedDivision} 
                     onChange={(e) => setSelectedDivision(e.target.value)}
                     className="form-select-lg"
                   >
                     <option value="SUBJR">👶 Sub Júnior</option>
                     <option value="JR">🧑‍🎓 Júnior</option>
                     <option value="OPEN">👨‍💼 Open</option>
                     <option value="MASTER1">👴 Master 1</option>
                     <option value="MASTER2">👴 Master 2</option>
                     <option value="MASTER3">👴 Master 3</option>
                     <option value="MASTER4">👴 Master 4</option>
                   </Form.Select>
                 </Form.Group>
               </Col>
               <Col md={3}>
                 <Form.Group>
                   <Form.Label><strong>Modalidade:</strong></Form.Label>
                   <Form.Select 
                     value={selectedEquipment} 
                     onChange={(e) => setSelectedEquipment(e.target.value)}
                     className="form-select-lg"
                   >
                     <option value="CLASSICA">🏃 Clássica</option>
                     <option value="EQUIPADO">🦾 Equipado</option>
                   </Form.Select>
                 </Form.Group>
               </Col>
               <Col md={3}>
                 <Form.Group>
                   <Form.Label><strong>Sexo:</strong></Form.Label>
                   <Form.Select 
                     value={selectedSex} 
                     onChange={(e) => setSelectedSex(e.target.value)}
                     className="form-select-lg"
                   >
                     <option value="F">👩 Feminino</option>
                     <option value="M">👨 Masculino</option>
                   </Form.Select>
                 </Form.Group>
               </Col>
             </Row>
             
             {/* Resumo das configurações selecionadas */}
             <Alert variant="success" className="mt-3">
               <div className="row text-center">
                 <div className="col-md-3">
                   <strong>Movimento:</strong><br/>
                   <Badge bg="primary" className="mt-1">
                     {selectedMovement === 'squat' ? '🏋️ Agachamento' :
                      selectedMovement === 'bench' ? '💪 Supino' :
                      selectedMovement === 'deadlift' ? '🏋️ Terra' : '🏆 Total'}
                   </Badge>
                 </div>
                 <div className="col-md-3">
                   <strong>Categoria:</strong><br/>
                   <Badge bg="info" className="mt-1">
                     {selectedDivision === 'SUBJR' ? '👶 Sub Júnior' :
                      selectedDivision === 'JR' ? '🧑‍🎓 Júnior' :
                      selectedDivision === 'OPEN' ? '👨‍💼 Open' :
                      selectedDivision === 'MASTER1' ? '👴 Master 1' :
                      selectedDivision === 'MASTER2' ? '👴 Master 2' :
                      selectedDivision === 'MASTER3' ? '👴 Master 3' : '👴 Master 4'}
                   </Badge>
                 </div>
                 <div className="col-md-3">
                   <strong>Modalidade:</strong><br/>
                   <Badge bg="warning" className="mt-1">
                     {selectedEquipment === 'CLASSICA' ? '🏃 Clássica' : '🦾 Equipado'}
                   </Badge>
                 </div>
                 <div className="col-md-3">
                   <strong>Sexo:</strong><br/>
                   <Badge bg="secondary" className="mt-1">
                     {selectedSex === 'F' ? '👩 Feminino' : '👨 Masculino'}
                   </Badge>
                 </div>
               </div>
             </Alert>
            <Alert variant="info" className="mt-2 mb-0">
              <small>
                <strong>ℹ️ Importante:</strong> Estas configurações serão aplicadas a todos os records.
                <br />
                As categorias de peso serão ajustadas automaticamente baseadas no sexo selecionado.
              </small>
            </Alert>
          </Card.Body>
        </Card>

        {/* Botões de CSV */}
        <Card className="mb-3">
          <Card.Header className="bg-primary text-white">
            <h6 className="mb-0">
              <FaFileCsv className="me-2" />
              Gerenciamento de Arquivos CSV
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Button 
                  variant="outline-info" 
                  onClick={downloadCSVTemplate}
                  className="w-100 mb-2"
                >
                  <FaDownload className="me-2" />
                  Baixar Modelo CSV
                </Button>
                <small className="text-muted">
                  Baixa um template com todas as categorias de peso para preenchimento externo
                </small>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Carregar CSV Preenchido:</Form.Label>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />
                  <small className="text-muted">
                    Carrega um arquivo CSV preenchido para preencher automaticamente os campos
                  </small>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Interface de preenchimento manual */}
        <Card className="mb-3">
          <Card.Header className="bg-success text-white">
            <h6 className="mb-0">
              <FaUpload className="me-2" />
              Preenchimento Manual dos Records - {selectedSex === 'F' ? 'Feminino' : 'Masculino'}
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table className="table-sm table-bordered">
                                 <thead>
                   <tr>
                     <th colSpan={6} style={{
                       fontFamily: 'Tahoma',
                       fontWeight: 'normal',
                       fontSize: '18px',
                       textAlign: 'left',
                       padding: '2pt',
                       backgroundColor: '#0B610B',
                       color: 'white'
                     }}>
                       {selectedMovement === 'squat' ? '🏋️ AGACHAMENTO' :
                        selectedMovement === 'bench' ? '💪 SUPINO' :
                        selectedMovement === 'deadlift' ? '🏋️ TERRA' : '🏆 TOTAL'}
                       {' - '}
                       {selectedDivision === 'SUBJR' ? 'SUB JÚNIOR' :
                        selectedDivision === 'JR' ? 'JÚNIOR' :
                        selectedDivision === 'OPEN' ? 'OPEN' :
                        selectedDivision === 'MASTER1' ? 'MASTER 1' :
                        selectedDivision === 'MASTER2' ? 'MASTER 2' :
                        selectedDivision === 'MASTER3' ? 'MASTER 3' : 'MASTER 4'}
                       {' - '}
                       {selectedEquipment === 'CLASSICA' ? 'CLÁSSICA' : 'EQUIPADO'}
                       {' - '}
                       {selectedSex === 'F' ? 'FEMININO' : 'MASCULINO'}
                     </th>
                   </tr>
                 </thead>
                <thead>
                  <tr style={{height: '5px'}}>
                                         <th style={{
                       fontFamily: 'Tahoma',
                       fontWeight: 'normal',
                       fontSize: '16px',
                       padding: '2pt',
                       backgroundColor: '#98C0B9',
                       color: '#0B610B',
                       width: '15%'
                     }} className="text-center">Categoria de peso</th>
                     <th style={{
                       fontFamily: 'Tahoma',
                       fontWeight: 'normal',
                       fontSize: '16px',
                       padding: '2pt',
                       backgroundColor: '#98C0B9',
                       color: '#0B610B',
                       width: '30%'
                     }}>Nome do atleta</th>
                     <th style={{
                       fontFamily: 'Tahoma',
                       fontWeight: 'normal',
                       fontSize: '16px',
                       padding: '2pt',
                       backgroundColor: '#98C0B9',
                       color: '#0B610B',
                       width: '10%'
                     }} className="text-center">Marca</th>
                     <th style={{
                       fontFamily: 'Tahoma',
                       fontWeight: 'normal',
                       fontSize: '16px',
                       padding: '2pt',
                       backgroundColor: '#98C0B9',
                       color: '#0B610B',
                       width: '20%'
                     }}>Equipe</th>
                     <th style={{
                       fontFamily: 'Tahoma',
                       fontWeight: 'normal',
                       fontSize: '16px',
                       padding: '2pt',
                       backgroundColor: '#98C0B9',
                       color: '#0B610B',
                       width: '20%'
                     }}>Local da competição</th>
                    <th style={{
                      fontFamily: 'Tahoma',
                      fontWeight: 'normal',
                      fontSize: '16px',
                      padding: '2pt',
                      backgroundColor: '#98C0B9',
                      color: '#0B610B',
                      width: '10%'
                    }} className="text-center">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRecords.map((record, index) => (
                    <tr key={index} style={{whiteSpace: 'nowrap'}}>
                      <td>{record.weightClass}</td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={record.athleteName}
                          onChange={(e) => updateManualRecord(record.weightClass, 'athleteName', e.target.value)}
                          placeholder="Nome do atleta"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={record.weight || ''}
                          onChange={(e) => updateManualRecord(record.weightClass, 'weight', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.5"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={record.team}
                          onChange={(e) => updateManualRecord(record.weightClass, 'team', e.target.value)}
                          placeholder="Nome da equipe"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={record.competition}
                          onChange={(e) => updateManualRecord(record.weightClass, 'competition', e.target.value)}
                          placeholder="Local da competição"
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={record.date}
                          onChange={(e) => updateManualRecord(record.weightClass, 'date', e.target.value)}
                          placeholder="dd/mm/aaaa"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <Alert variant="info" className="mt-2 mb-0">
              <small>
                <strong>ℹ️ Instruções:</strong> Preencha apenas os campos dos records que deseja importar. 
                Deixe em branco as categorias sem records. 
                O sistema importará apenas os records com atleta e peso preenchidos.
                <br />
                <strong>Categorias disponíveis:</strong> {categoriasPeso.length} categorias de peso para {selectedSex === 'F' ? 'feminino' : 'masculino'}.
              </small>
            </Alert>
            
                         {/* Botão de teste para verificar se está funcionando */}
             <div className="mt-3 text-center">
               <Button 
                 variant="outline-info" 
                 size="sm"
                 onClick={() => {
                   console.log('🧪 Testando modal de records...');
                   console.log('📊 Records manuais:', manualRecords);
                   console.log('🔧 Configurações selecionadas:', {
                     movement: selectedMovement,
                     division: selectedDivision,
                     sex: selectedSex,
                     equipment: selectedEquipment
                   });
                   console.log('🏋️ Categorias de peso disponíveis:', categoriasPeso);
                   
                   // Preencher um record de teste
                   const testRecord = {
                     movement: selectedMovement,
                     division: selectedDivision,
                     sex: selectedSex,
                     equipment: selectedEquipment,
                     weightClass: categoriasPeso[0]?.nome || 'Teste',
                     weight: 100,
                     athleteName: 'Atleta Teste',
                     team: 'Equipe Teste',
                     competition: 'Competição Teste',
                     date: '15/01/2024'
                   };
                   
                   console.log('📝 Record de teste criado:', testRecord);
                   
                   // Mostrar resumo das configurações
                   const configSummary = `
🧪 TESTE DO MODAL DE RECORDS

📋 CONFIGURAÇÕES SELECIONADAS:
• Movimento: ${selectedMovement === 'squat' ? '🏋️ Agachamento' : selectedMovement === 'bench' ? '💪 Supino' : selectedMovement === 'deadlift' ? '🏋️ Terra' : '🏆 Total'}
• Categoria: ${selectedDivision === 'SUBJR' ? '👶 Sub Júnior' : selectedDivision === 'JR' ? '🧑‍🎓 Júnior' : selectedDivision === 'OPEN' ? '👨‍💼 Open' : selectedDivision === 'MASTER1' ? '👴 Master 1' : selectedDivision === 'MASTER2' ? '👴 Master 2' : selectedDivision === 'MASTER3' ? '👴 Master 3' : '👴 Master 4'}
• Modalidade: ${selectedEquipment === 'CLASSICA' ? '🏃 Clássica' : '🦾 Equipado'}
• Sexo: ${selectedSex === 'F' ? '👩 Feminino' : '👨 Masculino'}

🏋️ CATEGORIAS DE PESO: ${categoriasPeso.length} categorias
📊 RECORDS MANUAIS: ${manualRecords.length} registros

✅ Modal funcionando corretamente!
                   `;
                   
                   alert(configSummary);
                 }}
               >
                 🧪 Testar Configurações
               </Button>
             </div>
          </Card.Body>
        </Card>

        {/* Mensagens de status */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            <FaTimes className="me-2" />
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            <FaCheck className="me-2" />
            {success}
          </Alert>
        )}

        {/* Resultados da importação */}
        {importResults && (
          <Alert variant={importResults.success > 0 ? 'success' : 'warning'}>
            <h6>Resultado da Importação:</h6>
            <p className="mb-1"><strong>Records importados:</strong> {importResults.success}</p>
            <p className="mb-0"><strong>Erros encontrados:</strong> {importResults.errors}</p>
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="outline-secondary" onClick={handleClear}>
          Limpar
        </Button>
                 <Button 
           variant="success" 
           onClick={handleImport}
           disabled={manualRecords.filter(r => r.athleteName && r.weight > 0).length === 0 || importing}
         >
           {importing ? (
             <>
               <Spinner animation="border" size="sm" className="me-2" />
               Importando...
             </>
           ) : (
             <>
               <FaUpload className="me-2" />
               Importar Records para Firebase
               <br />
               <small>
                 {selectedMovement === 'squat' ? '🏋️ Agachamento' : selectedMovement === 'bench' ? '💪 Supino' : selectedMovement === 'deadlift' ? '🏋️ Terra' : '🏆 Total'}
                 {' - '}
                 {selectedDivision === 'SUBJR' ? '👶 Sub Júnior' : selectedDivision === 'JR' ? '🧑‍🎓 Júnior' : selectedDivision === 'OPEN' ? '👨‍💼 Open' : selectedDivision === 'MASTER1' ? '👴 Master 1' : selectedDivision === 'MASTER2' ? '👴 Master 2' : selectedDivision === 'MASTER3' ? '👴 Master 3' : '👴 Master 4'}
                 {' - '}
                 {selectedEquipment === 'CLASSICA' ? '🏃 Clássica' : '🦾 Equipado'}
                 {' - '}
                 {selectedSex === 'F' ? '👩 Feminino' : '👨 Masculino'}
               </small>
             </>
           )}
         </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CSVImportModal;
