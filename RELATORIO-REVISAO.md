# Relatório de revisão — TriânguloLeaks

## Alterações realizadas

- Corrigi a estrutura da página Especial:Genealogia: `main` duplicado, URL canônica malformada e navegação móvel incompleta. Ajustei também o título da página.
- Padronizei a política CSP nas páginas para permitir mapas incorporados do Google e manter imagens locais no próprio site.
- Baixei as imagens que já estavam referenciadas em artigos e 15 imagens adicionais da Wikipédia quando a licença ficou confirmada. As figuras estão armazenadas por slug em `img/wikipedia/`, com carregamento tardio, texto alternativo, legenda e crédito/licença.
- Criei o Banco de imagens com filtros por assunto e licença, e adicionei o filtro de disponibilidade de imagem à busca avançada.
- Gereí o catálogo CSV dos 278 artigos indexados. Ele registra imagem, legenda, licença, fonte e artigos sem imagem local.

## Resultado do inventário

- 278 artigos indexados no site.
- 31 figuras locais em 30 artigos; as legendas e créditos aparecem abaixo das figuras.
- 248 artigos indexados permanecem sem imagem local.
- FamilySearch e Family Tree não foram consultados nem tiveram imagens baixadas: o acesso às fichas requer autorização e as imagens precisam ser conferidas individualmente antes de associá-las a uma pessoa.

## Verificações

- Conferi 324 páginas HTML, links internos e recursos locais: zero referências locais quebradas.
- Conferi a sintaxe dos 34 arquivos JavaScript: sem erros.
- Navegador em viewport móvel: Genealogia renderiza em uma coluna, sem rolagem horizontal.
- Banco de imagens: 31 arquivos exibidos e decodificados, sem falhas; busca textual e filtro de licença funcionam.
- Busca avançada com filtro de imagem: resultados renderizados sem erros de JavaScript.
- A suíte legada `testar.js` iniciou, mas não chegou ao relatório final durante esta revisão; por isso, os fluxos gerais não estão certificados por essa suíte.
