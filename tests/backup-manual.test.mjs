import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('backup manual verifica manifesto, D1 e fotos e deteta alterações',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'azmora-manual-'));
  try {
    mkdirSync(path.join(root,'photos','images','uploads'),{recursive:true});
    const photo=path.join(root,'photos','images','uploads','test.webp');
    writeFileSync(photo,'fixture');
    writeFileSync(path.join(root,'database.sql'),`CREATE TABLE inventory(data TEXT); INSERT INTO inventory VALUES('{"media":[{"src":"images/uploads/test.webp"}]}'); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);`);
    writeFileSync(path.join(root,'r2-metadata.json'),JSON.stringify([{key:'images/uploads/test.webp',size:7}]));
    const create=spawnSync('python',['scripts/backup_manual_verify.py','--criar',root],{encoding:'utf8'});
    assert.equal(create.status,0,create.stderr);
    const check=()=>spawnSync('pwsh',['-NoProfile','-File','scripts/backup-manual.ps1','-Verificar','-PastaBackup',root],{encoding:'utf8'});
    assert.equal(check().status,0);
    writeFileSync(path.join(root,'r2-metadata.json'),JSON.stringify([{key:'images/uploads/other.webp',size:7}]));
    assert.notEqual(check().status,0);
    writeFileSync(path.join(root,'r2-metadata.json'),JSON.stringify([{key:'images/uploads/test.webp',size:7}]));
    writeFileSync(photo,'changed');
    assert.notEqual(check().status,0);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('backup completo simulado pagina R2, verifica e grava na pasta de destino',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'azmora-full-'));
  const quote=s=>s.replaceAll("'","''");
  try {
    let script=readFileSync('scripts/backup-manual.ps1','utf8');
    const verifier=path.resolve('scripts/backup_manual_verify.py');
    script=script.replace("$project = Split-Path -Parent $PSScriptRoot",`$project = '${quote(process.cwd())}'`)
      .replace("$verifier = Join-Path $PSScriptRoot 'backup_manual_verify.py'",`$verifier = '${quote(verifier)}'`)
      .replace("$backupRoot = 'C:\\Users\\Utilizador\\Azmora-Backups-Privados'",`$backupRoot = '${quote(root)}'`);
    const scriptPath=path.join(root,'script.ps1');writeFileSync(scriptPath,script);
    const wrapper=`
function Read-Host { param($Prompt,[switch]$AsSecureString) if($AsSecureString){return (ConvertTo-SecureString 'fixture' -AsPlainText -Force)} return 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }
function npx.cmd { Set-Content -LiteralPath $args[-1] -Value 'CREATE TABLE inventory(data TEXT); INSERT INTO inventory VALUES(''{"media":[{"src":"images/uploads/test.webp"}]}''); CREATE TABLE uploads(id); CREATE TABLE activity(id); CREATE TABLE contact_requests(id); CREATE TABLE contact_history(id); CREATE TABLE contact_limits(id); CREATE TABLE contact_tokens(id);' -Encoding utf8; $global:LASTEXITCODE=0 }
function Invoke-RestMethod { param($Uri,$Headers,$Method,$MaximumRedirection) if($Uri -match 'cursor='){return @{success=$true;result=@(@{key='images/uploads/second.webp';size=7;etag='fixture'});result_info=@{is_truncated=$false;cursor=''}}}; return @{success=$true; result=@(@{key='images/uploads/test.webp';size=7;etag='fixture'});result_info=@{is_truncated=$true;cursor='next'}} }
function Invoke-WebRequest { param($Uri,$Headers,$Method,$OutFile,[switch]$PassThru,$MaximumRedirection) [IO.File]::WriteAllText($OutFile,'fixture'); return @{Headers=@{ETag='"fixture"'}} }
& '${quote(scriptPath)}'
`;
    const wrapperPath=path.join(root,'wrapper.ps1');writeFileSync(wrapperPath,wrapper);
    const result=spawnSync('pwsh',['-NoProfile','-File',wrapperPath],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const folder=readdirSync(root,{withFileTypes:true}).find(d=>d.isDirectory()).name;
    const check=spawnSync('python',['scripts/backup_manual_verify.py',path.join(root,folder)],{encoding:'utf8'});
    assert.equal(check.status,0,check.stderr);
    assert.match(check.stdout,/2 objetos R2/);
  } finally { rmSync(root,{recursive:true,force:true}); }
});

test('ficheiro automático está fora de workflows e não existe trigger agendado',async()=>{
  const {readdirSync,readFileSync}=await import('node:fs');
  const workflows=readdirSync('.github/workflows').filter(f=>/\.ya?ml$/i.test(f));
  for(const name of workflows) assert.doesNotMatch(readFileSync('.github/workflows/'+name,'utf8'),/^\s*schedule\s*:/m,name);
});
