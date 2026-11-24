# Plano de produção — progresso

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
