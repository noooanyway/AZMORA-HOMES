# Inventário de cookies e armazenamento

**Interno — preliminar, não publicar; consulta 25/11/2026. Responsável pelo tratamento e aprovação jurídica pendentes.** Factos observados são identificados; descrições de fornecedores são condicionadas à configuração contratada.

**Precedência:** a consolidação de 25/11/2026 no fim deste documento atualiza e substitui os pontos antigos que lhe sejam contrários. Dados de painel são comunicados pelo responsável, não verificados diretamente nesta intervenção.

Observação limitada: Chrome headless em contexto novo, página inicial de produção, 25/11/2026, sem autenticação nem interações: nenhum cookie, nenhuma chave de localStorage ou sessionStorage. Não prova ausência noutros percursos, desafios ou configurações. Consentimento indicado é avaliação pendente, não afirmação de isenção.

| Elemento | Origem / criação | Conteúdo, duração, necessidade e certeza |
|---|---|---|
| azmora:theme | próprio; escolha de tema | preferência, localStorage persistente até remoção; conveniência solicitada; código confirmado, enquadramento por validar |
| azmora:favoritos | próprio; alterações aos favoritos | identificadores, localStorage persistente até remoção; função solicitada; confirmado em código, qualificação pendente |
| azmora:comparar | próprio; comparação | identificadores, localStorage persistente até remoção; função solicitada; confirmado em código, qualificação pendente |
| sessionStorage | aplicação | nenhuma utilização encontrada no código pesquisado; terceiros e restantes cenários não excluídos |
| cf_clearance | Cloudflare; desafio se emitido | prova de desafio; prazo configurável; não observado; confirmar no browser e avaliar necessidade |
| __cf_bm | Cloudflare; se gestão de bots o emitir | sinais cifrados de pontuação; expira após 30 min de inatividade segundo fornecedor; não observado; configuração e base pendentes |
| CF_Authorization e cookies Access | Cloudflare Access; autenticação | token/sessão de acesso; nome efetivo, atributos e duração configurada por confirmar sem expor valor; não observado em ADMIN autenticado |
| Turnstile | Cloudflare; visita ao formulário/desafio | token e eventuais tecnologias de segurança; nomes, duração e contexto terceiros por verificar |
| beacon Analytics | Cloudflare, script injetado | fornecedor afirma não usar cookies/localStorage para métricas; observado script, payload e outros acessos por confirmar |

Fontes: código src/scripts/site.ts, src/layouts/Layout.astro e src/scripts/contact.ts; https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/ ; https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/ ; https://developers.cloudflare.com/web-analytics/faq/ .

## Atualização da inspeção e do código — 25/11/2026

O Firefox inspecionado pelo responsável após interação apresentou localStorage `azmora:favoritos` e `azmora:theme`; sessionStorage, Cache Storage e IndexedDB vazios. A comparação foi usada sem chave observada: a razão não foi estabelecida. Código `site.ts` define `azmora:comparar`, lê ambas as chaves de listas ao inicializar e escreve JSON ao alterar comparação/favoritos; limpar comparação grava `[]`, não remove a chave; favoritos também podem permanecer como lista vazia. Não expiram por código. Um bloqueio/limpeza ou outra condição pode explicar diferença, mas é hipótese não testada.

`Layout.astro` lê `azmora:theme` no carregamento, grava ao escolher claro/escuro/dourado e remove ao escolher sistema. São leituras antecipadas mesmo na primeira visita; persistência depende do navegador. O código não usa sessionStorage para estas funções. Cada utilização requer avaliação jurídico-funcional; mera preferência não prova exceção legal.

Firefox apresentou `CF_AppS...` (HttpOnly e Secure, Path=/) e `CF_Autho...` (sem HttpOnly, Secure, Path=/, SameSite=None). Nomes truncados são compatíveis com `CF_AppSession` e `CF_Authorization` da documentação Cloudflare, mas correspondência não está verificada integralmente. Não guardar valores. Segundo fornecedor, CF_AppSession é token CSRF por aplicação, 24 h, HttpOnly; CF_Authorization da aplicação é JWT para autorização, duração da política ou aplicação; a sessão global é distinta e não foi confirmada. As opções de cookie Access e observações de navegador são factos diferentes. https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/ .

Pre-clearance Turnstile desativado apenas exclui emissão de `cf_clearance` por essa opção, não por outros mecanismos. A observação em Firefox é pontual, não inventário exaustivo; não repetir login desnecessariamente.
