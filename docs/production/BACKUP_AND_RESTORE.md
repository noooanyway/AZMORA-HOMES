# Backup manual e recuperação — decisão do proprietário

O backup automático foi adiado. Não existe workflow de backup em `.github/workflows/`: a proposta anterior foi preservada em `docs/production/templates/backup.yml.disabled` e `scripts/backup.sh`, sem execução automática nem configuração. Não a mover ou ativar sem uma nova decisão. Não há subscrição ou armazenamento externo novo.

## Correção do script — 26/11/2026

A execução das 17:50 ficou incompleta depois da exportação D1. O erro reportado na antiga linha 86 era apenas o `catch` genérico; a operação que falhou foi a primeira listagem R2, na antiga linha 47. Em modo estrito, o acesso a `$page.result_info` lançava erro quando a Cloudflare omitia a propriedade na página final.

Diagnóstico confirmado com GETs, sem escritas remotas: `per_page=1000` devolveu HTTP 200, `success=true` e 146 objetos, sem `result_info`; `per_page=2` devolveu dois objetos e paginação truncada com cursor. O token fornecido tinha acesso funcional; não se deve alargar permissões para resolver este erro. `result_info` e os seus campos são opcionais na [referência oficial da listagem R2](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/objects/methods/list/).

O SQL já descarregado (79 963 bytes) foi restaurado apenas em SQLite em memória: `integrity_check=ok` e `foreign_key_check` sem erros. O SHA-256 antes/depois é igual. A pasta original, incluindo `database.sql`, não foi escrita nem alterada; não contém fotografias nem manifesto. **Não é ainda uma cópia D1/R2 completa.**

A correção está em `scripts/backup-manual.ps1` e `scripts/backup-r2.ps1`:

- Aceita página final sem `result_info`. Uma página cheia sem metadados é seguida por uma consulta `start_after`, evitando presumir que terminou. Rejeita cursor ausente em página truncada, cursor repetido, objetos repetidos e metadados inválidos.
- Faz a listagem inicial antes de exportar D1, detetando falhas de acesso/paginação antes de criar outra exportação.
- Indica etapa, página ou número ordinal do objeto, HTTP e códigos Cloudflare. Usa mensagens conhecidas por correspondência exata; texto arbitrário, URLs, corpo de erros, chaves e dados pessoais são omitidos. Não imprime respostas brutas do Wrangler.
- Não segue redirecionamentos. Respostas HTTP de erro não são gravadas como fotografias. Cada objeto é recebido em memória antes de gravar; o consumo de memória depende do tamanho do maior objeto. Mantém verificação de ETag/tamanho, relistagem e hashes; a ordem das propriedades JSON não provoca uma falsa alteração.
- Preserva os ficheiros já descarregados quando falha. Não retoma nem sobrescreve uma pasta existente; uma nova execução cria uma pasta distinta. A opção `-PastaBackup` é exclusiva da verificação.

Validação específica: `node --test tests/backup-manual.test.mjs tests/backup-r2.test.mjs` — 23 testes aprovados, com dados fictícios e servidor HTTP local para 401/403/404/429/500/502/302, paginação, sanitização, ETag/tamanho, relistagem, falha D1 e preservação de ficheiros. `npm test`: 56/56 aprovados; análise sintática PowerShell sem erros e `git diff --check` sem problemas. Leitura real adicional com o código corrigido: 146 objetos listados e uma amostra lida em memória com tamanho/ETag corretos. Não foi executado outro backup completo de produção, migração, restauro remoto, push ou deployment. Antes de usar a nova cópia para publicação, é necessário concluir e verificar o backup D1/R2 completo conforme o procedimento abaixo.

## Preparação, uma vez

1. Usar o computador Windows do proprietário e confirmar que Node.js 24, Python 3.9 ou superior e as dependências do projeto estão instalados. Abrir PowerShell 7 (`pwsh`) e entrar no projeto:

```powershell
Set-Location 'C:\Users\Utilizador\Documents\ChatGPT\AZMORA HOMES'
npx wrangler whoami
python --version
```

2. Se o Wrangler não estiver autenticado, executar `npx wrangler login` e concluir a autenticação no navegador. Não partilhar tokens nem colocar passwords nos comandos ou na conversa.
3. No painel Cloudflare → R2 → Overview, anotar o **Account ID** de 32 caracteres. Em **Manage API Tokens → Create Account API token**, escolher **Admin Read only** e limitar a conta/validade conforme a interface permitir. Também foi confirmado nesta instalação o token personalizado com **Workers R2 Storage: Read**, limitado à conta correta. Este acesso REST de leitura é ao R2 da conta, não apenas ao bucket. Guardar temporariamente em local seguro e revogar se deixar de ser necessário. Os tokens `Object Read only` do R2 são para a API S3 e **não funcionam** nesta API REST. Ver https://developers.cloudflare.com/r2/platform/troubleshooting/. O script pedirá o token em campo oculto; não o colocar em ficheiros, prints, capturas ou mensagens.
4. Confirmar espaço livre no computador e proteger a pasta com palavra-passe da conta Windows e cifragem do disco (BitLocker, se disponível). O backup não é cifrado pelo script e contém dados pessoais. Verificar a política de retenção com o proprietário.

