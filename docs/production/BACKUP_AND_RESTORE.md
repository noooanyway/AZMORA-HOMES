# Backup manual e recuperação — decisão do proprietário

O backup automático foi adiado. Não existe workflow de backup em `.github/workflows/`: a proposta anterior foi preservada em `docs/production/templates/backup.yml.disabled` e `scripts/backup.sh`, sem execução automática nem configuração. Não a mover ou ativar sem uma nova decisão. Não há subscrição ou armazenamento externo novo.

## Preparação, uma vez

1. Usar o computador Windows do proprietário e confirmar que Node.js 24, Python 3.9 ou superior e as dependências do projeto estão instalados. Abrir PowerShell 7 (`pwsh`) e entrar no projeto:

```powershell
Set-Location 'C:\Users\Utilizador\Documents\ChatGPT\AZMORA HOMES'
npx wrangler whoami
python --version
```

2. Se o Wrangler não estiver autenticado, executar `npx wrangler login` e concluir a autenticação no navegador. Não partilhar tokens nem colocar passwords nos comandos ou na conversa.
3. No painel Cloudflare → R2 → Overview, anotar o **Account ID** de 32 caracteres. Em **Manage API Tokens → Create Account API token**, escolher **Admin Read only** e limitar a conta/validade conforme a interface permitir. Este token só pode ler, mas o acesso é ao R2 da conta, não apenas ao bucket. Guardar temporariamente em local seguro e revogar se deixar de ser necessário. Os tokens `Object Read only` do R2 são para a API S3 e **não funcionam** nesta API REST. Ver https://developers.cloudflare.com/r2/platform/troubleshooting/. O script pedirá o token em campo oculto; não o colocar em ficheiros, prints, capturas ou mensagens.
4. Confirmar espaço livre no computador e proteger a pasta com palavra-passe da conta Windows e cifragem do disco (BitLocker, se disponível). O backup não é cifrado pelo script e contém dados pessoais. Verificar a política de retenção com o proprietário.

## Fazer a cópia

Executar:

```powershell
Set-Location 'C:\Users\Utilizador\Documents\ChatGPT\AZMORA HOMES'
.\scripts\backup-manual.ps1
```

Introduzir o Account ID e o token R2 quando solicitado. O script exporta a D1 com o Wrangler, lista o bucket `azmora-fotos`, descarrega todos os objetos e respetivos metadados, confere tamanho e ETag, relista o bucket para detetar mudanças, verifica integridade SQLite e referências de fotografias e cria hashes SHA-256. A pasta resultante fica em `C:\Users\Utilizador\Azmora-Backups-Privados\AAAA-MM-DD_HH-mm-ss_identificador`, contendo `database.sql`, `photos`, `r2-metadata.json` e `manifest.json`.

Só uma pasta com manifesto que passe na verificação é uma cópia concluída. Se houver erro, a pasta parcial é mantida para diagnóstico e **não deve ser considerada backup**. Se o R2 mudar durante a cópia, ou contiver nomes que não possam ser representados com segurança no Windows, o processo falha em vez de omitir ficheiros. A D1 e o R2 são obtidos sequencialmente, não num snapshot atómico; evitar alterações de inventário durante o backup. O ETag, tamanho e HTTPS detetam alterações durante a descarga; SHA-256 permite detetar alterações posteriores locais, mas não é uma assinatura externa nem compara obrigatoriamente um hash criptográfico fornecido pelo R2.

Para voltar a verificar uma cópia, substituir o caminho pelo indicado no fim da execução:

```powershell
.\scripts\backup-manual.ps1 -Verificar -PastaBackup 'C:\Users\Utilizador\Azmora-Backups-Privados\NOME-DA-PASTA'
```

O verificador recria a D1 em memória, verifica `PRAGMA integrity_check`, a lista de objetos, os hashes locais e que as imagens referidas pelo inventário existem. Não verifica o conteúdo visual de todas as imagens, nem garante um snapshot temporal atómico. O token não é guardado pelo script. Não foi executado um backup real nesta intervenção; foi testada apenas a verificação com dados sintéticos. A API REST R2 impõe limites de frequência; se uma conta tiver muitos objetos, rever os limites e eventuais falhas antes de confiar no procedimento.

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
