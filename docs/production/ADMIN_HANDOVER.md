# Manual operacional e entrega

## ADMIN

1. Abrir https://www.azmorahomes.pt/admin. Entrar com email autorizado e concluir MFA. Não partilhar códigos.
2. Inventário → Adicionar casa; preencher campos conhecidos, adicionar fotos e guardar rascunho. Usar Pré-visualizar e Publicar apenas depois de rever. Para editar, procurar a casa, abrir, alterar e guardar. Reservada/vendida são estados comerciais; arquivar/despublicar retira a ficha do catálogo. A exclusão definitiva pede confirmação e deve ser usada com cuidado.
3. Pedidos de contacto: pesquisar ou filtrar; abrir a ficha, selecionar estado e acrescentar nota, guardando. A timeline mostra eventos posteriores à ativação e a receção com data original. Para responder, usar Zoho, copiar email e assunto e enviar manualmente; abrir o Zoho não altera o estado do pedido. WhatsApp só aparece com telefone válido.
4. Notificação interna é para a empresa: «aceite» não significa entregue. Se houver falha, aguardar e tentar reenviar; após o prazo seguro consultar Resend em vez de contornar a proteção. Para eliminar, arquivar e guardar, abrir eliminação e confirmar. Email e backups requerem tratamento separado.
5. Em caso de erro não repetir operações destrutivas às cegas; anotar hora e referência do pedido sem publicar dados pessoais e contactar responsável técnico. Arquivar pedido e rever retenção pelo menos mensalmente.

## Adicionar ou revogar administrador

Cloudflare Zero Trust → Access controls → Applications → Azmora Homes ADMIN → Policies → Proprietários Azmora: adicionar email individual. Em Access settings → App Launcher, acrescentar a mesma pessoa à política Azmora App Launcher, se necessário. Em Workers & Pages → azmora-homes → Settings → Variables and Secrets → Production acrescentar email, separado por vírgula, em `ADMIN_EMAILS`; guardar e fazer redeploy segundo as regras da conta. Confirmar método de login One-time PIN ou IdP, e a política de MFA da aplicação. Cada pessoa entra no domínio da equipa `*.cloudflareaccess.com`, Account → MFA devices e regista o seu próprio autenticador. Testar conta permitida, conta recusada e recuperação. Para revogar, remover das duas políticas e de `ADMIN_EMAILS`, invalidar sessões pelo painel Access e redeploy; verificar negação. Ver https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/.

## Serviços e titularidade

Manter inventário privado de proprietário, faturação, métodos de recuperação e administradores para Lusoaloja, Cloudflare, GitHub, Zoho, Resend e destino de backup. Transferir titularidade só pelos processos oficiais de cada fornecedor, confirmando domínio, billing, D1/R2, repositório, acesso Zero Trust e email; adicionar acesso individual antes de retirar acesso antigo e testar. Não confundir permissões individuais com transferência de propriedade e não partilhar credenciais.

## Deployment e rollback

O projeto Pages usa `SITE_URL=https://www.azmorahomes.pt BASE_PATH=/ npm run build:cloudflare`, output `dist-cloudflare/client`, Node 24 quando configurado no build; conferir log real. Rever diferenças, testes e backup antes de aplicar migrações ou publicar. Alterações deste trabalho são locais; não há novas migrações SQL. Publicação só após aprovação do proprietário. Se houver problema, Pages → Deployments → deployment anterior → Rollback; isso não reverte D1 nem R2. Não restaurar D1 integralmente para reverter código sem plano para preservar dados posteriores. Validar home, catálogo, fotos, ADMIN/MFA, formulário, CRM e email com dados fictícios, e conferir a URL pública do logo.

**Backup:** o agendamento de backups foi adiado por decisão do proprietário; o procedimento atual é manual. Antes de migrações, seguir `BACKUP_AND_RESTORE.md`. Não publicar ou ativar a proposta automática arquivada sem nova autorização.

## Configurar Search Console após publicação

