# Shared, read-only R2 transport and validation. Never include provider text/URLs in exceptions.
Set-StrictMode -Version Latest

function Get-BackupField {
  param($Value, [string]$Name)
  if ($null -eq $Value) { return $null }
  if ($Value -is [System.Collections.IDictionary]) { return ,$Value[$Name] }
  $property = $Value.PSObject.Properties[$Name]
  if ($null -ne $property) { return ,$property.Value }
  return $null
}

function Stop-BackupFailure {
  param([string]$Operation, [string]$Reason, [int]$HttpStatus = 0, [string[]]$Codes = @())
  $http = if ($HttpStatus) { "HTTP $HttpStatus" } else { 'HTTP indisponível (operação local ou sem resposta)' }
  $codeText = if ($Codes.Count) { '; códigos Cloudflare: ' + ($Codes -join ', ') } else { '' }
  $exception = [InvalidOperationException]::new("Etapa: $Operation; $http$codeText. $Reason")
  $exception.Data['AzmoraBackupSafe'] = $true
  throw $exception
}

function Get-BackupSafeFailure {
  param($Record, [string]$Operation)
  if ($Record.Exception.Data['AzmoraBackupSafe'] -eq $true) { return $Record.Exception.Message }
  # No raw Message/ErrorDetails/InvocationInfo: they can contain tokens, paths or personal data.
  $reason = if ($Record.Exception -is [UnauthorizedAccessException]) { 'Acesso local recusado.' }
    elseif ($Record.Exception -is [System.IO.IOException]) { 'Falha de leitura ou escrita local; verificar permissões e espaço livre.' }
    else { 'Falha local inesperada; detalhes brutos omitidos por segurança.' }
  return "Etapa: $Operation; HTTP indisponível. $reason"
}

