export default async function handler(req, res) {
  console.log("🏥 Health Check API chamada - Método:", req.method);

  if (req.method === "GET") {
    try {
      // Verificar variáveis de ambiente
      const envCheck = {
        // Firebase
        hasFirebaseApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
        hasFirebaseAuthDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        hasFirebaseProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
        
        // Supabase
        hasSupabaseKey: !!process.env.SUPABASE_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        
        // Outras
        hasNodeEnv: !!process.env.NODE_ENV,
        hasVercelUrl: !!process.env.VERCEL_URL
      };

      // Verificar se estamos no Vercel
      const isVercel = !!process.env.VERCEL_URL;
      const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'Local';

      return res.status(200).json({
        message: "Health Check OK!",
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          isVercel,
          deploymentUrl
        },
        env: envCheck,
        status: "healthy"
      });

    } catch (error) {
      console.error("❌ Erro no health check:", error);
      return res.status(500).json({
        message: "Erro no health check",
        error: error.message,
        status: "unhealthy"
      });
    }
  }

  return res.status(405).json({
    error: "Método não permitido. Use GET.",
    allowedMethods: ["GET"]
  });
}
