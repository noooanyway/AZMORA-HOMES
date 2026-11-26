# Procedimento de publicação e rollback — executar apenas com autorização

> Atualização de 26/11/2026: restauro integral do backup real e ensaio 0006/ADMIN/rollback aprovados. Ver [evidência e limites](RESTAURO_0006_VALIDADO.md). Produção inalterada; atualizar o backup se houve novas escritas e reconfirmar pendências antes da intervenção real.

Preparado para a próxima atualização do projeto Azmora Homes; esta atualização ainda não foi executada em produção. Consultas de leitura em 26/11/2026 confirmaram 0001–0005 aplicadas, incluindo as tabelas de 0005; a única migração local ainda não aplicada é 0006. Confirmar novamente conta, recursos, branch, domínio e deployment de retorno antes da janela. Não executar se alguma etapa falhar. A migração e o deployment são operações distintas: a ordem abaixo mantém o código anterior a funcionar com as tabelas adicionais, sujeito a confirmação no ensaio.

## Antes da janela

1. Os proprietários confirmam conteúdos, textos livres e políticas legalmente validadas; identificam o responsável pelo tratamento e a equipa que receberá pedidos de teste. Não publicar minutas internas. Rever a versão remota e os registos existentes no ADMIN; as consultas remotas desta preparação abrangeram apenas esquema e contagens, não os conteúdos individuais.
2. Confirmar `git status`, branch e remote; identificar commit a publicar e último deployment de produção saudável no painel Pages → Deployments, anotar ID e commit. Confirmar configuração real de build, variáveis, bindings D1/R2, Access, MFA, Turnstile e destinatários. Não alterar a autenticação.
3. Coordenar uma janela de manutenção com os proprietários. Bloquear ou suspender **todas** as fontes de escrita — formulário público, ADMIN, integrações e processos automáticos — de modo comprovável; informar que não serão aceites pedidos durante a pausa. Esperar a conclusão dos pedidos e notificações já em curso e confirmar que não existem estados `sending`/operações pendentes. Se não houver forma verificada de impor a pausa, não iniciar migração/restauro e definir uma janela segura. A mera comunicação à equipa não bloqueia pedidos públicos.
4. Efetuar uma cópia D1 e R2 conforme [Backup e recuperação](BACKUP_AND_RESTORE.md): `pwsh -File .\scripts\backup-manual.ps1`, introduzindo credenciais apenas nos pedidos seguros. Guardar o caminho, data e o manifesto privado; usar cópia cifrada adicional. O script exporta D1 e copia o bucket sequencialmente, pelo que a pausa é necessária para consistência. Verificar novamente:

```powershell
$copia = 'C:\Users\Utilizador\Azmora-Backups-Privados\NOME-DA-PASTA'
.\scripts\backup-manual.ps1 -Verificar -PastaBackup $copia
```

5. Verificar manifesto, hashes, integridade D1 e referências R2. Seguir a secção **Recuperação isolada** de BACKUP_AND_RESTORE.md: recriar D1 e todos os objetos num destino de ensaio separado, preservar chaves e metadados aplicáveis; comparar inventário, estados, fotos, pedidos, histórico e configurações existentes. O script de reposição integral aí documentado recusa bucket de produção e metadados personalizados que não consegue preservar. Não substituir recursos reais pelo ensaio. Se o backup for anterior à 0005, é normal não existirem `site_settings` e `site_settings_history`.
6. Verificar migrações realmente pendentes, na conta e base corretas:

```powershell
npx wrangler d1 migrations list azmora-inventario --remote
```

Comparar a lista com o repositório: a verificação de leitura encontrou 0001–0005 aplicadas e apenas `0006_commercial_history.sql` pendente. Confirmar novamente antes da janela. `migrations apply` aplica **todas** as pendentes, não apenas a 0006. Se a lista divergir ou a tabela de controlo não refletir o estado real, parar e reconciliar sem executar comandos de escrita. Não reaplicar a 0005 nem os imports do catálogo.

## Publicação

7. Após autorização explícita para a janela, e mantendo a pausa de escritas, aplicar só depois da confirmação da lista anterior:

```powershell
npx wrangler d1 migrations apply azmora-inventario --remote
npx wrangler d1 migrations list azmora-inventario --remote
```

