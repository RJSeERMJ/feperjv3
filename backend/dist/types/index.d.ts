export interface TenantConfig {
    id: string;
    name: string;
    domain?: string;
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
        measurementId?: string;
    };
    admin: {
        login: string;
        passwordHash: string;
        name: string;
        salt: string;
        createdAt: string;
    };
    branding: {
        name: string;
        logo: string;
        colors: {
            primary: string;
            secondary: string;
        };
    };
}
export interface User {
    id?: string;
    login: string;
    nome: string;
    tipo: 'admin' | 'usuario';
    chefeEquipe?: boolean;
    idEquipe?: string;
    nomeEquipe?: string;
    estado?: string;
    observacoes?: string;
    dataCriacao?: Date;
    equipe?: Equipe;
}
export interface Equipe {
    id?: string;
    nomeEquipe: string;
    cidade: string;
    tecnico?: string;
    telefone?: string;
    email?: string;
    idChefe?: string;
    status?: 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'PAGO' | 'PENDENTE';
    dataCriacao?: Date;
    valorAnuidadeEquipe?: number;
    dataAtualizacao?: Date;
}
export interface Atleta {
    id?: string;
    nome: string;
    cpf: string;
    matricula?: string;
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
export interface Categoria {
    id?: string;
    nomeCategoria: string;
    pesoMaximo?: number;
    sexo: 'M' | 'F';
    descricao?: string;
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
    modalidade: 'CLASSICA' | 'EQUIPADO' | 'CLASSICA_EQUIPADO';
    tipoCompeticao?: string;
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
    total12Meses?: number;
    modalidade?: 'CLASSICA' | 'EQUIPADO';
    dataAprovacao?: Date;
    dataRejeicao?: Date;
    aprovadoPor?: string;
    rejeitadoPor?: string;
    atleta?: Atleta;
    competicao?: Competicao;
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
export interface LoginCredentials {
    login: string;
    senha: string;
}
export interface AuthResponse {
    token: string;
    user: {
        login: string;
        nome: string;
        tipo: 'admin' | 'usuario';
    };
}
export interface JWTPayload {
    login: string;
    nome: string;
    tipo: 'admin' | 'usuario';
    tenant: string;
    iat: number;
    exp: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=index.d.ts.map