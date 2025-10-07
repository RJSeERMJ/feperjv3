import React from 'react';
import { ResultadoImportado } from '../services/resultadoImportadoService';
import '../styles/cblb-results.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CBLBResultsDisplayProps {
  resultado: ResultadoImportado;
}

const CBLBResultsDisplay: React.FC<CBLBResultsDisplayProps> = ({ resultado }) => {
  // Estado para controlar a modalidade ativa
  const [modalidadeAtiva, setModalidadeAtiva] = React.useState<'powerlifting' | 'supino'>('powerlifting');
  // Estado para controlar o gênero ativo
  const [generoAtivo, setGeneroAtivo] = React.useState<'masculino' | 'feminino'>('masculino');
  // Estado para controlar o equipamento ativo
  const [equipamentoAtivo, setEquipamentoAtivo] = React.useState<'classico' | 'equipado'>('classico');
  

  // Detectar modalidade automaticamente quando o componente é montado
  React.useEffect(() => {
    const detectarApenasSupino = () => {
      if (!resultado.results) return false;

      let totalAtletas = 0;
      let atletasApenasSupino = 0; // Atletas que têm APENAS supino (S)

      // Analisar todos os atletas
      const analisarAtletas = (atletas: any[]) => {
        atletas.forEach((atleta: any) => {
          totalAtletas++;
          const movements = atleta.entry?.movements || atleta.movements || '';
          
          // Verificar se tem APENAS supino (S) - sem agachamento e terra
          const temApenasSupino = (movements === 'S' || movements === 'B' || movements === 'BENCH') && 
                                 !movements.includes('A') && 
                                 !movements.includes('T') && 
                                 !movements.includes('SQUAT') && 
                                 !movements.includes('DEADLIFT');
          
          if (temApenasSupino) {
            atletasApenasSupino++;
          }
        });
      };

      // Analisar resultados completos
      if (resultado.results.complete && Array.isArray(resultado.results.complete)) {
        resultado.results.complete.forEach((categoriaData: any) => {
          if (categoriaData.results) {
            analisarAtletas(categoriaData.results);
          }
        });
      }

      // Analisar resultados simplificados
      if (resultado.results.simplified && Array.isArray(resultado.results.simplified)) {
        analisarAtletas(resultado.results.simplified);
      }

      // Analisar resultados diretos
      if (Array.isArray(resultado.results)) {
        analisarAtletas(resultado.results);
      }

      // Se TODOS os atletas têm apenas supino (S), é uma competição só supino
      return totalAtletas > 0 && atletasApenasSupino === totalAtletas;
    };

    const detectarModalidadeCompeticao = () => {
      if (!resultado.results) {
        return 'powerlifting';
      }

      // Primeiro, verificar se é uma competição apenas de supino
      if (detectarApenasSupino()) {
        return 'supino';
      }

      // Se há resultados completos (array de categorias)
      if (resultado.results.complete && Array.isArray(resultado.results.complete)) {
        let atletasPowerlifting = 0;
        let atletasSupino = 0;
        
        resultado.results.complete.forEach((categoriaData: any) => {
          if (categoriaData.category && categoriaData.results) {
            categoriaData.results.forEach((atleta: any) => {
              const movements = atleta.entry?.movements || atleta.movements || '';
              const categoriaNome = categoriaData.category.toLowerCase();
              
              // Detectar se é powerlifting (AST, SBD) ou supino (B, BENCH)
              if (movements.includes('AST') || 
                  movements.includes('SBD') || 
                  categoriaNome.includes('powerlifting')) {
                atletasPowerlifting++;
              } else if (movements.includes('B') || 
                         movements.includes('BENCH') || 
                         categoriaNome.includes('supino')) {
                atletasSupino++;
              }
            });
          }
        });
        
        // Se há mais atletas de supino que powerlifting, é uma competição de supino
        if (atletasSupino > atletasPowerlifting && atletasSupino > 0) {
          return 'supino';
        } else if (atletasPowerlifting > 0) {
          return 'powerlifting';
        }
      }

      // Se há resultados simplificados
      if (resultado.results.simplified && Array.isArray(resultado.results.simplified)) {
        let atletasPowerlifting = 0;
        let atletasSupino = 0;
        
        resultado.results.simplified.forEach((atleta: any) => {
          const movements = atleta.entry?.movements || atleta.movements || '';
          
          if (movements.includes('AST') || movements.includes('SBD')) {
            atletasPowerlifting++;
          } else if (movements.includes('B') || movements.includes('BENCH')) {
            atletasSupino++;
          }
        });
        
        if (atletasSupino > atletasPowerlifting && atletasSupino > 0) {
          return 'supino';
        }
      }

      // Se há resultados diretos (array)
      if (Array.isArray(resultado.results)) {
        let atletasPowerlifting = 0;
        let atletasSupino = 0;
        
        resultado.results.forEach((atleta: any) => {
          const movements = atleta.entry?.movements || atleta.movements || '';
          
          if (movements.includes('AST') || movements.includes('SBD')) {
            atletasPowerlifting++;
          } else if (movements.includes('B') || movements.includes('BENCH')) {
            atletasSupino++;
          }
        });
        
        if (atletasSupino > atletasPowerlifting && atletasSupino > 0) {
          return 'supino';
        }
      }
      
      return 'powerlifting';
    };

    const modalidadeDetectada = detectarModalidadeCompeticao();
    setModalidadeAtiva(modalidadeDetectada);
  }, [resultado]);

  // Função para detectar se há apenas atletas de supino (baseado na inscrição - movimento "S")
  const detectarApenasSupino = () => {
    if (!resultado.results) return false;

    let totalAtletas = 0;
    let atletasApenasSupino = 0; // Atletas que têm APENAS supino (S)

    // Analisar todos os atletas
    const analisarAtletas = (atletas: any[]) => {
      atletas.forEach((atleta: any) => {
        totalAtletas++;
        const movements = atleta.entry?.movements || atleta.movements || '';
        
        // Verificar se tem APENAS supino (S) - sem agachamento e terra
        const temApenasSupino = (movements === 'S' || movements === 'B' || movements === 'BENCH') && 
                               !movements.includes('A') && 
                               !movements.includes('T') && 
                               !movements.includes('SQUAT') && 
                               !movements.includes('DEADLIFT');
        
        if (temApenasSupino) {
          atletasApenasSupino++;
        }
      });
    };

    // Analisar resultados completos
    if (resultado.results.complete && Array.isArray(resultado.results.complete)) {
      resultado.results.complete.forEach((categoriaData: any) => {
        if (categoriaData.results) {
          analisarAtletas(categoriaData.results);
        }
      });
    }

    // Analisar resultados simplificados
    if (resultado.results.simplified && Array.isArray(resultado.results.simplified)) {
      analisarAtletas(resultado.results.simplified);
    }

    // Analisar resultados diretos
    if (Array.isArray(resultado.results)) {
      analisarAtletas(resultado.results);
    }

    // Se TODOS os atletas têm apenas supino (S), é uma competição só supino
    return totalAtletas > 0 && atletasApenasSupino === totalAtletas;
  };
  
  // Função para exportar PDF com todos os resultados
  const exportarPDF = async () => {
    try {
      // Salvar estados atuais
      const modalidadeOriginal = modalidadeAtiva;
      const equipamentoOriginal = equipamentoAtivo;
      const generoOriginal = generoAtivo;

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Array com todas as combinações possíveis
      const combinacoes = [
        { modalidade: 'powerlifting', equipamento: 'classico', genero: 'masculino' },
        { modalidade: 'powerlifting', equipamento: 'classico', genero: 'feminino' },
        { modalidade: 'powerlifting', equipamento: 'equipado', genero: 'masculino' },
        { modalidade: 'powerlifting', equipamento: 'equipado', genero: 'feminino' },
        { modalidade: 'supino', equipamento: 'classico', genero: 'masculino' },
        { modalidade: 'supino', equipamento: 'classico', genero: 'feminino' },
        { modalidade: 'supino', equipamento: 'equipado', genero: 'masculino' },
        { modalidade: 'supino', equipamento: 'equipado', genero: 'feminino' }
      ];

      let primeiraPagina = true;

      for (const combinacao of combinacoes) {
        // Aplicar filtros
        setModalidadeAtiva(combinacao.modalidade as 'powerlifting' | 'supino');
        setEquipamentoAtivo(combinacao.equipamento as 'classico' | 'equipado');
        setGeneroAtivo(combinacao.genero as 'masculino' | 'feminino');

        // Aguardar um pouco para o estado atualizar
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar se há resultados para esta combinação
        const resultadosAtuais = processarResultados();
        if (Object.keys(resultadosAtuais).length === 0) {
          continue; // Pular se não há resultados
        }

        // Capturar o elemento
        const element = document.getElementById('resultados');
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: element.scrollWidth,
          height: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 297;
        const pageHeight = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (!primeiraPagina) {
          pdf.addPage();
        }
        primeiraPagina = false;

        // Adicionar título da seção
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        const titulo = `${combinacao.modalidade.toUpperCase()} - ${combinacao.equipamento.toUpperCase()} - ${combinacao.genero.toUpperCase()}`;
        pdf.text(titulo, 10, 20);

        // Adicionar imagem
        pdf.addImage(imgData, 'PNG', 10, 30, imgWidth - 20, imgHeight - 20);

        // Verificar se precisa de mais páginas para esta seção
        let heightLeft = imgHeight - 20;
        let position = 30;

        while (heightLeft > pageHeight - 30) {
          pdf.addPage();
          position = heightLeft - imgHeight + 20;
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth - 20, imgHeight - 20);
          heightLeft -= (pageHeight - 30);
        }
      }

      // Restaurar estados originais
      setModalidadeAtiva(modalidadeOriginal);
      setEquipamentoAtivo(equipamentoOriginal);
      setGeneroAtivo(generoOriginal);

      // Nome do arquivo
      const nomeArquivo = `${resultado.competitionName}_TODOS_RESULTADOS.pdf`
        .replace(/[^a-zA-Z0-9]/g, '_');

      // Salvar PDF
      pdf.save(nomeArquivo);
      
      console.log('PDF com todos os resultados exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };
  

  // Função para processar os resultados e organizá-los por categoria de peso
  const processarResultados = () => {
    if (!resultado.results) {
      return {};
    }

    // Se há resultados completos (array de categorias)
    if (resultado.results.complete && Array.isArray(resultado.results.complete)) {
      const resultadosPorCategoriaPeso: { [key: string]: any[] } = {};
      
      resultado.results.complete.forEach((categoriaData: any) => {
        if (categoriaData.category && categoriaData.results) {
          // Filtrar por modalidade ativa e gênero
          const atletasFiltrados = categoriaData.results.filter((atleta: any) => {
            const movements = atleta.entry?.movements || atleta.movements || '';
            const sexo = atleta.entry?.sex || atleta.sex || '';
            const equipment = atleta.entry?.equipment || atleta.equipment || '';
            
            // Filtro por modalidade baseado na inscrição (movements) e nome da categoria
            let modalidadeMatch = false;
            if (modalidadeAtiva === 'powerlifting') {
              // Powerlifting: AST, SBD, ou categoria contém "Powerlifting"
              modalidadeMatch = movements.includes('AST') || 
                               movements.includes('SBD') || 
                               categoriaData.category.toLowerCase().includes('powerlifting') ||
                               categoriaData.category.toLowerCase().includes('clássica') ||
                               categoriaData.category.toLowerCase().includes('classica');
            } else if (modalidadeAtiva === 'supino') {
              // Supino: S (movimento único), B, BENCH, ou categoria contém "Supino"
              modalidadeMatch = movements === 'S' || // Movimento único S (só supino)
                               movements.includes('B') || 
                               movements.includes('BENCH') || 
                               categoriaData.category.toLowerCase().includes('supino') ||
                               // Detectar se é só supino baseado na ausência de agachamento e terra
                               (movements.length === 1 && (movements.includes('B') || movements.includes('S'))) ||
                               // Detectar se a categoria indica supino
                               categoriaData.category.toLowerCase().includes('bench');
            }
            
            // Filtro por equipamento (Clássico vs Equipado)
            let equipamentoMatch = false;
            if (equipamentoAtivo === 'classico') {
              // Clássico: Raw, Classic, ou categoria contém "Clássica"
              equipamentoMatch = equipment.toLowerCase().includes('raw') || 
                                equipment.toLowerCase().includes('classic') ||
                                categoriaData.category.toLowerCase().includes('clássica') ||
                                categoriaData.category.toLowerCase().includes('classica');
            } else if (equipamentoAtivo === 'equipado') {
              // Equipado: Equipped, ou categoria contém "Equipado"
              equipamentoMatch = equipment.toLowerCase().includes('equipped') ||
                                categoriaData.category.toLowerCase().includes('equipado');
            }
            
            // Filtro por gênero (para powerlifting e supino)
            let generoMatch = (generoAtivo === 'masculino' && sexo === 'M') || 
                             (generoAtivo === 'feminino' && sexo === 'F');
            
            return modalidadeMatch && equipamentoMatch && generoMatch;
          });
          
          if (atletasFiltrados.length > 0) {
            // Extrair apenas o peso da categoria para aglutinar (ex: "Open - 93,0 kg - Clássica - Powerlifting (AST)" -> "93,0 kg")
            const pesoMatch = categoriaData.category.match(/(\d+(?:,\d+)?)\s*kg/i);
            const categoriaPeso = pesoMatch ? `${pesoMatch[1]} kg` : 'Sem categoria';
            
            if (!resultadosPorCategoriaPeso[categoriaPeso]) {
              resultadosPorCategoriaPeso[categoriaPeso] = [];
            }
            
            // Adicionar todos os atletas filtrados à categoria de peso
            resultadosPorCategoriaPeso[categoriaPeso].push(...atletasFiltrados);
          }
        }
      });

      // CORREÇÃO: Filtrar atletas por modalidade específica (não desduplicar)
      Object.keys(resultadosPorCategoriaPeso).forEach(categoriaPeso => {
        const atletas = resultadosPorCategoriaPeso[categoriaPeso];
        
        // Filtrar atletas que correspondem EXATAMENTE à modalidade ativa
        const atletasFiltrados = atletas.filter(atleta => {
          const movements = atleta.entry?.movements || atleta.movements || '';
          
          if (modalidadeAtiva === 'powerlifting') {
            // Para Powerlifting: deve ter AST ou SBD (movimentos completos)
            return movements.includes('AST') || movements.includes('SBD');
          } else if (modalidadeAtiva === 'supino') {
            // Para Supino: deve ter apenas S, B ou BENCH (movimentos de supino)
            return movements === 'S' || movements.includes('B') || movements.includes('BENCH');
          }
          
          return true;
        });
        
        // Ordenar por total (descendente)
        resultadosPorCategoriaPeso[categoriaPeso] = atletasFiltrados.sort((a, b) => {
          const totalA = a.total || 0;
          const totalB = b.total || 0;
          return totalB - totalA;
        });
      });

      return resultadosPorCategoriaPeso;
    }

    // Se há resultados simplificados
    if (resultado.results.simplified && Array.isArray(resultado.results.simplified)) {
      return { 'Geral': resultado.results.simplified };
    }

    // Se há resultados diretos (array)
    if (Array.isArray(resultado.results)) {
      return { 'Geral': resultado.results };
    }

    return {};
  };

  // Função para determinar classe CSS da tentativa
  const getAttemptClass = (attempt: number, best: number) => {
    if (attempt === 0) return 'zerou';
    if (attempt === best) return 'lift';
    return 'nolift';
  };

  // Função para renderizar uma linha de atleta
  const renderizarLinhaAtleta = (atleta: any, index: number) => {
    const nomeAtleta = atleta.entry?.name || atleta.name || 'Nome não disponível';
    const uf = atleta.entry?.state || atleta.state || 'N/A';
    const equipe = atleta.entry?.team || atleta.team || 'Equipe não disponível';
    const nascimento = atleta.entry?.birthDate ? new Date(atleta.entry.birthDate).getFullYear() : null;
    const peso = atleta.entry?.bodyweightKg || atleta.entry?.weightClassKg || '0.00';
    
    // Tentativas de agachamento
    const squat1 = atleta.squatAttempts?.[0] || atleta.squat || 0;
    const squat2 = atleta.squatAttempts?.[1] || 0;
    const squat3 = atleta.squatAttempts?.[2] || 0;
    const squatBest = atleta.bestAttempts?.squat || atleta.squat || Math.max(squat1, squat2, squat3);
    const squatPos = atleta._squatPosCategoria || atleta.positions?.squat || index + 1;
    
    // Tentativas de supino
    const bench1 = atleta.benchAttempts?.[0] || atleta.bench || 0;
    const bench2 = atleta.benchAttempts?.[1] || 0;
    const bench3 = atleta.benchAttempts?.[2] || 0;
    const benchBest = atleta.bestAttempts?.bench || atleta.bench || Math.max(bench1, bench2, bench3);
    const benchPos = atleta._benchPosCategoria || atleta.positions?.bench || index + 1;
    
    // Tentativas de levantamento terra
    const deadlift1 = atleta.deadliftAttempts?.[0] || atleta.deadlift || 0;
    const deadlift2 = atleta.deadliftAttempts?.[1] || 0;
    const deadlift3 = atleta.deadliftAttempts?.[2] || 0;
    const deadliftBest = atleta.bestAttempts?.deadlift || atleta.deadlift || Math.max(deadlift1, deadlift2, deadlift3);
    const deadliftPos = atleta._deadliftPosCategoria || atleta.positions?.deadlift || index + 1;
    
    // Total geral
    const total = atleta.total || (squatBest + benchBest + deadliftBest);
    
    // Usar a categoria de inscrição do atleta em vez de calcular pela idade
    const categoriaInscricao = atleta.entry?.division || atleta.division || '';
    
    // Função para mapear categoria de inscrição para categoria de idade
    const mapearCategoria = (categoria: string): string => {
      // Normalizar categoria para comparação
      const categoriaNormalizada = categoria.trim().toLowerCase();
      
      // Verificar exatamente primeiro (mais específico)
      if (categoriaNormalizada === 'sj' || categoriaNormalizada === 'sub-júnior' || categoriaNormalizada === 'sub-junior') {
        return 'SJ';
      }
      if (categoriaNormalizada === 'jr' || categoriaNormalizada === 'júnior' || categoriaNormalizada === 'junior') {
        return 'JR';
      }
      if (categoriaNormalizada === 'op' || categoriaNormalizada === 'open') {
        return 'OP';
      }
      if (categoriaNormalizada === 'm1' || categoriaNormalizada === 'master 1' || categoriaNormalizada === 'master1') {
        return 'M1';
      }
      if (categoriaNormalizada === 'm2' || categoriaNormalizada === 'master 2' || categoriaNormalizada === 'master2') {
        return 'M2';
      }
      if (categoriaNormalizada === 'm3' || categoriaNormalizada === 'master 3' || categoriaNormalizada === 'master3') {
        return 'M3';
      }
      if (categoriaNormalizada === 'm4' || categoriaNormalizada === 'master 4' || categoriaNormalizada === 'master4' || categoriaNormalizada === 'master iv') {
        return 'M4';
      }
      
      // Verificar por includes (menos específico)
      if (categoriaNormalizada.includes('sub-júnior') || categoriaNormalizada.includes('sub-junior')) {
        return 'SJ';
      }
      if (categoriaNormalizada.includes('júnior') || categoriaNormalizada.includes('junior')) {
        return 'JR';
      }
      if (categoriaNormalizada.includes('open')) {
        return 'OP';
      }
      if (categoriaNormalizada.includes('master 1') || categoriaNormalizada.includes('master1')) {
        return 'M1';
      }
      if (categoriaNormalizada.includes('master 2') || categoriaNormalizada.includes('master2')) {
        return 'M2';
      }
      if (categoriaNormalizada.includes('master 3') || categoriaNormalizada.includes('master3')) {
        return 'M3';
      }
      if (categoriaNormalizada.includes('master 4') || categoriaNormalizada.includes('master4') || categoriaNormalizada.includes('master iv')) {
        return 'M4';
      }
      
      return '';
    };
    
    const categoriaIdade = mapearCategoria(categoriaInscricao);
    
    
    return (
      <tr key={index} className="titatleta">
                  <td style={{ whiteSpace: 'nowrap' }} id={atleta.id || index}>
                    <button 
                      className="chamada" 
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      title="Clique no nome do atleta para exibir informações"
                    >
                      &nbsp;{nomeAtleta}&nbsp;
                    </button>
                  </td>
        <td align="center">&nbsp;{uf}&nbsp;</td>
        <td style={{ whiteSpace: 'nowrap' }}>&nbsp;{equipe}&nbsp;</td>
        <td align="center">&nbsp;{nascimento}&nbsp;</td>
        <td align="center">&nbsp;{peso}&nbsp;</td>
        
        {modalidadeAtiva === 'powerlifting' && (
          <>
            {/* Agachamento */}
            <td className={getAttemptClass(squat1, squatBest)}>&nbsp;{squat1}&nbsp;</td>
            <td className={getAttemptClass(squat2, squatBest)}>&nbsp;{squat2}&nbsp;</td>
            <td className={getAttemptClass(squat3, squatBest)}>&nbsp;{squat3}&nbsp;</td>
            <td align="center">{squatBest}</td>
            <td className="posicao"><b>&nbsp;{squatPos}&nbsp;</b></td>
            
            {/* Supino */}
            <td className={getAttemptClass(bench1, benchBest)}>&nbsp;{bench1}&nbsp;</td>
            <td className={getAttemptClass(bench2, benchBest)}>&nbsp;{bench2}&nbsp;</td>
            <td className={getAttemptClass(bench3, benchBest)}>&nbsp;{bench3}&nbsp;</td>
            <td align="center">{benchBest}</td>
            <td className="posicao"><b>&nbsp;{benchPos}&nbsp;</b></td>
            
            {/* Levantamento Terra */}
            <td className={getAttemptClass(deadlift1, deadliftBest)}>&nbsp;{deadlift1}&nbsp;</td>
            <td className={getAttemptClass(deadlift2, deadliftBest)}>&nbsp;{deadlift2}&nbsp;</td>
            <td className={getAttemptClass(deadlift3, deadliftBest)}>&nbsp;{deadlift3}&nbsp;</td>
            <td align="center">{deadliftBest}</td>
            <td className="posicao"><b>&nbsp;{deadliftPos}&nbsp;</b></td>
            
            {/* Total */}
            <td align="center" style={{ backgroundColor: '#FFFF99' }}>
              &nbsp;{total}&nbsp;
            </td>
          </>
        )}
        
        {modalidadeAtiva === 'supino' && (
          <>
            {/* Supino */}
            <td className={getAttemptClass(bench1, benchBest)}>&nbsp;{bench1}&nbsp;</td>
            <td className={getAttemptClass(bench2, benchBest)}>&nbsp;{bench2}&nbsp;</td>
            <td className={getAttemptClass(bench3, benchBest)}>&nbsp;{bench3}&nbsp;</td>
            <td align="center">{benchBest}</td>
            <td className="posicao"><b>&nbsp;{benchPos}&nbsp;</b></td>
            
            {/* Total */}
            <td align="center" style={{ backgroundColor: '#FFFF99' }}>
              &nbsp;{benchBest}&nbsp;
            </td>
          </>
        )}
        <td align="center">&nbsp;{(atleta.ipfPoints || atleta.points || 0).toFixed(2)}&nbsp;</td>
        <td align="center"><b>{atleta._posicoesCategoria?.['SJ']?.total || ''}</b></td>
        <td align="center"><b>{atleta._posicoesCategoria?.['JR']?.total || ''}</b></td>
        <td align="center"><b>{atleta._posicoesCategoria?.['OP']?.total || ''}</b></td>
        <td align="center"><b>{atleta._posicoesCategoria?.['M1']?.total || ''}</b></td>
        <td align="center"><b>{atleta._posicoesCategoria?.['M2']?.total || ''}</b></td>
        <td align="center"><b>{atleta._posicoesCategoria?.['M3']?.total || ''}</b></td>
        <td align="center"><b>{atleta._posicoesCategoria?.['M4']?.total || ''}</b></td>
      </tr>
    );
  };

  // Função para calcular posições por modalidade e categoria de idade
  const calcularPosicoes = (atletas: any[]) => {
    // Agrupar atletas por modalidade e categoria de idade
    const atletasPorModalidadeCategoria: { [key: string]: any[] } = {};
    
    // Mapa para rastrear atletas únicos e suas categorias
    const atletasUnicos = new Map<string, any>();
    
    atletas.forEach(atleta => {
      // Usar a categoria de inscrição do atleta
      const categoriaInscricao = atleta.entry?.division || atleta.division || '';
      const modalidade = atleta.entry?.equipment || 'Raw'; // Raw = Clássico, Equipped = Equipado
      const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
      
      // Função para mapear categoria de inscrição para categoria de idade
      const mapearCategoria = (categoria: string): string => {
        // Normalizar categoria para comparação
        const categoriaNormalizada = categoria.trim().toLowerCase();
        
        // Verificar exatamente primeiro (mais específico)
        if (categoriaNormalizada === 'sj' || categoriaNormalizada === 'sub-júnior' || categoriaNormalizada === 'sub-junior') return 'SJ';
        if (categoriaNormalizada === 'jr' || categoriaNormalizada === 'júnior' || categoriaNormalizada === 'junior') return 'JR';
        if (categoriaNormalizada === 'op' || categoriaNormalizada === 'open') return 'OP';
        if (categoriaNormalizada === 'm1' || categoriaNormalizada === 'master 1' || categoriaNormalizada === 'master1') return 'M1';
        if (categoriaNormalizada === 'm2' || categoriaNormalizada === 'master 2' || categoriaNormalizada === 'master2') return 'M2';
        if (categoriaNormalizada === 'm3' || categoriaNormalizada === 'master 3' || categoriaNormalizada === 'master3') return 'M3';
        if (categoriaNormalizada === 'm4' || categoriaNormalizada === 'master 4' || categoriaNormalizada === 'master4' || categoriaNormalizada === 'master iv') return 'M4';
        
        // Verificar por includes (menos específico)
        if (categoriaNormalizada.includes('sub-júnior') || categoriaNormalizada.includes('sub-junior')) return 'SJ';
        if (categoriaNormalizada.includes('júnior') || categoriaNormalizada.includes('junior')) return 'JR';
        if (categoriaNormalizada.includes('open')) return 'OP';
        if (categoriaNormalizada.includes('master 1') || categoriaNormalizada.includes('master1')) return 'M1';
        if (categoriaNormalizada.includes('master 2') || categoriaNormalizada.includes('master2')) return 'M2';
        if (categoriaNormalizada.includes('master 3') || categoriaNormalizada.includes('master3')) return 'M3';
        if (categoriaNormalizada.includes('master 4') || categoriaNormalizada.includes('master4') || categoriaNormalizada.includes('master iv')) return 'M4';
        
        return '';
      };
      
      const categoriaIdade = mapearCategoria(categoriaInscricao);
    
      const chave = `${modalidade}-${categoriaIdade}`;
      
      if (!atletasPorModalidadeCategoria[chave]) {
        atletasPorModalidadeCategoria[chave] = [];
      }
      atletasPorModalidadeCategoria[chave].push(atleta);
      
      // Rastrear atletas únicos e suas categorias
      if (!atletasUnicos.has(atletaId)) {
        atletasUnicos.set(atletaId, {
          ...atleta,
          _categoriasCompetidas: [categoriaIdade],
          _posicoesCategoria: {}
        });
      } else {
        const atletaExistente = atletasUnicos.get(atletaId);
        if (!atletaExistente._categoriasCompetidas.includes(categoriaIdade)) {
          atletaExistente._categoriasCompetidas.push(categoriaIdade);
        }
      }
    });

    // Calcular posições para cada grupo (modalidade + categoria de idade)
    Object.keys(atletasPorModalidadeCategoria).forEach(chave => {
      const atletasGrupo = atletasPorModalidadeCategoria[chave];
      const categoriaIdade = chave.split('-')[1];
      
      // Ordenar por agachamento (descendente)
      atletasGrupo.sort((a, b) => {
        const squatA = a.bestAttempts?.squat || a.squat || 0;
        const squatB = b.bestAttempts?.squat || b.squat || 0;
        return squatB - squatA;
      });
      atletasGrupo.forEach((atleta, index) => {
        atleta._squatPosCategoria = index + 1;
        const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
        const atletaUnico = atletasUnicos.get(atletaId);
        if (atletaUnico) {
          if (!atletaUnico._posicoesCategoria[categoriaIdade]) {
            atletaUnico._posicoesCategoria[categoriaIdade] = {};
          }
          atletaUnico._posicoesCategoria[categoriaIdade].squat = index + 1;
        }
      });

      // Ordenar por supino (descendente)
      atletasGrupo.sort((a, b) => {
        const benchA = a.bestAttempts?.bench || a.bench || 0;
        const benchB = b.bestAttempts?.bench || b.bench || 0;
        return benchB - benchA;
      });
      atletasGrupo.forEach((atleta, index) => {
        atleta._benchPosCategoria = index + 1;
        const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
        const atletaUnico = atletasUnicos.get(atletaId);
        if (atletaUnico) {
          if (!atletaUnico._posicoesCategoria[categoriaIdade]) {
            atletaUnico._posicoesCategoria[categoriaIdade] = {};
          }
          atletaUnico._posicoesCategoria[categoriaIdade].bench = index + 1;
        }
      });

      // Ordenar por levantamento terra (descendente)
      atletasGrupo.sort((a, b) => {
        const deadliftA = a.bestAttempts?.deadlift || a.deadlift || 0;
        const deadliftB = b.bestAttempts?.deadlift || b.deadlift || 0;
        return deadliftB - deadliftA;
      });
      atletasGrupo.forEach((atleta, index) => {
        atleta._deadliftPosCategoria = index + 1;
        const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
        const atletaUnico = atletasUnicos.get(atletaId);
        if (atletaUnico) {
          if (!atletaUnico._posicoesCategoria[categoriaIdade]) {
            atletaUnico._posicoesCategoria[categoriaIdade] = {};
          }
          atletaUnico._posicoesCategoria[categoriaIdade].deadlift = index + 1;
        }
      });

      // Ordenar por total (descendente)
      atletasGrupo.sort((a, b) => {
        const totalA = a.total || 0;
        const totalB = b.total || 0;
        return totalB - totalA;
      });
      atletasGrupo.forEach((atleta, index) => {
        atleta._totalPosCategoria = index + 1;
        const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
        const atletaUnico = atletasUnicos.get(atletaId);
        if (atletaUnico) {
          if (!atletaUnico._posicoesCategoria[categoriaIdade]) {
            atletaUnico._posicoesCategoria[categoriaIdade] = {};
          }
          atletaUnico._posicoesCategoria[categoriaIdade].total = index + 1;
        }
      });
    });
    
    // Atualizar atletas originais com informações consolidadas
    atletas.forEach(atleta => {
      const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
      const atletaUnico = atletasUnicos.get(atletaId);
      if (atletaUnico) {
        atleta._categoriasCompetidas = atletaUnico._categoriasCompetidas;
        atleta._posicoesCategoria = atletaUnico._posicoesCategoria;
      }
    });
  };

  // Função para renderizar uma categoria de peso
  const renderizarCategoria = (categoriaPeso: string, atletas: any[]) => {
    if (!atletas || atletas.length === 0) {
      return null;
    }
    
    // Calcular posições antes de renderizar
    calcularPosicoes(atletas);
    
    // Desduplicar atletas (manter apenas uma ocorrência de cada atleta único)
    const atletasUnicos = new Map<string, any>();
    atletas.forEach(atleta => {
      const atletaId = atleta.entry?.cpf || atleta.entry?.name || atleta.name || '';
      if (!atletasUnicos.has(atletaId)) {
        atletasUnicos.set(atletaId, atleta);
      }
    });
    
    // Converter de volta para array e ordenar por total
    const atletasDeduplicados = Array.from(atletasUnicos.values()).sort((a, b) => {
      const totalA = a.total || 0;
      const totalB = b.total || 0;
      return totalB - totalA;
    });

    return (
      <React.Fragment key={categoriaPeso}>
        <tr className="titcoluna">
          <td className="titcategoria" colSpan={5}>
            &nbsp;Categoria {categoriaPeso}
          </td>
          {modalidadeAtiva === 'powerlifting' && (
            <>
              <th colSpan={5}>Agachamento</th>
              <th colSpan={5}>Supino</th>
              <th colSpan={5}>Levantamento Terra</th>
              <th colSpan={1}>Total</th>
            </>
          )}
          {modalidadeAtiva === 'supino' && (
            <>
              <th colSpan={5}>Supino</th>
              <th colSpan={1}>Total</th>
            </>
          )}
          <th colSpan={8}>Colocação {detectarApenasSupino() ? 'SUPINO' : (modalidadeAtiva === 'powerlifting' ? 'POWERLIFTING' : 'SUPINO')} - {equipamentoAtivo === 'classico' ? 'CLÁSSICO' : 'EQUIPADO'}</th>
        
        </tr>
        
        <tr className="titcoluna">
          <td align="left">&nbsp;Atleta</td>
          <td>UF</td>
          <td align="left">&nbsp;Equipe</td>
          <td>Nascimento</td>
          <td>Peso</td>
          {modalidadeAtiva === 'powerlifting' && (
            <>
              <td>1ª</td>
              <td>2ª</td>
              <td>3ª</td>
              <td>&nbsp;Melhor&nbsp;</td>
              <td>&nbsp;Pos&nbsp;</td>
              <td>1ª</td>
              <td>2ª</td>
              <td>3ª</td>
              <td>&nbsp;Melhor&nbsp;</td>
              <td>&nbsp;Pos&nbsp;</td>
              <td>1ª</td>
              <td>2ª</td>
              <td>3ª</td>
              <td>&nbsp;Melhor&nbsp;</td>
              <td>&nbsp;Pos&nbsp;</td>
              <td>&nbsp;Geral&nbsp;</td>
            </>
          )}
          {modalidadeAtiva === 'supino' && (
            <>
              <td>1ª</td>
              <td>2ª</td>
              <td>3ª</td>
              <td>&nbsp;Melhor&nbsp;</td>
              <td>&nbsp;Pos&nbsp;</td>
              <td>&nbsp;Geral&nbsp;</td>
            </>
          )}
          <td>Indice&nbsp;GL</td>
          <td>SJ</td>
          <td>JR</td>
          <td>OP</td>
          <td>M1</td>
          <td>M2</td>
          <td>M3</td>
          <td>M4</td>
        </tr>
        {atletasDeduplicados.map((atleta, index) => {
          return renderizarLinhaAtleta(atleta, index);
        })}
        <tr>
          <th colSpan={32}>&nbsp;</th>
        </tr>
      </React.Fragment>
    );
  };

  const resultadosPorCategoriaPeso = processarResultados();

  // Função para formatar data
  const formatarData = (data: string | Date) => {
    if (!data) return '';
    const date = data instanceof Date ? data : new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  // Se não há resultados, mostrar mensagem
  if (Object.keys(resultadosPorCategoriaPeso).length === 0) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-info">
          <h4>Nenhum resultado disponível</h4>
          <p>Os resultados desta competição ainda não foram processados ou não estão disponíveis no formato CBLB.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho da Competição */}
      <div className="container-fluid p-1">
        <div className="row">
          <div className="col-12 col-lg-12 titcamp">
            {resultado.competitionName} - <br />
            {formatarData(resultado.competitionDate)} {resultado.competitionCity && `- ${resultado.competitionCity}`}
          </div>
        </div>
        
      </div>

      <label className={generoAtivo === 'masculino' ? 'titmas' : 'titfem'}>
        {generoAtivo === 'masculino' ? 'MASCULINO' : 'FEMININO'}
      </label>

      {/* Botões de Navegação */}
      <div className="container-fluid noprint">
        <div className="row">
          <div className="col">
            {/* Só mostrar botão de powerlifting se não for competição só supino */}
            {!detectarApenasSupino() && (
              <span 
                className="btn btn-secondary mb-2 mr-1" 
                style={{ backgroundColor: modalidadeAtiva === 'powerlifting' ? '#2E8B57' : '#8FBC8F' }}
                onClick={() => setModalidadeAtiva('powerlifting')}
              >
                RESULTADOS POWERLIFTING
              </span>
            )}
            <span 
              className="btn btn-secondary mb-2 mr-1" 
              style={{ backgroundColor: modalidadeAtiva === 'supino' ? '#2E8B57' : '#8FBC8F' }}
              onClick={() => setModalidadeAtiva('supino')}
            >
              RESULTADOS SUPINO
            </span>
          </div>
        </div>
        
        {/* Abas de Equipamento - para Powerlifting e Supino */}
        <div className="row mt-2">
          <div className="col">
            <span 
              className="btn btn-secondary mb-2 mr-1" 
              style={{ backgroundColor: equipamentoAtivo === 'classico' ? '#2E8B57' : '#8FBC8F' }}
              onClick={() => setEquipamentoAtivo('classico')}
            >
              CLÁSSICO
            </span>
            <span 
              className="btn btn-secondary mb-2 mr-1" 
              style={{ backgroundColor: equipamentoAtivo === 'equipado' ? '#2E8B57' : '#8FBC8F' }}
              onClick={() => setEquipamentoAtivo('equipado')}
            >
              EQUIPADO
            </span>
          </div>
        </div>
        
        {/* Abas de Gênero - para Powerlifting e Supino */}
        <div className="row mt-2">
          <div className="col">
            <span 
              className="btn btn-secondary mb-2 mr-1" 
              style={{ backgroundColor: generoAtivo === 'masculino' ? '#2E8B57' : '#8FBC8F' }}
              onClick={() => setGeneroAtivo('masculino')}
            >
              MASCULINO
            </span>
            <span 
              className="btn btn-secondary mb-2 mr-1" 
              style={{ backgroundColor: generoAtivo === 'feminino' ? '#2E8B57' : '#8FBC8F' }}
              onClick={() => setGeneroAtivo('feminino')}
            >
              FEMININO
            </span>
          </div>
        </div>
        
        {/* Botão de Exportar PDF */}
        <div className="row mt-2">
          <div className="col">
            <button 
              className="btn btn-success mb-2"
              onClick={exportarPDF}
              style={{ 
                backgroundColor: '#28a745', 
                borderColor: '#28a745',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              📄 EXPORTAR TODOS OS RESULTADOS (PDF)
            </button>
          </div>
        </div>
      </div>
      <br />

      {/* TABELA COM RESULTADOS */}
      <div className="container-fluid" id="resultados">
        <table style={{ borderCollapse: 'collapse', borderColor: '#808080' }} width="100%">
          <tbody>
            {Object.entries(resultadosPorCategoriaPeso).map(([categoriaPeso, atletas]) => {
              return renderizarCategoria(categoriaPeso, atletas);
            })}
          </tbody>
        </table>
        
        <br />
        <br />
        
        {/* Tabela de estatísticas */}
        <table align="center" style={{ borderCollapse: 'collapse', borderColor: '#808080' }} width="20%">
          <tbody>
            <tr className="titcoluna">
              <th style={{ whiteSpace: 'nowrap' }} colSpan={2}>
                &nbsp;ATLETAS CLÁSSICO&nbsp;
              </th>
            </tr>
            <tr className="titcoluna">
              <td>CATEGORIA</td>
              <td>ATLETAS</td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Sub-Júnior</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'sj' || categoriaNormalizada === 'sub-júnior' || categoriaNormalizada === 'sub-junior' ||
                       categoriaNormalizada.includes('sub-júnior') || categoriaNormalizada.includes('sub-junior');
              }).length}&nbsp;</b></td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Júnior</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'jr' || categoriaNormalizada === 'júnior' || categoriaNormalizada === 'junior' ||
                       categoriaNormalizada.includes('júnior') || categoriaNormalizada.includes('junior');
              }).length}&nbsp;</b></td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Open</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'op' || categoriaNormalizada === 'open' ||
                       categoriaNormalizada.includes('open');
              }).length}&nbsp;</b></td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Master 1</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'm1' || categoriaNormalizada === 'master 1' || categoriaNormalizada === 'master1' ||
                       categoriaNormalizada.includes('master 1') || categoriaNormalizada.includes('master1');
              }).length}&nbsp;</b></td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Master 2</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'm2' || categoriaNormalizada === 'master 2' || categoriaNormalizada === 'master2' ||
                       categoriaNormalizada.includes('master 2') || categoriaNormalizada.includes('master2');
              }).length}&nbsp;</b></td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Master 3</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'm3' || categoriaNormalizada === 'master 3' || categoriaNormalizada === 'master3' ||
                       categoriaNormalizada.includes('master 3') || categoriaNormalizada.includes('master3');
              }).length}&nbsp;</b></td>
            </tr>
            <tr className="titatleta">
              <td>&nbsp;Master 4</td>
              <td align="center"><b>&nbsp;{Object.values(resultadosPorCategoriaPeso).flat().filter(a => {
                const categoriaInscricao = a.entry?.division || a.division || '';
                const categoriaNormalizada = categoriaInscricao.trim().toLowerCase();
                return categoriaNormalizada === 'm4' || categoriaNormalizada === 'master 4' || categoriaNormalizada === 'master4' || categoriaNormalizada === 'master iv' ||
                       categoriaNormalizada.includes('master 4') || categoriaNormalizada.includes('master4') || categoriaNormalizada.includes('master iv');
              }).length}&nbsp;</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CBLBResultsDisplay;
