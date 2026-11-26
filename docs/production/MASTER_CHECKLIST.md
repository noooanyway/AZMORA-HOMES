> **Atualização de 26/11/2026 — migração 0005:** aplicada na D1 remota por autorização do responsável. Antes da operação foi exportada uma cópia privada da D1 e verificada por restauro SQLite em memória e `integrity_check`; inventário, pedidos e histórico tinham as mesmas contagens após a migração. A lista remota indicou que não restam migrações pendentes. Não foi feita cópia R2 nesta operação e a verificação não garante um snapshot atómico entre serviços. O commit local `6076517`, que melhora o diagnóstico e recuperação do painel, ainda necessita de push e deployment para chegar ao site público. Testar o ADMIN real antes de considerar o problema resolvido.

# Estado atual — preparação para entrega (26/11/2026)

## Concluído localmente

- Gestão do catálogo, CRM e configurações do website; redes sociais, painel de preferências e informação comercial central; testes locais e restauro sintético descritos em `CONSISTENCIA_E_TESTES.md`.
- Quatro minutas internas atualizadas e reunidas, com uma lista única de respostas e checklist de aprovação, em `APROVACAO_FINAL_PROPRIETARIOS.md` e `.txt`. Não estão aprovadas nem publicadas.
- Informação pública local sobre preferências corrigida para distinguir autorização e utilização temporária. Não substituir por minutas incompletas.

## Pendências atuais — uma única lista

- [ ] **Proprietários:** responder apenas às questões do documento de aprovação: identificação do operador e responsável pelo tratamento, contacto de direitos/EPD se aplicável, reclamações/RAL, retenções, titularidade/contratos/transferências, duração da escolha e direitos sobre conteúdos. Esclarecer âmbito de revisão elétrica e canalização apenas se se pretender afirmar que se realiza em todas as casas. Confirmar alterações aos factos comerciais já comunicados e rever dados efetivamente publicados no ADMIN; não se leu a D1 remota.
- [ ] **Jurista/profissional competente:** validar as quatro minutas, enquadramento dos direitos e reclamações, fundamentos, retenções, tecnologias e transferências; resolver os campos pendentes antes da aprovação e publicação.
- [ ] **Programador, após receção dos textos aprovados:** implementar as quatro páginas ou secções e ligações adequadas, atualizar a política ligada no formulário e testar acessibilidade, dispositivos e ausência de conteúdo interno no build. A estrutura atual só tem `/privacidade/` e `/termos/` (informação legal); ainda não disponibiliza quatro documentos finais distintos.
- [ ] **Publicação — adiada:** confirmar configuração/ausência de Analytics e acesso; coordenar backup D1/R2 real, verificação e restauro isolado; listar migrações e aplicar a 0005 apenas com autorização; push/deployment e testes reais conforme `PUBLICACAO_E_ROLLBACK.md`.

**Opcional ou adiado:** backups automáticos e melhorias de segurança previamente adiadas mantêm a decisão anterior. Não se desenvolvem contratos de venda, documentos operacionais ou gerador no ADMIN.

Os registos seguintes são histórico; o estado acima prevalece.


---

> **Estado local mais recente:** campos comerciais centrais e FAQ automáticas implementados; execução de testes locais documentada em [Consistência e testes](CONSISTENCIA_E_TESTES.md). Rever conteúdos livres personalizados antes da publicação e confirmar as pendências legais e operacionais. Os estados seguintes são históricos.

> **Estado histórico da execução anterior:** finalização incompleta; persistem referências comerciais duplicadas e testes funcionais individuais em falta. Consultar [matriz de consistência e testes](CONSISTENCIA_E_TESTES.md). Os registos abaixo são históricos. Não considerar a versão local pronta para publicação.

> **Estado histórico local:** implementação de configurações disponível, mas conclusão funcional e publicação permaneciam pendentes de reconciliação comercial e testes individuais completos. A informação abaixo de intervenções anteriores é histórico, salvo onde explicitamente atualizada. Migração 0005 ainda não foi aplicada remotamente nesta intervenção; documentos legais dependem dos responsáveis e validação jurídica.

> **Ajuste de âmbito — 25/11/2026:** autorizada a preparação interna de quatro minutas para o website (termos de utilização, privacidade, cookies e aviso legal), sujeitas a aprovação dos proprietários e validação jurídica; não publicar incompletas. Investigação aprofundada, contratos de venda, modelos operacionais e gerador ADMIN continuam fora do âmbito. Instagram confirmado, ainda não implementado. Ver [entrega e lista única de pendências](ENTREGA_RESPONSAVEIS.md).

