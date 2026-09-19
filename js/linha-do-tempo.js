/* ================================================================
   linha-do-tempo.js — Especial:Linha do tempo

   Deixa a pessoa escolher, entre todos os artigos do índice
   (window.TP_INDICE, o mesmo usado pela busca — ver js/indice.js e
   js/busca.js) que tenham data de início e/ou fim de evento
   (campos anoInicio/anoFim, já usados pelos filtros de data da busca
   avançada), quais deve ver organizados automaticamente em ordem
   cronológica numa linha do tempo horizontal.

   Cada artigo selecionado recebe uma cor própria (de uma paleta
   fixa, atribuída na ordem em que foi selecionado), usada tanto na
   marcação lateral da barra de duração desse artigo na linha do
   tempo quanto no quadrado de cor ao lado do item na lista de
   seleção — a mesma cor nos dois lugares permite identificar de
   relance qual barra corresponde a qual artigo. A seleção persiste
   em localStorage (chave "tp:linha-do-tempo-selecionados") e a
   linha do tempo é recalculada e redesenhada em tempo real a cada
   marcação/desmarcação de caixa, sem precisar recarregar a página.

   Também pode ser alimentada de fora: busca.html grava uma lista de
   slugs em "tp:linha-do-tempo-pendente" antes de redirecionar para
   cá (botão "Enviar resultados para a Linha do tempo"); ao carregar,
   se essa chave existir, seu conteúdo soma-se à seleção atual e a
   chave é apagada.

   ÍNDICE DESTE ARQUIVO
     PALETA                      → cores fixas atribuídas por ordem de seleção
     obterSelecionados/salvar    → leitura/escrita em localStorage
     corPara(slug, selecionados) → cor estável para um slug já selecionado
     itensComData()              → subconjunto de TP_INDICE com anoInicio
     redesenhar()                → função central: filtra, ordena, desenha
       lista de seleção (com quadrado de cor) e a linha do tempo
       (barras/pontos posicionados proporcionalmente aos anos)
     (DOMContentLoaded)          → liga filtro, checkboxes e importação
       pendente de busca.html
   ================================================================ */
/* ============================================================
   ÍNDICE DO ARQUIVO (gerado/mantido em lote)
   ============================================================
   1. PALETA                         → cores fixas atribuídas por
      ordem de seleção
   2. CHAVE_SELECIONADOS/CHAVE_PENDENTE → chaves usadas no localStorage
   3. obterSelecionados()            → leitura da seleção salva
   4. salvarSelecionados(lista)      → escrita da seleção no localStorage
   5. corPara(slug, selecionados)    → cor estável para um slug
      já selecionado
   6. itensComData()                 → subconjunto de TP_INDICE com
      anoInicio definido
   7. normalizar(texto)              → minúsculas e sem acentos, para
      o filtro por texto
   8. (DOMContentLoaded)             → resolve elementos da página,
      importa seleção pendente vinda de busca.html, define
      redesenhar() (função central: filtra, ordena e desenha a lista
      de seleção e a linha do tempo) e liga filtro/checkboxes/limpar
   ============================================================ */
