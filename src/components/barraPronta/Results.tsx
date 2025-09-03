import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  Badge, 
  Alert,
  ButtonGroup,
  Nav,
  Navbar,
  NavDropdown
} from 'react-bootstrap';
import { 
  FaTrophy, 
  FaMedal, 
  FaDownload, 
  FaSortUp,
  FaSortDown,
  FaFileCsv, 
  FaFilePdf,
  FaTable,
  FaUsers,
  FaCloudUploadAlt
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RootState } from '../../store/barraProntaStore';
import { Entry } from '../../types/barraProntaTypes';
import { resultadoImportadoService } from '../../services/resultadoImportadoService';
import { 
  calculateIPFGLPointsTotal, 
  calculateIPFGLPointsBench, 
  calculateIPFGLPointsSquat, 
  calculateIPFGLPointsDeadlift,
  calculateIPFGLPointsByCompetitionType,
  calculateBestLifterResults,
  getAgeDivisionDisplayName,
  getEquipmentDisplayNameForBestLifter,
  getEventTypeDisplayName,
  type BestLifterCategory,
  type BestLifterResult
} from '../../logic/ipfGLPoints';
import './Results.css';

interface CalculatedResult {
  entry: Entry;
  squat: number;
  bench: number;
  deadlift: number;
  total: number;
  points: number;
  validAttempts: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  bestAttempts: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  // Adicionado para a nova tabela
  squatAttempts: (number | null)[];
  benchAttempts: (number | null)[];
  deadliftAttempts: (number | null)[];
  squatStatus: number[];
  benchStatus: number[];
  deadliftStatus: number[];
  positions: {
    squat: number;
    bench: number;
    deadlift: number;
    total: number;
  };
}

interface ResultsByCategory {
  category: string;
  results: CalculatedResult[];
}

// Função para obter nome de exibição do equipamento (definida fora do componente)
const getEquipmentDisplayName = (equipment: string): string => {
  switch (equipment) {
    case 'Raw':
    case 'CLASSICA':
    case 'Classico':
      return 'Clássica';
    case 'Equipped':
    case 'EQUIPADO':
    case 'Equipado':
      return 'Equipado';
    default:
      return equipment || 'Clássica';
  }
};

// Função para obter categoria de idade (definida fora do componente)
const getAgeCategory = (birthDate: string, sex: string): string => {
  if (!birthDate) return 'OP';
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (sex === 'M') {
    if (age < 18) return 'SJ';
    if (age < 23) return 'JR';
    if (age < 40) return 'OP';
    if (age < 50) return 'M1';
    if (age < 60) return 'M2';
    if (age < 70) return 'M3';
    if (age < 80) return 'M4';
    return 'M4';
  } else { // Feminino
    if (age < 18) return 'SJ';
    if (age < 23) return 'JR';
    if (age < 40) return 'OP';
    if (age < 50) return 'M1';
    if (age < 60) return 'M2';
    if (age < 70) return 'M3';
    if (age < 80) return 'M4';
    return 'M4';
  }
};