> **Âmbito atualizado — 25/11/2026:** prevalece sobre planos D.3–D.5 anteriores. O programador é responsável pelo desenvolvimento e gestão técnica; proprietários e profissionais competentes decidem e validam matérias comerciais, jurídicas, contabilísticas e de tratamento. A investigação jurídica adicional e a elaboração de contratos/modelos operacionais ficam suspensas; gerador de documentos no ADMIN fora do âmbito atual. A documentação D.2/D.3 é preservada como histórico preliminar. Ver [entrega consolidada e checklist técnica](ENTREGA_RESPONSAVEIS.md). Identificação do responsável pelo tratamento é prioridade imediata. Nenhuma mitigação ou alteração remota foi executada.

# Plano de produção — progresso

**Decisão atual do proprietário:** backups automáticos e fornecedor externo estão adiados. O procedimento atual é manual; ver [backup e recuperação](BACKUP_AND_RESTORE.md). As secções históricas abaixo não autorizam ativar o workflow arquivado.

Escopo autorizado agora: A (CRM), D.1 (logótipo), E.2 (modais). Sem push, publicação, migração remota ou alterações externas.

| ID | Prioridade | Estado | Dependência / aceitação |
|---|---|---|---|
| A | Alta | Testado localmente; validação de produção pendente | CRM, histórico transacional, concorrência, testes locais; migração remota requer autorização |
| D.1 | Alta | Build testado; URL público pendente | PNG original e teste de resposta no build Cloudflare; publicação requer autorização |
| E.2 | Alta | Testado em Chrome mobile; dispositivos reais pendentes | Backdrop, Escape, foco, alterações e testes de browser |
| B/C | Alta | Pendente | Segurança e backups; fora do âmbito atual |
| D.2–D.3 | Média | Pendente | Assinatura e segurança email; fora do âmbito atual |
| E.1/E.3–E.7 | Média | Pendente | Administração, SEO e desempenho; fora do âmbito atual |
| F/G | Média | Pendente | Informação legal, entrega e custos; fora do âmbito atual |

Diagnóstico: exclusão exige estado arquivado e UUID; retry desativado para sent/uncertain; API administrativa sem timeout. A tabela activity é específica do inventário, pelo que não permite histórico de contactos. Histórico requer migração aditiva e testes concorrentes. Zoho documenta mailto como handler do browser, não um deep link universal; usar Zoho europeu e ações de cópia. Produção não alterada.

## Trabalho local — CRM, logótipo e modais

- CRM: histórico D1 por triggers, novas notas individuais, notas antigas preservadas, alterações com revisão, ações Zoho/WhatsApp e notificações; eliminação inclui histórico. Abertura de Zoho não significa envio. Confirmação de eliminação identifica o pedido e exige arquivo.
- Migração local `0004_contact_history.sql`: aplicar apenas depois de backup e autorização; nunca restaurar backup integral para reverter o código porque perderia pedidos posteriores. Rollback de aplicação: deployment anterior; manter as tabelas novas e os dados. Migração é dependência obrigatória antes da publicação do novo código.
- Zoho: abre mail.zoho.eu e permite copiar email e assunto. O Zoho documenta mailto através do handler do navegador, o que não garante abertura na conta profissional: https://www.zoho.com/mail/help/defaultcomposer.html.
- Logótipo: `public/assets/azmora-logo.png`, 40 793 bytes, copiado sem alterações; build inclui o ficheiro e exclui a rota dos pedidos ao Worker. URL de produção e MIME ainda necessitam validação após deployment.
- Modais: fecho com Escape/backdrop, confirmação de alterações, bloqueio durante operação; browser Chrome mobile ensaiado localmente. Não foi validado em dispositivos iOS ou Android reais.
- Configuração e produção: sem alterações remotas. Não foram testados Zoho real, entrega real, URL público ou migração remota. Fases B/C, D.2/D.3, E.1/E.3–E.7, F e G continuam fora do âmbito.
- Antes do corte, consultar `docs/PRODUCAO_2026-11-24.md`, criar backup D1 e listar migrações; rever `0004_contact_history.sql`; executar `npx wrangler d1 migrations apply azmora-inventario --remote` apenas com autorização; depois fazer build/deployment. Testar login, pedido, histórico, reenvio, eliminação com dados fictícios, URL PNG e MFA.

## Revisão pontual da migração 0004

- Corrigido backfill: apenas receção com `created_at` original, sem atribuir administrador nem inventar outros eventos.
- Eventos de notificação automáticos são do sistema; pedidos de reenvio têm ator autenticado. O ator transitório é limpo após gravação, para evitar atribuições indevidas, incluindo no código anterior.
- Os triggers de limpeza não alteram a revisão; testes SQLite cobrem revisões concorrentes e notas repetidas. As notas antigas continuam no campo original e na interface.
- No intervalo de transição, operações SQL da versão anterior foram ensaiadas localmente sobre o novo esquema; não é uma validação de produção. Atualizações feitas por esse código podem ter autor não registado e alterações à nota antiga não geram eventos individuais retroativos.
- Eliminação remove registo e histórico na D1. Emails, cópias exportadas, logs externos e backups são independentes. Os hashes temporários de proteção contra abuso não estão associados ao ID do pedido e expiram conforme a política documentada.
- Revisão de `docs/production/` e `public/assets/`: apenas esta checklist e o PNG original, sem backups, secrets identificados ou metadados EXIF no PNG.

