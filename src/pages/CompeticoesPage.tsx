import React, { useState, useEffect, useCallback } from 'react';
import '../styles/cblb-results.css';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Form, 
  InputGroup,
  Modal,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  Nav
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUsers, 
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaFileExport,
  FaUserCheck,
  FaUserTimes,
  FaChartBar,
  FaDownload,
  FaTrophy,
  FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { competicaoService, inscricaoService, atletaService, logService, tipoCompeticaoService } from '../services/firebaseService';
import { resultadoImportadoService, ResultadoImportado } from '../services/resultadoImportadoService';
import { Competicao, InscricaoCompeticao, Atleta } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CSVImportModal from '../components/CSVImportModal';
import RecordsDisplay from '../components/RecordsDisplay';
import CBLBResultsDisplay from '../components/CBLBResultsDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useAdminPermission } from '../hooks/useAdminPermission';
import { formatarData } from '../utils/dateUtils';
import { 
  CATEGORIAS_IDADE, 
  calcularIdade, 
  validarIdadeParaCategoria,
  validarDobraCategoria,
  obterOpcoesDobraValidas,
  obterCategoriasPeso,
  obterCategoriasPesoValidas,
  validarPesoParaCategoria
} from '../config/categorias';

// Componente para edição de inscrição
const EditarInscricaoForm: React.FC<{
  inscricao: InscricaoCompeticao;
  competicao: Competicao;
  onSave: (categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any, total12Meses?: number) => void;
  onCancel: () => void;
}> = ({ inscricao, competicao, onSave, onCancel }) => {
  const [categoriaPeso, setCategoriaPeso] = useState<any>(inscricao.categoriaPeso || null);
  const [categoriaIdade, setCategoriaIdade] = useState<any>(inscricao.categoriaIdade || null);
  const [dobraCategoria, setDobraCategoria] = useState<any>(inscricao.dobraCategoria || null);
  const [total12Meses, setTotal12Meses] = useState<number>((inscricao as any).total12Meses || 0);

  // Obter atleta da inscrição
  const atleta = inscricao.atleta;
  const idadeAtleta = atleta?.dataNascimento ? calcularIdade(new Date(atleta.dataNascimento)) : null;

  const podeEditarDobra = () => {
    if (!competicao.permiteDobraCategoria) return false;
    if (!competicao.dataNominacaoFinal) return true;
    
    const hoje = new Date();
    const umDiaAntes = new Date(competicao.dataNominacaoFinal);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    return hoje <= umDiaAntes;
  };

  // Validar se atleta pode usar categoria baseado na idade real
  const podeUsarCategoriaIdade = (categoriaIdade: any) => {
    if (!idadeAtleta || !categoriaIdade) return true;
    
    // Aplicar validação rigorosa baseada na idade real do atleta
    return validarIdadeParaCategoria(idadeAtleta, categoriaIdade);
  };

  // Obter categorias de idade válidas para o atleta baseado na idade real
  const obterCategoriasIdadeValidas = () => {
    if (!idadeAtleta) return CATEGORIAS_IDADE;
    
    return CATEGORIAS_IDADE.filter(cat => validarIdadeParaCategoria(idadeAtleta, cat));
  };

  // Obter opções válidas de dobra considerando a idade do atleta
  const obterOpcoesDobraValidasComIdade = (categoriaIdade: any) => {
    if (!categoriaIdade || !idadeAtleta) return [];
    
    // Primeiro obter as opções válidas baseadas nas regras rigorosas de dobra
    const opcoes = obterOpcoesDobraValidas(categoriaIdade);
    
    // Depois filtrar apenas categorias que o atleta pode usar baseado na idade
    return opcoes.filter(cat => {
      // Verificar se o atleta tem idade para a categoria de dobra
      const podeUsarCategoria = validarIdadeParaCategoria(idadeAtleta, cat);
      
      // Verificar se a combinação é válida para dobra (regras rigorosas)
      const combinacaoValida = validarDobraCategoria(categoriaIdade, cat);
      
      return podeUsarCategoria && combinacaoValida;
    });
  };

  // Validar se a combinação de categorias é válida para dobra
  const validarCombinacaoDobra = (cat1: any, cat2: any) => {
    if (!cat1 || !cat2) return true;
    
    // Aplicar as regras rigorosas de dobra
    return validarDobraCategoria(cat1, cat2);
  };

  // Validar se atleta pode usar a categoria de peso selecionada
  const podeUsarCategoriaPeso = (categoriaPeso: any) => {
    if (!categoriaPeso || !idadeAtleta) return true;
    
    // Aplicar validação específica para categorias restritas
    return validarPesoParaCategoria(idadeAtleta, categoriaPeso);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoriaPeso || !categoriaIdade) {
      toast.error('Selecione categoria de peso e idade');
      return;
    }

    // Validar se atleta pode usar a categoria de peso selecionada
    if (!podeUsarCategoriaPeso(categoriaPeso)) {
      toast.error(`Atleta não pode usar esta categoria de peso. Restrição de idade aplicada.`);
      return;
    }

    // Validar se atleta pode usar a categoria de idade selecionada
    if (!podeUsarCategoriaIdade(categoriaIdade)) {
      toast.error(`Atleta não tem idade suficiente para categoria ${categoriaIdade.nome}`);
      return;
    }

    // Validar se a dobra é válida (aplicar regras rigorosas)
    if (dobraCategoria && !validarCombinacaoDobra(categoriaIdade, dobraCategoria.categoriaIdade)) {
      toast.error('Combinação de categorias inválida para dobra. Verifique as regras de dobra.');
      return;
    }

    // Garantir que dobraCategoria seja null em vez de undefined
    const dobraParaSalvar = (dobraCategoria && dobraCategoria.categoriaIdade && dobraCategoria.categoriaPeso) ? dobraCategoria : null;
    onSave(categoriaPeso, categoriaIdade, dobraParaSalvar, total12Meses);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Alert variant="info" className="mb-3">
        <strong>ℹ️ Informação:</strong> 
        Você pode alterar a categoria de peso, categoria de idade e gerenciar dobra de categoria.
        {!podeEditarDobra() && (
          <span className="text-warning"> <strong>Dobra de categoria não pode mais ser alterada.</strong></span>
        )}
        {idadeAtleta && (
          <div className="mt-2">
            <strong>Idade do atleta:</strong> {idadeAtleta} anos
          </div>
        )}
      </Alert>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Categoria de Peso *</Form.Label>
            <Form.Select
              value={categoriaPeso?.id || ''}
              onChange={(e) => {
                const categoria = obterCategoriasPeso(atleta?.sexo || 'M')
                  .find(cat => cat.id === e.target.value);
                setCategoriaPeso(categoria || null);
                
                // Limpar dobra se a categoria de peso mudar
                if (dobraCategoria) {
                  setDobraCategoria(null);
                }
              }}
              required
            >
              <option value="">Selecione a categoria de peso</option>
              {(() => {
                if (!idadeAtleta) {
                  return obterCategoriasPeso(atleta?.sexo || 'M').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} - {cat.descricao}
                    </option>
                  ));
                }
                
                const categoriasValidas = obterCategoriasPesoValidas(atleta?.sexo || 'M', idadeAtleta);
                const todasCategorias = obterCategoriasPeso(atleta?.sexo || 'M');
                
                return todasCategorias.map(cat => {
                  const podeUsar = categoriasValidas.some(catValida => catValida.id === cat.id);
                  return (
                    <option 
                      key={cat.id} 
                      value={cat.id}
                      disabled={!podeUsar}
                    >
                      {cat.nome} - {cat.descricao}
                      {!podeUsar && ` (Restrito a Sub-júnior: 14-18 anos)`}
                    </option>
                  );
                });
              })()}
            </Form.Select>
            {categoriaPeso && idadeAtleta && !podeUsarCategoriaPeso(categoriaPeso) && (
              <Form.Text className="text-danger">
                <strong>⚠️ Restrição de Idade:</strong> Esta categoria de peso é restrita apenas para atletas Sub-júnior (14-18 anos). 
                Sua idade atual: {idadeAtleta} anos.
              </Form.Text>
            )}
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Categoria de Idade *</Form.Label>
            <Form.Select
              value={categoriaIdade?.id || ''}
              onChange={(e) => {
                const categoria = CATEGORIAS_IDADE.find(cat => cat.id === e.target.value);
                setCategoriaIdade(categoria || null);
                // Limpar dobra se a categoria mudar
                if (dobraCategoria) {
                  setDobraCategoria(null);
                }
              }}
              required
            >
              <option value="">Selecione a categoria de idade</option>
              {(() => {
                if (!idadeAtleta) {
                  return CATEGORIAS_IDADE.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} - {cat.descricao}
                    </option>
                  ));
                }
                
                const categoriasValidas = obterCategoriasIdadeValidas();
                const todasCategorias = CATEGORIAS_IDADE;
                
                return todasCategorias.map(cat => {
                  const podeUsar = categoriasValidas.some(catValida => catValida.id === cat.id);
                  
                  // Calcular idade mínima baseada nas regras das categorias
                  let idadeMinima = 0;
                  if (cat.id === 'subjunior') {
                    idadeMinima = 14;
                  } else if (cat.id === 'junior') {
                    idadeMinima = 19;
                  } else if (cat.id === 'open') {
                    idadeMinima = 19;
                  } else if (cat.id === 'master1') {
                    idadeMinima = 40;
                  } else if (cat.id === 'master2') {
                    idadeMinima = 50;
                  } else if (cat.id === 'master3') {
                    idadeMinima = 60;
                  } else if (cat.id === 'master4') {
                    idadeMinima = 70;
                  }
                  
                  return (
                    <option 
                      key={cat.id} 
                      value={cat.id}
                      disabled={!podeUsar}
                    >
                      {cat.nome} - {cat.descricao}
                      {!podeUsar && ` (Idade insuficiente: ${idadeMinima} - ${cat.idadeMaxima} anos)`}
                    </option>
                  );
                });
              })()}
            </Form.Select>
            {categoriaIdade && !podeUsarCategoriaIdade(categoriaIdade) && (
              <Form.Text className="text-danger">
                <strong>⚠️ Restrição de Idade:</strong> Atleta não tem idade suficiente para categoria {categoriaIdade.nome}. 
                Idade atual: {idadeAtleta} anos. 
                {(() => {
                  let idadeMinima = 0;
                  if (categoriaIdade.id === 'subjunior') {
                    idadeMinima = 14;
                  } else if (categoriaIdade.id === 'junior') {
                    idadeMinima = 19;
                  } else if (categoriaIdade.id === 'open') {
                    idadeMinima = 19;
                  } else if (categoriaIdade.id === 'master1') {
                    idadeMinima = 40;
                  } else if (categoriaIdade.id === 'master2') {
                    idadeMinima = 50;
                  } else if (categoriaIdade.id === 'master3') {
                    idadeMinima = 60;
                  } else if (categoriaIdade.id === 'master4') {
                    idadeMinima = 70;
                  }
                  return `Faixa permitida: ${idadeMinima} - ${categoriaIdade.idadeMaxima} anos.`;
                })()}
              </Form.Text>
            )}
            {idadeAtleta && (
              <Form.Text className="text-muted">
                <strong>ℹ️ Idade do atleta:</strong> {idadeAtleta} anos. Apenas categorias compatíveis com esta idade estão habilitadas.
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>

      {competicao.permiteDobraCategoria && categoriaIdade && podeEditarDobra() && (
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Dobra de Categoria</Form.Label>
              <Form.Select
                value={dobraCategoria?.categoriaIdade?.id || ''}
                onChange={(e) => {
                  if (e.target.value === '') {
                    setDobraCategoria(null);
                    return;
                  }

                  const categoriaIdadeDobra = CATEGORIAS_IDADE.find(cat => cat.id === e.target.value);
                  if (!categoriaIdadeDobra) return;

                  // Validar se atleta pode usar a categoria de dobra
                  if (!podeUsarCategoriaIdade(categoriaIdadeDobra)) {
                    toast.error(`Atleta não tem idade suficiente para categoria ${categoriaIdadeDobra.nome}. Idade atual: ${idadeAtleta} anos.`);
                    return;
                  }

                  // Validar se a combinação é válida para dobra (regras rigorosas)
                  if (!validarDobraCategoria(categoriaIdade, categoriaIdadeDobra)) {
                    toast.error(`Combinação inválida: ${categoriaIdade.nome} + ${categoriaIdadeDobra.nome}. Verifique as regras de dobra.`);
                    return;
                  }

                  const novaDobra = {
                    categoriaPeso: categoriaPeso,
                    categoriaIdade: categoriaIdadeDobra
                  };

                  setDobraCategoria(novaDobra);
                }}
              >
                <option value="">Sem dobra</option>
                {(() => {
                  const opcoesValidas = obterOpcoesDobraValidasComIdade(categoriaIdade);
                  if (opcoesValidas.length === 0) {
                    return (
                      <option value="" disabled>
                        Nenhuma opção de dobra disponível para esta categoria
                      </option>
                    );
                  }
                  return opcoesValidas.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} - {cat.descricao}
                    </option>
                  ));
                })()}
              </Form.Select>
              <Form.Text className="text-muted">
                {(() => {
                  if (!categoriaIdade) {
                    return "Selecione primeiro uma categoria de idade para ver as opções de dobra";
                  }
                  const opcoesValidas = obterOpcoesDobraValidasComIdade(categoriaIdade);
                  if (opcoesValidas.length === 0) {
                    return "Esta categoria não permite dobra ou o atleta não tem idade suficiente para as opções disponíveis";
                  }
                  return `Selecione uma categoria adicional para dobra (${opcoesValidas.length} opção(ões) disponível(is))`;
                })()}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Total Declarado (kg)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.1"
              value={total12Meses || ''}
              onChange={(e) => {
                const valor = parseFloat(e.target.value) || 0;
                setTotal12Meses(valor);
              }}
              placeholder="Digite o total declarado"
            />
            <Form.Text className="text-muted">
              Total declarado pelo atleta nos últimos 12 meses
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={!categoriaPeso || !categoriaIdade}>
          Salvar Alterações
        </Button>
      </div>
    </Form>
  );
};

