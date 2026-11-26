import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import path from 'node:path';

const helper = path.resolve('scripts/backup-r2.ps1').replaceAll("'", "''");
const wrapper = (code) =>
  `[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); $ErrorActionPreference='Stop'; . '${helper}'; try { ${code} } catch { Write-Output (Get-BackupSafeFailure $_ 'Teste local'); exit 13 }`;
const run = (code) =>
  spawnSync('pwsh', ['-NoProfile', '-Command', wrapper(code)], {
    encoding: 'utf8',
    windowsHide: true,
  });
const list =
  "$objects=@(Get-BackupR2Objects 'https://fixture.invalid/objects' @{}); Write-Output ('COUNT='+$objects.Count)";
const mock = (body) =>
  `function Invoke-WebRequest { param($Uri,$Headers,$Method,$MaximumRedirection,[switch]$SkipHttpErrorCheck,$TimeoutSec,$Verbose,$Debug) ${body} }`;
const response = (obj) =>
  `return @{StatusCode=200;Content=(${obj}|ConvertTo-Json -Depth 10 -Compress)}`;
const item = "@{key='images/uploads/a.webp';size=7;etag='fixture'}";

for (const [label, result, count] of [
  ['última página sem result_info', `@(${item})`, 1],
  ['bucket vazio sem result_info', '@()', 0],
])
  test('R2: ' + label, () => {
    const r = run(mock(response(`@{success=$true;result=${result}}`)) + list);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, new RegExp('COUNT=' + count));
  });

test('R2: página cheia sem result_info usa start_after e não omite objetos', () => {
  const r = run(
    mock(
      `if($Uri -match 'start_after=') { ${response("@{success=$true;result=@(@{key='images/uploads/z.webp';size=7;etag='fixture'})}")} }; ${response("@{success=$true;result=@(1..1000|ForEach-Object{@{key=('images/uploads/{0:D4}.webp' -f $_);size=7;etag='fixture'}})}")}`,
    ) + list,
  );
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /COUNT=1001/);
});

for (const [label, body, expected] of [
  [
    'cursor ausente',
    `@{success=$true;result=@(${item});result_info=@{is_truncated=$true}}`,
    /Paginação incompleta/,
  ],
  [
    'cursor repetido',
    `@{success=$true;result=@(@{key=('images/uploads/'+[guid]::NewGuid()+'.webp');size=7;etag='fixture'});result_info=@{is_truncated=$true;cursor='next'}}`,
    /cursor repetido/,
  ],
  [
    'objeto repetido',
    `@{success=$true;result=@(${item});result_info=@{is_truncated=$true;cursor='next'}}`,
    /Objeto repetido/,
  ],
  [
    'result inválido',
    `@{success=$true;result='email-personal@example.test'}`,
    /result não é uma lista/,
  ],
  [
    'is_truncated não booleano',
    `@{success=$true;result=@(${item});result_info=@{is_truncated='false'}}`,
    /Indicador de paginação inválido/,
  ],
  [
    'result_info inválido',
    `@{success=$true;result=@(${item});result_info='secreto'}`,
    /Formato de paginação inválido/,
  ],
  [
    'tamanho negativo',
    `@{success=$true;result=@(@{key='images/uploads/a.webp';size=-1;etag='fixture'})}`,
    /tamanho ou ETag/,
  ],
  [
    'ETag em falta',
    `@{success=$true;result=@(@{key='images/uploads/a.webp';size=1})}`,
    /tamanho ou ETag/,
  ],
  [
    'success false',
    `@{success=$false;errors=@(@{code=10000;message='segredo'});result=@()}`,
    /códigos Cloudflare: 10000/,
  ],
])
  test('R2 recusa ' + label + ' com diagnóstico seguro', () => {
    const r = run(mock(response(body)) + list);
    assert.equal(r.status, 13, r.stderr + r.stdout);
    assert.match(r.stdout, /Etapa: Listagem R2 inicial, página/);
    assert.match(r.stdout, /HTTP 200/);
    assert.match(r.stdout, expected);
    assert.doesNotMatch(
      r.stdout + r.stderr,
      /email-personal|secreto|segredo|fixture\.invalid|images\/uploads/,
    );
  });