## Atualização em 25/11/2026

O proprietário confirmou backup anterior de 78 452 bytes, aplicação de 0004, preservação de três pedidos, commit `aced950`, deployment e assinatura no Zoho. O checkout local está em `aced950`. Consulta anónima verificou o logo em HTTPS 200/image/png. Teste funcional final do CRM real continua pendente.

| Área | Estado | Evidência e dependências |
|---|---|---|
| B Segurança | Parcialmente testada | `SECURITY_AUDIT.md`; auditoria local, configurações externas e versões antigas pendentes |
| C Backups | Implementação local, não ativada | `BACKUP_AND_RESTORE.md`; fornecedor externo, credenciais e restauro real pendentes |
| D Email | Preparação manual | `EMAIL_CONFIGURATION.md`; MFA, DMARC e testes de cabeçalhos por verificar |
| E Qualidade/SEO | Parcial | contacto e privacidade atualizados; WCAG, métricas e dispositivos reais pendentes |
| F Legal | A aguardar proprietário | `LEGAL_PENDING.md`; dados e validação jurídica |
| G Entrega/custos | Documentação preliminar | `ADMIN_HANDOVER.md`, `COSTS.md`; valores reais, recuperação e transferência pendentes |

As secções mais antigas desta checklist registam o estado à data e não substituem esta atualização. Nenhum recurso externo, migração, push ou deployment foi efetuado nesta intervenção.

### Testes desta intervenção

- `npm run check`: 0 erros e 0 warnings; 2 sugestões registadas no início da verificação (uma variável de teste entretanto removida e API antiga `beforeunload`).
- `npm test`: 21 testes passaram, incluindo dois de backup/restauro sintético e verificações JWT.
- `npm run build:cloudflare` e `npm run test:worker` com Chrome mobile: passaram usando D1/R2 locais e dados sintéticos.
- Build estático de produção e `verify-output`: 25 páginas, 16 fichas e 1374 ligações/recursos verificados.
- `npm audit --omit=dev`: sem vulnerabilidades reportadas.
- Sem execução real do workflow de backup, restic, restauro D1 remoto, notificações de falha, DMARC, verificação dos endpoints de todas as versões ou testes em dispositivos reais. O workflow agendado só entra em vigor se o ficheiro chegar à branch principal: aprovar/configurar antes de fazer push para evitar falhas e custos inesperados.

## Decisão do proprietário — backups manuais

- Backups automáticos e contratação de fornecedor externo **adiados**. O workflow anterior foi deslocado para `templates/backup.yml.disabled`, fora de `.github/workflows/`; a sua implementação fica preservada e inativa.
- Preparado `scripts/backup-manual.ps1` para D1 e R2 na pasta privada local, com manifesto SHA-256, verificações SQLite e de referências; ver `BACKUP_AND_RESTORE.md`.
- Testado com dados sintéticos; cópia real completa, credenciais REST e recuperação integral isolada ainda não validadas. Sem cópia independente do computador, mantém-se risco de perda por avaria ou ransomware. Nenhum backup real foi executado nesta intervenção.
- O backup automático descrito em secções anteriores constitui histórico e **não está ativo**. Esta decisão prevalece sobre as recomendações anteriores.
- Verificações locais desta alteração: `npm test` (24 testes aprovados), incluindo download simulado de duas páginas R2, deteção de alteração com mesmo tamanho e cópia de teste incompleta; build Cloudflare e ensaio do Worker/Chrome mobile passaram. O diálogo de pré-visualização passou a ter nome acessível e foi verificado no navegador. Não foi feito teste real da API R2 ou recuperação remota.

## Finalização técnica — revisão atual

- GitHub `main` e deployment listado apontavam para `aced950`; verificações anónimas não destrutivas em www, pages.dev e quatro aliases devolveram Access/302 ou 404 em cinco rotas administrativas. Amostra limitada; proteção e configurações de todas as versões ainda exigem revisão da conta.
- Site: referências operacionais ao Formspree removidas localmente; email profissional e Zoho refletidos no conteúdo. Condições específicas de IVA, transporte, reserva e retenção ainda não confirmadas foram substituídas por pedidos de confirmação, mantendo pendências legais visíveis; não constitui validação jurídica.
- ADMIN: corrigido retorno ao inventário sem sobrepor editor; bloqueio de navegação durante operações, mensagens de timeout em português e cópia Zoho com fallback; navegação indica secção selecionada. Validar alterações no build local e após publicação.
- Desempenho: imagens locais do catálogo incluem 126 WebP (10,51 MiB) e 16 AVIF (0,54 MiB), maior imagem cerca de 0,29 MiB; os componentes usam lazy loading e variantes, e assets `_astro` são versionados. Não foram obtidos Core Web Vitals reais, Lighthouse ou dados de campo; não alegar desempenho verificado.
- SEO: canonical/sitemap/robots e páginas/fichas são objeto dos testes locais; Search Console e indexação reais dependem de configuração manual. «Como funciona» é secção da página inicial, não uma rota separada. Contas, previews, SPF/DKIM/DMARC e MFA Zoho continuam para verificação manual.
- Backup: continua adiado o automático; não foram desenvolvidas novas funcionalidades de backup nesta fase. Primeira cópia manual real e restauro isolado estão pendentes.

