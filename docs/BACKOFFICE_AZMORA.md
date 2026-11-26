# Backoffice da Azmora Homes

## Atualização local — stock e anúncio por modelo (26/11/2026)

- **Adicionar stock** permite indicar de 1 a 50 casas físicas e escolher Disponíveis ou Por confirmar. Copia as características da unidade escolhida, associa automaticamente o grupo de origem e mantém a sua publicação. Quantidades são sempre calculadas a partir das fichas físicas, não de um número sem registos. Não adicionar cópias de teste para representar stock real.
- **Adicionar unidade / Duplicar ficha** mantém a edição detalhada; ao guardar, associa a nova unidade e a origem ao mesmo grupo. Abandonar a edição não altera a origem.
- **Catálogo público:** um anúncio por grupo explícito, sem quantidades, referências internas ou lista de unidades. Cada categoria inclui o modelo quando existe pelo menos uma unidade publicada nesse estado: um modelo pode aparecer uma vez em Disponíveis, uma vez em Reservadas e uma vez em Vendidas, sem divulgar quantidades. Na ficha única e nas consultas gerais, a disponibilidade dá prioridade a Disponível, Reservada, Por confirmar, Em breve e Vendida. Unidades em rascunho não alteram o anúncio público. A ficha usa as características/preço de uma unidade no estado apresentado; mantém o URL da primeira unidade publicada e redireciona os URLs das outras publicadas. Não agrupa automaticamente casas diferentes da mesma marca.
- **Retirar do inventário / Retirar unidade:** arquiva pelo cartão, retira do stock e da publicação, preservando dados. No cartão de uma unidade arquivada, **Eliminar cópia** exige escrever ELIMINAR. A eliminação afeta apenas a unidade escolhida; não apaga fotografias partilhadas.
- Para corrigir grupos antigos, atribua exatamente o mesmo **Grupo de modelo (interno)** às fichas do mesmo modelo. Casas com características comerciais diferentes não devem ser agrupadas por mera semelhança do nome.
- Quantidades e stock comercial destacados nos cartões são internos. Disponíveis + reservadas formam o stock comercial; vendidas, por confirmar e arquivadas são identificadas separadamente.

Esta atualização de código ainda requer publicação. A atualização dos dados de produção foi autorizada separadamente: 15 casas originais disponíveis/publicadas; três cópias de teste Atlas arquivadas; dois testes anteriores mantidos arquivados.


> **Redesign local de 26/11/2026:** cartões e ações rápidas concluídos; [testes, limites e passos de publicação](production/VALIDACAO_INVENTARIO_ADMIN.md). As instruções de gestão seguintes descrevem esta versão local, ainda sem push/deployment nesta execução.

> **Inventário híbrido — implementação local, ainda não publicada:** a funcionalidade descrita abaixo depende da migração aditiva 0006 e da publicação coordenada do código. Não foi aplicada à D1 remota.

## Gestão por unidade e por modelo

Cada ficha representa uma casa física. **Por unidade** apresenta cada casa com fotografia, nome, situação comercial, publicação, modelo, tipologia e preço (ou «Preço sob consulta»). Use **Abrir ficha** para editar e **← Inventário** para regressar. **Cartões** e **Lista compacta** funcionam nas duas vistas, sem alterar dados nem publicar anúncios.

Em **Por modelo**, cada cartão apresenta a fotografia representativa, grupo, tipologias, disponíveis, reservadas, vendidas, por confirmar/em breve e **stock comercial** (disponíveis + reservadas). As contagens são calculadas a partir das unidades não arquivadas, incluindo rascunhos; não são quantidades editáveis. As arquivadas têm uma contagem separada e continuam acessíveis por **Consultar unidades**, sem integrar o stock. Os totais de publicadas e rascunhos são independentes dos estados comerciais.

