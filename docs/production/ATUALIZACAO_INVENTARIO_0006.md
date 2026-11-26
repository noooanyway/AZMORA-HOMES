# Atualização do inventário — migração 0006

> Estado mais recente (26/11/2026): nova consulta remota confirmou **zero migrações pendentes**. A 0006 já está aplicada; não voltar a aplicá-la nem criar outra para stock por modelo. Os passos abaixo são o procedimento histórico, condicionado à listagem real. Ver STOCK_POR_MODELO.md.


> Atualização de 26/11/2026: restauro integral do backup real e ensaio 0006/ADMIN/rollback aprovados. Ver [evidência e limites](RESTAURO_0006_VALIDADO.md). Produção inalterada; atualizar o backup se houve novas escritas e reconfirmar pendências antes da intervenção real.

Preparação local. Não aplicada em produção. As consultas de 26/11/2026 identificaram apenas 0006 pendente; confirmar novamente no momento da intervenção.

1. Rever as alterações locais, obter autorização dos responsáveis e preparar uma versão validada. Confirmar que os responsáveis compreendem que o catálogo Disponíveis ficará vazio enquanto não existir uma unidade publicada marcada disponível.
2. Coordenar janela de manutenção, suspender efetivamente todas as escritas do ADMIN, formulários e integrações e esperar pelos pedidos/notificações em curso. Seguir [publicação e rollback](PUBLICACAO_E_ROLLBACK.md).
3. Fazer backup D1 e R2 conforme [backup e recuperação](BACKUP_AND_RESTORE.md), verificar manifesto e fotografias e testar o restauro num destino isolado. Comparar fichas, estados, preços, imagens, pedidos e históricos. Guardar cópia protegida. Não utilizar os recursos reais como destino de restauro.
4. Listar as pendências: `npx wrangler d1 migrations list azmora-inventario --remote`. Confirmar conta e base, que 0001–0005 estão aplicadas e que apenas `0006_commercial_history.sql` está pendente. Se houver divergência, parar; o comando de aplicação executa todas as pendentes.
5. Antes da operação real, aplicar 0006 à cópia isolada e comparar todos os registos, imagens e pedidos. A migração cria uma tabela, índice e triggers: não altera, classifica, importa ou apaga casas existentes e não cria datas retroativas.
6. Somente após autorização de publicação, backup verificado e ensaio isolado, aplicar na base real com `npx wrangler d1 migrations apply azmora-inventario --remote`; confirmar novamente a lista e a existência da tabela e dos triggers. Se falhar, parar e investigar sem reimportar catálogo nem substituir a base.
7. Publicar a versão validada pelo processo Cloudflare Pages aprovado. Testar estados, categorias, grupos, histórico, catálogo, fotografias, favoritos, formulário e CRM com dados de ensaio autorizados. Garantir que não aparecem quantidades internas ou referências privadas no HTML/JSON público.
8. Reabrir as escritas após validação. Se for necessário voltar ao código anterior, preservar D1/R2 e todos os pedidos e alterações posteriores; não restaurar integralmente uma cópia antiga para fazer rollback de código. Seguir o procedimento de rollback e criar nova cópia do estado atual antes de qualquer intervenção nos dados.

Os grupos são definidos manualmente. O histórico comercial só começa a registar novas alterações depois de 0006; a página inicial também pode mostrar vendas antigas sem data, após as vendas com ordem comprovável, sem lhes atribuir uma data nem as designar como recentes.
