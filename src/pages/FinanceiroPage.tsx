import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Table, 
  Form, 
  Modal,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  InputGroup,
  ProgressBar
} from 'react-bootstrap';
import { 
  FaMoneyBillWave, 
  FaUsers, 
  FaFileUpload, 
  FaDownload,
  FaCog,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaUpload,

} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { 
  equipeService, 
  atletaService, 
  competicaoService, 
  inscricaoService,
  anuidadeService,
  pagamentoService,
  renovacaoAnualService
} from '../services/firebaseService';
import { documentosContabeisService, DocumentoContabil } from '../services/documentosContabeisService';
import { comprovantesAnuidadeService, ComprovanteAnuidade } from '../services/comprovantesAnuidadeService';
import { comprovantesInscricaoService, ComprovanteInscricao } from '../services/comprovantesInscricaoService';
import { Equipe, Atleta, Competicao, InscricaoCompeticao } from '../types';
import { testSupabaseConnection } from '../config/supabase';

interface Anuidade {
  id?: string;
  valor: number;
  dataCriacao: Date;
  dataAtualizacao?: Date;
  ativo: boolean;
}

interface PagamentoAnuidade {
  id?: string;
  idAtleta: string;
  idEquipe: string;
  valor: number;
  dataPagamento: Date;
  status: 'PAGO' | 'PENDENTE';
  observacoes?: string;
}



const FinanceiroPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoCompeticao[]>([]);
  const [anuidade, setAnuidade] = useState<Anuidade | null>(null);
  const [pagamentosAnuidade, setPagamentosAnuidade] = useState<PagamentoAnuidade[]>([]);
  const [documentosContabeis, setDocumentosContabeis] = useState<DocumentoContabil[]>([]);
  const [comprovantes, setComprovantes] = useState<ComprovanteAnuidade[]>([]);
  const [comprovantesInscricao, setComprovantesInscricao] = useState<ComprovanteInscricao[]>([]);
  
  // Estados para modais
  const [showConfigAnuidadeModal, setShowConfigAnuidadeModal] = useState(false);
  const [showDetalhesEquipeModal, setShowDetalhesEquipeModal] = useState(false);
  const [showPrestacaoContasModal, setShowPrestacaoContasModal] = useState(false);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [showAprovacaoModal, setShowAprovacaoModal] = useState(false);
  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [showAprovacaoInscricaoModal, setShowAprovacaoInscricaoModal] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [selectedComprovante, setSelectedComprovante] = useState<ComprovanteAnuidade | null>(null);
  const [selectedCompeticao, setSelectedCompeticao] = useState<Competicao | null>(null);
  const [selectedComprovanteInscricao, setSelectedComprovanteInscricao] = useState<ComprovanteInscricao | null>(null);
  const [selectedEquipeInscricao, setSelectedEquipeInscricao] = useState<Equipe | null>(null);
  const [viewMode, setViewMode] = useState<'competicoes' | 'equipes' | 'comprovantes'>('competicoes');
  
  // Estados para formulários
  const [valorAnuidade, setValorAnuidade] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<'DEMONSTRATIVO' | 'BALANCETE'>('DEMONSTRATIVO');
  
  // Estados para formulário de comprovante
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [dataPagamento, setDataPagamento] = useState('');
  const [valorPagamento, setValorPagamento] = useState('');
  const [observacoesComprovante, setObservacoesComprovante] = useState('');
  const [observacoesAprovacao, setObservacoesAprovacao] = useState('');
  const [observacoesInscricao, setObservacoesInscricao] = useState('');
  const [observacoesAprovacaoInscricao, setObservacoesAprovacaoInscricao] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Estados para download com progresso
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    // Verificar renovação anual automaticamente
    verificarRenovacaoAnual();
  }, []);

  const verificarRenovacaoAnual = async () => {
    try {
      console.log('🔄 Verificando renovação anual...');
      await renovacaoAnualService.verificarEExecutarRenovacao();
    } catch (error) {
      console.error('❌ Erro ao verificar renovação anual:', error);
      // Não mostrar erro para o usuário, apenas log
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados básicos
      const [equipesData, atletasData, competicoesData, inscricoesData] = await Promise.all([
        equipeService.getAll(),
        atletaService.getAll(),
        competicaoService.getAll(),
        inscricaoService.getAll()
      ]);



      // Carregar comprovantes da equipe do usuário
      if (user?.idEquipe) {
        try {
          const comprovantesData = await comprovantesAnuidadeService.listarComprovantesPorEquipe(user.idEquipe);
          setComprovantes(comprovantesData);
        } catch (error) {
          console.warn('Erro ao carregar comprovantes:', error);
        }
      }

      // Se for admin, carregar todos os comprovantes
      if (user?.tipo === 'admin') {
        try {
          const todosComprovantes = await comprovantesAnuidadeService.listarTodosComprovantes();
          setComprovantes(todosComprovantes);
        } catch (error) {
          console.warn('Erro ao carregar todos os comprovantes:', error);
        }
      }

      // Carregar comprovantes de inscrição
      if (user?.idEquipe) {
        try {
          const comprovantesInscricaoData = await comprovantesInscricaoService.listarComprovantesPorEquipe(user.idEquipe);
          setComprovantesInscricao(comprovantesInscricaoData);
        } catch (error) {
          console.warn('Erro ao carregar comprovantes de inscrição:', error);
        }
      }

      // Se for admin, carregar todos os comprovantes de inscrição
      if (user?.tipo === 'admin') {
        try {
          const todosComprovantesInscricao = await comprovantesInscricaoService.listarTodosComprovantes();
          setComprovantesInscricao(todosComprovantesInscricao);
        } catch (error) {
          console.warn('Erro ao carregar todos os comprovantes de inscrição:', error);
        }
      }

      setEquipes(equipesData);
      setAtletas(atletasData);
      setCompeticoes(competicoesData);
      setInscricoes(inscricoesData);

      // Carregar dados financeiros do Firebase e Supabase
      const [anuidadeData, pagamentosData, documentosData] = await Promise.all([
        anuidadeService.getAtivo(),
        pagamentoService.getAll(),
        documentosContabeisService.listarDocumentos()
      ]);

      setAnuidade(anuidadeData);
      setPagamentosAnuidade(pagamentosData);
      setDocumentosContabeis(documentosData);

    } catch (error) {
      toast.error('Erro ao carregar dados financeiros');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para Dashboard Financeiro
  const calcularValorTotalCompeticoes = () => {
    return competicoes.reduce((total, competicao) => {
      const inscricoesCompeticao = inscricoes.filter(insc => insc.idCompeticao === competicao.id);
      return total + (inscricoesCompeticao.length * competicao.valorInscricao);
    }, 0);
  };

  const calcularValorTotalAnuidades = () => {
    if (!anuidade) return 0;
    return atletas.length * anuidade.valor;
  };

  const calcularValorPagoAnuidades = () => {
    return pagamentosAnuidade
      .filter(pag => pag.status === 'PAGO')
      .reduce((total, pag) => total + pag.valor, 0);
  };

  const calcularValorPendenteAnuidades = () => {
    return calcularValorTotalAnuidades() - calcularValorPagoAnuidades();
  };

  // Funções para Configuração de Anuidade
  const handleSalvarAnuidade = async () => {
    if (!valorAnuidade || parseFloat(valorAnuidade) <= 0) {
      toast.error('Valor da anuidade deve ser maior que zero');
      return;
    }

    try {
      const novaAnuidade = {
        valor: parseFloat(valorAnuidade),
        ativo: true
      };

      await anuidadeService.create(novaAnuidade);
      
      toast.success('Valor da anuidade configurado com sucesso!');
      setShowConfigAnuidadeModal(false);
      setValorAnuidade('');
      loadData();
    } catch (error) {
      toast.error('Erro ao configurar anuidade');
      console.error(error);
    }
  };

  // Funções para gerenciar comprovantes
  const handleUploadComprovante = async () => {
    if (!selectedAtleta || !comprovanteFile || !dataPagamento || !valorPagamento) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      console.log('📁 Iniciando upload do comprovante...');
      
      // Verificar se o usuário está autenticado
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const valor = parseFloat(valorPagamento);
      const dataPag = new Date(dataPagamento);

      // Upload para Supabase Storage (seguindo o padrão da prestação de contas)
      await comprovantesAnuidadeService.uploadComprovante(
        comprovanteFile,
        selectedAtleta.id!,
        user!.idEquipe!,
        selectedAtleta.nome,
        user!.nomeEquipe || 'Equipe',
        dataPag,
        valor,
        observacoesComprovante
      );

      console.log('✅ Upload do comprovante concluído com sucesso');
      toast.success(`Comprovante enviado com sucesso para ${selectedAtleta.nome} (${user!.nomeEquipe || 'Equipe'})!`);
      setShowComprovanteModal(false);
      limparFormularioComprovante();
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro no upload do comprovante:', error);
      toast.error(`Erro ao enviar comprovante: ${errorMessage}`);
    }
  };

  const handleDownloadComprovante = async (comprovante: ComprovanteAnuidade) => {
    try {
      console.log('📥 Iniciando download do comprovante...');
      await comprovantesAnuidadeService.downloadComprovante(comprovante);
      toast.success(`Download do comprovante de ${comprovante.nomeAtleta} (${comprovante.nomeEquipe}) iniciado com sucesso!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro no download do comprovante:', error);
      toast.error(`Erro ao baixar comprovante: ${errorMessage}`);
    }
  };

  const handleDeletarComprovante = async (comprovante: ComprovanteAnuidade) => {
    if (!window.confirm(`Tem certeza que deseja excluir o comprovante "${comprovante.nome}" do atleta ${comprovante.nomeAtleta} (${comprovante.nomeEquipe})?`)) {
      return;
    }

    try {
      console.log('🗑️ Iniciando exclusão do comprovante...');
      await comprovantesAnuidadeService.deletarComprovante(
        comprovante,
        user!.tipo === 'admin',
        user!.idEquipe
      );
      toast.success(`Comprovante de ${comprovante.nomeAtleta} (${comprovante.nomeEquipe}) excluído com sucesso!`);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao excluir comprovante:', error);
      toast.error(`Erro ao excluir comprovante: ${errorMessage}`);
    }
  };

  const handleAprovarComprovante = async () => {
    if (!selectedComprovante) return;

    try {
      await comprovantesAnuidadeService.aprovarComprovante(
        selectedComprovante,
        user!.nome || user!.login,
        observacoesAprovacao
      );
      toast.success(`Comprovante de ${selectedComprovante.nomeAtleta} (${selectedComprovante.nomeEquipe}) aprovado com sucesso!`);
      setShowAprovacaoModal(false);
      setObservacoesAprovacao('');
      setSelectedComprovante(null);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao aprovar comprovante:', error);
      toast.error(`Erro ao aprovar comprovante: ${errorMessage}`);
    }
  };

  const handleRejeitarComprovante = async () => {
    if (!selectedComprovante) return;

    try {
      await comprovantesAnuidadeService.rejeitarComprovante(
        selectedComprovante,
        user!.nome || user!.login,
        observacoesAprovacao
      );
      toast.success(`Comprovante de ${selectedComprovante.nomeAtleta} (${selectedComprovante.nomeEquipe}) rejeitado com sucesso!`);
      setShowAprovacaoModal(false);
      setObservacoesAprovacao('');
      setSelectedComprovante(null);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao rejeitar comprovante:', error);
      toast.error(`Erro ao rejeitar comprovante: ${errorMessage}`);
    }
  };

  const limparFormularioComprovante = () => {
    setComprovanteFile(null);
    setDataPagamento('');
    setValorPagamento('');
    setObservacoesComprovante('');
    setSelectedAtleta(null);
  };

  const abrirModalComprovante = (atleta: Atleta) => {
    setSelectedAtleta(atleta);
    setShowComprovanteModal(true);
  };

  const abrirModalAprovacao = (comprovante: ComprovanteAnuidade) => {
    setSelectedComprovante(comprovante);
    setShowAprovacaoModal(true);
  };

  // Funções para Comprovantes de Inscrição
  const handleUploadComprovanteInscricao = async () => {
    if (!selectedCompeticao || selectedFiles.length === 0) {
      toast.error('Por favor, selecione uma competição e pelo menos um arquivo');
      return;
    }

    try {
      console.log('📁 Iniciando upload de comprovantes de inscrição...');
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Determinar a equipe (do usuário ou da equipe selecionada pelo admin)
      const equipeId = selectedEquipeInscricao ? selectedEquipeInscricao.id! : user.idEquipe!;
      const equipe = equipes.find(e => e.id === equipeId);
      if (!equipe) {
        toast.error('Equipe não encontrada');
        return;
      }

      // Upload de múltiplos arquivos para Supabase Storage (bucket financeiro)
      for (const file of selectedFiles) {
        await comprovantesInscricaoService.uploadComprovante(
          file,
          equipeId,
          selectedCompeticao.id!,
          equipe.nomeEquipe,
          selectedCompeticao.nomeCompeticao,
          selectedCompeticao.valorInscricao, // valor da competição
          observacoesInscricao
        );
      }

      console.log('✅ Upload de comprovantes de inscrição concluído');
      toast.success(`${selectedFiles.length} comprovante(s) enviado(s) com sucesso para ${selectedCompeticao.nomeCompeticao}!`);
      setShowInscricaoModal(false);
      limparFormularioInscricao();
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro no upload de comprovantes de inscrição:', error);
      toast.error(`Erro ao enviar comprovantes: ${errorMessage}`);
    }
  };

  const handleDownloadComprovanteInscricao = async (comprovante: ComprovanteInscricao) => {
    try {
      await comprovantesInscricaoService.downloadComprovante(comprovante);
      toast.success(`Download do comprovante de inscrição concluído!`);
    } catch (error) {
      console.error('❌ Erro no download:', error);
      toast.error('Erro ao baixar comprovante');
    }
  };

  const handleDeletarComprovanteInscricao = async (comprovante: ComprovanteInscricao) => {
    if (!window.confirm(`Tem certeza que deseja excluir o comprovante de inscrição "${comprovante.nome}"?`)) {
      return;
    }

    try {
      await comprovantesInscricaoService.deletarComprovante(
        comprovante,
        user!.tipo === 'admin',
        user!.idEquipe
      );
      toast.success(`Comprovante de inscrição excluído com sucesso!`);
      loadData();
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      toast.error('Erro ao excluir comprovante');
    }
  };

  const handleAprovarComprovanteInscricao = async () => {
    if (!selectedComprovanteInscricao) return;

    try {
      await comprovantesInscricaoService.aprovarComprovante(
        selectedComprovanteInscricao,
        user!.nome || 'Admin',
        observacoesAprovacaoInscricao
      );
      toast.success(`Comprovante de inscrição aprovado com sucesso!`);
      setShowAprovacaoInscricaoModal(false);
      setObservacoesAprovacaoInscricao('');
      setSelectedComprovanteInscricao(null);
      loadData();
    } catch (error) {
      console.error('❌ Erro ao aprovar:', error);
      toast.error('Erro ao aprovar comprovante');
    }
  };

  const handleRejeitarComprovanteInscricao = async () => {
    if (!selectedComprovanteInscricao) return;

    try {
      await comprovantesInscricaoService.rejeitarComprovante(
        selectedComprovanteInscricao,
        user!.nome || 'Admin',
        observacoesAprovacaoInscricao
      );
      toast.success(`Comprovante de inscrição rejeitado com sucesso!`);
      setShowAprovacaoInscricaoModal(false);
      setObservacoesAprovacaoInscricao('');
      setSelectedComprovanteInscricao(null);
      loadData();
    } catch (error) {
      console.error('❌ Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar comprovante');
    }
  };

  const limparFormularioInscricao = () => {
    setSelectedFiles([]);
    setObservacoesInscricao('');
    setSelectedCompeticao(null);
  };

  const abrirModalInscricao = (competicao: Competicao) => {
    setSelectedCompeticao(competicao);
    setShowInscricaoModal(true);
  };

  const abrirModalAprovacaoInscricao = (comprovante: ComprovanteInscricao) => {
    setSelectedComprovanteInscricao(comprovante);
    setShowAprovacaoInscricaoModal(true);
  };

  // Funções para navegação hierárquica
  const voltarParaCompeticoes = () => {
    setViewMode('competicoes');
    setSelectedCompeticao(null);
    setSelectedEquipeInscricao(null);
  };

  const voltarParaEquipes = () => {
    setViewMode('equipes');
    setSelectedEquipeInscricao(null);
  };

  const selecionarCompeticao = (competicao: Competicao) => {
    setSelectedCompeticao(competicao);
    setViewMode('equipes');
  };

  const selecionarEquipe = (equipe: Equipe) => {
    setSelectedEquipeInscricao(equipe);
    setViewMode('comprovantes');
  };

  const getEquipesInscritasNaCompeticao = (competicaoId: string) => {
    const inscricoesCompeticao = inscricoes.filter(insc => insc.idCompeticao === competicaoId);
    const atletasInscritos = atletas.filter(atleta => 
      inscricoesCompeticao.some(insc => insc.idAtleta === atleta.id)
    );
    const equipesIds = Array.from(new Set(atletasInscritos.map(atleta => atleta.idEquipe)));
    return equipes.filter(equipe => equipesIds.includes(equipe.id!));
  };

  const getComprovantesDaEquipeNaCompeticao = (equipeId: string, competicaoId: string) => {
    return comprovantesInscricao.filter(comp => 
      comp.equipeId === equipeId && comp.competicaoId === competicaoId
    );
  };

  // Função helper para calcular valor da equipe em uma competição
  const calcularValorEquipeNaCompeticao = (equipeId: string, competicaoId: string) => {
    const inscricoesEquipe = inscricoes.filter(insc => 
      insc.idCompeticao === competicaoId && 
      insc.atleta && 
      insc.atleta.idEquipe === equipeId
    );
    
    console.log(`🔍 Calculando valor para equipe ${equipeId} na competição ${competicaoId}`);
    console.log(`🔍 Inscrições encontradas: ${inscricoesEquipe.length}`);
    
    if (inscricoesEquipe.length === 0) {
      console.log(`⚠️ Nenhuma inscrição encontrada para equipe ${equipeId} na competição ${competicaoId}`);
      return 0;
    }
    
    const total = inscricoesEquipe.reduce((total, insc) => {
      // Verificar se tem valor individual definido
      const temValorIndividual = insc.valorIndividual !== undefined && insc.valorIndividual !== null && insc.valorIndividual > 0;
      
      // Buscar competição para valor padrão
      const competicao = competicoes.find(comp => comp.id === competicaoId);
      const valorPadrao = competicao?.valorInscricao || 0;
      
      // Usar valor individual se disponível, senão usar valor padrão da competição
      const valorAtleta = temValorIndividual ? insc.valorIndividual! : valorPadrao;
      
      console.log(`🔍 Inscrição ${insc.id}: atleta=${insc.atleta?.nome}, valorIndividual=${insc.valorIndividual}, temValorIndividual=${temValorIndividual}, valorAtleta=${valorAtleta}, total=${total + valorAtleta}`);
      return total + valorAtleta;
    }, 0);
    
    console.log(`💰 Valor total da equipe ${equipeId}: R$ ${total.toFixed(2)}`);
    return total;
  };

  // Funções para Prestação de Contas
  const handleUploadDocumento = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      console.log('📁 Supabase: Iniciando upload do documento');
      
      // Verificar se o usuário está autenticado
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Bucket "financeiro" já existe - não precisa verificar

      // Upload para Supabase Storage
      await documentosContabeisService.uploadDocumento(selectedFile, tipoDocumento);
      
      console.log('✅ Supabase: Upload concluído com sucesso');
      toast.success('Documento enviado com sucesso!');
      setShowPrestacaoContasModal(false);
      setSelectedFile(null);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Supabase: Erro no upload:', error);
      toast.error(`Erro ao enviar documento: ${errorMessage}`);
    }
  };

  // Funções para Detalhes da Equipe
  const handleDetalhesEquipe = (equipe: Equipe) => {
    setSelectedEquipe(equipe);
    setShowDetalhesEquipeModal(true);
  };

  const getAtletasEquipe = (idEquipe: string) => {
    return atletas.filter(atleta => atleta.idEquipe === idEquipe);
  };

  const getInscricoesEquipe = (idEquipe: string) => {
    const atletasEquipe = getAtletasEquipe(idEquipe);
    const idsAtletas = atletasEquipe.map(atleta => atleta.id);
    return inscricoes.filter(insc => idsAtletas.includes(insc.idAtleta));
  };

  const calcularValorCompeticoesEquipe = (idEquipe: string) => {
    const inscricoesEquipe = getInscricoesEquipe(idEquipe);
    return inscricoesEquipe.reduce((total, insc) => {
      const competicao = competicoes.find(comp => comp.id === insc.idCompeticao);
      return total + (competicao?.valorInscricao || 0);
    }, 0);
  };

  const getStatusAnuidadeAtleta = (idAtleta: string) => {
    const pagamento = pagamentosAnuidade.find(pag => pag.idAtleta === idAtleta);
    return pagamento?.status || 'PENDENTE';
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
          <h2>💰 Sistema Financeiro</h2>
          <p className="text-muted mb-0">
            {user?.tipo === 'admin' 
              ? 'Gestão financeira completa da federação'
              : 'Informações financeiras da sua equipe'
            }
          </p>
        </div>
        {user?.tipo === 'admin' && (
          <div className="d-flex gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => setShowConfigAnuidadeModal(true)}
            >
              <FaCog className="me-2" />
              Configurar Anuidade
            </Button>
                         <Button 
               variant="outline-success" 
               onClick={() => setShowPrestacaoContasModal(true)}
             >
               <FaFileUpload className="me-2" />
               Prestação de Contas
             </Button>
             <Button 
               variant="outline-info" 
               onClick={async () => {
                 const result = await testSupabaseConnection();
                 if (result.success) {
                   toast.success(result.message || 'Conectividade OK!');
                 } else {
                   toast.error(`Erro: ${result.error}`);
                 }
               }}
             >
               🧪 Testar Supabase
             </Button>
          </div>
        )}
      </div>

      <Tabs defaultActiveKey="dashboard" className="mb-4">
SY        <Tab eventKey="dashboard" title="Dashboard Financeiro Geral - FEPERJ">
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaMoneyBillWave className="text-primary mb-2" size={24} />
                  <h3>R$ {calcularValorTotalCompeticoes().toFixed(2)}</h3>
                  <p className="text-muted">Total Competições</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaUsers className="text-success mb-2" size={24} />
                  <h3>R$ {calcularValorTotalAnuidades().toFixed(2)}</h3>
                  <p className="text-muted">Total Anuidades</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaCheckCircle className="text-success mb-2" size={24} />
                  <h3>R$ {calcularValorPagoAnuidades().toFixed(2)}</h3>
                  <p className="text-muted">Anuidades Pagas</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <FaTimesCircle className="text-warning mb-2" size={24} />
                  <h3>R$ {calcularValorPendenteAnuidades().toFixed(2)}</h3>
                  <p className="text-muted">Anuidades Pendentes</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {user?.tipo === 'admin' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">📊 Resumo por Equipe</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Equipe</th>
                      <th>Total Atletas</th>
                      <th>Valor Competições</th>
                      <th>Anuidades Pagas</th>
                      <th>Anuidades Pendentes</th>
                      <th>Total Devido</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipes.map(equipe => {
                      const atletasEquipe = getAtletasEquipe(equipe.id!);
                      const valorCompeticoes = calcularValorCompeticoesEquipe(equipe.id!);
                      const anuidadesPagas = atletasEquipe.filter(atleta => 
                        getStatusAnuidadeAtleta(atleta.id!) === 'PAGO'
                      ).length * (anuidade?.valor || 0);
                      const anuidadesPendentes = atletasEquipe.filter(atleta => 
                        getStatusAnuidadeAtleta(atleta.id!) === 'PENDENTE'
                      ).length * (anuidade?.valor || 0);
                      const totalDevido = valorCompeticoes + anuidadesPendentes;

                      return (
                        <tr key={equipe.id}>
                          <td>
                            <strong>{equipe.nomeEquipe}</strong>
                            <br />
                            <small className="text-muted">{equipe.cidade}</small>
                          </td>
                          <td>{atletasEquipe.length}</td>
                          <td>R$ {valorCompeticoes.toFixed(2)}</td>
                          <td>R$ {anuidadesPagas.toFixed(2)}</td>
                          <td>R$ {anuidadesPendentes.toFixed(2)}</td>
                          <td>
                            <strong>R$ {totalDevido.toFixed(2)}</strong>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleDetalhesEquipe(equipe)}
                            >
                              <FaEye className="me-1" />
                              Detalhes
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
        </Tab>

        {user?.tipo !== 'admin' && (
          <Tab eventKey="minha-equipe" title="Minha Equipe">
            <Card>
              <Card.Header>
                <h5 className="mb-0">💰 Informações Financeiras da Minha Equipe</h5>
              </Card.Header>
              <Card.Body>
                {user?.idEquipe ? (
                  <div>
                    <Row className="mb-4">
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4>R$ {calcularValorCompeticoesEquipe(user.idEquipe).toFixed(2)}</h4>
                            <p className="text-muted">Total Competições</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4>R$ {(getAtletasEquipe(user.idEquipe).length * (anuidade?.valor || 0)).toFixed(2)}</h4>
                            <p className="text-muted">Total Anuidades</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4>{getAtletasEquipe(user.idEquipe).length}</h4>
                            <p className="text-muted">Total Atletas</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <Table responsive striped>
                      <thead>
                        <tr>
                          <th>Atleta</th>
                          <th>CPF</th>
                          <th>Status Anuidade</th>
                          <th>Valor Anuidade</th>
                          <th>Data Pagamento</th>
                          <th>Comprovante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getAtletasEquipe(user.idEquipe).map(atleta => {
                          const statusAnuidade = getStatusAnuidadeAtleta(atleta.id!);
                          const pagamento = pagamentosAnuidade.find(pag => pag.idAtleta === atleta.id);
                          const comprovante = comprovantes.find(comp => comp.atletaId === atleta.id);
                          
                          return (
                            <tr key={atleta.id}>
                              <td>
                                <strong>{atleta.nome}</strong>
                                <br />
                                <small className="text-muted">ID: {atleta.id}</small>
                              </td>
                              <td>{atleta.cpf}</td>
                              <td>
                                <Badge bg={statusAnuidade === 'PAGO' ? 'success' : 'warning'}>
                                  {statusAnuidade === 'PAGO' ? 'PAGO' : 'PENDENTE'}
                                </Badge>
                              </td>
                              <td>R$ {(anuidade?.valor || 0).toFixed(2)}</td>
                              <td>
                                {pagamento?.dataPagamento 
                                  ? pagamento.dataPagamento.toLocaleDateString('pt-BR')
                                  : '-'
                                }
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  {comprovante ? (
                                    <>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleDownloadComprovante(comprovante)}
                                        title="Baixar comprovante"
                                      >
                                        <FaDownload />
                                      </Button>
                                      {(user?.tipo === 'admin' || user?.idEquipe === comprovante.equipeId) && (
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleDeletarComprovante(comprovante)}
                                          title="Excluir comprovante"
                                        >
                                          <FaTimesCircle />
                                        </Button>
                                      )}
                                      {user?.tipo === 'admin' && comprovante.status === 'PENDENTE' && (
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          onClick={() => abrirModalAprovacao(comprovante)}
                                          title="Aprovar/Rejeitar comprovante"
                                        >
                                          <FaCheckCircle />
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => abrirModalComprovante(atleta)}
                                      title="Enviar comprovante de pagamento"
                                    >
                                      <FaUpload />
                                      Enviar
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="warning" className="text-center">
                    Você não está associado a nenhuma equipe.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Tab>
        )}

        <Tab eventKey="prestacao" title="Prestação de Contas">
          <Card>
            <Card.Header>
              <h5 className="mb-0">📋 Documentos Contábeis</h5>
            </Card.Header>
            <Card.Body>
              {/* Informação sobre permissões */}
              {user?.tipo !== 'admin' && (
                <Alert variant="info" className="mb-3">
                  <strong>ℹ️ Informação:</strong> Você pode baixar todos os documentos. 
                  Apenas administradores podem excluir arquivos.
                </Alert>
              )}
              {documentosContabeis.length === 0 ? (
                <Alert variant="info" className="text-center">
                  Nenhum documento contábil enviado ainda.
                </Alert>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Formato</th>
                      <th>Data Upload</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentosContabeis.map(doc => (
                      <tr key={doc.id}>
                        <td>{doc.nome}</td>
                        <td>
                          <Badge bg={doc.tipo === 'DEMONSTRATIVO' ? 'primary' : 'success'}>
                            {doc.tipo}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={doc.formato === 'PDF' ? 'danger' : 'warning'}>
                            {doc.formato}
                          </Badge>
                        </td>
                        <td>{doc.dataUpload.toLocaleDateString('pt-BR')}</td>
                        <td>
                          <Badge bg={doc.ativo ? 'success' : 'secondary'}>
                            {doc.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td>
                          {downloadingFile === doc.id && (
                            <div className="mb-2">
                              <ProgressBar 
                                now={downloadProgress} 
                                label={`${downloadProgress}%`}
                                variant="success"
                              />
                            </div>
                          )}
                                                    <div className="d-flex gap-1">
                             <Button 
                               variant="outline-primary" 
                               size="sm"
                               disabled={downloadingFile === doc.id}
                               onClick={async () => {
                                 if (!user) {
                                   toast.error('Usuário não autenticado');
                                   return;
                                 }
                                 
                                 setDownloadingFile(doc.id || '');
                                 setDownloadProgress(0);
                                 
                                 try {
                                   await documentosContabeisService.downloadDocumento(
                                     doc,
                                     user.id || user.login,
                                     user.login,
                                     (progress) => setDownloadProgress(progress)
                                   );
                                   toast.success('Download concluído com sucesso!');
                                 } catch (error) {
                                   console.error('Erro no download:', error);
                                   toast.error('Erro ao baixar documento');
                                 } finally {
                                   setDownloadingFile(null);
                                   setDownloadProgress(0);
                                 }
                               }}
                             >
                               {downloadingFile === doc.id ? (
                                 <>
                                   <Spinner animation="border" size="sm" className="me-1" />
                                   {downloadProgress}%
                                 </>
                               ) : (
                                 <>
                                   <FaDownload className="me-1" />
                                   Download
                                 </>
                               )}
                             </Button>
                             {/* Botão de Exclusão - Apenas para Administradores */}
                             {user?.tipo === 'admin' && (
                               <Button 
                                 variant="outline-danger" 
                                 size="sm"
                                 title="Apenas administradores podem excluir documentos"
                                 onClick={async () => {
                                   if (window.confirm(`Tem certeza que deseja excluir o documento "${doc.nome}"?`)) {
                                     try {
                                       await documentosContabeisService.deletarDocumento(
                                         doc.nomeArquivoSalvo!, 
                                         doc.tipo,
                                         user.id || user.login,
                                         user.tipo
                                       );
                                       toast.success('Documento excluído com sucesso!');
                                       loadData();
                                     } catch (error) {
                                       toast.error('Erro ao excluir documento');
                                       console.error(error);
                                     }
                                   }
                                 }}
                               >
                                 <FaTimesCircle className="me-1" />
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
        </Tab>





        {/* Aba de Comprovantes de Anuidade (apenas para admins) */}
        {user?.tipo === 'admin' && (
          <Tab eventKey="comprovantes" title="Comprovantes de Anuidade">
            <Card>
              <Card.Header>
                <h5 className="mb-0">💰 Comprovantes de Pagamento de Anuidade</h5>
              </Card.Header>
              <Card.Body>
                {comprovantes.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    Nenhum comprovante de anuidade encontrado.
                  </Alert>
                ) : (
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Atleta</th>
                        <th>Equipe</th>
                        <th>Arquivo</th>
                        <th>Valor</th>
                        <th>Data de Aprovação</th>
                        <th>Status</th>
                        <th>Data Upload</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comprovantes.map(comprovante => (
                        <tr key={comprovante.id}>
                          <td>
                            <strong>{comprovante.nomeAtleta}</strong>
                          </td>
                          <td>{comprovante.nomeEquipe}</td>
                          <td>
                            <small>{comprovante.nome}</small>
                            <br />
                            <small className="text-muted">
                              {(comprovante.tamanho / 1024 / 1024).toFixed(2)} MB
                            </small>
                          </td>
                          <td>R$ {comprovante.valor ? comprovante.valor.toFixed(2) : 'N/A'}</td>
                          <td>
                            {comprovante.dataPagamento ? comprovante.dataPagamento.toLocaleDateString('pt-BR') : 'N/A'}
                          </td>
                          <td>
                            <Badge bg={
                              comprovante.status === 'APROVADO' ? 'success' : 
                              comprovante.status === 'REJEITADO' ? 'danger' : 'warning'
                            }>
                              {comprovante.status === 'APROVADO' ? 'COMPROVANTE APROVADO' : 
                               comprovante.status === 'REJEITADO' ? 'COMPROVANTE REJEITADO' : 
                               'PENDENTE'}
                            </Badge>
                          </td>
                          <td>
                            {comprovante.dataUpload.toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleDownloadComprovante(comprovante)}
                                title="Baixar comprovante"
                              >
                                <FaDownload />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeletarComprovante(comprovante)}
                                title="Excluir comprovante"
                              >
                                <FaTimesCircle />
                              </Button>
                              {user?.tipo === 'admin' && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => abrirModalAprovacao(comprovante)}
                                  title="Aprovar/Rejeitar comprovante"
                                >
                                  <FaCheckCircle />
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
          </Tab>
        )}

        <Tab eventKey="comprovantes-inscricao" title="Comprovantes de Inscrição">
            <Card>
              <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {viewMode === 'competicoes' && '🏆 Competições'}
                  {viewMode === 'equipes' && selectedCompeticao && `🏆 ${selectedCompeticao.nomeCompeticao} - Equipes`}
                  {viewMode === 'comprovantes' && selectedEquipeInscricao && selectedCompeticao && 
                   `🏆 ${selectedCompeticao.nomeCompeticao} - ${selectedEquipeInscricao.nomeEquipe} - Comprovantes`}
                </h5>
                <div>
                  {viewMode === 'equipes' && (
                    <Button variant="outline-secondary" size="sm" onClick={voltarParaCompeticoes}>
                      ← Voltar para Competições
                    </Button>
                  )}
                  {viewMode === 'comprovantes' && (
                    <Button variant="outline-secondary" size="sm" onClick={voltarParaEquipes}>
                      ← Voltar para Equipes
                    </Button>
                  )}
                </div>
              </div>
              </Card.Header>
              <Card.Body>
              {user?.tipo === 'admin' ? (
                // Visão do Admin - Navegação hierárquica
                <div>
                  {viewMode === 'competicoes' && (
                    <div>
                      <Row className="mb-4">
                        <Col>
                          <h6>📋 Competições (Agendadas/Realizadas)</h6>
                        </Col>
                      </Row>
                      
                      {competicoes.length === 0 ? (
                        <Alert variant="info">
                          <FaEye className="me-2" />
                          Nenhuma competição encontrada.
                  </Alert>
                ) : (
                        <Table responsive striped hover>
                    <thead>
                      <tr>
                              <th>Competição</th>
                              <th>Data</th>
                              <th>Status</th>
                              <th>Equipes Inscritas</th>
                              <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                            {competicoes.map(competicao => {
                              const equipesInscritas = getEquipesInscritasNaCompeticao(competicao.id!);
                              const comprovantesCompeticao = comprovantesInscricao.filter(
                                comp => comp.competicaoId === competicao.id
                              );
                              const comprovantesPendentes = comprovantesCompeticao.filter(
                                comp => comp.status === 'PENDENTE'
                              );
                              const comprovantesAprovados = comprovantesCompeticao.filter(
                                comp => comp.status === 'APROVADO'
                              );
                              const comprovantesRejeitados = comprovantesCompeticao.filter(
                                comp => comp.status === 'REJEITADO'
                              );

                              return (
                                <tr key={competicao.id}>
                                  <td>
                                    <strong>{competicao.nomeCompeticao}</strong>
                                    <br />
                                    <small className="text-muted">{competicao.local}</small>
                          </td>
                                  <td>{competicao.dataCompeticao.toLocaleDateString('pt-BR')}</td>
                                  <td>
                                    <Badge bg={
                                      competicao.status === 'REALIZADA' ? 'success' : 
                                      competicao.status === 'CANCELADA' ? 'danger' : 'warning'
                                    }>
                                      {competicao.status}
                            </Badge>
                          </td>
                          <td>
                                    <div>
                                      <Badge bg="info" className="me-2">
                                        {equipesInscritas.length} Equipes
                            </Badge>
                                      <small>
                                        <Badge bg="warning" className="me-1">
                                          {comprovantesPendentes.length} Pendentes
                                        </Badge>
                                        <Badge bg="success" className="me-1">
                                          {comprovantesAprovados.length} Aprovados
                                        </Badge>
                                        <Badge bg="danger">
                                          {comprovantesRejeitados.length} Rejeitados
                                        </Badge>
                                      </small>
                                    </div>
                          </td>
                          <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => selecionarCompeticao(competicao)}
                                    >
                                      <FaEye className="me-1" />
                                      Ver Equipes
                                    </Button>
                          </td>
                        </tr>
                              );
                            })}
                    </tbody>
                  </Table>
                )}
                    </div>
                  )}

                  {viewMode === 'equipes' && selectedCompeticao && (
                    <div>
                      <Row className="mb-4">
                        <Col>
                          <h6>📋 Equipes Inscritas em {selectedCompeticao.nomeCompeticao}</h6>
                        </Col>
                      </Row>
                      
                      {(() => {
                        const equipesInscritas = getEquipesInscritasNaCompeticao(selectedCompeticao.id!);
                        
                        if (equipesInscritas.length === 0) {
                          return (
                            <Alert variant="info">
                              <FaEye className="me-2" />
                              Nenhuma equipe inscrita nesta competição.
                  </Alert>
                          );
                        }

                        return (
                          <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Equipe</th>
                                <th>Cidade</th>
                                <th>Status da Equipe</th>
                                <th>Valor</th>
                                <th>Atletas Inscritos</th>
                                <th>Status dos Comprovantes</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                              {equipesInscritas.map(equipe => {
                                const atletasEquipe = atletas.filter(atleta => atleta.idEquipe === equipe.id);
                                const inscricoesEquipe = inscricoes.filter(insc => 
                                  insc.idCompeticao === selectedCompeticao.id && 
                                  atletasEquipe.some(atleta => atleta.id === insc.idAtleta)
                                );
                                const comprovantesEquipe = getComprovantesDaEquipeNaCompeticao(equipe.id!, selectedCompeticao.id!);
                                const comprovantesPendentes = comprovantesEquipe.filter(comp => comp.status === 'PENDENTE');
                                const comprovantesAprovados = comprovantesEquipe.filter(comp => comp.status === 'APROVADO');
                                const comprovantesRejeitados = comprovantesEquipe.filter(comp => comp.status === 'REJEITADO');

                                return (
                                  <tr key={equipe.id}>
                                    <td>
                                      <strong>{equipe.nomeEquipe}</strong>
                          </td>
                                    <td>{equipe.cidade}</td>
                                    <td>
                                      <Badge bg={
                                        equipe.status === 'PAGO' ? 'success' : 
                                        equipe.status === 'ATIVA' ? 'primary' : 
                                        equipe.status === 'PENDENTE' ? 'warning' : 'secondary'
                                      }>
                                        {equipe.status || 'PENDENTE'}
                                      </Badge>
                                    </td>
                                    <td>
                                      <strong>R$ {calcularValorEquipeNaCompeticao(equipe.id || '', selectedCompeticao.id || '').toFixed(2)}</strong>
                                    </td>
                                    <td>
                                      <Badge bg="info">
                                        {inscricoesEquipe.length} Atletas
                                      </Badge>
                                    </td>
                                    <td>
                                      <div>
                                        <small>
                                          <Badge bg="warning" className="me-1">
                                            {comprovantesPendentes.length} Pendentes
                                          </Badge>
                                          <Badge bg="success" className="me-1">
                                            {comprovantesAprovados.length} Aprovados
                                          </Badge>
                                          <Badge bg="danger">
                                            {comprovantesRejeitados.length} Rejeitados
                                          </Badge>
                            </small>
                                      </div>
                          </td>
                                    <td>
                                      <div className="d-flex gap-1">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => selecionarEquipe(equipe)}
                                        >
                                          <FaEye className="me-1" />
                                          Ver Comprovantes
                                        </Button>
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedEquipeInscricao(equipe);
                                            abrirModalInscricao(selectedCompeticao);
                                          }}
                                        >
                                          <FaUpload className="me-1" />
                                          Upload
                                        </Button>
                                      </div>
                          </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        );
                      })()}
                    </div>
                  )}

                  {viewMode === 'comprovantes' && selectedEquipeInscricao && selectedCompeticao && (
                    <div>
                      <Row className="mb-4">
                        <Col>
                          <h6>📄 Comprovantes de {selectedEquipeInscricao.nomeEquipe} - {selectedCompeticao.nomeCompeticao}</h6>
                        </Col>
                        <Col xs="auto">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => abrirModalInscricao(selectedCompeticao)}
                          >
                            <FaUpload className="me-1" />
                            Upload Comprovante
                          </Button>
                        </Col>
                      </Row>
                      
                      {(() => {
                        const comprovantesEquipe = getComprovantesDaEquipeNaCompeticao(selectedEquipeInscricao.id!, selectedCompeticao.id!);
                        
                        if (comprovantesEquipe.length === 0) {
                          return (
                            <Alert variant="info">
                              <FaEye className="me-2" />
                              Nenhum comprovante encontrado para esta equipe nesta competição.
                            </Alert>
                          );
                        }

                        return (
                          <Table responsive striped hover>
                            <thead>
                              <tr>
                                <th>Arquivo</th>
                                <th>Data Upload</th>
                                <th>Valor</th>
                                <th>Status do Comprovante</th>
                                <th>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comprovantesEquipe.map(comprovante => (
                                <tr key={comprovante.nomeArquivoSalvo}>
                                  <td>
                                    <small className="text-muted">{comprovante.nome}</small>
                                  </td>
                                  <td>{comprovante.dataUpload.toLocaleDateString('pt-BR')}</td>
                                  <td>R$ {calcularValorEquipeNaCompeticao(selectedEquipeInscricao?.id || '', comprovante.competicaoId).toFixed(2)}</td>
                          <td>
                            <Badge bg={
                              comprovante.status === 'APROVADO' ? 'success' : 
                              comprovante.status === 'REJEITADO' ? 'danger' : 'warning'
                            }>
                                      {comprovante.status === 'APROVADO' ? 'COMPROVANTE APROVADO' : 
                                       comprovante.status === 'REJEITADO' ? 'COMPROVANTE REJEITADO' : 
                                       'PENDENTE'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                        variant="outline-primary"
                                        onClick={() => handleDownloadComprovanteInscricao(comprovante)}
                                        title="Baixar"
                              >
                                <FaDownload />
                              </Button>
                                      
                              <Button
                                size="sm"
                                        variant="outline-danger"
                                        onClick={() => handleDeletarComprovanteInscricao(comprovante)}
                                        title="Excluir"
                              >
                                <FaTimesCircle />
                              </Button>
                                      
                                <Button
                                  size="sm"
                                        variant="outline-success"
                                        onClick={() => abrirModalAprovacaoInscricao(comprovante)}
                                        title="Aprovar/Rejeitar"
                                >
                                  <FaCheckCircle />
                                </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                // Visão do Usuário - Lista de competições da equipe
                <div>
                  <Row className="mb-4">
                    <Col>
                      <h6>📋 Competições da Minha Equipe</h6>
                      {user?.idEquipe && (() => {
                        const minhaEquipe = equipes.find(e => e.id === user.idEquipe);
                        return minhaEquipe ? (
                          <Alert variant={minhaEquipe.status === 'PAGO' ? 'success' : 'info'} className="mb-3">
                            <strong>🏆 Status da Equipe:</strong> 
                            <Badge bg={
                              minhaEquipe.status === 'PAGO' ? 'success' : 
                              minhaEquipe.status === 'ATIVA' ? 'primary' : 
                              minhaEquipe.status === 'PENDENTE' ? 'warning' : 'secondary'
                            } className="ms-2">
                              {minhaEquipe.status || 'PENDENTE'}
                            </Badge>
                          </Alert>
                        ) : null;
                      })()}
                    </Col>
                  </Row>
                  
                  {competicoes.length === 0 ? (
                    <Alert variant="info">
                      <FaEye className="me-2" />
                      Nenhuma competição encontrada.
                  </Alert>
                ) : (
                    <Table responsive striped hover>
                    <thead>
                      <tr>
                          <th>Competição</th>
                          <th>Data</th>
                          <th>Status da Competição</th>
                          <th>Valor da Equipe</th>
                          <th>Status dos Meus Comprovantes</th>
                          <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                        {competicoes.map(competicao => {
                          const comprovantesCompeticao = comprovantesInscricao.filter(
                            comp => comp.competicaoId === competicao.id && comp.equipeId === user?.idEquipe
                          );
                          const comprovantesPendentes = comprovantesCompeticao.filter(
                            comp => comp.status === 'PENDENTE'
                          );
                          const comprovantesAprovados = comprovantesCompeticao.filter(
                            comp => comp.status === 'APROVADO'
                          );
                          const comprovantesRejeitados = comprovantesCompeticao.filter(
                            comp => comp.status === 'REJEITADO'
                          );

                          return (
                            <tr key={competicao.id}>
                              <td>
                                <strong>{competicao.nomeCompeticao}</strong>
                            <br />
                                <small className="text-muted">{competicao.local}</small>
                          </td>
                              <td>{competicao.dataCompeticao.toLocaleDateString('pt-BR')}</td>
                                                            <td>
                                <Badge bg={
                                  competicao.status === 'REALIZADA' ? 'success' : 
                                  competicao.status === 'CANCELADA' ? 'danger' : 'warning'
                                }>
                                  {competicao.status}
                            </Badge>
                          </td>
                          <td>
                            <strong>R$ {calcularValorEquipeNaCompeticao(user?.idEquipe || '', competicao.id || '').toFixed(2)}</strong>
                          </td>
                          <td>
                            <div>
                              <small>
                                <Badge bg="warning" className="me-1">
                                  {comprovantesPendentes.length} Pendentes
                                </Badge>
                                <Badge bg="success" className="me-1">
                                  {comprovantesAprovados.length} Aprovados
                                </Badge>
                                <Badge bg="danger">
                                  {comprovantesRejeitados.length} Rejeitados
                                </Badge>
                              </small>
                            </div>
                          </td>
                          <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => abrirModalInscricao(competicao)}
                                >
                                  <FaUpload className="me-1" />
                                  Enviar Comprovantes
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}

                  {/* Lista de Comprovantes do Usuário */}
                  {comprovantesInscricao.filter(comp => comp.equipeId === user?.idEquipe).length > 0 && (
                    <div className="mt-4">
                      <h6>📄 Meus Comprovantes Enviados</h6>
                      <Table responsive striped hover>
                        <thead>
                          <tr>
                            <th>Competição</th>
                            <th>Arquivo</th>
                            <th>Data Upload</th>
                            <th>Valor</th>
                            <th>Status do Comprovante</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprovantesInscricao
                            .filter(comp => comp.equipeId === user?.idEquipe)
                            .map(comprovante => (
                            <tr key={comprovante.nomeArquivoSalvo}>
                              <td>{comprovante.nomeCompeticao}</td>
                              <td>
                                <small className="text-muted">{comprovante.nome}</small>
                              </td>
                              <td>{comprovante.dataUpload.toLocaleDateString('pt-BR')}</td>
                              <td>R$ {calcularValorEquipeNaCompeticao(user?.idEquipe || '', comprovante.competicaoId).toFixed(2)}</td>
                              <td>
                                <Badge bg={
                                  comprovante.status === 'APROVADO' ? 'success' : 
                                  comprovante.status === 'REJEITADO' ? 'danger' : 'warning'
                                }>
                                  {comprovante.status === 'APROVADO' ? 'COMPROVANTE APROVADO' : 
                                   comprovante.status === 'REJEITADO' ? 'COMPROVANTE REJEITADO' : 
                                   'PENDENTE'}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleDownloadComprovanteInscricao(comprovante)}
                                    title="Baixar"
                                  >
                                    <FaDownload />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeletarComprovanteInscricao(comprovante)}
                                    title="Excluir"
                                  >
                                    <FaTimesCircle />
                                  </Button>
                                </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                    </div>
                  )}
                </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

      </Tabs>

      {/* Modal de Configuração de Anuidade */}
      <Modal show={showConfigAnuidadeModal} onHide={() => setShowConfigAnuidadeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCog className="me-2" />
            Configurar Valor da Anuidade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>ℹ️ Informação:</strong> Configure o valor da anuidade que será cobrado de todos os atletas.
          </Alert>
          
          <Form.Group>
            <Form.Label>Valor da Anuidade (R$)</Form.Label>
            <InputGroup>
              <InputGroup.Text>R$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={valorAnuidade}
                onChange={(e) => setValorAnuidade(e.target.value)}
                placeholder="0,00"
              />
            </InputGroup>
          </Form.Group>

          {anuidade && (
            <Alert variant="warning" className="mt-3">
              <strong>⚠️ Valor Atual:</strong> R$ {anuidade.valor.toFixed(2)}
              <br />
              <small>Configurado em: {anuidade.dataCriacao.toLocaleDateString('pt-BR')}</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigAnuidadeModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSalvarAnuidade}>
            Salvar Configuração
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Prestação de Contas */}
      <Modal show={showPrestacaoContasModal} onHide={() => setShowPrestacaoContasModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileUpload className="me-2" />
            Prestação de Contas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>ℹ️ Informação:</strong> Faça upload de documentos contábeis para prestação de contas.
          </Alert>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Documento</Form.Label>
                <Form.Select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as 'DEMONSTRATIVO' | 'BALANCETE')}
                >
                  <option value="DEMONSTRATIVO">Demonstrativo Contábil de Caixa</option>
                  <option value="BALANCETE">Balancete</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Arquivo (PDF ou CSV)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.csv"
                  onChange={(e) => setSelectedFile((e.target as HTMLInputElement).files?.[0] || null)}
                />
                <Form.Text className="text-muted">
                  Aceita arquivos PDF ou CSV
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {selectedFile && (
            <Alert variant="success">
              <strong>✅ Arquivo selecionado:</strong> {selectedFile.name}
              <br />
              <small>Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrestacaoContasModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUploadDocumento} disabled={!selectedFile}>
            Enviar Documento
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Detalhes da Equipe */}
      <Modal show={showDetalhesEquipeModal} onHide={() => setShowDetalhesEquipeModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUsers className="me-2" />
            Detalhes Financeiros - {selectedEquipe?.nomeEquipe}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEquipe && (
            <div>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h4>R$ {calcularValorCompeticoesEquipe(selectedEquipe.id!).toFixed(2)}</h4>
                      <p className="text-muted">Total Competições</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h4>R$ {(getAtletasEquipe(selectedEquipe.id!).length * (anuidade?.valor || 0)).toFixed(2)}</h4>
                      <p className="text-muted">Total Anuidades</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h4>{getAtletasEquipe(selectedEquipe.id!).length}</h4>
                      <p className="text-muted">Total Atletas</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Tabs defaultActiveKey="atletas">
                <Tab eventKey="atletas" title="Atletas e Anuidades">
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Atleta</th>
                        <th>CPF</th>
                        <th>Status Anuidade</th>
                        <th>Valor Anuidade</th>
                        <th>Data Pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAtletasEquipe(selectedEquipe.id!).map(atleta => {
                        const statusAnuidade = getStatusAnuidadeAtleta(atleta.id!);
                        const pagamento = pagamentosAnuidade.find(pag => pag.idAtleta === atleta.id);
                        
                        return (
                          <tr key={atleta.id}>
                            <td>
                              <strong>{atleta.nome}</strong>
                            </td>
                            <td>{atleta.cpf}</td>
                            <td>
                              <Badge bg={statusAnuidade === 'PAGO' ? 'success' : 'warning'}>
                                {statusAnuidade === 'PAGO' ? 'PAGO' : 'PENDENTE'}
                              </Badge>
                            </td>
                            <td>R$ {(anuidade?.valor || 0).toFixed(2)}</td>
                            <td>
                              {pagamento?.dataPagamento 
                                ? pagamento.dataPagamento.toLocaleDateString('pt-BR')
                                : '-'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Tab>
                
                <Tab eventKey="competicoes" title="Competições">
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Competição</th>
                        <th>Data</th>
                        <th>Atletas Inscritos</th>
                        <th>Valor por Atleta</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competicoes.map(competicao => {
                        const inscricoesCompeticao = getInscricoesEquipe(selectedEquipe.id!)
                          .filter(insc => insc.idCompeticao === competicao.id);
                        
                        if (inscricoesCompeticao.length === 0) return null;
                        
                        return (
                          <tr key={competicao.id}>
                            <td>
                              <strong>{competicao.nomeCompeticao}</strong>
                            </td>
                            <td>{competicao.dataCompeticao.toLocaleDateString('pt-BR')}</td>
                            <td>{inscricoesCompeticao.length}</td>
                            <td>R$ {competicao.valorInscricao.toFixed(2)}</td>
                            <td>
                              <strong>R$ {(inscricoesCompeticao.length * competicao.valorInscricao).toFixed(2)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Tab>
              </Tabs>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetalhesEquipeModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Upload de Comprovante */}
      <Modal show={showComprovanteModal} onHide={() => setShowComprovanteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUpload className="me-2" />
            Enviar Comprovante de Pagamento
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>ℹ️ Informação:</strong> Envie o comprovante de pagamento da anuidade do atleta.
            <br />
            <strong>⚠️ Importante:</strong> Se já existir um comprovante para este atleta, ele será substituído automaticamente.
          </Alert>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Atleta</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedAtleta?.nome || ''}
                  disabled
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Data do Pagamento</Form.Label>
                <Form.Control
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Valor Pago (R$)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Comprovante (PDF, JPG, PNG)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setComprovanteFile((e.target as HTMLInputElement).files?.[0] || null)}
                  required
                />
                <Form.Text className="text-muted">
                  Tamanho máximo: 20MB
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Observações (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={observacoesComprovante}
              onChange={(e) => setObservacoesComprovante(e.target.value)}
              placeholder="Informações adicionais sobre o pagamento..."
            />
          </Form.Group>

          {comprovanteFile && (
            <Alert variant="success">
              <strong>✅ Arquivo selecionado:</strong> {comprovanteFile.name}
              <br />
              <small>Tamanho: {(comprovanteFile.size / 1024 / 1024).toFixed(2)} MB</small>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComprovanteModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUploadComprovante}>
            <FaUpload className="me-2" />
            Enviar Comprovante
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Aprovação de Comprovante */}
      <Modal show={showAprovacaoModal} onHide={() => setShowAprovacaoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCheckCircle className="me-2" />
            Aprovar/Rejeitar Comprovante
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComprovante && (
            <div>
              <Alert variant="info">
                <strong>📄 Comprovante:</strong> {selectedComprovante.nome}
                <br />
                <strong>👤 Atleta:</strong> {selectedComprovante.nomeAtleta} (ID: {selectedComprovante.atletaId})
                <br />
                <strong>🏆 Equipe:</strong> {selectedComprovante.nomeEquipe} (ID: {selectedComprovante.equipeId})
                <br />
                <strong>💰 Valor:</strong> R$ {selectedComprovante.valor ? selectedComprovante.valor.toFixed(2) : 'N/A'}
                <br />
                <strong>📅 Data de Aprovação:</strong> {selectedComprovante.dataPagamento ? selectedComprovante.dataPagamento.toLocaleDateString('pt-BR') : 'N/A'}
                <br />
                <strong>📤 Data Upload:</strong> {selectedComprovante.dataUpload.toLocaleDateString('pt-BR')}
                <br />
                <strong>📏 Tamanho:</strong> {(selectedComprovante.tamanho / 1024 / 1024).toFixed(2)} MB
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Observações (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={observacoesAprovacao}
                  onChange={(e) => setObservacoesAprovacao(e.target.value)}
                  placeholder="Motivo da aprovação/rejeição..."
                />
              </Form.Group>

              <Alert variant="warning">
                <strong>⚠️ Atenção:</strong> Ao aprovar o comprovante, o status do atleta será alterado para ATIVO automaticamente.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAprovacaoModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleRejeitarComprovante}>
            <FaTimesCircle className="me-2" />
            Rejeitar
          </Button>
          <Button variant="success" onClick={handleAprovarComprovante}>
            <FaCheckCircle className="me-2" />
            Aprovar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Upload de Comprovantes de Inscrição */}
      <Modal show={showInscricaoModal} onHide={() => setShowInscricaoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUpload className="me-2" />
            Enviar Comprovantes de Inscrição
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompeticao && (
            <div>
              <Alert variant="info">
                <strong>🏆 Competição:</strong> {selectedCompeticao.nomeCompeticao}
                <br />
                <strong>📅 Data:</strong> {selectedCompeticao.dataCompeticao.toLocaleDateString('pt-BR')}
                <br />
                <strong>📍 Local:</strong> {selectedCompeticao.local || 'Não informado'}
                {selectedEquipeInscricao && (
                  <>
                    <br />
                    <strong>🏆 Equipe:</strong> {selectedEquipeInscricao.nomeEquipe}
                  </>
                )}
              </Alert>

              <Alert variant="warning">
                <strong>⚠️ Importante:</strong> Você pode enviar múltiplos documentos para esta competição.
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Arquivos *</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    setSelectedFiles(files);
                  }}
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                />
                <Form.Text className="text-muted">
                  Formatos aceitos: PDF, PNG, JPG, JPEG (máx. 20MB cada arquivo)
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Observações (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={observacoesInscricao}
                  onChange={(e) => setObservacoesInscricao(e.target.value)}
                  placeholder="Observações sobre os comprovantes..."
                />
              </Form.Group>

              {selectedFiles.length > 0 && (
                <Alert variant="success">
                  <strong>✅ {selectedFiles.length} arquivo(s) selecionado(s):</strong>
                  <ul className="mb-0 mt-2">
                    {selectedFiles.map((file, index) => (
                      <li key={index}>
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInscricaoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUploadComprovanteInscricao}
            disabled={selectedFiles.length === 0}
          >
            <FaUpload className="me-2" />
            Enviar Comprovantes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Aprovação de Comprovantes de Inscrição */}
      <Modal show={showAprovacaoInscricaoModal} onHide={() => setShowAprovacaoInscricaoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCheckCircle className="me-2" />
            Aprovar/Rejeitar Comprovante de Inscrição
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComprovanteInscricao && (
            <div>
              <Alert variant="info">
                <strong>📋 Detalhes do Comprovante:</strong>
                <br />
                <strong>🏆 Competição:</strong> {selectedComprovanteInscricao.nomeCompeticao}
                <br />
                <strong>🏆 Equipe:</strong> {selectedComprovanteInscricao.nomeEquipe}
                <br />
                <strong>📁 Arquivo:</strong> {selectedComprovanteInscricao.nome}
                <br />
                <strong>💰 Valor:</strong> R$ {selectedComprovanteInscricao.valor.toFixed(2)}
                <br />
                <strong>📅 Data Upload:</strong> {selectedComprovanteInscricao.dataUpload.toLocaleDateString('pt-BR')}
                <br />
                <strong>📊 Status Atual:</strong> {selectedComprovanteInscricao.status}
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Observações</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={observacoesAprovacaoInscricao}
                  onChange={(e) => setObservacoesAprovacaoInscricao(e.target.value)}
                  placeholder="Observações sobre a aprovação/rejeição..."
                />
              </Form.Group>

              <Alert variant="warning">
                <strong>⚠️ Atenção:</strong> Ao aprovar o comprovante, o status da equipe será atualizado automaticamente.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAprovacaoInscricaoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRejeitarComprovanteInscricao}
            className="me-2"
          >
            <FaTimesCircle className="me-2" />
            Rejeitar
          </Button>
          <Button 
            variant="success" 
            onClick={handleAprovarComprovanteInscricao}
          >
            <FaCheckCircle className="me-2" />
            Aprovar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FinanceiroPage;