Associe unidades do mesmo modelo através de **Grupo de modelo (interno)** na ficha. Uma casa sem grupo aparece separadamente, identificada pelo nome; não é agrupada automaticamente com casas sem relação. O grupo é interno e não substitui a identidade, fotografias, preço ou características individuais.

**Filtros:** pesquisa por nome, marca, modelo e referência; filtros de publicação, situação comercial, grupo e tipologia; ordenação por nome, alterações recentes ou preço crescente. Os indicadores superiores são clicáveis: limpam os outros filtros e mostram as unidades correspondentes. Em vista por modelo, os filtros escolhem os modelos apresentados; as contagens e ações continuam a abranger todas as unidades desse modelo. O painel informa esta distinção.

**Ações no cartão de modelo:**

- **Adicionar unidade:** escolha a ficha de origem quando há várias. Abre uma cópia na ficha existente, com fotografias/características/preço para revisão, referência interna vazia e situação «A confirmar». Só cria a unidade ao guardar; a original não é alterada. Reveja todos os dados antes de guardar como rascunho ou publicar.
- **Reservar:** disponível → reservada. **Cancelar reserva:** reservada → disponível. **Registar venda:** disponível ou reservada → vendida. As arquivadas e os estados desconhecidos não são candidatos a estas operações.
- **Consultar unidades:** abre diretamente a ficha quando há apenas uma; com várias, permite escolher, incluindo as arquivadas.
- Quando há várias candidatas, o seletor mostra fotografia, nome, modelo/tipologia/referência, situação/publicação e preço. Não se escolhe por identificadores técnicos. **Cancelar** ou Escape fecha sem gravar; o foco regressa ao botão de origem.
- Uma única candidata dispensa o seletor. As mudanças de situação exigem confirmação com o nome da casa. Os botões sem candidatas ficam desativados.

As ações rápidas conservam o estado de publicação: uma unidade publicada atualiza o catálogo público; um rascunho permanece privado. Fotografias e características não são modificadas. O servidor valida os campos, a autenticação e a revisão; se outra pessoa guardar primeiro, rejeita a operação, o inventário recarrega e mostra o aviso. Reveja o estado atual antes de voltar a agir. As transições ficam no histórico comercial e a gravação no histórico de atividade, com autor e data; requerem a migração 0006 já existente. Este redesign não cria uma nova migração.

O catálogo público mostra separadamente apenas as unidades publicadas disponíveis, reservadas ou vendidas; os estados por confirmar continuam acessíveis pelas fichas já publicadas, sem serem classificados como disponíveis. As casas reservadas e vendidas remetem para alternativas disponíveis. As vendas realizadas após a migração passam a ter histórico comercial. A secção «Casas vendidas» mostra até três casas vendidas e publicadas, dando prioridade às vendas com registo cronológico fiável; as restantes podem aparecer sem data. A secção fica oculta se não houver casas vendidas publicadas. Não se inventam datas de vendas antigas.

> **Estado atual local:** o ADMIN permite editar e publicar configurações em conjunto. A pré-visualização é textual; ao recuperar uma versão, reveja as secções indicadas e o aviso sobre rascunhos. Existem textos comerciais repetidos que ainda precisam de reconciliação antes de usar o editor em produção. As instruções técnicas antigas abaixo são históricas; para operação diária use a secção de configurações no final deste documento.

**Atualização de 24/11/2026:** para o domínio definitivo, contactos, variáveis e comandos de corte, seguir [Preparação final para produção](PRODUCAO_2026-11-24.md). O caminho de produção é agora `/admin/` em `https://www.azmorahomes.pt`; as referências abaixo a `/AZMORA-HOMES/` descrevem a configuração anterior. Não repetir os imports iniciais numa base já existente.

## Utilização pela equipa

Abra **/admin** no domínio comercial. Entre com a sua conta autorizada e valide o segundo fator. O painel mostra o inventário, as contagens e as últimas operações. Em **Adicionar casa**, preencha nome e marca, escolha a situação comercial e guarde um rascunho. Deixe os valores técnicos desconhecidos em branco. Use os campos de referência para medidas indicativas de outros exemplares. A referência interna é editável e o identificador e endereço da ficha são estáveis.

