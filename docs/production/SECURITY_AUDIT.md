# Auditoria de segurança — 25/11/2026

Âmbito: código do commit aced950 e alterações locais. Não é pentest nem certificação; configurações privadas dos fornecedores não foram auditadas.

## Conclusões e prioridades

- **Alta — continuidade/privacidade:** não existe ainda prova de backup independente automático nem de restauro de uma cópia real. Até ativar e testar o procedimento de backup, falha de conta ou eliminação pode causar perda. Ver BACKUP_AND_RESTORE.md.
- **Média — histórico e MFA:** Access e MFA são afirmados pelo proprietário; não foram testados com contas reais nesta intervenção. Proteger também deployments históricos e previews no dashboard; uma amostra anónima de pages.dev e deployment antigo respondeu 404 e www/admin/dados devolveu 302 para autenticação. Isso não prova proteção de todas as versões históricas.
- **Média — CSP:** nonce é aplicado por HTMLRewriter a todos os scripts da resposta. A segurança depende da correta escapagem da marcação; não trata uma vulnerabilidade de injeção HTML já existente. Dados JSON usam escape de `<`, os componentes escapam por defeito; não foi efetuada prova formal de ausência de XSS. Evitar inserir HTML não confiável.
- **Média — retenção:** o prazo de 12 meses não é executado automaticamente. Rever periodicamente pedidos, emails, exports e backups; o filtro identifica apenas pedidos sem atualizações e não conhece interações fora do CRM.
- **Baixa — JWT:** foi acrescentada recusa de `sub` vazio e de `iat` mais de 60 segundos no futuro; testes verificam emissor, audience, assinatura, expiração, allowlist, origem e falta de JWT. JWT é validado com JWKS, RS256, type app; falta de configuração recusa. MFA é responsabilidade da política Access, não do JWT local.
- **Baixa — dados legais:** falta confirmar responsável, morada, base jurídica, retenção, contratos e transferências. Não é declaração de conformidade.

Todas as rotas `/admin` passam por `authorize`; mutações exigem Origin exata e Content-Type restrito. Queries com entrada utilizam parâmetros; edição e eliminação exigem revisão atual. Testes locais recusam pedidos sem JWT e origem cruzada, mas não provam todas as políticas externas. Fotografias públicas dependem de referência em ficha publicada; acesso direto ao bucket e configurações de previews devem ser verificados na conta. Upload exige WebP estrutural, até 3 MiB e 1800 px, removendo metadados; não é um descodificador/antivírus completo.

Turnstile é verificado no servidor, inclusive hostname, action, idade e hash de token consumido atomicamente em D1; testes usam mocks. Rate limits são por janela fixa, não WAF contra tráfego volumétrico. Informações privadas e templates não são escritos intencionalmente em logs; verificar retenção e redaction nos fornecedores. Exportação CSV neutraliza fórmulas. Eliminação do registo inclui histórico D1, mas não emails ou backups. Acesso autorizado é partilhado por proprietários: não existe isolamento por proprietário.

`npm audit --omit=dev` em 25/11/2026: zero vulnerabilidades reportadas; não garante ausência de falhas desconhecidas. Revisão pública do logo: HTTPS 200, image/png. Não testar privacidade de objetos com dados reais publicando URLs sensíveis. Segurança de secrets, políticas de bucket, MFA Zoho, Cloudflare Access e backups dependem de confirmação manual.

**Atualização:** por decisão do proprietário, backups automáticos e contratação de fornecedor externo estão adiados. Foi preparado backup manual local, ainda sem ensaio real. O risco de dependência de um único computador mantém-se até existirem cópias verificadas noutro suporte seguro.

## Verificação de previews e deployments antigos

1. Workers & Pages → azmora-homes → Settings → General → Enable access policy para previews; rever a aplicação/política Access criada e permitir apenas utilizadores autorizados. A opção protege previews, não automaticamente o domínio principal pages.dev nem todos os aliases de produção: https://developers.cloudflare.com/pages/configuration/preview-deployments/.
2. Rever aliases, deployments antigos e políticas Access; restringir ou remover apenas após identificar dependências e com autorização específica. Testar anonimamente `/admin/`, `/admin/dados/`, `/admin/contactos/`, `/admin/contactos-exportar/`, `/admin/foto/` e métodos de mutação, sem usar dados reais. Nunca considerar `robots.txt` autenticação.
3. Em Zero Trust, verificar que todos os caminhos `/admin` e descendentes estão abrangidos pela política correta, que não existem políticas de bypass e que a aplicação exige MFA. Testar conta permitida e recusada, e ausência de JWT, sem enfraquecer o bloqueio fail-closed.

Verificação anónima adicional: `/admin/`, `/admin/dados/`, `/admin/contactos/`, `/admin/contactos-exportar/`, `/admin/foto/` devolveram 302 no domínio oficial e 404 em pages.dev e em quatro aliases antigos/atual selecionados. Apenas esta amostra GET foi testada; não prova segurança de todos os deployments, políticas ou métodos. A alteração local do JWT e os testes não estão em produção até publicação.
