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
  FaChartBar
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { competicaoService, inscricaoService, atletaService, equipeService, logService } from '../services/firebaseService';
import { Competicao, InscricaoCompeticao, Atleta, Equipe } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Componente para edição de inscrição
const EditarInscricaoForm: React.FC<{
  inscricao: InscricaoCompeticao;
  competicao: Competicao;
  onSave: (categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any) => void;
  onCancel: () => void;
}> = ({ inscricao, competicao, onSave, onCancel }) => {
  const [categoriaPeso, setCategoriaPeso] = useState<any>(inscricao.categoriaPeso || null);
  const [categoriaIdade, setCategoriaIdade] = useState<any>(inscricao.categoriaIdade || null);
  const [dobraCategoria, setDobraCategoria] = useState<any>(inscricao.dobraCategoria);

  const podeEditarDobra = () => {
    if (!competicao.permiteDobraCategoria) return false;
    if (!competicao.dataNominacaoFinal) return true;
    
    const hoje = new Date();
    const umDiaAntes = new Date(competicao.dataNominacaoFinal);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    return hoje <= umDiaAntes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoriaPeso || !categoriaIdade) {
      toast.error('Selecione categoria de peso e idade');
      return;
    }

    onSave(categoriaPeso, categoriaIdade, dobraCategoria);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Alert variant="info" className="mb-3">
        <strong>ℹ️ Informação:</strong> 
        Você pode alterar a categoria de peso, categoria de idade e gerenciar dobra de categoria.
        {!podeEditarDobra() && (
          <span className="text-warning"> <strong>Dobra de categoria não pode mais ser alterada.</strong></span>
        )}
      </Alert>

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
  const [showEditarInscricaoModal, setShowEditarInscricaoModal] = useState(false);
  const [inscricaoEmEdicao, setInscricaoEmEdicao] = useState<InscricaoCompeticao | null>(null);
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

    try {
      const inscricoesParaCriar = atletasSelecionados.map(atletaId => ({
        idAtleta: atletaId,
        idCompeticao: selectedCompeticao.id!,
        statusInscricao: 'INSCRITO' as const,
        valorIndividual: selectedCompeticao.valorInscricao,
        temDobra: inscricaoFormData.temDobra,
        observacoes: inscricaoFormData.observacoes
      }));

      // Criar todas as inscrições
      for (const inscricao of inscricoesParaCriar) {
        await inscricaoService.create(inscricao);
      }

      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Inscrição em competição',
        detalhes: `Inscrição de ${atletasSelecionados.length} atleta(s) na competição: ${selectedCompeticao.nomeCompeticao}`,
        tipoUsuario: user?.tipo || 'usuario'
      });

      toast.success(`${atletasSelecionados.length} atleta(s) inscrito(s) com sucesso!`);
      setShowInscricaoModal(false);
      loadData(); // Recarregar dados
    } catch (error) {
      toast.error('Erro ao realizar inscrição');
      console.error(error);
    }
  };

  const handleAtletaSelection = (atletaId: string, checked: boolean) => {
    if (checked) {
      setAtletasSelecionados(prev => [...prev, atletaId]);
    } else {
      setAtletasSelecionados(prev => prev.filter(id => id !== atletaId));
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

  const handleSalvarEdicaoInscricao = async (categoriaPeso: any, categoriaIdade: any, dobraCategoria?: any) => {
    if (!inscricaoEmEdicao || !selectedCompeticao) return;

    try {
      // Preparar dados para atualização
      const dadosAtualizacao: any = {
        categoriaPeso,
        categoriaIdade
      };

      // Adicionar dobraCategoria apenas se existir
      if (dobraCategoria) {
        dadosAtualizacao.dobraCategoria = dobraCategoria;
      } else {
        // Se não há dobra, remover o campo
        dadosAtualizacao.dobraCategoria = undefined;
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
                <tr key={competicao.id}>
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
                    <div className="d-flex gap-1">
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => handleInscricoes(competicao)}
                      >
                        <FaUsers className="me-1" />
                        Ver Inscrições
                      </Button>
                      {user?.tipo === 'admin' || (user?.idEquipe && atletas.some(a => a.idEquipe === user.idEquipe)) ? (
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={() => handleInscreverAtletas(competicao)}
                          disabled={competicao.status !== 'AGENDADA' || !podeInscrever(competicao)}
                          title={
                            competicao.status !== 'AGENDADA' 
                              ? 'Apenas competições agendadas permitem inscrições' 
                              : !podeInscrever(competicao)
                              ? 'Prazo de inscrição encerrado'
                              : 'Inscrever atletas'
                          }
                        >
                          <FaUserCheck className="me-1" />
                          Inscrever
                        </Button>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    {user?.tipo === 'admin' && (
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Ações
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEdit(competicao)}>
                            <FaEdit className="me-2" />
                            Editar
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDelete(competicao)}>
                            <FaTrash className="me-2" />
                            Excluir
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
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
                        {inscricao.temDobra ? (
                          <Badge bg="warning">Sim</Badge>
                        ) : (
                          <Badge bg="secondary">Não</Badge>
                        )}
                      </td>
                      <td>
                        {podeEditarInscricao(selectedCompeticao!) && (
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
              <Row>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.statusInscricao === 'INSCRITO').length}</h3>
                      <p className="text-muted">Total de Inscritos</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.statusInscricao === 'CANCELADO').length}</h3>
                      <p className="text-muted">Inscrições Canceladas</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h3>{inscricoes.filter(i => i.temDobra).length}</h3>
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
     </div>
   );
 };

export default CompeticoesPage;
