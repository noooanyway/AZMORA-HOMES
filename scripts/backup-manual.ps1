#requires -Version 7.0
[CmdletBinding()]
param(
  [switch]$Verificar,
  [string]$PastaBackup
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$project = Split-Path -Parent $PSScriptRoot
$verifier = Join-Path $PSScriptRoot 'backup_manual_verify.py'
. (Join-Path $PSScriptRoot 'backup-r2.ps1')

if ($Verificar) {
  if (-not $PastaBackup) { throw 'Indique -PastaBackup com a pasta a verificar.' }
  & python $verifier $PastaBackup
  if ($LASTEXITCODE -ne 0) { throw 'A verificação falhou.' }
  return
}
if ($PastaBackup) { throw '-PastaBackup só é usado com -Verificar; as cópias existentes nunca são sobrescritas.' }

$backupRoot = 'C:\Users\Utilizador\Azmora-Backups-Privados'
$account = (Read-Host 'ID da conta Cloudflare (32 caracteres)').Trim()
if ($account -notmatch '^[a-fA-F0-9]{32}$') { throw 'ID de conta inválido: são necessários 32 caracteres hexadecimais.' }
$secureToken = Read-Host 'Token Cloudflare com permissão de leitura do R2' -AsSecureString
$tokenPointer = [IntPtr]::Zero
$headers = $null
$token = $null
$operation = 'Preparação das credenciais'
try {
  $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer).Trim()
  if (-not $token) { Stop-BackupFailure $operation 'Token em falta.' }
  $headers = @{ Authorization = 'Bearer ' + $token }
  $api = "https://api.cloudflare.com/client/v4/accounts/$account/r2/buckets/azmora-fotos/objects"
  $operation = 'Listagem R2 inicial'
  Write-Host 'A confirmar acesso e listagem R2 (só leitura)...'
  $objects = @(Get-BackupR2Objects $api $headers $operation)

  $operation = 'Criação da pasta local'
  $backupId = (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + '_' + [guid]::NewGuid().ToString('N').Substring(0,8)
  $folder = Join-Path $backupRoot $backupId
  $photos = Join-Path $folder 'photos'
  New-Item -ItemType Directory -Path $photos | Out-Null
  $operation = 'Exportação D1'
  Write-Host 'A exportar a base D1...'
  Push-Location $project
  try {
    # Wrangler output may contain provider URLs; never relay raw stdout/stderr.
    $d1Output = & npx.cmd --no-install wrangler d1 export azmora-inventario --remote --output (Join-Path $folder 'database.sql') 2>&1
    $d1Exit = $LASTEXITCODE
  } finally { Pop-Location; $d1Output = $null }
  if ($d1Exit -ne 0) { Stop-BackupFailure $operation "Wrangler terminou com código $d1Exit; saída bruta omitida. A pasta permanece incompleta." }

  $names = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  Write-Host "A descarregar $($objects.Count) objetos do R2..."
  $objectNumber = 0
  foreach ($item in $objects) {
    $objectNumber++
    $operation = "Descarga R2, objeto $objectNumber de $($objects.Count)"
    $key = [string]$item.key
    $segments = $key.Split('/')
    foreach ($segment in $segments) {
      if ($segment -notmatch '^[a-zA-Z0-9_][a-zA-Z0-9._ -]*[a-zA-Z0-9_-]$|^[a-zA-Z0-9_-]$' -or $segment -match '^(?i:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$') { Stop-BackupFailure $operation 'Chave incompatível com nomes de ficheiro Windows; chave omitida.' }
    }
    if (-not $names.Add($key)) { Stop-BackupFailure $operation 'Nomes R2 colidem no Windows; chaves omitidas.' }
    $relative = $segments -join [IO.Path]::DirectorySeparatorChar
    $target = Join-Path $photos $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    $encodedKey = ($segments | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    # Receive headers/status before creating the file. An error response must never
    # be stored as a photograph or leak its body into a backup or the console.
    $response = Invoke-BackupR2Request ($api + '/' + $encodedKey) $headers $operation
    $receivedEtag = [string]$response.Headers['ETag']
    if (-not $receivedEtag -or $receivedEtag.Trim('"') -cne [string]$item.etag) { Stop-BackupFailure $operation 'ETag ausente ou diferente da listagem; possível alteração durante a cópia.' 200 }
    $operation = "Gravação local, objeto $objectNumber de $($objects.Count)"
    $stream = [IO.File]::Open($target, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
    try { $response.RawContentStream.Position = 0; $response.RawContentStream.CopyTo($stream) }
    finally { $stream.Dispose(); $response.RawContentStream.Dispose() }
    if ((Get-Item -LiteralPath $target).Length -ne [long]$item.size) { Stop-BackupFailure $operation 'Tamanho descarregado diferente da listagem; cópia incompleta.' 200 }
  }
  $operation = 'Relistagem R2 final'
  $after = @(Get-BackupR2Objects $api $headers $operation)
  $firstIndex = Get-BackupR2Index $objects
  $lastIndex = Get-BackupR2Index $after
  if ($firstIndex.Count -ne $lastIndex.Count) { Stop-BackupFailure $operation 'O número de objetos mudou durante a cópia; repetir o backup.' 200 }
  foreach ($key in $firstIndex.Keys) { if (-not $lastIndex.ContainsKey($key) -or $firstIndex[$key] -cne $lastIndex[$key]) { Stop-BackupFailure $operation 'Os metadados de um objeto mudaram durante a cópia; repetir o backup.' 200 } }
  $operation = 'Gravação dos metadados locais'
  ConvertTo-Json -InputObject @($objects) -Depth 30 | Set-Content -LiteralPath (Join-Path $folder 'r2-metadata.json') -Encoding utf8
  $operation = 'Verificação SQLite, fotografias e manifesto'
  & python $verifier --criar $folder
  if ($LASTEXITCODE -ne 0) { Stop-BackupFailure $operation 'O verificador recusou a cópia; pasta incompleta.' }
  Write-Host "Backup criado e verificado: $folder"
} catch {
  $safe = Get-BackupSafeFailure $_ $operation
  throw "O backup não ficou concluído. $safe Os ficheiros já descarregados foram preservados; sem manifesto validado, a cópia não está completa."
} finally {
  if ($headers) { $headers.Clear() }
  $token = $null
  if ($tokenPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer) }
  if ($secureToken) { $secureToken.Dispose() }
}
