/* =========================================================================
   LAHUD — CATÁLOGO
   Fonte: catálogo "Old But Gold" (PDF de 28/06/2026) e posts do Instagram.
   Cada peça Old But Gold é ÚNICA: quando vender, marque  vendida: true
   ------------------------------------------------------------------------
   Campos:
     id, nome, colecao, categoria, ouro ("amarelo" | "branco"), peso (g),
     detalhes (lista de linhas da ficha), preco, mercado (valor de referência
     no mercado; null = "sem equivalente no mercado"), fotos (1ª = vitrine),
     vendida (true/false), destaque (aparece na home)
   ========================================================================= */
window.CATEGORIAS = [
  { slug: "aneis",     nome: "Anéis",     capa: "assets/img/joias/anel-chuveiro.jpg" },
  { slug: "correntes", nome: "Correntes", capa: "assets/img/joias/corrente-corda.jpg" },
  { slug: "brincos",   nome: "Brincos",   capa: "assets/img/joias/brincos-modelo.jpg" },
  { slug: "pulseiras", nome: "Pulseiras", capa: "assets/img/joias/bracelete.jpg" }
];

window.COLECOES = {
  "old-but-gold": {
    nome: "Old But Gold",
    titulo: "old but <em>gold</em>",
    chamada: "Joias que fizeram parte de uma história e agora estão prontas para participar da sua.",
    texto: [
      "Para a LAHUD, todas as joias têm significado. Carregam memórias, encontros e sentimentos.",
      "Old But Gold reúne peças únicas em ouro 18k, selecionadas por sua essência, beleza e permanência. Porque algumas joias foram feitas para atravessar o tempo."
    ],
    homenagem: "Uma homenagem a Tokiko Izo.",
    capa: "assets/img/joias/colar-modelo-2.jpg",
    capa2: "assets/img/joias/anel-mina-modelo.jpg"
  },
  "maria-e-luzia": {
    nome: "Maria & Luzia",
    titulo: "Maria <em>&amp;</em> Luzia",
    chamada: "Joias que carregam os nomes de Maria e José, bisavós da nossa fundadora, e de seus filhos e filhas.",
    texto: [
      "O design das peças surge dos azulejos originais da casa que eles mesmos ergueram. Linhas, relevos e assimetrias que, por décadas, guardaram silêncio e agora renascem como arte, afeto e permanência.",
      "Uma coleção que celebra a força, a beleza e a poesia das histórias que nos antecedem."
    ]
  }
};

const F = n => "assets/img/joias/" + n + ".jpg";

