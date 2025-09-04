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
  FaInfoCircle
} from 'react-icons/fa';
import { recordsService, Record } from '../services/recordsService';
import { useAdminPermission } from '../hooks/useAdminPermission';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RecordsDisplayProps {
  onRefresh?: () => void;
}

const RecordsDisplay: React.FC<RecordsDisplayProps> = ({ onRefresh }) => {
  const { isAdmin } = useAdminPermission();
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

  // Organizar records por categoria
  const organizeRecordsByCategory = (movement: string) => {
    const filteredRecords = getFilteredRecords().filter(r => r.movement === movement);
    
    const organized: { [key: string]: { [key: string]: { [key: string]: Record[] } } } = {};
    
    filteredRecords.forEach(record => {
      if (!organized[record.division]) {
        organized[record.division] = {};
      }
      if (!organized[record.division][record.sex]) {
        organized[record.division][record.sex] = {};
      }
      if (!organized[record.division][record.sex][record.equipment]) {
        organized[record.division][record.sex][record.equipment] = [];
      }
      
      // Verificar se já existe um record melhor para esta categoria de peso
      const existingIndex = organized[record.division][record.sex][record.equipment]
        .findIndex(r => r.weightClass === record.weightClass);
      
      if (existingIndex === -1) {
        organized[record.division][record.sex][record.equipment].push(record);
      } else if (record.weight > organized[record.division][record.sex][record.equipment][existingIndex].weight) {
        organized[record.division][record.sex][record.equipment][existingIndex] = record;
      }
    });
    
    // Ordenar por peso em cada categoria
    Object.values(organized).forEach(sexData => {
      Object.values(sexData).forEach(equipmentData => {
        if (Array.isArray(equipmentData)) {
          equipmentData.sort((a: Record, b: Record) => b.weight - a.weight);
        }
      });
    });
    
    return organized;
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
         
         // Para administradores: sempre mostrar todas as categorias (vazias e preenchidas)
         // Para usuários normais: mostrar apenas categorias com records
         if (isAdmin) {
           // Administradores veem todas as categorias
           allWeightClasses.forEach(weightClass => {
             const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
             if (recordsInClass.length > 0) {
               const bestRecord = recordsInClass.reduce((best, current) => 
                 current.weight > best.weight ? current : best
               );
               organizedByWeight[weightClass] = bestRecord;
             } else {
               // Categoria vazia para administradores
               organizedByWeight[weightClass] = null;
             }
           });
         } else {
           // Usuários normais veem apenas categorias com records
           allWeightClasses.forEach(weightClass => {
             const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
             if (recordsInClass.length > 0) {
               const bestRecord = recordsInClass.reduce((best, current) => 
                 current.weight > best.weight ? current : best
               );
               organizedByWeight[weightClass] = bestRecord;
             }
           });
         }
         
         // Criar lista de categorias baseada no tipo de usuário
         const weightClasses = isAdmin ? allWeightClasses : Object.keys(organizedByWeight);
      
                              // Verificar se há filtros ativos para decidir se incluir linhas vazias
         const hasActiveFiltersForPDF = selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL';
        
        // Criar dados da tabela
                 const tableData = weightClasses.map(weightClass => {
           const record = organizedByWeight[weightClass];
           return [
             weightClass,
             record ? record.athleteName : '',
             record ? record.weight : '',
             record ? record.team : '',
             record ? record.competition : '',
                           record ? record.date.toLocaleDateString('pt-BR') : (hasActiveFiltersForPDF ? '01-01-2011' : '')
           ].map(value => value || ''); // Garantir que não há valores undefined
         });
      
      // Adicionar tabela
      autoTable(doc, {
        startY: 35,
        head: [['Categoria', 'Atleta', 'Marca', 'Equipe', 'Local', 'Data']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { 
          fillColor: [139, 69, 19],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
          5: { cellWidth: 25 }
        }
      });
      
      // Salvar PDF
      doc.save(`records_${movement}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  // Função para obter nome de exibição do movimento
  const getMovementDisplayName = (movement: string): string => {
    const names: { [key: string]: string } = {
      'squat': 'Agachamento',
      'bench': 'Supino',
      'bench_solo': 'Supino - Só de Supino',
      'deadlift': 'Terra',
      'total': 'Total'
    };
    return names[movement] || movement;
  };

  // Função para obter cor do badge do movimento
  const getMovementBadgeColor = (movement: string): string => {
    const colors: { [key: string]: string } = {
      'squat': 'primary',
      'bench': 'success',
      'deadlift': 'warning',
      'total': 'info'
    };
    return colors[movement] || 'secondary';
  };

     // Estados para edição em lote
   const [editingRecords, setEditingRecords] = useState<Set<string>>(new Set()); // Set de chaves únicas (weightClass + movement)
   const [batchEditValues, setBatchEditValues] = useState<Map<string, {
     athleteName: string;
     weight: number;
     team: string;
     competition: string;
     date: string;
   }>>(new Map());
   const [saving, setSaving] = useState(false);
   const [batchMode, setBatchMode] = useState(false);

   // Função para iniciar edição
   const startEditing = (weightClass: string, movement: string, record: Record | null) => {
     if (!isAdmin) return;
     
     const key = `${weightClass}-${movement}`;
     setEditingRecords(prev => new Set(prev).add(key));
     
     // Inicializar valores se não existirem
     if (!batchEditValues.has(key)) {
       setBatchEditValues(prev => new Map(prev).set(key, {
         athleteName: record?.athleteName || '',
         weight: record?.weight || 0,
         team: record?.team || '',
         competition: record?.competition || '',
         date: record?.date.toLocaleDateString('pt-BR') || ''
       }));
     }
   };

   // Função para editar record existente
   const editExistingRecord = (record: Record) => {
     if (!isAdmin) return;
     
     const key = `${record.weightClass}-${record.movement}`;
     setEditingRecords(prev => new Set(prev).add(key));
     
     // Inicializar valores com os dados existentes
     setBatchEditValues(prev => new Map(prev).set(key, {
       athleteName: record.athleteName || '',
       weight: record.weight || 0,
       team: record.team || '',
       competition: record.competition || '',
       date: record.date.toLocaleDateString('pt-BR')
     }));
   };

   // Função para salvar record individual
   const saveRecord = async (weightClass: string, movement: string) => {
     if (!isAdmin) return;
     
     const key = `${weightClass}-${movement}`;
     const editValues = batchEditValues.get(key);
     
     if (!editValues) return;
     
     try {
       setSaving(true);
       
       // Validar dados
       if (!editValues.athleteName.trim() || editValues.weight <= 0) {
         alert('Por favor, preencha o nome do atleta e a marca (peso)');
         return;
       }

       // Converter data
       const dateParts = editValues.date.split('/');
       if (dateParts.length !== 3) {
         alert('Data deve estar no formato dd/mm/aaaa');
         return;
       }
       
       const recordDate = new Date(
         parseInt(dateParts[2]), 
         parseInt(dateParts[1]) - 1, 
         parseInt(dateParts[0])
       );

       // Verificar se é um record existente ou novo
       const existingRecord = records.find(r => 
         r.weightClass === weightClass && 
         r.movement === movement &&
         r.division === (selectedDivision === 'ALL' ? 'OPEN' : selectedDivision) &&
         r.sex === (selectedSex === 'ALL' ? 'M' : selectedSex) &&
         r.equipment === (selectedEquipment === 'ALL' ? 'CLASSICA' : selectedEquipment)
       );

       if (existingRecord) {
         // Atualizar record existente
         const updatedRecord = {
           ...existingRecord,
           weight: editValues.weight,
           athleteName: editValues.athleteName.trim(),
           team: editValues.team.trim(),
           competition: editValues.competition.trim(),
           date: recordDate,
           updatedAt: new Date()
         };

         console.log('🔄 Atualizando record existente:', updatedRecord);
         if (!existingRecord.id) {
           throw new Error('ID do record não encontrado');
         }
         await recordsService.update(existingRecord.id, updatedRecord);
         alert('✅ Record atualizado com sucesso!');
       } else {
         // Criar novo record
         const newRecord = {
           movement: movement as 'squat' | 'bench' | 'deadlift' | 'total',
           division: (selectedDivision === 'ALL' ? 'OPEN' : selectedDivision) as 'OPEN' | 'SUBJR' | 'JR' | 'MASTER1' | 'MASTER2' | 'MASTER3' | 'MASTER4',
           sex: (selectedSex === 'ALL' ? 'M' : selectedSex) as 'M' | 'F',
           equipment: (selectedEquipment === 'ALL' ? 'CLASSICA' : selectedEquipment) as 'CLASSICA' | 'EQUIPADO',
           weightClass,
           weight: editValues.weight,
           athleteName: editValues.athleteName.trim(),
           team: editValues.team.trim(),
           competition: editValues.competition.trim(),
           date: recordDate,
           createdAt: new Date(),
           updatedAt: new Date()
         };

         console.log('💾 Criando novo record:', newRecord);
         await recordsService.create(newRecord);
         alert('✅ Novo record criado com sucesso!');
       }
       
       // Remover da edição
       setEditingRecords(prev => {
         const newSet = new Set(prev);
         newSet.delete(key);
         return newSet;
       });
       
       // Recarregar records
       loadRecords();
       
     } catch (error) {
       console.error('❌ Erro ao salvar record:', error);
       alert(`Erro ao salvar record: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
     } finally {
       setSaving(false);
     }
   };

   // Função para cancelar edição
   const cancelEditing = () => {
     setEditingRecords(new Set());
     setBatchEditValues(new Map());
   };

   // Função para salvar todos os records em lote
   const saveAllRecords = async () => {
     if (!isAdmin || editingRecords.size === 0) return;
     
     try {
       setSaving(true);
       
       const recordsToSave: any[] = [];
       const errors: string[] = [];
       
       // Validar todos os records
       for (const key of Array.from(editingRecords)) {
         const [weightClass, movement] = key.split('-');
         const editValues = batchEditValues.get(key);
         
         if (!editValues) continue;
         
         // Validar dados
         if (!editValues.athleteName.trim() || editValues.weight <= 0) {
           errors.push(`${weightClass}: Nome do atleta e marca são obrigatórios`);
           continue;
         }

         // Converter data
         const dateParts = editValues.date.split('/');
         if (dateParts.length !== 3) {
           errors.push(`${weightClass}: Data deve estar no formato dd/mm/aaaa`);
           continue;
         }
         
         const recordDate = new Date(
           parseInt(dateParts[2]), 
           parseInt(dateParts[1]) - 1, 
           parseInt(dateParts[0])
         );

         // Verificar se é um record existente ou novo
         const existingRecord = records.find(r => 
           r.weightClass === weightClass && 
           r.movement === movement &&
           r.division === (selectedDivision === 'ALL' ? 'OPEN' : selectedDivision) &&
           r.sex === (selectedSex === 'ALL' ? 'M' : selectedSex) &&
           r.equipment === (selectedEquipment === 'ALL' ? 'CLASSICA' : selectedEquipment)
         );

         if (existingRecord) {
           // Atualizar record existente
           const updatedRecord = {
             ...existingRecord,
             weight: editValues.weight,
             athleteName: editValues.athleteName.trim(),
             team: editValues.team.trim(),
             competition: editValues.competition.trim(),
             date: recordDate,
             updatedAt: new Date()
           };
           
           recordsToSave.push({ ...updatedRecord, isUpdate: true, id: existingRecord.id });
         } else {
           // Criar novo record
           const newRecord = {
             movement: movement as 'squat' | 'bench' | 'deadlift' | 'total',
             division: (selectedDivision === 'ALL' ? 'OPEN' : selectedDivision) as 'OPEN' | 'SUBJR' | 'JR' | 'MASTER1' | 'MASTER2' | 'MASTER3' | 'MASTER4',
             sex: (selectedSex === 'ALL' ? 'M' : selectedSex) as 'M' | 'F',
             equipment: (selectedEquipment === 'ALL' ? 'CLASSICA' : selectedEquipment) as 'CLASSICA' | 'EQUIPADO',
             weightClass,
             weight: editValues.weight,
             athleteName: editValues.athleteName.trim(),
             team: editValues.team.trim(),
             competition: editValues.competition.trim(),
             date: recordDate,
             createdAt: new Date(),
             updatedAt: new Date()
           };
           
           recordsToSave.push({ ...newRecord, isUpdate: false });
         }
       }
       
       if (recordsToSave.length === 0) {
         alert('Nenhum record válido para salvar');
         return;
       }
       
                // Salvar todos os records
         let createdCount = 0;
         let updatedCount = 0;
         
                    for (const record of recordsToSave) {
             if (record.isUpdate) {
               // Atualizar record existente
               const { isUpdate, id, ...recordData } = record;
               if (!id) {
                 throw new Error('ID do record não encontrado para atualização');
               }
               await recordsService.update(id, recordData);
               updatedCount++;
             } else {
               // Criar novo record
               const { isUpdate, ...recordData } = record;
               await recordsService.create(recordData);
               createdCount++;
             }
           }
         
         const message = [];
         if (createdCount > 0) message.push(`${createdCount} novo(s)`);
         if (updatedCount > 0) message.push(`${updatedCount} atualizado(s)`);
         
         alert(`✅ ${message.join(' e ')} record(s) processado(s) com sucesso!`);
       
       // Limpar edição
       setEditingRecords(new Set());
       setBatchEditValues(new Map());
       
       // Recarregar records
       loadRecords();
       
     } catch (error) {
       console.error('❌ Erro ao salvar records em lote:', error);
       alert(`Erro ao salvar records: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
     } finally {
       setSaving(false);
     }
   };

   // Função para atualizar valor de uma célula
   const updateCellValue = (key: string, field: string, value: string | number) => {
     const currentValues = batchEditValues.get(key) || {
       athleteName: '',
       weight: 0,
       team: '',
       competition: '',
       date: ''
     };
     
     setBatchEditValues(prev => new Map(prev).set(key, {
       ...currentValues,
       [field]: value
     }));
   };

   // Função para ativar modo de edição em lote
   const activateBatchMode = () => {
     setBatchMode(true);
   };

   // Função para desativar modo de edição em lote
   const deactivateBatchMode = () => {
     setBatchMode(false);
     setEditingRecords(new Set());
     setBatchEditValues(new Map());
   };

   // Renderizar tabela específica para Supino (aba separada)
   const renderSupinoTable = () => {
     const filteredRecords = getFilteredRecords().filter(r => r.movement === 'bench_solo');
     
     // Verificar se há filtros ativos (não "ALL")
     const hasActiveFilters = selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL';
     
     // Se não há filtros ativos (todos em "ALL"), não mostrar nada
     if (!hasActiveFilters) {
       return null; // Página em branco
     }
     
     // Se não há records mesmo com filtros ativos, mostrar tabela vazia para admin
     if (filteredRecords.length === 0 && hasActiveFilters) {
       if (isAdmin) {
         // Para administradores: mostrar tabela vazia para preencher
         // Continuar com a lógica normal da tabela
       } else {
         // Para usuários normais: mostrar mensagem
         return (
           <Alert variant="warning">
             <FaInfoCircle className="me-2" />
             Nenhum record encontrado para os filtros selecionados. 
             Configure os filtros para criar novos records.
           </Alert>
         );
       }
     }

     // Organizar por categoria de peso
     const allWeightClasses = selectedSex === 'F' 
       ? ['Até 43,0 kg', '47,0 kg', '52,0 kg', '57,0 kg', '63,0 kg', '69,0 kg', '76,0 kg', '84,0 kg', '+84,0 kg']
       : ['Até 53,0 kg', '59,0 kg', '66,0 kg', '74,0 kg', '83,0 kg', '93,0 kg', '105,0 kg', '120,0 kg', '+120,0 kg'];
     
     const organizedByWeight: { [key: string]: Record | null } = {};
     
     // Para administradores: sempre mostrar todas as categorias (vazias e preenchidas)
     // Para usuários normais: mostrar apenas categorias com records
     if (isAdmin) {
       // Administradores veem todas as categorias
       allWeightClasses.forEach(weightClass => {
         const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
         if (recordsInClass.length > 0) {
           // Pegar o record com maior peso
           const bestRecord = recordsInClass.reduce((best, current) => 
             current.weight > best.weight ? current : best
           );
           organizedByWeight[weightClass] = bestRecord;
         } else {
           // Categoria vazia para administradores preencherem
           organizedByWeight[weightClass] = null;
         }
       });
     } else {
       // Usuários normais veem apenas categorias com records
       allWeightClasses.forEach(weightClass => {
         const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
         if (recordsInClass.length > 0) {
           // Pegar o record com maior peso
           const bestRecord = recordsInClass.reduce((best, current) => 
             current.weight > best.weight ? current : best
           );
           organizedByWeight[weightClass] = bestRecord;
         }
       });
     }
     
     // Criar lista de categorias baseada no tipo de usuário
     const weightClasses = isAdmin ? allWeightClasses : Object.keys(organizedByWeight);

     return (
       <div className="table-responsive">
         <Table className="table-sm table-bordered">
           <thead>
             <tr>
               <th colSpan={isAdmin ? 7 : 6} style={tableStyles.cabec1}>
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
               {isAdmin && <th style={{...tableStyles.cabec2, width: '4%'}} className="text-center">Ações</th>}
             </tr>
           </thead>
           <tbody>
             {weightClasses.map(weightClass => {
               const record = organizedByWeight[weightClass];
               const key = `${weightClass}-bench_solo`;
               const isEditing = editingRecords.has(key);
               const isEmptyRow = hasActiveFilters && !record && weightClasses.length > 0;
               const editValues = batchEditValues.get(key) || {
                 athleteName: '',
                 weight: 0,
                 team: '',
                 competition: '',
                 date: ''
               };
               
               return (
                 <tr 
                   key={weightClass} 
                   style={{
                     whiteSpace: 'nowrap',
                     backgroundColor: isEditing ? '#fff3cd' : isEmptyRow ? '#f8f9fa' : 'white',
                     cursor: isAdmin && isEmptyRow ? 'pointer' : 'default'
                   }}
                   onClick={() => isAdmin && isEmptyRow && startEditing(weightClass, 'bench_solo', record)}
                   title={isAdmin && isEmptyRow ? 'Clique para editar este record' : ''}
                 >
                   <td>{weightClass}</td>
                   
                   {/* Nome do Atleta */}
                   <td>
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.athleteName}
                         onChange={(e) => updateCellValue(key, 'athleteName', e.target.value)}
                         placeholder="Nome do atleta"
                         autoFocus
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.athleteName : (isEmptyRow ? 'Clique para editar' : '')
                     )}
                   </td>
                   
                   {/* Marca */}
                   <td className="text-center">
                     {isEditing ? (
                       <Form.Control
                         type="number"
                         size="sm"
                         value={editValues.weight || ''}
                         onChange={(e) => updateCellValue(key, 'weight', parseFloat(e.target.value) || 0)}
                         placeholder="0"
                         min="0"
                         step="0.5"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.weight : (isEmptyRow ? '' : '')
                     )}
                   </td>
                   
                   {/* Equipe */}
                   <td>
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.team}
                         onChange={(e) => updateCellValue(key, 'team', e.target.value)}
                         placeholder="Nome da equipe"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.team : (isEmptyRow ? '' : '')
                     )}
                   </td>
                   
                   {/* Local da Competição */}
                   <td>
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.competition}
                         onChange={(e) => updateCellValue(key, 'competition', e.target.value)}
                         placeholder="Local da competição"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.competition : (isEmptyRow ? '' : '')
                     )}
                   </td>
                   
                   {/* Data */}
                   <td className="text-center">
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.date}
                         onChange={(e) => updateCellValue(key, 'date', e.target.value)}
                         placeholder="dd/mm/aaaa"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.date.toLocaleDateString('pt-BR') : (isEmptyRow ? '01-01-2011' : '')
                     )}
                   </td>
                   
                   {/* Ações */}
                   {isAdmin && (
                     <td style={{width: '120px'}}>
                       {isEditing ? (
                         <div className="d-flex gap-1">
                           <Button 
                             variant="success" 
                             size="sm" 
                             onClick={() => saveRecord(weightClass, 'bench_solo')}
                             title="Salvar"
                           >
                             💾
                           </Button>
                           <Button 
                             variant="danger" 
                             size="sm" 
                             onClick={() => cancelEditing()}
                             title="Cancelar"
                           >
                             ❌
                           </Button>
                         </div>
                       ) : record ? (
                         <Button 
                           variant="outline-primary" 
                           size="sm" 
                           onClick={() => editExistingRecord(record)}
                           title="Editar record"
                         >
                           ✏️
                         </Button>
                       ) : (
                         <></>
                       )}
                     </td>
                   )}
                 </tr>
               );
             })}
           </tbody>
         </Table>
         
         {/* Instruções para admin */}
         {isAdmin && hasActiveFilters && (
           <Alert variant="info" className="mt-3">
             <FaInfoCircle className="me-2" />
             <strong>💡 Dica:</strong> 
             <ul className="mb-0 mt-2">
               <li>Clique em qualquer linha vazia (com data "01-01-2011") para criar novo record</li>
               <li>Clique no botão ✏️ para editar records existentes</li>
               <li>Use Tab/Enter para navegar entre células</li>
               <li>Pode editar múltiplas linhas simultaneamente</li>
               <li>Use "Salvar Todas as Alterações" para salvar tudo de uma vez</li>
               <li>Os dados permanecem ao navegar entre células</li>
             </ul>
           </Alert>
         )}
       </div>
     );
   };

   // Renderizar tabela de records para uma categoria específica
   const renderRecordsTable = (movement: string) => {
     const filteredRecords = getFilteredRecords().filter(r => r.movement === movement);
     
     // Verificar se há filtros ativos (não "ALL")
     const hasActiveFilters = selectedDivision !== 'ALL' || selectedSex !== 'ALL' || selectedEquipment !== 'ALL';
     
     // Se não há filtros ativos (todos em "ALL"), não mostrar nada
     if (!hasActiveFilters) {
       return null; // Página em branco
     }
     
     // Se não há records mesmo com filtros ativos, mostrar tabela vazia para admin
     if (filteredRecords.length === 0 && hasActiveFilters) {
       if (isAdmin) {
         // Para administradores: mostrar tabela vazia para preencher
         // Continuar com a lógica normal da tabela
       } else {
         // Para usuários normais: mostrar mensagem
         return (
           <Alert variant="warning">
             <FaInfoCircle className="me-2" />
             Nenhum record encontrado para os filtros selecionados. 
             Configure os filtros para criar novos records.
           </Alert>
         );
       }
     }

           // Organizar por categoria de peso
      const allWeightClasses = selectedSex === 'F' 
        ? ['Até 43,0 kg', '47,0 kg', '52,0 kg', '57,0 kg', '63,0 kg', '69,0 kg', '76,0 kg', '84,0 kg', '+84,0 kg']
        : ['Até 53,0 kg', '59,0 kg', '66,0 kg', '74,0 kg', '83,0 kg', '93,0 kg', '105,0 kg', '120,0 kg', '+120,0 kg'];
      
      const organizedByWeight: { [key: string]: Record | null } = {};
      
      // Para administradores: sempre mostrar todas as categorias (vazias e preenchidas)
      // Para usuários normais: mostrar apenas categorias com records
      if (isAdmin) {
        // Administradores veem todas as categorias
        allWeightClasses.forEach(weightClass => {
          const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
          if (recordsInClass.length > 0) {
            // Pegar o record com maior peso
            const bestRecord = recordsInClass.reduce((best, current) => 
              current.weight > best.weight ? current : best
            );
            organizedByWeight[weightClass] = bestRecord;
          } else {
            // Categoria vazia para administradores preencherem
            organizedByWeight[weightClass] = null;
          }
        });
      } else {
        // Usuários normais veem apenas categorias com records
        allWeightClasses.forEach(weightClass => {
          const recordsInClass = filteredRecords.filter(r => r.weightClass === weightClass);
          if (recordsInClass.length > 0) {
            // Pegar o record com maior peso
            const bestRecord = recordsInClass.reduce((best, current) => 
              current.weight > best.weight ? current : best
            );
            organizedByWeight[weightClass] = bestRecord;
          }
        });
      }
      
      // Criar lista de categorias baseada no tipo de usuário
      const weightClasses = isAdmin ? allWeightClasses : Object.keys(organizedByWeight);

     return (
       <div className="table-responsive">
         <Table className="table-sm table-bordered">
           <thead>
             <tr>
               <th colSpan={isAdmin ? 7 : 6} style={tableStyles.cabec1}>
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
               {isAdmin && <th style={{...tableStyles.cabec2, width: '4%'}} className="text-center">Ações</th>}
             </tr>
           </thead>
           <tbody>
                          {weightClasses.map(weightClass => {
               const record = organizedByWeight[weightClass];
               const key = `${weightClass}-${movement}`;
               const isEditing = editingRecords.has(key);
               const isEmptyRow = hasActiveFilters && !record && weightClasses.length > 0;
               const editValues = batchEditValues.get(key) || {
                 athleteName: '',
                 weight: 0,
                 team: '',
                 competition: '',
                 date: ''
               };
               
               return (
                 <tr 
                   key={weightClass} 
                   style={{
                     whiteSpace: 'nowrap',
                     backgroundColor: isEditing ? '#fff3cd' : isEmptyRow ? '#f8f9fa' : 'white',
                     cursor: isAdmin && isEmptyRow ? 'pointer' : 'default'
                   }}
                   onClick={() => isAdmin && isEmptyRow && startEditing(weightClass, movement, record)}
                   title={isAdmin && isEmptyRow ? 'Clique para editar este record' : ''}
                 >
                   <td>{weightClass}</td>
                   
                   {/* Nome do Atleta */}
                   <td>
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.athleteName}
                         onChange={(e) => updateCellValue(key, 'athleteName', e.target.value)}
                         placeholder="Nome do atleta"
                         autoFocus
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             // Focar na próxima célula
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.athleteName : (isEmptyRow ? 'Clique para editar' : '')
                     )}
                   </td>
                   
                   {/* Marca */}
                   <td className="text-center">
                     {isEditing ? (
                       <Form.Control
                         type="number"
                         size="sm"
                         value={editValues.weight || ''}
                         onChange={(e) => updateCellValue(key, 'weight', parseFloat(e.target.value) || 0)}
                         placeholder="0"
                         min="0"
                         step="0.5"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             // Focar na próxima célula
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.weight : (isEmptyRow ? '' : '')
                     )}
                   </td>
                   
                   {/* Equipe */}
                   <td>
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.team}
                         onChange={(e) => updateCellValue(key, 'team', e.target.value)}
                         placeholder="Nome da equipe"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             // Focar na próxima célula
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.team : (isEmptyRow ? '' : '')
                     )}
                   </td>
                   
                   {/* Local da Competição */}
                   <td>
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.competition}
                         onChange={(e) => updateCellValue(key, 'competition', e.target.value)}
                         placeholder="Local da competição"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             // Focar na próxima célula
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.competition : (isEmptyRow ? '' : '')
                     )}
                   </td>
                   
                   {/* Data */}
                   <td className="text-center">
                     {isEditing ? (
                       <Form.Control
                         type="text"
                         size="sm"
                         value={editValues.date}
                         onChange={(e) => updateCellValue(key, 'date', e.target.value)}
                         placeholder="dd/mm/aaaa"
                         onKeyDown={(e) => {
                           if (e.key === 'Tab' || e.key === 'Enter') {
                             e.preventDefault();
                             // Focar na próxima célula
                             const nextInput = e.currentTarget.parentElement?.nextElementSibling?.querySelector('input');
                             if (nextInput) nextInput.focus();
                           }
                         }}
                       />
                     ) : (
                       record ? record.date.toLocaleDateString('pt-BR') : (isEmptyRow ? '01-01-2011' : '')
                     )}
                   </td>
                   
                   {/* Botões de ação para linha em edição */}
                   {isEditing ? (
                     <td style={{ width: '120px' }}>
                       <div className="d-flex gap-1">
                         <Button
                           variant="success"
                           size="sm"
                           onClick={() => saveRecord(weightClass, movement)}
                           disabled={saving}
                         >
                           {saving ? (
                             <Spinner animation="border" size="sm" />
                           ) : (
                             '💾'
                           )}
                         </Button>
                         <Button
                           variant="secondary"
                           size="sm"
                           onClick={cancelEditing}
                         >
                           ❌
                         </Button>
                       </div>
                     </td>
                   ) : record && isAdmin ? (
                     <td style={{ width: '120px' }}>
                       <div className="d-flex gap-1">
                         <Button
                           variant="primary"
                           size="sm"
                           onClick={() => editExistingRecord(record)}
                           title="Editar record existente"
                         >
                           ✏️
                         </Button>
                       </div>
                     </td>
                   ) : isAdmin ? (
                     <td style={{ width: '120px' }}></td>
                   ) : null}
                 </tr>
               );
             })}
           </tbody>
         </Table>
         
                   {/* Instruções para admin */}
          {isAdmin && hasActiveFilters && (
            <Alert variant="info" className="mt-3">
              <FaInfoCircle className="me-2" />
              <strong>💡 Dica:</strong> 
                             <ul className="mb-0 mt-2">
                 <li>Clique em qualquer linha vazia (com data "01-01-2011") para criar novo record</li>
                 <li>Clique no botão ✏️ para editar records existentes</li>
                 <li>Use Tab/Enter para navegar entre células</li>
                 <li>Pode editar múltiplas linhas simultaneamente</li>
                 <li>Use "Salvar Todas as Alterações" para salvar tudo de uma vez</li>
                 <li>Os dados permanecem ao navegar entre células</li>
               </ul>
            </Alert>
          )}
       </div>
     );
   };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando records...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <h4>❌ Erro</h4>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={loadRecords}>
          Tentar Novamente
        </Button>
      </Alert>
    );
  }

     return (
     <div className="records-display">
       {/* Título da página */}
       <div className="text-center mb-4">
         <h2 className="text-primary">
           🏆 Sistema de Records de Powerlifting
         </h2>
         <p className="text-muted">
           Gerencie e visualize records organizados por movimento, categoria de idade, modalidade e sexo
         </p>
       </div>
             {/* Filtros */}
       <Card className="mb-4">
         <Card.Header className="bg-primary text-white">
           <h6 className="mb-0">
             <FaFilter className="me-2" />
             Filtros de Records - Selecione as Categorias
           </h6>
         </Card.Header>
         <Card.Body>
           <Row>
             <Col md={3}>
               <Form.Group>
                 <Form.Label>Divisão:</Form.Label>
                 <Form.Select 
                   value={selectedDivision} 
                   onChange={(e) => setSelectedDivision(e.target.value)}
                 >
                                       {divisions.map(div => (
                      <option key={div} value={div}>
                        {div === 'ALL' ? 'Todas as Categorias' : 
                         div === 'SUBJR' ? '👶 Sub Júnior' :
                         div === 'JR' ? '🧑‍🎓 Júnior' :
                         div === 'OPEN' ? '👨‍💼 Open' :
                         div === 'MASTER1' ? '👴 Master 1' :
                         div === 'MASTER2' ? '👴 Master 2' :
                         div === 'MASTER3' ? '👴 Master 3' : '👴 Master 4'}
                      </option>
                    ))}
                 </Form.Select>
               </Form.Group>
             </Col>
             <Col md={3}>
               <Form.Group>
                 <Form.Label>Gênero:</Form.Label>
                 <Form.Select 
                   value={selectedSex} 
                   onChange={(e) => setSelectedSex(e.target.value)}
                 >
                                       {sexes.map(sex => (
                      <option key={sex} value={sex}>
                        {sex === 'ALL' ? 'Ambos os Sexos' : 
                         sex === 'M' ? '👨 Masculino' : '👩 Feminino'}
                      </option>
                    ))}
                 </Form.Select>
               </Form.Group>
             </Col>
             <Col md={3}>
               <Form.Group>
                 <Form.Label>Modalidade:</Form.Label>
                 <Form.Select 
                   value={selectedEquipment} 
                   onChange={(e) => setSelectedEquipment(e.target.value)}
                 >
                                       {equipments.map(equip => (
                      <option key={equip} value={equip}>
                        {equip === 'ALL' ? 'Todas as Modalidades' : 
                         equip === 'CLASSICA' ? '🏃 Clássica' : '🦾 Equipado'}
                      </option>
                    ))}
                 </Form.Select>
               </Form.Group>
             </Col>
                           <Col md={3} className="d-flex align-items-end">
                                 <Button variant="outline-primary" onClick={loadRecords}>
                   <FaFilter className="me-2" />
                   Aplicar Filtros
                 </Button>
              </Col>
           </Row>
           
                                    {/* Informações sobre permissões */}
             {!isAdmin && (
               <Alert variant="info" className="mt-3">
                 <FaInfoCircle className="me-2" />
                 <strong>ℹ️ Informação:</strong> Configure os filtros para visualizar records. 
                 Quando todos os filtros estão em "ALL", a página fica em branco.
                 Você vê apenas as categorias que possuem records.
                 Para importar novos records, entre em contato com um administrador.
               </Alert>
             )}
            
            
             
                           {/* Instruções para edição inline */}
              {isAdmin && (
                <Alert variant="success" className="mt-3">
                  <FaInfoCircle className="me-2" />
                  <strong>🎯 Sistema de Records - Administrador!</strong> 
                                 <ul className="mb-0 mt-2">
                  <li><strong>Configure os filtros</strong> (Divisão, Sexo, Modalidade) para visualizar records</li>
                  <li>Quando todos os filtros estão em "ALL", a página fica em branco</li>
                  <li><strong>Como Admin:</strong> Você vê TODAS as categorias de peso (vazias e preenchidas)</li>
                  <li>Mesmo sem records, a tabela aparece com todas as categorias para você preencher</li>
                  <li>Clique em qualquer linha vazia (com data "01-01-2011") para criar novo record</li>
                  <li>Clique no botão ✏️ para editar records existentes</li>
                  <li>Preencha os campos diretamente na tabela</li>
                  <li>Use 💾 para salvar individualmente ou "Salvar Todas as Alterações" para salvar tudo</li>
                  <li>Use Tab/Enter para navegar entre células</li>
                  <li>Os records são salvos/atualizados automaticamente no Firebase</li>
                </ul>
                </Alert>
              )}
             
             {/* Controles de edição em lote */}
             {isAdmin && editingRecords.size > 0 && (
               <Alert variant="warning" className="mt-3">
                 <div className="d-flex justify-content-between align-items-center">
                   <div>
                     <strong>📝 Modo de Edição em Lote Ativo:</strong> 
                     {editingRecords.size} linha(s) sendo editada(s)
                   </div>
                   <div className="d-flex gap-2">
                     <Button
                       variant="success"
                       size="sm"
                       onClick={saveAllRecords}
                       disabled={saving}
                     >
                       {saving ? (
                         <>
                           <Spinner animation="border" size="sm" className="me-2" />
                           Salvando...
                         </>
                       ) : (
                         <>
                           💾 Salvar Todas as Alterações
                         </>
                       )}
                     </Button>
                     <Button
                       variant="secondary"
                       size="sm"
                       onClick={cancelEditing}
                     >
                       ❌ Cancelar Tudo
                     </Button>
                   </div>
                 </div>
               </Alert>
             )}
         </Card.Body>
       </Card>

             {/* Abas de navegação */}
       <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)} className="mb-4">
         <Tab eventKey="all" title="🏆 Todos os Movimentos">
          <div className="mb-3">
            <ButtonGroup>
              <Button 
                variant="outline-primary" 
                onClick={() => handleExportPDF('squat')}
              >
                <FaFilePdf className="me-2" />
                Exportar Agachamento
              </Button>
              <Button 
                variant="outline-success" 
                onClick={() => handleExportPDF('bench')}
              >
                <FaFilePdf className="me-2" />
                Exportar Supino
              </Button>
              <Button 
                variant="outline-warning" 
                onClick={() => handleExportPDF('deadlift')}
              >
                <FaFilePdf className="me-2" />
                Exportar Terra
              </Button>
              <Button 
                variant="outline-info" 
                onClick={() => handleExportPDF('total')}
              >
                <FaFilePdf className="me-2" />
                Exportar Total
              </Button>
            </ButtonGroup>
          </div>

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

export default RecordsDisplay;
