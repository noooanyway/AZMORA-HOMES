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
