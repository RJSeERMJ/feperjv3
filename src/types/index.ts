export interface Usuario {
  id?: string;
  login: string;
  nome: string;
  senha?: string;
  tipo: 'admin' | 'usuario';
  ativo?: boolean; // Novo campo para controle de usuários ativos
  chefeEquipe?: boolean; // Indica se o usuário é chefe de equipe
  idEquipe?: string; // ID da equipe que o usuário é chefe
  // Campos da equipe
  nomeEquipe?: string; // Nome da equipe
  estado?: string; // Estado da equipe
  observacoes?: string; // Observações
  dataCriacao?: Date;
  criadoPor?: string; // ID do usuário que criou este usuário
  equipe?: Equipe; // Relacionamento com a equipe
}

export interface Equipe {
  id?: string;
  nomeEquipe: string;
  cidade: string;
  tecnico?: string;
  telefone?: string;
  email?: string;
  idChefe?: string; // ID do usuário que é chefe da equipe
  status?: 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'PAGO' | 'PENDENTE';
  dataCriacao?: Date;
  // Novos campos para anuidade de equipe
  valorAnuidadeEquipe?: number; // Valor da anuidade da equipe
  dataAtualizacao?: Date; // Data da última atualização do status
}

export interface Categoria {
  id?: string;
  nomeCategoria: string;
  pesoMaximo?: number;
  sexo: 'M' | 'F';
  descricao?: string;
}

export interface Atleta {
  id?: string;
  nome: string;
  cpf: string;
  matricula?: string; // Matrícula gerada automaticamente (5 primeiros dígitos do CPF + ano atual)
  sexo: 'M' | 'F';
  email: string;
  telefone?: string;
  dataNascimento?: Date;
  dataFiliacao: Date;

  maiorTotal?: number;
  status: 'ATIVO' | 'INATIVO';
  idCategoria?: string;
  idEquipe?: string;
  endereco?: string;
  observacoes?: string;
  comprovanteResidencia?: string;
  carteirinha?: string;
  foto3x4?: string;
  dataCriacao?: Date;
  categoria?: Categoria;
  equipe?: Equipe;
}

export interface HistoricoTotal {
  id?: string;
  idAtleta: string;
  totalAnterior?: number;
  totalNovo: number;
  dataAlteracao?: Date;
  competicao?: string;
}

export interface Competicao {
  id?: string;
  nomeCompeticao: string;
  dataCompeticao: Date;
  valorInscricao: number;
  valorDobra?: number;
  dataInicioInscricao: Date;
  dataFimInscricao: Date;
  dataNominacaoPreliminar?: Date;
  dataNominacaoFinal?: Date;
  local?: string;
  descricao?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
  permiteDobraCategoria?: boolean;
  // Novos campos para modalidade
  modalidade: 'CLASSICA' | 'EQUIPADO' | 'CLASSICA_EQUIPADO';
  tipoCompeticao?: string; // Campo para tipo de competição (S, AST, T)
  dataCriacao?: Date;
}

export interface InscricaoCompeticao {
  id?: string;
  idAtleta: string;
  idCompeticao: string;
  dataInscricao?: Date;
  statusInscricao: 'INSCRITO' | 'CANCELADO';
  observacoes?: string;
  valorIndividual?: number;
  temDobra?: boolean;
  categoriaPeso?: CategoriaPeso | null;
  categoriaIdade?: CategoriaIdade | null;
  dobraCategoria?: {
    categoriaPeso: CategoriaPeso;
    categoriaIdade: CategoriaIdade;
  };
  // Campo para total declarado nos últimos 12 meses
  total12Meses?: number;
  // Novo campo para modalidade da inscrição
  modalidade?: 'CLASSICA' | 'EQUIPADO';
  dataAprovacao?: Date;
  dataRejeicao?: Date;
  aprovadoPor?: string;
  rejeitadoPor?: string;
  atleta?: Atleta;
  competicao?: Competicao;
}

