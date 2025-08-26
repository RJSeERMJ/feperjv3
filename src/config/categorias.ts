import { CategoriaPeso, CategoriaIdade } from '../types';

// Categorias de Peso - Masculino
export const CATEGORIAS_PESO_MASCULINO: CategoriaPeso[] = [
  {
    id: 'subjunior-junior-m',
    nome: 'Sub-Júnior/Júnior',
    pesoMaximo: 53.0,
    sexo: 'M',
    descricao: 'Até 53,0 kg'
  },
  {
    id: '59-m',
    nome: '59,0 kg',
    pesoMaximo: 59.0,
    sexo: 'M',
    descricao: 'Até 59,0 kg'
  },
  {
    id: '66-m',
    nome: '66,0 kg',
    pesoMaximo: 66.0,
    sexo: 'M',
    descricao: '53,01 – 66,0 kg'
  },
  {
    id: '74-m',
    nome: '74,0 kg',
    pesoMaximo: 74.0,
    sexo: 'M',
    descricao: '66,01 – 74,0 kg'
  },
  {
    id: '83-m',
    nome: '83,0 kg',
    pesoMaximo: 83.0,
    sexo: 'M',
    descricao: '74,01 – 83,0 kg'
  },
  {
    id: '93-m',
    nome: '93,0 kg',
    pesoMaximo: 93.0,
    sexo: 'M',
    descricao: '83,01 – 93,0 kg'
  },
  {
    id: '105-m',
    nome: '105,0 kg',
    pesoMaximo: 105.0,
    sexo: 'M',
    descricao: '93,01 – 105,0 kg'
  },
  {
    id: '120-m',
    nome: '120,0 kg',
    pesoMaximo: 120.0,
    sexo: 'M',
    descricao: '105,01 – 120,0 kg'
  },
  {
    id: '120plus-m',
    nome: '+120,0 kg',
    pesoMaximo: 999.0,
    sexo: 'M',
    descricao: 'Acima de 120,01 kg'
  }
];

// Categorias de Peso - Feminino
export const CATEGORIAS_PESO_FEMININO: CategoriaPeso[] = [
  {
    id: 'subjunior-junior-f',
    nome: 'Sub-Júnior/Júnior',
    pesoMaximo: 43.0,
    sexo: 'F',
    descricao: 'Até 43,0 kg'
  },
  {
    id: '47-f',
    nome: '47,0 kg',
    pesoMaximo: 47.0,
    sexo: 'F',
    descricao: 'Até 47,0 kg'
  },
  {
    id: '52-f',
    nome: '52,0 kg',
    pesoMaximo: 52.0,
    sexo: 'F',
    descricao: '47,01 – 52,0 kg'
  },
  {
    id: '57-f',
    nome: '57,0 kg',
    pesoMaximo: 57.0,
    sexo: 'F',
    descricao: '52,01 – 57,0 kg'
  },
  {
    id: '63-f',
    nome: '63,0 kg',
    pesoMaximo: 63.0,
    sexo: 'F',
    descricao: '57,01 – 63,0 kg'
  },
  {
    id: '69-f',
    nome: '69,0 kg',
    pesoMaximo: 69.0,
    sexo: 'F',
    descricao: '63,01 – 69,0 kg'
  },
  {
    id: '76-f',
    nome: '76,0 kg',
    pesoMaximo: 76.0,
    sexo: 'F',
    descricao: '69,01 – 76,0 kg'
  },
  {
    id: '84-f',
    nome: '84,0 kg',
    pesoMaximo: 84.0,
    sexo: 'F',
    descricao: '76,01 – 84,0 kg'
  },
  {
    id: '84plus-f',
    nome: '+84,0 kg',
    pesoMaximo: 999.0,
    sexo: 'F',
    descricao: 'Acima de 84,01 kg'
  }
];

// Categorias de Idade
export const CATEGORIAS_IDADE: CategoriaIdade[] = [
  {
    id: 'subjunior',
    nome: 'Sub-júnior',
    idadeMaxima: 18,
    descricao: 'Do dia em que completar 14 anos e durante todo o calendário do ano em que completar 18 anos'
  },
  {
    id: 'junior',
    nome: 'Júnior',
    idadeMaxima: 23,
    descricao: 'De 1 de Janeiro do calendário anual em que completar 19 anos e durante todo o calendário do ano em que completar 23 anos'
  },
  {
    id: 'open',
    nome: 'Open',
    idadeMaxima: 999,
    descricao: 'Do dia 1 de Janeiro do ano em que completar 19 anos em diante'
  },
  {
    id: 'master1',
    nome: 'Master I',
    idadeMaxima: 49,
    descricao: 'De 1 de Janeiro do calendário anual em que completar 40 anos e durante todo o calendário do ano em que completar 49 anos'
  },
  {
    id: 'master2',
    nome: 'Master II',
    idadeMaxima: 59,
    descricao: 'De 1 de Janeiro do calendário anual em que completar 50 anos e durante todo o calendário do ano em que completar 59 anos'
  },
  {
    id: 'master3',
    nome: 'Master III',
    idadeMaxima: 69,
    descricao: 'De 1 de Janeiro do calendário anual em que completar 60 anos e durante todo o calendário do ano em que completar 69 anos'
  },
  {
    id: 'master4',
    nome: 'Master IV',
    idadeMaxima: 999,
    descricao: 'De 1 de Janeiro do calendário anual em que completar 70 anos em diante'
  },
  {
    id: 'convidado',
    nome: 'Convidado',
    idadeMaxima: 999,
    descricao: 'Atleta convidado - sem restrições de idade/peso'
  }
];

