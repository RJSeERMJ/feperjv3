import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log("🧪 Teste Supabase API chamada - Método:", req.method);
  
  if (req.method === "GET") {
    try {
      console.log("🔍 Testando conexão com Supabase...");
      
      // Configuração do Supabase
      const supabaseUrl = 'https://kamgocrdbdwjryvcavuo.supabase.co';
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseAnonKey) {
        return res.status(500).json({
          message: "Variável de ambiente SUPABASE_ANON_KEY não configurada",
          success: false,
          env: {
            hasSupabaseUrl: true,
            hasSupabaseAnonKey: !!supabaseAnonKey,
            hasSupabaseServiceKey: !!supabaseServiceKey
          }
        });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Testar conexão listando buckets
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error("❌ Erro na conexão:", error);
        return res.status(500).json({
          message: "Erro na conexão com Supabase",
          success: false,
          error: error.message
        });
      }

      console.log("✅ Conexão com Supabase estabelecida");
      
      return res.status(200).json({ 
        message: "API de teste Supabase funcionando!",
        method: req.method,
        timestamp: new Date().toISOString(),
        success: true,
        env: {
          hasSupabaseUrl: true,
          hasSupabaseAnonKey: !!supabaseAnonKey,
          hasSupabaseServiceKey: !!supabaseServiceKey
        },
        supabase: {
          connected: true,
          buckets: buckets?.length || 0,
          url: supabaseUrl
        }
      });
      
    } catch (error) {
      console.error("❌ Erro no teste:", error);
      return res.status(500).json({
        message: "Erro no teste",
        success: false,
        error: error.message
      });
    }
  }
  
  if (req.method === "POST") {
    return res.status(200).json({ 
      message: "POST funcionando!",
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ 
    error: "Método não permitido. Use GET ou POST.",
    allowedMethods: ["GET", "POST"]
  });
}
