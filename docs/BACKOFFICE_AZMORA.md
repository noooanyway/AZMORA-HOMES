# Backoffice da Azmora Homes

## Utilização pela equipa

Abra **/admin** no domínio comercial. Entre com a sua conta autorizada e valide o segundo fator. O painel mostra o inventário, as contagens e as últimas operações. Em **Adicionar casa**, preencha nome e marca, escolha a situação comercial e guarde um rascunho. Deixe os valores técnicos desconhecidos em branco. Use os campos de referência para medidas indicativas de outros exemplares. A referência interna é editável e o identificador e endereço da ficha são estáveis.

Arraste as fotografias para a ficha ou selecione vários ficheiros. Reveja cada legenda, use **Anterior**, **Seguinte** ou **Usar como capa** e confirme o resultado em **Pré-visualizar**. A pré-visualização é um resumo privado dos campos em edição. **Publicar alterações** atualiza o catálogo, a ficha, as escolhas no formulário, a comparação e o sitemap. Guardar uma ficha publicada como rascunho retira-a do catálogo após confirmação. As alterações à casa só ficam guardadas quando a operação termina com sucesso.

**Duplicar ficha** cria uma nova unidade ao guardar. Confirme as fotografias, o equipamento, o preço e a situação da nova unidade antes de publicar. **Arquivar** retira o anúncio do site. Abra o filtro **Arquivados** para recuperar a ficha como rascunho. A eliminação definitiva exige que a unidade esteja arquivada e que o administrador escreva a referência apresentada. Se duas pessoas editarem a mesma ficha, a segunda recebe um aviso para a reabrir.

## Funcionamento

O build habitual continua a gerar o site estático com o catálogo do repositório. O build Cloudflare reutiliza os componentes Astro e lê a D1 em cada pedido. Apenas as linhas publicadas alimentam o HTML, o JSON público e o sitemap. O Worker entrega imagens do bucket privado apenas quando a chave está associada a uma casa publicada. Os administradores consultam as fotografias por uma rota protegida. A mesma fotografia pode pertencer a duas unidades após duplicação.

As operações de escrita passam pela área protegida, com JWT Access assinado, audiência, emissor, validade, lista de administradores e correspondência de origem para alterações. O MFA é imposto pela política da aplicação Access. A revisão de cada registo impede substituições silenciosas em edições concorrentes. A D1 regista ator, unidade, operação e data. O histórico serve para identificar alterações. A recuperação de conteúdo anterior usa a cópia de segurança.

## Configuração técnica inicial

