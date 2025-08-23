// Cores padrão das anilhas baseadas no sistema IPF
export const PlateColors = {
  // Anilhas em KG (padrão IPF)
  KG_25: "#FF0000",      // Vermelho - 25kg
  KG_20: "#0000FF",      // Azul - 20kg
  KG_15: "#FFFF00",      // Amarelo - 15kg
  KG_10: "#00FF00",      // Verde - 10kg
  KG_5: "#FF8000",       // Laranja - 5kg
  KG_2_5: "#800080",     // Roxo - 2.5kg
  KG_1_25: "#FFC0CB",    // Rosa - 1.25kg
  KG_1: "#FFFFFF",       // Branco - 1kg
  KG_0_5: "#808080",     // Cinza - 0.5kg
  KG_0_25: "#000000",    // Preto - 0.25kg

  // Anilhas em LBS (padrão IPF)
  LBS_100: "#FF0000",    // Vermelho - 100lbs
  LBS_55: "#0000FF",     // Azul - 55lbs
  LBS_45: "#FFFF00",     // Amarelo - 45lbs
  LBS_35: "#00FF00",     // Verde - 35lbs
  LBS_25: "#FF8000",     // Laranja - 25lbs
  LBS_10: "#800080",     // Roxo - 10lbs
  LBS_5: "#FFC0CB",      // Rosa - 5lbs
  LBS_2_5: "#FFFFFF",    // Branco - 2.5lbs
  LBS_1_25: "#808080",   // Cinza - 1.25lbs
  LBS_0_5: "#000000",    // Preto - 0.5lbs

  // Cores padrão para erros ou casos especiais
  ERROR: "#FF0000",      // Vermelho para erros
  DEFAULT: "#808080",    // Cinza padrão
};

export type PlateColorsType = keyof typeof PlateColors;
