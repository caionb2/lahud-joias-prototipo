/* =========================================================================
   LAHUD — funcionamento do site (não precisa mexer para mudar produtos)
   Roteamento por hash (#/...), sacola e lista de desejos no navegador,
   pedido finalizado pelo WhatsApp.
   ========================================================================= */
(function () {
  "use strict";

  const L = window.LOJA, P = window.PRODUTOS, CATS = window.CATEGORIAS, COLS = window.COLECOES;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#conteudo");

  // --------------------------------------------------------------- util
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const brl0 = v => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const parcela = v => `ou ${L.parcelas}x de ${brl(v / L.parcelas)} sem juros`;
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const porId = id => P.find(p => p.id === id);
  const catNome = slug => (CATS.find(c => c.slug === slug) || {}).nome || "";
  const nomeCompleto = p => p.nome + (p.variante ? " · " + p.variante : "");
  const wa = texto => `https://wa.me/${L.whatsapp}?text=${encodeURIComponent(texto)}`;

  // Nome no estilo do catálogo: tipo em itálico + nome ("anel Marina")
  const TIPOS = ["anel", "corrente", "brinco", "argola", "bracelete", "pulseira", "colar", "pingente", "ear cuff"];
  function nomeHtml(p) {
    if (p.tipo) return `<em>${esc(p.tipo)}</em> ${esc(p.nomeCurto)}`;
    const w = p.nome.split(" ");
    const t = w[0].toLowerCase();
    return (w.length > 1 && TIPOS.includes(t)) ? `<em>${esc(t)}</em> ${esc(w.slice(1).join(" "))}` : esc(p.nome);
  }

  // Sacola: cada item é "id" (peça única) ou "id|acabamento|tamanho|aro" (Maria & Luzia)
  const chave = (id, v) => v ? [id, v.acab, v.tam || "", v.aro || ""].join("|") : id;
  function itemDaChave(k) {
    const [id, acab, tam, aro] = k.split("|");
    const p = porId(id);
    if (!p) return null;
    if (!p.precos) return { k, p, preco: p.preco, desc: p.detalhes[0] };
    const preco = ((p.precos[acab] || {})[tam || ""]);
    if (preco == null) return null;
    const desc = ["Ouro 18k", acab, tam && !p.aro ? "tamanho " + tam : "", aro ? "aro " + aro : ""].filter(Boolean).join(" · ");
    return { k, p, preco, desc, acab, tam, aro };
  }

  const ESTRELA = `<svg class="estrela" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 21.2 18.8 38 20 21.2 21.2 20 38 18.8 21.2 2 20 18.8 18.8Z" fill="currentColor"/><path d="m20 20 7-7M20 20l-7 7M20 20l7 7M20 20l-7-7" stroke="currentColor" stroke-width=".6"/></svg>`;
  const CORACAO = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;

  const armazenamento = {
    ler(k, padrao) { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } },
    gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } }
  };
  let sacola = armazenamento.ler("lahud_sacola", []).filter(k => itemDaChave(k));
  let favoritos = armazenamento.ler("lahud_desejos", []).filter(id => porId(id));
  let embrulho = armazenamento.ler("lahud_presente", { ativo: false, mensagem: "" });

  // --------------------------------------------------------------- estado
  function salvar() {
    armazenamento.gravar("lahud_sacola", sacola);
    armazenamento.gravar("lahud_desejos", favoritos);
    armazenamento.gravar("lahud_presente", embrulho);
    badges();
  }
  function badges() {
    const b1 = $("#badgeSacola"), b2 = $("#badgeFav");
    b1.textContent = sacola.length; b1.hidden = !sacola.length;
    b2.textContent = favoritos.length; b2.hidden = !favoritos.length;
  }
  function adicionar(k) {
    const it = itemDaChave(k);
    if (!it || it.p.vendida) return;
    if (!sacola.includes(k)) sacola.push(k);
    salvar(); renderSacola(); abrirSacola();
  }
  function remover(k) { sacola = sacola.filter(x => x !== k); salvar(); renderSacola(); }
  function alternarDesejo(id) {
    const tinha = favoritos.includes(id);
    favoritos = tinha ? favoritos.filter(x => x !== id) : [...favoritos, id];
    salvar();
    $$(`[data-fav="${id}"]`).forEach(b => b.setAttribute("aria-pressed", String(!tinha)));
    aviso(tinha ? "Removida da lista de desejos" : "Adicionada à lista de desejos", tinha ? null : ["Ver lista", "#/favoritos"]);
    if (location.hash === "#/favoritos") roteador();
  }

  let tAviso;
  function aviso(msg, acao) {
    const t = $("#toast");
    t.innerHTML = esc(msg) + (acao ? ` <a href="${acao[1]}">${esc(acao[0])}</a>` : "");
    t.classList.add("on");
    clearTimeout(tAviso); tAviso = setTimeout(() => t.classList.remove("on"), 3200);
  }

  // --------------------------------------------------------------- componentes
  function card(p) {
    const fav = favoritos.includes(p.id);
    const imgs = p.fotos.slice(0, 2).map((f, i) => `<img src="${f}" alt="${i ? "" : esc(nomeCompleto(p))}" loading="lazy" width="600" height="780">`).join("");
    return `
      <article class="card${p.vendida ? " vendida" : ""}">
        <a href="#/joia/${p.id}" class="card__link">
          <div class="card__img">
            ${imgs}
            <span class="card__selo">${p.vendida ? "Vendida" : (p.colecao === "old-but-gold" ? "Peça única" : "Maria &amp; Luzia")}</span>
          </div>
          <div class="card__info">
            <h3 class="card__nome">${nomeHtml(p)}</h3>
            <div class="card__meta">${p.precos ? "Ouro 18k · com brilhantes ou liso" : `Ouro ${p.ouro} 18k · ${String(p.peso).replace(".", ",")} g`}</div>
            <div class="card__preco">${p.vendida ? "Indisponível" : (p.precos ? "a partir de " : "") + brl(p.preco)}</div>
          </div>
        </a>
        <button class="card__fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Lista de desejos: ${esc(nomeCompleto(p))}">${CORACAO}</button>
      </article>`;
  }

  function trilho(lista, id) {
    return `
      <div class="trilho-wrap">
        <div class="trilho" id="${id}">${lista.map(card).join("")}</div>
        <div class="trilho__ctrl">
          <div class="trilho__barra"><span></span></div>
          <div class="trilho__setas">
            <button class="seta" data-trilho="${id}" data-dir="-1" aria-label="Anterior"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
            <button class="seta" data-trilho="${id}" data-dir="1" aria-label="Próxima"><svg width="18" height="18" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
          </div>
        </div>
      </div>`;
  }
  function ativarTrilhos() {
    $$(".trilho").forEach(t => {
      const barra = t.parentElement.querySelector(".trilho__barra span");
      const upd = () => {
        const vis = t.clientWidth / t.scrollWidth;
        barra.style.width = (vis * 100) + "%";
        barra.style.left = (t.scrollLeft / t.scrollWidth * 100) + "%";
      };
      t.addEventListener("scroll", upd, { passive: true }); upd();
    });
  }

  // Padrão inspirado nos azulejos da casa de Maria e José (coleção Maria & Luzia)
  function azulejo() {
    const tile = `
      <g fill="none" stroke="currentColor" stroke-width=".7">
        <rect x="1" y="1" width="58" height="58"/>
        <path d="M30 4c6 10 16 16 26 26-10 10-20 16-26 26-6-10-16-16-26-26C14 20 24 14 30 4Z"/>
        <circle cx="30" cy="30" r="7"/>
        <path d="M1 1c10 2 16 8 18 18M59 1c-10 2-16 8-18 18M1 59c10-2 16-8 18-18M59 59c-10-2-16-8-18-18"/>
      </g>`;
    let g = "";
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g += `<g transform="translate(${x * 60} ${y * 60})">${tile}</g>`;
    return `<svg viewBox="0 0 240 240" class="azulejo" aria-hidden="true">${g}</svg>`;
  }

  // --------------------------------------------------------------- páginas
  function paginaInicial() {
    const col = COLS["old-but-gold"];
    const ml = COLS["maria-e-luzia"];
    const destaques = P.filter(p => p.destaque && !p.vendida && p.colecao === "old-but-gold");
    const destaquesML = P.filter(p => p.colecao === "maria-e-luzia");
    main.innerHTML = `
      <section class="hero" data-hero>
        <div class="hero__img"><picture><source media="(max-width: 820px)" srcset="${ml.capa}"><img src="assets/img/joias/ml-hero.jpg" alt="Modelo usando anéis, pulseiras e colar da coleção Maria & Luzia em ouro 18k" fetchpriority="high"></picture></div>
        <div class="hero__conteudo hero__entra">
          <p class="eyebrow">Nova coleção · Maria &amp; Luzia · ouro 18k</p>
          <h1>Joias que contam <em>histórias</em></h1>
          <p>Peças feitas à mão para carregar memórias, encontros e sentimentos, e para atravessar o tempo com você.</p>
          <div class="hero__acoes">
            <a href="#/colecao/maria-e-luzia" class="btn btn--branco">Descobrir Maria &amp; Luzia</a>
            <a href="#/colecao/old-but-gold" class="btn btn--contorno-branco">Old But Gold</a>
          </div>
        </div>
        <span class="hero__rolar" aria-hidden="true"></span>
      </section>

      <section class="secao">
        <div class="wrap manifesto revela">
          ${ESTRELA}
          <p>Para a LAHUD, toda joia tem significado. Cada peça nasce em ouro 18k, em pequenas séries, para ser <em>herdada</em>, não substituída.</p>
          <div class="assinatura">Por Verônica e Luzia</div>
        </div>
      </section>

      ${blocoMariaLuzia(true)}

      <section class="secao">
        <div class="wrap">
          <div class="secao__topo revela">
            <p class="eyebrow eyebrow--ouro">Feitas à mão · sob encomenda</p>
            <h2>Maria <em>&amp;</em> Luzia</h2>
            <p>Brincos, anéis, colares e pulseiras com os nomes da família, com brilhantes ou lisos.</p>
          </div>
          ${trilho(destaquesML, "trilhoML")}
        </div>
      </section>

      <section class="split escuro">
        <div class="split__img"><img src="${col.capa2}" alt="Anel Mina em ouro amarelo 18k com pedras naturais" loading="lazy"></div>
        <div class="split__texto revela">
          <p class="eyebrow">Coleção · peças únicas</p>
          <h2>${col.titulo}</h2>
          <p>${esc(col.chamada)}</p>
          <p>Anéis, correntes, brincos e braceletes em ouro 18k, selecionados um a um. Cada joia é única e não terá reposição.</p>
          <a href="#/colecao/old-but-gold" class="btn btn--branco">Ver as ${P.filter(p => p.colecao === "old-but-gold").length} peças</a>
        </div>
      </section>

      <section class="secao">
        <div class="wrap">
          <div class="secao__topo revela">
            <p class="eyebrow eyebrow--ouro">Sem reposição</p>
            <h2>Peças <em>únicas</em></h2>
            <p>Quando uma joia Old But Gold encontra sua nova história, ela sai da vitrine para sempre.</p>
          </div>
          ${trilho(destaques, "trilhoDestaques")}
        </div>
      </section>

      <section class="secao secao--pedra">
        <div class="wrap">
          <div class="secao__topo revela">
            <p class="eyebrow">Explore</p>
            <h2>Por categoria</h2>
          </div>
          <div class="categorias revela">
            ${CATS.map(c => `<a class="categoria" href="#/joias/${c.slug}"><img src="${c.capa}" alt="" loading="lazy"><span>${c.nome}<small>${P.filter(p => p.categoria === c.slug).length} peças</small></span></a>`).join("")}
          </div>
        </div>
      </section>

      <section class="citacao">
        <img src="assets/img/joias/brincos-modelo.jpg" alt="" loading="lazy">
        <div class="citacao__txt revela">
          ${ESTRELA}
          <p>“Algumas joias foram feitas para <em>atravessar o tempo</em>.”</p>
          <a href="#/historia" class="btn btn--contorno-branco">Conheça a LAHUD</a>
        </div>
      </section>

      <section class="secao" style="padding-block: clamp(60px, 7vw, 100px)">
        <div class="wrap valores revela">
          <div><strong>18k</strong><span>Ouro em todas as peças</span></div>
          <div><strong>${L.parcelas}x</strong><span>Sem juros</span></div>
          <div><strong>Autoral</strong><span>Design de ${esc(L.designer)}</span></div>
          <div><strong>Grátis</strong><span>Frete para todo o Brasil</span></div>
        </div>
      </section>

      ${blocoClientes()}

      <section class="secao secao--pedra">
        <div class="wrap">
          <div class="secao__topo revela">
            <p class="eyebrow">A experiência LAHUD</p>
            <h2>Feita para <em>você</em></h2>
          </div>
          ${blocoServicos()}
        </div>
      </section>`;
    ativarTrilhos();
  }

  function blocoMariaLuzia(curto) {
    const c = COLS["maria-e-luzia"];
    const msg = "Olá! Gostaria de receber o catálogo da coleção Maria & Luzia.";
    return `
      <section class="split split--inverso">
        <div class="split__img split__img--azulejo">${azulejo()}</div>
        <div class="split__texto revela">
          <p class="eyebrow eyebrow--ouro">Coleção autoral</p>
          <h2>${c.titulo}</h2>
          <p>${esc(c.chamada)}</p>
          ${(curto ? c.texto.slice(0, 1) : c.texto).map(t => `<p>${esc(t)}</p>`).join("")}
          ${curto
            ? `<a href="#/colecao/maria-e-luzia" class="btn">Ver a coleção</a>`
            : `<a href="${wa(msg)}" target="_blank" rel="noopener" class="btn">Receber o catálogo em PDF</a>`}
        </div>
      </section>`;
  }

  // Depoimentos reais (destaque "Clientes" do Instagram)
  function blocoClientes() {
    const d = [
      ["Encomenda mais que especial. A designer e ourives mais perfeita do mundo! Obrigada por entregar carinho em forma de joia.", "Manu"],
      ["Tão feliz com a minha primeira LAHUD.", "Eria"],
      ["Minhas encomendas ficaram prontas. Que capricho!", "Juliana"]
    ];
    return `
      <section class="secao secao--escura">
        <div class="wrap">
          <div class="secao__topo revela"><p class="eyebrow">Clientes</p><h2>Carinho em forma de <em>joia</em></h2>
            <p>Cada LAHUD chega na nossa embalagem, com cartão escrito à mão.</p></div>
          <div class="depoimentos revela">${d.map(([t, n]) => `<figure>${ESTRELA}<blockquote>“${t}”</blockquote><figcaption>${n}</figcaption></figure>`).join("")}</div>
        </div>
      </section>`;
  }

  function blocoServicos() {
    const itens = [
      ["Minha LAHUD", "Você traz a ideia, a história e a inspiração. Nós transformamos esse sentimento em uma joia única.", "#/personalizacao", "Como funciona"],
      ["Facilidades", `${L.parcelas}x sem juros no cartão, ${L.descontoPix}% OFF no Pix, frete grátis para todo o Brasil e troca fácil.`, "#/atendimento", "Ver facilidades"],
      ["Cuidados", "Como usar e guardar suas joias para que as marcas do tempo contem só a sua história.", "#/cuidados", "Ver cuidados"],
      ["Suporte vitalício", "Manutenção sempre disponível e atendimento exclusivo com nossas especialistas.", wa("Olá! Preciso de ajuda com a manutenção de uma joia LAHUD."), "Falar com a gente"]
    ];
    return `<div class="servicos revela">${itens.map(([t, d, href, cta]) => `
      <div class="servico">${ESTRELA}<h3>${t}</h3><p>${d}</p>
        <a class="link" href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${cta}</a></div>`).join("")}</div>`;
  }

  function paginaColecao(slug) {
    const c = COLS[slug];
    if (!c) return pagina404();
    if (slug === "maria-e-luzia") {
      main.innerHTML = `
        <section class="col-hero" data-hero>
          <img src="${c.capa2}" alt="" fetchpriority="high">
          <div class="col-hero__txt hero__entra">
            <p class="eyebrow" style="color:rgba(247,244,239,.85)">Coleção autoral · por Verônica e Luzia</p>
            <h1>${c.titulo}</h1>
            <p>${esc(c.chamada)}</p>
          </div>
        </section>
        ${blocoMariaLuzia(false)}
        <div class="col-intro">${c.galeria.map(f => `<img src="${f}" alt="" loading="lazy">`).join("")}</div>
        <section class="secao" style="padding-bottom:30px">
          <div class="wrap manifesto revela">
            ${ESTRELA}
            <p>Cada peça é feita à mão, sob encomenda, em ouro 18k. Escolha <em>com brilhantes</em> ou lisa, e o tamanho.</p>
            <div class="assinatura">Produção em até 20 dias úteis · frete grátis para todo o Brasil</div>
          </div>
        </section>
        <div class="wrap" id="listaColecao"></div>`;
      lista($("#listaColecao"), P.filter(p => p.colecao === slug), { categorias: true, semOuro: true });
      return;
    }
    main.innerHTML = `
      <section class="col-hero" data-hero>
        <img src="${c.capa}" alt="" fetchpriority="high">
        <div class="col-hero__txt hero__entra">
          <p class="eyebrow" style="color:rgba(247,244,239,.8)">Coleção · peças únicas em ouro 18k</p>
          <h1>${c.titulo}</h1>
          <p>${esc(c.chamada)}</p>
        </div>
      </section>
      <section class="secao" style="padding-bottom:60px">
        <div class="wrap manifesto revela">
          ${ESTRELA}
          ${c.texto.map(t => `<p style="font-size:clamp(24px,2.6vw,36px)">${esc(t)}</p>`).join("")}
          ${c.homenagem ? `<div class="assinatura">${esc(c.homenagem)}</div>` : ""}
        </div>
      </section>
      <div class="wrap" id="listaColecao"></div>`;
    lista($("#listaColecao"), P.filter(p => p.colecao === slug), { categorias: true });
  }

  function paginaJoias(cat) {
    if (cat && !CATS.some(c => c.slug === cat)) return pagina404();
    main.innerHTML = `
      <section class="pagina-topo wrap">
        <p class="eyebrow">Ouro 18k</p>
        <h1>${cat ? catNome(cat) : "Todas as joias"}</h1>
        <p>Coleções Maria &amp; Luzia (feitas à mão, sob encomenda) e Old But Gold (peças únicas, sem reposição).</p>
      </section>
      <div class="wrap" id="listaJoias"></div>`;
    lista($("#listaJoias"), P, { categorias: true, catInicial: cat });
  }

  function lista(alvo, base, op = {}) {
    const estado = { cat: op.catInicial || "", ouro: "", ordem: "destaque" };
    alvo.innerHTML = `
      <div class="filtros">
        <div class="chips" role="group" aria-label="Filtros">
          ${op.categorias ? `<button class="chip" data-cat="">Todas</button>${CATS.filter(c => base.some(p => p.categoria === c.slug)).map(c => `<button class="chip" data-cat="${c.slug}">${c.nome}</button>`).join("")}` : ""}
          ${op.semOuro ? "" : `<button class="chip" data-ouro="amarelo">Ouro amarelo</button>
          <button class="chip" data-ouro="branco">Ouro branco</button>`}
        </div>
        <label class="ordenar">Ordenar
          <select id="ordem">
            <option value="destaque">Destaques</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
            ${op.semOuro ? "" : `<option value="peso">Maior peso em ouro</option>`}
          </select>
        </label>
      </div>
      <p class="contagem" id="contagem"></p>
      <div class="grade" id="grade"></div>
      <div style="height:120px"></div>`;
    function aplicar() {
      let l = base.filter(p => (!estado.cat || p.categoria === estado.cat) && (!estado.ouro || p.ouro === estado.ouro));
      if (estado.ordem === "menor") l = [...l].sort((a, b) => a.preco - b.preco);
      if (estado.ordem === "maior") l = [...l].sort((a, b) => b.preco - a.preco);
      if (estado.ordem === "peso") l = [...l].sort((a, b) => (b.peso || 0) - (a.peso || 0));
      if (estado.ordem === "destaque") l = [...l].sort((a, b) => ((a.vendida ? 1 : 0) - (b.vendida ? 1 : 0)) || ((b.destaque ? 1 : 0) - (a.destaque ? 1 : 0)));
      $("#grade", alvo).innerHTML = l.length ? l.map(card).join("") : `<div class="vazio" style="grid-column:1/-1">Nenhuma peça com esses filtros.</div>`;
      $("#contagem", alvo).textContent = `${l.length} ${l.length === 1 ? "peça" : "peças"}`;
      $$("[data-cat]", alvo).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cat === estado.cat)));
      $$("[data-ouro]", alvo).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ouro === estado.ouro)));
    }
    alvo.addEventListener("click", e => {
      const c = e.target.closest("[data-cat]"), o = e.target.closest("[data-ouro]");
      if (c) { estado.cat = c.dataset.cat; aplicar(); }
      if (o) { estado.ouro = estado.ouro === o.dataset.ouro ? "" : o.dataset.ouro; aplicar(); }
    });
    $("#ordem", alvo).addEventListener("change", e => { estado.ordem = e.target.value; aplicar(); });
    aplicar();
  }

  function paginaProduto(id) {
    const p = porId(id);
    if (!p) return pagina404();
    document.title = `${nomeCompleto(p)} · Ouro ${p.ouro} 18k | LAHUD`;
    const col = COLS[p.colecao];
    const fav = favoritos.includes(p.id);
    const enc = !!p.precos;   // Maria & Luzia: sob encomenda, com variações
    const acabs = enc ? Object.keys(p.precos) : [];
    const tams = enc ? Object.keys(p.precos[acabs[0]]).filter(Boolean) : [];
    const sel = { acab: acabs[0], tam: tams[0] || "", aro: "" };
    const naSacola = !enc && sacola.includes(p.id);
    const economia = p.mercado ? Math.round((1 - p.preco / p.mercado) * 100) : 0;
    const msgReserva = `Olá! Tenho interesse na peça *${nomeCompleto(p)}* (${col.nome}), ouro ${p.ouro} 18k, ${brl(p.preco)}. Ela ainda está disponível?`;
    const relacionados = P.filter(x => x.id !== p.id && !x.vendida && x.colecao === p.colecao && x.categoria === p.categoria)
      .concat(P.filter(x => x.id !== p.id && !x.vendida && x.colecao === p.colecao && x.categoria !== p.categoria))
      .concat(P.filter(x => x.id !== p.id && !x.vendida && x.colecao !== p.colecao && x.destaque)).slice(0, 8);
    const aros = Array.from({ length: 19 }, (_, i) => 10 + i);
    const opcoesHtml = !enc ? "" : `
      <div class="opcoes">
        <div><div class="opcao__titulo">Acabamento</div>
          <div class="opcao__lista">${acabs.map(a => `<button class="opcao__btn" data-acab="${esc(a)}" aria-pressed="${a === sel.acab}">${esc(a)}</button>`).join("")}</div></div>
        ${tams.length && !p.aro ? `<div><div class="opcao__titulo">Tamanho</div>
          <div class="opcao__lista">${tams.map(t => `<button class="opcao__btn" data-tam="${esc(t)}" aria-pressed="${t === sel.tam}">${esc(t)}</button>`).join("")}</div></div>` : ""}
        ${p.aro ? `<div><label class="opcao__titulo" for="selAro"><span>Seu aro</span><a class="link" style="font-size:9.5px;padding-bottom:3px" target="_blank" rel="noopener" href="${wa("Olá! Como descubro o tamanho do meu aro?")}">Como medir</a></label>
          <select id="selAro"><option value="">Escolha o aro</option>${aros.map(a => `<option>${a}</option>`).join("")}</select></div>` : ""}
      </div>`;

    main.innerHTML = `
      <div class="wrap">
        <nav class="trilha" aria-label="Você está em">
          <a href="#/">Início</a><span>/</span><a href="#/colecao/${p.colecao}">${col.nome}</a><span>/</span><a href="#/joias/${p.categoria}">${catNome(p.categoria)}</a>
        </nav>
        <div class="produto">
          <div class="galeria${p.fotos.length > 1 ? " galeria--2" : ""}">
            ${p.fotos.map((f, i) => `<figure data-zoom="${f}"><img src="${f}" alt="${esc(nomeCompleto(p))}${i ? " em uso" : ""}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></figure>`).join("")}
          </div>
          <div class="produto__info">
            <p class="eyebrow">${col.nome} · ${catNome(p.categoria)}</p>
            <h1>${nomeHtml(p)}</h1>
            ${p.variante ? `<div class="produto__variante">${esc(p.variante)}</div>` : ""}
            <div class="produto__unica">${ESTRELA.replace('class="estrela"', 'class="estrela" style="width:14px;height:14px"')} ${p.vendida ? "Peça vendida" : enc ? "Feita à mão · sob encomenda" : "Peça única · sem reposição"}</div>

            <div class="produto__preco" id="precoAtual">${brl(p.preco)}</div>
            <div class="produto__parcela" id="parcelaAtual"></div>

            ${opcoesHtml}

            <div class="mercado">
              ${enc
                ? `<span>Produção em <strong>até 20 dias úteis</strong> após o pagamento</span><span class="economia">Frete grátis</span>`
                : p.mercado
                ? `<span>Referência de mercado <s>${brl0(p.mercado)}</s></span><span class="economia">${economia}% abaixo</span>`
                : `<span>Peça <strong>sem equivalente</strong> no mercado</span><span class="economia">Exclusiva</span>`}
            </div>

            ${p.vendida ? `<div class="vendida-aviso">Esta joia já encontrou sua nova história. Fale com a gente para conhecer peças semelhantes.</div>` : ""}

            <div class="produto__acoes">
              <div class="linha">
                <button class="btn" id="btnAdicionar" ${p.vendida ? "disabled" : ""}>${naSacola ? "Ver na sacola" : "Adicionar à sacola"}</button>
                <button class="btn-fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Lista de desejos">${CORACAO}</button>
              </div>
              <a class="btn btn--claro" id="btnWhats" target="_blank" rel="noopener" href="${wa(msgReserva)}">${p.vendida ? "Pedir peça semelhante" : enc ? "Encomendar pelo WhatsApp" : "Reservar pelo WhatsApp"}</a>
            </div>

            <div class="garantias">
              <div><svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3 4 7v6c0 4 3.4 7.4 8 8 4.6-.6 8-4 8-8V7l-8-4Z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>Ouro 18k</div>
              <div><svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M6.5 18.5a1.5 1.5 0 1 0 0-.01M17.5 18.5a1.5 1.5 0 1 0 0-.01" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>Frete grátis</div>
              <div><svg width="20" height="20" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5Z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>Suporte vitalício</div>
            </div>

            <div class="acordeao">
              <details open><summary>Detalhes da peça</summary><div class="conteudo"><ul>${p.detalhes.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div></details>
              <details><summary>Sobre a coleção</summary><div class="conteudo"><p>${esc(col.texto.join(" "))}</p></div></details>
              ${p.categoria === "aneis" ? `<details><summary>Tamanho do aro</summary><div class="conteudo"><p>${enc ? "Cada anel é feito no seu aro." : "O aro informado é o tamanho atual da peça. Ajustes podem ser avaliados pela nossa ourives, sob consulta."} Não sabe sua medida? Chame no WhatsApp que te ensinamos a medir em casa.</p></div></details>` : ""}
              ${enc ? `<details><summary>Personalização</summary><div class="conteudo"><p>Quer outra tonalidade de ouro (champanhe, branco ou rosé), trocar a pedra ou ajustar espessura e largura? Fale com a gente: avaliamos cada pedido. <a class="link" href="#/personalizacao" style="font-size:10px">Minha LAHUD</a></p></div></details>` : ""}
              <details><summary>Cuidados</summary><div class="conteudo"><p>Guarde cada joia separada das demais, nunca solta na bolsa ou na gaveta. Retire para esportes de impacto, piscina e mar. <a class="link" href="#/cuidados" style="font-size:10px">Guia completo</a></p></div></details>
              <details><summary>Entrega, trocas e suporte</summary><div class="conteudo"><ul>
                <li>Entrega segura e <strong>frete grátis para todo o Brasil</strong>, por nossa responsabilidade.</li>
                <li>Troca fácil, sem burocracia, em até 7 dias úteis após o recebimento.</li>
                <li>Suporte vitalício para manutenção.</li>
                <li>Enviada na embalagem LAHUD, com cartão escrito à mão.</li></ul></div></details>
            </div>
          </div>
        </div>
      </div>
      ${relacionados.length ? `
      <section class="secao secao--pedra">
        <div class="wrap">
          <div class="secao__topo revela"><p class="eyebrow">${col.nome}</p><h2>Você também pode <em>amar</em></h2></div>
          ${trilho(relacionados, "trilhoRel")}
        </div>
      </section>` : ""}`;

    // Preço e mensagem conforme a escolha (acabamento, tamanho, aro)
    function faixaAro(aro) { return tams.length ? (aro && +aro >= 18 ? tams[tams.length - 1] : tams[0]) : ""; }
    function atualizarEscolha() {
      if (enc && p.aro) sel.tam = faixaAro(sel.aro);
      const preco = enc ? p.precos[sel.acab][sel.tam || ""] : p.preco;
      $("#precoAtual").textContent = brl(preco);
      $("#parcelaAtual").innerHTML = `${parcela(preco)}<br>ou ${brl(preco * (1 - L.descontoPix / 100))} no Pix ou transferência (${L.descontoPix}% OFF)`;
      $$("[data-acab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.acab === sel.acab)));
      $$("[data-tam]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tam === sel.tam)));
      if (enc) {
        const desc = [sel.acab, sel.tam && !p.aro ? "tamanho " + sel.tam : "", sel.aro ? "aro " + sel.aro : ""].filter(Boolean).join(", ");
        $("#btnWhats").href = wa(`Olá! Quero encomendar *${nomeCompleto(p)}* (Maria & Luzia), ouro 18k, ${desc}: ${brl(preco)}. Podemos conversar?`);
        $("#btnAdicionar").textContent = "Adicionar à sacola";
      }
    }
    $(".produto").addEventListener("click", e => {
      const a = e.target.closest("[data-acab]"), t = e.target.closest("[data-tam]");
      if (a) { sel.acab = a.dataset.acab; atualizarEscolha(); }
      if (t) { sel.tam = t.dataset.tam; atualizarEscolha(); }
    });
    const selAro = $("#selAro");
    if (selAro) selAro.addEventListener("change", e => { sel.aro = e.target.value; atualizarEscolha(); });
    atualizarEscolha();

    $("#btnAdicionar").addEventListener("click", () => {
      if (!enc) {
        if (sacola.includes(p.id)) { renderSacola(); abrirSacola(); return; }
        adicionar(p.id);
        $("#btnAdicionar").textContent = "Ver na sacola";
        return;
      }
      if (p.aro && !sel.aro) { aviso("Escolha o seu aro"); selAro.focus(); return; }
      adicionar(chave(p.id, sel));
    });
    ativarTrilhos();
  }

  function paginaFavoritos() {
    const l = favoritos.map(porId).filter(Boolean);
    main.innerHTML = `
      <section class="pagina-topo wrap"><p class="eyebrow">Sua seleção</p><h1>Lista de <em>desejos</em></h1>
      <p>As peças que você salvou ficam guardadas neste navegador.</p></section>
      <div class="wrap" style="padding-bottom:120px">
        ${l.length
          ? `<div class="grade">${l.map(card).join("")}</div>
             <div style="text-align:center;margin-top:60px"><a class="btn btn--claro" target="_blank" rel="noopener" href="${wa("Olá! Estas são as peças da minha lista de desejos LAHUD:\n" + l.map(p => "• " + nomeCompleto(p) + " (" + brl(p.preco) + ")").join("\n"))}">Enviar lista pelo WhatsApp</a></div>`
          : `<div class="vazio">${ESTRELA}<h2>Sua lista está vazia</h2><p>Toque no coração das peças para guardá-las aqui.</p><a href="#/colecao/old-but-gold" class="btn">Ver peças</a></div>`}
      </div>`;
  }

  function paginaBusca(termo) {
    const t = norm(termo).trim();
    const l = P.filter(p => norm([p.nome, p.variante, catNome(p.categoria), "ouro " + p.ouro, COLS[p.colecao].nome, ...p.detalhes].join(" ")).includes(t));
    main.innerHTML = `
      <section class="pagina-topo wrap"><p class="eyebrow">Busca</p><h1>“${esc(termo)}”</h1><p>${l.length} ${l.length === 1 ? "resultado" : "resultados"}</p></section>
      <div class="wrap" style="padding-bottom:120px">
        ${l.length ? `<div class="grade">${l.map(card).join("")}</div>` : `<div class="vazio"><h2>Nada encontrado</h2><p>Tente “anel”, “diamante”, “corrente” ou “ouro branco”.</p><a href="#/joias" class="btn">Ver todas as joias</a></div>`}
      </div>`;
  }

  const TEXTOS = {
    historia: {
      eyebrow: "Nossa história", titulo: "Joias que contam <em>histórias</em>",
      corpo: `
        <p>A LAHUD nasce de uma história de família. De Maria e José, bisavós da nossa fundadora, que ergueram com as próprias mãos a casa onde tudo começou. E de Luzia, a voz que manteve essa memória viva por gerações.</p>
        <p class="destaque">“Há presenças que permanecem. Nos valores que herdamos, nas histórias que contamos e nas lembranças que escolhemos guardar.”</p>
        <p>Por isso, para nós, joia nunca é só adorno. Cada peça nasce do desenho e das mãos de Verônica, designer e ourives da LAHUD, pensada para carregar significado e ser passada adiante.</p>
        <h2>Nosso trabalho</h2>
        <p>As joias LAHUD são todas feitas artesanalmente em ouro 18k. Por isso, cada peça é única, gerada com muito amor e dedicação.</p>
        <p>São joias eternas: diferente de peças banhadas, o ouro maciço não desbota com o tempo. É durável e resistente o suficiente para ser usado todos os dias.</p>
        <ul>
          <li><strong>Ouro 18k com matéria-prima certificada</strong>: 75% de ouro puro e 25% de ligas metálicas (prata, cobre e paládio), que dão a resistência que o ouro 24k, muito maleável, não tem.</li>
          <li><strong>Tonalidades</strong>: ouro amarelo, champanhe, branco ou rosé.</li>
          <li><strong>Pequenas séries e design autoral</strong>: coleções que nascem de memórias reais, como os azulejos da casa de Maria e José.</li>
          <li><strong>Atendimento exclusivo</strong>: do primeiro contato à manutenção, com suporte vitalício.</li>
        </ul>
        <p style="font-size:13px;color:var(--suave)">O valor das peças pode sofrer alterações de acordo com a cotação do ouro.</p>
        <h2>Nossas coleções</h2>
        <p><a class="link" href="#/colecao/maria-e-luzia">Maria &amp; Luzia</a> &nbsp;&nbsp; <a class="link" href="#/colecao/old-but-gold">Old But Gold</a></p>`
    },
    personalizacao: {
      eyebrow: "Projeto", titulo: "Minha <em>LAHUD</em>",
      corpo: `
        <p>Lado a lado com as nossas coleções, a criação de joias personalizadas sempre fez parte da nossa essência, crescendo de forma orgânica ao longo do tempo.</p>
        <p>Hoje, ocupando um papel cada vez mais importante, sentimos a necessidade de dar forma a esse processo. Assim nasceu o projeto Minha LAHUD: um espaço onde suas ideias ganham forma e se transformam em joias únicas.</p>
        <p class="destaque">Transforme sua ideia, desejo e sentimento em uma joia única, com o design e o acabamento que definem a LAHUD.</p>
        <h2>Como funciona</h2>
        <ol class="passos">
          <li><strong>Você traz a ideia, a história e a inspiração.</strong> E nós transformamos esse sentimento em joia. No esboço, além do desenho, colocamos as informações técnicas: peso final aproximado, altura, largura, espessura e tamanho da pedra. Desenhamos quantos modelos forem necessários.</li>
          <li><strong>Orçamento e produção.</strong> Após a aprovação do design, enviamos o valor final da joia. Você realiza o pagamento e iniciamos a produção. Como o processo é autoral e artesanal, com cada detalhe feito à mão, o prazo de envio é de até 30 dias corridos após o pagamento.</li>
          <li><strong>LAHUDs criadas em conjunto.</strong> Colares, pingentes, argolas e anéis com iniciais, pedras e formas escolhidas por cada cliente. Se ficou com vontade de criar a sua, basta mandar uma mensagem.</li>
        </ol>
        <h2>Personalização das coleções</h2>
        <p>Também personalizamos joias das nossas coleções, desde que estejam em linha com os modelos do portfólio. A cada pedido podemos alterar espessura e largura, trocar a tonalidade do ouro, tirar ou incluir pedras e até substituir o tipo de pedra.</p>
        <p>Compartilhe suas referências para uma avaliação prévia. Trabalhamos sempre com design autoral e não realizamos criações que contrariem a nossa essência.</p>
        <p style="margin-top:34px"><a class="btn" target="_blank" rel="noopener" href="${wa("Olá! Quero criar a minha LAHUD. Posso contar a minha ideia?")}">Criar a minha LAHUD</a></p>`
    },
    cuidados: {
      eyebrow: "Guia", titulo: "Cuidados com suas joias",
      corpo: `
        <p>Todas as joias sofrem mudanças conforme são usadas. As de superfície polida ficam, com o tempo, mais foscas; as foscas vão se tornando polidas. Nenhum metal é duro o suficiente para não ganhar marcas pessoais de uso.</p>
        <p class="destaque">São com essas marcas que as joias vão escrevendo a sua história. Mas é importante diferenciar marcas de uso de marcas de descuido.</p>
        <h2>O uso das joias</h2>
        <ul>
          <li><strong>Durante o esporte</strong>: em atividades com risco de impacto, deixe sua joia guardada. Na musculação, por exemplo, barras e pesos podem amassar seu anel.</li>
          <li><strong>Piscina ou mar</strong>: nosso corpo retrai no frio. Se o anel estiver um pouco frouxo, ele pode cair na água e se perder. O mesmo vale para pulseiras e colares longos.</li>
          <li><strong>Pedras</strong>: por mais duras que sejam, se caírem podem lascar ou até quebrar. Tenha cuidado no manuseio.</li>
        </ul>
        <h2>Como guardá-las</h2>
        <ul>
          <li>Evite o atrito com outras joias ou objetos que possam raspar, riscar, amassar ou danificar a peça.</li>
          <li>Pedras e metais têm durezas diferentes e podem arranhar entre si. Guarde cada peça separada: <strong>nunca</strong> deixe sua joia solta na bolsa, na gaveta ou num porta-joias com várias peças.</li>
          <li>Se costuma tirar a joia para dormir, tomar banho ou cozinhar, coloque-a sempre no mesmo lugar, para não esquecer ou, pior, perder.</li>
        </ul>
        <h2>Suporte vitalício</h2>
        <p>Nosso suporte para manutenção é vitalício. Siga as dicas acima e fale com a gente sempre que tiver qualquer dúvida.</p>
        <p><a class="btn btn--claro" target="_blank" rel="noopener" href="${wa("Olá! Tenho uma dúvida sobre os cuidados com a minha joia LAHUD.")}">Tirar uma dúvida</a></p>`
    },
    atendimento: null,
    privacidade: {
      eyebrow: "Informações legais", titulo: "Política de <em>privacidade</em>",
      corpo: `<p class="rascunho">Rascunho para revisão jurídica (Lei Geral de Proteção de Dados, Lei 13.709/2018). Completar com razão social, CNPJ e e-mail do responsável.</p>
        <h2>Resumo</h2>
        <p>Este site não tem cadastro, login, formulário enviado a servidor, ferramentas de análise ou anúncios. Nós não coletamos nem armazenamos dados pessoais por meio dele.</p>
        <h2>O que fica no seu navegador</h2>
        <ul>
          <li>Sacola, lista de desejos, mensagem de presente e suas preferências de acessibilidade ficam salvas apenas no seu aparelho (armazenamento local do navegador).</li>
          <li>Nós não temos acesso a essas informações. Você pode apagá-las a qualquer momento limpando os dados do site no navegador.</li>
        </ul>
        <h2>Pedidos pelo WhatsApp</h2>
        <p>Ao finalizar um pedido, você é levado ao WhatsApp com a mensagem pronta. A partir daí, os dados que você nos enviar (nome, telefone, endereço de entrega e dados para emissão de nota) são usados apenas para atender, concluir o pedido, entregar e prestar o suporte das joias. A conversa também segue a política de privacidade do WhatsApp.</p>
        <h2>Serviços de terceiros</h2>
        <p>As fontes tipográficas são carregadas do Google Fonts, que recebe dados técnicos de acesso (como o endereço IP), conforme a política do Google. Os links para Instagram e WhatsApp levam a serviços com políticas próprias.</p>
        <h2>Seus direitos</h2>
        <p>Você pode pedir a qualquer momento confirmação, acesso, correção ou exclusão dos seus dados de atendimento, pelo WhatsApp ${esc(L.whatsappTexto)}.</p>`
    },
    termos: {
      eyebrow: "Informações legais", titulo: "Termos de <em>uso</em>",
      corpo: `<p class="rascunho">Rascunho para revisão jurídica. Completar com razão social, CNPJ e endereço.</p>
        <h2>Sobre este site</h2>
        <p>Este site apresenta as joias e coleções da LAHUD. Ao usá-lo, você concorda com estes termos.</p>
        <h2>Pedidos, preços e disponibilidade</h2>
        <ul>
          <li>A sacola do site não é uma compra concluída: ela gera uma mensagem de pedido que é confirmada pela nossa equipe pelo WhatsApp.</li>
          <li>As peças Old But Gold são únicas. A disponibilidade é confirmada no atendimento, antes do pagamento.</li>
          <li>Os valores podem sofrer alterações de acordo com a cotação do ouro. Vale o valor confirmado no atendimento.</li>
          <li>A “referência de mercado” é uma estimativa de valor de peças equivalentes, apenas informativa.</li>
        </ul>
        <h2>Pagamento, entrega e trocas</h2>
        <p>Formas de pagamento, prazos e condições de troca estão em <a class="link" href="#/atendimento" style="font-size:10px">Atendimento</a> e <a class="link" href="#/trocas" style="font-size:10px">Trocas e devoluções</a>.</p>
        <h2>Propriedade intelectual</h2>
        <p>Os desenhos das joias, fotos, textos, marca LAHUD e identidade visual são protegidos por direitos autorais e não podem ser copiados ou reproduzidos sem autorização.</p>
        <h2>Contato</h2>
        <p>WhatsApp ${esc(L.whatsappTexto)} · Instagram ${esc(L.instagramUser)}</p>`
    },
    cookies: {
      eyebrow: "Informações legais", titulo: "Cookies",
      corpo: `<p class="rascunho">Rascunho para revisão jurídica.</p>
        <p>Este site <strong>não usa cookies de rastreamento, de publicidade ou de análise</strong>.</p>
        <p>Usamos apenas o armazenamento local do seu navegador, que é essencial para o site funcionar:</p>
        <ul>
          <li><strong>Sacola</strong>: as peças que você adicionou.</li>
          <li><strong>Lista de desejos</strong>: as peças que você salvou.</li>
          <li><strong>Presente</strong>: a mensagem do cartão.</li>
          <li><strong>Acessibilidade</strong>: as opções “Reduzir movimento” e “Ativar contraste”.</li>
          <li><strong>Aviso de cookies</strong>: para não mostrar este aviso de novo.</li>
        </ul>
        <p>Essas informações ficam só no seu aparelho. Para apagá-las, limpe os dados do site nas configurações do navegador, ou use o botão abaixo.</p>
        <p><button class="btn btn--claro" data-limpar-dados>Apagar dados deste site</button></p>`
    },
    acessibilidade: {
      eyebrow: "Para todas as pessoas", titulo: "Acessibilidade",
      corpo: `<p>Queremos que todas as pessoas possam conhecer e escolher uma joia LAHUD com conforto.</p>
        <h2>Recursos do site</h2>
        <ul>
          <li><strong>Reduzir movimento</strong>: desliga animações, zoom das fotos e transições. Ativado automaticamente se o seu aparelho já pedir menos movimento.</li>
          <li><strong>Ativar contraste</strong>: textos mais escuros, linhas e bordas mais fortes e links sublinhados.</li>
          <li>Navegação completa pelo teclado, com foco visível, atalho “Pular para o conteúdo” e tecla Esc para fechar menus e a sacola.</li>
          <li>Textos alternativos nas fotos das joias e estrutura de títulos para leitores de tela.</li>
          <li>Layout que se adapta a celular, tablet e computador, e respeita o zoom do navegador.</li>
        </ul>
        <div class="toggles toggles--pagina" role="group" aria-label="Acessibilidade">
          <button class="toggle" role="switch" data-pref="movimento" aria-checked="false"><span class="toggle__trilho" aria-hidden="true"></span>Reduzir movimento</button>
          <button class="toggle" role="switch" data-pref="contraste" aria-checked="false"><span class="toggle__trilho" aria-hidden="true"></span>Ativar contraste</button>
        </div>
        <h2>Encontrou alguma barreira?</h2>
        <p>Conte para a gente pelo WhatsApp ${esc(L.whatsappTexto)}. Também atendemos por mensagem de voz ou texto, como for melhor para você.</p>`
    },
    trocas: {
      eyebrow: "Rascunho", titulo: "Trocas e devoluções",
      corpo: `<p class="rascunho">Rascunho para revisão jurídica (CDC).</p>
        <p><strong>Troca fácil</strong>: sem burocracia, em até 7 dias úteis após o recebimento do pedido, com a peça sem sinais de uso e na embalagem original.</p>
        <p>O prazo também atende ao direito de arrependimento de compras feitas a distância (art. 49 do Código de Defesa do Consumidor).</p>
        <p>Peças personalizadas (projeto Minha LAHUD ou alterações em peças das coleções) não entram na troca fácil, porque são feitas especialmente para você.</p>`
    }
  };

  function paginaTexto(chave) {
    if (chave === "atendimento") return paginaAtendimento();
    const t = TEXTOS[chave];
    main.innerHTML = `
      <section class="pagina-topo wrap"><p class="eyebrow">${t.eyebrow}</p><h1>${t.titulo}</h1></section>
      <article class="wrap texto-longo">${t.corpo}</article>
      ${chave === "historia" ? blocoClientes() : ""}
      ${chave === "historia" ? `<section class="split"><div class="split__img"><img src="assets/img/joias/bracelete-modelo.jpg" alt="" loading="lazy"></div><div class="split__texto revela"><p class="eyebrow">Old But Gold</p><h2>Peças para <em>atravessar</em> o tempo</h2><p>${esc(COLS["old-but-gold"].chamada)}</p><a class="btn" href="#/colecao/old-but-gold">Ver a coleção</a></div></section>` : ""}`;
  }

  function paginaAtendimento() {
    main.innerHTML = `
      <section class="pagina-topo wrap"><p class="eyebrow">Facilidades</p><h1>Atendimento <em>LAHUD</em></h1>
        <p>Toda compra é acompanhada de perto pela nossa equipe, do primeiro contato à manutenção.</p></section>
      <div class="wrap facilidades">
        ${[
          ["Pagamento e descontos", `Pix, crédito, débito e transferência. ${L.parcelas}x sem juros no cartão e ${L.descontoPix}% OFF no Pix e na transferência.`],
          ["Entrega segura e gratuita", "A responsabilidade da entrega é toda nossa, e o frete é grátis para todo o Brasil."],
          ["Troca fácil", "Sem burocracia, em até 7 dias úteis após o recebimento do pedido (exceto peças personalizadas)."],
          ["Matéria-prima certificada", "Todas as joias são feitas em ouro 18k com matéria-prima certificada."],
          ["Suporte e manutenção", "Nosso suporte é vitalício e está sempre disponível para manutenções."],
          ["Atendimento exclusivo", "Tire suas dúvidas e faça sugestões conversando com nossas especialistas."]
        ].map(([t, d], i) => `<div class="facilidade"><span>0${i + 1}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}
      </div>
      <div class="wrap contatos">
        <a class="contato" target="_blank" rel="noopener" href="${wa("Olá! Gostaria de atendimento da LAHUD.")}">${ESTRELA}<h3>WhatsApp</h3><p>Dúvidas, reservas, medidas e pagamento. ${esc(L.whatsappTexto)}</p><span class="link">Conversar</span></a>
        <a class="contato" target="_blank" rel="noopener" href="${wa("Olá! Gostaria de agendar um atendimento personalizado.")}">${ESTRELA}<h3>Atendimento agendado</h3><p>Uma conversa dedicada para escolher presentes, alianças ou projetos sob medida.</p><span class="link">Agendar</span></a>
        <a class="contato" target="_blank" rel="noopener" href="${L.instagram}">${ESTRELA}<h3>Instagram</h3><p>Lançamentos, bastidores do ateliê e histórias das nossas clientes. ${esc(L.instagramUser)}</p><span class="link">Seguir</span></a>
      </div>
      <section class="secao secao--pedra"><div class="wrap">
        <div class="secao__topo"><p class="eyebrow">Perguntas frequentes</p><h2>Como <em>comprar</em></h2></div>
        <div class="acordeao" style="max-width:780px;margin:0 auto">
          <details open><summary>Como faço meu pedido?</summary><div class="conteudo">Adicione as peças à sacola e toque em “Finalizar pelo WhatsApp”. A mensagem chega pronta para a nossa equipe, que confirma a disponibilidade, o pagamento e a entrega.</div></details>
          <details><summary>Quais as formas de pagamento?</summary><div class="conteudo">Pix, crédito, débito e transferência. Até ${L.parcelas}x sem juros no cartão, ou ${L.descontoPix}% de desconto no Pix e na transferência.</div></details>
          <details><summary>As peças Old But Gold são novas?</summary><div class="conteudo">São joias únicas, selecionadas uma a uma por sua beleza e permanência. Cada uma tem sua própria história, e a descrição de cada peça traz todos os detalhes. Na dúvida, fale com a gente.</div></details>
          <details><summary>Posso ajustar o tamanho de um anel?</summary><div class="conteudo">Sim, sob consulta. Avaliamos cada peça para garantir que o ajuste preserve o desenho original.</div></details>
          <details><summary>Vocês enviam para todo o Brasil?</summary><div class="conteudo">Sim, com frete grátis e entrega segura por nossa responsabilidade. Peças produzidas à mão têm prazo de 20 dias úteis a partir do pagamento; projetos Minha LAHUD, até 30 dias corridos.</div></details>
          <details><summary>Posso criar uma joia do zero?</summary><div class="conteudo">Pode! É o projeto <a class="link" href="#/personalizacao" style="font-size:10px">Minha LAHUD</a>: você traz a ideia e a história, e nós desenhamos a joia com você.</div></details>
        </div>
      </div></section>`;
  }

  function pagina404() {
    main.innerHTML = `<div class="wrap vazio" style="padding:140px 0">${ESTRELA}<h2>Página não encontrada</h2><p>Talvez essa joia já tenha encontrado sua nova história.</p><a href="#/" class="btn">Voltar ao início</a></div>`;
  }

  // --------------------------------------------------------------- sacola
  function renderSacola() {
    const itens = sacola.map(itemDaChave).filter(Boolean);
    const corpo = $("#drawerCorpo"), rodape = $("#drawerRodape");
    $("#drawerTitulo").textContent = itens.length ? `Sua sacola (${itens.length})` : "Sua sacola";
    if (!itens.length) {
      corpo.innerHTML = `<div class="sacola-vazia">${ESTRELA}<p>Sua sacola está vazia.</p><a href="#/colecao/maria-e-luzia" class="btn" data-fechar-drawer>Descobrir peças</a></div>`;
      rodape.innerHTML = ""; rodape.hidden = true; return;
    }
    rodape.hidden = false;
    const temEncomenda = itens.some(it => it.p.precos);
    corpo.innerHTML = itens.map(it => `
      <div class="item">
        <a href="#/joia/${it.p.id}" data-fechar-drawer><img src="${it.p.fotos[0]}" alt=""></a>
        <div>
          <div class="item__nome">${nomeHtml(it.p)}</div>
          <div class="item__meta">${esc(it.desc)}<br>${it.p.precos ? "Feita à mão · sob encomenda" : "Peça única"}</div>
          <div class="item__linha"><span>${brl(it.preco)}</span><button class="item__remover" data-remover="${esc(it.k)}">Remover</button></div>
        </div>
      </div>`).join("") + `
      <div style="padding:22px 0 8px">
        <label class="presente"><input type="checkbox" id="chkPresente" ${embrulho.ativo ? "checked" : ""}> <span>É para presente<br><small style="color:var(--suave)">Toda joia vai na embalagem LAHUD. Escreva a mensagem e ela vai no cartão.</small></span></label>
        <label class="campo" id="campoMsg" ${embrulho.ativo ? "" : "hidden"}><span>Mensagem do cartão</span><textarea id="msgPresente" rows="2" maxlength="200" placeholder="Escreva sua mensagem">${esc(embrulho.mensagem)}</textarea></label>
      </div>`;
    const total = itens.reduce((s, it) => s + it.preco, 0);
    rodape.innerHTML = `
      <div class="resumo">
        <div><span>Subtotal</span><span>${brl(total)}</span></div>
        <div><span>Entrega</span><span>Grátis</span></div>
        <div class="total"><span>Total</span><span>${brl(total)}</span></div>
        <div style="color:var(--suave);font-size:13px;justify-content:flex-end">${parcela(total)}</div>
        <div style="color:var(--ouro);font-size:13px;justify-content:flex-end">ou ${brl(total * (1 - L.descontoPix / 100))} no Pix (${L.descontoPix}% OFF)</div>
      </div>
      <label class="campo"><span>Seu nome</span><input id="nomeCliente" autocomplete="name" placeholder="Como podemos te chamar?"></label>
      <a class="btn btn--bloco" id="btnFinalizar" target="_blank" rel="noopener" href="#">Finalizar pelo WhatsApp</a>
      <p class="nota">${temEncomenda ? "Peças Maria &amp; Luzia são produzidas após o pagamento, em até 20 dias úteis. " : ""}A disponibilidade é confirmada pela nossa equipe antes do pagamento.</p>`;
    const atualizarLink = () => {
      const nome = ($("#nomeCliente") || {}).value || "";
      const linhas = itens.map(it => `• ${nomeCompleto(it.p)}${it.p.precos ? " (Maria & Luzia)" : " (Old But Gold)"}: ${it.desc}: ${brl(it.preco)}`);
      const txt = [
        `Olá, LAHUD! ${nome ? "Sou " + nome.trim() + " e g" : "G"}ostaria de finalizar este pedido:`,
        "", ...linhas, "",
        `*Total: ${brl(total)}* (${parcela(total)})`,
        embrulho.ativo ? `\n🎁 É para presente.${embrulho.mensagem ? ' Cartão: "' + embrulho.mensagem.trim() + '"' : ""}` : "",
        "\nPodem confirmar a disponibilidade e as formas de pagamento e entrega?"
      ].join("\n");
      $("#btnFinalizar").href = wa(txt);
    };
    atualizarLink();
    $("#nomeCliente").addEventListener("input", atualizarLink);
    $("#chkPresente").addEventListener("change", e => { embrulho.ativo = e.target.checked; $("#campoMsg").hidden = !e.target.checked; salvar(); atualizarLink(); });
    $("#msgPresente").addEventListener("input", e => { embrulho.mensagem = e.target.value; salvar(); atualizarLink(); });
  }
  let focoAntes;
  function abrirSacola() {
    focoAntes = document.activeElement;
    renderSacola(); $("#drawer").hidden = false; document.body.style.overflow = "hidden";
    setTimeout(() => $("#drawer [data-fechar-drawer].icon-btn").focus(), 50);
  }
  function fecharSacola() { $("#drawer").hidden = true; document.body.style.overflow = ""; focoAntes && focoAntes.focus && focoAntes.focus(); }

  // --------------------------------------------------------------- fixos
  function montarFixos() {
    if (L.anuncio) { const a = $("#anuncio"); a.hidden = false; a.innerHTML = `${esc(L.anuncio)} <a href="${wa("Olá! Quero saber mais sobre a Best & Black November.")}" target="_blank" rel="noopener">Saiba mais</a>`; }
    $("#whatsFloat").href = wa("Olá! Vim pelo site da LAHUD e gostaria de atendimento.");
    $("#rodape").innerHTML = `
      <div class="wrap">
        <div class="footer__news">
          ${ESTRELA}
          <h2>Clientes <em>VIP</em></h2>
          <p>Lançamentos em primeira mão, catálogos exclusivos e condições especiais no nosso grupo de clientes.</p>
          <a class="btn btn--branco" target="_blank" rel="noopener" href="${wa("Olá! Quero fazer parte do grupo de clientes VIP da LAHUD.")}">Quero participar</a>
        </div>
        <div class="footer__grid">
          <div>
            <a href="#/" class="logo">LAHUD</a>
            <p style="max-width:300px;margin:0;font-size:14px">${esc(L.descricao)} Design autoral de ${esc(L.designer)}.</p>
          </div>
          <div><h3>Coleções</h3><ul>
            <li><a href="#/colecao/maria-e-luzia">Maria &amp; Luzia</a></li><li><a href="#/colecao/old-but-gold">Old But Gold</a></li>
            ${CATS.map(c => `<li><a href="#/joias/${c.slug}">${c.nome}</a></li>`).join("")}</ul></div>
          <div><h3>LAHUD</h3><ul>
            <li><a href="#/historia">Nossa história</a></li><li><a href="#/personalizacao">Minha LAHUD</a></li>
            <li><a href="#/cuidados">Cuidados</a></li><li><a href="#/atendimento">Atendimento</a></li></ul></div>
          <div><h3>Contato</h3><ul>
            <li><a target="_blank" rel="noopener" href="${wa("Olá!")}">WhatsApp ${esc(L.whatsappTexto)}</a></li>
            <li><a target="_blank" rel="noopener" href="${L.instagram}">Instagram ${esc(L.instagramUser)}</a></li>
            <li><a href="#/trocas">Trocas e devoluções</a></li></ul></div>
        </div>
        <div class="footer__a11y">
          <span class="footer__pais"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg> Brasil · Português</span>
          <div class="toggles" role="group" aria-label="Acessibilidade">
            <button class="toggle" role="switch" data-pref="movimento" aria-checked="false"><span class="toggle__trilho" aria-hidden="true"></span>Reduzir movimento</button>
            <button class="toggle" role="switch" data-pref="contraste" aria-checked="false"><span class="toggle__trilho" aria-hidden="true"></span>Ativar contraste</button>
          </div>
        </div>
        <nav class="footer__legal" aria-label="Informações legais">
          <a href="#/termos">Termos de uso</a><span aria-hidden="true">-</span><a href="#/privacidade">Política de privacidade</a><span aria-hidden="true">-</span><a href="#/cookies">Cookies</a><span aria-hidden="true">-</span><a href="#/acessibilidade">Acessibilidade</a>
        </nav>
        <div class="footer__base"><span>© ${new Date().getFullYear()} LAHUD · Joias que contam histórias</span><span>${esc(L.avisoDemo)}</span></div>
      </div>`;
    aplicarPrefs();
  }

  // --------------------------------------------------------------- acessibilidade
  // Preferências guardadas no navegador. Na primeira visita, seguem o sistema (prefers-reduced-motion / prefers-contrast).
  function lerPrefs() {
    const salvo = armazenamento.ler("lahud_a11y", null);
    if (salvo) return salvo;
    return {
      movimento: matchMedia("(prefers-reduced-motion: reduce)").matches,
      contraste: matchMedia("(prefers-contrast: more)").matches
    };
  }
  function aplicarPrefs() {
    const p = lerPrefs();
    document.documentElement.classList.toggle("reduzir-movimento", !!p.movimento);
    document.documentElement.classList.toggle("alto-contraste", !!p.contraste);
    $$("[data-pref]").forEach(b => b.setAttribute("aria-checked", String(!!p[b.dataset.pref])));
  }
  function alternarPref(chave) {
    const p = lerPrefs(); p[chave] = !p[chave];
    armazenamento.gravar("lahud_a11y", p); aplicarPrefs();
    aviso(chave === "movimento" ? (p.movimento ? "Movimento reduzido" : "Animações ativadas") : (p.contraste ? "Contraste ativado" : "Contraste padrão"));
  }

  function bannerCookies() {
    if (armazenamento.ler("lahud_cookies", null)) return;
    const d = document.createElement("div");
    d.className = "cookies"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Aviso de cookies");
    d.innerHTML = `<p>Usamos apenas o armazenamento do seu navegador para guardar sua sacola, lista de desejos e preferências. Sem rastreamento. <a href="#/cookies">Saiba mais</a></p>
      <div><button class="btn" data-ck="ok">Entendi</button></div>`;
    document.body.appendChild(d);
    d.addEventListener("click", e => { if (e.target.dataset.ck) { armazenamento.gravar("lahud_cookies", { ok: true, em: Date.now() }); d.remove(); } });
  }

  // --------------------------------------------------------------- efeitos
  let io;
  function revelar() {
    io && io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visivel"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".revela").forEach(el => io.observe(el));
  }
  function headerHero() {
    const temHero = !!$("[data-hero]");
    const topo = window.scrollY < 40;
    document.body.classList.toggle("sobre-hero", temHero && topo && $("#busca").hidden);
  }

  // --------------------------------------------------------------- roteador
  function roteador() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [r, a] = h.split("/");
    document.title = "LAHUD | Joias que contam histórias · Ouro 18k";
    if (!r) paginaInicial();
    else if (r === "colecao") paginaColecao(a);
    else if (r === "joias") paginaJoias(a);
    else if (r === "joia") paginaProduto(a);
    else if (r === "favoritos") paginaFavoritos();
    else if (r === "busca") paginaBusca(h.slice(6));
    else if (r in TEXTOS) paginaTexto(r);
    else pagina404();
    $$(".nav a").forEach(n => n.toggleAttribute("aria-current", h.startsWith(n.dataset.nav) || (n.dataset.nav === "joias" && r === "joia")));
    $$(".nav a[aria-current]").forEach(n => n.setAttribute("aria-current", "page"));
    window.scrollTo({ top: 0, behavior: "instant" });
    headerHero(); revelar(); aplicarPrefs();
  }

  // --------------------------------------------------------------- eventos
  function iniciar() {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    montarFixos(); badges(); roteador(); bannerCookies();
    window.addEventListener("hashchange", () => { fecharMenu(); roteador(); });
    window.addEventListener("scroll", headerHero, { passive: true });

    document.addEventListener("click", e => {
      if (e.target.closest("[data-limpar-dados]")) { ["lahud_sacola","lahud_desejos","lahud_presente","lahud_a11y","lahud_cookies"].forEach(k => { try { localStorage.removeItem(k); } catch {} }); sacola = []; favoritos = []; embrulho = { ativo: false, mensagem: "" }; badges(); aplicarPrefs(); aviso("Dados deste site apagados"); return; }
      const pref = e.target.closest("[data-pref]");
      if (pref) { alternarPref(pref.dataset.pref); return; }
      const fav = e.target.closest("[data-fav]");
      if (fav) { e.preventDefault(); alternarDesejo(fav.dataset.fav); return; }
      const rem = e.target.closest("[data-remover]");
      if (rem) { remover(rem.dataset.remover); return; }
      if (e.target.closest("[data-fechar-drawer]")) { fecharSacola(); return; }
      if (e.target.closest("[data-fechar-menu]")) { fecharMenu(); return; }
      const seta = e.target.closest("[data-trilho]");
      if (seta) { const t = document.getElementById(seta.dataset.trilho); t.scrollBy({ left: t.clientWidth * 0.8 * +seta.dataset.dir, behavior: "smooth" }); return; }
      const z = e.target.closest("[data-zoom]");
      if (z) {
        const lb = document.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog");
        lb.innerHTML = `<img src="${z.dataset.zoom}" alt=""><button class="icon-btn" aria-label="Fechar"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.3"/></svg></button>`;
        lb.addEventListener("click", () => lb.remove()); document.body.appendChild(lb);
      }
    });
    $("#btnSacola").addEventListener("click", abrirSacola);
    $("#btnMenu").addEventListener("click", () => { $("#menuMobile").hidden = false; $("#btnMenu").setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; });
    $("#btnBusca").addEventListener("click", () => { $("#busca").hidden = false; headerHero(); $("#campoBusca").focus(); });
    $("#btnFecharBusca").addEventListener("click", () => { $("#busca").hidden = true; headerHero(); });
    $("#formBusca").addEventListener("submit", e => {
      e.preventDefault(); const t = $("#campoBusca").value.trim(); if (!t) return;
      $("#busca").hidden = true; location.hash = "#/busca/" + encodeURIComponent(t);
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if ($(".lightbox")) $(".lightbox").remove();
      else if (!$("#drawer").hidden) fecharSacola();
      else if (!$("#menuMobile").hidden) fecharMenu();
      else if (!$("#busca").hidden) { $("#busca").hidden = true; headerHero(); }
    });
  }
  function fecharMenu() { $("#menuMobile").hidden = true; $("#btnMenu").setAttribute("aria-expanded", "false"); if ($("#drawer").hidden) document.body.style.overflow = ""; }

  iniciar();
})();
