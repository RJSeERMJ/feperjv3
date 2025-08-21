-- =====================================================
-- POLÍTICAS PARA BUCKET "financeiro" - SUPABASE
-- Upload, Download e Delete para usuários autenticados
-- =====================================================

-- 1. POLÍTICA PARA UPLOAD (INSERT) - Usuários autenticados
CREATE POLICY "Upload documentos financeiros" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'financeiro'
);

-- 2. POLÍTICA PARA DOWNLOAD (SELECT) - Usuários autenticados
CREATE POLICY "Download documentos financeiros" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'financeiro'
);

-- 3. POLÍTICA PARA DELETE - Usuários autenticados
CREATE POLICY "Delete documentos financeiros" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'financeiro'
);

-- 4. POLÍTICA PARA UPDATE (opcional) - Usuários autenticados
CREATE POLICY "Update documentos financeiros" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'financeiro'
)
WITH CHECK (
  bucket_id = 'financeiro'
);

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================

-- Para verificar se as políticas foram criadas:
-- SELECT * FROM storage.policies WHERE bucket_id = 'financeiro';

-- Para remover uma política específica (se necessário):
-- DROP POLICY "Nome da política" ON storage.objects;

-- Configurações do bucket de documentos contábeis
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-contabeis', 'documentos-contabeis', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança para o bucket de documentos contábeis
CREATE POLICY "Usuários autenticados podem fazer upload de documentos contábeis" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documentos-contabeis' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários autenticados podem visualizar documentos contábeis" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documentos-contabeis' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuários autenticados podem deletar documentos contábeis" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documentos-contabeis' 
  AND auth.role() = 'authenticated'
);

-- Tabela para logs de download de documentos contábeis
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id TEXT NOT NULL,
  nome_documento TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  usuario_email TEXT NOT NULL,
  data_download TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  sucesso BOOLEAN NOT NULL DEFAULT true,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_download_logs_usuario_id ON download_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_data_download ON download_logs(data_download DESC);
CREATE INDEX IF NOT EXISTS idx_download_logs_documento_id ON download_logs(documento_id);

-- Políticas de segurança para a tabela de logs
CREATE POLICY "Usuários autenticados podem inserir logs de download" ON download_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem visualizar logs de download" ON download_logs
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.login = auth.jwt() ->> 'email' 
    AND usuarios.tipo = 'admin'
  )
);

-- Função para limpar logs antigos (manter apenas últimos 6 meses)
CREATE OR REPLACE FUNCTION limpar_logs_antigos()
RETURNS void AS $$
BEGIN
  DELETE FROM download_logs 
  WHERE data_download < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Agendar limpeza automática (executar mensalmente)
SELECT cron.schedule(
  'limpar-logs-download',
  '0 2 1 * *', -- Primeiro dia do mês às 2h da manhã
  'SELECT limpar_logs_antigos();'
);

-- Tabela para logs de exclusão de documentos contábeis
CREATE TABLE IF NOT EXISTS delete_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id TEXT NOT NULL,
  nome_documento TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  usuario_tipo TEXT NOT NULL,
  data_exclusao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tipo_documento TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_delete_logs_usuario_id ON delete_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_delete_logs_data_exclusao ON delete_logs(data_exclusao DESC);
CREATE INDEX IF NOT EXISTS idx_delete_logs_documento_id ON delete_logs(documento_id);

-- Políticas de segurança para a tabela de logs de exclusão
CREATE POLICY "Usuários autenticados podem inserir logs de exclusão" ON delete_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem visualizar logs de exclusão" ON delete_logs
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.login = auth.jwt() ->> 'email' 
    AND usuarios.tipo = 'admin'
  )
);

-- =====================================================
-- SISTEMA DE COMPROVANTES DE ANUIDADE
-- =====================================================

-- Usar o bucket "financeiro" existente para comprovantes
-- Os comprovantes serão armazenados em: financeiro/comprovantes/equipe_X/arquivo.pdf

-- Políticas de segurança para comprovantes no bucket financeiro
-- (As políticas existentes do bucket financeiro já cobrem upload, download e delete)

-- Tabela para comprovantes de anuidade
CREATE TABLE IF NOT EXISTS comprovantes_anuidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_atleta TEXT NOT NULL,
  id_equipe TEXT NOT NULL,
  nome_atleta TEXT NOT NULL,
  nome_equipe TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  nome_arquivo_salvo TEXT NOT NULL,
  data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_pagamento TIMESTAMP WITH TIME ZONE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO')),
  observacoes TEXT,
  aprovado_por TEXT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  tamanho INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_comprovantes_atleta ON comprovantes_anuidade(id_atleta);
CREATE INDEX IF NOT EXISTS idx_comprovantes_equipe ON comprovantes_anuidade(id_equipe);
CREATE INDEX IF NOT EXISTS idx_comprovantes_status ON comprovantes_anuidade(status);
CREATE INDEX IF NOT EXISTS idx_comprovantes_data_upload ON comprovantes_anuidade(data_upload DESC);

-- Políticas de segurança para a tabela de comprovantes
CREATE POLICY "Equipe própria pode inserir comprovantes" ON comprovantes_anuidade
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND id_equipe IN (
    SELECT id_equipe FROM usuarios 
    WHERE usuarios.login = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Equipe própria e admin podem visualizar comprovantes" ON comprovantes_anuidade
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND (
    id_equipe IN (
      SELECT id_equipe FROM usuarios 
      WHERE usuarios.login = auth.jwt() ->> 'email'
    )
    OR EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.login = auth.jwt() ->> 'email' 
      AND usuarios.tipo = 'admin'
    )
  )
);

CREATE POLICY "Apenas admin pode atualizar comprovantes" ON comprovantes_anuidade
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.login = auth.jwt() ->> 'email' 
    AND usuarios.tipo = 'admin'
  )
);

CREATE POLICY "Equipe própria e admin podem deletar comprovantes" ON comprovantes_anuidade
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND (
    id_equipe IN (
      SELECT id_equipe FROM usuarios 
      WHERE usuarios.login = auth.jwt() ->> 'email'
    )
    OR EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.login = auth.jwt() ->> 'email' 
      AND usuarios.tipo = 'admin'
    )
  )
);

-- Tabela para logs de aprovação de anuidade
CREATE TABLE IF NOT EXISTS logs_aprovacao_anuidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comprovante_id TEXT NOT NULL,
  atleta_id TEXT NOT NULL,
  equipe_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  admin_nome TEXT NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('APROVAR', 'REJEITAR')),
  data_acao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_logs_aprovacao_comprovante ON logs_aprovacao_anuidade(comprovante_id);
CREATE INDEX IF NOT EXISTS idx_logs_aprovacao_admin ON logs_aprovacao_anuidade(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_aprovacao_data ON logs_aprovacao_anuidade(data_acao DESC);

-- Políticas de segurança para a tabela de logs de aprovação
CREATE POLICY "Admin pode inserir logs de aprovação" ON logs_aprovacao_anuidade
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.login = auth.jwt() ->> 'email' 
    AND usuarios.tipo = 'admin'
  )
);

CREATE POLICY "Apenas admin pode visualizar logs de aprovação" ON logs_aprovacao_anuidade
FOR SELECT USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.login = auth.jwt() ->> 'email' 
    AND usuarios.tipo = 'admin'
  )
);