import React, { useState, useEffect } from 'react';
import { 
  Container, 
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
  Dropdown
} from 'react-bootstrap';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaDownload, FaUpload, FaIdCard, FaFileAlt, FaFileExport } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { atletaService, equipeService, categoriaService, logService } from '../services/firebaseService';
import { documentService } from '../services/documentService';
import { Atleta, Equipe, Categoria } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCPFValidation } from '../hooks/useCPFValidation';
import DocumentosModal from '../components/DocumentosModal';
import MatriculaModal from '../components/MatriculaModal';
import ModeloCarteirinhaModal from '../components/ModeloCarteirinhaModal';
import { carteirinhaService, CarteirinhaData } from '../services/carteirinhaService';

// Função para gerar matrícula baseada no CPF e ano atual
const gerarMatricula = (cpf: string): string => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const primeirosDigitos = cpfLimpo.substring(0, 5);
  const anoAtual = new Date().getFullYear();
  return `FEPERJ - ${primeirosDigitos}${anoAtual}`;
};

const AtletasPage: React.FC = () => {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDocumentosModal, setShowDocumentosModal] = useState(false);
  const [showMatriculaModal, setShowMatriculaModal] = useState(false);
  const [showModeloCarteirinhaModal, setShowModeloCarteirinhaModal] = useState(false);
  const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
  const [editingAtleta, setEditingAtleta] = useState<Atleta | null>(null);
  const [atletasComMatricula, setAtletasComMatricula] = useState<Set<string>>(new Set());
  const [atletasComDocumentos, setAtletasComDocumentos] = useState<Set<string>>(new Set());
  const [refreshDocumentos, setRefreshDocumentos] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    matricula: '',
    sexo: 'M' as 'M' | 'F',
    email: '',
    telefone: '',
    dataNascimento: '',
    dataFiliacao: '',
    maiorTotal: '',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
    idEquipe: '',
    endereco: '',
    observacoes: ''
  });
  const { user } = useAuth();
  const { validateCPF, formatCPF, validating: cpfValidating, lastValidation: cpfValidation } = useCPFValidation();

  useEffect(() => {
    loadData();
  }, []);

  // Atualizar matrícula quando CPF mudar
  useEffect(() => {
    if (formData.cpf.replace(/\D/g, '').length >= 5) {
      const novaMatricula = gerarMatricula(formData.cpf);
      setFormData(prev => ({ ...prev, matricula: novaMatricula }));
    }
  }, [formData.cpf]);

  // Recarregar verificação de documentos quando houver mudanças
  useEffect(() => {
    if (refreshDocumentos > 0 && atletas.length > 0) {
      verificarDocumentosCarteirinha(atletas);
    }
  }, [refreshDocumentos, atletas]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Se for admin, carrega todos os atletas e equipes
      // Se for usuário comum, carrega apenas atletas da sua equipe
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
          setCategorias([]);
          return;
        }
        
        // Buscar apenas atletas da equipe do usuário
        const atletasDaEquipe = await atletaService.getAll();
        atletasData = atletasDaEquipe.filter(atleta => atleta.idEquipe === user.idEquipe);
        
        // Buscar apenas a equipe do usuário
        const equipeDoUsuario = await equipeService.getById(user.idEquipe);
        equipesData = equipeDoUsuario ? [equipeDoUsuario] : [];
      }
      
      const categoriasData = await categoriaService.getAll();
      
      setAtletas(atletasData);
      setEquipes(equipesData);
      setCategorias(categoriasData);
      
      // Verificar quais atletas têm documentos de matrícula e carteirinha
      await Promise.all([
        verificarDocumentosMatricula(atletasData),
        verificarDocumentosCarteirinha(atletasData)
      ]);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verificarDocumentosMatricula = async (atletas: Atleta[]) => {
    try {
      const atletasComMatriculaSet = new Set<string>();
      
      // Verificar apenas atletas que têm ID
      const atletasComId = atletas.filter(atleta => atleta.id);
      
      // Processar em paralelo para melhor performance
      const verificacoes = atletasComId.map(async (atleta) => {
        try {
          const documentos = await documentService.listDocuments(atleta.id!);
          const temMatricula = documentos.some(doc => doc.tipo === 'matricula');
          return temMatricula ? atleta.id! : null;
        } catch (error) {
          console.warn(`Erro ao verificar documentos do atleta ${atleta.id}:`, error);
          return null;
        }
      });
      
      const resultados = await Promise.all(verificacoes);
      resultados.forEach(id => {
        if (id) {
          atletasComMatriculaSet.add(id);
        }
      });
      
      setAtletasComMatricula(atletasComMatriculaSet);
    } catch (error) {
      console.error('Erro ao verificar documentos de matrícula:', error);
    }
  };

  const verificarDocumentosCarteirinha = async (atletas: Atleta[]) => {
    try {
      const atletasComDocumentosSet = new Set<string>();
      
      // Verificar apenas atletas que têm ID
      const atletasComId = atletas.filter(atleta => atleta.id);
      
      // Processar em paralelo para melhor performance
      const verificacoes = atletasComId.map(async (atleta) => {
        try {
          const documentos = await documentService.listDocuments(atleta.id!);
          const temFoto3x4 = documentos.some(doc => doc.tipo === 'foto-3x4');
          const temComprovanteResidencia = documentos.some(doc => doc.tipo === 'comprovante-residencia');
          return (temFoto3x4 && temComprovanteResidencia) ? atleta.id! : null;
        } catch (error) {
          console.warn(`Erro ao verificar documentos do atleta ${atleta.id}:`, error);
          return null;
        }
      });
      
      const resultados = await Promise.all(verificacoes);
      resultados.forEach(id => {
        if (id) {
          atletasComDocumentosSet.add(id);
        }
      });
      
      setAtletasComDocumentos(atletasComDocumentosSet);
    } catch (error) {
      console.error('Erro ao verificar documentos para carteirinha:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação de segurança para usuários não-admin
    if (user?.tipo !== 'admin') {
      // Usuário comum só pode criar/editar atletas da sua equipe
      if (!user?.idEquipe) {
        toast.error('Usuário não está vinculado a uma equipe');
        return;
      }
      
      // Se estiver editando, verificar se o atleta pertence à equipe do usuário
      if (editingAtleta && editingAtleta.idEquipe !== user.idEquipe) {
        toast.error('Você só pode editar atletas da sua equipe');
        return;
      }
      
      // Forçar a equipe do usuário para novos atletas
      formData.idEquipe = user.idEquipe;
    }
    
    // Validar CPF antes de salvar
    const cpfValidation = await validateCPF(formData.cpf, editingAtleta?.id);
    if (!cpfValidation.isValid) {
      toast.error(cpfValidation.message);
      return;
    }
    
    // Verificar se usuário não-admin está tentando alterar status
    if (user?.tipo !== 'admin' && editingAtleta && formData.status !== editingAtleta.status) {
      toast.error('Apenas administradores podem alterar o status do atleta');
      return;
    }
    
    try {
      const atletaData = {
        ...formData,
        matricula: formData.matricula || gerarMatricula(formData.cpf),
        dataNascimento: formData.dataNascimento ? new Date(formData.dataNascimento) : undefined,
        dataFiliacao: new Date(formData.dataFiliacao),
        maiorTotal: formData.maiorTotal ? parseFloat(formData.maiorTotal) : undefined,
        idEquipe: formData.idEquipe || undefined
      };

      if (editingAtleta) {
        await atletaService.update(editingAtleta.id!, atletaData);
        toast.success('Atleta atualizado com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Atualizou atleta',
          detalhes: `Atualizou dados do atleta ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      } else {
        await atletaService.create(atletaData);
        toast.success('Atleta cadastrado com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Cadastrou atleta',
          detalhes: `Cadastrou novo atleta: ${formData.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
      }

      setShowModal(false);
      setEditingAtleta(null);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar atleta');
      console.error(error);
    }
  };

  const handleEdit = (atleta: Atleta) => {
    // Verificação de segurança para usuários não-admin
    if (user?.tipo !== 'admin' && atleta.idEquipe !== user?.idEquipe) {
      toast.error('Você só pode editar atletas da sua equipe');
      return;
    }
    
    setEditingAtleta(atleta);
    setFormData({
      nome: atleta.nome,
      cpf: atleta.cpf,
      matricula: atleta.matricula || '',
      sexo: atleta.sexo,
      email: atleta.email,
      telefone: atleta.telefone || '',
      dataNascimento: atleta.dataNascimento ? atleta.dataNascimento.toISOString().split('T')[0] : '',
      dataFiliacao: atleta.dataFiliacao.toISOString().split('T')[0],
      maiorTotal: atleta.maiorTotal?.toString() || '',
      status: atleta.status,
      idEquipe: atleta.idEquipe || '',
      endereco: atleta.endereco || '',
      observacoes: atleta.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDocumentos = (atleta: Atleta) => {
    // Verificação de segurança para usuários não-admin
    if (user?.tipo !== 'admin' && atleta.idEquipe !== user?.idEquipe) {
      toast.error('Você só pode acessar documentos de atletas da sua equipe');
      return;
    }
    
    setSelectedAtleta(atleta);
    setShowDocumentosModal(true);
  };

  const handleDocumentosChanged = () => {
    // Incrementar contador para triggerar recarregamento
    setRefreshDocumentos(prev => prev + 1);
  };

  const handleMatricula = (atleta: Atleta) => {
    // Verificação de segurança para usuários não-admin
    if (user?.tipo !== 'admin' && atleta.idEquipe !== user?.idEquipe) {
      toast.error('Você só pode acessar matrículas de atletas da sua equipe');
      return;
    }
    
    setSelectedAtleta(atleta);
    setShowMatriculaModal(true);
  };

  const handleGerarCarteirinha = async (atleta: Atleta) => {
    try {
      // Verificação de segurança para usuários não-admin
      if (user?.tipo !== 'admin' && atleta.idEquipe !== user?.idEquipe) {
        toast.error('Você só pode gerar carteirinhas de atletas da sua equipe');
        return;
      }

      // Verificar se o atleta tem os documentos necessários
      if (!atletasComDocumentos.has(atleta.id!)) {
        toast.error('Atleta deve ter foto 3x4 e comprovante de residência cadastrados');
        return;
      }

      // Buscar equipe do atleta
      const equipe = equipes.find(e => e.id === atleta.idEquipe);
      if (!equipe) {
        toast.error('Equipe do atleta não encontrada');
        return;
      }

      // Buscar foto 3x4 do atleta no Supabase
      let foto3x4Url: string | undefined;
      try {
        const documentos = await documentService.listDocuments(atleta.id!);
        const foto3x4Doc = documentos.find((doc: any) => doc.tipo === 'foto-3x4');
        
        if (foto3x4Doc?.url) {
          // Gerar URL temporária se necessário
          if (foto3x4Doc.urlTemporaria) {
            foto3x4Url = foto3x4Doc.urlTemporaria;
          } else {
            // Gerar URL temporária válida por 1 hora
            foto3x4Url = await documentService.generateTemporaryUrl(
              `${atleta.id}/foto-3x4/${foto3x4Doc.nomeArquivoSalvo}`,
              3600
            );
          }
          console.log('📸 Foto 3x4 encontrada:', foto3x4Url);
        } else {
          console.log('⚠️ Foto 3x4 não encontrada para o atleta');
        }
      } catch (error) {
        console.error('Erro ao buscar foto 3x4:', error);
      }

      // Preparar dados para carteirinha
      const dadosCarteirinha: CarteirinhaData = {
        atleta,
        equipe,
        foto3x4: foto3x4Url
      };

      // Gerar carteirinha
      const pdfBytes = await carteirinhaService.gerarCarteirinha(dadosCarteirinha);
      const nomeArquivo = `carteirinha_${atleta.nome.replace(/\s+/g, '_')}.pdf`;
      
      await carteirinhaService.baixarCarteirinha(pdfBytes, nomeArquivo);
      toast.success(`Carteirinha de ${atleta.nome} gerada com sucesso!`);

      // Registrar log
      await logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Gerou carteirinha',
        detalhes: `Gerou carteirinha do atleta: ${atleta.nome}`,
        tipoUsuario: user?.tipo || 'usuario'
      });
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
      toast.error(`Erro ao gerar carteirinha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (atleta: Atleta) => {
    // Verificação de segurança para usuários não-admin
    if (user?.tipo !== 'admin' && atleta.idEquipe !== user?.idEquipe) {
      toast.error('Você só pode excluir atletas da sua equipe');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir o atleta ${atleta.nome}?`)) {
      try {
        await atletaService.delete(atleta.id!);
        toast.success('Atleta excluído com sucesso!');
        
        // Registrar log
        await logService.create({
          dataHora: new Date(),
          usuario: user?.nome || 'Sistema',
          acao: 'Excluiu atleta',
          detalhes: `Excluiu atleta: ${atleta.nome}`,
          tipoUsuario: user?.tipo || 'usuario'
        });
        
        loadData();
      } catch (error) {
        toast.error('Erro ao excluir atleta');
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
        ['Nome', 'CPF', 'Matrícula', 'Sexo', 'Email', 'Telefone', 'Data de Nascimento', 'Data de Filiação', 'Equipe', 'Status', 'Maior Total (kg)', 'Endereço', 'Observações'],
        ...atletas.map(atleta => [
          atleta.nome,
          atleta.cpf,
          atleta.matricula || gerarMatricula(atleta.cpf),
          atleta.sexo,
          atleta.email,
          atleta.telefone || '',
          atleta.dataNascimento ? atleta.dataNascimento.toLocaleDateString('pt-BR') : '',
          atleta.dataFiliacao.toLocaleDateString('pt-BR'),
          atleta.equipe?.nomeEquipe || '',
          atleta.status,
          atleta.maiorTotal?.toString() || '',
          atleta.endereco || '',
          atleta.observacoes || ''
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `atletas_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar log
      logService.create({
        dataHora: new Date(),
        usuario: user?.nome || 'Sistema',
        acao: 'Exportou lista de atletas',
        detalhes: `Exportou ${atletas.length} atletas em CSV`,
        tipoUsuario: user?.tipo || 'usuario'
      }).catch(error => {
        console.warn('Erro ao registrar log de exportação:', error);
      });
      
      toast.success(`Lista de ${atletas.length} atletas exportada com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      matricula: '',
      sexo: 'M',
      email: '',
      telefone: '',
      dataNascimento: '',
      dataFiliacao: new Date().toISOString().split('T')[0],

      maiorTotal: '',
      status: 'ATIVO',
      idEquipe: user?.tipo === 'admin' ? '' : (user?.idEquipe || ''),
      endereco: '',
      observacoes: ''
    });
  };

  const filteredAtletas = atletas.filter(atleta =>
    atleta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    atleta.cpf.includes(searchTerm) ||
    atleta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (atleta.matricula && atleta.matricula.toLowerCase().includes(searchTerm.toLowerCase())) ||
    gerarMatricula(atleta.cpf).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2>👥 Gestão de Atletas</h2>
          {user?.tipo !== 'admin' && user?.equipe && (
            <p className="text-muted mb-0">
              Visualizando atletas da equipe: <strong>{user.equipe.nomeEquipe}</strong>
            </p>
          )}
        </div>
        <div className="d-flex gap-2">
          {user?.tipo === 'admin' && (
            <>
              <Button 
                variant="outline-info" 
                onClick={() => setShowModeloCarteirinhaModal(true)}
                title="Importar modelo de carteirinha"
              >
                <FaIdCard className="me-2" />
                Importar Modelo
              </Button>
              <Button 
                variant="outline-success" 
                onClick={handleExportCSV}
                title="Exportar lista de atletas em CSV"
              >
                <FaFileExport className="me-2" />
                Exportar CSV
              </Button>
            </>
          )}
          <Button 
            variant="primary" 
            onClick={() => {
              setEditingAtleta(null);
              resetForm();
              setShowModal(true);
            }}
          >
            <FaPlus className="me-2" />
            Novo Atleta
          </Button>
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
                  placeholder="Buscar por nome, CPF, email ou matrícula..."
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
                <th>CPF</th>
                <th>Matrícula</th>
                <th>Sexo</th>
                <th>Email</th>
                <th>Equipe</th>
                <th>Status</th>
                <th>Maior Total</th>
                <th>Carteirinha</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAtletas.map((atleta) => (
                <tr key={atleta.id}>
                  <td>{atleta.nome}</td>
                  <td>{atleta.cpf}</td>
                  <td>
                    {atleta.id && atletasComMatricula.has(atleta.id) ? (
                      <Badge 
                        bg="info" 
                        className="d-flex align-items-center cursor-pointer"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleMatricula(atleta)}
                        title="Clique para visualizar a matrícula"
                      >
                        <FaIdCard className="me-1" />
                        {atleta.matricula || gerarMatricula(atleta.cpf)}
                      </Badge>
                    ) : (
                      <Badge bg="info" className="d-flex align-items-center">
                        <FaIdCard className="me-1" />
                        {atleta.matricula || gerarMatricula(atleta.cpf)}
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg={atleta.sexo === 'M' ? 'primary' : 'danger'}>
                      {atleta.sexo === 'M' ? 'M' : 'F'}
                    </Badge>
                  </td>
                  <td>{atleta.email}</td>
                  <td>{atleta.equipe?.nomeEquipe || '-'}</td>
                  <td>
                    <Badge bg={atleta.status === 'ATIVO' ? 'success' : 'secondary'}>
                      {atleta.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td>{atleta.maiorTotal ? `${atleta.maiorTotal}kg` : '-'}</td>
                  <td>
                    {atletasComDocumentos.has(atleta.id!) ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleGerarCarteirinha(atleta)}
                        title="Gerar carteirinha"
                      >
                        <FaIdCard className="me-1" />
                        Gerar
                      </Button>
                    ) : (
                      <Badge bg="warning">
                        Documentos incompletos
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Ações
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEdit(atleta)}>
                          <FaEdit className="me-2" />
                          Editar
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDocumentos(atleta)}>
                          <FaFileAlt className="me-2" />
                          Documentos
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDelete(atleta)}>
                          <FaTrash className="me-2" />
                          Excluir
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredAtletas.length === 0 && (
            <Alert variant="info" className="text-center">
              Nenhum atleta encontrado.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAtleta ? 'Editar Atleta' : 'Novo Atleta'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-3">
              <strong>ℹ️ Informação:</strong> O CPF deve ser único em todo o sistema. 
              Se o CPF já estiver cadastrado em outra equipe, entre em contato com o administrador.
              <br />
              <strong>📋 Matrícula:</strong> A matrícula é gerada automaticamente com os 5 primeiros dígitos do CPF + ano atual (ex: FEPERJ - 151192025).
            </Alert>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CPF *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => {
                      const formattedCPF = formatCPF(e.target.value);
                      setFormData({...formData, cpf: formattedCPF});
                      
                      // Validar CPF em tempo real
                      if (formattedCPF.replace(/\D/g, '').length === 11) {
                        validateCPF(formattedCPF, editingAtleta?.id);
                      }
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                    isInvalid={cpfValidation ? !cpfValidation.isValid : false}
                    isValid={cpfValidation ? cpfValidation.isValid : false}
                  />
                  {cpfValidating && (
                    <Form.Text className="text-muted">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Verificando CPF...
                    </Form.Text>
                  )}
                  {cpfValidation && (
                    <Form.Control.Feedback type={cpfValidation.isValid ? "valid" : "invalid"}>
                      {cpfValidation.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Matrícula</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.matricula}
                    onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                    disabled
                    placeholder="Gerada automaticamente"
                  />
                  <Form.Text className="text-muted">
                    Formato: FEPERJ - [5 primeiros dígitos do CPF][ano atual]
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexo *</Form.Label>
                  <Form.Select
                    value={formData.sexo}
                    onChange={(e) => setFormData({...formData, sexo: e.target.value as 'M' | 'F'})}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Telefone</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Nascimento</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Filiação *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataFiliacao}
                    onChange={(e) => setFormData({...formData, dataFiliacao: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Equipe</Form.Label>
                  <Form.Select
                    value={formData.idEquipe}
                    onChange={(e) => setFormData({...formData, idEquipe: e.target.value})}
                    disabled={user?.tipo !== 'admin'}
                  >
                    <option value="">Selecione uma equipe</option>
                    {equipes.map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nomeEquipe}
                      </option>
                    ))}
                  </Form.Select>
                  {user?.tipo !== 'admin' && (
                    <Form.Text className="text-muted">
                      Atletas serão automaticamente vinculados à sua equipe
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maior Total (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={formData.maiorTotal}
                    onChange={(e) => setFormData({...formData, maiorTotal: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            {user?.tipo === 'admin' && (
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'ATIVO' | 'INATIVO'})}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Apenas administradores podem alterar o status
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingAtleta ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Documentos */}
      <DocumentosModal
        show={showDocumentosModal}
        onHide={() => {
          setShowDocumentosModal(false);
          setSelectedAtleta(null);
        }}
        atleta={selectedAtleta}
        onDocumentosChanged={handleDocumentosChanged}
      />

      {/* Modal da Matrícula */}
      <MatriculaModal
        show={showMatriculaModal}
        onHide={() => {
          setShowMatriculaModal(false);
          setSelectedAtleta(null);
        }}
        atleta={selectedAtleta}
      />

      {/* Modal de Importar Modelo de Carteirinha */}
      <ModeloCarteirinhaModal
        show={showModeloCarteirinhaModal}
        onHide={() => setShowModeloCarteirinhaModal(false)}
        onModeloImportado={() => {
          toast.success('Modelo de carteirinha atualizado! As próximas carteirinhas usarão o novo modelo.');
        }}
      />

    </div>
  );
};

export default AtletasPage;
