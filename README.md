# LAHUD: site catálogo / e-commerce premium (v1)

Protótipo da loja online da **LAHUD · joias que contam histórias**: joias em ouro 18k, em pequenas séries, com design autoral.
Mesma base do protótipo Couro & Lar: **o cliente monta a sacola no site e envia o pedido pronto pelo WhatsApp.**

**Site:** https://caionb2.github.io/lahud-joias-prototipo/

## O que tem

- Home editorial (referências: Tiffany, Rolex, Swarovski): hero em tela cheia, manifesto, coleção em destaque, peças únicas, categorias, citação, Maria & Luzia, serviços.
- **Old But Gold**: as 16 peças do catálogo de 28/06/2026, com fotos, ficha (ouro, peso, pedras, aro/comprimento), preço, 10x sem juros e **referência de valor de mercado**.
- **Maria & Luzia** (catálogo 10/2026): 11 peças feitas à mão sob encomenda, com fotos, escolha de acabamento (com brilhantes ou liso), tamanho (PP a G) e aro, e preço que muda conforme a escolha.
- **Filme “O buraco de ouro”** (Verônica e Luzia, 2min13, vertical): prévia em loop sem som na home e em Nossa história; ao tocar abre o filme com som (tela cheia no celular). Transcrição na página Nossa história. Arquivo: `assets/video/historia.mp4` (convertido de .MOV/HEVC para MP4/H.264 720×1280).
- **Tipografia da marca**: Alta (logo e títulos), Barlow Light (texto), DM Sans (menus e botões), Garet (preços). Alta e Garet não estão no Google Fonts; veja `assets/fonts/LEIA-ME.txt`.
- Página de cada joia com galeria, zoom, lista de desejos, “Adicionar à sacola” e “Reservar pelo WhatsApp”.
- Sacola com opção de presente + mensagem do cartão → mensagem pronta no WhatsApp (11) 91840-2288.
- Busca, filtros (categoria, ouro amarelo/branco) e ordenação (preço, peso em ouro).
- Páginas com o conteúdo dos destaques do Instagram: Nossa história (com Nosso trabalho e depoimentos de Clientes), Minha LAHUD (joia sob medida), Cuidados, Atendimento/Facilidades (10x, 5% OFF no Pix, frete grátis, troca em 7 dias úteis, suporte vitalício). Privacidade e Trocas são rascunhos.
- Rodapé com acessibilidade (Reduzir movimento, Ativar contraste) e links de Termos de uso, Política de privacidade, Cookies e Acessibilidade.
- Faixa da Best & Black November (liga/desliga em `config.js`).

## Como editar

| Arquivo | Para que serve |
|---|---|
| `assets/js/config.js` | WhatsApp, Instagram, parcelas, faixa de promoção, aviso de demonstração |
| `assets/js/produtos.js` | Catálogo: peças, preços, valores de mercado, fotos. **Vendeu? marque `vendida: true`** |
| `assets/img/joias/` | Fotos (extraídas do PDF Old But Gold) |
| `assets/css/style.css` | Visual (marfim, pedra, carvão e ouro) |
| `docs/PROXIMOS-PASSOS.md` | O que falta validar e as próximas fases |

Abrir: dois cliques em `index.html`, ou publicar a pasta em qualquer hospedagem estática.
