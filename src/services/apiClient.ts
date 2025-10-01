// Cliente API para comunicação com a nova API
import { toast } from 'react-toastify';

// Configurações da API
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Interface para resposta padrão da API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Interface para usuário autenticado
interface AuthUser {
  id: string;
  login: string;
  nome: string;
  tipo: 'admin' | 'usuario';
  idEquipe?: string;
}

// Interface para resposta de login
interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
  expiresIn?: number;
}

// Classe do cliente API
class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  // Carregar tokens do localStorage
  private loadTokens(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('api_token');
      this.refreshToken = localStorage.getItem('api_refresh_token');
    }
  }

  // Salvar tokens no localStorage
  private saveTokens(token: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_token', token);
      localStorage.setItem('api_refresh_token', refreshToken);
    }
    this.token = token;
    this.refreshToken = refreshToken;
  }

  // Limpar tokens
  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_token');
      localStorage.removeItem('api_refresh_token');
    }
    this.token = null;
    this.refreshToken = null;
  }

  // Fazer requisição HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Adicionar token de autorização se disponível
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Se token expirado, tentar refresh
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED' && this.refreshToken) {
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          // Tentar novamente com novo token
          const retryHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
            Authorization: `Bearer ${this.token}`,
          };
          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });
          return await retryResponse.json();
        } else {
          // Refresh falhou, fazer logout
          this.logout();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

      // Se erro de rate limit, mostrar mensagem específica
      if (response.status === 429) {
        toast.warning('Muitas tentativas. Aguarde um momento antes de tentar novamente.');
        throw new Error('Rate limit excedido');
      }

      return data;
    } catch (error) {
      console.error('🚨 Erro na requisição API:', error);
      throw error;
    }
  }

  // Refresh do token de autenticação
  private async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data: ApiResponse<{ token: string; expiresIn: number }> = await response.json();

      if (data.success && data.data?.token) {
        this.token = data.data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('api_token', data.data.token);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao refresh token:', error);
      return false;
    }
  }

  // Métodos de autenticação
  async login(login: string, senha: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, senha }),
    });

    if (response.success && response.data) {
      this.saveTokens(response.data.token!, response.data.refreshToken!);
    }

    return response;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
        });
      } catch (error) {
        console.warn('Erro ao fazer logout:', error);
      }
    }
    
    this.clearTokens();
    
    // Redirecionar para login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Métodos para atletas
  async getAtletas(filters?: {
    search?: string;
    equipe?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ atletas: any[]; total: number }>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.equipe) params.append('equipe', filters.equipe);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/atletas?${queryString}` : '/atletas';
    
    return this.request(endpoint);
  }

  async getAtleta(id: string): Promise<ApiResponse<any>> {
    return this.request(`/atletas/${id}`);
  }

  async createAtleta(atletaData: any): Promise<ApiResponse<any>> {
    return this.request('/atletas', {
      method: 'POST',
      body: JSON.stringify(atletaData),
    });
  }

  async updateAtleta(id: string, atletaData: any): Promise<ApiResponse<any>> {
    return this.request(`/atletas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(atletaData),
    });
  }

  async deleteAtleta(id: string): Promise<ApiResponse<void>> {
    return this.request(`/atletas/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Barra Pronta
  async getBarraProntaEntradas(filters?: {
    day?: number;
    platform?: number;
    flight?: string;
    search?: string;
  }): Promise<ApiResponse<{ entradas: any[]; total: number }>> {
    const params = new URLSearchParams();
    if (filters?.day) params.append('day', filters.day.toString());
    if (filters?.platform) params.append('platform', filters.platform.toString());
    if (filters?.flight) params.append('flight', filters.flight);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/barra-pronta?${queryString}` : '/barra-pronta';
    
    return this.request(endpoint);
  }

  async createBarraProntaEntrada(entradaData: any): Promise<ApiResponse<any>> {
    return this.request('/barra-pronta', {
      method: 'POST',
      body: JSON.stringify(entradaData),
    });
  }

  async updateBarraProntaEntrada(id: string, entradaData: any): Promise<ApiResponse<any>> {
    return this.request(`/barra-pronta/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entradaData),
    });
  }

  async getBarraProntaConfig(): Promise<ApiResponse<any>> {
    return this.request('/barra-pronta/config');
  }

  async saveBarraProntaConfig(config: any): Promise<ApiResponse<void>> {
    return this.request('/barra-pronta/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getBarraProntaLiftingState(): Promise<ApiResponse<any>> {
    return this.request('/barra-pronta/state');
  }

  async saveBarraProntaLiftingState(state: any): Promise<ApiResponse<void>> {
    return this.request('/barra-pronta/state', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  }

  // Métodos para logs
  async getLogs(filters?: {
    usuario?: string;
    acao?: string;
    resource?: string;
    limit?: number;
  }): Promise<ApiResponse<{ logs: any[]; total: number }>> {
    const params = new URLSearchParams();
    if (filters?.usuario) params.append('usuario', filters.usuario);
    if (filters?.acao) params.append('acao', filters.acao);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/logs?${queryString}` : '/logs';
    
    return this.request(endpoint);
  }

  // Métodos para estatísticas
  async getStats(): Promise<ApiResponse<{
    atletas: any;
    barraPronta: any;
    logs: any;
  }>> {
    return this.request('/stats');
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Obter token atual
  getToken(): string | null {
    return this.token;
  }

  // Obter usuário atual (decodificar token)
  getCurrentUser(): AuthUser | null {
    if (!this.token) return null;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return {
        id: payload.id,
        login: payload.login,
        nome: payload.nome,
        tipo: payload.tipo,
        idEquipe: payload.idEquipe,
      };
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient();

// Exportar classe para testes
export { ApiClient };

// Exportar tipos
export type { ApiResponse, AuthUser, LoginResponse };