### Evidência da revisão de finalização

- `npm run check`: 0 erros/avisos, 1 sugestão (`beforeunload.returnValue` legado); `npm test`: 24 aprovados.
- Build Cloudflare e Miniflare: passaram com JWT de teste, D1/R2 locais e serviços simulados. Chrome headless em 360, 390, 768, 1024, 1440 e 1920 px verificou largura nas páginas principais, catálogo, uma ficha, contactos, sobre, favoritos, comparação, privacidade, termos e ADMIN; menu móvel e modais com Escape, clique exterior e gesto iniciado no interior. Testes emuladores, não dispositivos físicos.
- Build estático: 25 páginas, 16 fichas e 1374 ligações/recursos locais; canonical, metadados, sitemap, robots e exclusão de ficha arquivada verificados em testes. Não prova indexação real ou WCAG 2.2 AA integral.
- Fluxos de inventário, upload e CRM foram ensaiados com dados fictícios; login/MFA real, entrega de email, todos os previews e recuperação real continuam pendentes. DNS público: um SPF raiz com Zoho, TXT de DKIM Zoho e Resend presentes, DMARC `p=none`; alinhamento requer teste de mensagem.
- Consulta agregada não destrutiva identificou uma casa e um pedido com a palavra `teste`; são possíveis falsos positivos e não foram eliminados.
- `git ls-remote` e lista Pages indicaram `aced950`. Sem alterações staged, sem migrações novas e sem workflow de backup em `.github/workflows/`; pesquisa local de padrões comuns de secrets não encontrou correspondências, não substitui revisão humana do diff. Sem push/deployment.
- O ensaio estático adicional de browser passou: pesquisa/filtros, favoritos persistentes, comparação, navegação, galeria, foco e envio desativado no build estático legado. A função de envio Cloudflare foi verificada separadamente com serviços simulados.

## Fase C comercial — 25/11/2026

- Implementação local, ainda não publicada: contactos comerciais centralizados, telefone e WhatsApp, mensagem por unidade e informação comercial confirmada nas páginas existentes. O formulário e a infraestrutura não foram alterados. Não foi acrescentado botão flutuante.
- Ruben e Filipa: confirmar segundo número, horário, idiomas, morada de atendimento, ilhas efetivamente abrangidas, prazos, reservas e sinais, pagamentos, garantias, assistência, danos no transporte, identificação jurídica, NIF/NIPC, faturação e redes sociais. A informação sobre licenciamento exige validação competente. Não publicar estes elementos como factos antes da confirmação.
- Validação legal/comercial: rever condições comerciais e documentos legais com os responsáveis e assessoria competente; nenhuma condição contratual definitiva foi criada nesta fase.
- Apenas em produção, após autorização e publicação: verificar ligações telefónicas e WhatsApp em equipamentos reais, mensagens das fichas, formulário com Turnstile, receção no CRM e Resend/Zoho, ADMIN/Access, catálogo, sitemap e metadados. Não enviar pedidos reais sem coordenação.
- Backups automáticos continuam adiados. Não foram efetuados push, deployment, migrações ou alterações a serviços.
- Verificação local desta fase: `npm test` (25 testes), `npm run check` (0 erros, 0 avisos e uma sugestão preexistente), build Cloudflare com `SITE_URL` oficial, build estático, `npm run test:worker` com D1/R2 e serviços simulados, browser Chrome headless (incluindo contactos e duas fichas a 390 e 1440 px, mais o ensaio existente desktop/mobile) e `git diff --check`: passaram. A primeira tentativa do browser antecedeu o arranque do servidor e um seletor de teste foi corrigido; o ensaio final passou. Isto não comprova entrega de mensagens nem acessibilidade integral ou dispositivos físicos.

## Fase D — 25/11/2026: em desenvolvimento

O responsável confirmou a Fase C publicada e validada em produção. Confirmados segundo telefone, horário, idiomas, ausência de morada de atendimento e transporte até ao porto. Cobertura de todas as ilhas é intenção provisória sujeita a viabilidade. Identidade jurídica e demais condições contratuais continuam pendentes. Ver `FASE_D_PRELIMINAR.md`: auditoria legal e de privacidade parcial, sem aprovação para publicação. Implementação técnica local não equivale a validação jurídica ou comercial. Backups automáticos continuam adiados.

## Continuação D.1/D.2 — 25/11/2026

