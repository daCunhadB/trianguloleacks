/* ================================================================
   login-real.js — liga a UI de conta-entrar.html/conta-criar.html
   aos dois métodos de login REAL do site: chave de acesso (Passkey,
   js/passkeys.js) e Google (js/login-google.js, precisa de
   js/login-config.js preenchido). Os demais botões sociais
   (Microsoft/Apple/Protonmail) continuam simulados, como já
   deixado claro no próprio texto do diálogo — só Google e Passkey
   viraram autenticação de verdade nesta versão.
   ================================================================ */
/* ============================================================
   ÍNDICE DO ARQUIVO (gerado/mantido em lote)
   ============================================================
   1. mostrarErro(el, mensagem) / esconder(el) / mostrar(el) →
      helpers de exibição de elementos de erro/aviso
   2. aoLogar(nome, email, elConfirmacao, mensagem) → grava o login
      via TP.definirUsuario, mostra confirmação e trata ?retorno=
   3. ligarPasskeyEntrar()  → liga o botão "Entrar com chave de acesso"
   4. ligarPasskeyCriar()   → liga o botão "Criar chave de acesso"
   5. ligarGoogle()         → liga o botão "Continuar com Google"
   6. (DOMContentLoaded)    → liga os três métodos de login reais
   ============================================================ */
(function () {
  "use strict";

  // 1. Helpers de exibição de mensagens de erro/aviso
  function mostrarErro(el, mensagem) {
    if (!el) return;
    el.textContent = mensagem;
    el.hidden = false;
  }
  function esconder(el) { if (el) el.hidden = true; }
  function mostrar(el) { if (el) el.hidden = false; }

  // 2. Grava o login efetivado e trata o redirecionamento ?retorno=
  function aoLogar(nome, email, elConfirmacao, mensagem) {
    if (!window.TP) return;
    TP.definirUsuario(nome, email || null);
    if (elConfirmacao) {
      elConfirmacao.textContent = mensagem.replace("{nome}", nome);
      elConfirmacao.hidden = false;
      elConfirmacao.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    TP.redirecionarSeHouverRetorno(elConfirmacao);
  }

  // 3. Liga o botão de entrar com chave de acesso (Passkey)
  function ligarPasskeyEntrar() {
    var botao = document.getElementById("botao-entrar-passkey");
    if (!botao) return;
    var avisoIndisponivel = document.getElementById("aviso-passkey-indisponivel");
    var avisoSemCadastro = document.getElementById("aviso-passkey-sem-cadastro");
    var erro = document.getElementById("erro-passkey");
    var confirmacao = document.getElementById("confirmacao-entrar");

    if (!window.TP_PASSKEYS || !TP_PASSKEYS.disponivel()) {
      mostrar(avisoIndisponivel);
      botao.disabled = true;
      return;
    }
    if (!TP_PASSKEYS.temRegistradas()) {
      mostrar(avisoSemCadastro);
    }
    botao.addEventListener("click", function () {
      esconder(erro);
      botao.disabled = true;
      TP_PASSKEYS.entrar()
        .then(function (nome) {
          botao.disabled = false;
          aoLogar(nome, null, confirmacao, "Login com chave de acesso bem-sucedido como \"{nome}\".");
        })
        .catch(function (e) {
          botao.disabled = false;
          mostrarErro(erro, "Não foi possível entrar com a chave de acesso: " + e.message);
        });
    });
  }

  // 4. Liga o botão de criar chave de acesso (Passkey)
  function ligarPasskeyCriar() {
    var botao = document.getElementById("botao-criar-passkey");
    if (!botao) return;
    var avisoIndisponivel = document.getElementById("aviso-passkey-indisponivel-criar");
    var campoNome = document.getElementById("nome-exibicao-passkey");
    var erro = document.getElementById("erro-passkey-criar");
    var confirmacao = document.getElementById("confirmacao-criar");

    if (!window.TP_PASSKEYS || !TP_PASSKEYS.disponivel()) {
      mostrar(avisoIndisponivel);
      botao.disabled = true;
      return;
    }
    botao.addEventListener("click", function () {
      esconder(erro);
      var nome = campoNome ? campoNome.value.trim() : "";
      if (!nome) { mostrarErro(erro, "Escolha um nome de exibição antes de criar a chave."); return; }
      botao.disabled = true;
      TP_PASSKEYS.registrar(nome)
        .then(function (nomeCriado) {
          botao.disabled = false;
          aoLogar(nomeCriado, null, confirmacao, "Chave de acesso criada e conta \"{nome}\" iniciada neste aparelho.");
        })
        .catch(function (e) {
          botao.disabled = false;
          mostrarErro(erro, "Não foi possível criar a chave de acesso: " + e.message);
        });
    });
  }

  // 5. Liga o botão "Continuar com Google" ao login real
  function ligarGoogle() {
    var botao = document.getElementById("botao-login-google");
    if (!botao || !window.TP_GOOGLE_LOGIN) return;
    var dialogo = document.getElementById("dialogo-login-social");
    var textoDialogo = document.getElementById("texto-dialogo-social");
    var confirmacao = document.getElementById("confirmacao-entrar") || document.getElementById("confirmacao-criar");
    var suportaDialog = typeof HTMLDialogElement === "function";

    function avisar(mensagem) {
      if (textoDialogo) textoDialogo.textContent = mensagem;
      if (dialogo && suportaDialog) dialogo.showModal();
      else window.alert(mensagem);
    }

    botao.addEventListener("click", function () {
      if (!TP_GOOGLE_LOGIN.configurado()) {
        avisar(
          "Login com Google ainda não configurado pelo administrador deste site: é preciso " +
          "preencher \"googleClientId\" em js/login-config.js com um Client ID OAuth do Google " +
          "Cloud Console autorizado para esta origem. Sem isso, o botão fica só de demonstração."
        );
        return;
      }
      TP_GOOGLE_LOGIN.iniciar(
        function (nome, email) { aoLogar(nome, email, confirmacao, "Login com Google bem-sucedido como \"{nome}\"."); },
        function (erro) { avisar("Não foi possível entrar com o Google: " + erro.message); }
      );
    });
  }

  // 6. Liga os três métodos de login reais ao carregar a página
  document.addEventListener("DOMContentLoaded", function () {
    ligarPasskeyEntrar();
    ligarPasskeyCriar();
    ligarGoogle();
  });
})();
