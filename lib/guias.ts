export type Actividad = { key: string; texto: string };
export type RangoEstimulacion = { mesesMin: number; mesesMax: number; titulo: string; actividades: Actividad[] };
export type RangoAlimentacion = { mesesMin: number; mesesMax: number; titulo: string; leche: string; solidos: string | null; alimentos: string[]; evitar: string[] };

export const ESTIMULACION: RangoEstimulacion[] = [
  {
    mesesMin: 0, mesesMax: 1, titulo: "0-1 mes — Recién nacido",
    actividades: [
      { key: "contacto_visual", texto: "Contacto visual frecuente (cara a cara)" },
      { key: "voz_suave", texto: "Hablarle con voz suave mirándolo a los ojos" },
      { key: "piel_con_piel", texto: "Tiempo de piel con piel (mínimo 20 min)" },
      { key: "seguimiento_visual", texto: "Seguimiento visual con objeto de colores (20-30 cm)" },
      { key: "paseo_brazos", texto: "Paseo suave en brazos con movimiento rítmico" },
      { key: "alto_contraste", texto: "Mostrar tarjetas o objetos de alto contraste (blanco y negro)" },
      { key: "canciones_cuna", texto: "Canciones de cuna repetitivas" },
      { key: "texturas_manitas", texto: "Explorar distintas texturas suaves en sus manitas" },
    ],
  },
  {
    mesesMin: 1, mesesMax: 2, titulo: "1-2 meses",
    actividades: [
      { key: "moviles_colores", texto: "Mostrar móviles de colores brillantes" },
      { key: "musica_suave", texto: "Música suave 15 min al día" },
      { key: "tummy_time", texto: "Tiempo boca abajo 3 veces al día" },
      { key: "sonrisas", texto: "Juego de sonrisas y gestos faciales" },
      { key: "alto_contraste_1m", texto: "Mostrar objetos de alto contraste (blanco y negro)" },
      { key: "masaje_1m", texto: "Masaje suave en piernas y brazos después del baño" },
      { key: "alerta_activa", texto: "Tiempo de alerta activa: hablarle cuando está despierto y tranquilo" },
    ],
  },
  {
    mesesMin: 2, mesesMax: 3, titulo: "2-3 meses",
    actividades: [
      { key: "sonajeros", texto: "Sonajeros de distintos sonidos" },
      { key: "reconoce_caras", texto: "Tiempo para reconocer caras familiares" },
      { key: "vocalizacion", texto: "Estimular vocalización respondiendo sus sonidos" },
      { key: "agarrar_objetos", texto: "Ofrecerle objetos para agarrar" },
      { key: "hablar_ojos", texto: "Hablarle mirándolo a los ojos 10 min" },
      { key: "tummy_time_3m", texto: "Tiempo boca abajo (aumentar duración progresivamente)" },
      { key: "objetos_movimiento", texto: "Mostrar objetos en movimiento de lado a lado" },
      { key: "imitar_balbuceos", texto: "Imitar sus balbuceos y esperar su respuesta" },
    ],
  },
  {
    mesesMin: 3, mesesMax: 4, titulo: "3-4 meses",
    actividades: [
      { key: "volteo", texto: "Estimular volteo (lado a lado)" },
      { key: "risa_juego", texto: "Juegos para provocar risa" },
      { key: "espejo", texto: "Juego de espejo (mostrar su reflejo)" },
      { key: "texturas_suaves", texto: "Explorar texturas suaves con sus manos" },
      { key: "masaje", texto: "Masaje corporal después del baño" },
      { key: "canciones_palmadas", texto: "Canciones con palmadas y movimiento de pies" },
      { key: "luz_movimiento", texto: "Objetos con luz o movimiento para seguir" },
      { key: "sentar_breve", texto: "Sentar brevemente con apoyo (5 min)" },
    ],
  },
  {
    mesesMin: 4, mesesMax: 6, titulo: "4-6 meses",
    actividades: [
      { key: "sentar_apoyo", texto: "Practicar sentarse con apoyo" },
      { key: "objetos_boca", texto: "Permitir llevar objetos seguros a la boca" },
      { key: "imitar_sonidos", texto: "Imitar sus sonidos para estimular lenguaje" },
      { key: "juguetes_colgar", texto: "Juguetes colgantes para alcanzar" },
      { key: "cantar", texto: "Cantarle canciones con gestos" },
      { key: "cuentos_colores", texto: "Leer cuentos con imágenes de colores brillantes" },
      { key: "bano_sensorial", texto: "Baño de tina como juego sensorial" },
      { key: "cambio_posicion", texto: "Practicar cambio de posición: boca arriba ↔ boca abajo" },
    ],
  },
  {
    mesesMin: 6, mesesMax: 8, titulo: "6-8 meses",
    actividades: [
      { key: "sentar_solo", texto: "Practicar sentarse solo" },
      { key: "pasar_objetos", texto: "Pasar objetos entre las dos manos" },
      { key: "gateo", texto: "Estimular gateo en superficie segura" },
      { key: "dice_mama_papa", texto: "Estimular 'mamá/papá' con repetición constante" },
      { key: "aplaudir", texto: "Juego de aplaudir e imitar movimientos" },
      { key: "solidos_inicio", texto: "Introducir primeros sólidos (papillas o BLW)" },
      { key: "cuentos_carton", texto: "Leer cuentos de cartón señalando imágenes" },
      { key: "espejo_6m", texto: "Jugar con su reflejo en el espejo" },
      { key: "meter_sacar", texto: "Explorar recipientes para meter y sacar objetos" },
      { key: "vasito_ayuda", texto: "Practicar beber de vasito con ayuda" },
    ],
  },
  {
    mesesMin: 8, mesesMax: 10, titulo: "8-10 meses",
    actividades: [
      { key: "para_apoyo", texto: "Practicar pararse con apoyo" },
      { key: "pinza_fina", texto: "Juegos de pinza fina (objetos pequeños seguros)" },
      { key: "senalar", texto: "Enseñar a señalar objetos y personas" },
      { key: "peek_a_boo", texto: "Juego de peek-a-boo (¿dónde está?)" },
      { key: "cubos_apilar", texto: "Apilar y derribar bloques o cubos" },
      { key: "canciones_gestos", texto: "Canciones con gestos (patitos, ruedas del bus)" },
      { key: "meter_sacar_8m", texto: "Juego de meter y sacar objetos de un recipiente" },
      { key: "soplar", texto: "Enseñar a soplar (burbujas, velas)" },
      { key: "cuentos_8m", texto: "Leer cuentos cortos señalando imágenes" },
    ],
  },
  {
    mesesMin: 10, mesesMax: 12, titulo: "10-12 meses",
    actividades: [
      { key: "primeros_pasos", texto: "Estimular primeros pasos tomado de manos" },
      { key: "palabras_simples", texto: "Enseñar palabras simples (agua, no, sí, más)" },
      { key: "cuentos_simples", texto: "Leer cuentos de cartón con imágenes grandes" },
      { key: "encajar_formas", texto: "Juegos de encajar formas simples" },
      { key: "despedirse", texto: "Enseñar a decir adiós con la mano" },
      { key: "escalones_apoyo", texto: "Práctica de subir y bajar escalones con apoyo" },
      { key: "bloques_apilar", texto: "Bloques para apilar y tumbar" },
      { key: "imitar_animales", texto: "Imitar animales y sus sonidos" },
    ],
  },
  {
    mesesMin: 12, mesesMax: 18, titulo: "12-18 meses",
    actividades: [
      { key: "caminar_solo", texto: "Practicar caminar solo en espacio seguro" },
      { key: "apilar_bloques", texto: "Apilar 2-4 bloques" },
      { key: "garabatear", texto: "Garabatear con crayones gruesos" },
      { key: "seguir_instrucciones", texto: "Seguir instrucciones simples de 1 paso" },
      { key: "imitar_tareas", texto: "Imitar tareas del hogar (barrer, limpiar)" },
      { key: "bailar", texto: "Bailar con música (estimulación del ritmo)" },
      { key: "nombrar_partes", texto: "Nombrar partes del cuerpo señalándolas" },
      { key: "cuentos_12m", texto: "Leer cuentos señalando imágenes y preguntando '¿dónde está?'" },
      { key: "juego_agua", texto: "Juego de agua en la tina o palangana" },
    ],
  },
  {
    mesesMin: 18, mesesMax: 36, titulo: "18-24 meses",
    actividades: [
      { key: "frases_2_palabras", texto: "Estimular frases de 2 palabras" },
      { key: "juego_simbolico", texto: "Juego simbólico (cocinar, cuidar muñecos)" },
      { key: "socializacion", texto: "Socialización con otros niños" },
      { key: "puzzles_simples", texto: "Puzzles simples de 2-4 piezas" },
      { key: "nombrar_partes_18m", texto: "Nombrar y señalar partes del cuerpo" },
      { key: "comer_solo", texto: "Practicar comer solo con cuchara" },
      { key: "cuentos_personajes", texto: "Leer cuentos y pedir que señale personajes" },
      { key: "clasificar", texto: "Clasificar objetos por colores o formas" },
      { key: "cantar_completo", texto: "Cantar canciones completas con ella/él" },
    ],
  },
];

