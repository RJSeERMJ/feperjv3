import React, { useState, useEffect } from 'react';
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
  Dropdown,
  Tabs,
  Tab
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
  FaDownload
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { competicaoService, inscricaoService, atletaService, equipeService, logService } from '../services/firebaseService';
import { Competicao, InscricaoCompeticao, Atleta, Equipe } from '../types';
import { useAuth } from '../contexts/AuthContext';
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
  onSave: (categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any) => void;
  onCancel: () => void;
}> = ({ inscricao, competicao, onSave, onCancel }) => {
  const [categoriaPeso, setCategoriaPeso] = useState<any>(inscricao.categoriaPeso || null);
  const [categoriaIdade, setCategoriaIdade] = useState<any>(inscricao.categoriaIdade || null);
  const [dobraCategoria, setDobraCategoria] = useState<any>(inscricao.dobraCategoria || null);

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
    onSave(categoriaPeso, categoriaIdade, dobraParaSalvar);
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
  const [equipes, setEquipes] = useState<Equipe[]>([]);
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
  const [selectedCompeticao, setSelectedCompeticao] = useState<Competicao | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoCompeticao[]>([]);
  const [editingCompeticao, setEditingCompeticao] = useState<Competicao | null>(null);
  const [atletasDisponiveis, setAtletasDisponiveis] = useState<Atleta[]>([]);
  const [atletasSelecionados, setAtletasSelecionados] = useState<string[]>([]);
  const [inscricaoFormData, setInscricaoFormData] = useState({
    temDobra: false,
    observacoes: ''
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
    permiteDobraCategoria: false
  });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Se for admin, carrega todos os dados
      // Se for usuário comum, carrega apenas dados da sua equipe
      let atletasData: Atleta[];
      let equipesData: Equipe[];
      
      if (user?.tipo === 'admin') {
        [atletasData, equipesData] = await Promise.all([
          atletaService.getAll(),
          equipeService.getAll()
        ]);
      } else {
        // Usuário comum - só pode ver atletas da sua equipe
        if (!user?.idEquipe) {
          toast.error('Usuário não está vinculado a uma equipe');
          setAtletas([]);
          setEquipes([]);
          setCompeticoes([]);
          return;
        }
        
        const atletasDaEquipe = await atletaService.getAll();
        atletasData = atletasDaEquipe.filter(atleta => atleta.idEquipe === user.idEquipe);
        
        const equipeDoUsuario = await equipeService.getById(user.idEquipe);
        equipesData = equipeDoUsuario ? [equipeDoUsuario] : [];
      }
      
      const competicoesData = await competicaoService.getAll();
      
      setAtletas(atletasData);
      setEquipes(equipesData);
      setCompeticoes(competicoesData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
        permiteDobraCategoria: formData.permiteDobraCategoria
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
      permiteDobraCategoria: competicao.permiteDobraCategoria || false
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
      const atletasInscritos = inscricoesExistentes
        .filter(insc => insc.statusInscricao === 'INSCRITO')
        .map(insc => insc.idAtleta);

      // Filtrar apenas atletas não inscritos
      const atletasDisponiveis = atletasDaEquipe.filter(atleta => 
        !atletasInscritos.includes(atleta.id!)
      );

      setAtletasDisponiveis(atletasDisponiveis);
      setAtletasSelecionados([]);
      setInscricaoFormData({ temDobra: false, observacoes: '' });
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

  const handleCategorizacaoAtleta = (atletaId: string, categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any) => {
    const novaCategorizacao = new Map(categorizacaoAtletas);
    novaCategorizacao.set(atletaId, { categoriaPeso, categoriaIdade, dobraCategoria });
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
         const atleta = atletas.find(a => a.id === atletaId);
         
         const inscricao: any = {
           idAtleta: atletaId,
           idCompeticao: selectedCompeticao!.id!,
           statusInscricao: 'INSCRITO' as const,
           valorIndividual: selectedCompeticao!.valorInscricao,
           temDobra: inscricaoFormData.temDobra,
           observacoes: inscricaoFormData.observacoes,
           categoriaPeso: categorizacao.categoriaPeso,
           categoriaIdade: categorizacao.categoriaIdade
         };

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
      setInscricaoFormData({ temDobra: false, observacoes: '' });
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

  const handleExportCSV = () => {
    try {
      // Verificar se é admin
      if (user?.tipo !== 'admin') {
        toast.error('Apenas administradores podem exportar dados');
        return;
      }

      // Preparar dados para CSV
      const csvContent = [
        ['Nome', 'Data', 'Local', 'Valor Inscrição', 'Valor Dobra', 'Status', 'Início Inscrições', 'Fim Inscrições', 'Descrição'],
        ...competicoes.map(competicao => [
          competicao.nomeCompeticao,
          competicao.dataCompeticao.toLocaleDateString('pt-BR'),
          competicao.local || '',
          `R$ ${competicao.valorInscricao.toFixed(2)}`,
          competicao.valorDobra ? `R$ ${competicao.valorDobra.toFixed(2)}` : '',
          competicao.status,
          competicao.dataInicioInscricao.toLocaleDateString('pt-BR'),
          competicao.dataFimInscricao.toLocaleDateString('pt-BR'),
          competicao.descricao || ''
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `competicoes_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar log
      logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Exportou lista de competições',
        detalhes: `Exportou ${competicoes.length} competições em CSV`,
        tipoUsuario: user?.tipo || 'usuario'
      }).catch(error => {
        console.warn('Erro ao registrar log de exportação:', error);
      });
      
      toast.success(`Lista de ${competicoes.length} competições exportada com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const handleEditarInscricao = (inscricao: InscricaoCompeticao) => {
    setInscricaoEmEdicao(inscricao);
    setShowEditarInscricaoModal(true);
  };

  const handleDetalhesCompeticao = (competicao: Competicao) => {
    setCompeticaoDetalhes(competicao);
    setShowDetalhesCompeticaoModal(true);
  };

  const handleSalvarEdicaoInscricao = async (categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any) => {
    if (!inscricaoEmEdicao || !selectedCompeticao) return;

    try {
      // Preparar dados para atualização
      const dadosAtualizacao: any = {
        categoriaPeso,
        categoriaIdade
      };

      // Adicionar dobraCategoria apenas se existir e for válida
      if (dobraCategoria && dobraCategoria.categoriaIdade && dobraCategoria.categoriaPeso) {
        dadosAtualizacao.dobraCategoria = dobraCategoria;
      } else {
        // Se não há dobra válida, definir como null (Firestore aceita null)
        dadosAtualizacao.dobraCategoria = null;
      }

      // Atualizar a inscrição
      await inscricaoService.update(inscricaoEmEdicao.id!, dadosAtualizacao);

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
    if (!window.confirm(`Tem certeza que deseja cancelar a inscrição do atleta ${inscricao.atleta?.nome}?`)) {
      return;
    }

    try {
      // Atualizar status para CANCELADO
      await inscricaoService.update(inscricao.id!, {
        statusInscricao: 'CANCELADO',
        observacoes: inscricao.observacoes || 'Inscrição cancelada'
      });

      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Cancelou inscrição',
        detalhes: `Cancelou inscrição do atleta ${inscricao.atleta?.nome} na competição ${selectedCompeticao?.nomeCompeticao}`,
        tipoUsuario: user?.tipo || 'usuario'
      });

      toast.success('Inscrição cancelada com sucesso!');
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
      permiteDobraCategoria: false
    });
    setEditingCompeticao(null);
  };

  const filteredCompeticoes = competicoes.filter(competicao =>
    competicao.nomeCompeticao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (competicao.local && competicao.local.toLowerCase().includes(searchTerm.toLowerCase())) ||
    competicao.status.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Função para exportar a nominação completa em CSV
  const exportarNominacaoCSV = () => {
    if (!selectedCompeticao) return;
    
    // Filtrar apenas inscrições válidas
    const inscricoesValidas = inscricoes.filter(i => 
      i.statusInscricao === 'INSCRITO' && 
      i.atleta && 
      i.categoriaPeso && 
      i.categoriaIdade
    );
    
    if (inscricoesValidas.length === 0) {
      toast.error('Nenhuma inscrição válida para exportar');
      return;
    }
    
    // Preparar dados para CSV
    const dadosCSV = inscricoesValidas.map(insc => ({
      'Nome': insc.atleta?.nome || '',
      'CPF': insc.atleta?.cpf || '',
      'Data Nascimento': insc.atleta?.dataNascimento ? 
        new Date(insc.atleta.dataNascimento).toLocaleDateString('pt-BR') : '',
      'Idade': insc.atleta?.dataNascimento ? 
        calcularIdade(insc.atleta.dataNascimento) : '',
      'Sexo': insc.atleta?.sexo === 'M' ? 'Masculino' : 'Feminino',
      'Equipe': insc.atleta?.equipe?.nomeEquipe || '',
      'Categoria Peso': insc.categoriaPeso?.nome || '',
      'Categoria Idade': insc.categoriaIdade?.nome || '',
      'Dobra': insc.dobraCategoria ? 
        `${insc.dobraCategoria.categoriaIdade.nome} - ${insc.dobraCategoria.categoriaPeso.nome}` : 'Não',
      'Status': insc.statusInscricao || ''
    }));
    
    // Converter para CSV
    const headers = Object.keys(dadosCSV[0]);
    const csvContent = [
      headers.join(','),
      ...dadosCSV.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapar vírgulas e aspas no CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nominacao_${selectedCompeticao.nomeCompeticao.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Nominação exportada com sucesso! ${inscricoesValidas.length} atletas incluídos.`);
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
                variant="outline-success" 
                onClick={handleExportCSV}
                title="Exportar lista de competições em CSV"
              >
                <FaFileExport className="me-2" />
                Exportar CSV
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
                  placeholder="Buscar por nome, local ou status..."
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
              {filteredCompeticoes.map((competicao) => (
                <tr 
                  key={competicao.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDetalhesCompeticao(competicao)}
                  className="hover-row"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td>
                    <strong>{competicao.nomeCompeticao}</strong>
                    {competicao.permiteDobraCategoria && (
                      <Badge bg="warning" className="ms-2">Dobra</Badge>
                    )}
                  </td>
                  <td>
                    <div>
                      <FaCalendarAlt className="me-1" />
                      {competicao.dataCompeticao.toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td>
                    {competicao.local && (
                      <div>
                        <FaMapMarkerAlt className="me-1" />
                        {competicao.local}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <FaMoneyBillWave className="me-1" />
                      R$ {competicao.valorInscricao.toFixed(2)}
                      {competicao.valorDobra && (
                        <span className="text-muted ms-1">
                          (Dobra: R$ {competicao.valorDobra.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(competicao.status)}</td>
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
                        {inscricao.dataInscricao?.toLocaleDateString('pt-BR') || '-'}
                      </td>
                      <td>
                        <Badge bg="success">
                          <FaUserCheck className="me-1" />
                          Inscrito
                        </Badge>
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
            
            <Tab eventKey="nominacao" title="Nominação">
              <div className="mb-3">
                <Alert variant="info">
                  <strong>📋 Nominação por Categoria de Peso</strong>
                  <br />
                  Atletas organizados por categoria de peso e sexo para facilitar a organização da competição.
                </Alert>
                
                {/* Botão de Exportar CSV - Apenas para Administradores */}
                {user?.tipo === 'admin' && (
                  <div className="d-flex justify-content-end mb-3">
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => exportarNominacaoCSV()}
                      disabled={inscricoes.filter(i => i.statusInscricao === 'INSCRITO').length === 0}
                    >
                      <FaDownload className="me-2" />
                      Exportar Nominação (CSV)
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Tabela Masculino */}
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <strong>🏋️ Masculino</strong>
                </Card.Header>
                <Card.Body>
                  {(() => {
                    const inscricoesMasculinas = inscricoes.filter(i => 
                      i.statusInscricao === 'INSCRITO' && 
                      i.atleta?.sexo === 'M' && 
                      i.categoriaPeso
                    );
                    
                    if (inscricoesMasculinas.length === 0) {
                      return (
                        <Alert variant="info" className="text-center">
                          Nenhum atleta masculino inscrito.
                        </Alert>
                      );
                    }
                    
                    // Agrupar por categoria de peso
                    const categoriasPeso = obterCategoriasPeso('M');
                    const atletasPorCategoria = new Map();
                    
                    categoriasPeso.forEach(cat => {
                      const atletas = inscricoesMasculinas.filter(insc => 
                        insc.categoriaPeso?.id === cat.id
                      );
                      if (atletas.length > 0) {
                        atletasPorCategoria.set(cat.id, atletas);
                      }
                    });
                    
                                         return Array.from(atletasPorCategoria.entries()).map(([categoriaId, atletas]: [string, InscricaoCompeticao[]]) => {
                       const categoria = categoriasPeso.find(cat => cat.id === categoriaId);
                       return (
                         <div key={categoriaId} className="mb-4">
                           <h6 className="text-primary border-bottom pb-2">
                             <strong>{categoria?.nome}</strong>
                             <span className="text-muted ms-2">({categoria?.descricao})</span>
                             <Badge bg="secondary" className="ms-2">{atletas.length} atleta(s)</Badge>
                           </h6>
                           <Table responsive striped size="sm">
                             <thead>
                               <tr>
                                 <th>Nome</th>
                                 <th>Equipe</th>
                                 <th>Categoria Idade</th>
                                 <th>Dobra</th>
                               </tr>
                             </thead>
                             <tbody>
                               {atletas.map((inscricao: InscricaoCompeticao) => (
                                <tr key={inscricao.id}>
                                  <td>
                                    <strong>{inscricao.atleta?.nome}</strong>
                                    <br />
                                    <small className="text-muted">{inscricao.atleta?.cpf}</small>
                                  </td>
                                  <td>{inscricao.atleta?.equipe?.nomeEquipe || '-'}</td>
                                  <td>
                                    {inscricao.categoriaIdade ? (
                                      <Badge bg="info">
                                        {inscricao.categoriaIdade.nome}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td>
                                    {inscricao.dobraCategoria ? (
                                      <Badge bg="warning">
                                        {inscricao.dobraCategoria.categoriaIdade.nome}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      );
                    });
                  })()}
                </Card.Body>
              </Card>
              
              {/* Tabela Feminino */}
              <Card>
                <Card.Header className="bg-danger text-white">
                  <strong>🏋️‍♀️ Feminino</strong>
                </Card.Header>
                <Card.Body>
                  {(() => {
                    const inscricoesFemininas = inscricoes.filter(i => 
                      i.statusInscricao === 'INSCRITO' && 
                      i.atleta?.sexo === 'F' && 
                      i.categoriaPeso
                    );
                    
                    if (inscricoesFemininas.length === 0) {
                      return (
                        <Alert variant="info" className="text-center">
                          Nenhum atleta feminino inscrito.
                        </Alert>
                      );
                    }
                    
                    // Agrupar por categoria de peso
                    const categoriasPeso = obterCategoriasPeso('F');
                    const atletasPorCategoria = new Map();
                    
                    categoriasPeso.forEach(cat => {
                      const atletas = inscricoesFemininas.filter(insc => 
                        insc.categoriaPeso?.id === cat.id
                      );
                      if (atletas.length > 0) {
                        atletasPorCategoria.set(cat.id, atletas);
                      }
                    });
                    
                                         return Array.from(atletasPorCategoria.entries()).map(([categoriaId, atletas]: [string, InscricaoCompeticao[]]) => {
                       const categoria = categoriasPeso.find(cat => cat.id === categoriaId);
                       return (
                         <div key={categoriaId} className="mb-4">
                           <h6 className="text-danger border-bottom pb-2">
                             <strong>{categoria?.nome}</strong>
                             <span className="text-muted ms-2">({categoria?.descricao})</span>
                             <Badge bg="secondary" className="ms-2">{atletas.length} atleta(s)</Badge>
                           </h6>
                           <Table responsive striped size="sm">
                             <thead>
                               <tr>
                                 <th>Nome</th>
                                 <th>Equipe</th>
                                 <th>Categoria Idade</th>
                                 <th>Dobra</th>
                               </tr>
                             </thead>
                             <tbody>
                               {atletas.map((inscricao: InscricaoCompeticao) => (
                                <tr key={inscricao.id}>
                                  <td>
                                    <strong>{inscricao.atleta?.nome}</strong>
                                    <br />
                                    <small className="text-muted">{inscricao.atleta?.cpf}</small>
                                  </td>
                                  <td>{inscricao.atleta?.equipe?.nomeEquipe || '-'}</td>
                                  <td>
                                    {inscricao.categoriaIdade ? (
                                      <Badge bg="info">
                                        {inscricao.categoriaIdade.nome}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                  <td>
                                    {inscricao.dobraCategoria ? (
                                      <Badge bg="warning">
                                        {inscricao.dobraCategoria.categoriaIdade.nome}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      );
                    });
                  })()}
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="cancelados" title="Cancelados">
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th>Equipe</th>
                    <th>Data Inscrição</th>
                    <th>Status</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {inscricoes.filter(i => i.statusInscricao === 'CANCELADO').map((inscricao) => (
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
                        {inscricao.dataInscricao?.toLocaleDateString('pt-BR') || '-'}
                      </td>
                      <td>
                        <Badge bg="danger">
                          <FaUserTimes className="me-1" />
                          Cancelado
                        </Badge>
                      </td>
                      <td>{inscricao.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {inscricoes.filter(i => i.statusInscricao === 'CANCELADO').length === 0 && (
                <Alert variant="info" className="text-center">
                  Nenhuma inscrição cancelada.
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

                 {selectedCompeticao?.permiteDobraCategoria && (
                   <Form.Group className="mb-3">
                     <Form.Check
                       type="checkbox"
                       label="Aplicar dobra de categoria para todos os atletas selecionados"
                       checked={inscricaoFormData.temDobra}
                       onChange={(e) => setInscricaoFormData({...inscricaoFormData, temDobra: e.target.checked})}
                     />
                     {inscricaoFormData.temDobra && (
                       <Form.Text className="text-muted">
                         Valor adicional de R$ {selectedCompeticao.valorDobra?.toFixed(2)} por atleta
                       </Form.Text>
                     )}
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
                     <br />
                     • <strong>Valor total:</strong> R$ {
                       selectedCompeticao ? (
                         (atletasSelecionados.length * selectedCompeticao.valorInscricao + 
                          (inscricaoFormData.temDobra ? atletasSelecionados.length * (selectedCompeticao.valorDobra || 0) : 0)).toFixed(2)
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
                     <Col md={4}>
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
                               categorizacao?.dobraCategoria
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
                     <Col md={4}>
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
                                 categorizacao?.dobraCategoria
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
                     <Col md={4}>
                       <Form.Group className="mb-3">
                         <Form.Label>Dobra de Categoria</Form.Label>
                         <Form.Select
                           value={categorizacao?.dobraCategoria?.categoriaIdade?.id || ''}
                           onChange={(e) => {
                             if (e.target.value === '') {
                               handleCategorizacaoAtleta(
                                 atletaId, 
                                 categorizacao?.categoriaPeso || null, 
                                 categorizacao?.categoriaIdade || null
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
                               dobraCategoria
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
                   </Row>
                 </Card.Body>
               </Card>
             );
           })}
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
                         {competicaoDetalhes.dataCompeticao.toLocaleDateString('pt-BR')}
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
               </Row>

               <Row className="mb-3">
                 <Col md={6}>
                   <Card className="h-100">
                     <Card.Body className="text-center">
                       <FaCalendarAlt className="text-info mb-2" size={24} />
                       <h6>Prazo de Inscrição</h6>
                       <p className="mb-0 fw-bold">
                         Até {competicaoDetalhes.dataFimInscricao.toLocaleDateString('pt-BR')}
                       </p>
                       <small className="text-muted">
                         Início: {competicaoDetalhes.dataInicioInscricao.toLocaleDateString('pt-BR')}
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
                           ? competicaoDetalhes.dataNominacaoFinal.toLocaleDateString('pt-BR')
                           : 'Não definida'
                         }
                       </p>
                       <small className="text-muted">
                         {competicaoDetalhes.dataNominacaoPreliminar && 
                           `Preliminar: ${competicaoDetalhes.dataNominacaoPreliminar.toLocaleDateString('pt-BR')}`
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
     </div>
   );
 };

export default CompeticoesPage;