test('R2: ordem das propriedades dos metadados não gera falsa alteração', () => {
  const r = run(
    `$a=@{key='k';size=7;etag='e';custom_metadata=@{b='2';a='1'}}; $b=[ordered]@{custom_metadata=[ordered]@{a='1';b='2'};etag='e';size=7;key='k'}; $x=Get-BackupR2Index @($a);$y=Get-BackupR2Index @($b);if($x.k -cne $y.k){throw 'different'};Write-Output 'SAME'`,
  );
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /SAME/);
});

test('R2: transporte e falha local não mostram a mensagem bruta', () => {
  const malicious =
    'https://secret.invalid/download?X-Amz-Signature=FAKE_SECRET cliente@example.test Bearer FAKE_TOKEN';
  const transport = run(mock(`throw '${malicious}'`) + list);
  assert.equal(transport.status, 13);
  assert.match(transport.stdout, /Falha de transporte/);
  const local = run(`throw '${malicious}'`);
  assert.equal(local.status, 13);
  assert.match(local.stdout, /Falha local inesperada/);
  for (const r of [transport, local])
    assert.doesNotMatch(
      r.stdout + r.stderr,
      /FAKE_|secret\.invalid|cliente@|Bearer|X-Amz/,
    );
});

test('HTTP real local: 401/403/404/429/500, corpo não JSON e redirecionamento sem fuga de credenciais', async () => {
  let redirected = 0;
  const server = createServer((req, res) => {
    if (req.url === '/sink') {
      redirected++;
      res.end('leak');
      return;
    }
    const status = Number(req.url.slice(1));
    res.statusCode = status;
    if (status === 302) res.setHeader('Location', '/sink');
    res.setHeader(
      'Content-Type',
      status === 502 ? 'text/html' : 'application/json',
    );
    res.end(
      status === 502
        ? '<html>FAKE_TOKEN cliente@example.test https://signed.invalid/?signature=FAKE_SIG</html>'
        : JSON.stringify({
            success: false,
            errors: [
              { code: 10000, message: 'Authentication error' },
              {
                code: 7777,
                message:
                  'Bearer FAKE_TOKEN cliente@example.test https://signed.invalid/?signature=FAKE_SIG',
              },
              { code: 'FAKE_TOKEN', message: 'private name' },
            ],
          }),
    );
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    for (const status of [401, 403, 404, 429, 500, 502, 302]) {
      const code = wrapper(
        `Invoke-BackupR2Request 'http://127.0.0.1:${server.address().port}/${status}' @{Authorization='Bearer FAKE_TOKEN'} 'Listagem R2 inicial' | Out-Null`,
      );
      const result = await new Promise((resolve, reject) => {
        const child = spawn('pwsh', ['-NoProfile', '-Command', code], {
          windowsHide: true,
        });
        let stdout = '',
          stderr = '';
        child.stdout.on('data', (s) => (stdout += s));
        child.stderr.on('data', (s) => (stderr += s));
        child.on('error', reject);
        child.on('close', (exit) => resolve({ exit, stdout, stderr }));
      });
      assert.equal(result.exit, 13, result.stdout + result.stderr);
      assert.match(result.stdout, new RegExp('HTTP ' + status));
      if (status !== 502) {
        assert.match(result.stdout, /10000, 7777/);
        assert.match(result.stdout, /Authentication error/);
      }
      assert.doesNotMatch(
        result.stdout + result.stderr,
        /FAKE_|cliente@|signed\.invalid|127\.0\.0\.1|private name/,
      );
    }
    assert.equal(redirected, 0);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