const Results: React.FC = () => {
  const { meet, registration } = useSelector((state: RootState) => state);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = todos os dias
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSex, setSelectedSex] = useState<'M' | 'F' | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedCompetitionType, setSelectedCompetitionType] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'total' | 'points' | 'squat' | 'bench' | 'deadlift'>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'complete' | 'simplified' | 'teams' | 'teamMedals'>('complete');

  // Função para obter tipos de competição únicos
  const getUniqueCompetitionTypes = () => {
    const typesSet = new Set<string>();
    
    registration.entries.forEach(entry => {
      if (entry.movements) {
        // Se não há vírgula, é uma modalidade única
        if (!entry.movements.includes(',')) {
          typesSet.add(entry.movements.trim());
        } else {
          // Se há vírgula, separar em modalidades individuais
          const movements = entry.movements.split(', ').filter(m => m.trim() !== '');
          movements.forEach(movement => {
            typesSet.add(movement.trim());
          });
        }
      }
    });
    
    return Array.from(typesSet).sort();
  };

  // Função para obter equipes únicas
  const getUniqueTeams = () => {
    const teamsSet = new Set<string>();
    
    registration.entries.forEach(entry => {
      if (entry.team && entry.team.trim() !== '') {
        teamsSet.add(entry.team.trim());
      }
    });
    
    return Array.from(teamsSet).sort();
  };

  // Função para verificar se um atleta compete no tipo de competição selecionado
  const athleteCompetesInType = (entry: Entry, competitionType: string) => {
    if (competitionType === 'all') return true;
    
    if (!entry.movements) return false;
    
    // Se não há vírgula, é uma modalidade única
    if (!entry.movements.includes(',')) {
      return entry.movements.trim() === competitionType;
    } else {
      // Se há vírgula, separar em modalidades individuais
      const movements = entry.movements.split(', ').filter(m => m.trim() !== '');
      return movements.includes(competitionType);
    }
  };

  // Função para verificar se deve aplicar overflow automático
  const shouldAutoOverflow = () => {
    // Verificar se há apenas 1 dia configurado
    const singleDay = meet.lengthDays === 1;
    
    // Verificar se há apenas 1 plataforma em todos os dias
    const singlePlatform = meet.platformsOnDays && meet.platformsOnDays.length > 0 && 
                          meet.platformsOnDays.every(platforms => platforms === 1);
    
    return { singleDay, singlePlatform };
  };

  // Calcular resultados para cada atleta
  const calculatedResults = useMemo((): CalculatedResult[] => {
    const results: CalculatedResult[] = [];
    
    registration.entries
      .filter(entry => {
        // Filtrar por dia se selecionado
        if (selectedDay > 0 && entry.day !== selectedDay) return false;
        // Filtrar por divisão se selecionado
        if (selectedDivision !== 'all' && entry.division !== selectedDivision) return false;
        // Filtrar por sexo se selecionado
        if (selectedSex !== 'all' && entry.sex !== selectedSex) return false;
        // Filtrar por equipamento/modalidade se selecionado
        if (selectedEquipment !== 'all' && entry.equipment !== selectedEquipment) return false;
        // Filtrar por tipo de competição se selecionado
        if (selectedCompetitionType !== 'all' && !athleteCompetesInType(entry, selectedCompetitionType)) return false;
        // Filtrar por equipe se selecionado
        if (selectedTeam !== 'all' && entry.team !== selectedTeam) return false;
        return true;
      })
      .forEach(entry => {
        // Calcular melhores tentativas para cada movimento
        const squatAttempts = [entry.squat1, entry.squat2, entry.squat3];
        const benchAttempts = [entry.bench1, entry.bench2, entry.bench3];
        const deadliftAttempts = [entry.deadlift1, entry.deadlift2, entry.deadlift3];

        // Obter status das tentativas
        const squatStatus = entry.squatStatus || [0, 0, 0];
        const benchStatus = entry.benchStatus || [0, 0, 0];
        const deadliftStatus = entry.deadliftStatus || [0, 0, 0];

        // Calcular melhores tentativas válidas
        const getBestValidAttempt = (attempts: (number | null)[], status: number[]): number => {
          let best = 0;
          attempts.forEach((attempt, index) => {
            if (attempt && status[index] === 1) { // 1 = Good Lift
              best = Math.max(best, Math.abs(attempt));
            }
          });
          return best;
        };

        const bestSquat = getBestValidAttempt(squatAttempts, squatStatus);
        const bestBench = getBestValidAttempt(benchAttempts, benchStatus);
        const bestDeadlift = getBestValidAttempt(deadliftAttempts, deadliftStatus);

        // Contar tentativas válidas
        const validSquat = squatStatus.filter(s => s === 1).length;
        const validBench = benchStatus.filter(s => s === 1).length;
        const validDeadlift = deadliftStatus.filter(s => s === 1).length;

        // Função para calcular pontos IPF GL baseado no tipo de competição
        const calculateDynamicIPFGLPoints = (competitionType: string, bestSquat: number, bestBench: number, bestDeadlift: number): number => {
          const bodyweightKg = entry.bodyweightKg || 0;
          const sex = entry.sex;
          const equipment = entry.equipment === 'Raw' || entry.equipment === 'CLASSICA' ? 'Classico' : 'Equipado';
          
          console.log(`🔍 Calculando IPF GL Points para: ${entry.name} - Tipo: ${competitionType} - Movimentos: ${entry.movements}`);
          
          return calculateIPFGLPointsByCompetitionType(
            bestSquat,
            bestBench,
            bestDeadlift,
            bodyweightKg,
            sex,
            equipment,
            competitionType
          );
        };

        // Função para calcular total baseado na modalidade
        const calculateTotalForModalidade = (competitionType: string, bestSquat: number, bestBench: number, bestDeadlift: number): number => {
          switch (competitionType) {
            case 'AST':
              return bestSquat + bestBench + bestDeadlift;
            case 'AS':
              return bestSquat + bestBench;
            case 'ST':
              return bestBench + bestDeadlift;
            case 'AT':
              return bestSquat + bestDeadlift;
            case 'A':
              return bestSquat;
            case 'S':
              return bestBench;
            case 'T':
              return bestDeadlift;
            default:
              return bestSquat + bestBench + bestDeadlift;
          }
        };

        // Função para criar resultado baseado na modalidade
        const createResultForModalidade = (competitionType: string) => {
          const total = calculateTotalForModalidade(competitionType, bestSquat, bestBench, bestDeadlift);
          const points = calculateDynamicIPFGLPoints(competitionType, bestSquat, bestBench, bestDeadlift);
          
          // Criar uma cópia do entry com a modalidade específica
          const entryCopy = {
            ...entry,
            movements: competitionType // Sobrescrever com a modalidade específica
          };

          return {
            entry: entryCopy,
            squat: bestSquat,
            bench: bestBench,
            deadlift: bestDeadlift,
            total,
            points,
            validAttempts: {
              squat: validSquat,
              bench: validBench,
              deadlift: validDeadlift
            },
            bestAttempts: {
              squat: bestSquat,
              bench: bestBench,
              deadlift: bestDeadlift
            },
            squatAttempts: squatAttempts,
            benchAttempts: benchAttempts,
            deadliftAttempts: deadliftAttempts,
            squatStatus: squatStatus,
            benchStatus: benchStatus,
            deadliftStatus: deadliftStatus,
            positions: {
              squat: 0,
              bench: 0,
              deadlift: 0,
              total: 0
            }
          };
        };

        // Processar movimentos do atleta
        const movements = entry.movements || '';
        
        // Se não há vírgula, é uma modalidade única
        if (!movements.includes(',')) {
          const competitionType = movements.trim();
          if (competitionType) {
            const result = createResultForModalidade(competitionType);
            if (result.total > 0) { // Apenas adicionar se tem resultado válido
              results.push(result);
            }
          }
        } else {
          // Se há vírgula, separar em modalidades individuais
          const movementList = movements.split(', ').filter(m => m.trim() !== '');
          movementList.forEach(movement => {
            const competitionType = movement.trim();
            if (competitionType) {
              const result = createResultForModalidade(competitionType);
              if (result.total > 0) { // Apenas adicionar se tem resultado válido
                results.push(result);
              }
            }
          });
        }
      });

    // Retornar resultados ordenados
    return results
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
  }, [registration.entries, selectedDay, selectedDivision, selectedSex, selectedEquipment, selectedCompetitionType, selectedTeam, sortBy, sortOrder]);

  // Função para obter nome da categoria de movimentos
  const getMovementCategoryName = (movements: string) => {
    const movement = movements.trim();
    
    // Modalidades únicas
    switch (movement) {
      case 'AST': return 'Powerlifting (AST)';
      case 'AS': return 'Agachamento + Supino (AS)';
      case 'A': return 'Só Agachamento (A)';
      case 'S': return 'Só Supino (S)';
      case 'T': return 'Só Terra (T)';
      case 'ST': return 'Supino + Terra (ST)';
      case 'AT': return 'Agachamento + Terra (AT)';
      default: return movement;
    }
  };

  // Função para obter nome amigável do tipo de competição
  const getCompetitionTypeDisplayName = (type: string) => {
    switch (type) {
      case 'AST': return 'Powerlifting (AST)';
      case 'AS': return 'Agachamento + Supino (AS)';
      case 'A': return 'Só Agachamento (A)';
      case 'S': return 'Só Supino (S)';
      case 'T': return 'Só Terra (T)';
      case 'ST': return 'Supino + Terra (ST)';
      case 'AT': return 'Agachamento + Terra (AT)';
      default: return type;
    }
  };

  // Função para obter todas as modalidades únicas da competição
  const getUniqueMovementCategories = () => {
    const categoriesSet = new Set<string>();
    
    // Se há um filtro de tipo de competição ativo, usar apenas esse tipo
    if (selectedCompetitionType !== 'all') {
      categoriesSet.add(selectedCompetitionType);
      return Array.from(categoriesSet).sort();
    }
    
    calculatedResults.forEach(result => {
      if (!result.entry.movements) return;
      
      // Se não há vírgula, é uma modalidade única
      if (!result.entry.movements.includes(',')) {
        categoriesSet.add(result.entry.movements.trim());
      } else {
        // Se há vírgula, separar em modalidades individuais
        const movements = result.entry.movements.split(', ').filter(m => m.trim() !== '');
        movements.forEach(movement => {
          categoriesSet.add(movement.trim());
        });
      }
    });
    
    return Array.from(categoriesSet).sort();
  };

  // Função para calcular total baseado na modalidade da categoria
  const calculateTotalForCategory = (result: CalculatedResult, categoryName: string) => {
    if (categoryName.includes('Powerlifting (AST)')) {
      return result.squat + result.bench + result.deadlift;
    } else if (categoryName.includes('Só Agachamento (A)')) {
      return result.squat;
    } else if (categoryName.includes('Só Supino (S)')) {
      return result.bench;
    } else if (categoryName.includes('Só Terra (T)')) {
      return result.deadlift;
    } else if (categoryName.includes('Agachamento + Supino (AS)')) {
      return result.squat + result.bench;
    } else if (categoryName.includes('Supino + Terra (ST)')) {
      return result.bench + result.deadlift;
    } else if (categoryName.includes('Agachamento + Terra (AT)')) {
      return result.squat + result.deadlift;
    } else {
      return result.squat + result.bench + result.deadlift;
    }
  };

  // Agrupar resultados por categoria
  const resultsByCategory = useMemo((): ResultsByCategory[] => {
    const grouped: { [key: string]: CalculatedResult[] } = {};
    const uniqueCategories = getUniqueMovementCategories();

    // Para cada categoria única, criar grupos por divisão, peso e equipamento
    uniqueCategories.forEach(movementCategory => {
      calculatedResults.forEach(result => {
        // Verificar se o atleta compete nesta modalidade específica
        let competesInThisCategory = false;
        
        // Se há um filtro de tipo de competição ativo, usar lógica específica
        if (selectedCompetitionType !== 'all') {
          competesInThisCategory = athleteCompetesInType(result.entry, movementCategory);
        } else {
          // Lógica original para quando não há filtro
          if (!result.entry.movements?.includes(',')) {
            // Modalidade única
            competesInThisCategory = result.entry.movements?.trim() === movementCategory;
          } else {
            // Modalidades separadas
            const movements = result.entry.movements?.split(', ').filter(m => m.trim() !== '') || [];
            competesInThisCategory = movements.includes(movementCategory);
          }
        }
        
        if (!competesInThisCategory) return;
        
        const equipmentName = getEquipmentDisplayName(result.entry.equipment || 'Raw');
        const ageCategory = getAgeCategory(result.entry.birthDate || '', result.entry.sex);
        const categoryName = getMovementCategoryName(movementCategory);
        const category = `${result.entry.division} - ${result.entry.weightClass} - ${equipmentName} - ${categoryName}`;
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(result);
      });
    });

    // Calcular posições dentro de cada categoria
    Object.values(grouped).forEach(categoryResults => {
      // Ordenar por total para calcular posições
      categoryResults.sort((a, b) => b.total - a.total);
      
      // Calcular posições por movimento
      const squatResults = [...categoryResults].sort((a, b) => b.squat - a.squat);
      const benchResults = [...categoryResults].sort((a, b) => b.bench - a.bench);
      const deadliftResults = [...categoryResults].sort((a, b) => b.deadlift - a.deadlift);
      
      categoryResults.forEach(result => {
        result.positions.squat = squatResults.findIndex(r => r.entry.id === result.entry.id) + 1;
        result.positions.bench = benchResults.findIndex(r => r.entry.id === result.entry.id) + 1;
        result.positions.deadlift = deadliftResults.findIndex(r => r.entry.id === result.entry.id) + 1;
        result.positions.total = categoryResults.findIndex(r => r.entry.id === result.entry.id) + 1;
      });
    });

    return Object.entries(grouped).map(([category, results]) => ({
      category,
      results: results.sort((a, b) => b.total - a.total)
    }));
  }, [calculatedResults, selectedCompetitionType]);



  // Função para importar resultados para o Firebase
  const handleImportResults = async () => {
    try {
      // Verificar se há dados para importar
      if (!meet.name || calculatedResults.length === 0) {
        alert('Não há resultados para importar ou a competição não está configurada.');
        return;
      }

      // Confirmar a importação
      if (!window.confirm(`Tem certeza que deseja importar os resultados da competição "${meet.name}" para o Firebase?\n\nEsta ação salvará todos os resultados calculados.`)) {
        return;
      }

      // Preparar dados para importação
      const competitionResults = {
        competitionName: meet.name,
        competitionDate: meet.date || new Date().toISOString().split('T')[0],
        competitionCity: meet.city || 'Cidade não informada',
        competitionCountry: meet.country || 'Brasil',
        importDate: new Date().toISOString(),
        totalAthletes: calculatedResults.length,
        results: {
          complete: resultsByCategory,
          simplified: [
            ...calculatedResults
              .filter(result => result.entry.sex === 'M' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
              .sort((a, b) => b.points - a.points),
            ...calculatedResults
              .filter(result => result.entry.sex === 'M' && result.entry.equipment === 'Equipped')
              .sort((a, b) => b.points - a.points),
            ...calculatedResults
              .filter(result => result.entry.sex === 'F' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
              .sort((a, b) => b.points - a.points),
            ...calculatedResults
              .filter(result => result.entry.sex === 'F' && result.entry.equipment === 'Equipped')
              .sort((a, b) => b.points - a.points)
          ],
          teams: {
            // Rankings de equipes por tipo de competição e modalidade
            astClassic: calculateTeamRanking('Classico', 'AST'),
            astEquipped: calculateTeamRanking('Equipado', 'AST'),
            sClassic: calculateTeamRanking('Classico', 'S'),
            sEquipped: calculateTeamRanking('Equipado', 'S'),
            tClassic: calculateTeamRanking('Classico', 'T'),
            tEquipped: calculateTeamRanking('Equipado', 'T')
          }
        }
      };

      // Enviar para Firebase usando o serviço
      console.log('📊 Enviando dados para Firebase...');
      
      const resultadoId = await resultadoImportadoService.create({
        competitionName: competitionResults.competitionName,
        competitionDate: new Date(competitionResults.competitionDate),
        competitionCity: competitionResults.competitionCity,
        competitionCountry: competitionResults.competitionCountry,
        totalAthletes: competitionResults.totalAthletes,
        status: 'IMPORTADO',
        results: competitionResults.results
      });
      
      console.log('✅ Resultados enviados para Firebase com ID:', resultadoId);
      
      alert(`✅ Resultados da competição "${meet.name}" importados com sucesso para o Firebase!\n\nTotal de atletas: ${calculatedResults.length}\nData de importação: ${new Date().toLocaleString('pt-BR')}\nID do resultado: ${resultadoId}`);
      
    } catch (error) {
      console.error('❌ Erro ao importar resultados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao importar resultados: ${errorMessage}`);
    }
  };

  // Função para exportar resultados como CSV
  const exportToCSV = () => {
    let csvContent = '';
    
    // Cabeçalho do arquivo
    csvContent += `"${meet.name || 'Resultados da Competição'}"\n`;
    csvContent += `"${meet.city} - ${meet.date}"\n\n`;
    
    // Exportar baseado na aba ativa
    if (activeTab === 'complete') {
      // Exportar cada categoria separadamente (Resultados Completos)
      resultsByCategory.forEach((category, categoryIndex) => {
        csvContent += `"${category.category}"\n`;
        
        // Usar cabeçalhos dinâmicos baseados nos movimentos do primeiro atleta da categoria
        const firstAthleteMovements = category.results[0]?.entry.movements || '';
        const headers = getDynamicHeaders(firstAthleteMovements);
        
        csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
        
        // Dados dos atletas
        category.results.forEach((result, index) => {
          const row = getDynamicRowData(result, index);
          csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        // Espaço entre categorias
        csvContent += '\n';
      });
    } else if (activeTab === 'simplified') {
      // Exportar Melhores Atletas
      csvContent += `"Melhores Atletas da Competição"\n\n`;
      
      // Masculino Clássico
      const maleClassicResults = calculatedResults
        .filter(result => result.entry.sex === 'M' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
        .sort((a, b) => b.points - a.points);
      
      csvContent += `"Masculino Clássico"\n`;
      csvContent += `"Pos","Atleta","Equipe","Modalidade","Total","Pontos IPF GL"\n`;
      maleClassicResults.forEach((result, index) => {
        csvContent += `"${index + 1}","${result.entry.name}","${result.entry.team || '-'}","Clássica","${result.total}","${result.points.toFixed(2)}"\n`;
      });
      csvContent += '\n';
      
      // Masculino Equipado
      const maleEquippedResults = calculatedResults
        .filter(result => result.entry.sex === 'M' && result.entry.equipment === 'Equipped')
        .sort((a, b) => b.points - a.points);
      
      csvContent += `"Masculino Equipado"\n`;
      csvContent += `"Pos","Atleta","Equipe","Modalidade","Total","Pontos IPF GL"\n`;
      maleEquippedResults.forEach((result, index) => {
        csvContent += `"${index + 1}","${result.entry.name}","${result.entry.team || '-'}","Equipado","${result.total}","${result.points.toFixed(2)}"\n`;
      });
      csvContent += '\n';
      
      // Feminino Clássico
      const femaleClassicResults = calculatedResults
        .filter(result => result.entry.sex === 'F' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
        .sort((a, b) => b.points - a.points);
      
      csvContent += `"Feminino Clássico"\n`;
      csvContent += `"Pos","Atleta","Equipe","Modalidade","Total","Pontos IPF GL"\n`;
      femaleClassicResults.forEach((result, index) => {
        csvContent += `"${index + 1}","${result.entry.name}","${result.entry.team || '-'}","Clássica","${result.total}","${result.points.toFixed(2)}"\n`;
      });
      csvContent += '\n';
      
      // Feminino Equipado
      const femaleEquippedResults = calculatedResults
        .filter(result => result.entry.sex === 'F' && result.entry.equipment === 'Equipped')
        .sort((a, b) => b.points - a.points);
      
      csvContent += `"Feminino Equipado"\n`;
      csvContent += `"Pos","Atleta","Equipe","Modalidade","Total","Pontos IPF GL"\n`;
      femaleEquippedResults.forEach((result, index) => {
        csvContent += `"${index + 1}","${result.entry.name}","${result.entry.team || '-'}","Equipado","${result.total}","${result.points.toFixed(2)}"\n`;
      });
      
    } else if (activeTab === 'teams') {
      // Exportar Melhores Equipes
      csvContent += `"Ranking das Equipes - Categoria OPEN"\n\n`;
      
      // Equipes Clássicas
      const classicTeamRanking = calculateTeamRanking('Raw');
      csvContent += `"Equipes Clássicas"\n`;
      csvContent += `"Pos","Equipe","Total Pontos","1ºs Lugares","2ºs Lugares","3ºs Lugares","Total IPF GL"\n`;
      classicTeamRanking.forEach((team, index) => {
        csvContent += `"${index + 1}","${team.name}","${team.totalPoints}","${team.firstPlaces}","${team.secondPlaces}","${team.thirdPlaces}","${team.totalIPFPoints.toFixed(2)}"\n`;
      });
      csvContent += '\n';
      
      // Equipes Equipadas
      const equippedTeamRanking = calculateTeamRanking('Equipped');
      csvContent += `"Equipes Equipadas"\n`;
      csvContent += `"Pos","Equipe","Total Pontos","1ºs Lugares","2ºs Lugares","3ºs Lugares","Total IPF GL"\n`;
      equippedTeamRanking.forEach((team, index) => {
        csvContent += `"${index + 1}","${team.name}","${team.totalPoints}","${team.firstPlaces}","${team.secondPlaces}","${team.thirdPlaces}","${team.totalIPFPoints.toFixed(2)}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const fileName = `${meet.name || 'Resultados'}_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  };



  // Função para exportar resultados como PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape'); // Mudança para orientação paisagem
    
    // Título do documento
    doc.setFontSize(16);
    doc.text(meet.name || 'Resultados da Competição', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`${meet.city} - ${meet.date}`, 14, 30);
    
    let yPosition = 40;
    
    // Exportar baseado na aba ativa
    if (activeTab === 'complete') {
      // Exportar cada categoria separadamente (Resultados Completos)
      resultsByCategory.forEach((category, categoryIndex) => {
        // Título da categoria
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(category.category, 14, yPosition);
        
        yPosition += 12;
        
        // Usar cabeçalhos dinâmicos baseados nos movimentos do primeiro atleta da categoria
        const firstAthleteMovements = category.results[0]?.entry.movements || '';
        const headers1 = getDynamicHeaders(firstAthleteMovements);
        
        // Dados dos atletas
        const tableData = category.results.map((result, index) => {
          return getDynamicRowData(result, index);
        });
        
        autoTable(doc, {
          head: [headers1],
          body: tableData,
          startY: yPosition,
          margin: { top: 10 },
          styles: {
            fontSize: 6,
            cellPadding: 1
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          }
        });
        
        // Atualizar posição Y para próxima categoria
        yPosition = (doc as any).lastAutoTable.finalY + 20;
        
        // Adicionar nova página se necessário
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
    } else if (activeTab === 'simplified') {
      // Exportar Melhores Atletas
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Melhores Atletas da Competição', 14, yPosition);
      yPosition += 15;
      
      // Masculino Clássico
      const maleClassicResults = calculatedResults
        .filter(result => result.entry.sex === 'M' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
        .sort((a, b) => b.points - a.points);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Masculino Clássico', 14, yPosition);
      yPosition += 10;
      
      const maleClassicHeaders = ['Pos', 'Atleta', 'Equipe', 'Modalidade', 'Total', 'Pontos IPF GL'];
      const maleClassicData = maleClassicResults.map((result, index) => [
        index + 1,
        result.entry.name,
        result.entry.team || '-',
        'Clássica',
        result.total,
        result.points.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [maleClassicHeaders],
        body: maleClassicData,
        startY: yPosition,
        margin: { top: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Masculino Equipado
      const maleEquippedResults = calculatedResults
        .filter(result => result.entry.sex === 'M' && result.entry.equipment === 'Equipped')
        .sort((a, b) => b.points - a.points);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Masculino Equipado', 14, yPosition);
      yPosition += 10;
      
      const maleEquippedData = maleEquippedResults.map((result, index) => [
        index + 1,
        result.entry.name,
        result.entry.team || '-',
        'Equipado',
        result.total,
        result.points.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [maleClassicHeaders],
        body: maleEquippedData,
        startY: yPosition,
        margin: { top: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [13, 110, 253], textColor: 255, fontStyle: 'bold' }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Feminino Clássico
      const femaleClassicResults = calculatedResults
        .filter(result => result.entry.sex === 'F' && (result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA'))
        .sort((a, b) => b.points - a.points);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Feminino Clássico', 14, yPosition);
      yPosition += 10;
      
      const femaleClassicData = femaleClassicResults.map((result, index) => [
        index + 1,
        result.entry.name,
        result.entry.team || '-',
        'Clássica',
        result.total,
        result.points.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [maleClassicHeaders],
        body: femaleClassicData,
        startY: yPosition,
        margin: { top: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [255, 193, 7], textColor: 0, fontStyle: 'bold' }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Feminino Equipado
      const femaleEquippedResults = calculatedResults
        .filter(result => result.entry.sex === 'F' && result.entry.equipment === 'Equipped')
        .sort((a, b) => b.points - a.points);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Feminino Equipado', 14, yPosition);
      yPosition += 10;
      
      const femaleEquippedData = femaleEquippedResults.map((result, index) => [
        index + 1,
        result.entry.name,
        result.entry.team || '-',
        'Equipado',
        result.total,
        result.points.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [maleClassicHeaders],
        body: femaleEquippedData,
        startY: yPosition,
        margin: { top: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 53, 69], textColor: 255, fontStyle: 'bold' }
      });
      
    } else if (activeTab === 'teams') {
      // Exportar Melhores Equipes
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ranking das Equipes - Categoria OPEN', 14, yPosition);
      yPosition += 15;
      
      // Equipes Clássicas
      const classicTeamRanking = calculateTeamRanking('Raw');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Equipes Clássicas', 14, yPosition);
      yPosition += 10;
      
      const teamHeaders = ['Pos', 'Equipe', 'Total Pontos', '1ºs Lugares', '2ºs Lugares', '3ºs Lugares', 'Total IPF GL'];
      const classicTeamData = classicTeamRanking.map((team, index) => [
        index + 1,
        team.name,
        team.totalPoints,
        team.firstPlaces,
        team.secondPlaces,
        team.thirdPlaces,
        team.totalIPFPoints.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [teamHeaders],
        body: classicTeamData,
        startY: yPosition,
        margin: { top: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Equipes Equipadas
      const equippedTeamRanking = calculateTeamRanking('Equipped');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Equipes Equipadas', 14, yPosition);
      yPosition += 10;
      
      const equippedTeamData = equippedTeamRanking.map((team, index) => [
        index + 1,
        team.name,
        team.totalPoints,
        team.firstPlaces,
        team.secondPlaces,
        team.thirdPlaces,
        team.totalIPFPoints.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [teamHeaders],
        body: equippedTeamData,
        startY: yPosition,
        margin: { top: 10 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [13, 110, 253], textColor: 255, fontStyle: 'bold' }
      });
    }
    
    doc.save(`${meet.name || 'Resultados'}_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Função para obter ícone de medalha
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <FaMedal className="text-warning" />;
      case 2: return <FaMedal className="text-secondary" />;
      case 3: return <FaMedal className="text-danger" />;
      default: return null;
    }
  };

  // Função para obter movimentos configurados do atleta
  const getAthleteMovements = (movements: string) => {
    console.log('=== DEBUG getAthleteMovements ===');
    console.log('Movimentos originais:', movements);
    console.log('Tipo:', typeof movements);
    console.log('Inclui vírgula?', movements.includes(','));
    
    // Dividir por vírgula e espaço para separar modalidades
    let movementList = movements.split(', ').filter(m => m.trim() !== '');
    console.log('Lista de movimentos após split:', movementList);
    console.log('Quantidade de movimentos:', movementList.length);
    
    // Se não há vírgulas, é uma modalidade única (AST, AS, A, S, T)
    if (movementList.length === 1 && !movements.includes(',')) {
      const combinedMovement = movements.trim();
      console.log('Movimento único detectado:', combinedMovement);
      
      // Modalidades únicas
      if (combinedMovement === 'AST') {
        console.log('AST detectado - retornando todos os movimentos');
        // Powerlifting: todos os movimentos
        return { hasSquat: true, hasBench: true, hasDeadlift: true };
      } else if (combinedMovement === 'AS') {
        // Agachamento + Supino: apenas A e S
        return { hasSquat: true, hasBench: true, hasDeadlift: false };
      } else if (combinedMovement === 'A') {
        // Só Agachamento
        return { hasSquat: true, hasBench: false, hasDeadlift: false };
      } else if (combinedMovement === 'S') {
        // Só Supino
        return { hasSquat: false, hasBench: true, hasDeadlift: false };
      } else if (combinedMovement === 'T') {
        // Só Terra
        return { hasSquat: false, hasBench: false, hasDeadlift: true };
      }
    }
    
    // Se há vírgulas, são modalidades separadas (ex: "A, S" = duas modalidades)
    // Para cada modalidade individual, verificar se contém os movimentos
    let hasSquat = false;
    let hasBench = false;
    let hasDeadlift = false;
    
    movementList.forEach(movement => {
      if (movement === 'A') hasSquat = true;
      if (movement === 'S') hasBench = true;
      if (movement === 'T') hasDeadlift = true;
    });
    
    const result = { hasSquat, hasBench, hasDeadlift };
    console.log('Resultado da detecção:', result);
    console.log('=== FIM DEBUG ===');
    return result;
  };

  // Função para determinar quais colunas mostrar baseado na modalidade da categoria
  const getCategoryMovements = (categoryName: string) => {
    console.log('=== DEBUG getCategoryMovements ===');
    console.log('Nome da categoria:', categoryName);
    
    // Detectar modalidade baseada no nome da categoria
    if (categoryName.includes('Powerlifting (AST)')) {
      console.log('Powerlifting (AST) detectado - todos os movimentos');
      return { hasSquat: true, hasBench: true, hasDeadlift: true };
    } else if (categoryName.includes('Só Agachamento (A)')) {
      console.log('Só Agachamento (A) detectado - apenas agachamento');
      return { hasSquat: true, hasBench: false, hasDeadlift: false };
    } else if (categoryName.includes('Só Supino (S)')) {
      console.log('Só Supino (S) detectado - apenas supino');
      return { hasSquat: false, hasBench: true, hasDeadlift: false };
    } else if (categoryName.includes('Só Terra (T)')) {
      console.log('Só Terra (T) detectado - apenas terra');
      return { hasSquat: false, hasBench: false, hasDeadlift: true };
    } else if (categoryName.includes('Agachamento + Supino (AS)')) {
      console.log('Agachamento + Supino (AS) detectado - A + S');
      return { hasSquat: true, hasBench: true, hasDeadlift: false };
    } else if (categoryName.includes('Supino + Terra (ST)')) {
      console.log('Supino + Terra (ST) detectado - S + T');
      return { hasSquat: false, hasBench: true, hasDeadlift: true };
    } else if (categoryName.includes('Agachamento + Terra (AT)')) {
      console.log('Agachamento + Terra (AT) detectado - A + T');
      return { hasSquat: true, hasBench: false, hasDeadlift: true };
    }
    
    // Padrão: todos os movimentos
    console.log('Modalidade não reconhecida - padrão: todos os movimentos');
    return { hasSquat: true, hasBench: true, hasDeadlift: true };
  };

  // Função para calcular colspans dinâmicos baseado na modalidade
  const getDynamicColSpans = (categoryName: string) => {
    const { hasSquat, hasBench, hasDeadlift } = getCategoryMovements(categoryName);
    
    const baseColSpan = 6; // Pos, Atleta, Categoria, Peso, Nº Lote, Equipe
    const squatColSpan = hasSquat ? 5 : 0; // A1, A2, A3, Melhor, Pos
    const benchColSpan = hasBench ? 5 : 0; // S1, S2, S3, Melhor, Pos
    const deadliftColSpan = hasDeadlift ? 5 : 0; // T1, T2, T3, Melhor, Pos
    const resultColSpan = 2; // Total, IPF GL Points
    
    return {
      baseColSpan,
      squatColSpan,
      benchColSpan,
      deadliftColSpan,
      resultColSpan,
      totalColSpan: baseColSpan + squatColSpan + benchColSpan + deadliftColSpan + resultColSpan
    };
  };

  // Função para gerar cabeçalhos dinâmicos baseados nos movimentos
  const getDynamicHeaders = (movements: string) => {
    const { hasSquat, hasBench, hasDeadlift } = getAthleteMovements(movements);
    
    const headers = ['POS', 'Atleta', 'UF', 'Equipe', 'Nascimento', 'Peso'];
    
    if (hasSquat) {
      headers.push('A1', 'A2', 'A3', 'Melhor', 'Pos');
    }
    if (hasBench) {
      headers.push('S1', 'S2', 'S3', 'Melhor', 'Pos');
    }
    if (hasDeadlift) {
      headers.push('T1', 'T2', 'T3', 'Melhor', 'Pos');
    }
    
    headers.push('Total', 'Indice GL');
    return headers;
  };

  // Função para gerar dados dinâmicos baseados nos movimentos
  const getDynamicRowData = (result: CalculatedResult, index: number) => {
    const { hasSquat, hasBench, hasDeadlift } = getAthleteMovements(result.entry.movements || '');
    
    const rowData = [
      index + 1, // POS
      result.entry.name,
      result.entry.state || '-',
      result.entry.team || '-',
      result.entry.birthDate ? new Date(result.entry.birthDate).toLocaleDateString('pt-BR') : '-',
      result.entry.bodyweightKg || '-'
    ];
    
    if (hasSquat) {
      rowData.push(
        result.squatAttempts[0] || '-',
        result.squatAttempts[1] || '-',
        result.squatAttempts[2] || '-',
        result.squat,
        result.positions.squat
      );
    }
    if (hasBench) {
      rowData.push(
        result.benchAttempts[0] || '-',
        result.benchAttempts[1] || '-',
        result.benchAttempts[2] || '-',
        result.bench,
        result.positions.bench
      );
    }
    if (hasDeadlift) {
      rowData.push(
        result.deadliftAttempts[0] || '-',
        result.deadliftAttempts[1] || '-',
        result.deadliftAttempts[2] || '-',
        result.deadlift,
        result.positions.deadlift
      );
    }
    
    rowData.push(result.total, result.points.toFixed(2));
    return rowData;
  };

  // Função para calcular pontos de equipe baseado na posição
  const getTeamPoints = (position: number): number => {
    if (position === 1) return 12;
    if (position === 2) return 9;
    if (position === 3) return 8;
    if (position === 4) return 7;
    if (position === 5) return 6;
    if (position === 6) return 5;
    if (position === 7) return 4;
    if (position === 8) return 3;
    if (position === 9) return 2;
    return 1; // 10º em diante
  };

    // Função para calcular ranking das equipes por modalidade e tipo de competição
  const calculateTeamRanking = (equipment: 'Raw' | 'Equipped' | 'Classico' | 'Equipado', competitionType?: string) => {
    // Debug: log para verificar parâmetros recebidos
    console.log(`🚀 calculateTeamRanking chamada com: equipment=${equipment}, competitionType=${competitionType}`);
    console.log(`📊 Total de categorias disponíveis: ${resultsByCategory.length}`);
    
    // Agrupar por equipe
    const teamsMap = new Map<string, {
      name: string;
      athletes: Array<{
        name: string;
        position: number;
        teamPoints: number;
        ipfPoints: number;
        weightClass: string;
        sex: string;
        equipment: string;
        movements: string;
      }>;
      totalPoints: number;
      firstPlaces: number;
      secondPlaces: number;
      thirdPlaces: number;
      totalIPFPoints: number;
    }>();

    // Para cada categoria de peso, calcular posições
    resultsByCategory.forEach(category => {
      // Debug: log para verificar categoria sendo processada
      console.log(`🔍 Processando categoria: ${category.category}`);
      console.log(`   Total de atletas na categoria: ${category.results.length}`);
      
      // Filtrar apenas atletas OPEN desta categoria e tipo de competição
      const openAthletes = category.results.filter(result => {
        // Usar a divisão direta do atleta em vez de calcular pela data de nascimento
        const athleteDivision = result.entry.division || '';
        const isClassic = result.entry.equipment === 'Raw' || result.entry.equipment === 'CLASSICA' || result.entry.equipment === 'Classico';
        const isEquipped = result.entry.equipment === 'Equipped' || result.entry.equipment === 'EQUIPADO' || result.entry.equipment === 'Equipado';
        
        // Verificar se o atleta participa EXCLUSIVAMENTE do tipo de competição especificado
        let hasCompetitionType = false;
        if (competitionType) {
          // Se há um tipo específico, verificar se o atleta compete APENAS nesse tipo
          if (result.entry.movements) {
            const movements = result.entry.movements.split(', ').filter(m => m.trim() !== '');
            // O atleta deve competir APENAS no tipo especificado (não pode ter outros tipos)
            hasCompetitionType = movements.length === 1 && movements[0] === competitionType;
          }
        } else {
          // Se não há tipo específico, aceitar qualquer atleta
          hasCompetitionType = true;
        }
        
        const hasCorrectEquipment = (equipment === 'Raw' || equipment === 'Classico') ? isClassic : (equipment === 'Equipped' || equipment === 'Equipado') ? isEquipped : false;
        
        // Verificar se é atleta OPEN (pode ser 'Open', 'OPEN', 'open', etc.)
        const isOpenAthlete = athleteDivision.toLowerCase().includes('open');
        
        // Debug: log para verificar filtros
        if (athleteDivision) {
          console.log(`🔍 Atleta: ${result.entry.name}`);
          console.log(`   Divisão: "${athleteDivision}"`);
          console.log(`   Equipment: ${result.entry.equipment}`);
          console.log(`   Movements: "${result.entry.movements}"`);
          console.log(`   Tipo de competição filtrado: ${competitionType || 'TODOS'}`);
          console.log(`   isOpenAthlete: ${isOpenAthlete}`);
          console.log(`   hasCorrectEquipment: ${hasCorrectEquipment}`);
          console.log(`   hasCompetitionType: ${hasCompetitionType}`);
          console.log(`   ---`);
        }
        
        return isOpenAthlete && hasCorrectEquipment && hasCompetitionType;
      });
      
      // Debug: log para verificar quantos atletas OPEN foram encontrados
      console.log(`📊 Categoria: ${category.category}`);
      console.log(`   Total de atletas na categoria: ${category.results.length}`);
      console.log(`   Atletas OPEN encontrados: ${openAthletes.length}`);
      console.log(`   Tipo de competição filtrado: ${competitionType || 'TODOS'}`);
      console.log(`   Modalidade filtrada: ${equipment}`);
      console.log(`   ========================`);

      // Ordenar por total (posição na categoria)
      openAthletes.sort((a, b) => b.total - a.total);

      // Atribuir posições e pontos
      openAthletes.forEach((result, index) => {
        const teamName = result.entry.team || 'Sem Equipe';
        const position = index + 1;
        const teamPoints = getTeamPoints(position);

        if (!teamsMap.has(teamName)) {
          teamsMap.set(teamName, {
            name: teamName,
            athletes: [],
            totalPoints: 0,
            firstPlaces: 0,
            secondPlaces: 0,
            thirdPlaces: 0,
            totalIPFPoints: 0
          });
        }

        const team = teamsMap.get(teamName)!;
        team.athletes.push({
          name: result.entry.name,
          position,
          teamPoints,
          ipfPoints: result.points,
          weightClass: result.entry.weightClass || '0',
          sex: result.entry.sex || 'M',
          equipment: result.entry.equipment || 'Raw',
          movements: result.entry.movements || ''
        });
      });
    });

    // Calcular totais das equipes
    teamsMap.forEach(team => {
      // Ordenar atletas por pontos de equipe (decrescente)
      team.athletes.sort((a, b) => b.teamPoints - a.teamPoints);
      
      // Pegar apenas os 5 melhores
      const top5 = team.athletes.slice(0, 5);
      
      team.totalPoints = top5.reduce((sum, athlete) => sum + athlete.teamPoints, 0);
      team.firstPlaces = top5.filter(a => a.teamPoints === 12).length;
      team.secondPlaces = top5.filter(a => a.teamPoints === 9).length;
      team.thirdPlaces = top5.filter(a => a.teamPoints === 8).length;
      team.totalIPFPoints = top5.reduce((sum, athlete) => sum + athlete.ipfPoints, 0);
      
      // Debug: log para verificar dados da equipe
      console.log(`🏆 Equipe: ${team.name}, Total de atletas: ${team.athletes.length}, Top 5 pontos: ${team.totalPoints}`);
    });
    
    // Debug: log para verificar total de equipes encontradas
    console.log(`🎯 Total de equipes encontradas: ${teamsMap.size}`);
    console.log(`📋 Equipes: ${Array.from(teamsMap.keys()).join(', ')}`);

    // Converter para array e ordenar
    const teamsArray = Array.from(teamsMap.values());
    
    // Ordenar por critérios de desempate
    teamsArray.sort((a, b) => {
      // 1. Total de pontos
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      // 2. Mais 1ºs lugares
      if (b.firstPlaces !== a.firstPlaces) {
        return b.firstPlaces - a.firstPlaces;
      }
      
      // 3. Mais 2ºs lugares
      if (b.secondPlaces !== a.secondPlaces) {
        return b.secondPlaces - a.secondPlaces;
      }
      
      // 4. Mais 3ºs lugares
      if (b.thirdPlaces !== a.thirdPlaces) {
        return b.thirdPlaces - a.thirdPlaces;
      }
      
      // 5. Maior somatório de pontos IPF
      return b.totalIPFPoints - a.totalIPFPoints;
    });

    return teamsArray;
  };

  // Componente para a aba de melhores equipes
  const TeamResults = () => {
    // Obter tipos de competição únicos dos atletas
    const competitionTypes = new Set<string>();
    calculatedResults.forEach(result => {
      if (result.entry.movements) {
        const types = result.entry.movements.split(', ').filter(t => t.trim());
        types.forEach(type => competitionTypes.add(type));
      }
    });
    
    const competitionTypesArray = Array.from(competitionTypes).sort();
    
    return (
      <div>
        <Row className="mb-4">
          <Col>
            <Card className="bg-light">
              <Card.Body className="text-center">
                <h4 className="text-primary mb-3">
                  <FaTrophy className="me-2" />
                  Ranking das Equipes - Categoria OPEN
                </h4>
                <p className="text-muted">
                  Pontuação: 1º=12, 2º=9, 3º=8, 4º=7, 5º=6, 6º=5, 7º=4, 8º=3, 9º=2, 10º+=1
                </p>
                <p className="text-muted">
                  Contam apenas os 5 melhores atletas de cada equipe por modalidade e tipo de competição
                </p>
                <p className="text-warning">
                  <strong>Regra:</strong> Ranking de equipes só é válido com 3 ou mais equipes por modalidade
                </p>
                {competitionTypesArray.length > 0 && (
                  <p className="text-info">
                    <strong>Tipos de competição encontrados:</strong> {competitionTypesArray.join(', ')}
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Rankings por tipo de competição */}
        {competitionTypesArray.map(competitionType => {
          const classicTeams = calculateTeamRanking('Classico', competitionType);
          const equippedTeams = calculateTeamRanking('Equipado', competitionType);
          
          return (
            <Row key={competitionType} className="mb-4">
              <Col>
                <Card className="border-info">
                  <Card.Header className="bg-info text-white">
                    <h5 className="mb-0">
                      <FaTrophy className="me-2" />
                      Ranking Equipes - Tipo {competitionType}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {/* Equipes Clássicas */}
                      <Col md={6}>
                        <Card className="border-success">
                          <Card.Header className="bg-success text-white">
                            <h6 className="mb-0">
                              <FaTrophy className="me-2" />
                              Equipes Clássicas - {competitionType}
                            </h6>
                          </Card.Header>
                          <Card.Body>
                            {classicTeams.length > 2 ? (
                              <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                  <thead className="table-success">
                                    <tr>
                                      <th>Pos</th>
                                      <th>Equipe</th>
                                      <th>Total</th>
                                      <th>1ºs</th>
                                      <th>2ºs</th>
                                      <th>3ºs</th>
                                      <th>IPF GL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {classicTeams.map((team, index) => (
                                      <tr key={`${competitionType}-classic-${team.name}`}>
                                        <td className="text-center">
                                          <div className="d-flex align-items-center justify-content-center">
                                            {getMedalIcon(index + 1)}
                                            <span className="ms-1 fw-bold">{index + 1}</span>
                                          </div>
                                        </td>
                                        <td className="fw-bold">{team.name}</td>
                                        <td className="text-center fw-bold text-primary">{team.totalPoints}</td>
                                        <td className="text-center">{team.firstPlaces}</td>
                                        <td className="text-center">{team.secondPlaces}</td>
                                        <td className="text-center">{team.thirdPlaces}</td>
                                        <td className="text-center">{team.totalIPFPoints.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <Alert variant="warning" className="mb-0">
                                <FaTrophy className="me-2" />
                                <strong>Ranking não válido:</strong> Apenas {classicTeams.length} equipe(s) encontrada(s). 
                                São necessárias pelo menos 3 equipes para validar o ranking.
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* Equipes Equipadas */}
                      <Col md={6}>
                        <Card className="border-primary">
                          <Card.Header className="bg-primary text-white">
                            <h6 className="mb-0">
                              <FaTrophy className="me-2" />
                              Equipes Equipadas - {competitionType}
                            </h6>
                          </Card.Header>
                          <Card.Body>
                            {equippedTeams.length >= 3 ? (
                              <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                  <thead className="table-primary">
                                    <tr>
                                      <th>Pos</th>
                                      <th>Equipe</th>
                                      <th>Total</th>
                                      <th>1ºs</th>
                                      <th>2ºs</th>
                                      <th>3ºs</th>
                                      <th>IPF GL</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {equippedTeams.map((team, index) => (
                                      <tr key={`${competitionType}-equipped-${team.name}`}>
                                        <td className="text-center">
                                          <div className="d-flex align-items-center justify-content-center">
                                            {getMedalIcon(index + 1)}
                                            <span className="ms-1 fw-bold">{index + 1}</span>
                                          </div>
                                        </td>
                                        <td className="fw-bold">{team.name}</td>
                                        <td className="text-center fw-bold text-primary">{team.totalPoints}</td>
                                        <td className="text-center">{team.firstPlaces}</td>
                                        <td className="text-center">{team.secondPlaces}</td>
                                        <td className="text-center">{team.thirdPlaces}</td>
                                        <td className="text-center">{team.totalIPFPoints.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <Alert variant="warning" className="mb-0">
                                <FaTrophy className="me-2" />
                                <strong>Ranking não válido:</strong> Apenas {equippedTeams.length} equipe(s) encontrada(s). 
                                São necessárias pelo menos 3 equipes para validar o ranking.
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          );
        })}

        {/* Ranking geral (sem filtro por tipo) */}
        <Row className="mb-4">
          <Col>
            <Card className="border-warning">
              <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">
                  <FaTrophy className="me-2" />
                  Ranking Geral das Equipes (Todos os Tipos)
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {/* Equipes Clássicas */}
                  <Col md={6}>
                    <Card className="border-success">
                      <Card.Header className="bg-success text-white">
                        <h6 className="mb-0">
                          <FaTrophy className="me-2" />
                          Equipes Clássicas - Geral
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        {(() => {
                          const classicTeams = calculateTeamRanking('Classico');
                          return classicTeams.length >= 3 ? (
                            <div className="table-responsive">
                              <table className="table table-striped table-hover">
                                <thead className="table-success">
                                  <tr>
                                    <th>Pos</th>
                                    <th>Equipe</th>
                                    <th>Total</th>
                                    <th>1ºs</th>
                                    <th>2ºs</th>
                                    <th>3ºs</th>
                                    <th>IPF GL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classicTeams.map((team, index) => (
                                    <tr key={`general-classic-${team.name}`}>
                                      <td className="text-center">
                                        <div className="d-flex align-items-center justify-content-center">
                                          {getMedalIcon(index + 1)}
                                          <span className="ms-1 fw-bold">{index + 1}</span>
                                        </div>
                                      </td>
                                      <td className="fw-bold">{team.name}</td>
                                      <td className="text-center fw-bold text-primary">{team.totalPoints}</td>
                                      <td className="text-center">{team.firstPlaces}</td>
                                      <td className="text-center">{team.secondPlaces}</td>
                                      <td className="text-center">{team.thirdPlaces}</td>
                                      <td className="text-center">{team.totalIPFPoints.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <Alert variant="warning" className="mb-0">
                              <FaTrophy className="me-2" />
                              <strong>Ranking não válido:</strong> Apenas {classicTeams.length} equipe(s) encontrada(s). 
                              São necessárias pelo menos 3 equipes para validar o ranking.
                            </Alert>
                          );
                        })()}
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Equipes Equipadas */}
                  <Col md={6}>
                    <Card className="border-primary">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">
                          <FaTrophy className="me-2" />
                          Equipes Equipadas - Geral
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        {(() => {
                          const equippedTeams = calculateTeamRanking('Equipado');
                          return equippedTeams.length >= 3 ? (
                            <div className="table-responsive">
                              <table className="table table-striped table-hover">
                                <thead className="table-primary">
                                  <tr>
                                    <th>Pos</th>
                                    <th>Equipe</th>
                                    <th>Total</th>
                                    <th>1ºs</th>
                                    <th>2ºs</th>
                                    <th>3ºs</th>
                                    <th>IPF GL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {equippedTeams.map((team, index) => (
                                    <tr key={`general-equipped-${team.name}`}>
                                      <td className="text-center">
                                        <div className="d-flex align-items-center justify-content-center">
                                          {getMedalIcon(index + 1)}
                                          <span className="ms-1 fw-bold">{index + 1}</span>
                                        </div>
                                      </td>
                                      <td className="fw-bold">{team.name}</td>
                                      <td className="text-center fw-bold text-primary">{team.totalPoints}</td>
                                      <td className="text-center">{team.firstPlaces}</td>
                                      <td className="text-center">{team.secondPlaces}</td>
                                      <td className="text-center">{team.thirdPlaces}</td>
                                      <td className="text-center">{team.totalIPFPoints.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <Alert variant="warning" className="mb-0">
                              <FaTrophy className="me-2" />
                              <strong>Ranking não válido:</strong> Apenas {equippedTeams.length} equipe(s) encontrada(s). 
                              São necessárias pelo menos 3 equipes para validar o ranking.
                            </Alert>
                          );
                        })()}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Componente para a aba de melhores atletas - Novo sistema de Best Lifter seguindo as regras oficiais da IPF
  const SimplifiedResults = () => {
    // Calcular resultados de Best Lifter usando as regras oficiais IPF
    const bestLifterCategories = calculateBestLifterResults(registration.entries);
    
    // Estatísticas gerais
    const totalAthletes = calculatedResults.length;
    const totalCategories = bestLifterCategories.length;
    const totalMedals = bestLifterCategories.reduce((sum: number, category: BestLifterCategory) => sum + category.results.length, 0);

    return (
      <div>
        {/* Cabeçalho com informações da competição */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-primary text-white">
              <Card.Body className="text-center">
                <h3 className="mb-3">
                  <FaTrophy className="me-2" />
                  Best Lifter - Melhor Atleta IPF
                </h3>
                <p className="mb-0">
                  Resultados baseados na fórmula oficial IPF GL Points, seguindo as regras oficiais da Federação
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Estatísticas gerais */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-light">
              <Card.Body className="text-center">
                <h5 className="text-primary mb-3">Estatísticas da Competição</h5>
                <Row>
                  <Col md={3}>
                    <div className="border-end">
                      <h4 className="text-success">{totalAthletes}</h4>
                      <small className="text-muted">Total de Atletas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h4 className="text-info">{totalCategories}</h4>
                      <small className="text-muted">Categorias Válidas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="border-end">
                      <h4 className="text-warning">{totalMedals}</h4>
                      <small className="text-muted">Medalhas Atribuídas</small>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div>
                      <h4 className="text-danger">
                        {calculatedResults.reduce((max, result) => Math.max(max, result.points), 0).toFixed(2)}
                      </h4>
                      <small className="text-muted">Maior Pontuação IPF GL</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Explicação das regras */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-info text-white">
              <Card.Body>
                <h6 className="mb-2">
                  <FaTrophy className="me-2" />
                  Regras do Best Lifter IPF
                </h6>
                <ul className="mb-0 small">
                  <li>Prêmios são atribuídos apenas para categorias com 3+ atletas</li>
                  <li>Ordenação: 1º IPF GL Points, 2º Peso corporal (mais leve), 3º Ordem de inscrição</li>
                  <li>Divisões: Sub-Junior (SJ), Junior (JR), Open (OP), Master I-IV (M1-M4)</li>
                  <li>Equipamentos: Clássico (Raw) e Equipado separadamente</li>
                  <li>Eventos: Powerlifting (SBD) e Supino (B) com parâmetros específicos</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Categorias de Best Lifter */}
        {bestLifterCategories.length > 0 ? (
          bestLifterCategories.map((category: BestLifterCategory, categoryIndex: number) => (
            <Row key={categoryIndex} className="mb-4">
              <Col>
                <Card>
                  <Card.Header className={`text-white ${
                    category.sex === 'M' 
                      ? (category.equipment === 'Classico' ? 'bg-success' : 'bg-primary')
                      : (category.equipment === 'Classico' ? 'bg-warning' : 'bg-danger')
                  }`}>
                    <h5 className="mb-0">
                      <FaTrophy className="me-2" />
                      {category.sex === 'M' ? 'Masculino' : 'Feminino'} {' '}
                      {getEquipmentDisplayNameForBestLifter(category.equipment)} {' '}
                      {getAgeDivisionDisplayName(category.ageDivision)} {' '}
                      ({getEventTypeDisplayName(category.eventType)})
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table responsive className="mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center">Pos</th>
                          <th>Atleta</th>
                          <th>Equipe</th>
                          <th>Peso (kg)</th>
                          {category.eventType === 'SBD' && (
                            <>
                              <th>Agachamento</th>
                              <th>Supino</th>
                              <th>Terra</th>
                            </>
                          )}
                          {category.eventType === 'B' && (
                            <th>Supino</th>
                          )}
                          <th>Total</th>
                          <th>IPF GL Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.results.map((result: BestLifterResult) => (
                          <tr key={result.entry.id}>
                            <td className="text-center">
                              <div className="d-flex align-items-center justify-content-center">
                                {getMedalIcon(result.position)}
                                <span className="ms-2 fw-bold">{result.position}º</span>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{result.entry.name}</strong>
                                <br />
                                <small className="text-muted">
                                  {result.entry.team || 'Sem equipe'}
                                </small>
                              </div>
                            </td>
                            <td>{result.entry.team || '-'}</td>
                            <td className="text-center">
                              <span className="fw-bold">{result.bodyweight}kg</span>
                            </td>
                            {category.eventType === 'SBD' && (
                              <>
                                <td className="text-center">
                                  <span className="fw-bold">
                                    {Math.max(result.entry.squat1 || 0, result.entry.squat2 || 0, result.entry.squat3 || 0)}kg
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className="fw-bold">
                                    {Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0)}kg
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className="fw-bold">
                                    {Math.max(result.entry.deadlift1 || 0, result.entry.deadlift2 || 0, result.entry.deadlift3 || 0)}kg
                                  </span>
                                </td>
                              </>
                            )}
                            {category.eventType === 'B' && (
                              <td className="text-center">
                                <span className="fw-bold">
                                  {Math.max(result.entry.bench1 || 0, result.entry.bench2 || 0, result.entry.bench3 || 0)}kg
                                </span>
                              </td>
                            )}
                            <td className="text-center">
                              <span className="fw-bold text-primary fs-5">
                                {result.total}kg
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="fw-bold text-success fs-5">
                                {result.points.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ))
        ) : (
          <Row>
            <Col>
              <Alert variant="warning" className="text-center">
                <FaTrophy size={48} className="mb-3" />
                <h4>Nenhuma categoria válida para Best Lifter</h4>
                <p>
                  Para atribuir prêmios de Best Lifter, é necessário que cada categoria tenha pelo menos 3 atletas.
                  <br />
                  Categorias com menos de 3 atletas não recebem prêmios conforme as regras oficiais da IPF.
                </p>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Categorias sem prêmios (menos de 3 atletas) */}
        {(() => {
          const invalidCategories = calculateBestLifterResults(registration.entries)
            .filter((category: BestLifterCategory) => !category.hasMinimumAthletes);
          
          if (invalidCategories.length > 0) {
            return (
              <Row className="mb-4">
                <Col>
                  <Card className="bg-warning">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0">
                        <FaTrophy className="me-2" />
                        Categorias sem Prêmios (Menos de 3 Atletas)
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-2 small">
                        As seguintes categorias não recebem prêmios de Best Lifter por não atenderem ao mínimo de 3 atletas:
                      </p>
                      <ul className="mb-0 small">
                        {invalidCategories.map((category: BestLifterCategory, index: number) => (
                          <li key={index}>
                            {category.sex === 'M' ? 'Masculino' : 'Feminino'} {' '}
                            {getEquipmentDisplayNameForBestLifter(category.equipment)} {' '}
                            {getAgeDivisionDisplayName(category.ageDivision)} {' '}
                            ({getEventTypeDisplayName(category.eventType)}) - 
                            {category.results.length} atleta{category.results.length !== 1 ? 's' : ''}
                          </li>
                        ))}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            );
          }
          return null;
        })()}
      </div>
    );
  };

  // Componente para exibir tentativa individual
const AttemptDisplay: React.FC<{ 
  attempt: number | null; 
  status: number; 
  isBest: boolean;
  className?: string;
}> = ({ attempt, status, isBest, className = '' }) => {
  if (!attempt) return <td className={`text-center ${className}`}>-</td>;
  
  const isGoodLift = status === 1;
  const isNoLift = status === 2;
  
  return (
    <td className={`text-center ${className} ${isBest ? 'fw-bold text-success' : ''} ${isNoLift ? 'text-danger' : ''}`}>
      {attempt}
    </td>
  );
};

    // Componente para tabela de resultados completos
  const DetailedResultsTable: React.FC<{ results: CalculatedResult[], categoryName?: string }> = ({ results, categoryName }) => {
    // Determinar quais movimentos mostrar baseado no primeiro atleta (assumindo mesma categoria)
    const firstAthleteMovements = getAthleteMovements(results[0]?.entry.movements || '');
    const { hasSquat, hasBench, hasDeadlift } = firstAthleteMovements;
    
    // Debug: verificar movimentos do primeiro atleta
    console.log('Movimentos do primeiro atleta:', results[0]?.entry.movements);
    console.log('Movimentos detectados:', { hasSquat, hasBench, hasDeadlift });
    
    // Calcular colspans dinâmicos
    const baseColSpan = 6; // POS, Atleta, UF, Equipe, Nascimento, Peso
    const squatColSpan = hasSquat ? 5 : 0;
    const benchColSpan = hasBench ? 5 : 0;
    const deadliftColSpan = hasDeadlift ? 5 : 0;
    const resultColSpan = 2; // Total, Indice GL
    
    // Obter nome da categoria de movimentos
    const movementCategory = categoryName || getMovementCategoryName(results[0]?.entry.movements || '');
    
    // Função para calcular o total correto baseado na modalidade
    const calculateTotalForModalidade = (result: CalculatedResult) => {
      // Se é Powerlifting (AST), soma todos os movimentos
      if (movementCategory.includes('Powerlifting (AST)')) {
        return result.squat + result.bench + result.deadlift;
      }
      
      // Se é só Agachamento, retorna apenas o agachamento
      if (movementCategory.includes('Só Agachamento (A)')) {
        return result.squat;
      }
      
      // Se é só Supino, retorna apenas o supino
      if (movementCategory.includes('Só Supino (S)')) {
        return result.bench;
      }
      
      // Se é só Terra, retorna apenas o terra
      if (movementCategory.includes('Só Terra (T)')) {
        return result.deadlift;
      }
      
      // Se é AS, soma agachamento + supino
      if (movementCategory.includes('Agachamento + Supino (AS)')) {
        return result.squat + result.bench;
      }
      
      // Se é ST, soma supino + terra
      if (movementCategory.includes('Supino + Terra (ST)')) {
        return result.bench + result.deadlift;
      }
      
      // Se é AT, soma agachamento + terra
      if (movementCategory.includes('Agachamento + Terra (AT)')) {
        return result.squat + result.deadlift;
      }
      
      // Padrão: soma todos
      return result.squat + result.bench + result.deadlift;
    };
    
    return (
      <div className="overflow-auto">
        <table className="complete-results-table">
          {/* Cabeçalho principal com título da categoria */}
          <thead>
            <tr className="category-header">
              <th colSpan={baseColSpan + squatColSpan + benchColSpan + deadliftColSpan + resultColSpan}>
                {results[0]?.entry.weightClass} kg - {getAgeCategory(results[0]?.entry.birthDate || '', results[0]?.entry.sex)} - {getEquipmentDisplayName(results[0]?.entry.equipment || 'Raw')} - {movementCategory}
              </th>
            </tr>
            
            {/* Cabeçalho das seções de movimentos */}
            <tr className="sections-header">
              {/* Seção de dados básicos */}
              <th colSpan={baseColSpan} className="section-basic">
                Dados do Atleta
              </th>
              
              {/* Seção de agachamento */}
              {hasSquat && (
                <th colSpan={squatColSpan} className="section-squat">
                  Agachamento
                </th>
              )}
              
              {/* Seção de supino */}
              {hasBench && (
                <th colSpan={benchColSpan} className="section-bench">
                  Supino
                </th>
              )}
              
              {/* Seção de terra */}
              {hasDeadlift && (
                <th colSpan={deadliftColSpan} className="section-deadlift">
                  Levantamento Terra
                </th>
              )}
              
              {/* Seção de resultado */}
              <th colSpan={resultColSpan} className="section-result">
                Resultado
              </th>
            </tr>
            
            {/* Cabeçalho das colunas específicas */}
            <tr className="columns-header">
              {/* Colunas básicas */}
              <th>POS</th>
              <th>Atleta</th>
              <th>UF</th>
              <th>Equipe</th>
              <th>Nascimento</th>
              <th>Peso</th>
              
              {/* Colunas de agachamento */}
              {hasSquat && (
                <>
                  <th>A1</th>
                  <th>A2</th>
                  <th>A3</th>
                  <th>Melhor</th>
                  <th>Pos</th>
                </>
              )}
              
              {/* Colunas de supino */}
              {hasBench && (
                <>
                  <th>S1</th>
                  <th>S2</th>
                  <th>S3</th>
                  <th>Melhor</th>
                  <th>Pos</th>
                </>
              )}
              
              {/* Colunas de terra */}
              {hasDeadlift && (
                <>
                  <th>T1</th>
                  <th>T2</th>
                  <th>T3</th>
                  <th>Melhor</th>
                  <th>Pos</th>
                </>
              )}
              
              {/* Colunas de resultado */}
              <th>Total</th>
              <th>Indice GL</th>
            </tr>
          </thead>
          
          <tbody>
            {results.map((result, index) => (
                <tr key={result.entry.id}>
                  {/* Posição */}
                  <td className="text-center">
                    <div className="d-flex align-items-center justify-content-center">
                      {getMedalIcon(index + 1)}
                      <span className="ms-1 fw-bold">{index + 1}</span>
                    </div>
                  </td>
                  
                  {/* Dados do atleta */}
                  <td className="athlete">{result.entry.name}</td>
                  <td className="text-center">{result.entry.state || '-'}</td>
                  <td className="team">{result.entry.team || '-'}</td>
                  <td className="text-center">{result.entry.birthDate ? new Date(result.entry.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="text-center">{result.entry.bodyweightKg || '-'}</td>
                  
                  {/* Agachamento */}
                  {hasSquat && (
                    <>
                      <td>
                        <span className={`attempt ${result.squatAttempts[0] && result.squatStatus[0] === 1 ? 'valid' : result.squatAttempts[0] && result.squatStatus[0] === 2 ? 'invalid' : 'empty'}`}>
                          {result.squatAttempts[0] || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`attempt ${result.squatAttempts[1] && result.squatStatus[1] === 1 ? 'valid' : result.squatAttempts[1] && result.squatStatus[1] === 2 ? 'invalid' : 'empty'}`}>
                          {result.squatAttempts[1] || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`attempt ${result.squatAttempts[2] && result.squatStatus[2] === 1 ? 'valid' : result.squatAttempts[2] && result.squatStatus[2] === 2 ? 'invalid' : 'empty'}`}>
                          {result.squatAttempts[2] || '-'}
                        </span>
                      </td>
                      <td className="fw-bold text-success">{result.squat}</td>
                      <td>{result.positions.squat}</td>
                    </>
                  )}
                  
                  {/* Supino */}
                  {hasBench && (
                    <>
                      <td>
                        <span className={`attempt ${result.benchAttempts[0] && result.benchStatus[0] === 1 ? 'valid' : result.benchAttempts[0] && result.benchStatus[0] === 2 ? 'invalid' : 'empty'}`}>
                          {result.benchAttempts[0] || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`attempt ${result.benchAttempts[1] && result.benchStatus[1] === 1 ? 'valid' : result.benchAttempts[1] && result.benchStatus[1] === 2 ? 'invalid' : 'empty'}`}>
                          {result.benchAttempts[1] || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`attempt ${result.benchAttempts[2] && result.benchStatus[2] === 1 ? 'valid' : result.benchAttempts[2] && result.benchStatus[2] === 2 ? 'invalid' : 'empty'}`}>
                          {result.benchAttempts[2] || '-'}
                        </span>
                      </td>
                      <td className="fw-bold text-success">{result.bench}</td>
                      <td>{result.positions.bench}</td>
                    </>
                  )}
                  
                  {/* Levantamento Terra */}
                  {hasDeadlift && (
                    <>
                      <td>
                        <span className={`attempt ${result.deadliftAttempts[0] && result.deadliftStatus[0] === 1 ? 'valid' : result.deadliftAttempts[0] && result.deadliftStatus[0] === 2 ? 'invalid' : 'empty'}`}>
                          {result.deadliftAttempts[0] || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`attempt ${result.deadliftAttempts[1] && result.deadliftStatus[1] === 1 ? 'valid' : result.deadliftAttempts[1] && result.deadliftStatus[1] === 2 ? 'invalid' : 'empty'}`}>
                          {result.deadliftAttempts[1] || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`attempt ${result.deadliftAttempts[2] && result.deadliftStatus[2] === 1 ? 'valid' : result.deadliftAttempts[2] && result.deadliftStatus[2] === 2 ? 'invalid' : 'empty'}`}>
                          {result.deadliftAttempts[2] || '-'}
                        </span>
                      </td>
                      <td className="fw-bold text-success">{result.deadlift}</td>
                      <td>{result.positions.deadlift}</td>
                    </>
                  )}
                  
                  {/* Total */}
                  <td className="total">{calculateTotalForModalidade(result)}</td>
                  <td className="indice">{result.points.toFixed(2)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
        );
  };


    return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-0">
                <FaTrophy className="me-2 text-warning" />
                Resultados da Competição
              </h2>
              <p className="text-muted mb-0">
                {meet.name} - {meet.city} - {meet.date}
              </p>
              {(shouldAutoOverflow().singleDay || shouldAutoOverflow().singlePlatform) && (
                <small className="text-info">
                  <strong>Configuração:</strong> {meet.lengthDays} dia(s), {meet.platformsOnDays.join(', ')} plataforma(s) por dia
                </small>
              )}
            </div>
            <ButtonGroup>
              <Button variant="outline-primary" onClick={exportToCSV}>
                <FaFileCsv className="me-2" />
                Exportar CSV
              </Button>
              <Button variant="outline-primary" onClick={exportToPDF}>
                <FaFilePdf className="me-2" />
                Exportar PDF
              </Button>
              <Button 
                variant="outline-success" 
                onClick={handleImportResults}
                disabled={!meet.name || calculatedResults.length === 0}
                title={!meet.name ? 'Configure o nome da competição primeiro' : calculatedResults.length === 0 ? 'Não há resultados para importar' : 'Importar resultados para o Firebase'}
              >
                <FaCloudUploadAlt className="me-2" />
                Importar Resultados
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      {/* Sistema de Abas */}
      <Row className="mb-4">
        <Col>
          <Nav variant="tabs" className="border-bottom">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'complete'}
                onClick={() => setActiveTab('complete')}
                className="fw-bold"
              >
                <FaTrophy className="me-2" />
                Resultados Completos
              </Nav.Link>
            </Nav.Item>

            <Nav.Item>
                          <Nav.Link 
              active={activeTab === 'simplified'}
              onClick={() => setActiveTab('simplified')}
              className="fw-bold"
            >
              <FaMedal className="me-2" />
              Melhor Atleta
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'teams'}
              onClick={() => setActiveTab('teams')}
              className="fw-bold"
            >
              <FaUsers className="me-2" />
              Melhor Equipe
            </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>



      {/* Conteúdo das Abas */}
      {activeTab === 'complete' && (
        <>
                {/* Filtros */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Filtros e Ordenação</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Dia</Form.Label>
                    <Form.Select 
                      value={selectedDay} 
                      onChange={(e) => setSelectedDay(Number(e.target.value))}
                      disabled={shouldAutoOverflow().singleDay}
                    >
                      <option value={0}>Todos os dias</option>
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
                    <Form.Label>Divisão</Form.Label>
                    <Form.Select 
                      value={selectedDivision} 
                      onChange={(e) => setSelectedDivision(e.target.value)}
                    >
                      <option value="all">Todas as divisões</option>
                      {meet.divisions.map(div => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Sexo</Form.Label>
                    <Form.Select 
                      value={selectedSex} 
                      onChange={(e) => setSelectedSex(e.target.value as 'M' | 'F' | 'all')}
                    >
                      <option value="all">Todos</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Modalidade</Form.Label>
                    <Form.Select 
                      value={selectedEquipment} 
                      onChange={(e) => setSelectedEquipment(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="Raw">Clássica</option>
                      <option value="Equipped">Equipado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Tipo de Competição</Form.Label>
                                         <Form.Select 
                       value={selectedCompetitionType} 
                       onChange={(e) => setSelectedCompetitionType(e.target.value)}
                     >
                       <option value="all">Todos</option>
                       {getUniqueCompetitionTypes().map(type => (
                         <option key={type} value={type}>{getCompetitionTypeDisplayName(type)}</option>
                       ))}
                     </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Equipe</Form.Label>
                    <Form.Select 
                      value={selectedTeam} 
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      {getUniqueTeams().map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Ordenar por</Form.Label>
                    <Form.Select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="total">Total</option>
                      <option value="points">Pontos IPF GL</option>
                      <option value="squat">Agachamento</option>
                      <option value="bench">Supino</option>
                      <option value="deadlift">Terra</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Ordem</Form.Label>
                    <div>
                      <ButtonGroup>
                        <Button 
                          variant={sortOrder === 'desc' ? 'primary' : 'outline-primary'}
                          onClick={() => setSortOrder('desc')}
                        >
                          <FaSortDown className="me-1" />
                          Decrescente
                        </Button>
                        <Button 
                          variant={sortOrder === 'asc' ? 'primary' : 'outline-primary'}
                          onClick={() => setSortOrder('asc')}
                        >
                          <FaSortUp className="me-1" />
                          Crescente
                        </Button>
                      </ButtonGroup>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

             {/* Filtros Ativos e Estatísticas */}
       <Row className="mb-3">
         <Col>
           <Card className="bg-light border-info">
             <Card.Body className="py-2">
               <div className="d-flex align-items-center justify-content-between">
                 <div className="d-flex align-items-center">
                   <strong className="text-info me-2">Filtros Ativos:</strong>
                   <div className="d-flex flex-wrap gap-2">
                     {(() => {
                       const activeFilters = [];
                       
                       if (selectedDay > 0) {
                         activeFilters.push(`Dia ${selectedDay}`);
                       }
                       if (selectedDivision !== 'all') {
                         activeFilters.push(`Divisão: ${selectedDivision}`);
                       }
                       if (selectedSex !== 'all') {
                         activeFilters.push(`Sexo: ${selectedSex === 'M' ? 'Masculino' : 'Feminino'}`);
                       }
                       if (selectedEquipment !== 'all') {
                         activeFilters.push(`Modalidade: ${selectedEquipment === 'Raw' ? 'Clássica' : 'Equipado'}`);
                       }
                       if (selectedCompetitionType !== 'all') {
                         activeFilters.push(`Tipo: ${getCompetitionTypeDisplayName(selectedCompetitionType)}`);
                       }
                       if (selectedTeam !== 'all') {
                         activeFilters.push(`Equipe: ${selectedTeam}`);
                       }
                       
                       if (activeFilters.length === 0) {
                         return <span className="text-muted">Nenhum filtro ativo</span>;
                       }
                       
                       return activeFilters.map((filter, index) => (
                         <Badge key={index} bg="info" className="me-1">
                           {filter}
                         </Badge>
                       ));
                     })()}
                   </div>
                 </div>
                 
                 <div className="d-flex align-items-center gap-3">
                   <div className="text-muted small">
                     <strong>{calculatedResults.length}</strong> atleta{calculatedResults.length !== 1 ? 's' : ''} exibido{calculatedResults.length !== 1 ? 's' : ''}
                   </div>
                   <Button 
                     variant="outline-danger" 
                     size="sm"
                     onClick={() => {
                       setSelectedDay(0);
                       setSelectedDivision('all');
                       setSelectedSex('all');
                       setSelectedEquipment('all');
                       setSelectedCompetitionType('all');
                       setSelectedTeam('all');
                     }}
                   >
                     Limpar Filtros
                   </Button>
                 </div>
               </div>
             </Card.Body>
           </Card>
         </Col>
       </Row>
        </>
      )}

      {/* Renderizar conteúdo baseado na aba ativa */}
      {activeTab === 'complete' && (
        <>
          {/* Resultados por Categoria */}
          {resultsByCategory.map((category, categoryIndex) => (
            <Row key={categoryIndex} className="mb-4">
              <Col>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <FaTrophy className="me-2 text-warning" />
                      {category.category}
                      <Badge bg="info" className="ms-2">
                        {category.results.length} atletas
                      </Badge>
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                                         <div className="overflow-auto">
                       <table className="complete-results-table">
                         {/* Cabeçalho principal */}
                         <thead>
                           {(() => {
                             const { hasSquat, hasBench, hasDeadlift } = getCategoryMovements(category.category);
                             const colSpans = getDynamicColSpans(category.category);
                             
                             return (
                               <>
                                 <tr className="main-header">
                                   <th colSpan={colSpans.baseColSpan} className="section-basic">
                                     Dados do Atleta
                                   </th>
                                   {hasSquat && (
                                     <th colSpan={colSpans.squatColSpan} className="section-squat">
                                       Agachamento
                                     </th>
                                   )}
                                   {hasBench && (
                                     <th colSpan={colSpans.benchColSpan} className="section-bench">
                                       Supino
                                     </th>
                                   )}
                                   {hasDeadlift && (
                                     <th colSpan={colSpans.deadliftColSpan} className="section-deadlift">
                                       Terra
                                     </th>
                                   )}
                                   <th colSpan={colSpans.resultColSpan} className="section-result">
                                     Resultado
                                   </th>
                                 </tr>
                                 
                                 {/* Cabeçalho das colunas específicas */}
                                 <tr className="columns-header">
                                   {/* Dados do Atleta */}
                                   <th>Pos</th>
                                   <th>Atleta</th>
                                   <th>Categoria</th>
                                   <th>Peso</th>
                                   <th>Nº Lote</th>
                                   <th>Equipe</th>
                                   
                                   {/* Agachamento */}
                                   {hasSquat && (
                                     <>
                                       <th>A1</th>
                                       <th>A2</th>
                                       <th>A3</th>
                                       <th>Melhor</th>
                                       <th>Pos</th>
                                     </>
                                   )}
                                   
                                   {/* Supino */}
                                   {hasBench && (
                                     <>
                                       <th>S1</th>
                                       <th>S2</th>
                                       <th>S3</th>
                                       <th>Melhor</th>
                                       <th>Pos</th>
                                     </>
                                   )}
                                   
                                   {/* Terra */}
                                   {hasDeadlift && (
                                     <>
                                       <th>T1</th>
                                       <th>T2</th>
                                       <th>T3</th>
                                       <th>Melhor</th>
                                       <th>Pos</th>
                                     </>
                                   )}
                                   
                                   {/* Resultado */}
                                   <th>Total</th>
                                   <th>IPF GL Points</th>
                                 </tr>
                               </>
                             );
                           })()}
                         </thead>
                        
                        <tbody>
                          {category.results.map((result, index) => {
                            const { hasSquat, hasBench, hasDeadlift } = getCategoryMovements(category.category);
                            
                            return (
                              <tr key={result.entry.id}>
                                {/* Posição */}
                                <td className="text-center">
                                  <div className="d-flex align-items-center justify-content-center">
                                    {getMedalIcon(index + 1)}
                                    <span className="ms-1 fw-bold">{index + 1}</span>
                                  </div>
                                </td>
                                
                                {/* Dados do atleta */}
                                <td className="athlete">{result.entry.name}</td>
                                <td className="text-center">{result.entry.weightClass || '-'}</td>
                                <td className="text-center">{result.entry.bodyweightKg || '-'}kg</td>
                                <td className="text-center">{result.entry.lotNumber || '-'}</td>
                                <td className="team">{result.entry.team || '-'}</td>
                                
                                {/* Agachamento */}
                                {hasSquat && (
                                  <>
                                    <td className="text-center">{result.entry.squat1 || '-'}</td>
                                    <td className="text-center">{result.entry.squat2 || '-'}</td>
                                    <td className="text-center">{result.entry.squat3 || '-'}</td>
                                    <td className="fw-bold text-success">{result.squat > 0 ? `${result.squat}kg` : '-'}</td>
                                    <td className="text-center">{result.positions.squat > 0 ? `${result.positions.squat}º` : '-'}</td>
                                  </>
                                )}
                                
                                {/* Supino */}
                                {hasBench && (
                                  <>
                                    <td className="text-center">{result.entry.bench1 || '-'}</td>
                                    <td className="text-center">{result.entry.bench2 || '-'}</td>
                                    <td className="text-center">{result.entry.bench3 || '-'}</td>
                                    <td className="fw-bold text-success">{result.bench > 0 ? `${result.bench}kg` : '-'}</td>
                                    <td className="text-center">{result.positions.bench > 0 ? `${result.positions.bench}º` : '-'}</td>
                                  </>
                                )}
                                
                                {/* Terra */}
                                {hasDeadlift && (
                                  <>
                                    <td className="text-center">{result.entry.deadlift1 || '-'}</td>
                                    <td className="text-center">{result.entry.deadlift2 || '-'}</td>
                                    <td className="text-center">{result.entry.deadlift3 || '-'}</td>
                                    <td className="fw-bold text-success">{result.deadlift > 0 ? `${result.deadlift}kg` : '-'}</td>
                                    <td className="text-center">{result.positions.deadlift > 0 ? `${result.positions.deadlift}º` : '-'}</td>
                                  </>
                                )}
                                
                                {/* Resultado */}
                                <td className="total text-center">
                                  <span className="fw-bold text-primary fs-5">
                                    {result.total}kg
                                  </span>
                                </td>
                                <td className="indice text-center">
                                  <span className="fw-bold text-success">
                                    {result.points.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ))}
        </>
      )}



      {activeTab === 'simplified' && (
        <SimplifiedResults />
      )}

      {activeTab === 'teams' && (
        <TeamResults />
      )}

      {activeTab === 'teamMedals' && (
        <div>
          <Row className="mb-4">
            <Col>
              <Card className="bg-light">
                <Card.Body className="text-center">
                  <h4 className="text-primary mb-3">
                    <FaMedal className="me-2" />
                    Medalhas por Equipe - Divisão OPEN
                  </h4>
                  <p className="text-muted">
                    <strong>Sistema de Pontuação:</strong> 1º=12, 2º=9, 3º=8, 4º=7, 5º=6, 6º=5, 7º=4, 8º=3, 9º=2, 10º+=1
                  </p>
                  <p className="text-muted">
                    <strong>Regra:</strong> Contam apenas os 5 melhores resultados de cada equipe por modalidade
                  </p>
                  <p className="text-info">
                    <strong>Exemplo:</strong> Equipe com 3 ouros + 2 pratas = (3×12) + (2×9) = 54 pontos
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Alert variant="info" className="text-center">
                <FaMedal className="me-2" />
                <strong>Funcionalidade em desenvolvimento:</strong> A aba de Medalhas por Equipe está sendo implementada.
                <br />
                Em breve você poderá ver o ranking completo de medalhas por equipe na divisão OPEN.
              </Alert>
            </Col>
          </Row>
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {calculatedResults.length === 0 && (
        <Row>
          <Col>
            <Alert variant="info" className="text-center">
              <FaTrophy size={48} className="mb-3" />
              <h4>Nenhum resultado encontrado</h4>
              <p>
                Não há resultados para os filtros selecionados. 
                Verifique se os atletas completaram suas tentativas.
              </p>
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Results;