/* tema.js — aplica o tema salvo ANTES da pintura, evitando flash.
   Carregado de forma síncrona no <head>. Menos de 1KB. */
/* ============================================================
   ÍNDICE DO ARQUIVO (gerado/mantido em lote)
   ============================================================
   1. IIFE — lê "tp:tema" do localStorage e aplica data-tema no
      <html> antes da 1ª pintura da página, evitando flash de tema
   ============================================================ */
(function () {
  "use strict";
  // 1. Lê "tp:tema" e aplica data-tema no <html> (ou ignora, se
  //    localStorage estiver indisponível, ex.: navegação privada)
  try {
    var salvo = localStorage.getItem("tp:tema");
    if (salvo === "claro" || salvo === "escuro") {
      document.documentElement.setAttribute("data-tema", salvo);
    }
  } catch (e) {
    /* localStorage indisponível (ex.: navegação privada): segue o padrão do sistema */
  }
})();