(function () {
  "use strict";

  // 1. Paleta fixa de cores, atribuída por ordem de seleção
  var PALETA = [
    "#c0392b", "#2980b9", "#27ae60", "#8e44ad", "#d35400",
    "#16a085", "#c2185b", "#f39c12", "#2c3e50", "#7f8c8d",
  ];

  // 2. Chaves de localStorage usadas pela seleção e pela importação pendente
  var CHAVE_SELECIONADOS = "tp:linha-do-tempo-selecionados";
  var CHAVE_PENDENTE = "tp:linha-do-tempo-pendente";

  // 3. Lê a lista de slugs selecionados do localStorage
  function obterSelecionados() {
    try {
      var bruto = window.localStorage.getItem(CHAVE_SELECIONADOS);
      var lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  // 4. Grava a lista de slugs selecionados no localStorage
  function salvarSelecionados(lista) {
    try {
      window.localStorage.setItem(CHAVE_SELECIONADOS, JSON.stringify(lista));
    } catch (e) {
      /* localStorage indisponível (modo privado etc.) — segue sem persistir */
    }
  }

  // 5. Cor estável (da PALETA) para um slug já selecionado
  function corPara(slug, selecionados) {
    var indice = selecionados.indexOf(slug);
    if (indice === -1) return "#999999";
    return PALETA[indice % PALETA.length];
  }

  // 6. Subconjunto de TP_INDICE com anoInicio definido
  function itensComData() {
    if (!window.TP_INDICE) return [];
    return window.TP_INDICE.filter(function (item) {
      return typeof item.anoInicio === "number";
    });
  }

  // 7. Minúsculas e sem acentos, para o filtro de texto da lista
  function normalizar(texto) {
    return String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // 8. Resolve elementos da página, importa seleção pendente de
  //    busca.html, define redesenhar() e liga filtro/checkboxes/limpar
  document.addEventListener("DOMContentLoaded", function () {
    var campoFiltro = document.getElementById("linha-tempo-filtro");
    var listaSelecao = document.getElementById("linha-tempo-lista-selecao");
    var areaTimeline = document.getElementById("linha-tempo-visualizacao");
    var resumoStatus = document.getElementById("linha-tempo-status");
    var botaoLimpar = document.getElementById("linha-tempo-limpar");

    if (!listaSelecao || !areaTimeline) return; /* página sem os elementos esperados */

    /* importa seleção pendente vinda de busca.html, se houver */
    try {
      var pendenteBruto = window.localStorage.getItem(CHAVE_PENDENTE);
      if (pendenteBruto) {
        var pendente = JSON.parse(pendenteBruto);
        if (Array.isArray(pendente) && pendente.length) {
          var atuais = obterSelecionados();
          pendente.forEach(function (slug) {
            if (atuais.indexOf(slug) === -1) atuais.push(slug);
          });
          salvarSelecionados(atuais);
        }
        window.localStorage.removeItem(CHAVE_PENDENTE);
      }
    } catch (e) { /* ignora */ }

    function redesenhar() {
      var termo = normalizar(campoFiltro ? campoFiltro.value : "");
      var selecionados = obterSelecionados();
      var todos = itensComData();

      var visiveis = todos.filter(function (item) {
        if (!termo) return true;
        return normalizar(item.titulo).indexOf(termo) !== -1 ||
          normalizar(item.local).indexOf(termo) !== -1 ||
          normalizar((item.categorias || []).join(" ")).indexOf(termo) !== -1;
      });

      /* ---------- lista de seleção (checkboxes) ---------- */
      listaSelecao.textContent = "";
      visiveis
        .slice()
        .sort(function (a, b) { return a.titulo.localeCompare(b.titulo, "pt-BR"); })
        .forEach(function (item) {
          var marcado = selecionados.indexOf(item.slug) !== -1;
          var li = document.createElement("li");
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.gap = "0.5rem";
          li.style.padding = "0.15rem 0";

          var quadrado = document.createElement("span");
          quadrado.setAttribute("aria-hidden", "true");
          quadrado.style.display = "inline-block";
          quadrado.style.width = "0.85rem";
          quadrado.style.height = "0.85rem";
          quadrado.style.borderRadius = "2px";
          quadrado.style.flex = "0 0 auto";
          quadrado.style.background = marcado ? corPara(item.slug, selecionados) : "transparent";
          quadrado.style.border = marcado ? "none" : "1px dashed var(--borda)";
          li.appendChild(quadrado);

          var label = document.createElement("label");
          label.style.display = "flex";
          label.style.alignItems = "center";
          label.style.gap = "0.4rem";
          label.style.cursor = "pointer";
          label.style.flex = "1 1 auto";

          var caixa = document.createElement("input");
          caixa.type = "checkbox";
          caixa.checked = marcado;
          caixa.setAttribute("data-tp-linha-tempo-slug", item.slug);
          label.appendChild(caixa);

          var texto = document.createElement("span");
          var periodo = item.anoFim && item.anoFim !== item.anoInicio
            ? (item.anoInicio + "–" + item.anoFim)
            : String(item.anoInicio);
          texto.textContent = item.titulo + " (" + periodo + (item.local ? " · " + item.local : "") + ")";
          label.appendChild(texto);

          li.appendChild(label);
          listaSelecao.appendChild(li);

          caixa.addEventListener("change", function () {
            var atual = obterSelecionados();
            var pos = atual.indexOf(item.slug);
            if (caixa.checked && pos === -1) atual.push(item.slug);
            else if (!caixa.checked && pos !== -1) atual.splice(pos, 1);
            salvarSelecionados(atual);
            redesenhar();
          });
        });

      /* ---------- linha do tempo ---------- */
      areaTimeline.textContent = "";
      var itensSelecionados = todos
        .filter(function (item) { return selecionados.indexOf(item.slug) !== -1; })
        .sort(function (a, b) { return a.anoInicio - b.anoInicio; });

      if (resumoStatus) {
        resumoStatus.textContent = itensSelecionados.length === 0
          ? "Nenhum artigo selecionado. Marque itens na lista abaixo para montar a linha do tempo."
          : itensSelecionados.length + " item(ns) na linha do tempo, de " +
            itensSelecionados[0].anoInicio + " a " +
            Math.max.apply(null, itensSelecionados.map(function (i) { return i.anoFim || i.anoInicio; })) + ".";
      }

      if (itensSelecionados.length === 0) return;

      var anoMin = Math.min.apply(null, itensSelecionados.map(function (i) { return i.anoInicio; }));
      var anoMax = Math.max.apply(null, itensSelecionados.map(function (i) { return i.anoFim || i.anoInicio; }));
      if (anoMax === anoMin) anoMax = anoMin + 1; /* evita divisão por zero na escala */
      var faixaTotal = anoMax - anoMin;

      var eixo = document.createElement("div");
      eixo.style.position = "relative";
      eixo.style.height = "1.4rem";
      eixo.style.marginBottom = "0.4rem";
      eixo.style.borderBottom = "1px solid var(--borda)";
      eixo.style.fontSize = "0.75rem";
      eixo.style.color = "var(--tinta-suave)";
      [anoMin, Math.round(anoMin + faixaTotal / 2), anoMax].forEach(function (ano, i) {
        var marca = document.createElement("span");
        marca.textContent = String(ano);
        marca.style.position = "absolute";
        marca.style.left = i === 0 ? "0" : (i === 1 ? "50%" : "100%");
        marca.style.transform = i === 1 ? "translateX(-50%)" : (i === 2 ? "translateX(-100%)" : "none");
        eixo.appendChild(marca);
      });
      areaTimeline.appendChild(eixo);

      var trilhas = document.createElement("div");
      trilhas.setAttribute("role", "list");
      trilhas.setAttribute("aria-label", "Linha do tempo dos artigos selecionados");

      itensSelecionados.forEach(function (item) {
        var cor = corPara(item.slug, selecionados);
        var inicio = item.anoInicio;
        var fim = item.anoFim || item.anoInicio;
        var esquerdaPct = ((inicio - anoMin) / faixaTotal) * 100;
        var larguraPct = Math.max(((fim - inicio) / faixaTotal) * 100, 0.6);

        var linha = document.createElement("div");
        linha.setAttribute("role", "listitem");
        linha.style.display = "flex";
        linha.style.alignItems = "center";
        linha.style.gap = "0.6rem";
        linha.style.margin = "0.3rem 0";

        var rotulo = document.createElement("div");
        rotulo.style.width = "11rem";
        rotulo.style.flex = "0 0 auto";
        rotulo.style.fontSize = "0.85rem";
        rotulo.style.overflow = "hidden";
        rotulo.style.textOverflow = "ellipsis";
        rotulo.style.whiteSpace = "nowrap";
        rotulo.style.borderLeft = "4px solid " + cor;
        rotulo.style.paddingLeft = "0.4rem";
        var linkRotulo = document.createElement("a");
        linkRotulo.href = item.href;
        linkRotulo.textContent = item.titulo;
        linkRotulo.title = item.titulo + (item.local ? " — " + item.local : "");
        rotulo.appendChild(linkRotulo);
        linha.appendChild(rotulo);

        var trilha = document.createElement("div");
        trilha.style.position = "relative";
        trilha.style.flex = "1 1 auto";
        trilha.style.height = "1.4rem";
        trilha.style.background = "var(--papel-3)";
        trilha.style.borderRadius = "3px";

        var barra = document.createElement("a");
        barra.href = item.href;
        barra.className = "linha-tempo-barra";
        barra.style.position = "absolute";
        barra.style.top = "0";
        barra.style.left = esquerdaPct + "%";
        barra.style.width = larguraPct + "%";
        barra.style.height = "100%";
        barra.style.background = cor;
        barra.style.borderRadius = "3px";
        barra.style.display = "block";
        barra.style.minWidth = "6px";
        var periodoTexto = fim !== inicio ? (inicio + "–" + fim) : String(inicio);
        barra.title = item.titulo + " · " + periodoTexto + (item.local ? " · " + item.local : "");
        trilha.appendChild(barra);

        linha.appendChild(trilha);

        var cidade = document.createElement("div");
        cidade.style.width = "9rem";
        cidade.style.flex = "0 0 auto";
        cidade.style.fontSize = "0.75rem";
        cidade.style.color = "var(--tinta-suave)";
        cidade.style.overflow = "hidden";
        cidade.style.textOverflow = "ellipsis";
        cidade.style.whiteSpace = "nowrap";
        cidade.textContent = (item.local || "") + " · " + periodoTexto;
        linha.appendChild(cidade);

        trilhas.appendChild(linha);
      });

      areaTimeline.appendChild(trilhas);
    }

    if (campoFiltro) campoFiltro.addEventListener("input", redesenhar);
    if (botaoLimpar) {
      botaoLimpar.addEventListener("click", function () {
        salvarSelecionados([]);
        redesenhar();
      });
    }

    redesenhar();
  });
})();