1. Abrir https://search.google.com/search-console/ com a conta da empresa → Adicionar propriedade → Prefixo do URL.
2. Introduzir `https://www.azmorahomes.pt/`. Escolher o método de verificação proposto e seguir as instruções do Google. Se escolher DNS, é necessária uma alteração manual na Cloudflare; não alterar DNS sem autorização e não retirar registos existentes.
3. Depois de verificada a propriedade, abrir Sitemaps, introduzir `sitemap.xml` e selecionar Enviar. Confirmar que a última leitura foi bem-sucedida e que aponta para https://www.azmorahomes.pt/sitemap.xml.
4. Usar Inspeção de URL para a página inicial e uma ficha pública; rever cobertura e canónicos. Não submeter `/admin`, pré-visualizações nem fichas despublicadas. `robots.txt` não substitui autenticação. Documentação: https://support.google.com/webmasters/answer/34592 e https://support.google.com/webmasters/answer/7451001.

## Limpeza de ensaios — sem remoção automática

O proprietário comunicou pedidos e casas fictícias usados em testes; os detalhes atuais não foram inspecionados para evitar recolha de dados pessoais. No ADMIN, procurar nomes/referências claramente identificados pelo proprietário como teste, confirmar se não são pedidos reais e, um a um, arquivar e eliminar depois da confirmação. Verificar separadamente emails e fotografias de teste; não apagar objetos R2 diretamente sem identificar outras referências. Caso a identificação seja ambígua, manter e pedir confirmação. Repetir revisão após validar os testes sintéticos de produção. A limpeza não foi efetuada.

### Amostra de dados possivelmente fictícios

Consulta agregada de leitura, sem revelar conteúdo ou alterar registos: 1 pedido com `teste` no nome ou mensagem e 1 casa com `teste` no nome ou slug. São apenas correspondências textuais, não prova de que sejam dados fictícios. No ADMIN, procurar `teste` no inventário e rever os pedidos individualmente (a pesquisa do CRM não abrange o texto da mensagem). Confirmar com o proprietário antes de arquivar ou apagar; não foram eliminados.

## Comandos de publicação preparados — não executados

Antes de `git add`, rever todos os ficheiros mostrados por `git status --short`, incluindo não rastreados. O ficheiro `docs/production/templates/backup.yml.disabled` é um modelo inativo; `scripts/backup.sh` também permanece inativo. Confirmar que nenhum backup, `.env`, token, dados de clientes ou ficheiro indesejado será incluído. O push em `main` pode iniciar automaticamente o deployment Cloudflare; só o executar com autorização.

```powershell
Set-Location 'C:\Users\Utilizador\Documents\ChatGPT\AZMORA HOMES'
git status --short
git diff --check
git add -- .env.example .github/workflows/deploy.yml .gitignore README.md cloudflare/access.mjs cloudflare/contact-panel.mjs cloudflare/panel.html docs/VALIDACAO.md docs/LANCAMENTO_AZMORA.md docs/production src/components/PurchaseGuide.astro src/data/company.json src/lib/site.ts ':(literal)src/pages/casas/[slug].astro' src/pages/index.astro src/pages/privacidade.astro src/pages/sobre.astro src/pages/termos.astro scripts/backup-manual.ps1 scripts/backup.sh scripts/backup_manual_verify.py scripts/backup_verify.py tests/backup-manual.test.mjs tests/backup_verify.test.mjs tests/browser-smoke.mjs tests/inventory-worker.mjs tests/inventory.test.mjs
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only
# Rever o conteúdo selecionado e só então executar, se autorizado:
git commit -m "Preparar lançamento e reforçar segurança e acessibilidade"
git push origin main
```

Depois do deployment automático: confirmar commit, build command e sucesso; testar páginas, fotografias, menu, formulário/Turnstile, notificação, autenticação Access/MFA, edição e contacto sintéticos; confirmar sitemap/canonical; verificar eventual estado de falha ou entrega do email. Não aplicar 0004 novamente: o proprietário confirmou que já está em produção. Nenhuma migração nova foi criada nesta revisão. Se ocorrer erro, no Pages selecionar deployment anterior → Rollback; não reverter D1 ou R2 sem plano e autorização, pois dados posteriores podem perder-se. Confirmar que o deployment anterior protege os aliases e funciona no domínio.