- D.1: testes locais passaram; build estático e Cloudflare, 25 testes, check (0 erros/avisos, uma sugestão preexistente), git diff --check, sitemap e metadados. Chrome headless a 390, 768 e 1440 px verificou seis páginas, contactos, dois telefones, WhatsApp e mensagens, rodapé e largura; smoke existente e ensaio Worker/ADMIN com D1/R2 e serviços simulados passaram. Ensaio de ADMIN cobriu 360, 390, 768, 1024, 1440 e 1920 px. Acessibilidade verificada parcialmente por testes de teclado existentes, sem auditoria integral nem dispositivos físicos. Publicação e ensaio real continuam pendentes.
- D.2: sete documentos internos em `privacidade/`; beacon Cloudflare e POST `/cdn-cgi/rum` observados em produção. A auditoria não está integralmente concluída: faltam confirmação manual das configurações, cookies após desafios e login, fornecedores, retenção, transferências e análise jurídica. Informação insuficiente para decidir sobre banner. Nenhuma definição externa foi alterada.


## Consolidação D.2 — recolha manual 25/11/2026

- D.1 mantém-se testada localmente e não publicada; publicação requer autorização e validação posterior. Fase C publicada segundo confirmação anterior.
- D.2: evidências manuais comunicadas sobre RUM ativo e exclusão ADMIN testada, Access, D1/R2, Turnstile, Resend, Zoho e Firefox incorporadas nos sete documentos `privacidade/`. Teste real de formulário/entrega comunicado; não repetido. Sem alteração de configurações nesta intervenção.
- DPA Resend privado existente e analisado; assinatura do fornecedor presente e campos do cliente em branco; entidade contratante e aceitação efetiva por confirmar. DPA Zoho pendente de identificação jurídica; DPA Cloudflare e transferências carecem de verificação contratual aplicável.
- Banner: conclusão jurídica por determinar, incluindo leituras de localStorage na inicialização e beacon RUM. Não se declara conformidade integral; faltam titular, bases, prazos aprovados, garantias de transferências e validação jurídica.
- Melhorias adiadas por decisão do responsável: TFA obrigatório Zoho, política de palavra-passe e alertas de login; substituir credenciais temporárias partilhadas e rever recuperação; avaliar configurações de cookies Access futuramente. Duração global Access e primeiros acessos individuais pendentes.
- D.3–D.5: plano por etapas em `privacidade/CONFIRMACOES.md`; não executadas. Backups automáticos continuam adiados; sem push, deployment, mudanças remotas ou migrações.

## Fase D.3 — investigação preliminar, 25/11/2026

- Criados 15 documentos internos em `legal/`, com matriz de cenários, obrigações, fontes, auditoria do site e questões para responsáveis, jurista e contabilista. Pesquisa documental não constitui parecer nem validação da atividade; investigação ainda não integralmente concluída: versões consolidadas de todos os diplomas, adaptações regionais e regimes municipais exigem confirmação.
- Questões documentadas: critérios de móvel/imóvel, entrega e risco, três anos de conformidade e redução condicional de usados, contratação à distância, preços e informação. Aplicação depende da identidade do vendedor, unidade, cliente, contrato, transporte e enquadramento territorial e fiscal.
- Risco prioritário: site publicado recebe pedidos enquanto declara identidade e morada do responsável por confirmar e apresenta fundamento e retenção por definir. Opções de mitigação em `legal/AUDITORIA_LEGAL_WEBSITE.md` para decisão dos responsáveis e jurista, não executadas. Livro/RAL, seguros, assistência, responsabilidade operacional, DPA e faturação carecem de prova.
- Responsáveis: identificar entidade, cadeia comercial, forma contratual, logística e tratamento. Jurista: classificação, garantias, risco, vendas à distância, reclamações, segurança, RGPD/ePrivacy e normas regionais. Contabilista: atividade, CAE, IVA, margem, faturação e transporte documental. Não atribuir responsabilidades fiscais ou legais sem dados.
- D.4 e D.5: preparar documentos preliminares e modelos somente após esclarecimento e validação, conforme `legal/PERGUNTAS_PARA_VALIDACAO.md`. Melhorias técnicas de privacidade e comercial permanecem propostas, não implementadas. Todas as melhorias Zoho/Access, primeiros acessos, credenciais, backup/restauro e formalização de fornecedores anteriormente adiados permanecem pendentes.
- A D.1 local foi preservada; não houve alteração a código, configurações, migração, commit, push ou deployment nesta fase.


## Redefinição de responsabilidades — âmbito atual