// Função para calcular idade baseada na data de nascimento
export const calcularIdade = (dataNascimento: Date): number => {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();
  
  const anoNascimento = dataNascimento.getFullYear();
  const mesNascimento = dataNascimento.getMonth();
  const diaNascimento = dataNascimento.getDate();
  
  let idade = anoAtual - anoNascimento;
  
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
    idade--;
  }
  
  return idade;
};

// Função para validar se uma idade é compatível com uma categoria específica
export const validarIdadeParaCategoria = (idade: number, categoriaIdade: CategoriaIdade): boolean => {
  switch (categoriaIdade.id) {
    case 'subjunior':
      return idade >= 14 && idade <= 18;
    case 'junior':
      return idade >= 19 && idade <= 23;
    case 'open':
      // Master 3 (60-69) e Master 4 (70+) NÃO podem usar categoria Open
      if (idade >= 60) {
        return false;
      }
      return idade >= 19;
    case 'master1':
      return idade >= 40 && idade <= 49;
    case 'master2':
      return idade >= 50 && idade <= 59;
    case 'master3':
      return idade >= 60 && idade <= 69;
    case 'master4':
      return idade >= 70;
    case 'convidado':
      return true; // Convidados não têm restrições de idade/peso
    default:
      return false;
  }
};

// Função para obter categoria de idade baseada na idade
export const obterCategoriaIdade = (idade: number): CategoriaIdade | null => {
  return CATEGORIAS_IDADE.find(cat => validarIdadeParaCategoria(idade, cat)) || null;
};

// Função para obter categorias de peso baseadas no sexo
export const obterCategoriasPeso = (sexo: 'M' | 'F'): CategoriaPeso[] => {
  return sexo === 'M' ? CATEGORIAS_PESO_MASCULINO : CATEGORIAS_PESO_FEMININO;
};

// Função para validar se um atleta pode usar uma categoria de peso específica
export const validarPesoParaCategoria = (idade: number, categoriaPeso: CategoriaPeso): boolean => {
  // Categorias restritas apenas para Sub-júnior (14-18 anos)
  const categoriasRestritas = ['subjunior-junior-m', 'subjunior-junior-f'];
  
  if (categoriasRestritas.includes(categoriaPeso.id)) {
    // Apenas atletas Sub-júnior (14-18 anos) podem usar estas categorias
    return idade >= 14 && idade <= 18;
  }
  
  // Para outras categorias, não há restrição de idade
  return true;
};

// Função para obter categorias de peso válidas para um atleta baseado na idade
export const obterCategoriasPesoValidas = (sexo: 'M' | 'F', idade: number): CategoriaPeso[] => {
  const categorias = obterCategoriasPeso(sexo);
  
  return categorias.filter(categoria => validarPesoParaCategoria(idade, categoria));
};

// Função para validar dobra de categoria
export const validarDobraCategoria = (
  categoriaIdade1: CategoriaIdade,
  categoriaIdade2: CategoriaIdade
): boolean => {
  // Convidados podem dobrar com qualquer categoria
  if (categoriaIdade1.id === 'convidado' || categoriaIdade2.id === 'convidado') {
    return true;
  }
  
  // Sub-júnior nunca pode dobrar
  if (categoriaIdade1.id === 'subjunior' || categoriaIdade2.id === 'subjunior') {
    return false;
  }
  
  // Master 3 e Master 4 nunca podem dobrar
  if (categoriaIdade1.id === 'master3' || categoriaIdade2.id === 'master3' ||
      categoriaIdade1.id === 'master4' || categoriaIdade2.id === 'master4') {
    return false;
  }
  
  // Apenas combinações específicas são permitidas:
  // 1. Open + Júnior (e vice-versa)
  // 2. Open + Master 1,2 (e vice-versa) - Master 3 e 4 removidos
  const combinacoesValidas = [
    { cat1: 'open', cat2: 'junior' },
    { cat1: 'open', cat2: 'master1' },
    { cat1: 'open', cat2: 'master2' },
    { cat1: 'junior', cat2: 'open' },
    { cat1: 'master1', cat2: 'open' },
    { cat1: 'master2', cat2: 'open' }
  ];
  
  return combinacoesValidas.some(combo => 
    (categoriaIdade1.id === combo.cat1 && categoriaIdade2.id === combo.cat2) ||
    (categoriaIdade1.id === combo.cat2 && categoriaIdade2.id === combo.cat1)
  );
};

// Função para obter opções válidas de dobra
export const obterOpcoesDobraValidas = (categoriaIdade: CategoriaIdade): CategoriaIdade[] => {
  // Convidados podem dobrar com qualquer categoria
  if (categoriaIdade.id === 'convidado') {
    return CATEGORIAS_IDADE.filter(cat => cat.id !== 'convidado'); // Pode dobrar com todas exceto ele mesmo
  }
  
  // Sub-júnior nunca pode dobrar
  if (categoriaIdade.id === 'subjunior') {
    return [];
  }
  
  // Master 3 e Master 4 nunca podem dobrar
  if (categoriaIdade.id === 'master3' || categoriaIdade.id === 'master4') {
    return [];
  }
  
  // Open pode dobrar com Júnior, Master 1 e 2 (Master 3 e 4 removidos)
  if (categoriaIdade.id === 'open') {
    return CATEGORIAS_IDADE.filter(cat => 
      cat.id === 'junior' || cat.id === 'master1' || cat.id === 'master2'
    );
  }
  
  // Júnior pode dobrar apenas com Open
  if (categoriaIdade.id === 'junior') {
    return CATEGORIAS_IDADE.filter(cat => cat.id === 'open');
  }
  
  // Master 1 e 2 podem dobrar apenas com Open (Master 3 removido)
  if (categoriaIdade.id === 'master1' || categoriaIdade.id === 'master2') {
    return CATEGORIAS_IDADE.filter(cat => cat.id === 'open');
  }
  
  return [];
};
