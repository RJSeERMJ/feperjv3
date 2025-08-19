import { google } from "googleapis";

function getAuth() {
  try {
    // Primeiro, tentar usar variáveis de ambiente
    if (process.env.GOOGLE_SERVICE_KEY) {
      console.log("🔑 Usando credenciais de variáveis de ambiente");
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_KEY);
      
      return new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/drive"]
      );
    }
  } catch (error) {
    console.warn("⚠️ Erro ao usar variáveis de ambiente, usando credenciais hardcoded");
  }

  // Fallback para credenciais hardcoded
  console.log("🔑 Usando credenciais hardcoded");
  const credentials = {
    type: "service_account",
    project_id: "feperj-2025-469423",
    private_key_id: "436cacf73077176405e5d9b2becb498c830b1941",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDhMLxrmNJeqPT8\niByfw6SAtdIW72W1VCfbP5dElWA+UtliNrj2bB+DnvcG48wpO4+Oa+ypOdnaWgeC\ngvqXavP6OD6jg7v4yYPNP4dLum8ZyMl6ejALQnWL0JlWY6VgDCcZuqItvZUSOSND\nTrftXUdABBRREFz//Pg+o+g+SmlWgBEHoS5VB8bKcViUBKAGoA4xKnWSkdvhL1VL\nK64JPRZbymbaIjSGtzK4JTbN/y8Dxm9TcXQ9jngpuDnfJgjwFVAfsa8H2cqyM4qj\nphTRNnVlSdEi6Oies7PY/WWOMP9kNt0mDNMC9TDqQSCDz6Sb83Uy/0A6zZJv9cZn\nxLE/xPIfAgMBAAECggEAAzHqUnUncvFfEcrVQSJeTfcxGmMzebhOcnVmA4ftBtAC\ncTrJMrHZBp3gRQhBXXUQtdrBJQDYSZlNEaR4bWKL60kWARg9jVY/7k8QRS+ezj+u\nNXR7WbA2iREgw9GDx1I/fHAh8e0xKsIwcQ7dBttJHKw8z45LC39pfutbawV/lhsR\n5rOzVazjfVixL6Fs8uniHQ4SAK0aA2A4En6cCKcHPdx9mSQ9gxQ/oHOUpmM7DOt4\nllfABWkjDyYwNyduH/vMmNFQ0X0OW/5hn+aYRrLmDb1arjj72HzvP50UgTY3DkuD\n+fW7Y4S/IF3rqjT4fs2Dn0KKUrkhWi0sE6cZzwwvBQKBgQD5VVPxTtu2HfImGuOe\nvpKrTy+yUZDSilkfmu5ldcpA9Wh6k1Q9s11XtQxQxh+QPmAnD78GhKE6Uo+c5spj\n5lhFq64rJbu9eClwGDHmzUuUf+2hsn6DSt/AlDcY2DQ+VWkZBfTQ6Tl1DkhcxH7g\nbsWt/z4UEZpZb9kZSoM0fnioBQKBgQDnNiavCj2MXVa3aKu+VOaa1dCfiEhiLnBP\ndrGY/Q/XCU6R75K6fSaLNN9rwJlW3yLIEDYdMYS4gfinPwddzN49idV0JvtEDBY7\nI155ASl9YFCk11bgFMtxKuVgxk7op61u69FWyJ1orpPCkKhahES98w5UmyYUEbnE\nbUdTUyB+0wKBgHeKRnWyRjq5fshwKeOJIQ7LJ2YKHzIiLHqvsE6qu66LOm1SR5hR\nb5ZGckIjyyxAC5+OuBpq6lXpEXu7Vxuwa2/z0MxVCf7cJpncr8glc3AeKZNV3bwa\n4M4XAZeCyQF9t6bMqUSkHO0XTPBVMTNvSI2Ui3HZwrPQoTiz9dXsMPL1AoGBALn4\n+oCMshj28ssvrAS58YrVNKs9SUt/ouKnzA4MbvM+Dy6fDtxl0dziuFrJXg1cCXP2\nZjBxJhnqoQCVV+2A3bmN5l05BZ4kQrVqq5CU+LRaBkOw2bX/w+vQ3xNKLyo/xOaV\nU5qEXuhWk49KH8A+57QJjptK+APohg2TAG3rTRX1AoGBAJDFR57TBbHhegct9+Xj\n3+LYG3+TsQfMlYOhC6V9/W/Rk4T/r1DkqFcLiJICd1aoQC8fKa7UVYBpNe74ck1N\naQTAoWRSZ7Bk3k7l7nbADhKlBXihLbh5BhVzSoCiq/Db0tuG6pLHAKm68kSJshv/\nDcxFZAVqtFsfGUzVYDrwsyH0\n-----END PRIVATE KEY-----\n",
    client_email: "feperj@feperj-2025-469423.iam.gserviceaccount.com",
    client_id: "111293667076278625027",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/feperj%40feperj-2025-469423.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  return new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/drive"]
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "fileId é obrigatório" });
  }

  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileId}"`);

    response.data
      .on("end", () => {
        console.log("Download concluído");
      })
      .on("error", (err) => {
        console.error("Erro no download:", err);
        res.status(500).end("Erro no download");
      })
      .pipe(res);
  } catch (error) {
    console.error("Erro download:", error);
    return res.status(500).json({ error: error.message });
  }
}