export interface ResultadoCompeticao {
  id?: string;
  idAtleta: string;
  idCompeticao: string;
  agachamento?: number;
  supino?: number;
  terra?: number;
  total?: number;
  posicao?: number;
  dataRegistro?: Date;
  atleta?: Atleta;
  competicao?: Competicao;
}

export interface LogAtividade {
  id?: string;
  dataHora: Date;
  usuario: string;
  acao: string;
  detalhes?: string;
  tipoUsuario?: string;
}

export interface CategoriaInscricao {
  id?: string;
  idInscricao: string;
  idCategoria: string;
  peso?: number;
  categoria?: Categoria;
}

export interface CategoriaPeso {
  id: string;
  nome: string;
  pesoMaximo: number;
  sexo: 'M' | 'F';
  descricao: string;
}

export interface CategoriaIdade {
  id: string;
  nome: string;
  idadeMaxima: number;
  descricao: string;
}

export interface InscricaoCategoria {
  idAtleta: string;
  categoriaPeso: CategoriaPeso | null;
  categoriaIdade: CategoriaIdade | null;
  dobraCategoria?: {
    categoriaPeso: CategoriaPeso;
    categoriaIdade: CategoriaIdade;
  };
}

export interface DashboardStats {
  totalAtletas: number;
  totalEquipes: number;
  totalCompeticoes: number;
  atletasAtivos: number;
  atletasInativos: number;
  atletasPorSexo: { masculino: number; feminino: number };
  atletasPorEquipe: Array<{ equipe: string; quantidade: number }>;
  maioresTotais: Array<{ atleta: string; total: number }>;
  maioresTotaisMasculino: Array<{ atleta: string; total: number }>;
  maioresTotaisFeminino: Array<{ atleta: string; total: number }>;
  melhoresIPFPointsMasculino: Array<{ atleta: string; pontos: number; total: number; competicao: string }>;
  melhoresIPFPointsFeminino: Array<{ atleta: string; pontos: number; total: number; competicao: string }>;
}

export interface NotificacaoDocumento {
  id?: string;
  idEquipe: string;
  nomeEquipe: string;
  tipoDocumento: 'COMPROVANTE_INSCRICAO' | 'COMPROVANTE_ANUIDADE' | 'COMPROVANTE_ANUIDADE_EQUIPE' | 'COMPROVANTE_RESIDENCIA' | 'FOTO_3X4' | 'CERTIFICADO_ADEL';
  nomeDocumento: string;
  dataEnvio: Date;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'EXCLUIDO';
  observacoes?: string;
  aprovadoPor?: string;
  dataAprovacao?: Date;
  dataExclusao?: Date;
}

export interface LoginCredentials {
  login: string;
  senha: string;
}

export interface AuthContextType {
  user: Usuario | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearAuthData: () => void;
  loading: boolean;
  createUser?: (userData: {
    email: string;
    password: string;
    nome: string;
    tipo: 'admin' | 'usuario';
  }) => Promise<boolean>;
  firebaseUser?: any; // Firebase User object
}

// Novos tipos para anuidade de equipe
export interface ComprovanteAnuidadeEquipe {
  id?: string;
  idEquipe: string;
  nomeEquipe: string;
  nome: string; // Nome do arquivo
  nomeArquivoSalvo: string; // Nome do arquivo salvo no storage
  dataUpload: Date;
  dataPagamento: Date;
  valor: number;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  observacoes?: string;
  enviadoPor?: string; // Nome do usuário que enviou
  aprovadoPor?: string;
  dataAprovacao?: Date;
  rejeitadoPor?: string;
  dataRejeicao?: Date;
  tamanho: number;
  contentType: string;
  url?: string;
}

export interface AnuidadeEquipe {
  id?: string;
  valor: number;
  dataCriacao: Date;
  dataAtualizacao?: Date;
  ativo: boolean;
}
