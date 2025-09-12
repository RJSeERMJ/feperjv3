// Configuração das posições dos campos na carteirinha
// Coordenadas em pontos (1 ponto = 1/72 de polegada)
// A origem (0,0) fica no canto inferior esquerdo do PDF

export interface CarteirinhaConfig {
  campos: {
    nome: { x: number; y: number; fontSize: number; maxWidth?: number };
    dataNascimento: { x: number; y: number; fontSize: number; maxWidth?: number };
    equipe: { x: number; y: number; fontSize: number; maxWidth?: number };
    validade: { x: number; y: number; fontSize: number; maxWidth?: number };
    cidade: { x: number; y: number; fontSize: number; maxWidth?: number };
    matricula: { x: number; y: number; fontSize: number; maxWidth?: number };
    foto: { x: number; y: number; width: number; height: number };
  };
  // Dimensões da página (padrão A4)
  pageSize: {
    width: number;
    height: number;
  };
}

// Configuração padrão - ajuste conforme o modelo de carteirinha
// Coordenadas ajustadas para pdf-lib (Y=0 no topo da página)
export const CONFIGURACAO_CARTEIRINHA: CarteirinhaConfig = {
  campos: {
    // Nome do atleta - posicionado no centro superior
    nome: { 
      x: 15, 
      y: 80, 
      fontSize: 8, 
      maxWidth: 120 
    },
    
    // Data de nascimento - abaixo do nome
    dataNascimento: { 
      x: 20, 
      y: 45, 
      fontSize: 8, 
      maxWidth: 100 
    },
    
    // Nome da equipe - lado esquerdo
    equipe: { 
      x: 15, 
      y: 15, 
      fontSize: 8, 
      maxWidth: 120 
    },
    
    // Ano de validade - lado direito
    validade: { 
      x: 122, 
      y: 15, 
      fontSize: 8, 
      maxWidth: 100 
    },
    
    // Cidade da equipe - lado esquerdo
    cidade: { 
      x: 110, 
      y: 45, 
      fontSize: 8, 
      maxWidth: 100 
    },
    
    // Matrícula do atleta - lado direito
    matricula: { 
      x: 160,
      y: 15, 
      fontSize: 8, 
      maxWidth: 100 
    },
    
    // Foto 3x4 - canto superior direito
    foto: { 
      x: 176, 
      y: 67.5, 
      width: 53, 
      height: 70 
    }
  },
  
  // Dimensões da página carteirinha (86mm x 54mm)
  pageSize: {
    width: 243.78, // 86mm em pontos (86 * 2.834645669)
    height: 153.07 // 54mm em pontos (54 * 2.834645669)
  }
};

// Função para validar se as coordenadas estão dentro da página
export const validarCoordenadas = (config: CarteirinhaConfig): boolean => {
  const { campos, pageSize } = config;
  
  // Verificar se todos os campos estão dentro da página
  const camposParaVerificar = [
    { x: campos.nome.x, y: campos.nome.y },
    { x: campos.dataNascimento.x, y: campos.dataNascimento.y },
    { x: campos.equipe.x, y: campos.equipe.y },
    { x: campos.validade.x, y: campos.validade.y },
    { x: campos.cidade.x, y: campos.cidade.y },
    { x: campos.matricula.x, y: campos.matricula.y },
    { x: campos.foto.x, y: campos.foto.y },
    { x: campos.foto.x + campos.foto.width, y: campos.foto.y + campos.foto.height }
  ];
  
  return camposParaVerificar.every(campo => 
    campo.x >= 0 && campo.x <= pageSize.width &&
    campo.y >= 0 && campo.y <= pageSize.height
  );
};

// Função para ajustar coordenadas automaticamente se estiverem fora da página
export const ajustarCoordenadas = (config: CarteirinhaConfig): CarteirinhaConfig => {
  const { pageSize } = config;
  const margem = 20; // Margem de segurança
  
  return {
    ...config,
    campos: {
      nome: {
        ...config.campos.nome,
        x: Math.max(margem, Math.min(config.campos.nome.x, pageSize.width - margem)),
        y: Math.max(margem, Math.min(config.campos.nome.y, pageSize.height - margem))
      },
      dataNascimento: {
        ...config.campos.dataNascimento,
        x: Math.max(margem, Math.min(config.campos.dataNascimento.x, pageSize.width - margem)),
        y: Math.max(margem, Math.min(config.campos.dataNascimento.y, pageSize.height - margem))
      },
      equipe: {
        ...config.campos.equipe,
        x: Math.max(margem, Math.min(config.campos.equipe.x, pageSize.width - margem)),
        y: Math.max(margem, Math.min(config.campos.equipe.y, pageSize.height - margem))
      },
      validade: {
        ...config.campos.validade,
        x: Math.max(margem, Math.min(config.campos.validade.x, pageSize.width - margem)),
        y: Math.max(margem, Math.min(config.campos.validade.y, pageSize.height - margem))
      },
      cidade: {
        ...config.campos.cidade,
        x: Math.max(margem, Math.min(config.campos.cidade.x, pageSize.width - margem)),
        y: Math.max(margem, Math.min(config.campos.cidade.y, pageSize.height - margem))
      },
      matricula: {
        ...config.campos.matricula,
        x: Math.max(margem, Math.min(config.campos.matricula.x, pageSize.width - margem)),
        y: Math.max(margem, Math.min(config.campos.matricula.y, pageSize.height - margem))
      },
      foto: {
        ...config.campos.foto,
        x: Math.max(margem, Math.min(config.campos.foto.x, pageSize.width - config.campos.foto.width - margem)),
        y: Math.max(margem, Math.min(config.campos.foto.y, pageSize.height - config.campos.foto.height - margem))
      }
    }
  };
};
