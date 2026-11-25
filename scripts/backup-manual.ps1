[CmdletBinding()]
param(
  [switch]$Verificar,
  [string]$PastaBackup
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$project = Split-Path -Parent $PSScriptRoot
$verifier = Join-Path $PSScriptRoot 'backup_manual_verify.py'

if ($Verificar) {
  if (-not $PastaBackup) { throw 'Indique -PastaBackup com a pasta a verificar.' }
  & python $verifier $PastaBackup
  if ($LASTEXITCODE -ne 0) { throw 'A verificação falhou.' }
  return
}

$backupRoot = 'C:\Users\Utilizador\Azmora-Backups-Privados'
$account = Read-Host 'ID da conta Cloudflare (32 caracteres)'
if ($account -notmatch '^[a-fA-F0-9]{32}$') { throw 'ID de conta inválido.' }
$secureToken = Read-Host 'Token Cloudflare com permissão de leitura do R2' -AsSecureString
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
$headers = $null
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  if (-not $token) { throw 'Token em falta.' }
  $headers = @{ Authorization = 'Bearer ' + $token }
  $api = "https://api.cloudflare.com/client/v4/accounts/$account/r2/buckets/azmora-fotos/objects"
  $backupId = (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '_' + [guid]::NewGuid().ToString('N').Substring(0,8)
  $folder = Join-Path $backupRoot $backupId
  $photos = Join-Path $folder 'photos'
  New-Item -ItemType Directory -Path $photos -Force | Out-Null
  Write-Host 'A exportar a base D1...'
  Push-Location $project
  try { & npx.cmd --no-install wrangler d1 export azmora-inventario --remote --output (Join-Path $folder 'database.sql') }
  finally { Pop-Location }
  if ($LASTEXITCODE -ne 0) { throw 'Falhou a exportação D1. A pasta está incompleta.' }

  function Get-ObjectList {
    $all = [System.Collections.Generic.List[object]]::new()
    $cursor = ''
    $seen = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    do {
      $url = $api + '?per_page=1000'
      if ($cursor) { $url += '&cursor=' + [uri]::EscapeDataString($cursor) }
      $page = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -MaximumRedirection 0
      if (-not $page.success -or $null -eq $page.result_info) { throw 'Resposta de listagem R2 inválida.' }
      foreach ($item in $page.result) { $all.Add($item) }
      if ($page.result_info.is_truncated) {
        $cursor = [string]$page.result_info.cursor
        if (-not $cursor -or -not $seen.Add($cursor)) { throw 'Paginação R2 inválida.' }
      } else { $cursor = '' }
    } while ($cursor)
    return $all.ToArray()
  }
  $objects = @(Get-ObjectList)
  $names = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  Write-Host "A descarregar $($objects.Count) objetos do R2..."
  foreach ($item in $objects) {
    $key = [string]$item.key
    $segments = $key.Split('/')
    foreach ($segment in $segments) {
      if ($segment -notmatch '^[a-zA-Z0-9_][a-zA-Z0-9._ -]*[a-zA-Z0-9_-]$|^[a-zA-Z0-9_-]$' -or $segment -match '^(?i:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$') { throw 'Existe uma chave R2 incompatível com nomes de ficheiro Windows; a cópia não foi concluída.' }
    }
    if (-not $names.Add($key)) { throw 'Existem nomes R2 que colidem em Windows; a cópia não foi concluída.' }
    $relative = $segments -join [IO.Path]::DirectorySeparatorChar
    $target = Join-Path $photos $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    $encodedKey = ($segments | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    $response = Invoke-WebRequest -Uri ($api + '/' + $encodedKey) -Headers $headers -Method Get -OutFile $target -PassThru -MaximumRedirection 0
    if ((Get-Item -LiteralPath $target).Length -ne [long]$item.size) { throw 'Tamanho de objeto R2 inconsistente; a cópia não foi concluída.' }
    $receivedEtag = [string]$response.Headers.ETag
    if (-not $receivedEtag -or $receivedEtag.Trim('"') -ne [string]$item.etag) { throw 'Um objeto R2 foi alterado durante a cópia; repita o backup.' }
  }
  $after = @(Get-ObjectList)
  $firstIndex = @{}; $lastIndex = @{}
  foreach ($item in $objects) { $firstIndex[[string]$item.key] = ConvertTo-Json -InputObject $item -Depth 15 -Compress }
  foreach ($item in $after) { $lastIndex[[string]$item.key] = ConvertTo-Json -InputObject $item -Depth 15 -Compress }
  if ($firstIndex.Count -ne $lastIndex.Count) { throw 'O R2 mudou durante a cópia; repita o backup.' }
  foreach ($key in $firstIndex.Keys) { if (-not $lastIndex.ContainsKey($key) -or $firstIndex[$key] -cne $lastIndex[$key]) { throw 'O R2 mudou durante a cópia; repita o backup.' } }
  ConvertTo-Json -InputObject @($objects) -Depth 15 | Set-Content -LiteralPath (Join-Path $folder 'r2-metadata.json') -Encoding utf8
  & python $verifier --criar $folder
  if ($LASTEXITCODE -ne 0) { throw 'A verificação falhou. A pasta está incompleta.' }
  Write-Host "Backup criado e verificado: $folder"
} catch {
  throw 'O backup não ficou concluído. Verifique as permissões, ligação e espaço em disco; uma pasta incompleta pode ter sido criada.'
} finally {
  if ($headers) { $headers.Clear() }
  $token = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
}