1. No projeto Cloudflare Pages, associar um domínio próprio e o repositório/branch aprovados. Usar Node 24, comando `npm run build:cloudflare` e diretório de saída `dist-cloudflare/client`. Definir **SITE_URL** com a origem HTTPS pública, sem caminho. **BASE_PATH** usa por defeito `/AZMORA-HOMES` para preservar os caminhos atuais. Para uma instalação deliberadamente na raiz usar `/`. Os campos PUBLIC_CONTACT_* e PUBLIC_FORM_ENDPOINT continuam a seguir o guia existente.
2. Criar a base D1 e um bucket R2 privado. Desativar o endereço público r2.dev e qualquer domínio público do bucket. Copiar `cloudflare/wrangler.example.jsonc` para `wrangler.jsonc` na raiz e substituir o nome do projeto, o ID e nome reais da base e o nome real do bucket. Os bindings são **DB** e **PHOTOS**. Conservar a data e as duas flags de compatibilidade do exemplo. O adaptador anuncia suporte a sessões KV. O painel usa Access e dispensa sessões de aplicação.
3. Antes de ativar as rotas públicas, importar as fotografias com `node scripts/inventory-media.mjs NOME_REAL_DO_BUCKET --remote` e depois executar `npx wrangler d1 migrations apply azmora-inventario --remote` (ajustar o nome caso seja diferente). As migrações criam as tabelas e importam os 16 registos e as suas chaves de media. O carregador usa os ficheiros do catálogo inicial, incluindo miniaturas e capas AVIF, e mantém os caminhos existentes. Repetir a importação inicial das fotos reutiliza as mesmas chaves. Para ensaiar em recursos locais substituir `--remote` por `--local`. Guardar novas alterações de estrutura em migrações numeradas posteriores.
4. Em **Zero Trust → Access controls → Access settings**, ativar MFA independente e permitir aplicação autenticadora TOTP ou chave de segurança. Criar uma aplicação **Self-hosted** para o caminho administrativo completo e seus descendentes no domínio escolhido (por defeito `/AZMORA-HOMES/admin` e `/AZMORA-HOMES/admin/*`). Na aplicação, exigir MFA em cada login, definir uma duração de sessão adequada e configurar uma política **Allow** restrita aos emails dos proprietários. Rever todas as políticas que correspondem à aplicação e remover exceções de bypass. Inscrever cada proprietário no segundo fator e preparar o procedimento de recuperação de acesso.
5. Nas variáveis de **execução** da produção, definir **ADMIN_ORIGIN** com a origem HTTPS exata do domínio autorizado, sem barra final nem caminho, **ACCESS_ISSUER** com a origem HTTPS da equipa terminada em `.cloudflareaccess.com`, **ACCESS_AUD** com a audiência da aplicação e **ADMIN_EMAILS** com os emails autorizados separados por vírgulas. Copiar a audiência a partir da aplicação Access. Estes quatro valores são lidos no servidor. Os tokens das contas e as credenciais do Wrangler ficam fora do repositório e do frontend. Em previews usar recursos de ensaio distintos ou omitir os bindings administrativos.
6. Antes do corte, validar o login real com MFA, a recusa de uma conta fora da lista, o bloqueio nas URLs pages.dev e de preview, uma alteração concorrente e a visibilidade de uma ficha e da fotografia exclusiva após despublicação. Validar também o envio do formulário comercial no novo domínio. Configurar a cache para respeitar as respostas privadas das páginas dinâmicas, da API e das fotografias. Preservar cache apenas para assets estáticos versionados.
7. Fazer o corte de domínio deliberadamente. O endereço github.io continua a servir a versão estática enquanto esse alojamento estiver ativo. Definir o redirecionamento dos endereços antigos e retirar o catálogo estático antigo de circulação para que os clientes consultem o inventário real. Não reutilizar builds estáticos de teste com rascunhos num alojamento público.

[Configuração do MFA na Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/) · [Políticas de MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/mfa-requirements/) · [Validação da assinatura e audiência](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

## Cópias e recuperação

- Antes da migração, de atualizações estruturais e periodicamente, exportar a base para armazenamento privado com `npx wrangler d1 export azmora-inventario --remote --output inventario-backup.sql`. Guardar fora do projeto e identificar data, bucket e versão do código.
- Copiar os objetos R2 para um segundo destino privado com uma ferramenta compatível com a API S3, preservando as chaves. A exportação SQL contém caminhos e dados, enquanto as fotografias ficam no backup dos objetos. Retirar uma fotografia de uma ficha preserva o objeto para outras unidades e para recuperação. Rever periodicamente uploads abandonados e custos de armazenamento.
- Ensaiar o restauro numa D1 vazia com `npx wrangler d1 execute BASE_DE_RESTAURO --remote --file inventario-backup.sql`. Restaurar os objetos para um bucket de ensaio, associar ambos a um ambiente isolado e comparar contagens, estados, últimas alterações e galerias. Só trocar os bindings de produção após a validação. Para recuperação recente consultar também a janela de Time Travel disponível na conta.

## Verificações e dependências

Executar `npm run check`, `npm test` e a compilação estática de produção com o respetivo verificador. Para o ensaio integrado em PowerShell:

```powershell
$env:SITE_URL = 'https://azmora.example'
npm run build:cloudflare
$env:TEST_ADMIN_BROWSER = '1'
node tests/inventory-worker.mjs
```

O ensaio usa D1 e R2 efémeros, chaves geradas para o teste e uma resposta JWKS local. O domínio de ensaio só é usado pelo simulador. O teste de interface requer Chrome instalado. O build de produção usa a origem real definida na Cloudflare.

**Validação das dependências.** A implementação foi validada com Astro 7.4.13 e o adaptador Cloudflare 14.4.9. O build usa uma configuração de compilação separada e coloca o Worker do Pages em `dist-cloudflare/client/_worker.js`. Publique apenas o diretório `client`. O ponto de entrada limita as rotas dinâmicas e os assets estáticos versionados são servidos pelo Pages. Execute `npm audit` ao atualizar o lockfile. A validação local não inclui a política MFA, as permissões nem os backups da conta de produção.