Confirmar sucesso, a tabela `inventory_commercial_history`, o índice e os triggers de 0006, sem alterar dados pré-existentes. Validar uma nova cópia exportada e o respetivo histórico. Em falha, manter a pausa e investigar: não repetir cegamente.
8. Confirmar o commit final, branch e remote com `git status`, `git log -1 --oneline` e `git remote -v`. O responsável faz `git push <remote-confirmado> <branch-confirmada>` apenas após aprovação. Se o Pages estiver ligado à branch de produção, o push pode iniciar automaticamente o build e deployment. Confirmar no painel a ligação e o resultado; não fazer um segundo deployment manual sem necessidade. Um preview separado deve usar recursos isolados, nunca a D1 de produção para testes mutáveis.
9. Confirmar a versão servida no domínio, cabeçalhos/canonical/SEO, catálogo e imagens, favoritos, comparação, tema, preferências e redes diretas. No DevTools com cache desativada e Preserve log, testar primeira visita, aceitação, recusa, retirada e navegação. Procurar `cloudflareinsights`, `beacon.min.js` e `/cdn-cgi/rum` no HTML, recursos e Network; não deve haver beacon ou pedidos. Rever no painel se Web Analytics e injeção do Pages estão efetivamente desligados. Parar a publicação se surgir medição não autorizada.
10. Testar Access/MFA, autorização/rejeição, rascunho privado, publicação e recuperação com valores sintéticos previamente acordados, sem substituir conteúdos reais de forma irreversível. Fazer um pedido sintético de formulário após reabrir essa via de forma controlada; confirmar Turnstile, CRM, notificação, destinatário e estado sem divulgar dados. Registar e limpar o teste conforme procedimento acordado. Testar desktop/móvel e conferir sitemap. Reabrir as restantes escritas apenas depois de validação e comunicar conclusão.

## Rollback sem apagar dados posteriores

1. Suspender de novo todas as escritas e confirmar que pedidos e notificações em curso terminaram. Exportar e verificar **um novo backup do estado atual**, incluindo pedidos, histórico, alterações de inventário, configurações e R2 posteriores ao primeiro backup. Registar estados pendentes/sending e eventos já enviados para impedir notificações duplicadas. Preservar ambos os backups e registo de ações.
2. Para regressar apenas ao código, no painel Pages → Deployments → menu do deployment de produção saudável → **Rollback to this deployment**. Verificar domínio, Access e funcionalidades. Isto não restaura a base e preserva os dados se a versão anterior for compatível com o esquema atual; não apagar as tabelas de 0005 nem o histórico de 0006. A compatibilidade do código antigo com qualquer escrita nova tem de ser avaliada antes de reabrir o ADMIN.
3. Se for indispensável reverter dados/esquema, não restaurar o snapshot antigo por cima da D1 ativa. Restaurar numa D1 e bucket isolados; reconciliar por identificador e revisão os pedidos, históricos, alterações e objetos posteriores, incluindo eliminações e notificações, com comparação e ensaio. Não existe neste projeto um procedimento automatizado comprovado que garanta essa reconciliação; manter escritas suspensas até existir plano validado e autorização. Só efetuar a troca/reposição após conferir todas as diferenças. Não alegar perda zero enquanto a reconciliação e a captura de pedidos em trânsito não forem demonstradas.
4. **Não usar Time Travel diretamente na D1 ativa como rollback sem perda:** a operação sobrescreve a base e cancela transações em curso. Um bookmark anterior não inclui R2 nem incorpora automaticamente mudanças posteriores. Se for considerado numa emergência, preservar primeiro o estado atual e acordar reconciliação e autorização específicas. Após restabelecimento, validar catálogo, CRM, acesso, formulários e notificações, e só depois terminar a pausa.

Referências oficiais: [migrações D1](https://developers.cloudflare.com/d1/wrangler-commands/), [rollback Pages](https://developers.cloudflare.com/pages/configuration/rollbacks/), [Time Travel D1](https://developers.cloudflare.com/d1/reference/time-travel/), [integração Git Pages](https://developers.cloudflare.com/pages/configuration/git-integration/).

## Revisão local dos textos e da falha intermitente

- A página inicial padrão usa uma descrição genérica; Sobre Nós e catálogo referem Açores e Madeira; textos regionais pedem confirmação de viabilidade, sem afirmar entrega garantida. A FAQ livre sobre preços negociáveis/financiamento mantém uma afirmação comercial que os proprietários devem confirmar; não existe campo comercial central próprio para ela. Os proprietários devem também confirmar ilhas, transporte, descarga, IVA, custos, visitas, inspeção e equipamentos. As respostas comerciais automáticas usam campos centrais. A afirmação duplicada sobre mobiliário no guia foi substituída pela informação central de inspeção. Termos legais não foram alterados.
- Dados editados e publicados na D1 remota não foram lidos; é indispensável rever descrições e perguntas personalizadas reais no ADMIN. Não se pode garantir ausência de contradições nesses conteúdos.
- O teste antigo falhou em `tests/consent-browser.mjs`, na contagem imediata da tabela após clicar em comparar. A verificação usava `count()` instantâneo, sem aguardar a renderização; o teste passou a aguardar a tabela visível. Duas execuções simultâneas com o smoke test e outra com atraso de 400 ms em scripts passaram em 390/768/1440 px. Isto apoia uma hipótese de sincronização do teste, mas a falha anterior não foi reproduzida com rastreio; não se pode excluir definitivamente uma corrida da aplicação nem atribuir o erro com certeza à interferência entre testes.
- `tests/migration-0005.test.mjs` aplica 0001–0004 e 0005 em SQLite isolado, com inventário e pedido sintéticos, compara tabelas anteriores, integridade e triggers de CRM e histórico de configurações. Não reproduz um export real nem comprova quais as migrações aplicadas na produção.