- **Proprietários e profissionais:** identificar responsável pelo tratamento e vendedor; fornecer documentação e decisões comerciais, legais, privacidade e contabilísticas validadas; decidir eventual mitigação provisória. O programador não assume essas funções pela gestão técnica.
- **Programador:** aguardar documentos e decisão, implementar e testar apenas o que for aprovado; D.1 continua local e testada, com publicação dependente de autorização. As opções de suspensão do formulário incluem endpoint, canais alternativos e outros tratamentos, conforme entrega consolidada; nenhuma foi executada.
- **Suspenso/fora do âmbito:** nova investigação jurídica, contratos e documentação operacional; gerador de documentos comerciais no ADMIN. Registos antigos preservados como histórico, sem implicar aprovação.
- **Adiadas:** TFA obrigatório Zoho, política de palavras-passe, alertas, substituição de credenciais temporárias, primeiros acessos/MFA individual, cookies Access, confirmação da duração global, backup manual real e recuperação isolada e formalização de fornecedores. Backups automáticos continuam adiados.


## Minutas do website — preparação interna

- Quatro minutas em `legal/drafts/`: termos de utilização, política de privacidade, política de cookies e aviso legal. Não aprovadas nem publicadas; baseadas nas evidências D.2/D.3 com verificação jurídica pontual, sem constituir parecer.
- Identificação do responsável pelo tratamento continua prioritária; faltam dados legais, critérios de retenção, papéis/contratos, decisões de cookies e aprovação dos responsáveis e jurista. A lista consolidada está em `ENTREGA_RESPONSAVEIS.md`. Não se concluiu que exista ou não obrigação de banner.
- Instagram `https://www.instagram.com/azmorahomes/` confirmado; adição ao código e publicação aguardam autorização apropriada. D.1 e todas as medidas de segurança e backups adiados permanecem intactos.
- Sem mudança de código público, infraestrutura, configurações, MFA, DNS, dados ou serviços; sem commit, push ou deployment.


## Consentimento local e redes sociais — implementação em curso

- Preparado painel de escolha local e ligações diretas Instagram/Facebook; sem SDKs Meta. Persistência de preferências e analytics são opções separadas; sem persistência, escolhas de tema e casas funcionam na página atual. Identificador público `PUBLIC_CF_ANALYTICS_TOKEN` não está configurado por defeito e deve ser fornecido no build apenas após aprovação.
- **Bloqueado para produção:** injeção automática RUM continua ativa em produção; confirmar modo manual em Cloudflare Web Analytics → Manage Site e possível injeção em Workers & Pages → projeto → Metrics; desativar ambas as injeções automáticas aplicáveis e testar preview/produção com autorização. Preservar regra de exclusão ADMIN e verificar que páginas administrativas não incluem beacon. Ver https://developers.cloudflare.com/web-analytics/get-started/ e https://developers.cloudflare.com/pages/how-to/web-analytics/ .
- O beacon manual usa `https://static.cloudflareinsights.com/beacon.min.js`; CSP existente deve ser revista e testada para script-src e conectividade documentada para `https://cloudflareinsights.com`, sem alargar políticas desnecessariamente. Confirmar endpoint real. Cloudflare alerta que `sendBeacon` pode ocorrer ao sair; remover a tag não interrompe execução. A retirada recarrega sem beacon, mas envios pendentes durante a saída ainda não estão comprovadamente bloqueados: resolver e testar antes de publicar. Ver https://developers.cloudflare.com/web-analytics/faq/ .
- Sem alterações remotas; textos legais permanecem preliminares; retenção da escolha, classificação das tecnologias e conformidade exigem validação jurídica. Segurança/backup previamente adiados permanecem inalterados.
- Ensaios de browser locais 390/768/1440 px: escolhas, recusa, aceitação, redes, favoritos e tema, com armazenamento bloqueado e beacon simulado. Um beacon simulado que envia ao sair conseguiu executar o evento `pagehide` na retirada: **falha aberta**, recarregar não prova impedimento de envio pendente; Analytics não deve ser ativado para publicação até existir solução e ensaio com beacon real. Os testes não provam cessação no mundo real.


## Conclusão funcional — Analytics desativado localmente

- Prevalece sobre a proposta de integração manual anterior: o código local deixou de carregar o beacon e não apresenta opção de medição. As métricas Web Analytics não são necessárias ao site. Documentação oficial consultada não identifica API de paragem por retirada; Cloudflare descreve envios ao sair e mudança de visibilidade. Remover tag ou recarregar não garante cancelamento dos envios.
- Produção existente ainda injeta o beacon. Antes de publicar: com autorização, no painel Web Analytics → Manage Site desativar injeção automática; verificar Workers & Pages → projeto → Metrics e qualquer outra fonte de injeção, configuração de regras e todos os domínios/previews; preservar exclusão ADMIN; validar HTML e rede em novo contexto antes/depois da publicação. Não executar remotamente nesta fase. Fontes https://developers.cloudflare.com/web-analytics/get-started/ e https://developers.cloudflare.com/pages/how-to/web-analytics/ .
- Sem consentimento para persistência, a navegação explícita para favoritos e comparação transporta IDs no fragmento do URL, que pode ser visível no histórico ou partilhado mas não é enviado em HTTP; atualização nessa página mantém a seleção. Tema continua apenas na página atual; outras páginas e separadores não partilham estado. Com permissão persistente, utiliza-se localStorage. Não se usa sessionStorage. Verificar enquadramento legal da escolha e armazenamento.
- Ensaio não destrutivo do beacon real na produção atual: GET do script e tentativas POST capturadas/bloqueadas durante navegação/alteração de separador; não foram enviados conteúdos de formulário. A produção não possui painel para ensaiar aceitação ou retirada, pelo que estes cenários não foram testados com o beacon real.

