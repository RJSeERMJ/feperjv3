import { useState, useCallback, useEffect } from 'react';
import { atletaService } from '../services/firebaseService';

interface CPFValidationResult {
  isValid: boolean;
  isUnique: boolean;
  existingAtleta?: {
    nome: string;
    equipe?: string;
  } | null;
  message: string;
}

export const useCPFValidation = () => {
  const [validating, setValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<CPFValidationResult | null>(null);

  // Função para limpar CPF (remover caracteres não numéricos)
  const cleanCPF = useCallback((cpf: string): string => {
    return cpf.replace(/\D/g, '');
  }, []);

  // Função para formatar CPF
  const formatCPF = useCallback((cpf: string): string => {
    const numbers = cleanCPF(cpf);
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }, [cleanCPF]);

  // Função para validar formato do CPF
  const validateCPFFormat = useCallback((cpf: string): boolean => {
    const numbers = cleanCPF(cpf);
    return numbers.length === 11;
  }, [cleanCPF]);

  // Função para verificar se CPF já existe no sistema
  const checkCPFUniqueness = useCallback(async (cpf: string, excludeId?: string): Promise<CPFValidationResult> => {
    if (!validateCPFFormat(cpf)) {
      return {
        isValid: false,
        isUnique: false,
        message: 'CPF deve ter 11 dígitos'
      };
    }

    setValidating(true);
    try {
      const cpfLimpo = cleanCPF(cpf);
      const atletaExistente = await atletaService.getByCpf(cpfLimpo);
      
      // Se encontrou um atleta com o mesmo CPF
      if (atletaExistente) {
        // Se estamos editando e é o mesmo atleta, permitir
        if (excludeId && atletaExistente.id === excludeId) {
          return {
            isValid: true,
            isUnique: true,
            message: 'CPF válido'
          };
        }
        
        // CPF já existe em outro atleta
        return {
          isValid: false,
          isUnique: false,
          existingAtleta: {
            nome: atletaExistente.nome,
            equipe: atletaExistente.equipe?.nomeEquipe
          },
          message: `CPF já cadastrado. Atleta: ${atletaExistente.nome} (Equipe: ${atletaExistente.equipe?.nomeEquipe || 'N/A'}). Entre em contato com o administrador.`
        };
      }
      
      // CPF é único
      return {
        isValid: true,
        isUnique: true,
        message: 'CPF disponível para cadastro'
      };
      
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return {
        isValid: false,
        isUnique: false,
        message: 'Erro ao verificar CPF. Tente novamente.'
      };
    } finally {
      setValidating(false);
    }
  }, [cleanCPF, validateCPFFormat]);

  // Função para validação em tempo real
  const validateCPF = useCallback(async (cpf: string, excludeId?: string): Promise<CPFValidationResult> => {
    if (!cpf || cpf.trim().length === 0) {
      return {
        isValid: false,
        isUnique: false,
        message: 'CPF é obrigatório'
      };
    }

    if (!validateCPFFormat(cpf)) {
      return {
        isValid: false,
        isUnique: false,
        message: 'CPF deve ter 11 dígitos'
      };
    }

    // Aguardar um pouco antes de validar para evitar muitas requisições
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await checkCPFUniqueness(cpf, excludeId);
        setLastValidation(result);
        resolve(result);
      }, 500);
    });
  }, [checkCPFUniqueness, validateCPFFormat]);

  return {
    validating,
    lastValidation,
    cleanCPF,
    formatCPF,
    validateCPFFormat,
    checkCPFUniqueness,
    validateCPF
  };
};
