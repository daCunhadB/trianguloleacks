/* =====================================================================
   js/genealogia.js — TriânguloLeaks
   Especial:Genealogia — reúne, num só lugar, todas as pessoas com dados
   genealógicos no índice do site, e cruza esses dados: quem é pai, mãe,
   cônjuge ou filho de quem, quem nasceu no mesmo lugar, quem viveu no
   mesmo período.

   Os dados vêm de window.TP_INDICE (js/indice.js), campo "pessoa".
   Nenhuma consulta externa é feita: o FamilySearch e o Family Tree
   recusam acesso automatizado a partir do ambiente em que este site é
   mantido, e o projeto não afirma números de registro que não pôde
   verificar.

   ÍNDICE DESTE ARQUIVO
   1. Utilidades de normalização e de criação de elementos.
   2. pessoas() — extrai e ordena as pessoas do índice.
   3. construirRelacoes() — liga nomes citados (pai/mãe/cônjuge) a artigos.
   4. montarEstatisticas() — quantas pessoas, com filiação, com cônjuge…
   5. montarFiltros() — preenche os seletores de local e de século.
   6. aplicarFiltros() — busca por nome, parente, local e período.
   7. montarLista() — desenha o resultado, com os vínculos cruzados.
   8. Inicialização.
   ===================================================================== */