### Auditoria funcional local e pendências de corte

- Diferenças para produção: D.1 inclui segundo telefone, horário/idiomas e porto; redes sociais e painel de preferências estão locais; produção ainda usa beacon automático. Catálogo, formulário, CRM e ADMIN existem e testes locais utilizam dados sintéticos; a validação real de acesso individual e dispositivos físicos permanece pendente.
- Requisito de publicação: desativar injeções automáticas Cloudflare, conferir HTML/rede em preview e produção após autorização. A página pública de privacidade existente descreve preferências como guardadas no navegador sem distinguir a recusa; deve ser alinhada com os textos validados pelos proprietários/jurista antes de publicar as alterações. Minutas permanecem não publicadas. A identidade do responsável pelo tratamento e a informação legal continuam pendentes dos proprietários.
- Funcionamento temporário: tema volta ao padrão noutra página sem persistência; favoritos/comparação atravessam explicitamente para as respetivas páginas através de fragmento, não acompanham toda a navegação nem outro separador, mas sobrevivem ao reload do endereço. É uma limitação deliberada, sem sessionStorage; a classificação jurídica do mecanismo não está resolvida. Persistência aceite funciona via localStorage.
- Autonomia: catálogo e pedidos são geridos no ADMIN existente; contactos comerciais, redes sociais e textos institucionais continuam dependentes de alteração de código e publicação pelo programador. Um editor de políticas ou gerador comercial seria opcional e não foi implementado.
- Testes: 25 testes de backend aprovados; browser headless de consentimento a 390/768/1440 px incluindo recusa, fragmentos, atualização, aceitação, outra aba e armazenamento bloqueado; smoke desktop/mobile; build estático, build Cloudflare e diff check. Ensaio real do beacon limitado à produção existente com POST abortados: a ausência de painel na produção impediu ensaiar aceitação/retirada com o beacon real. Dispositivos físicos, auditoria completa de acessibilidade e métricas reais de desempenho não realizados.

## Gestão de conteúdos pelos proprietários — base local, trabalho por concluir

- **Não implementada para utilização:** ainda não existe nova secção no ADMIN, rota autenticada, publicação ou leitura das configurações nas páginas. Os proprietários continuam a depender do programador para conteúdos institucionais. Não aplicar a migração 0005 nem publicar esta base como funcionalidade concluída.
- Criada a migração local `0005_site_settings.sql` com rascunho, conteúdo publicado, revisão e histórico de publicações, sem modificar o esquema existente. Os módulos de validação e gravação são fundações isoladas, sem ligação ao ADMIN, às páginas ou aos destinatários de notificações. A validação cobre apenas uma estrutura experimental de contactos e duas redes; ainda não cobre todas as categorias, opções de visibilidade ou etiquetas solicitadas.
- Antes da implementação completa: desenvolver editor visual, validação de todas as categorias, autorização dos endpoints, prevenção XSS, rascunho/pré-visualização/publicação/recuperação, concorrência, catálogo e metadados SSR, migração com valores reais existentes e fallback estático. Testar alterações, isolamento de conteúdo legal e CRM, rotas não autorizadas, segurança, navegação, SEO e limites. Não atribuir estado de pronto a produção.
- Migração e backups: não foi aplicada em produção; antes de qualquer migração futura, aprovar separadamente, criar backup completo D1/R2, validar restauro isolado e assegurar que os testes e verificadores de backup cobrem as novas tabelas e histórico. Não ativar backups automáticos.
- Analytics: o responsável confirmou desativação do Web Analytics e ausência do beacon na produção, incluindo confirmação visual no projeto Pages. Não foi reativado. Verificar novamente HTML e rede após eventual deployment futuro. Sem alterações remotas nesta intervenção.
- Verificações de 26/11/2026: `npm test` passou com 27 testes no início desta intervenção e o teste adicional do módulo de gravação passou separadamente; `npm run check` passou com uma sugestão preexistente; builds estático e Cloudflare passaram. O ensaio do Worker com migrações e D1/R2 locais, ADMIN/CRM simulados, browser smoke e consentimento a 390/768/1440 px passaram. Estes testes não verificam uma secção de configurações nem publicação de conteúdos, porque ainda não existem. `git diff --check` passou.


## Gestão do website — continuação local, 26/11/2026

