/* ================================================================
   login-config.js — ÚNICO bloco de configuração do login real com
   Google (Google Identity Services / GIS). Para ativar o botão
   "Continuar com Google" em conta-entrar.html/conta-criar.html,
   edite SÓ este arquivo — nenhum outro precisa mudar.

   googleClientId — o "Client ID" OAuth 2.0 (tipo "Aplicativo da Web")
                    criado no Google Cloud Console, em Credenciais,
                    autorizado EXATAMENTE para a origem onde este
                    site está hospedado (ex.: https://seusite.org —
                    o Google recusa o login se a origem não bater).
                    Deixe "" (string vazia) para manter o botão
                    "Continuar com Google" desativado, mostrando um
                    aviso de "login com Google não configurado" —
                    mesmo padrão de js/doacao-config.js para o link
                    de pagamento por cartão.

   Isto NÃO afeta o login por chave de acesso (Passkey/WebAuthn, ver
   js/passkeys.js), que já funciona sem qualquer configuração — é
   uma autenticação real baseada no biométrico/PIN do próprio
   aparelho da pessoa, sem precisar de conta em nenhum serviço
   externo nem de chave de API.
   ================================================================ */
/* ============================================================
   ÍNDICE DO ARQUIVO (gerado/mantido em lote)
   ============================================================
   1. window.TP_LOGIN_CONFIG — objeto único de configuração do
      login real com Google (Client ID OAuth do GIS)
   ============================================================ */
// 1. window.TP_LOGIN_CONFIG — configuração do login real com Google
window.TP_LOGIN_CONFIG = {
  googleClientId: ""
};