(function () {
  "use strict";

  /* 1. ---- Utilidades ---- */
  function norm(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  }
  function el(tag, texto, attrs) {
    var e = document.createElement(tag);
    if (texto !== undefined && texto !== null) e.textContent = texto;
    if (attrs) Object.keys(attrs).forEach(function (a) { e.setAttribute(a, attrs[a]); });
    return e;
  }

  /* 2. ---- Pessoas do índice ---- */
  function pessoas() {
    return (window.TP_INDICE || [])
      .filter(function (i) { return i.pessoa && i.tipo === "artigo"; })
      .sort(function (a, b) { return a.titulo.localeCompare(b.titulo, "pt-BR"); });
  }

  /* 3. ---- Relações cruzadas ---- */
  var porNome = {};
  function construirRelacoes(lista) {
    porNome = {};
    lista.forEach(function (i) {
      porNome[norm(i.titulo)] = i;
      var p = i.pessoa;
      var completo = norm((p.nome || "") + " " + (p.sobrenome || ""));
      if (completo.length > 3) porNome[completo] = porNome[completo] || i;
    });
    lista.forEach(function (i) {
      i._rel = { filhos: [], conjuges: [], pais: [] };
    });
    lista.forEach(function (i) {
      var p = i.pessoa;
      [["nomePai", "pais"], ["nomeMae", "pais"]].forEach(function (par) {
        var alvo = achar(p[par[0]]);
        if (alvo) {
          i._rel[par[1]].push(alvo);
          alvo._rel.filhos.push(i);
        }
      });
      (p.conjuge || "").split(";").forEach(function (nome) {
        var alvo = achar(nome);
        if (alvo && alvo !== i && i._rel.conjuges.indexOf(alvo) === -1) i._rel.conjuges.push(alvo);
      });
    });
  }
  function achar(nome) {
    if (!nome) return null;
    var n = norm(nome);
    if (!n || n.length < 4) return null;
    if (porNome[n]) return porNome[n];
    var chaves = Object.keys(porNome);
    for (var k = 0; k < chaves.length; k += 1) {
      if (chaves[k].indexOf(n) !== -1 || n.indexOf(chaves[k]) !== -1) {
        if (Math.min(chaves[k].length, n.length) >= 10) return porNome[chaves[k]];
      }
    }
    return null;
  }

  /* 4. ---- Estatísticas ---- */
  function montarEstatisticas(lista) {
    var alvo = document.getElementById("gen-estatisticas");
    if (!alvo) return;
    var comFiliacao = lista.filter(function (i) { return i.pessoa.nomePai || i.pessoa.nomeMae; }).length;
    var comConjuge = lista.filter(function (i) { return i.pessoa.conjuge; }).length;
    var comLocal = lista.filter(function (i) { return i.pessoa.localNascimento; }).length;
    var ligadas = lista.filter(function (i) {
      return i._rel.pais.length || i._rel.filhos.length || i._rel.conjuges.length;
    }).length;
    alvo.textContent = "";
    var ul = el("ul");
    [[lista.length, "pessoas com ficha genealógica no índice"],
     [comFiliacao, "com pai e/ou mãe registrados"],
     [comConjuge, "com cônjuge registrado"],
     [comLocal, "com local de nascimento registrado"],
     [ligadas, "ligadas a outra pessoa que também tem artigo aqui"]]
      .forEach(function (par) {
        ul.appendChild(el("li", par[0] + " " + par[1]));
      });
    alvo.appendChild(ul);
  }

  /* 5. ---- Filtros ---- */
  function montarFiltros(lista) {
    var selLocal = document.getElementById("gen-local");
    var selSeculo = document.getElementById("gen-seculo");
    if (selLocal) {
      var locais = {};
      lista.forEach(function (i) {
        var l = i.pessoa.localNascimento || i.local;
        if (l) locais[l] = (locais[l] || 0) + 1;
      });
      Object.keys(locais).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); })
        .forEach(function (l) {
          selLocal.appendChild(el("option", l + " (" + locais[l] + ")", { value: l }));
        });
    }
    if (selSeculo) {
      var seculos = {};
      lista.forEach(function (i) {
        if (typeof i.anoInicio === "number") seculos[Math.floor((i.anoInicio - 1) / 100) + 1] = true;
      });
      Object.keys(seculos).sort(function (a, b) { return a - b; }).forEach(function (s) {
        selSeculo.appendChild(el("option", "Século " + s, { value: s }));
      });
    }
  }

  /* 6. ---- Aplicar filtros ---- */
  function aplicarFiltros(lista) {
    function v(id) {
      var e = document.getElementById(id);
      return e ? e.value.trim() : "";
    }
    var nome = norm(v("gen-nome"));
    var parente = norm(v("gen-parente"));
    var local = v("gen-local");
    var seculo = v("gen-seculo");
    return lista.filter(function (i) {
      var p = i.pessoa;
      if (nome && norm(i.titulo).indexOf(nome) === -1 &&
          norm((p.nome || "") + " " + (p.sobrenome || "")).indexOf(nome) === -1) return false;
      if (parente) {
        var alvo = norm([p.nomePai, p.nomeMae, p.conjuge].join(" "));
        var ligados = norm(i._rel.pais.concat(i._rel.filhos, i._rel.conjuges)
          .map(function (x) { return x.titulo; }).join(" "));
        if (alvo.indexOf(parente) === -1 && ligados.indexOf(parente) === -1) return false;
      }
      if (local && (p.localNascimento || i.local) !== local) return false;
      if (seculo) {
        if (typeof i.anoInicio !== "number") return false;
        if (String(Math.floor((i.anoInicio - 1) / 100) + 1) !== seculo) return false;
      }
      return true;
    });
  }

  /* 7. ---- Lista ---- */
  function linkPessoa(i) { return el("a", i.titulo, { href: i.href }); }
  function montarLista(resultado) {
    var alvo = document.getElementById("gen-resultado");
    var status = document.getElementById("gen-status");
    if (!alvo) return;
    alvo.textContent = "";
    if (status) status.textContent = resultado.length + " pessoa(s) encontrada(s).";
    if (!resultado.length) {
      alvo.appendChild(el("p", "Nenhuma pessoa corresponde a esses filtros."));
      return;
    }
    var tabela = el("table", null, { "class": "wikitable" });
    var thead = el("thead"), tr = el("tr");
    ["Pessoa", "Datas", "Nascimento", "Pai / Mãe", "Cônjuge", "Vínculos no site"]
      .forEach(function (t) { tr.appendChild(el("th", t, { scope: "col" })); });
    thead.appendChild(tr); tabela.appendChild(thead);
    var tbody = el("tbody");
    resultado.forEach(function (i) {
      var p = i.pessoa, linha = el("tr");
      var td1 = el("td"); td1.appendChild(linkPessoa(i)); linha.appendChild(td1);
      linha.appendChild(el("td", (i.anoInicio || "?") + "–" + (i.anoFim || "?")));
      linha.appendChild(el("td", p.localNascimento || "—"));
      linha.appendChild(el("td", [p.nomePai, p.nomeMae].filter(Boolean).join(" / ") || "—"));
      linha.appendChild(el("td", p.conjuge || "—"));
      var td6 = el("td");
      var vinculos = [];
      i._rel.pais.forEach(function (x) { vinculos.push(["filho(a) de", x]); });
      i._rel.filhos.forEach(function (x) { vinculos.push(["pai/mãe de", x]); });
      i._rel.conjuges.forEach(function (x) { vinculos.push(["casado(a) com", x]); });
      if (!vinculos.length) td6.appendChild(document.createTextNode("—"));
      vinculos.forEach(function (par, n) {
        if (n) td6.appendChild(document.createTextNode("; "));
        td6.appendChild(document.createTextNode(par[0] + " "));
        td6.appendChild(linkPessoa(par[1]));
      });
      linha.appendChild(td6);
      tbody.appendChild(linha);
    });
    tabela.appendChild(tbody);
    alvo.appendChild(tabela);
  }

  /* 8. ---- Inicialização ---- */
  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("gen-resultado")) return;
    var lista = pessoas();
    construirRelacoes(lista);
    montarEstatisticas(lista);
    montarFiltros(lista);
    function atualizar() { montarLista(aplicarFiltros(lista)); }
    ["gen-nome", "gen-parente", "gen-local", "gen-seculo"].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) { e.addEventListener("input", atualizar); e.addEventListener("change", atualizar); }
    });
    var form = document.getElementById("gen-form");
    if (form) form.addEventListener("submit", function (ev) { ev.preventDefault(); atualizar(); });
    var limpar = document.getElementById("gen-limpar");
    if (limpar) limpar.addEventListener("click", function () {
      ["gen-nome", "gen-parente"].forEach(function (id) {
        var e = document.getElementById(id); if (e) e.value = "";
      });
      ["gen-local", "gen-seculo"].forEach(function (id) {
        var e = document.getElementById(id); if (e) e.selectedIndex = 0;
      });
      atualizar();
    });
    atualizar();
  });
})();