export const ALIMENTACION: RangoAlimentacion[] = [
  {
    mesesMin: 0, mesesMax: 6, titulo: "0-6 meses — Solo leche",
    leche: "Leche materna o fórmula exclusiva · 8-12 tomas/día al inicio, disminuyendo gradualmente",
    solidos: null,
    alimentos: ["Leche materna o fórmula (única fuente de nutrición)"],
    evitar: ["Agua", "Jugos", "Tés", "Cualquier alimento sólido"],
  },
  {
    mesesMin: 6, mesesMax: 7, titulo: "6-7 meses — Inicio de sólidos",
    leche: "Continúa la leche materna o fórmula como base principal",
    solidos: "Empieza con 1-2 cucharaditas, 1 vez al día. Puré liso o BLW (baby led weaning).",
    alimentos: ["Puré de zanahoria", "Puré de papa", "Puré de manzana o pera", "Plátano machacado", "Aguacate", "Cereales de arroz sin gluten"],
    evitar: ["Sal", "Azúcar", "Miel", "Leche de vaca como bebida", "Nueces", "Mariscos"],
  },
  {
    mesesMin: 7, mesesMax: 9, titulo: "7-9 meses — Proteínas y texturas",
    leche: "3-4 tomas de leche al día",
    solidos: "2-3 comidas al día. Texturas más gruesas, papilla con grumos finos.",
    alimentos: ["Pollo desmenuzado", "Res molida bien cocida", "Pescado blanco sin espinas", "Lentejas", "Frijoles molidos", "Yema de huevo cocida", "Brócoli suave", "Arroz suave"],
    evitar: ["Sal", "Azúcar", "Miel", "Clara de huevo (mayor riesgo alérgico)", "Mariscos"],
  },
  {
    mesesMin: 9, mesesMax: 12, titulo: "9-12 meses — Mesa familiar adaptada",
    leche: "2-3 tomas de leche al día",
    solidos: "3 comidas al día + 1 colación. Come casi igual que la familia, sin sazonar.",
    alimentos: ["Todo lo anterior", "Pasta suave", "Tortilla blanda", "Frijoles enteros", "Huevo revuelto", "Queso fresco", "Frutas en trozos pequeños"],
    evitar: ["Sal añadida", "Azúcar", "Miel", "Alimentos duros o redondos (riesgo de asfixia)"],
  },
  {
    mesesMin: 12, mesesMax: 18, titulo: "12-18 meses — Dieta familiar completa",
    leche: "Máx. 500 ml/día de leche entera de vaca (ya puede darse como bebida)",
    solidos: "3 comidas principales + 2 colaciones. Empieza a comer solo.",
    alimentos: ["Dieta familiar sin restricciones de textura", "Leche entera de vaca", "Yogur natural", "Huevo completo", "Todo tipo de carne", "Legumbres completas"],
    evitar: ["Miel (hasta los 12 meses cumplidos)", "Exceso de sal o azúcar añadida", "Bebidas azucaradas"],
  },
  {
    mesesMin: 18, mesesMax: 36, titulo: "18-24 meses — Autonomía total",
    leche: "Leche entera como parte de la dieta, no como sustituto de comidas",
    solidos: "Variedad total. Estimular autonomía para comer solo con cubiertos.",
    alimentos: ["Todo tipo de alimentos en variedad", "Verduras crudas y cocidas", "Frutas completas", "Legumbres", "Cereales integrales"],
    evitar: ["Exceso de azúcar y sal", "Ultraprocesados", "Bebidas azucaradas", "Jugos en exceso"],
  },
];

