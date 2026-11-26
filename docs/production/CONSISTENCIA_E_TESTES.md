# Consistência comercial e cobertura local

Estado atual: os campos comerciais alimentam as referências associadas e as FAQ automáticas; os testes locais abrangem os percursos abaixo. Os textos livres devem ser revistos pelos responsáveis para evitar contradições. O registo seguinte preserva as pendências históricas.

## Registo histórico de referências identificadas

| Localização | Conteúdo | Correção necessária |
| --- | --- | --- |
| `src/data/site-content.json`, `home.description` | Destinos e exclusão do continente | Deixar de repetir afirmações que podem divergir de `commercial.islands`, preservando o texto de apresentação editável. |
| `src/data/site-content.json`, `faq` | Preço, transporte, custos, visitas e inspeção | Resolver a duplicação com os campos comerciais sem retirar aos proprietários a edição, ordenação e visibilidade das FAQ. |
| `src/components/PurchaseGuide.astro` | Custos incluídos, excluídos e entrega | Títulos alinhados com campos genéricos; referências fixas redundantes de terreno e ligações omitidas quando há configuração. Confirmar consistência com FAQ e descrição. |
| `src/components/RegionPage.astro` e `src/pages/casas/[slug].astro` | Informação de transporte e custos | Acrescentada a entrega publicada aos valores de transporte, incluídos e excluídos; testar combinações e comparação com FAQ. |
| `src/pages/casas-moveis-acores.astro` e `src/pages/casas-moveis-madeira.astro` | Respostas comerciais incorporadas | São fallback sem configuração publicada; confirmar que todas as respostas dinâmicas relevantes têm fonte única. |
| `src/pages/index.astro`, `src/pages/sobre.astro` | Texto independente editável | Revisar referências sobre âmbito geográfico e outras afirmações quando as decisões comerciais mudam. |
| `src/pages/termos.astro`, `src/pages/privacidade.astro` | Textos legais | Excluídos da alteração automática e sujeitos a revisão legal. |

## Matriz histórica de testes

| Área | Cobertura | Falta |
| --- | --- | --- |
| Campos de conteúdo | Cada campo passa individualmente por validação, gravação em SQLite isolado, publicação e recuperação no módulo de armazenamento | Verificação individual no browser e no HTML de todos os campos |
| SEO | Seis páginas, valores publicados, isolamento do rascunho e canonical no ensaio Worker | Verificação detalhada de fallback e de cada propriedade HTML |
| FAQ | Browser: adição, edição, ocultação, reativação, ordenação e eliminação no editor; publicação de uma pergunta. Teste Worker de pergunta oculta | Publicação e recuperação isoladas para cada operação |
| Destaques | Seleção e exclusão de casa arquivada em teste Worker anterior | Ordenação, eliminação e despublicação individuais |
| Avisos | Validação de campos, intervalo igual, invertido e URL inválido | Apresentação por data e fuso horário, ativa e expirada |
| Concorrência, XSS, autenticação, CRM | Testes automatizados e Worker existentes | Repetir após alterações finais |
| Privacidade | Teste browser de aceitação, recusa, retirada e armazenamento bloqueado | Rever output final e alinhamento da minuta na publicação |
| Backup | Restauro SQLite isolado em testes existentes | Ensaiar backup real em ambiente separado antes da publicação |

Os 33 testes automáticos, build estático e Cloudflare, `astro check`, Worker com Chrome e D1/R2 locais, browser de catálogo e consentimento e `git diff --check` passaram nesta intervenção. Pesquisa no código e nos outputs não encontrou beacon, pixels Meta ou os nomes das minutas legais internas. Isto não verifica configurações remotas.

## Continuação — fonte comercial

As FAQ podem agora referir campos comerciais ou conservar respostas livres. As perguntas originais são associadas apenas quando a pergunta e resposta antigas correspondem exatamente aos valores de origem; texto personalizado não é substituído. Página inicial, fichas e regiões leem os campos comerciais publicados. Os textos livres continuam editáveis e, por definição, não é possível garantir automaticamente que não contenham afirmações contraditórias; devem ser revistos pelos responsáveis.

### Evidência desta continuação

- `tests/inventory-worker.mjs`: valores sintéticos em cada campo comercial, isolamento do rascunho, publicação no HTML das páginas que os utilizam, recuperação, texto legal e pergunta livre; campos da página inicial e Sobre Nós; seis páginas SEO. Os testes seguintes foram acrescentados para execução final: fallback SEO, operações individuais de FAQ com recuperação, aviso ativo/inativo/futuro/expirado e datas inclusivas em dois fusos, ordem de destaques e exclusão após despublicação e eliminação.
- `tests/settings-foundation.test.mjs`: cada campo de conteúdo percorrido individualmente pelo armazenamento, publicação e recuperação; validação de avisos, concorrência e dados inválidos. Isto não substitui um ciclo individual de browser para todos os campos.
- `tests/consent-browser.mjs` e `tests/browser-smoke.mjs`: regressão do painel de privacidade, armazenamento, catálogo e navegação.

Os ensaios descritos foram executados; veja a matriz atual abaixo. As referências livres previamente personalizadas continuam a exigir revisão dos responsáveis.

## Matriz atual de evidência

| Área | Evidência concreta |
| --- | --- |
| Campos comerciais | `tests/inventory-worker.mjs`: oito valores sintéticos, rascunho, publicação, respostas associadas, páginas relevantes, ausência dos valores anteriores e recuperação. |
| FAQ | `tests/inventory-worker.mjs`: adição, edição, eliminação, ordem, ocultação e reativação, cada uma com publicação e recuperação; browser verifica seleção de origem. |
| Destaques | Worker verifica seleção, ordem, arquivo, despublicação, eliminação e recuperação; valores vazios retomam seleção automática. |
| Avisos | Worker verifica ativo, inativo, futuro, expirado e data atual inclusiva em dois fusos; teste de validação cobre intervalos inválidos e URL. |
| Conteúdos e SEO | Valores dos campos da página inicial e Sobre no HTML; SEO das seis páginas, dados publicados, rascunho privado, canónico e fallback. `settings-foundation` verifica cada campo no armazenamento e recuperação. |
| Segurança e privacidade | Testes existentes de Access, XSS, concorrência, CRM, Turnstile e browser de privacidade. Código compilado sem beacon Analytics nem SDK ou pixel Meta identificado. |
| Backups | `tests/backup_verify.test.mjs`: restauro isolado com rascunho, publicação, histórico e conteúdos. |

Limites: não foi realizado ciclo individual no browser para todos os campos; os testes dos campos foram repartidos entre HTML Worker e SQLite. As referências livres e textos previamente personalizados podem conter condições duplicadas e carecem de revisão humana. Não se verificou a infraestrutura remota nesta intervenção.

Execução final: 34 testes automatizados aprovados, check Astro sem erros ou avisos (duas sugestões), builds estático e Cloudflare, Worker/ADMIN local e testes browser aprovados; um teste de comparação falhou durante execução concorrente e passou na repetição isolada. `git diff --check` aprovado.