function Invoke-BackupR2Request {
  param([string]$Uri, [hashtable]$Headers, [string]$Operation)
  try {
    $requestErrors = @()
    $response = Invoke-WebRequest -Uri $Uri -Headers $Headers -Method Get -MaximumRedirection 0 -SkipHttpErrorCheck -TimeoutSec 60 -Verbose:$false -Debug:$false -ErrorAction SilentlyContinue -ErrorVariable requestErrors
  } catch {
    # PowerShell throws for blocked redirects even with SkipHttpErrorCheck.
    $failedResponse = Get-BackupField $_.Exception 'Response'
    $failedStatus = Get-BackupField $failedResponse 'StatusCode'
    if ($null -ne $failedStatus) {
      if ([int]$failedStatus -ge 300 -and [int]$failedStatus -lt 400) { Stop-BackupFailure $Operation 'Redirecionamento recusado; o token não foi encaminhado para outro destino.' ([int]$failedStatus) }
      Stop-BackupFailure $Operation 'Falha HTTP; detalhes da exceção omitidos por segurança.' ([int]$failedStatus)
    }
    $reason = if ($_.Exception -is [OperationCanceledException] -or $_.Exception -is [TimeoutException]) { 'Pedido excedeu o prazo de 60 segundos.' } else { 'Falha de transporte (ligação, DNS ou TLS); não foi recebida uma resposta HTTP utilizável.' }
    Stop-BackupFailure $Operation $reason
  }
  if ($null -eq $response) { Stop-BackupFailure $Operation 'Falha de transporte; não foi recebida resposta HTTP.' }
  $status = [int]$response.StatusCode
  if ($status -eq 200 -and $requestErrors.Count) { Stop-BackupFailure $Operation 'O cliente HTTP registou um erro durante a leitura; conteúdo omitido.' $status }
  if ($status -ne 200) {
    $codes = [System.Collections.Generic.List[string]]::new()
    $messages = [System.Collections.Generic.List[string]]::new()
    try {
      $payload = $response.Content | ConvertFrom-Json -AsHashtable -ErrorAction Stop
      foreach ($errorItem in (Get-BackupField $payload 'errors')) {
        $code = [string](Get-BackupField $errorItem 'code')
        if ($code -match '^\d{1,10}$' -and $codes.Count -lt 8) { $codes.Add($code) }
        $message = [string](Get-BackupField $errorItem 'message')
        # Exact allowlist, not best-effort redaction of arbitrary server text.
        if ($message -cin @('Unauthorized', 'Authentication error', 'Invalid request headers', 'Invalid access token', 'Too many requests', 'Rate limit exceeded', 'Internal server error')) { $messages.Add($message) }
      }
    } catch { <# Non-JSON/unknown payloads never leave this function. #> }
    $reason = switch ($status) {
      401 { 'Autenticação recusada. Confirmar validade e tipo de token.' }
      403 { 'Acesso recusado. Confirmar conta, permissões R2 e tipo de token REST.' }
      404 { 'Recurso não encontrado. Confirmar conta, bucket e jurisdição.' }
      429 { 'Limite de pedidos atingido. Aguardar antes de repetir.' }
      { $_ -ge 300 -and $_ -lt 400 } { 'Redirecionamento recusado; o token não foi encaminhado para outro destino.' }
      { $_ -ge 500 } { 'Falha no serviço Cloudflare. Repetir mais tarde.' }
      default { 'Pedido recusado pela Cloudflare.' }
    }
    if ($messages.Count) { $reason += ' Mensagem segura: ' + (($messages | Select-Object -Unique) -join '; ') + '.' }
    else { $reason += ' Corpo da resposta omitido por segurança.' }
    Stop-BackupFailure $Operation $reason $status $codes.ToArray()
  }
  return $response
}

function Get-BackupR2Objects {
  param([string]$Api, [hashtable]$Headers, [string]$Operation = 'Listagem R2 inicial')
  $all = [System.Collections.Generic.List[object]]::new()
  $seenCursors = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  $seenKeys = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  $cursor = ''; $startAfter = ''; $number = 0
  do {
    $number++
    $step = "$Operation, página $number"
    $url = $Api + '?per_page=1000'
    if ($cursor) { $url += '&cursor=' + [uri]::EscapeDataString($cursor) }
    elseif ($startAfter) { $url += '&start_after=' + [uri]::EscapeDataString($startAfter) }
    $response = Invoke-BackupR2Request $url $Headers $step
    try { $page = $response.Content | ConvertFrom-Json -AsHashtable -ErrorAction Stop }
    catch { Stop-BackupFailure $step 'Resposta 200 sem JSON válido; conteúdo omitido.' 200 }
    $success = Get-BackupField $page 'success'
    if ($success -isnot [bool] -or -not $success) {
      $codes = @((Get-BackupField $page 'errors') | ForEach-Object { [string](Get-BackupField $_ 'code') } | Where-Object { $_ -match '^\d{1,10}$' } | Select-Object -First 8)
      Stop-BackupFailure $step 'A API não confirmou sucesso; resposta omitida.' 200 $codes
    }
    $items = Get-BackupField $page 'result'
    if ($items -isnot [array]) { Stop-BackupFailure $step 'Formato inválido: result não é uma lista.' 200 }
    foreach ($item in $items) {
      $key = Get-BackupField $item 'key'; $size = Get-BackupField $item 'size'; $etag = Get-BackupField $item 'etag'
      if ($key -isnot [string] -or -not $key -or $size -isnot [ValueType] -or $size -is [bool] -or [decimal]$size -lt 0 -or [decimal]$size -ne [math]::Truncate([decimal]$size) -or $etag -isnot [string] -or -not $etag) {
        Stop-BackupFailure $step 'Objeto com chave, tamanho ou ETag em falta/inválido; valores omitidos.' 200
      }
      if (-not $seenKeys.Add($key)) { Stop-BackupFailure $step 'Objeto repetido entre páginas; cópia recusada para evitar omissões.' 200 }
      $all.Add($item)
    }
    $info = Get-BackupField $page 'result_info'
    if ($null -ne $info -and $info -isnot [System.Collections.IDictionary]) { Stop-BackupFailure $step 'Formato de paginação inválido.' 200 }
    $truncated = Get-BackupField $info 'is_truncated'
    $next = Get-BackupField $info 'cursor'
    if ($null -ne $truncated -and $truncated -isnot [bool]) { Stop-BackupFailure $step 'Indicador de paginação inválido.' 200 }
    if ($null -ne $next -and $next -isnot [string]) { Stop-BackupFailure $step 'Cursor de paginação inválido.' 200 }
    $cursor = ''; $startAfter = ''
    if ($truncated -eq $true -or ($null -eq $truncated -and $next)) {
      if (-not $next -or -not $items.Count -or -not $seenCursors.Add($next)) { Stop-BackupFailure $step 'Paginação incompleta ou cursor repetido; cópia recusada.' 200 }
      $cursor = $next
    } elseif ($null -eq $truncated -and $items.Count -ge 1000) {
      # Optional result_info is absent on terminal pages. For a full page, probe
      # the documented start_after boundary instead of assuming completion.
      $startAfter = [string](Get-BackupField $items[-1] 'key')
    }
  } while ($cursor -or $startAfter)
  return $all.ToArray()
}

function ConvertTo-BackupCanonical {
  param($Value)
  if ($Value -is [System.Collections.IDictionary]) {
    $sorted = [ordered]@{}
    foreach ($name in ($Value.Keys | Sort-Object -CaseSensitive)) { $sorted[$name] = ConvertTo-BackupCanonical $Value[$name] }
    return $sorted
  }
  if ($Value -is [array]) { return ,@($Value | ForEach-Object { ConvertTo-BackupCanonical $_ }) }
  return $Value
}

function Get-BackupR2Index {
  param([object[]]$Objects)
  $index = @{}
  foreach ($item in $Objects) {
    # Canonical order avoids false differences caused by JSON property ordering.
    $index[[string]$item.key] = ConvertTo-Json -InputObject (ConvertTo-BackupCanonical $item) -Depth 30 -Compress
  }
  return $index
}