export function getRangoEstimulacion(meses: number): RangoEstimulacion | undefined {
  return ESTIMULACION.find(r => meses >= r.mesesMin && meses < r.mesesMax);
}

export function getRangoAlimentacion(meses: number): RangoAlimentacion | undefined {
  return ALIMENTACION.find(r => meses >= r.mesesMin && meses < r.mesesMax);
}

export function getActividadTexto(key: string): string {
  for (const rango of ESTIMULACION) {
    const act = rango.actividades.find(a => a.key === key);
    if (act) return act.texto;
  }
  return key;
}

export type RecomendacionPanal = {
  talla: string;
  nombre: string;
  pesoMin: number;
  pesoMax: number;
  mesesMin: number;
  mesesMax: number;
  nota: string;
};

export const PANALES: RecomendacionPanal[] = [
  { talla: "RN", nombre: "Recién Nacido", pesoMin: 0, pesoMax: 4, mesesMin: 0, mesesMax: 1, nota: "Para bebés de muy bajo peso al nacer o prematuros" },
  { talla: "1 (P)", nombre: "Pequeño", pesoMin: 2, pesoMax: 5.5, mesesMin: 0, mesesMax: 3, nota: "Etapa de recién nacido, cambiar cada 2-3 horas" },
  { talla: "2 (M)", nombre: "Mediano", pesoMin: 4, pesoMax: 8, mesesMin: 2, mesesMax: 6, nota: "Crecimiento acelerado, revisar ajuste en piernas y cintura" },
  { talla: "3 (G)", nombre: "Grande", pesoMin: 6, pesoMax: 11, mesesMin: 5, mesesMax: 12, nota: "Bebé más activo, buena elasticidad en cintura y piernas" },
  { talla: "4 (XG)", nombre: "Extra Grande", pesoMin: 9, pesoMax: 14, mesesMin: 10, mesesMax: 24, nota: "Inicio de gateo y primeros pasos, preferir ajuste flexible" },
  { talla: "5 (XXG)", nombre: "Extra Extra Grande", pesoMin: 12, pesoMax: 18, mesesMin: 18, mesesMax: 36, nota: "Niños muy activos, ideal para inicio de entrenamiento de baño" },
  { talla: "6", nombre: "Talla 6", pesoMin: 16, pesoMax: 999, mesesMin: 30, mesesMax: 999, nota: "Etapa final antes del control de esfínteres" },
];

export function getRecomendacionPanal(meses: number, pesoKg: number | null): RecomendacionPanal | undefined {
  if (pesoKg) {
    // Prefer sizes where the baby is below 90% of the max weight (has comfortable room to grow)
    const comodo = PANALES.filter(p => pesoKg >= p.pesoMin && pesoKg < p.pesoMax * 0.9);
    const candidatos = comodo.length > 0 ? comodo : PANALES.filter(p => pesoKg >= p.pesoMin && pesoKg <= p.pesoMax);
    if (candidatos.length === 1) return candidatos[0];
    if (candidatos.length > 1) {
      return candidatos.find(p => meses >= p.mesesMin && meses < p.mesesMax) ?? candidatos[candidatos.length - 1];
    }
  }
  return PANALES.find(p => meses >= p.mesesMin && meses < p.mesesMax);
}