window.PRODUTOS = [
  // ------------------------------ ANÉIS ------------------------------
  { id: "anel-chuveiro", nome: "Anel Chuveiro", colecao: "old-but-gold", categoria: "aneis", ouro: "branco", peso: 3.7,
    detalhes: ["Ouro branco 18k · 3,7 g", "13 diamantes: 1 de 12 pt e 12 de 2 pt", "Aro 19"],
    preco: 6980, mercado: 9490, fotos: [F("anel-chuveiro")], destaque: true },
  { id: "anel-solitario", nome: "Anel Solitário", colecao: "old-but-gold", categoria: "aneis", ouro: "amarelo", peso: 1.36,
    detalhes: ["Ouro amarelo 18k · 1,36 g", "1 diamante de 6 pt", "Aro 18"],
    preco: 1950, mercado: 3510, fotos: [F("anel-solitario")], destaque: true },
  { id: "aparador", nome: "Aparador", colecao: "old-but-gold", categoria: "aneis", ouro: "branco", peso: 4.21,
    detalhes: ["Ouro branco 18k · 4,21 g", "8 diamantes de 6 pt", "Aro 20"],
    preco: 8050, mercado: 15453, fotos: [F("aparador")] },
  { id: "anel-mina", nome: "Anel Mina", colecao: "old-but-gold", categoria: "aneis", ouro: "amarelo", peso: 3.7,
    detalhes: ["Ouro amarelo 18k · 3,7 g", "Pedras naturais: ametista, granada, topázio, peridoto, citrino, rubelita e turmalina", "Aro 19"],
    preco: 5880, mercado: null, fotos: [F("anel-mina"), F("anel-mina-modelo")], destaque: true },
  { id: "anel-solitario-ii", nome: "Anel Solitário II", colecao: "old-but-gold", categoria: "aneis", ouro: "branco", peso: 1.81,
    detalhes: ["Ouro branco 18k · 1,81 g", "1 diamante de 25 pt", "Aro 20"],
    preco: 5250, mercado: 10771, fotos: [F("anel-solitario-ii")] },

  // ---------------------------- CORRENTES ----------------------------
  { id: "corrente-elo-portugues", nome: "Corrente Elo Português", colecao: "old-but-gold", categoria: "correntes", ouro: "amarelo", peso: 1.85,
    detalhes: ["Ouro amarelo 18k · 1,85 g", "Comprimento 40 cm"],
    preco: 1900, mercado: 3840, fotos: [F("corrente-elo-portugues"), F("colar-modelo")] },
  { id: "corrente-cartier", nome: "Corrente Cartier", colecao: "old-but-gold", categoria: "correntes", ouro: "amarelo", peso: 13,
    detalhes: ["Ouro amarelo 18k maciço · 13 g", "Comprimento 60 cm", "Nunca usada"],
    preco: 24000, mercado: 38115, fotos: [F("corrente-cartier")], destaque: true },
  { id: "corrente-veneziana-branca", nome: "Corrente Veneziana", variante: "Ouro branco", colecao: "old-but-gold", categoria: "correntes", ouro: "branco", peso: 3.9,
    detalhes: ["Ouro branco 18k · 3,9 g", "Comprimento 45 cm"],
    preco: 3700, mercado: 5210, fotos: [F("corrente-veneziana-branca")] },
  { id: "corrente-veneziana-amarela", nome: "Corrente Veneziana", variante: "Ouro amarelo", colecao: "old-but-gold", categoria: "correntes", ouro: "amarelo", peso: 2.84,
    detalhes: ["Ouro amarelo 18k · 2,84 g", "Comprimento 45 cm"],
    preco: 2950, mercado: 4760, fotos: [F("corrente-veneziana-amarela"), F("colar-modelo-2")] },
  { id: "corrente-trancada", nome: "Corrente Trançada", colecao: "old-but-gold", categoria: "correntes", ouro: "amarelo", peso: 5,
    detalhes: ["Ouro amarelo 18k · 5 g", "Comprimento 45 cm"],
    preco: 6000, mercado: 8200, fotos: [F("corrente-trancada")] },
  { id: "corrente-corda", nome: "Corrente Corda", colecao: "old-but-gold", categoria: "correntes", ouro: "amarelo", peso: 13.9,
    detalhes: ["Ouro amarelo 18k · 13,9 g", "Comprimento 70 cm"],
    preco: 22900, mercado: 40870, fotos: [F("corrente-corda")], destaque: true },
  { id: "corrente-singapura", nome: "Corrente Singapura", colecao: "old-but-gold", categoria: "correntes", ouro: "amarelo", peso: 2.42,
    detalhes: ["Ouro amarelo 18k · 2,42 g", "Comprimento 60 cm"],
    preco: 2770, mercado: 4250, fotos: [F("corrente-singapura")] },

  // ----------------------------- BRINCOS -----------------------------
  { id: "brinco-solitario", nome: "Brinco Solitário", colecao: "old-but-gold", categoria: "brincos", ouro: "amarelo", peso: 0.75,
    detalhes: ["Ouro amarelo 18k · 0,75 g", "2 diamantes de 5 pt"],
    preco: 1670, mercado: 2572, fotos: [F("brinco-solitario"), F("brincos-modelo")], destaque: true },
  { id: "argola-sextavada", nome: "Argola Sextavada", colecao: "old-but-gold", categoria: "brincos", ouro: "amarelo", peso: 1.23,
    detalhes: ["Ouro amarelo 18k · 1,23 g", "Medida 2 cm × 1,5 cm"],
    preco: 1550, mercado: 2552, fotos: [F("argola-sextavada")] },

  // ---------------------------- PULSEIRAS ----------------------------
  { id: "bracelete", nome: "Bracelete", colecao: "old-but-gold", categoria: "pulseiras", ouro: "amarelo", peso: 54.9,
    detalhes: ["Ouro amarelo 18k · 54,9 g", "Comprimento 18,5 cm"],
    preco: 65000, mercado: null, fotos: [F("bracelete"), F("bracelete-modelo")], destaque: true },
  { id: "bracelete-ii", nome: "Bracelete II", colecao: "old-but-gold", categoria: "pulseiras", ouro: "branco", peso: 7.04,
    detalhes: ["Ouro branco 18k · 7,04 g", "Comprimento 20 cm"],
    preco: 8880, mercado: null, fotos: [F("bracelete-ii")] }
];