const CompeticoesPage: React.FC = () => {
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showInscricoesModal, setShowInscricoesModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [showCategorizacaoModal, setShowCategorizacaoModal] = useState(false);
  const [showEditarInscricaoModal, setShowEditarInscricaoModal] = useState(false);
  const [showDetalhesCompeticaoModal, setShowDetalhesCompeticaoModal] = useState(false);
  const [competicaoDetalhes, setCompeticaoDetalhes] = useState<Competicao | null>(null);
  const [inscricaoEmEdicao, setInscricaoEmEdicao] = useState<InscricaoCompeticao | null>(null);
  const [categorizacaoAtletas, setCategorizacaoAtletas] = useState<Map<string, any>>(new Map());
  const [showNominacaoModal, setShowNominacaoModal] = useState(false);
  const [nominacaoCompeticao, setNominacaoCompeticao] = useState<Competicao | null>(null);
  const [nominacaoData, setNominacaoData] = useState<InscricaoCompeticao[]>([]);
  const [loadingNominacao, setLoadingNominacao] = useState(false);
  const [filtroModalidade, setFiltroModalidade] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('');
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [editandoTipos, setEditandoTipos] = useState<string[]>(['S', 'AST', 'T']);
  const [selectedCompeticao, setSelectedCompeticao] = useState<Competicao | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoCompeticao[]>([]);
  const [editingCompeticao, setEditingCompeticao] = useState<Competicao | null>(null);
  const [atletasDisponiveis, setAtletasDisponiveis] = useState<Atleta[]>([]);
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'competicoes' | 'resultados' | 'record'>('competicoes');
  const [resultadosImportados, setResultadosImportados] = useState<ResultadoImportado[]>([]);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [showCBLBModal, setShowCBLBModal] = useState(false);
  const [cblbResultado, setCblbResultado] = useState<ResultadoImportado | null>(null);

  const [inscricaoFormData, setInscricaoFormData] = useState({
    observacoes: '',
    modalidade: '' as 'CLASSICA' | 'EQUIPADO' | ''
  });
  const [formData, setFormData] = useState({
    nomeCompeticao: '',
    dataCompeticao: '',
    valorInscricao: '',
    valorDobra: '',
    dataInicioInscricao: '',
    dataFimInscricao: '',
    dataNominacaoPreliminar: '',
    dataNominacaoFinal: '',
    local: '',
    descricao: '',
    status: 'AGENDADA' as 'AGENDADA' | 'REALIZADA' | 'CANCELADA',
    permiteDobraCategoria: false,
    modalidade: 'CLASSICA' as 'CLASSICA' | 'EQUIPADO' | 'CLASSICA_EQUIPADO',
    tipoCompeticao: ''
  });
  const [tiposCompeticao, setTiposCompeticao] = useState<string[]>(['S', 'AST', 'T']);
  const { user } = useAuth();
  const { isAdmin } = useAdminPermission();


  // Atualizar datas de nominata quando data da competição mudar
  useEffect(() => {
    if (formData.dataCompeticao) {
      const dataCompeticao = new Date(formData.dataCompeticao);
      
      // Nominata preliminar: 60 dias antes
      const dataNominacaoPreliminar = new Date(dataCompeticao);
      dataNominacaoPreliminar.setDate(dataCompeticao.getDate() - 60);
      
      // Nominata final: 21 dias antes
      const dataNominacaoFinal = new Date(dataCompeticao);
      dataNominacaoFinal.setDate(dataCompeticao.getDate() - 21);
      
      setFormData(prev => ({
        ...prev,
        dataNominacaoPreliminar: dataNominacaoPreliminar.toISOString().split('T')[0],
        dataNominacaoFinal: dataNominacaoFinal.toISOString().split('T')[0]
      }));
    }
  }, [formData.dataCompeticao]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carregar tipos de competição
      const tiposData = await tipoCompeticaoService.getAll();
      setTiposCompeticao(tiposData);
      
      // Se for admin e não há tipos configurados, criar os padrões
      if (user?.tipo === 'admin' && tiposData.length === 0) {
        await tipoCompeticaoService.createDefault();
        const tiposPadrao = await tipoCompeticaoService.getAll();
        setTiposCompeticao(tiposPadrao);
      }
      
      // Se for admin, carrega todos os dados
      // Se for usuário comum, carrega apenas dados da sua equipe
      let atletasData: Atleta[];
      
      if (user?.tipo === 'admin') {
        atletasData = await atletaService.getAll();
      } else {
        // Usuário comum - só pode ver atletas da sua equipe
        if (!user?.idEquipe) {
          toast.error('Usuário não está vinculado a uma equipe');
          setAtletas([]);
          setCompeticoes([]);
          return;
        }
        
        const atletasDaEquipe = await atletaService.getAll();
        atletasData = atletasDaEquipe.filter(atleta => atleta.idEquipe === user.idEquipe);
      }
      
      const competicoesData = await competicaoService.getAll();
      
      setAtletas(atletasData);
      setCompeticoes(competicoesData);
      
      // Carregar resultados importados do Firebase
      await loadResultadosImportados();
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.idEquipe, user?.tipo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se é admin
    if (user?.tipo !== 'admin') {
      toast.error('Apenas administradores podem gerenciar competições');
      return;
    }

    try {
      const competicaoData = {
        nomeCompeticao: formData.nomeCompeticao,
        dataCompeticao: new Date(formData.dataCompeticao),
        valorInscricao: parseFloat(formData.valorInscricao),
        valorDobra: formData.valorDobra ? parseFloat(formData.valorDobra) : undefined,
        dataInicioInscricao: new Date(formData.dataInicioInscricao),
        dataFimInscricao: new Date(formData.dataFimInscricao),
        dataNominacaoPreliminar: formData.dataNominacaoPreliminar ? new Date(formData.dataNominacaoPreliminar) : undefined,
        dataNominacaoFinal: formData.dataNominacaoFinal ? new Date(formData.dataNominacaoFinal) : undefined,
        local: formData.local,
        descricao: formData.descricao,
        status: formData.status,
        permiteDobraCategoria: formData.permiteDobraCategoria,
        modalidade: formData.modalidade,
        tipoCompeticao: formData.tipoCompeticao
      };

      if (editingCompeticao) {
        await competicaoService.update(editingCompeticao.id!, competicaoData);
        toast.success('Competição atualizada com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou competição',
          detalhes: `Atualizou competição: ${formData.nomeCompeticao}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await competicaoService.create(competicaoData);
        toast.success('Competição criada com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Criou competição',
          detalhes: `Criou competição: ${formData.nomeCompeticao}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar competição');
      console.error(error);
    }
  };

  const handleEdit = (competicao: Competicao) => {
    // Verificar se é admin
    if (user?.tipo !== 'admin') {
      toast.error('Apenas administradores podem editar competições');
      return;
    }
    
    setEditingCompeticao(competicao);
    setFormData({
      nomeCompeticao: competicao.nomeCompeticao,
      dataCompeticao: competicao.dataCompeticao.toISOString().split('T')[0],
      valorInscricao: competicao.valorInscricao.toString(),
      valorDobra: competicao.valorDobra?.toString() || '',
      dataInicioInscricao: competicao.dataInicioInscricao.toISOString().split('T')[0],
      dataFimInscricao: competicao.dataFimInscricao.toISOString().split('T')[0],
      dataNominacaoPreliminar: competicao.dataNominacaoPreliminar?.toISOString().split('T')[0] || '',
      dataNominacaoFinal: competicao.dataNominacaoFinal?.toISOString().split('T')[0] || '',
      local: competicao.local || '',
      descricao: competicao.descricao || '',
      status: competicao.status,
      permiteDobraCategoria: competicao.permiteDobraCategoria || false,
      modalidade: competicao.modalidade || 'CLASSICA',
      tipoCompeticao: competicao.tipoCompeticao || ''
    });
    setShowModal(true);
  };

  const handleInscricoes = async (competicao: Competicao) => {
    setSelectedCompeticao(competicao);
    try {
      const inscricoesData = await inscricaoService.getByCompeticao(competicao.id!);
      setInscricoes(inscricoesData);
      setShowInscricoesModal(true);
    } catch (error) {
      toast.error('Erro ao carregar inscrições');
      console.error(error);
    }
  };

  const handleInscreverAtletas = async (competicao: Competicao) => {
    setSelectedCompeticao(competicao);
    
    try {
      // Buscar atletas da equipe do usuário
      let atletasDaEquipe: Atleta[];
      
      if (user?.tipo === 'admin') {
        // Admin pode ver todos os atletas
        atletasDaEquipe = atletas;
      } else {
        // Usuário comum só pode ver atletas da sua equipe
        if (!user?.idEquipe) {
          toast.error('Usuário não está vinculado a uma equipe');
          return;
        }
        atletasDaEquipe = atletas.filter(atleta => atleta.idEquipe === user.idEquipe);
      }

      // Buscar inscrições existentes para filtrar atletas já inscritos
      const inscricoesExistentes = await inscricaoService.getByCompeticao(competicao.id!);
      const inscricoesAtivas = inscricoesExistentes.filter(insc => insc.statusInscricao === 'INSCRITO');
      
      // Filtrar atletas baseado na modalidade da competição
      const atletasDisponiveis = atletasDaEquipe.filter(atleta => {
        const inscricoesDoAtleta = inscricoesAtivas.filter(insc => insc.idAtleta === atleta.id);
        
        if (competicao.modalidade === 'CLASSICA' || competicao.modalidade === 'EQUIPADO') {
          // Modalidade única: atleta só pode se inscrever uma vez
          return inscricoesDoAtleta.length === 0;
        } else if (competicao.modalidade === 'CLASSICA_EQUIPADO') {
          // Modalidade dupla: atleta pode se inscrever até duas vezes (uma em cada modalidade)
          // Verificar se já tem inscrição na modalidade selecionada
          const modalidadesInscritas = inscricoesDoAtleta.map(insc => insc.modalidade);
          const modalidadeSelecionada = inscricaoFormData.modalidade;
          
          if (modalidadeSelecionada && modalidadesInscritas.includes(modalidadeSelecionada)) {
            return false; // Já inscrito nesta modalidade
          }
          
          return inscricoesDoAtleta.length < 2;
        }
        
        return true;
      });

      // Adicionar informações sobre inscrições existentes para competições duplas
      if (competicao.modalidade === 'CLASSICA_EQUIPADO') {
        atletasDisponiveis.forEach(atleta => {
          const inscricoesDoAtleta = inscricoesAtivas.filter(insc => insc.idAtleta === atleta.id);
          if (inscricoesDoAtleta.length > 0) {
            const modalidadesInscritas = inscricoesDoAtleta.map(insc => insc.modalidade).filter(Boolean);
            (atleta as any).inscricoesExistentes = modalidadesInscritas;
          }
        });
      }

      setAtletasDisponiveis(atletasDisponiveis);
      setAtletasSelecionados([]);
      setInscricaoFormData({ observacoes: '', modalidade: '' });
      setShowInscricaoModal(true);
    } catch (error) {
      toast.error('Erro ao carregar atletas disponíveis');
      console.error(error);
    }
  };

  const handleSubmitInscricao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (atletasSelecionados.length === 0) {
      toast.error('Selecione pelo menos um atleta para inscrever');
      return;
    }

    if (!selectedCompeticao) {
      toast.error('Competição não selecionada');
      return;
    }

    // Validar modalidade se a competição for "Clássica e Equipado"
    if (selectedCompeticao.modalidade === 'CLASSICA_EQUIPADO' && !inscricaoFormData.modalidade) {
      toast.error('Selecione a modalidade (Clássica ou Equipado) para a inscrição');
      return;
    }

    // Validar se os atletas selecionados não estão já inscritos na modalidade escolhida
    if (selectedCompeticao.modalidade === 'CLASSICA_EQUIPADO' && inscricaoFormData.modalidade) {
      const inscricoesExistentes = await inscricaoService.getByCompeticao(selectedCompeticao.id!);
      const inscricoesAtivas = inscricoesExistentes.filter(insc => insc.statusInscricao === 'INSCRITO');
      
      const atletasComConflito = atletasSelecionados.filter(atletaId => {
        const inscricoesDoAtleta = inscricoesAtivas.filter(insc => insc.idAtleta === atletaId);
        const modalidadesInscritas = inscricoesDoAtleta.map(insc => insc.modalidade).filter(Boolean);
        return modalidadesInscritas.includes(inscricaoFormData.modalidade as 'CLASSICA' | 'EQUIPADO');
      });

      if (atletasComConflito.length > 0) {
        const nomesAtletas = atletasComConflito.map(id => 
          atletas.find(a => a.id === id)?.nome
        ).filter(Boolean);
        
        toast.error(`Os seguintes atletas já estão inscritos na modalidade ${inscricaoFormData.modalidade === 'CLASSICA' ? 'Clássica' : 'Equipado'}: ${nomesAtletas.join(', ')}`);
        return;
      }
    }

    // Abrir modal de categorização em vez de finalizar diretamente
    setShowInscricaoModal(false);
    setShowCategorizacaoModal(true);
  };

  const handleAtletaSelection = (atletaId: string, checked: boolean) => {
    if (checked) {
      setAtletasSelecionados(prev => [...prev, atletaId]);
    } else {
      setAtletasSelecionados(prev => prev.filter(id => id !== atletaId));
      // Remover categorização se o atleta for desmarcado
      const novaCategorizacao = new Map(categorizacaoAtletas);
      novaCategorizacao.delete(atletaId);
      setCategorizacaoAtletas(novaCategorizacao);
    }
  };

  const handleCategorizacaoAtleta = (atletaId: string, categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any, total12Meses?: number) => {
    const novaCategorizacao = new Map(categorizacaoAtletas);
    const categorizacaoAtual = novaCategorizacao.get(atletaId) || {};
    novaCategorizacao.set(atletaId, { 
      categoriaPeso, 
      categoriaIdade, 
      dobraCategoria,
      total12Meses: total12Meses !== undefined ? total12Meses : categorizacaoAtual.total12Meses || 0
    });
    setCategorizacaoAtletas(novaCategorizacao);
  };

  const handleFinalizarInscricao = async () => {
    // Verificar se todos os atletas têm categorias definidas
    const atletasSemCategoria = atletasSelecionados.filter(atletaId => {
      const categorizacao = categorizacaoAtletas.get(atletaId);
      return !categorizacao || !categorizacao.categoriaPeso || !categorizacao.categoriaIdade;
    });

    if (atletasSemCategoria.length > 0) {
      toast.error('Todos os atletas devem ter categoria de peso e idade definidas');
      return;
    }

    try {
             const inscricoesParaCriar = atletasSelecionados.map(atletaId => {
         const categorizacao = categorizacaoAtletas.get(atletaId);
         
         // Calcular valor individual (inscrição + dobra se aplicável)
         const valorBase = selectedCompeticao!.valorInscricao;
         const valorDobra = categorizacao.dobraCategoria ? (selectedCompeticao!.valorDobra || 0) : 0;
         const valorTotal = valorBase + valorDobra;
         
         const inscricao: any = {
           idAtleta: atletaId,
           idCompeticao: selectedCompeticao!.id!,
           statusInscricao: 'INSCRITO' as const,
           valorIndividual: valorTotal,
           observacoes: inscricaoFormData.observacoes,
           categoriaPeso: categorizacao.categoriaPeso,
           categoriaIdade: categorizacao.categoriaIdade,
           total12Meses: categorizacao.total12Meses || 0
         };

         // Adicionar modalidade se a competição for "Clássica e Equipado"
         if (selectedCompeticao!.modalidade === 'CLASSICA_EQUIPADO') {
           inscricao.modalidade = inscricaoFormData.modalidade;
         } else {
           // Para competições de modalidade única, definir a modalidade baseada na competição
           inscricao.modalidade = selectedCompeticao!.modalidade === 'CLASSICA' ? 'CLASSICA' : 'EQUIPADO';
         }

         // Adicionar dobraCategoria apenas se existir e não for undefined
         if (categorizacao.dobraCategoria) {
           inscricao.dobraCategoria = categorizacao.dobraCategoria;
         }

         return inscricao;
       });

      // Criar todas as inscrições
      for (const inscricao of inscricoesParaCriar) {
        await inscricaoService.create(inscricao);
      }

      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Inscrição em competição',
        detalhes: `Inscrição de ${atletasSelecionados.length} atleta(s) na competição: ${selectedCompeticao!.nomeCompeticao}`,
        tipoUsuario: user?.tipo || 'usuario'
      });

      toast.success(`${atletasSelecionados.length} atleta(s) inscrito(s) com sucesso!`);
      setShowCategorizacaoModal(false);
      setCategorizacaoAtletas(new Map());
      setAtletasSelecionados([]);
      setInscricaoFormData({ observacoes: '', modalidade: '' });
      loadData(); // Recarregar dados
    } catch (error) {
      toast.error('Erro ao realizar inscrição');
      console.error(error);
    }
  };

  const handleDelete = async (competicao: Competicao) => {
    // Verificar se é admin
    if (user?.tipo !== 'admin') {
      toast.error('Apenas administradores podem excluir competições');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir a competição ${competicao.nomeCompeticao}?`)) {
      try {
        await competicaoService.delete(competicao.id!);
        toast.success('Competição excluída com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Excluiu competição',
          detalhes: `Excluiu competição: ${competicao.nomeCompeticao}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadData();
      } catch (error) {
        toast.error('Erro ao excluir competição');
        console.error(error);
      }
    }
  };


  const handleEditarInscricao = (inscricao: InscricaoCompeticao) => {
    setInscricaoEmEdicao(inscricao);
    setShowEditarInscricaoModal(true);
  };

  const handleNominacao = async (competicao: Competicao) => {
    try {
      setLoadingNominacao(true);
      setNominacaoCompeticao(competicao);
      
      // Carregar todas as inscrições da competição
      const inscricoesCompeticao = await inscricaoService.getByCompeticao(competicao.id!);
      
      // Filtrar apenas inscrições aprovadas/confirmadas
      const inscricoesAprovadas = inscricoesCompeticao.filter(insc => 
        insc.statusInscricao === 'INSCRITO' && insc.categoriaPeso && insc.categoriaIdade
      );
      
      setNominacaoData(inscricoesAprovadas);
      setShowNominacaoModal(true);
    } catch (error) {
      toast.error('Erro ao carregar nominação');
      console.error(error);
    } finally {
      setLoadingNominacao(false);
    }
  };

  const exportarNominacaoCSV = () => {
    if (!nominacaoCompeticao || nominacaoData.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    try {
      // Filtrar dados baseado nos filtros aplicados
      let dadosFiltrados = nominacaoData;
      
      if (filtroModalidade) {
        dadosFiltrados = dadosFiltrados.filter(insc => insc.modalidade === filtroModalidade);
      }
      
      if (filtroEquipe) {
        dadosFiltrados = dadosFiltrados.filter(insc => insc.atleta?.equipe?.nomeEquipe === filtroEquipe);
      }

      // Agrupar primeiro por sexo, depois por categoria de peso
      const agrupadoPorSexo = dadosFiltrados.reduce((acc, inscricao) => {
        const sexo = inscricao.atleta?.sexo || 'N/A';
        if (!acc[sexo]) {
          acc[sexo] = {};
        }
        
        const categoriaPeso = inscricao.categoriaPeso?.nome || 'Sem Categoria';
        if (!acc[sexo][categoriaPeso]) {
          acc[sexo][categoriaPeso] = [];
        }
        acc[sexo][categoriaPeso].push(inscricao);
        return acc;
      }, {} as Record<string, Record<string, typeof dadosFiltrados>>);

      // Ordenar sexos (M primeiro, depois F)
      const sexosOrdenados = Object.keys(agrupadoPorSexo).sort((a, b) => {
        if (a === 'M') return -1;
        if (b === 'M') return 1;
        return a.localeCompare(b);
      });

      // Preparar dados para CSV com agrupamento por sexo e categoria
      let csvContent: string[][] = [];
      
      sexosOrdenados.forEach(sexo => {
        const categoriasDoSexo = agrupadoPorSexo[sexo];
        const totalAtletasSexo = Object.values(categoriasDoSexo).reduce((total, categoria) => total + categoria.length, 0);
        
        // Adicionar cabeçalho do sexo
        csvContent.push([`=== ${sexo === 'M' ? 'MASCULINO' : 'FEMININO'} (${totalAtletasSexo} atleta${totalAtletasSexo !== 1 ? 's' : ''}) ===`]);
        
        // Ordenar categorias de peso para este sexo
        const categoriasOrdenadas = Object.keys(categoriasDoSexo).sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });
        
        categoriasOrdenadas.forEach(categoriaPeso => {
          // Adicionar cabeçalho da categoria
          csvContent.push([`--- ${categoriaPeso} (${categoriasDoSexo[categoriaPeso].length} atleta${categoriasDoSexo[categoriaPeso].length !== 1 ? 's' : ''}) ---`]);
          csvContent.push(['Nome', 'Equipe', 'Modalidade', 'Categoria Idade', 'Dobra', 'Total (kg)']);
          
          // Adicionar dados da categoria
          categoriasDoSexo[categoriaPeso]
            .sort((a, b) => (a.atleta?.nome || '').localeCompare(b.atleta?.nome || ''))
            .forEach(insc => {
              csvContent.push([
                insc.atleta?.nome || '',
                insc.atleta?.equipe?.nomeEquipe || '',
                insc.modalidade === 'CLASSICA' ? 'Clássica' : insc.modalidade === 'EQUIPADO' ? 'Equipado' : '',
                insc.categoriaIdade?.nome || '',
                insc.dobraCategoria ? 'Sim' : 'Não',
                (insc as any).total12Meses ? `${(insc as any).total12Meses}kg` : 'N/A'
              ]);
            });
          
          // Adicionar linha em branco entre categorias
          csvContent.push([]);
        });
        
        // Adicionar linha em branco entre sexos
        csvContent.push([]);
      });

      // Converter para string CSV
      const csvString = csvContent.map(row => row.map((field: string) => `"${field}"`).join(',')).join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nominacao_por_categoria_${nominacaoCompeticao.nomeCompeticao.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Nominação agrupada por categoria exportada com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar nominação');
      console.error(error);
    }
  };

  const handleDetalhesCompeticao = (competicao: Competicao) => {
    setCompeticaoDetalhes(competicao);
    setShowDetalhesCompeticaoModal(true);
  };

  const handleSalvarEdicaoInscricao = async (categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any, total12Meses?: number) => {
    if (!inscricaoEmEdicao || !selectedCompeticao) return;

    try {
      // Preparar dados para atualização
      const dadosAtualizacao: any = {
        categoriaPeso,
        categoriaIdade,
        total12Meses: total12Meses || 0
      };

      // Adicionar dobraCategoria apenas se existir e for válida
      if (dobraCategoria && dobraCategoria.categoriaIdade && dobraCategoria.categoriaPeso) {
        dadosAtualizacao.dobraCategoria = dobraCategoria;
      } else {
        // Se não há dobra válida, definir como null (Firestore aceita null)
        dadosAtualizacao.dobraCategoria = null;
      }

      // Atualizar a inscrição com recálculo automático do valor
      await inscricaoService.updateWithRecalculation(inscricaoEmEdicao.id!, dadosAtualizacao, selectedCompeticao);

      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Editou inscrição',
        detalhes: `Editou inscrição do atleta ${inscricaoEmEdicao.atleta?.nome} na competição ${selectedCompeticao.nomeCompeticao}`,
        tipoUsuario: user?.tipo || 'usuario'
      });

      toast.success('Inscrição atualizada com sucesso!');
      setShowEditarInscricaoModal(false);
      setInscricaoEmEdicao(null);
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao atualizar inscrição:', error);
      toast.error(`Erro ao atualizar inscrição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleCancelarInscricao = async (inscricao: InscricaoCompeticao) => {
    // Verificar permissões
    if (!podeCancelarInscricao(inscricao)) {
      toast.error('Você não tem permissão para cancelar esta inscrição');
      return;
    }

    // Confirmar cancelamento
    if (!window.confirm(`Tem certeza que deseja cancelar a inscrição do atleta ${inscricao.atleta?.nome}? Esta ação irá excluir o atleta da competição.`)) {
      return;
    }

    try {
      // Excluir inscrição do banco de dados
      await inscricaoService.delete(inscricao.id!);

      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Cancelou inscrição',
        detalhes: `Cancelou inscrição do atleta ${inscricao.atleta?.nome} na competição ${selectedCompeticao?.nomeCompeticao} - Atleta excluído da competição`,
        tipoUsuario: user?.tipo || 'usuario'
      });

      toast.success('Inscrição cancelada e atleta excluído da competição com sucesso!');
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      toast.error(`Erro ao cancelar inscrição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Funções para controle de prazos
  const podeEditarInscricao = (competicao: Competicao): boolean => {
    if (!competicao.dataNominacaoFinal) return true;
    
    const hoje = new Date();
    const umDiaAntes = new Date(competicao.dataNominacaoFinal);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    return hoje <= umDiaAntes;
  };

  const podeInscrever = (competicao: Competicao): boolean => {
    const hoje = new Date();
    return hoje <= competicao.dataFimInscricao;
  };

  // Funções para controle de acesso por equipe
  const podeGerenciarInscricao = (inscricao: InscricaoCompeticao): boolean => {
    // Admin pode gerenciar qualquer inscrição
    if (user?.tipo === 'admin') return true;
    
    // Usuário comum só pode gerenciar inscrições de atletas da sua equipe
    if (user?.idEquipe && inscricao.atleta?.idEquipe === user.idEquipe) return true;
    
    return false;
  };

  const podeCancelarInscricao = (inscricao: InscricaoCompeticao): boolean => {
    // Verificar se pode gerenciar
    if (!podeGerenciarInscricao(inscricao)) return false;
    
    // Verificar se está dentro do prazo para cancelar (até 1 dia antes da competição)
    if (!selectedCompeticao) return false;
    
    const hoje = new Date();
    const umDiaAntes = new Date(selectedCompeticao.dataCompeticao);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    return hoje <= umDiaAntes;
  };

  const resetForm = () => {
    setFormData({
      nomeCompeticao: '',
      dataCompeticao: '',
      valorInscricao: '',
      valorDobra: '',
      dataInicioInscricao: '',
      dataFimInscricao: '',
      dataNominacaoPreliminar: '',
      dataNominacaoFinal: '',
      local: '',
      descricao: '',
      status: 'AGENDADA',
      permiteDobraCategoria: false,
      modalidade: 'CLASSICA',
      tipoCompeticao: ''
    });
    setEditingCompeticao(null);
  };

  const handleGerenciarTipos = () => {
    setEditandoTipos([...tiposCompeticao]);
    setShowTiposModal(true);
  };

  const handleSalvarTipos = async () => {
    try {
      await tipoCompeticaoService.update(editandoTipos);
      setTiposCompeticao(editandoTipos);
      setShowTiposModal(false);
      toast.success('Tipos de competição atualizados com sucesso!');
      
      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Atualizou tipos de competição',
        detalhes: `Tipos atualizados: ${editandoTipos.join(', ')}`,
        tipoUsuario: user?.tipo || 'usuario'
      });
    } catch (error) {
      toast.error('Erro ao salvar tipos de competição');
      console.error(error);
    }
  };

  const handleAdicionarTipo = () => {
    const novoTipo = prompt('Digite o novo tipo de competição:');
    if (novoTipo && novoTipo.trim()) {
      setEditandoTipos([...editandoTipos, novoTipo.trim()]);
    }
  };

  const handleRemoverTipo = (index: number) => {
    const novosTipos = editandoTipos.filter((_, i) => i !== index);
    setEditandoTipos(novosTipos);
  };

  // Função para ver detalhes de um resultado
  const handleVerDetalhesResultado = (resultado: ResultadoImportado) => {
    // Navegar para a página de detalhes
    window.open(`/detalhes-resultado/${resultado.id}`, '_blank');
  };

  // Função para converter chaves técnicas em nomes legíveis
  const getCategoryDisplayName = (key: string): string => {
    const categoryMap: { [key: string]: string } = {
      'astClassic': 'AST - Clássico',
      'astEquipped': 'AST - Equipado',
      'sClassic': 'Supino - Clássico',
      'sEquipped': 'Supino - Equipado',
      'tClassic': 'Terra - Clássico',
      'tEquipped': 'Terra - Equipado'
    };
    
    return categoryMap[key] || key;
  };

  // Função para excluir resultado importado
  const handleExcluirResultado = async (resultado: ResultadoImportado) => {
    try {
      const confirmacao = window.confirm(
        `⚠️ ATENÇÃO: Tem certeza que deseja excluir os resultados importados da competição "${resultado.competitionName}"?\n\nEsta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.`
      );
      
      if (!confirmacao) return;

      await resultadoImportadoService.delete(resultado.id!);
      toast.success(`✅ Resultados da competição "${resultado.competitionName}" excluídos com sucesso!`);
      
      // Recarregar a lista
      await loadResultadosImportados();
    } catch (error) {
      console.error('❌ Erro ao excluir resultado importado:', error);
      toast.error('Erro ao excluir resultado importado. Tente novamente.');
    }
  };

  // Função para ver resultados no formato CBLB
  const handleVerResultadosCBLB = (resultado: ResultadoImportado) => {
    setCblbResultado(resultado);
    setShowCBLBModal(true);
  };

  // Função para exportar resultado para PDF
  const handleExportarResultadoPDF = async (resultado: ResultadoImportado) => {
    try {
      // Buscar dados completos do resultado
      const resultadoCompleto = await resultadoImportadoService.getById(resultado.id!);
      if (!resultadoCompleto) {
        toast.error('Erro ao carregar dados para exportação');
        return;
      }

      // Gerar PDF
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.text('Resultados da Competição', 14, 20);
      
      doc.setFontSize(12);
      doc.text(`${resultadoCompleto.competitionName}`, 14, 30);
      doc.text(`${resultadoCompleto.competitionCity} - ${formatarData(resultadoCompleto.competitionDate)}`, 14, 37);
      doc.text(`Total de Atletas: ${resultadoCompleto.totalAthletes}`, 14, 44);
      doc.text(`Data de Importação: ${formatarData(resultadoCompleto.importDate)}`, 14, 51);
      
      // Resultados por categoria
      if (resultadoCompleto.results?.complete) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Resultados por Categoria', 14, 20);
        
        let yPosition = 35;
        resultadoCompleto.results.complete.forEach((category: any, index: number) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(14);
          doc.text(category.category, 14, yPosition);
          yPosition += 10;
          
          // Tabela de resultados da categoria
          const tableData = category.results.map((result: any, pos: number) => [
            pos + 1,
            result.entry.name,
            result.entry.team || '-',
            result.total,
            result.points.toFixed(2)
          ]);
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Pos', 'Atleta', 'Equipe', 'Total (kg)', 'Pontos IPF GL']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 15;
        });
      }
      
      // Ranking de equipes
      if (resultadoCompleto.results?.teams) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Ranking de Equipes', 14, 20);
        
        let yPosition = 35;
        Object.entries(resultadoCompleto.results.teams).forEach(([key, teams]: [string, any]) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.text(getCategoryDisplayName(key), 14, yPosition);
          yPosition += 8;
          
          if (teams && Array.isArray(teams)) {
            const tableData = teams.map((team: any, pos: number) => [
              pos + 1,
              team.name,
              team.totalPoints,
              team.firstPlaces,
              team.secondPlaces,
              team.thirdPlaces
            ]);
            
            autoTable(doc, {
              startY: yPosition,
              head: [['Pos', 'Equipe', 'Pontos', '1º', '2º', '3º']],
              body: tableData,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [66, 139, 202] }
            });
            
            yPosition = (doc as any).lastAutoTable.finalY + 15;
          }
        });
      }
      
      // Salvar PDF
      const fileName = `resultados_${resultadoCompleto.competitionName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success(`PDF exportado com sucesso: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  // Função para carregar resultados importados do Firebase
  const loadResultadosImportados = async () => {
    try {
      setLoadingResultados(true);
      
      // Buscar resultados reais do Firebase
      const resultados = await resultadoImportadoService.getAll();
      setResultadosImportados(resultados);
      
      if (resultados.length === 0) {
        console.log('ℹ️ Nenhum resultado importado encontrado no Firebase');
      } else {
        console.log(`✅ ${resultados.length} resultado(s) importado(s) carregado(s) do Firebase`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar resultados:', error);
      toast.error('Erro ao carregar resultados importados');
      // Em caso de erro, manter array vazio
      setResultadosImportados([]);
    } finally {
      setLoadingResultados(false);
    }
  };

  // Estado para forçar refresh dos records
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  // Função para recarregar records (usada pelo RecordsDisplay)
  const loadRecords = () => {
    // Esta função é chamada pelo RecordsDisplay para forçar recarregamento
    console.log('🔄 Recarregando records...');
    
    // Incrementar a chave para forçar re-render do RecordsDisplay
    setRecordsRefreshKey(prev => prev + 1);
  };

  const filteredCompeticoes = competicoes.filter(competicao =>
    competicao && competicao.nomeCompeticao && 
    (competicao.nomeCompeticao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (competicao.local && competicao.local.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (competicao.status && competicao.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (competicao.tipoCompeticao && competicao.tipoCompeticao.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AGENDADA':
        return <Badge bg="primary">Agendada</Badge>;
      case 'REALIZADA':
        return <Badge bg="success">Realizada</Badge>;
      case 'CANCELADA':
        return <Badge bg="danger">Cancelada</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>🏆 Gestão de Competições</h2>
          {user?.tipo !== 'admin' && (
            <p className="text-muted mb-0">
              Visualização apenas - Apenas administradores podem gerenciar competições
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          {user?.tipo === 'admin' && (
            <>
              <Button 
                variant="outline-info" 
                onClick={handleGerenciarTipos}
                title="Gerenciar tipos de competição"
              >
                <FaCog className="me-2" />
                Tipos de Competição
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setEditingCompeticao(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                <FaPlus className="me-2" />
                Nova Competição
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sistema de Abas */}
      <Row className="mb-4">
        <Col>
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k as 'competicoes' | 'resultados' | 'record')}>
            <Nav.Item>
              <Nav.Link eventKey="competicoes" className="fw-bold">
                🏆 Competições
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="resultados" className="fw-bold">
                📊 Resultados Importados
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="record" className="fw-bold">
                👑 Records
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
      </Row>

      {/* Conteúdo da aba Competições */}
      {activeTab === 'competicoes' && (
        <Card>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nome, local, status ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Local</th>
                <th>Valor Inscrição</th>
                <th>Status</th>
                <th>Inscrições</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompeticoes.filter(competicao => competicao && competicao.id && competicao.nomeCompeticao && competicao.dataCompeticao && competicao.valorInscricao && competicao.status).map((competicao) => (
                <tr 
                  key={competicao.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDetalhesCompeticao(competicao)}
                  className="hover-row"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td>
                    <strong>{competicao.nomeCompeticao || 'Nome não informado'}</strong>
                    <div className="mt-1">
                      {competicao.modalidade === 'CLASSICA' && (
                        <Badge bg="primary" className="me-1">Clássica</Badge>
                      )}
                      {competicao.modalidade === 'EQUIPADO' && (
                        <Badge bg="success" className="me-1">Equipado</Badge>
                      )}
                      {competicao.modalidade === 'CLASSICA_EQUIPADO' && (
                        <Badge bg="info" className="me-1">Clássica + Equipado</Badge>
                      )}
                      {competicao.permiteDobraCategoria && (
                        <Badge bg="warning" className="ms-1">Dobra</Badge>
                      )}
                      {competicao.tipoCompeticao && (
                        <Badge bg="secondary" className="ms-1">{competicao.tipoCompeticao}</Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <FaCalendarAlt className="me-1" />
                      {formatarData(competicao.dataCompeticao)}
                    </div>
                  </td>
                  <td>
                    {competicao.local ? (
                      <div>
                        <FaMapMarkerAlt className="me-1" />
                        {competicao.local}
                      </div>
                    ) : (
                      <div className="text-muted">
                        <small>Local não informado</small>
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <FaMoneyBillWave className="me-1" />
                      R$ {competicao.valorInscricao ? competicao.valorInscricao.toFixed(2) : '0.00'}
                      {competicao.valorDobra && (
                        <span className="text-muted ms-1">
                          (Dobra: R$ {competicao.valorDobra ? competicao.valorDobra.toFixed(2) : '0.00'})
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{competicao.status ? getStatusBadge(competicao.status) : <Badge bg="secondary">Status não informado</Badge>}</td>
                  <td>
                     <div className="text-muted">
                       <small>Clique na linha para ver detalhes</small>
                    </div>
                  </td>
                  <td>
                     <div className="text-muted">
                       <small>Clique na linha para ver detalhes</small>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredCompeticoes.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhuma competição encontrada.
            </Alert>
          )}
        </Card.Body>
      </Card>
      )}

      {/* Conteúdo da aba Resultados */}
      {activeTab === 'resultados' && (
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>📊 Resultados Importados do Barra Pronta</h5>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={loadResultadosImportados}
                disabled={loadingResultados}
              >
                {loadingResultados ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <FaDownload className="me-2" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>

            {loadingResultados ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Carregando resultados...</span>
                </Spinner>
              </div>
            ) : resultadosImportados.length === 0 ? (
              <Alert variant="info" className="text-center">
                <strong>ℹ️ Nenhum resultado importado encontrado</strong>
                <br />
                Os resultados aparecerão aqui após serem importados do sistema Barra Pronta.
              </Alert>
            ) : (
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Nome da Competição</th>
                    <th>Data da Competição</th>
                    <th>Cidade</th>
                    <th>Total de Atletas</th>
                    <th>Data de Importação</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                                     <tbody>
                       {resultadosImportados.map((resultado) => (
                         <tr key={resultado.id}>
                           <td>
                             <strong>{resultado.competitionName}</strong>
                           </td>
                           <td>
                             <FaCalendarAlt className="me-1" />
                             {formatarData(resultado.competitionDate)}
                           </td>
                           <td>
                             <FaMapMarkerAlt className="me-1" />
                             {resultado.competitionCity}
                           </td>
                           <td>
                             <Badge bg="info">
                               {resultado.totalAthletes} atleta{resultado.totalAthletes !== 1 ? 's' : ''}
                             </Badge>
                           </td>
                           <td>
                             <small className="text-muted">
                               {formatarData(resultado.importDate)}
                             </small>
                           </td>
                           <td>
                             <Badge bg="success">
                               {resultado.status}
                             </Badge>
                           </td>
                           <td>
                             <div className="d-flex gap-1">
                               <Button
                                 variant="outline-primary"
                                 size="sm"
                                 onClick={() => handleVerDetalhesResultado(resultado)}
                                 title="Ver detalhes dos resultados"
                               >
                                 <FaChartBar className="me-1" />
                                 Detalhes
                               </Button>
                               <Button
                                 variant="outline-success"
                                 size="sm"
                                 onClick={() => handleExportarResultadoPDF(resultado)}
                                 title="Exportar para PDF"
                                 disabled={!resultado.results}
                               >
                                 <FaFileExport className="me-1" />
                                 PDF
                               </Button>
                               <Button
                                 variant="outline-info"
                                 size="sm"
                                 onClick={() => handleVerResultadosCBLB(resultado)}
                                 title="Ver resultados no formato CBLB"
                                 disabled={!resultado.results}
                               >
                                 <FaTrophy className="me-1" />
                                 CBLB
                               </Button>
                               {isAdmin && (
                                 <Button
                                   variant="outline-danger"
                                   size="sm"
                                   onClick={() => handleExcluirResultado(resultado)}
                                   title="Excluir resultados importados"
                                 >
                                   <FaTrash className="me-1" />
                                   Excluir
                                 </Button>
                               )}
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

               {/* Conteúdo da aba Records */}
         {activeTab === 'record' && (
           <Card>
             <Card.Body>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h5>👑 Records de Powerlifting</h5>
                 {isAdmin && (
                   <Alert variant="success" className="mb-0">
                     <FaCog className="me-2" />
                     <strong>🎯 Edição Inline Ativada:</strong> Configure os filtros na tabela para editar records diretamente
                   </Alert>
                 )}
               </div>
         
               <Alert variant="info" className="mb-3">
                 <strong>ℹ️ Informação:</strong> Os records são organizados por divisão de idade, gênero e modalidade.
                 <br />
                 <strong>📋 Formato:</strong> O administrador configura movimento, divisão, modalidade e sexo.
                 <br />
                 {isAdmin ? (
                   <>
                     <strong>🎯 Edição Inline:</strong> Configure os filtros na tabela para editar records diretamente.
                     <br />
                     <strong>👁️ Visualização:</strong> Usuários comuns podem visualizar e exportar records.
                   </>
                 ) : (
                   <>
                     <strong>👁️ Visualização:</strong> Você pode visualizar e exportar records.
                     <br />
                     <strong>🔒 Edição:</strong> Apenas administradores podem editar records.
                   </>
                 )}
               </Alert>
         
               <RecordsDisplay key={recordsRefreshKey} onRefresh={loadRecords} />
             </Card.Body>
           </Card>
         )}

      {/* Modal de Cadastro/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCompeticao ? 'Editar Competição' : 'Nova Competição'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Informação:</strong> Apenas administradores podem criar e editar competições.
              <br />
              <strong>📅 Datas Automáticas:</strong> As datas de nominata preliminar (60 dias antes) e final (21 dias antes) são calculadas automaticamente baseadas na data da competição.
            </Alert>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Competição *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nomeCompeticao}
                    onChange={(e) => setFormData({...formData, nomeCompeticao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data da Competição *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataCompeticao}
                    onChange={(e) => setFormData({...formData, dataCompeticao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Local</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.local}
                    onChange={(e) => setFormData({...formData, local: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    required
                  >
                    <option value="AGENDADA">Agendada</option>
                    <option value="REALIZADA">Realizada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor da Inscrição (R$) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorInscricao}
                    onChange={(e) => setFormData({...formData, valorInscricao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor da Dobra (R$)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorDobra}
                    onChange={(e) => setFormData({...formData, valorDobra: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Início das Inscrições *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataInicioInscricao}
                    onChange={(e) => setFormData({...formData, dataInicioInscricao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fim das Inscrições *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataFimInscricao}
                    onChange={(e) => setFormData({...formData, dataFimInscricao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nominata Preliminar 
                    <Badge bg="info" className="ms-2">Auto: 60 dias antes</Badge>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNominacaoPreliminar}
                    onChange={(e) => setFormData({...formData, dataNominacaoPreliminar: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    Calculada automaticamente 60 dias antes da competição
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nominata Final 
                    <Badge bg="info" className="ms-2">Auto: 21 dias antes</Badge>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNominacaoFinal}
                    onChange={(e) => setFormData({...formData, dataNominacaoFinal: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    Calculada automaticamente 21 dias antes da competição
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Modalidade da Competição *</Form.Label>
                  <Form.Select
                    value={formData.modalidade}
                    onChange={(e) => setFormData({...formData, modalidade: e.target.value as any})}
                    required
                  >
                    <option value="CLASSICA">Apenas Clássica</option>
                    <option value="EQUIPADO">Apenas Equipado</option>
                    <option value="CLASSICA_EQUIPADO">Clássica e Equipado</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {formData.modalidade === 'CLASSICA' && 'Atletas só podem se inscrever uma vez (Clássica)'}
                    {formData.modalidade === 'EQUIPADO' && 'Atletas só podem se inscrever uma vez (Equipado)'}
                    {formData.modalidade === 'CLASSICA_EQUIPADO' && 'Atletas podem se inscrever duas vezes (uma em cada modalidade)'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Competição *</Form.Label>
                  {user?.tipo === 'admin' ? (
                    <Form.Select
                      value={formData.tipoCompeticao}
                      onChange={(e) => setFormData({...formData, tipoCompeticao: e.target.value})}
                      required
                    >
                      <option value="">Selecione um tipo</option>
                      {tiposCompeticao.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type="text"
                      value={formData.tipoCompeticao}
                      readOnly
                      className="bg-light"
                    />
                  )}
                  <Form.Text className="text-muted">
                    {user?.tipo === 'admin' 
                      ? 'Apenas administradores podem configurar os tipos de competição' 
                      : 'Tipo configurado pelo administrador'
                    }
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Permite dobra de categoria"
                    checked={formData.permiteDobraCategoria}
                    onChange={(e) => setFormData({...formData, permiteDobraCategoria: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingCompeticao ? 'Atualizar' : 'Criar'} Competição
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Inscrições */}
      <Modal show={showInscricoesModal} onHide={() => setShowInscricoesModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" />
            Inscrições - {selectedCompeticao?.nomeCompeticao}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="inscritos" className="mb-3">
            <Tab eventKey="inscritos" title="Inscritos">
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Equipe</th>
                    <th>Data Inscrição</th>
                    <th>Status</th>
                    <th>Modalidade</th>
                    <th>Valor</th>
                    <th>Dobra</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.filter(i => i.statusInscricao === 'INSCRITO').map((inscricao) => (
                    <tr key={inscricao.id}>
                      <td>
                        <div>
                          <strong>{inscricao.atleta?.nome}</strong>
                          <br />
                          <small className="text-muted">{inscricao.atleta?.cpf}</small>
                        </div>
                      </td>
                      <td>{inscricao.atleta?.equipe?.nomeEquipe || '-'}</td>
                      <td>
                        {formatarData(inscricao.dataInscricao)}
                      </td>
                      <td>
                        <Badge bg="success">
                          <FaUserCheck className="me-1" />
                          Inscrito
                        </Badge>
                      </td>
                      <td>
                        {inscricao.modalidade === 'CLASSICA' && (
                          <Badge bg="primary">Clássica</Badge>
                        )}
                        {inscricao.modalidade === 'EQUIPADO' && (
                          <Badge bg="success">Equipado</Badge>
                        )}
                        {!inscricao.modalidade && (
                          <Badge bg="secondary">N/A</Badge>
                        )}
                      </td>
                      <td>
                        R$ {inscricao.valorIndividual?.toFixed(2) || selectedCompeticao?.valorInscricao.toFixed(2)}
                      </td>
                      <td>
                        {inscricao.dobraCategoria ? (
                          <Badge bg="warning">
                            {inscricao.dobraCategoria.categoriaIdade.nome}
                          </Badge>
                        ) : (
                          <Badge bg="secondary">Não</Badge>
                        )}
                      </td>
                                             <td>
                         <div className="d-flex gap-1">
                           {podeEditarInscricao(selectedCompeticao!) && podeGerenciarInscricao(inscricao) && (
                             <Button
                               variant="outline-primary"
                               size="sm"
                               onClick={() => handleEditarInscricao(inscricao)}
                               title="Editar inscrição"
                             >
                               <FaEdit className="me-1" />
                               Editar
                             </Button>
                           )}
                           {podeCancelarInscricao(inscricao) && (
                             <Button
                               variant="outline-danger"
                               size="sm"
                               onClick={() => handleCancelarInscricao(inscricao)}
                               title="Cancelar inscrição"
                             >
                               <FaUserTimes className="me-1" />
                               Cancelar
                             </Button>
                           )}
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {inscricoes.filter(i => i.statusInscricao === 'INSCRITO').length === 0 && (
                <Alert variant="info" className="text-center">
                  Nenhum atleta inscrito nesta competição.
                </Alert>
              )}
            </Tab>
            
            
            <Tab eventKey="estatisticas" title="Estatísticas">
              <Row className="justify-content-center">
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.statusInscricao === 'INSCRITO').length}</h3>
                      <p className="text-muted">Total de Inscritos</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.statusInscricao === 'INSCRITO' && i.dobraCategoria).length}</h3>
                      <p className="text-muted">Atletas com Dobra</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={12}>
                  <Card>
                    <Card.Header>
                      <FaChartBar className="me-2" />
                      Inscrições por Equipe
                    </Card.Header>
                    <Card.Body>
                      <Table responsive>
                        <thead>
                          <tr>
                            <th>Equipe</th>
                            <th>Total de Inscritos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(new Set(inscricoes
                            .filter(i => i.statusInscricao === 'INSCRITO')
                            .map(i => i.atleta?.equipe?.nomeEquipe)))
                            .filter(equipe => equipe)
                            .map(equipe => (
                              <tr key={equipe}>
                                <td>{equipe}</td>
                                <td>
                                  {inscricoes.filter(i => 
                                    i.statusInscricao === 'INSCRITO' && 
                                    i.atleta?.equipe?.nomeEquipe === equipe
                                  ).length}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInscricoesModal(false)}>
            Fechar
          </Button>
                 </Modal.Footer>
       </Modal>

       {/* Modal de Inscrição de Atletas */}
       <Modal show={showInscricaoModal} onHide={() => setShowInscricaoModal(false)} size="lg">
         <Modal.Header closeButton>
           <Modal.Title>
             <FaUserCheck className="me-2" />
             Inscrever Atletas - {selectedCompeticao?.nomeCompeticao}
           </Modal.Title>
         </Modal.Header>
         <Form onSubmit={handleSubmitInscricao}>
           <Modal.Body>
             <Alert variant="info" className="mb-3">
               <strong>ℹ️ Informação:</strong> 
               {user?.tipo === 'admin' 
                 ? 'Administradores podem inscrever atletas de qualquer equipe.'
                 : 'Você pode inscrever apenas atletas da sua equipe.'
               }
               <br />
               <strong>💰 Valor da Inscrição:</strong> R$ {selectedCompeticao?.valorInscricao.toFixed(2)}
               {selectedCompeticao?.valorDobra && (
                 <span> | <strong>Valor da Dobra:</strong> R$ {selectedCompeticao.valorDobra.toFixed(2)}</span>
               )}
               <br />
               <strong>🎯 Categoria Convidado:</strong> Durante a categorização, você pode selecionar "Convidado" para atletas especiais sem restrições de idade/peso.
             </Alert>

             {atletasDisponiveis.length === 0 ? (
               <Alert variant="warning" className="text-center">
                 <strong>⚠️ Nenhum atleta disponível para inscrição</strong>
                 <br />
                 Todos os atletas da sua equipe já estão inscritos nesta competição.
               </Alert>
             ) : (
               <>
                 <Form.Group className="mb-3">
                   <Form.Label>Selecionar Atletas</Form.Label>
                   <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                     {atletasDisponiveis.map((atleta) => (
                       <Form.Check
                         key={atleta.id}
                         type="checkbox"
                         id={`atleta-${atleta.id}`}
                         label={
                           <div className="d-flex justify-content-between align-items-center">
                             <div>
                               <strong>{atleta.nome}</strong>
                               <br />
                               <small className="text-muted">
                                 CPF: {atleta.cpf} | Equipe: {atleta.equipe?.nomeEquipe || 'N/A'}
                               </small>
                               {selectedCompeticao?.modalidade === 'CLASSICA_EQUIPADO' && (atleta as any).inscricoesExistentes && (
                                 <div className="mt-1">
                                   <small className="text-info">
                                     <strong>Inscrições existentes:</strong> {
                                       (atleta as any).inscricoesExistentes.map((modalidade: string) => 
                                         modalidade === 'CLASSICA' ? 'Clássica' : 'Equipado'
                                       ).join(', ')
                                     }
                                   </small>
                                 </div>
                               )}
                             </div>
                             <Badge bg="info">
                               {atleta.maiorTotal ? `${atleta.maiorTotal}kg` : 'Sem total'}
                             </Badge>
                           </div>
                         }
                         checked={atletasSelecionados.includes(atleta.id!)}
                         onChange={(e) => handleAtletaSelection(atleta.id!, e.target.checked)}
                       />
                     ))}
                   </div>
                 </Form.Group>

                 {selectedCompeticao?.modalidade === 'CLASSICA_EQUIPADO' && (
                   <Form.Group className="mb-3">
                     <Form.Label>Modalidade da Inscrição *</Form.Label>
                     <Form.Select
                       value={inscricaoFormData.modalidade}
                       onChange={(e) => setInscricaoFormData({...inscricaoFormData, modalidade: e.target.value as 'CLASSICA' | 'EQUIPADO'})}
                       required
                     >
                       <option value="">Selecione a modalidade</option>
                       <option value="CLASSICA">Clássica</option>
                       <option value="EQUIPADO">Equipado</option>
                     </Form.Select>
                     <Form.Text className="text-muted">
                       Selecione em qual modalidade os atletas irão competir
                     </Form.Text>
                   </Form.Group>
                 )}


                 <Form.Group className="mb-3">
                   <Form.Label>Observações (opcional)</Form.Label>
                   <Form.Control
                     as="textarea"
                     rows={3}
                     value={inscricaoFormData.observacoes}
                     onChange={(e) => setInscricaoFormData({...inscricaoFormData, observacoes: e.target.value})}
                     placeholder="Observações sobre as inscrições..."
                   />
                 </Form.Group>

                 {atletasSelecionados.length > 0 && (
                   <Alert variant="success">
                     <strong>📋 Resumo da Inscrição:</strong>
                     <br />
                     • <strong>{atletasSelecionados.length}</strong> atleta(s) selecionado(s)
                     {selectedCompeticao?.modalidade === 'CLASSICA_EQUIPADO' && inscricaoFormData.modalidade && (
                       <span>
                         <br />
                         • <strong>Modalidade:</strong> {inscricaoFormData.modalidade === 'CLASSICA' ? 'Clássica' : 'Equipado'}
                       </span>
                     )}
                     <br />
                     • <strong>Valor total:</strong> R$ {
                       selectedCompeticao ? (
                         (atletasSelecionados.length * selectedCompeticao.valorInscricao).toFixed(2)
                       ) : '0.00'
                     }
                   </Alert>
                 )}
               </>
             )}
           </Modal.Body>
           <Modal.Footer>
             <Button variant="secondary" onClick={() => setShowInscricaoModal(false)}>
               Cancelar
             </Button>
             {atletasDisponiveis.length > 0 && (
               <Button variant="primary" type="submit" disabled={atletasSelecionados.length === 0}>
                 Inscrever {atletasSelecionados.length} Atleta(s)
               </Button>
             )}
           </Modal.Footer>
         </Form>
       </Modal>

       {/* Modal de Categorização */}
       <Modal show={showCategorizacaoModal} onHide={() => setShowCategorizacaoModal(false)} size="xl">
         <Modal.Header closeButton>
           <Modal.Title>
             <FaUsers className="me-2" />
             Categorização de Atletas - {selectedCompeticao?.nomeCompeticao}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           <Alert variant="info" className="mb-3">
             <strong>ℹ️ Informação:</strong> 
             Defina a categoria de peso e idade para cada atleta selecionado.
             {selectedCompeticao?.permiteDobraCategoria && (
               <span> Você também pode configurar dobra de categoria se desejar.</span>
             )}
           </Alert>

           {atletasSelecionados.map(atletaId => {
             const atleta = atletas.find(a => a.id === atletaId);
             const categorizacao = categorizacaoAtletas.get(atletaId);
             
             if (!atleta) return null;

             return (
               <Card key={atletaId} className="mb-3">
                 <Card.Header>
                   <strong>{atleta.nome}</strong> - {atleta.equipe?.nomeEquipe || 'N/A'}
                 </Card.Header>
                 <Card.Body>
                   <Row>
                     <Col md={3}>
                       <Form.Group className="mb-3">
                         <Form.Label>Categoria de Peso</Form.Label>
                         <Form.Select
                           value={categorizacao?.categoriaPeso?.id || ''}
                           onChange={(e) => {
                             const cat = obterCategoriasPeso(atleta.sexo).find(c => c.id === e.target.value);
                             handleCategorizacaoAtleta(
                               atletaId, 
                               cat || null, 
                               categorizacao?.categoriaIdade || null,
                               categorizacao?.dobraCategoria,
                               categorizacao?.total12Meses
                             );
                           }}
                         >
                           <option value="">Selecione a categoria de peso</option>
                           {(() => {
                             const idade = calcularIdade(atleta.dataNascimento!);
                             const categoriasValidas = obterCategoriasPesoValidas(atleta.sexo, idade);
                             const todasCategorias = obterCategoriasPeso(atleta.sexo);
                             
                             return todasCategorias.map(cat => {
                               const podeUsar = categoriasValidas.some(catValida => catValida.id === cat.id);
                               
                               return (
                                 <option 
                                   key={cat.id} 
                                   value={cat.id}
                                   disabled={!podeUsar}
                                 >
                               {cat.nome} - {cat.descricao}
                                   {!podeUsar && ` (Restrito a Sub-júnior: 14-18 anos)`}
                               </option>
                               );
                             });
                           })()}
                         </Form.Select>
                         {categorizacao?.categoriaPeso && (() => {
                           const idade = calcularIdade(atleta.dataNascimento!);
                           if (!validarPesoParaCategoria(idade, categorizacao.categoriaPeso)) {
                             return (
                               <Form.Text className="text-danger">
                                 <strong>⚠️ Restrição de Idade:</strong> Esta categoria de peso é restrita apenas para atletas Sub-júnior (14-18 anos). 
                                 Idade do atleta: {idade} anos.
                               </Form.Text>
                             );
                           }
                           return null;
                         })()}
                       </Form.Group>
                     </Col>
                     <Col md={3}>
                       <Form.Group className="mb-3">
                         <Form.Label>Categoria de Idade</Form.Label>
                         <Form.Select
                           value={categorizacao?.categoriaIdade?.id || ''}
                           onChange={(e) => {
                             const cat = CATEGORIAS_IDADE.find(c => c.id === e.target.value);
                             if (cat) {
                               const idade = calcularIdade(atleta.dataNascimento!);
                               if (!validarIdadeParaCategoria(idade, cat)) {
                                 toast.error(`Categoria de idade inválida para ${atleta.nome}. Idade real: ${idade} anos`);
                                 return;
                               }
                               handleCategorizacaoAtleta(
                                 atletaId, 
                                 categorizacao?.categoriaPeso || null, 
                                 cat,
                                 categorizacao?.dobraCategoria,
                                 categorizacao?.total12Meses
                               );
                             }
                           }}
                         >
                           <option value="">Selecione a categoria de idade</option>
                           {(() => {
                             const idade = calcularIdade(atleta.dataNascimento!);
                             return CATEGORIAS_IDADE.map(cat => {
                             const isValid = validarIdadeParaCategoria(idade, cat);
                             return (
                               <option key={cat.id} value={cat.id} disabled={!isValid}>
                                 {cat.nome} - {cat.descricao} {!isValid && '(Idade não compatível)'}
                               </option>
                             );
                             });
                           })()}
                         </Form.Select>
                       </Form.Group>
                     </Col>
                     <Col md={3}>
                       <Form.Group className="mb-3">
                         <Form.Label>Dobra de Categoria</Form.Label>
                         <Form.Select
                           value={categorizacao?.dobraCategoria?.categoriaIdade?.id || ''}
                           onChange={(e) => {
                             if (e.target.value === '') {
                               handleCategorizacaoAtleta(
                                 atletaId, 
                                 categorizacao?.categoriaPeso || null, 
                                 categorizacao?.categoriaIdade || null,
                                 undefined,
                                 categorizacao?.total12Meses
                               );
                               return;
                             }

                             const categoriaIdadeDobra = CATEGORIAS_IDADE.find(cat => cat.id === e.target.value);
                             if (!categoriaIdadeDobra) return;

                             // Validar se atleta pode usar a categoria de dobra
                             const idade = calcularIdade(atleta.dataNascimento!);
                             if (!validarIdadeParaCategoria(idade, categoriaIdadeDobra)) {
                               toast.error(`Atleta não tem idade suficiente para categoria ${categoriaIdadeDobra.nome}`);
                               return;
                             }

                             // Validar se a combinação é válida para dobra
                             if (!validarDobraCategoria(categorizacao?.categoriaIdade, categoriaIdadeDobra)) {
                               toast.error('Combinação de categorias inválida para dobra');
                               return;
                             }

                             const dobraCategoria = {
                               categoriaPeso: categorizacao?.categoriaPeso,
                               categoriaIdade: categoriaIdadeDobra
                             };

                             handleCategorizacaoAtleta(
                               atletaId, 
                               categorizacao?.categoriaPeso || null, 
                               categorizacao?.categoriaIdade || null,
                               dobraCategoria,
                               categorizacao?.total12Meses
                             );
                           }}
                           disabled={!selectedCompeticao?.permiteDobraCategoria || !categorizacao?.categoriaIdade}
                         >
                           <option value="">Sem dobra</option>
                           {(() => {
                             if (!categorizacao?.categoriaIdade) {
                               return (
                                 <option value="" disabled>
                                   Selecione primeiro uma categoria de idade
                                 </option>
                               );
                             }
                             
                             const opcoesValidas = obterOpcoesDobraValidas(categorizacao.categoriaIdade);
                             const idade = calcularIdade(atleta.dataNascimento!);
                             
                             // Filtrar apenas opções que o atleta pode usar baseado na idade
                             const opcoesFiltradas = opcoesValidas.filter(cat => 
                               validarIdadeParaCategoria(idade, cat)
                             );
                             
                             if (opcoesFiltradas.length === 0) {
                               return (
                                 <option value="" disabled>
                                   Nenhuma opção de dobra disponível para esta categoria
                                 </option>
                               );
                             }
                             
                             return opcoesFiltradas.map(cat => (
                             <option key={cat.id} value={cat.id}>
                               {cat.nome} - {cat.descricao}
                             </option>
                             ));
                           })()}
                         </Form.Select>
                       </Form.Group>
                     </Col>
                     <Col md={3}>
                       <Form.Group className="mb-3">
                         <Form.Label>Total (kg)</Form.Label>
                         <Form.Control
                           type="number"
                           min="0"
                           step="0.1"
                           value={categorizacao?.total12Meses || ''}
                           onChange={(e) => {
                             const valor = parseFloat(e.target.value) || 0;
                             handleCategorizacaoAtleta(
                               atletaId,
                               categorizacao?.categoriaPeso || null,
                               categorizacao?.categoriaIdade || null,
                               categorizacao?.dobraCategoria,
                               valor
                             );
                           }}
                           placeholder="0.0"
                         />
                         <Form.Text className="text-muted">
                           Maior Total Feito nos Últimos 12 meses
                         </Form.Text>
                       </Form.Group>
                     </Col>
                   </Row>
                 </Card.Body>
               </Card>
             );
           })}

           {/* Resumo de Valores */}
           {atletasSelecionados.length > 0 && (
             <Card className="mt-4">
               <Card.Header className="bg-info text-white">
                 <h6 className="mb-0">
                   <FaMoneyBillWave className="me-2" />
                   Resumo de Valores
                 </h6>
               </Card.Header>
               <Card.Body>
                 <Row>
                   <Col md={6}>
                     <h6>Valor por Atleta:</h6>
                     <ul className="list-unstyled">
                       <li><strong>Inscrição:</strong> R$ {selectedCompeticao?.valorInscricao.toFixed(2)}</li>
                       {selectedCompeticao?.valorDobra && (
                         <li><strong>Dobra:</strong> R$ {selectedCompeticao.valorDobra.toFixed(2)}</li>
                       )}
                     </ul>
                   </Col>
                   <Col md={6}>
                     <h6>Total por Atleta:</h6>
                     {atletasSelecionados.map(atletaId => {
                       const categorizacao = categorizacaoAtletas.get(atletaId);
                       const atleta = atletas.find(a => a.id === atletaId);
                       const valorBase = selectedCompeticao?.valorInscricao || 0;
                       const valorDobra = categorizacao?.dobraCategoria ? (selectedCompeticao?.valorDobra || 0) : 0;
                       const valorTotal = valorBase + valorDobra;
                       
                       return (
                         <div key={atletaId} className="mb-1">
                           <strong>{atleta?.nome}:</strong> R$ {valorTotal.toFixed(2)}
                           {categorizacao?.dobraCategoria && (
                             <Badge bg="warning" className="ms-2">Com Dobra</Badge>
                           )}
                         </div>
                       );
                     })}
                   </Col>
                 </Row>
                 <hr />
                 <div className="text-center">
                   <h5 className="text-primary">
                     <strong>Total Geral: R$ {
                       atletasSelecionados.reduce((total, atletaId) => {
                         const categorizacao = categorizacaoAtletas.get(atletaId);
                         const valorBase = selectedCompeticao?.valorInscricao || 0;
                         const valorDobra = categorizacao?.dobraCategoria ? (selectedCompeticao?.valorDobra || 0) : 0;
                         return total + valorBase + valorDobra;
                       }, 0).toFixed(2)
                     }</strong>
                   </h5>
                 </div>
               </Card.Body>
             </Card>
           )}
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowCategorizacaoModal(false)}>
             Cancelar
           </Button>
           <Button 
             variant="primary" 
             onClick={handleFinalizarInscricao}
             disabled={atletasSelecionados.some(atletaId => {
               const categorizacao = categorizacaoAtletas.get(atletaId);
               return !categorizacao || !categorizacao.categoriaPeso || !categorizacao.categoriaIdade;
             })}
           >
             Finalizar Inscrição
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Modal de Edição de Inscrição */}
       <Modal show={showEditarInscricaoModal} onHide={() => setShowEditarInscricaoModal(false)} size="lg">
         <Modal.Header closeButton>
           <Modal.Title>
             <FaEdit className="me-2" />
             Editar Inscrição - {inscricaoEmEdicao?.atleta?.nome}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {inscricaoEmEdicao && selectedCompeticao && (
             <EditarInscricaoForm
               inscricao={inscricaoEmEdicao}
               competicao={selectedCompeticao}
               onSave={handleSalvarEdicaoInscricao}
               onCancel={() => setShowEditarInscricaoModal(false)}
             />
           )}
         </Modal.Body>
       </Modal>

       {/* Modal de Detalhes da Competição */}
       <Modal show={showDetalhesCompeticaoModal} onHide={() => setShowDetalhesCompeticaoModal(false)} size="lg">
         <Modal.Header closeButton>
           <Modal.Title>
             <FaCalendarAlt className="me-2" />
             Detalhes da Competição
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {competicaoDetalhes && (
             <div>
               <Row>
                 <Col md={12}>
                   <h4 className="text-primary mb-3">{competicaoDetalhes.nomeCompeticao}</h4>
                 </Col>
               </Row>
               
               <Row className="mb-3">
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaCalendarAlt className="text-primary mb-2" size={24} />
                       <h6>Data da Competição</h6>
                       <p className="mb-0 fw-bold">
                         {formatarData(competicaoDetalhes.dataCompeticao)}
                       </p>
                     </Card.Body>
                   </Card>
                 </Col>
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaMapMarkerAlt className="text-info mb-2" size={24} />
                       <h6>Local</h6>
                       <p className="mb-0 fw-bold">
                         {competicaoDetalhes.local || 'Não informado'}
                       </p>
                     </Card.Body>
                   </Card>
                 </Col>
               </Row>

               <Row className="mb-3">
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaMoneyBillWave className="text-success mb-2" size={24} />
                       <h6>Valor da Inscrição</h6>
                       <p className="mb-0 fw-bold text-success">
                         R$ {competicaoDetalhes.valorInscricao.toFixed(2)}
                       </p>
                       {competicaoDetalhes.valorDobra && (
                         <small className="text-muted">
                           Dobra: R$ {competicaoDetalhes.valorDobra.toFixed(2)}
                         </small>
                       )}
                     </Card.Body>
                   </Card>
                 </Col>
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaUsers className="text-warning mb-2" size={24} />
                       <h6>Status</h6>
                       <p className="mb-0">
                         {getStatusBadge(competicaoDetalhes.status)}
                       </p>
                     </Card.Body>
                   </Card>
                 </Col>
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaTrophy className="text-info mb-2" size={24} />
                       <h6>Modalidade</h6>
                       <p className="mb-0">
                         {competicaoDetalhes.modalidade === 'CLASSICA' && (
                           <Badge bg="primary">Clássica</Badge>
                         )}
                         {competicaoDetalhes.modalidade === 'EQUIPADO' && (
                           <Badge bg="success">Equipado</Badge>
                         )}
                         {competicaoDetalhes.modalidade === 'CLASSICA_EQUIPADO' && (
                           <Badge bg="info">Clássica + Equipado</Badge>
                         )}
                       </p>
                     </Card.Body>
                   </Card>
                 </Col>
               </Row>

               <Row className="mb-3">
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaCalendarAlt className="text-info mb-2" size={24} />
                       <h6>Prazo de Inscrição</h6>
                       <p className="mb-0 fw-bold">
                         Até {formatarData(competicaoDetalhes.dataFimInscricao)}
                       </p>
                       <small className="text-muted">
                                                   Início: {formatarData(competicaoDetalhes.dataInicioInscricao)}
                       </small>
                     </Card.Body>
                   </Card>
                 </Col>
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaCalendarAlt className="text-warning mb-2" size={24} />
                       <h6>Nominata Final</h6>
                       <p className="mb-0 fw-bold">
                         {competicaoDetalhes.dataNominacaoFinal 
                           ? formatarData(competicaoDetalhes.dataNominacaoFinal)
                           : 'Não definida'
                         }
                       </p>
                       <small className="text-muted">
                         {competicaoDetalhes.dataNominacaoPreliminar && 
                           `Preliminar: ${formatarData(competicaoDetalhes.dataNominacaoPreliminar)}`
                         }
                       </small>
                     </Card.Body>
                   </Card>
                 </Col>
               </Row>

               {competicaoDetalhes.descricao && (
                 <Row className="mb-3">
                   <Col md={12}>
                     <Card>
                       <Card.Body>
                         <h6>Descrição</h6>
                         <p className="mb-0">{competicaoDetalhes.descricao}</p>
                       </Card.Body>
                     </Card>
                   </Col>
                 </Row>
               )}

               <Row className="mb-3">
                 <Col md={12}>
                   <Alert variant="info">
                     <strong>ℹ️ Informação:</strong> Clique em "Ver Inscrições" para gerenciar os atletas inscritos nesta competição.
                     {competicaoDetalhes.permiteDobraCategoria && (
                       <span> Esta competição permite dobra de categoria.</span>
                     )}
                     {competicaoDetalhes.modalidade === 'CLASSICA_EQUIPADO' && (
                       <span> Esta competição permite inscrição em Clássica e Equipado.</span>
                     )}
                   </Alert>
                 </Col>
               </Row>
             </div>
           )}
         </Modal.Body>
         <Modal.Footer>
                       <div className="d-flex gap-2">
              <Button 
                variant="outline-info" 
                onClick={() => {
                  setShowDetalhesCompeticaoModal(false);
                  handleInscricoes(competicaoDetalhes!);
                }}
              >
                <FaUsers className="me-2" />
                Ver Inscrições
              </Button>
              <Button 
                variant="outline-warning" 
                onClick={() => {
                  setShowDetalhesCompeticaoModal(false);
                  handleNominacao(competicaoDetalhes!);
                }}
                disabled={loadingNominacao}
              >
                <FaTrophy className="me-2" />
                {loadingNominacao ? 'Carregando...' : 'Ver Nominação'}
              </Button>
              {user?.tipo === 'admin' || (user?.idEquipe && atletas.some(a => a.idEquipe === user.idEquipe)) ? (
                <Button 
                  variant="outline-success" 
                  onClick={() => {
                    setShowDetalhesCompeticaoModal(false);
                    handleInscreverAtletas(competicaoDetalhes!);
                  }}
                  disabled={competicaoDetalhes?.status !== 'AGENDADA' || !podeInscrever(competicaoDetalhes!)}
                >
                  <FaUserCheck className="me-2" />
                  Inscrever Atletas
                </Button>
              ) : null}
              {user?.tipo === 'admin' && (
                <>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setShowDetalhesCompeticaoModal(false);
                      handleEdit(competicaoDetalhes!);
                    }}
                  >
                    <FaEdit className="me-2" />
                    Editar Competição
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => {
                      setShowDetalhesCompeticaoModal(false);
                      handleDelete(competicaoDetalhes!);
                    }}
                  >
                    <FaTrash className="me-2" />
                    Excluir Competição
                  </Button>
                </>
              )}
            </div>
           <Button variant="secondary" onClick={() => setShowDetalhesCompeticaoModal(false)}>
             Fechar
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Modal de Nominação */}
       <Modal show={showNominacaoModal} onHide={() => setShowNominacaoModal(false)} size="xl">
         <Modal.Header closeButton>
           <Modal.Title>
             <FaTrophy className="me-2" />
             Nominação - {nominacaoCompeticao?.nomeCompeticao}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           {loadingNominacao ? (
             <div className="text-center py-4">
               <Spinner animation="border" variant="primary" />
               <p className="mt-2">Carregando nominação...</p>
             </div>
           ) : (
             <>
               {/* Filtros */}
               <Row className="mb-3">
                 <Col md={6}>
                   <Form.Group>
                     <Form.Label>Filtrar por Modalidade</Form.Label>
                     <Form.Select
                       value={filtroModalidade}
                       onChange={(e) => setFiltroModalidade(e.target.value)}
                     >
                       <option value="">Todas as modalidades</option>
                       <option value="CLASSICA">Clássica</option>
                       <option value="EQUIPADO">Equipado</option>
                     </Form.Select>
                   </Form.Group>
                 </Col>
                 <Col md={6}>
                   <Form.Group>
                     <Form.Label>Filtrar por Equipe</Form.Label>
                     <Form.Select
                       value={filtroEquipe}
                       onChange={(e) => setFiltroEquipe(e.target.value)}
                     >
                       <option value="">Todas as equipes</option>
                       {Array.from(new Set(nominacaoData.map(insc => insc.atleta?.equipe?.nomeEquipe).filter(Boolean))).map(equipe => (
                         <option key={equipe} value={equipe}>{equipe}</option>
                       ))}
                     </Form.Select>
                   </Form.Group>
                 </Col>
               </Row>

               {/* Estatísticas */}
               <Row className="mb-3">
                 <Col md={12}>
                   <Alert variant="info">
                     <strong>📊 Estatísticas da Nominação:</strong>
                     <br />
                     • <strong>Total de atletas:</strong> {nominacaoData.length}
                     {filtroModalidade && (
                       <span>
                         <br />
                         • <strong>Modalidade filtrada:</strong> {filtroModalidade === 'CLASSICA' ? 'Clássica' : 'Equipado'}
                       </span>
                     )}
                     {filtroEquipe && (
                       <span>
                         <br />
                         • <strong>Equipe filtrada:</strong> {filtroEquipe}
                       </span>
                     )}
                     <br />
                     • <strong>Categorias de peso:</strong> {(() => {
                       const categorias = Array.from(new Set(nominacaoData.map(insc => insc.categoriaPeso?.nome).filter(Boolean)));
                       return `${categorias.length} categoria${categorias.length !== 1 ? 's' : ''}`;
                     })()}
                     <br />
                     • <strong>Distribuição por sexo:</strong> {(() => {
                       const masculino = nominacaoData.filter(insc => insc.atleta?.sexo === 'M').length;
                       const feminino = nominacaoData.filter(insc => insc.atleta?.sexo === 'F').length;
                       return `${masculino} masculino${masculino !== 1 ? 's' : ''}, ${feminino} feminino${feminino !== 1 ? 's' : ''}`;
                     })()}
                   </Alert>
                 </Col>
               </Row>

               {/* Tabela de Nominação Agrupada por Sexo e Categoria de Peso */}
               {(() => {
                 // Filtrar dados baseado nos filtros aplicados
                 const dadosFiltrados = nominacaoData.filter(insc => {
                   if (filtroModalidade && insc.modalidade !== filtroModalidade) return false;
                   if (filtroEquipe && insc.atleta?.equipe?.nomeEquipe !== filtroEquipe) return false;
                   return true;
                 });

                 // Agrupar primeiro por sexo, depois por categoria de peso
                 const agrupadoPorSexo = dadosFiltrados.reduce((acc, inscricao) => {
                   const sexo = inscricao.atleta?.sexo || 'N/A';
                   if (!acc[sexo]) {
                     acc[sexo] = {};
                   }
                   
                   const categoriaPeso = inscricao.categoriaPeso?.nome || 'Sem Categoria';
                   if (!acc[sexo][categoriaPeso]) {
                     acc[sexo][categoriaPeso] = [];
                   }
                   acc[sexo][categoriaPeso].push(inscricao);
                   return acc;
                 }, {} as Record<string, Record<string, typeof dadosFiltrados>>);

                 // Ordenar sexos (M primeiro, depois F)
                 const sexosOrdenados = Object.keys(agrupadoPorSexo).sort((a, b) => {
                   if (a === 'M') return -1;
                   if (b === 'M') return 1;
                   return a.localeCompare(b);
                 });

                 return (
                   <div>
                     {sexosOrdenados.map((sexo) => {
                       const categoriasDoSexo = agrupadoPorSexo[sexo];
                       
                       // Ordenar categorias de peso para este sexo
                       const categoriasOrdenadas = Object.keys(categoriasDoSexo).sort((a, b) => {
                         const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                         const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                         return numA - numB;
                       });

                       const totalAtletasSexo = Object.values(categoriasDoSexo).reduce((total, categoria) => total + categoria.length, 0);

                       return (
                         <div key={sexo} className="mb-5">
                           <Card className="mb-3">
                             <Card.Header className={sexo === 'M' ? 'bg-primary text-white' : 'bg-danger text-white'}>
                               <h4 className="mb-0">
                                 <Badge bg={sexo === 'M' ? 'light' : 'light'} text="dark" className="me-2">
                                   {sexo === 'M' ? '🏋️‍♂️ Masculino' : '🏋️‍♀️ Feminino'}
                                 </Badge>
                                 <span className="text-light">
                                   ({totalAtletasSexo} atleta{totalAtletasSexo !== 1 ? 's' : ''})
                                 </span>
                               </h4>
                             </Card.Header>
                           </Card>

                           {categoriasOrdenadas.map((categoriaPeso) => (
                             <div key={`${sexo}-${categoriaPeso}`} className="mb-4 ms-3">
                               <Card className="mb-3">
                                 <Card.Header className="bg-warning text-dark">
                                   <h6 className="mb-0">
                                     <Badge bg="warning" text="dark" className="me-2">
                                       {categoriaPeso}
                                     </Badge>
                                     <span className="text-muted">
                                       ({categoriasDoSexo[categoriaPeso].length} atleta{categoriasDoSexo[categoriaPeso].length !== 1 ? 's' : ''})
                                     </span>
                                   </h6>
                                 </Card.Header>
                                 <Card.Body className="p-0">
                                   <Table striped bordered hover responsive className="mb-0">
                                     <thead className="table-light">
                                       <tr>
                                         <th>Nome</th>
                                         <th>Equipe</th>
                                         <th>Modalidade</th>
                                         <th>Categoria Idade</th>
                                         <th>Dobra</th>
                                         <th>Total (kg)</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {categoriasDoSexo[categoriaPeso]
                                         .sort((a, b) => (a.atleta?.nome || '').localeCompare(b.atleta?.nome || ''))
                                         .map((inscricao, index) => (
                                           <tr key={inscricao.id || index}>
                                             <td>
                                               <strong>{inscricao.atleta?.nome}</strong>
                                             </td>
                                             <td>
                                               <Badge bg="secondary">
                                                 {inscricao.atleta?.equipe?.nomeEquipe || 'N/A'}
                                               </Badge>
                                             </td>
                                             <td>
                                               {inscricao.modalidade === 'CLASSICA' ? (
                                                 <Badge bg="primary">Clássica</Badge>
                                               ) : inscricao.modalidade === 'EQUIPADO' ? (
                                                 <Badge bg="success">Equipado</Badge>
                                               ) : (
                                                 <span className="text-muted">N/A</span>
                                               )}
                                             </td>
                                             <td>
                                               <Badge bg="info">
                                                 {inscricao.categoriaIdade?.nome || 'N/A'}
                                               </Badge>
                                             </td>
                                             <td>
                                               {inscricao.dobraCategoria ? (
                                                 <Badge bg="danger">Sim</Badge>
                                               ) : (
                                                 <Badge bg="light" text="dark">Não</Badge>
                                               )}
                                             </td>
                                             <td>
                                               <strong className="text-primary">
                                                 {(inscricao as any).total12Meses ? `${(inscricao as any).total12Meses}kg` : 'N/A'}
                                               </strong>
                                             </td>
                                           </tr>
                                         ))}
                                     </tbody>
                                   </Table>
                                 </Card.Body>
                               </Card>
                             </div>
                           ))}
                         </div>
                       );
                     })}
                   </div>
                 );
               })()}

               {nominacaoData.filter(insc => {
                 if (filtroModalidade && insc.modalidade !== filtroModalidade) return false;
                 if (filtroEquipe && insc.atleta?.equipe?.nomeEquipe !== filtroEquipe) return false;
                 return true;
               }).length === 0 && (
                 <Alert variant="warning" className="text-center">
                   Nenhum atleta encontrado com os filtros aplicados.
                 </Alert>
               )}
             </>
           )}
         </Modal.Body>
         <Modal.Footer>
           <Button 
             variant="outline-success" 
             onClick={exportarNominacaoCSV}
             disabled={nominacaoData.length === 0}
           >
             <FaFileExport className="me-2" />
             Exportar CSV
           </Button>
           <Button variant="secondary" onClick={() => setShowNominacaoModal(false)}>
             Fechar
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Modal de Gerenciamento de Tipos de Competição */}
       <Modal show={showTiposModal} onHide={() => setShowTiposModal(false)}>
         <Modal.Header closeButton>
           <Modal.Title>
             <FaCog className="me-2" />
             Gerenciar Tipos de Competição
           </Modal.Title>
         </Modal.Header>
         <Modal.Body>
           <Alert variant="info" className="mb-3">
             <strong>ℹ️ Informação:</strong> Apenas administradores podem gerenciar os tipos de competição.
             <br />
             <strong>📝 Uso:</strong> Os tipos configurados aqui estarão disponíveis no dropdown de criação/edição de competições.
           </Alert>
           
           <div className="mb-3">
             <div className="d-flex justify-content-between align-items-center mb-2">
               <h6>Tipos Atuais:</h6>
               <Button 
                 variant="outline-primary" 
                 size="sm"
                 onClick={handleAdicionarTipo}
               >
                 <FaPlus className="me-1" />
                 Adicionar Tipo
               </Button>
             </div>
             
             {editandoTipos.length === 0 ? (
               <Alert variant="warning">
                 Nenhum tipo configurado. Adicione pelo menos um tipo.
               </Alert>
             ) : (
               <div className="list-group">
                 {editandoTipos.map((tipo, index) => (
                   <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                     <span className="fw-bold">{tipo}</span>
                     <Button 
                       variant="outline-danger" 
                       size="sm"
                       onClick={() => handleRemoverTipo(index)}
                       disabled={editandoTipos.length <= 1}
                     >
                       <FaTrash />
                     </Button>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowTiposModal(false)}>
             Cancelar
           </Button>
           <Button 
             variant="primary" 
             onClick={handleSalvarTipos}
             disabled={editandoTipos.length === 0}
           >
             Salvar Alterações
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Modal de Resultados CBLB */}
       <Modal show={showCBLBModal} onHide={() => setShowCBLBModal(false)} size="xl" fullscreen>
         <Modal.Header closeButton>
           <Modal.Title>
             <FaTrophy className="me-2" />
             Resultados no Formato CBLB - {cblbResultado?.competitionName}
           </Modal.Title>
         </Modal.Header>
         <Modal.Body style={{ padding: 0, backgroundColor: 'white' }}>
           {cblbResultado && (
             <CBLBResultsDisplay resultado={cblbResultado} />
           )}
         </Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowCBLBModal(false)}>
             Fechar
           </Button>
         </Modal.Footer>
       </Modal>

       {/* Modal de Importação CSV para Records */}
       <CSVImportModal 
         show={showCSVImportModal}
         onHide={() => setShowCSVImportModal(false)}
         onImportComplete={() => {
           setShowCSVImportModal(false);
           // Recarregar records após importação
           loadRecords();
         }}
       />

     </div>
   );
 };

export default CompeticoesPage;
