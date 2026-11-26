# Restauro integral e ensaio da migração 0006 — 26/11/2026

Resultado: **PASS**, exclusivamente em ambiente isolado. Não foi identificada incompatibilidade técnica que impeça a 0006 no snapshot ensaiado. Nenhum recurso de produção foi alterado.

## Origem e evidência

Backup: `C:\Users\Utilizador\Azmora-Backups-Privados\2026-11-26_18-11-08_e10c070b`.
Restauro validado: `C:\Users\Utilizador\Azmora-Backups-Privados\ensaio-0006-2026-11-26-j`.
Evidência agregada: `restore-summary.json` nesse destino. SQL, dados pessoais e fotografias permanecem fora do repositório. O backup original voltou a ser verificado no fim e permanece inalterado.

| Verificação | Resultado |
|---|---|
| Inventário | 17 registos; todos os campos e estados preservados |
| Fotografias | 146 objetos R2, 136 referências; bytes SHA-256 e metadados HTTP/personalizados comparados |
| Histórico e uploads | 53 atividades e 146 uploads preservados |
| CRM | 1 pedido, 4 limites, 1 token e 4 entradas de histórico preservados |
| Configurações | 1 configuração e 1 versão histórica preservadas |
| Migrações no backup | 0001–0005 aplicadas; 0006 ausente |
| Integridade | SQLite integrity_check e foreign_key_check antes/depois e no armazenamento local final: aprovados |
| Aplicação 0006 | Todas as linhas originais inalteradas; zero vendas ou datas retroativas inventadas |
| ADMIN em browser | Inventário/modelos/lista, CRM e configurações; larguras 360, 390, 768, 1024, 1440 e 1920 px |
| Imagens em browser | 146 imagens descodificadas pelo endpoint protegido |
| Escritas na cópia | Reserva e disponibilidade pública; rascunho privado; publicação/recuperação de configurações; nota e histórico CRM |
| Rollback de código | Referência a6af0e2: leitura e escrita, cancelamento de reserva, triggers e rejeição de edição concorrente (409) |
| Preservação após rollback | Todas as escritas posteriores, incluindo rascunho, CRM, configurações e histórico comercial mantidas; regresso ao código atual aprovado |
| Isolamento | Zero chamadas a serviços externos; autenticação sintética local; sem envio de mensagens |

Validação complementar nesta execução: 56 testes automatizados aprovados; verificação de tipos com zero erros e zero avisos (2 sugestões); build Cloudflare aprovado. Scripts de ensaio guardados em `scripts/restore-rehearsal.mjs` e `scripts/restore-rehearsal.py`.

## Repetição

Com dependências locais instaladas e build Cloudflare atualizado, executar na raiz do repositório, escolhendo um destino privado que ainda não exista:

```powershell
node scripts/restore-rehearsal.mjs "C:\Users\Utilizador\Azmora-Backups-Privados\2026-11-26_18-11-08_e10c070b" "C:\Users\Utilizador\Azmora-Backups-Privados\ensaio-0006-novo" a6af0e2
```

O ensaio conserva o backup e cria cópias privadas. A base final do simulador contém alterações de teste e **não deve ser usada como fonte de recuperação em produção**.

## Limites e condições de publicação

- O simulador não expõe a classe de armazenamento R2; a classe Standard da origem e os metadados originais ficam registados no ficheiro privado de metadados. Datas de upload e identificadores internos de versões são regenerados no restauro. A comparação integral de conteúdo e metadados HTTP/personalizados passou.
- A autenticação local usa JWT/JWKS sintéticos. Cloudflare Access/MFA reais e o deployment remoto não foram exercitados.
- O rollback testa o ADMIN de a6af0e2 sobre o backend compatível: a comparação Git confirmou que apenas o painel mudou no código da aplicação entre essa referência e a versão ensaiada. Não é uma reprodução de todo o deployment histórico; confirmar o deployment remoto a utilizar antes da publicação.
- Este resultado prova a compatibilidade com os dados do backup indicado, não com alterações posteriores. Antes da operação real: suspender escritas, aguardar pedidos em curso, atualizar/verificar o backup se os dados mudaram, guardar segunda cópia protegida e reconfirmar as migrações remotas pendentes.
- Aplicação remota da 0006, push e deployment continuam por executar, mediante autorização. Para rollback de código, conservar D1/R2 atuais; não substituir por um backup anterior e perder pedidos/alterações posteriores.