Arraste as fotografias para a ficha ou selecione vários ficheiros. Reveja cada legenda, use **Anterior**, **Seguinte** ou **Usar como capa** e confirme o resultado em **Pré-visualizar**. A pré-visualização é um resumo privado dos campos em edição. **Publicar alterações** atualiza o catálogo, a ficha, as escolhas no formulário, a comparação e o sitemap. Guardar uma ficha publicada como rascunho retira-a do catálogo após confirmação. As alterações à casa só ficam guardadas quando a operação termina com sucesso.

**Duplicar ficha** cria uma nova unidade ao guardar. Confirme as fotografias, o equipamento, o preço e a situação da nova unidade antes de publicar. **Arquivar** retira o anúncio do site. Abra o filtro **Arquivados** para recuperar a ficha como rascunho. A eliminação definitiva exige que a unidade esteja arquivada e que o administrador escreva «ELIMINAR». Se duas pessoas editarem a mesma ficha, a segunda recebe um aviso para a reabrir.

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

## Configurações do website — desenvolvimento ainda não concluído

**Nota histórica:** esta secção descrevia a primeira versão do editor. A migração 0005 foi aplicada e as categorias de conteúdos foram implementadas posteriormente; consultar as instruções mais atuais neste manual e a master checklist. O email público não altera os destinatários do CRM.


## Configurações do website — ensaio local

Na área **Configurações do website**, atualize contactos e redes, textos da página inicial e Sobre Nós, informação comercial, perguntas frequentes, aviso e metadados de pesquisa e partilha. Marque ou desmarque os contactos e redes que devem aparecer; a política de privacidade mantém o seu contacto próprio e não é editável nesta área. A exatidão dos conteúdos é da responsabilidade dos proprietários.

Em perguntas frequentes use **Adicionar pergunta**, **Subir**, **Descer** e **Eliminar pergunta**; desmarque a opção de publicação para a ocultar sem a eliminar. Na página inicial selecione até três casas publicadas e use Subir/Descer para ordenar. Uma casa arquivada ou eliminada deixa de aparecer automaticamente; sem seleção usa-se a seleção automática. Nos avisos ativos indique título, mensagem e data inicial; a data final é opcional e inclusiva. As datas usam o fuso configurado em contactos. A ligação do aviso aceita um caminho interno ou HTTPS.

Para rever antes de publicar, use **Pré-visualizar**: o painel mostra um resumo dos valores, não uma simulação visual integral de todas as páginas. **Guardar rascunho** não altera o site; depois de guardar, use **Publicar alterações** e confirme. O histórico recupera uma versão completa das configurações, substituindo simultaneamente publicado e rascunho. Se outra pessoa tiver alterado as configurações, reabra e volte a aplicar as alterações; não se fundem automaticamente.

Os campos SEO vazios utilizam os metadados automáticos. As alterações são servidas no HTML público após publicação sem novo deployment; o build estático mantém os valores incorporados. Fotografias e casas são geridas no inventário existente. Políticas legais e destinatários de notificações não são editáveis aqui. O uso real em produção só é possível depois de migrar e publicar com autorização e realizar verificações.

**FAQ e informação comercial:** no campo «Origem da resposta», escolha uma área comercial para preencher a resposta automaticamente ou «Resposta personalizada» para texto livre. A pergunta, a ordem e a visibilidade continuam editáveis. A pré-visualização mostra o texto comercial atual do formulário. Revise os textos livres da página inicial, Sobre Nós e perguntas personalizadas para não repetirem condições comerciais, que devem ser mantidas na secção Informação comercial. Perguntas antigas exatamente iguais aos valores originais são associadas automaticamente; perguntas alteradas são preservadas como texto livre.