## Fazer a cópia

Executar:

```powershell
Set-Location 'C:\Users\Utilizador\Documents\ChatGPT\AZMORA HOMES'
.\scripts\backup-manual.ps1
```

Introduzir o Account ID e o token R2 quando solicitado. O script valida primeiro a listagem do bucket `azmora-fotos`, exporta a D1 com o Wrangler, descarrega todos os objetos e respetivos metadados, confere tamanho e ETag, relista o bucket para detetar mudanças, verifica integridade SQLite e referências de fotografias e cria hashes SHA-256. A pasta resultante fica em `C:\Users\Utilizador\Azmora-Backups-Privados\AAAA-MM-DD_HH-mm-ss_identificador`, contendo `database.sql`, `photos`, `r2-metadata.json` e `manifest.json`.

Só uma pasta com manifesto que passe na verificação é uma cópia concluída. Se houver erro, a pasta parcial é mantida para diagnóstico e **não deve ser considerada backup**. Se o R2 mudar durante a cópia, ou contiver nomes que não possam ser representados com segurança no Windows, o processo falha em vez de omitir ficheiros. A D1 e o R2 são obtidos sequencialmente, não num snapshot atómico; evitar alterações de inventário durante o backup. O ETag, tamanho e HTTPS detetam alterações durante a descarga; SHA-256 permite detetar alterações posteriores locais, mas não é uma assinatura externa nem compara obrigatoriamente um hash criptográfico fornecido pelo R2.

Para voltar a verificar uma cópia, substituir o caminho pelo indicado no fim da execução:

```powershell
.\scripts\backup-manual.ps1 -Verificar -PastaBackup 'C:\Users\Utilizador\Azmora-Backups-Privados\NOME-DA-PASTA'
```

O verificador recria a D1 em memória, verifica `PRAGMA integrity_check`, a lista de objetos, os hashes locais e que as imagens referidas pelo inventário existem. Não verifica o conteúdo visual de todas as imagens, nem garante um snapshot temporal atómico. O token não é guardado pelo script. A validação atual da correção está descrita no início deste documento: diagnóstico remoto apenas em leitura, D1 original verificada em memória e backup completo ensaiado com dados sintéticos; ainda não foi concluída uma nova cópia real D1/R2. A API REST R2 impõe limites de frequência; se uma conta tiver muitos objetos, rever os limites e eventuais falhas antes de confiar no procedimento.

## Recuperação isolada — antes de qualquer reposição real

1. Confirmar `manifest.json` e executar o comando `-Verificar` acima. Não restaurar uma cópia que falhe.
2. Com autorização, criar **uma base D1 e bucket R2 de ensaio**, separados dos recursos reais; não usar `azmora-inventario` ou `azmora-fotos` como destino. Rever custos e recursos antes de os criar. Na raiz do projeto:

```powershell
$ensaioSql = 'C:\Users\Utilizador\Azmora-Backups-Privados\NOME-DA-PASTA\database.sql'
npx wrangler d1 execute NOME_DA_BASE_DE_ENSAIO --remote --file $ensaioSql
```

3. Restaurar uma foto selecionada para o bucket de ensaio, preservando a chave e MIME (exemplo WebP):

```powershell
$foto = 'C:\Users\Utilizador\Azmora-Backups-Privados\NOME-DA-PASTA\photos\images\uploads\NOME.webp'
npx wrangler r2 object put 'NOME_DO_BUCKET_DE_ENSAIO/images/uploads/NOME.webp' --remote --file $foto --content-type 'image/webp'
```

Para AVIF usar `image/avif`. Para recuperação integral, carregar **todos** os objetos com as chaves e metadados guardados em `r2-metadata.json`, usando ferramenta S3 compatível; o comando acima recupera apenas uma fotografia e não restaura todos os metadados. Apontar uma instância de ensaio à D1/R2 isoladas e comparar número de casas, estados, pedidos e fotografias sem expor dados de clientes. O procedimento integral com recursos reais de ensaio ainda não foi executado.
4. Para recuperação de produção, primeiro preservar o estado atual, avaliar dados alterados desde a cópia e combinar um plano de manutenção. Restaurar uma base inteira ou substituir imagens pode perder alterações posteriores e requer autorização separada. O rollback do código não restaura dados. Ao restaurar cópias antigas, reaplicar pedidos de apagamento e outras alterações necessárias.

