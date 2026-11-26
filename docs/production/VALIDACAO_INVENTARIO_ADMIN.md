# Redesign do inventário ADMIN — validação local

26/11/2026. Continuação das alterações locais existentes; sem reconstrução do editor, novos endpoints ou alteração do esquema. A versão atual reutiliza `guardar/`, Access, validação, revisão de cada ficha, atividade e histórico comercial da migração 0006. Não foram consultados nem alterados dados reais nesta execução.

## Implementação

- Cartões e lista compacta nas vistas por unidade e por modelo. Fotografias 4:3, alternativa sem fotografia, preços quando definidos, tipologias, estados e ações.
- Modelo com quantidades calculadas a partir das unidades reais: disponíveis, reservadas, vendidas, por confirmar/em breve e stock comercial (disponíveis + reservadas). Arquivadas identificadas separadamente e consultáveis, fora do stock. Rascunhos integram a contagem interna, mas não o catálogo público.
- Filtros escolhem os modelos visíveis; os totais e as ações do modelo usam todas as suas unidades, como explicado no painel. Sem grupo explícito, cada casa tem um cartão separado. Não há agrupamento automático por semelhança de nomes.
- Seletor visual com fotografia, nome, referência quando definida, estado comercial/publicação e preço; uma candidata abre diretamente. Cancelar/Escape não grava. Em ecrãs pequenos, a lista desloca-se e o botão Cancelar permanece visível.
- Adicionar unidade abre uma cópia para revisão na ficha existente. Limpa a referência e repõe «A confirmar»; não grava nem publica sem ação explícita. Reserva, cancelamento e venda conservam publicação, características e imagens. Só a unidade escolhida muda.
- Conflito de revisão recebe 409, recarrega o inventário e mostra o erro; não existe repetição automática da escrita.

## Matriz de cobertura específica

Executada em `tests/inventory-admin-browser.mjs`, chamado pelo ensaio `tests/inventory-worker.mjs`, contra Chrome e Worker com D1/R2 efémeros. Os dados QA não são enviados a produção.

| Percurso | Evidência verificada |
| --- | --- |
| Várias candidatas / reserva | Seletor apresenta fotografia, nome, preço e estado; escolhe Alfa, Beta permanece disponível; contagens, API pública e HTML das três categorias acompanham a alteração. |
| Cancelar reserva | Uma candidata dispensa seletor; reservada volta a disponível no ADMIN, API e HTML público. |
| Desistência | Cancelar e Escape fecham, devolvem foco e não alteram a revisão. |
| Venda direta | Disponível → vendida, com atualização de contagens, API, ficha e categoria pública. |
| Última disponível | Disponíveis passa a zero; Reservar fica desativado; a unidade aparece reservada publicamente. |
| Venda da reservada | Reservada → vendida; stock conhecido chega a zero; ação sem candidatas desativada. |
| Preservação / histórico | Comparação de todos os campos anteriores exceto situação; media intactos; sequência exata de estados e autor no histórico comercial. |
| Adição por cópia | Seleção de origem; situação a confirmar e referência vazia; fotos/características copiadas; guardar nova unidade como rascunho deixa original intacta. |
| Rascunho / publicação | Rascunho ausente na API pública e ficha 404; reserva/cancelamento não publicam; publicação pelo editor torna a nova unidade visível. |
| Concorrência | Outra gravação válida torna cartão obsoleto; ação recebe 409, preserva a alteração do outro editor e recarrega quantidades; ação posterior funciona. |
| Segurança | Situação inválida rejeitada com 400; gravação sem JWT rejeitada com 403; revisão não muda. Suite existente cobre origem, assinatura, validade, media e preços inválidos. |
| Filtros / indicadores | Pesquisa com e sem resultados, grupo e tipologia combinados, cada indicador compara quantidade com D1, ordenação por nome/data/preço compara sequência; filtro comercial não trunca totais do modelo. |
| Consulta / navegação | Seleção de unidade arquivada abre ficha correta; regresso mantém vista; arquivada excluída das quantidades comerciais. |
| Unidade sem grupo | Cartão separado; consultar e copiar diretamente sem seletor; abandonar cópia não grava. |
| Dados opcionais | Rascunho sem fotografia/preço mostra alternativas; media reais dos restantes cartões e seletor descodificam no browser. |
| Responsividade | 360, 390, 768, 1024, 1440 e 1920 px; unidades/modelos × cartões/lista = 24 combinações, mais seletor nas seis larguras. Sem scroll horizontal, conteúdo fora do cartão ou sobreposição nas opções; imagens 4:3; cartões na mesma linha com dimensões iguais; indicadores alinhados; Cancelar visível. |

Capturas e resumo regeneráveis em `.qa/inventory-*.png` e `.qa/inventory-admin-evidence.json` (ignorados pelo Git). Os registos `OK · Inventário ADMIN` identificam 18 blocos adicionais, incluindo os seis blocos de resoluções; não são apresentados como novos testes unitários independentes.

## Verificação de regressão

- `npm test`: 36/36, incluindo CRM, inventário, validação, migrações e restauro isolado de cópias sintéticas.
- `npm run check`: sem erros ou warnings; duas sugestões anteriores sobre `beforeunload.returnValue` no CRM/configurações.
- `npm run build:cloudflare`: build e verificador Pages. Aviso conhecido de `getStaticPaths` ignorado na ficha dinâmica; sem falha de build.
- Worker/browser: regressão de formulário, CRM, configurações (rascunho/publicação/recuperação), upload, ficha, arquivo/eliminação, catálogo, favoritos/comparação e tema com recusa de persistência. Percorre também as páginas públicas nas seis larguras.
- `git diff --check`: sem erros.

Reprodução em PowerShell, apenas local:

```powershell
npm test
npm run check
$env:SITE_URL = 'https://www.azmorahomes.pt'
$env:BASE_PATH = '/'
npm run build:cloudflare
$env:TEST_BASE_PATH = '/'
$env:TEST_ADMIN_BROWSER = '1'
npm run test:worker
git diff --check
```

## Limites e publicação futura

Ensaio em Chrome com viewports simulados; não substitui teste físico em iPhone/Android nem login MFA real. Turnstile, email e identidade usam respostas/chaves sintéticas no ensaio integrado. O teste não envia emails reais. As quantidades atualizam-se após ações ou recarregamento, não por sincronização em tempo real entre abas; uma ação com revisão antiga é rejeitada.

O redesign está apenas local. Não foi criada migração, aplicado SQL remoto, alterada infraestrutura, reativado Analytics, feito push ou deployment. A consulta remota anterior registava 0006 pendente; não foi reconfirmada aqui. Para publicar, seguir `ATUALIZACAO_INVENTARIO_0006.md`: backup D1/R2 verificado, restauro isolado, reconfirmação das pendências e migração existente se necessária, publicação autorizada e testes reais. Não reimportar o inventário nem substituir a base. Os responsáveis continuam a confirmar estados e grupos reais no ADMIN.