A informação desta secção prevalece sobre a descrição anterior de uma fundação desligada. Foi ligada a categoria local de contactos e redes sociais ao ADMIN e ao HTML público: guardar rascunho, pré-visualizar, publicar e recuperar uma versão, sob autenticação existente e revisão concorrente. Os valores atuais são o fallback antes da primeira publicação. O email público não modifica os destinatários do CRM. Testes locais com D1 sintética verificam que rascunho não altera o site e que publicação/recuperação alteram o HTML; o verificador de backup foi adaptado e ensaiado com restauro sintético.

**Estado histórico nessa intervenção:** página inicial, destaques, Sobre, FAQ, conteúdos comerciais, avisos, SEO institucional e controlos de visibilidade ainda não estavam implementados; a recuperação não foi validada em produção. Não aplicar a migração remota, commit de publicação ou deployment com expectativa de autonomia completa. O verificador aceita backups anteriores ao novo esquema; após migração é necessário confirmar a presença das novas tabelas no backup específico. Cloudflare Analytics permanece desativado segundo confirmação do responsável.
- Testes adicionais da continuação: 29 testes automatizados aprovados; verificação de tipos sem erros/avisos; builds estático e Cloudflare aprovados. Worker com D1/R2 locais e Chrome autenticado verificou edição de contactos e redes, rascunho privado, pré-visualização, publicação no HTML, revisão desatualizada e recuperação da versão inicial. Backups sintéticos com as novas tabelas passaram. As restantes categorias e os respetivos testes continuam por implementar; a função geral não cumpre o critério de conclusão.


## Gestão do website — implementação local alargada

- A implementação local alarga a secção de configurações a página inicial, até três destaques ordenados (apenas casas publicadas), Sobre Nós, FAQ editáveis/ordenáveis/ocultáveis, informação comercial, aviso com datas, SEO e partilha nas páginas abrangidas, além da visibilidade de contactos e redes. As políticas legais e destinatários internos mantêm-se fora do editor.
- O conteúdo é validado no servidor, guardado como documento de rascunho e publicado em conjunto, com revisão otimista e histórico. O ADMIN apresenta pré-visualização em resumo e recuperação de uma versão completa. O HTML público lê apenas o snapshot publicado da D1; fallback usa textos existentes; respostas SSR usam no-store. Não se altera sitemap, canónicos ou robots.
- Antes de publicar: conferir backup privado D1/R2 e restauro isolado; verificar lista de migrações e autorizar aplicação remota da `0005_site_settings.sql`; fazer build Cloudflare e deployment apenas após autorização. Validar acesso, edição, publicação, recuperação e HTML/SEO reais com dados fictícios. O build estático continua com conteúdo incorporado. Não foi feito push, deployment nem migração remota.

- Verificação local desta continuação: 31 testes automatizados, verificação Astro (0 erros/avisos e 2 sugestões), builds estático e Cloudflare, ensaio Worker com D1/R2 simulados e Chrome autenticado, browser de catálogo e privacidade, restauro SQLite isolado e `git diff --check` passaram. O ensaio editou representantes das categorias em conjunto; não comprovou cada campo, cada operação de FAQ ou cada categoria num ciclo separado.
- Limitações: a pré-visualização é um resumo textual, não uma réplica do website. Alguns textos dos blocos informativos e referências comerciais noutras páginas continuam fixos; alterações comerciais e FAQ devem ser revistas em conjunto para evitar inconsistências. A verificação real de infraestrutura, acessibilidade completa e dispositivos físicos está pendente. Por estes motivos não se declara cumprido integralmente o critério de conclusão funcional pedido.

## Continuação de finalização — estado parcial

- A recuperação indica data, autor, secções diferentes e eventual perda de rascunho, com confirmação. A versão publicada anterior permanece no histórico graças ao trigger da migração 0005.
- Textos fixos redundantes de preparação do terreno e ligações são omitidos quando existem configurações comerciais publicadas. Permanecem outras possíveis discrepâncias entre FAQ, descrição da página inicial e conteúdos comerciais editáveis, pelo que não se declara consistência global nem prontidão para publicação.
- As páginas dinâmicas executam uma leitura D1 para configurações em cada pedido renderizado e usam `private, no-store`; não há medições reais de latência nem custo de produção nesta intervenção.

- Backup e reversão: guardar cópia privada da D1 completa e R2, incluindo `site_settings` e `site_settings_history`, e ensaiar restauro isolado antes da migração. Para uma alteração de conteúdos, recuperar no ADMIN uma versão anterior após rever o aviso; para falha de código ou esquema, preparar reversão do deployment e restauro da cópia numa base isolada antes de decidir qualquer alteração remota. A migração 0005 não foi aplicada remotamente nesta intervenção.

- Verificações desta continuação: 31 testes automáticos, check Astro (sem erros ou avisos e duas sugestões), builds estático e Cloudflare, Worker com ADMIN/CRM locais, SEO das seis páginas no HTML, testes browser do catálogo e privacidade e restauro SQLite isolado passaram. O ciclo exaustivo por campo, FAQ e combinações de avisos continua pendente.