## Rotina e limites

Fazer manualmente antes de cada migração ou publicação importante e com periodicidade acordada (por exemplo, semanal). Testar recuperação trimestral. A Cloudflare D1 Time Travel pode ajudar a recuperar a D1 por uma janela dependente do plano, mas não inclui fotografias nem substitui a cópia. Uma cópia apenas no mesmo computador não resiste à perda, avaria ou ransomware desse computador: o proprietário pode guardar outra cópia cifrada num disco externo desligado, sem subscrever um serviço. Não foi ativada retenção automática nem eliminação de backups.

Não há novo serviço pago. Os pedidos de leitura/listagem e exportação usam as quotas existentes; se forem ultrapassadas, a Cloudflare pode cobrar operações ou limitar o serviço, pelo que não é possível garantir custo zero para qualquer volume: https://developers.cloudflare.com/r2/pricing/. O script não cria recursos nem planos.

### Reposição de todas as fotografias num bucket de ensaio

Após verificar o manifesto e criar o bucket isolado com autorização, executar na raiz do projeto, substituindo os dois valores. Este procedimento só aceita nomes de objeto representáveis pelo script de backup e recusa os buckets de produção. O Wrangler permite repor os metadados HTTP abaixo; **não repõe metadados personalizados**, classe de armazenamento original ou versionamento. Se os metadados personalizados forem necessários, parar e utilizar uma ferramenta S3 que os preserve, após ensaio.

```powershell
$copia = 'C:\Users\Utilizador\Azmora-Backups-Privados\NOME-DA-PASTA'
$bucketEnsaio = 'NOME-DO-BUCKET-DE-ENSAIO'
if ($bucketEnsaio -notmatch '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' -or $bucketEnsaio -eq 'azmora-fotos' -or $bucketEnsaio -eq 'NOME-DO-BUCKET-DE-ENSAIO') { throw 'Indique um bucket de ensaio diferente do bucket de produção.' }
.\scripts\backup-manual.ps1 -Verificar -PastaBackup $copia
if (-not $?) { throw 'Backup inválido.' }
$objetos = @(Get-Content -Raw -LiteralPath (Join-Path $copia 'r2-metadata.json') | ConvertFrom-Json)
foreach ($objeto in $objetos) {
  $chave = [string]$objeto.key
  if ($chave -match '(^|/)\.\.?(/|$)' -or $chave -match '[\\:]' -or $chave.StartsWith('/')) { throw 'Chave inválida.' }
  if ($objeto.custom_metadata -and @($objeto.custom_metadata.PSObject.Properties).Count -gt 0) { throw 'Existem metadados personalizados; usar ferramenta que os preserve.' }
  $ficheiro = Join-Path (Join-Path $copia 'photos') ($chave.Replace('/', [IO.Path]::DirectorySeparatorChar))
  $opcoes = @('wrangler','r2','object','put',"$bucketEnsaio/$chave",'--remote','--file',$ficheiro)
  if ($objeto.http_metadata.contentType) { $opcoes += @('--content-type',[string]$objeto.http_metadata.contentType) }
  if ($objeto.http_metadata.cacheControl) { $opcoes += @('--cache-control',[string]$objeto.http_metadata.cacheControl) }
  if ($objeto.http_metadata.contentDisposition) { $opcoes += @('--content-disposition',[string]$objeto.http_metadata.contentDisposition) }
  if ($objeto.http_metadata.contentEncoding) { $opcoes += @('--content-encoding',[string]$objeto.http_metadata.contentEncoding) }
  if ($objeto.http_metadata.contentLanguage) { $opcoes += @('--content-language',[string]$objeto.http_metadata.contentLanguage) }
  & npx.cmd --no-install @opcoes
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao repor um objeto. O ensaio ficou incompleto.' }
}
```

Não executado sobre recursos reais; ensaiar primeiro com dados fictícios. Objetos podem mudar entre a exportação D1 e a cópia R2; esta verificação deteta alterações observadas durante a listagem, mas não cria um snapshot atómico.

## Base experimental de configurações do website

A migração local `0005_site_settings.sql` prevê rascunhos, publicação e histórico, mas a funcionalidade está incompleta e a migração não está autorizada para produção. O export D1 inclui as novas tabelas se a migração for aplicada. O verificador local confere a presença conjunta, os JSON e a correspondência do publicado com o histórico; restauro sintético isolado foi testado, mas restauro real e validação operacional integral continuam pendentes. Antes de aplicar qualquer migração remota: backup privado D1/R2, atualizar a validação para contemplar o esquema efetivo, testar restauro isolado e obter autorização específica. Não ativar backups automáticos.
