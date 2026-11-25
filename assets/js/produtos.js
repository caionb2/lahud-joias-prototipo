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
  { slug: "colares",   nome: "Colares",   capa: "assets/img/joias/ml-colar-laura-modelo.jpg" },
  { slug: "correntes", nome: "Correntes", capa: "assets/img/joias/corrente-corda.jpg" },
  { slug: "brincos",   nome: "Brincos",   capa: "assets/img/joias/ml-argola-judite.jpg" },
  { slug: "pulseiras", nome: "Pulseiras", capa: "assets/img/joias/ml-pulseira-paulo.jpg" }
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
    ],
    capa: "assets/img/joias/ml-capa.jpg",
    capa2: "assets/img/joias/ml-capa-2.jpg",
    galeria: ["assets/img/joias/ml-argola-judite-modelo.jpg", "assets/img/joias/ml-capa-4.jpg", "assets/img/joias/ml-colar-laura-modelo.jpg"]
  }
};

const F = n => "assets/img/joias/" + n + ".jpg";

/* Maria & Luzia (catálogo 10/2026): peças feitas à mão, sob encomenda.
   Preço por acabamento (com brilhantes ou liso) e por tamanho.
   O catálogo mostra parcelas de 10x; aqui está o valor total (10 × parcela).
   Formato:  precos: { "Acabamento": { "Tamanho": valor } }   (tamanho "" = único) */
const ML = (id, tipo, nome, categoria, detalhes, precos, fotos, extra) => Object.assign({
  id: "ml-" + id, tipo, nome: tipo.charAt(0).toUpperCase() + tipo.slice(1) + " " + nome, nomeCurto: nome,
  colecao: "maria-e-luzia", categoria, ouro: "amarelo", detalhes, precos,
  preco: Math.min(...Object.values(precos).flatMap(t => Object.values(t))),
  fotos: fotos.map(F), encomenda: true
}, extra || {});

window.PRODUTOS_ML = [
  ML("brinco-maria", "brinco", "Maria", "brincos",
    ["Ouro amarelo 18k", "Com 2 brilhantes ou liso", "Tamanhos PP, P, M e G"],
    { "Com 2 brilhantes": { PP: 1770, P: 2860, M: 4210, G: 8750 }, "Liso": { PP: 1540, P: 2640, M: 3950, G: 8510 } },
    ["ml-brinco-maria", "ml-brinco-maria-modelo"], { destaque: true }),
  ML("anel-marina", "anel", "Marina", "aneis",
    ["Ouro amarelo 18k", "Com 19 brilhantes ou liso (a quantidade de pedras varia de acordo com o aro)"],
    { "Com brilhantes": { "Aro até 17": 6690, "Aro 18 ou maior": 7540 }, "Liso": { "Aro até 17": 4380, "Aro 18 ou maior": 5690 } },
    ["ml-anel-marina", "ml-anel-marina-modelo"], { destaque: true, aro: true }),
  ML("pulseira-paulo", "pulseira", "Paulo", "pulseiras",
    ["Ouro amarelo 18k", "Com 6 brilhantes ou lisa"],
    { "Com 6 brilhantes": { "": 6930 }, "Lisa": { "": 6250 } },
    ["ml-pulseira-paulo", "ml-pulseira-paulo-modelo"], { destaque: true }),
  ML("pulseira-jamil", "pulseira", "Jamil", "pulseiras",
    ["Ouro amarelo 18k", "Com 1 brilhante ou lisa", "Tamanhos P e M"],
    { "Com 1 brilhante": { P: 2360, M: 2980 }, "Lisa": { P: 2220, M: 2860 } },
    ["ml-pulseira-jamil", "ml-pulseira-jamil-modelo"]),
  ML("colar-laura", "colar", "Laura", "colares",
    ["Ouro amarelo 18k", "Com 3 brilhantes ou liso"],
    { "Com 3 brilhantes": { "": 10830 }, "Liso": { "": 9960 } },
    ["ml-colar-laura", "ml-colar-laura-modelo"], { destaque: true }),
  ML("ear-cuff-laura", "ear cuff", "Laura", "brincos",
    ["Ouro amarelo 18k", "Com 6 brilhantes ou liso"],
    { "Com 6 brilhantes": { "": 7580 }, "Liso": { "": 6990 } },
    ["ml-ear-cuff-laura", "ml-ear-cuff-laura-modelo"]),
  ML("colar-luzia", "colar", "Luzia", "colares",
    ["Ouro amarelo 18k", "Com 1 brilhante ou liso", "Tamanhos M e G"],
    { "Com 1 brilhante": { M: 5120, G: 9150 }, "Liso": { M: 4740, G: 9020 } },
    ["ml-colar-luzia", "ml-colar-luzia-modelo"], { destaque: true }),
  ML("argola-judite", "argola", "Judite", "brincos",
    ["Ouro amarelo 18k", "Com 24 brilhantes ou lisa", "Tamanhos P e M"],
    { "Com 24 brilhantes": { P: 9450, M: 10300 }, "Lisa": { P: 6410, M: 6870 } },
    ["ml-argola-judite", "ml-argola-judite-modelo"], { destaque: true }),
  ML("argola-amelia", "argola", "Amélia", "brincos",
    ["Ouro amarelo 18k", "Com 2 brilhantes ou lisa", "Tamanhos PP e M"],
    { "Com 2 brilhantes": { PP: 4960, M: 7810 }, "Lisa": { PP: 4720, M: 7570 } },
    ["ml-argola-amelia", "ml-argola-amelia-modelo"]),
  ML("pingente-joao", "pingente", "João", "colares",
    ["Ouro amarelo 18k", "Com 1 brilhante ou liso", "Tamanhos M e G"],
    { "Com 1 brilhante": { M: 2430, G: 4450 }, "Liso": { M: 2290, G: 4320 } },
    ["ml-pingente-joao", "ml-pingente-joao-modelo"]),
  ML("anel-jose", "anel", "José", "aneis",
    ["Ouro amarelo 18k", "Com 1 brilhante ou liso"],
    { "Com 1 brilhante": { "": 5980 }, "Liso": { "": 5370 } },
    ["ml-anel-jose", "ml-anel-jose-modelo"], { aro: true })
];

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

// Vitrine completa: Maria & Luzia primeiro (coleção mais recente), depois Old But Gold
window.PRODUTOS = window.PRODUTOS_ML.concat(window.PRODUTOS);
