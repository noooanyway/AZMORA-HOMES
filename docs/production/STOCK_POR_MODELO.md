# Stock por modelo — 26/11/2026

## Comportamento implementado localmente

O agrupamento é explícito através de inventory_group. A adição de stock recebe quantidade inteira entre 1 e 50 e situação comercial; cria unidades reais em lote, mantendo a publicação da origem. Inserções e alteração do grupo de origem decorrem na mesma transação D1, condicionadas à revisão original. Duas gravações concorrentes não duplicam stock. A duplicação detalhada também liga origem e nova unidade ao guardar.

O catálogo mostra um anúncio por grupo em cada categoria que tenha unidades publicadas nesse estado. A mesma casa pode constar em Disponíveis, Reservadas e Vendidas; não repete cartões dentro da mesma categoria. O sitemap, a ficha e a API geral mantêm um único URL por grupo. A API com estado recebe a representação da categoria pedida. A secção de vendas na página inicial inclui grupos com vendas mesmo se ainda há unidades disponíveis. As outras fichas publicadas redirecionam temporariamente para o URL representativo. Rascunhos não entram nos cálculos públicos. Não se divulgam quantidades ou identificadores de grupo. O formulário valida disponibilidade pelo mesmo agrupamento. Reservar, vender e arquivar continuam a operar sobre unidades físicas identificáveis.

A ação de retirada pelo cartão arquiva; a eliminação definitiva de uma unidade arquivada requer confirmação explícita. R2 e fotografias partilhadas não são apagados.

## Dados de produção — operação autorizada

O responsável confirmou passar todas as casas originais para Disponível e que as três cópias Atlas eram experiências. Foram publicadas 15 originais e arquivadas as três cópias. Os dois testes anteriores permanecem arquivados. Nenhum registo foi eliminado. API de produção: 15 anúncios, todos disponíveis, zero cópias/testes.

Cópias privadas anterior/posterior e verificação: `C:\Users\Utilizador\Azmora-Backups-Privados\ajuste-stock-2026-11-26`. O ficheiro verification.json regista integridade e preservação. SQL e dados pessoais não entram no repositório. As atualizações usaram revisões específicas para evitar sobrepor edições concorrentes. Históricos anteriores preservados; ator da operação identificado como pedido do utilizador via Codex.

A listagem remota indicou zero migrações pendentes. Não foram aplicadas migrações, alteradas autenticação/infraestrutura ou modificados objetos R2 nesta execução.

## Verificação

- Suite unitária: 59 testes aprovados, incluindo três novos testes do agrupamento público, privacidade e ausência de agrupamentos implícitos.
- Worker/ADMIN completo: reserva, venda, rascunhos, publicação, concorrência, CRM/formulários e browser; cartões/listas nas seis larguras 360/390/768/1024/1440/1920.
- Ensaio específico `tests/stock-worker.mjs`: autenticação, limites de quantidade, gravações concorrentes, um anúncio por grupo, ausência de quantidades públicas e retirada/eliminação pelos cartões. O cenário também testa o diálogo de quantidade no browser.
- Tipos e build Cloudflare verificados; diff check na finalização.

## Limites e publicação

As alterações ao código permanecem locais até push/deployment autorizado. As alterações aos estados já estão em produção. Não é necessária nova migração. Não foram publicados documentos legais preliminares nem ativado Analytics.

A pertença a grupos antigos não se infere de nomes semelhantes. O preço e características da unidade publicada escolhida para representar o estado devem corresponder às unidades reais. Se forem diferentes, manter modelos/anúncios separados ou rever as fichas.


## Correção de categorias — validação local

O cenário misto (disponível + reservada + vendida) foi exercitado através do Worker e do browser: um cartão em cada categoria, mesma ficha, pesquisa/limpeza dos filtros preservam o resultado, venda presente na página inicial e um único URL no sitemap. Rascunhos reservados/vendidos permanecem privados. Não é necessária migração nem alteração dos estados existentes para esta correção.

Testes: `tests/public-models.test.mjs`, `tests/stock-worker.mjs` e regressão `tests/inventory-worker.mjs` com `TEST_ADMIN_BROWSER=1`. A suite unitária passa a 61 testes. Tipos sem erros, build Cloudflare e diff check. Correção de código local, sem push/deployment ou alterações de dados nesta intervenção.
