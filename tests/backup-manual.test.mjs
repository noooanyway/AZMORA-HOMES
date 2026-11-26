import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('backup manual verifica manifesto, D1 e fotos e deteta alterações', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'azmora-manual-'));
  try {
    mkdirSync(path.join(root, 'photos', 'images', 'uploads'), {
      recursive: true,
    });
    const photo = path.join(root, 'photos', 'images', 'uploads', 'test.webp');
    writeFileSync(photo, 'fixture');
    writeFileSync(
      path.join(root, 'database.sql'),
      `CREATE TABLE inventory(data TEXT); INSERT INTO inventory VALUES('{"media":[{"src":"images/uploads/test.webp"}]}'); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);`,
    );
    writeFileSync(
      path.join(root, 'r2-metadata.json'),
      JSON.stringify([{ key: 'images/uploads/test.webp', size: 7 }]),
    );
    const create = spawnSync(
      'python',
      ['scripts/backup_manual_verify.py', '--criar', root],
      { encoding: 'utf8' },
    );
    assert.equal(create.status, 0, create.stderr);
    const check = () =>
      spawnSync(
        'pwsh',
        [
          '-NoProfile',
          '-File',
          'scripts/backup-manual.ps1',
          '-Verificar',
          '-PastaBackup',
          root,
        ],
        { encoding: 'utf8' },
      );
    assert.equal(check().status, 0);
    writeFileSync(
      path.join(root, 'r2-metadata.json'),
      JSON.stringify([{ key: 'images/uploads/other.webp', size: 7 }]),
    );
    assert.notEqual(check().status, 0);
    writeFileSync(
      path.join(root, 'r2-metadata.json'),
      JSON.stringify([{ key: 'images/uploads/test.webp', size: 7 }]),
    );
    writeFileSync(photo, 'changed');
    assert.notEqual(check().status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('backup completo simulado pagina R2, verifica e grava na pasta de destino', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'azmora-full-'));
  const quote = (s) => s.replaceAll("'", "''");
  try {
    let script = readFileSync('scripts/backup-manual.ps1', 'utf8');
    const verifier = path.resolve('scripts/backup_manual_verify.py');
    script = script
      .replace(
        '$project = Split-Path -Parent $PSScriptRoot',
        `$project = '${quote(process.cwd())}'`,
      )
      .replace(
        "$verifier = Join-Path $PSScriptRoot 'backup_manual_verify.py'",
        `$verifier = '${quote(verifier)}'`,
      )
      .replace(
        ". (Join-Path $PSScriptRoot 'backup-r2.ps1')",
        `. '${quote(path.resolve('scripts/backup-r2.ps1'))}'`,
      )
      .replace(
        "$backupRoot = 'C:\\Users\\Utilizador\\Azmora-Backups-Privados'",
        `$backupRoot = '${quote(root)}'`,
      );
    const scriptPath = path.join(root, 'script.ps1');
    writeFileSync(scriptPath, script);
    const wrapper = `
function Read-Host { param($Prompt,[switch]$AsSecureString) if($AsSecureString){return (ConvertTo-SecureString 'fixture' -AsPlainText -Force)} return 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }
function npx.cmd { Set-Content -LiteralPath $args[-1] -Value 'CREATE TABLE inventory(data TEXT); INSERT INTO inventory VALUES(''{"media":[{"src":"images/uploads/test.webp"}]}''); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);' -Encoding utf8; $global:LASTEXITCODE=0 }
function Invoke-WebRequest {
 param($Uri,$Headers,$Method,$MaximumRedirection,[switch]$SkipHttpErrorCheck,$TimeoutSec,$Verbose,$Debug)
 if($Uri -match '/objects\\?') {
   $result = if($Uri -match 'cursor=') { @{success=$true;result=@(@{key='images/uploads/second.webp';size=7;etag='fixture'})} }
     else { @{success=$true;result=@(@{key='images/uploads/test.webp';size=7;etag='fixture'});result_info=@{is_truncated=$true;cursor='next'}} }
   return @{StatusCode=200;Content=($result|ConvertTo-Json -Depth 10 -Compress)}
 }
 return @{StatusCode=200;Headers=@{ETag='"fixture"'};RawContentStream=[IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes('fixture'))}
}
& '${quote(scriptPath)}'
`;
    const wrapperPath = path.join(root, 'wrapper.ps1');
    writeFileSync(wrapperPath, wrapper);
    const result = spawnSync('pwsh', ['-NoProfile', '-File', wrapperPath], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const folder = readdirSync(root, { withFileTypes: true }).find((d) =>
      d.isDirectory(),
    ).name;
    const check = spawnSync(
      'python',
      ['scripts/backup_manual_verify.py', path.join(root, folder)],
      { encoding: 'utf8' },
    );
    assert.equal(check.status, 0, check.stderr);
    assert.match(check.stdout, /2 objetos R2/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('ficheiro automático está fora de workflows e não existe trigger agendado', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const workflows = readdirSync('.github/workflows').filter((f) =>
    /\.ya?ml$/i.test(f),
  );
  for (const name of workflows)
    assert.doesNotMatch(
      readFileSync('.github/workflows/' + name, 'utf8'),
      /^\s*schedule\s*:/m,
      name,
    );
});
for (const mode of ['http-download', 'etag', 'size', 'changed', 'd1-failure'])
  test(
    'backup interrompido preserva D1 e sanitiza diagnóstico: ' + mode,
    () => {
      const root = mkdtempSync(path.join(tmpdir(), 'azmora-safe-failure-'));
      const quote = (s) => s.replaceAll("'", "''");
      const sql = 'CREATE TABLE fixture(id);';
      try {
        const script = readFileSync('scripts/backup-manual.ps1', 'utf8')
          .replace(
            '$project = Split-Path -Parent $PSScriptRoot',
            `$project = '${quote(process.cwd())}'`,
          )
          .replace(
            "$verifier = Join-Path $PSScriptRoot 'backup_manual_verify.py'",
            `$verifier = '${quote(path.resolve('scripts/backup_manual_verify.py'))}'`,
          )
          .replace(
            ". (Join-Path $PSScriptRoot 'backup-r2.ps1')",
            `. '${quote(path.resolve('scripts/backup-r2.ps1'))}'`,
          )
          .replace(
            "$backupRoot = 'C:\\Users\\Utilizador\\Azmora-Backups-Privados'",
            `$backupRoot = '${quote(root)}'`,
          );
        const scriptPath = path.join(root, 'backup.ps1');
        writeFileSync(scriptPath, script);
        const driver = `
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$global:backupTestMode='${mode}'; $global:backupTestListCalls=0
function Read-Host { param($Prompt,[switch]$AsSecureString) if($AsSecureString){return (ConvertTo-SecureString 'FAKE_BACKUP_TOKEN' -AsPlainText -Force)} return 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }
function npx.cmd { [IO.File]::WriteAllText($args[-1],'${sql}'); Write-Output 'https://signed.invalid/download?signature=FAKE_SIG cliente@example.test FAKE_BACKUP_TOKEN'; $global:LASTEXITCODE=0; if($global:backupTestMode -eq 'd1-failure'){$global:LASTEXITCODE=9} }
function Invoke-WebRequest {
 param($Uri,$Headers,$Method,$MaximumRedirection,[switch]$SkipHttpErrorCheck,$TimeoutSec,$Verbose,$Debug)
 if($Uri -match '/objects\\?') {
   $global:backupTestListCalls++; $etag='fixture'; if($global:backupTestMode -eq 'changed' -and $global:backupTestListCalls -gt 1){$etag='changed'}
   return @{StatusCode=200;Content=(@{success=$true;result=@(@{key='images/uploads/test.webp';size=7;etag=$etag})}|ConvertTo-Json -Depth 10 -Compress)}
 }
 if($global:backupTestMode -eq 'http-download'){return @{StatusCode=403;Content='{"success":false,"errors":[{"code":10000,"message":"Authentication error"},{"code":7777,"message":"FAKE_BACKUP_TOKEN cliente@example.test https://signed.invalid/?signature=FAKE_SIG"}]}'}}
 $etag='"fixture"'; if($global:backupTestMode -eq 'etag'){$etag='"changed"'}
 $bytes='fixture'; if($global:backupTestMode -eq 'size'){$bytes='different-size'}
 return @{StatusCode=200;Headers=@{ETag=$etag};RawContentStream=[IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes($bytes))}
}
try { & '${quote(scriptPath)}' } catch { Write-Output $_.Exception.Message; exit 13 }
`;
        const driverPath = path.join(root, 'driver.ps1');
        writeFileSync(driverPath, driver);
        const result = spawnSync('pwsh', ['-NoProfile', '-File', driverPath], {
          encoding: 'utf8',
        });
        assert.equal(result.status, 13, result.stdout + result.stderr);
        assert.doesNotMatch(
          result.stdout + result.stderr,
          /FAKE_|cliente@|signed\.invalid|images\/uploads/,
        );
        const expected = {
          'http-download':
            /Descarga R2, objeto 1 de 1; HTTP 403; códigos Cloudflare: 10000, 7777/,
          etag: /ETag ausente ou diferente/,
          size: /Tamanho descarregado diferente/,
          changed: /Relistagem R2 final; HTTP 200.*metadados/,
          'd1-failure': /Exportação D1.*código 9/,
        };
        assert.match(result.stdout, expected[mode]);
        const folder = path.join(
          root,
          readdirSync(root, { withFileTypes: true }).find((d) =>
            d.isDirectory(),
          ).name,
        );
        assert.equal(
          readFileSync(path.join(folder, 'database.sql'), 'utf8'),
          sql,
        );
        assert.equal(readdirSync(folder).includes('manifest.json'), false);
        if (mode === 'http-download' || mode === 'etag')
          assert.deepEqual(
            readdirSync(path.join(folder, 'photos', 'images', 'uploads')),
            [],
          );
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
