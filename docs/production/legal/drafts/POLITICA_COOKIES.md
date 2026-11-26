# Política de cookies e tecnologias semelhantes

> **MINUTA INTERNA — NÃO PUBLICAR.** Preparada em 25/11/2026 para revisão dos proprietários e do seu jurista. Os campos `[PENDENTE]`, as alternativas e as notas de revisão exigem resolução; nenhuma afirmação de aprovação jurídica ou de conformidade é feita. O website publicado pode divergir da D.1 local.

## Estado técnico local atual — referência para revisão

O painel oferece aceitação, recusa, personalização e alteração posterior da persistência opcional de tema, favoritos e comparação. Sem autorização, essas escolhas não são persistidas em localStorage; favoritos e comparação podem ser transportados no fragmento do endereço para as respetivas páginas. A decisão é guardada em `azmora:consent-v1` quando o armazenamento está disponível. A retirada remove os dados persistentes dessas preferências, quando acessíveis. O código local não carrega o beacon Cloudflare e não disponibiliza opção de medição. Facebook e Instagram são ligações diretas. A identificação do responsável e a revisão jurídica continuam pendentes. Antes da publicação, verificar separadamente qualquer injeção remota da Cloudflare.

As secções seguintes preservam a auditoria e propostas históricas; onde descrevem leituras incondicionais ou medição ativa, não descrevem o código local atual. Esta minuta continua incompleta e não deve ser publicada.

## 1. Âmbito
Este website utiliza armazenamento no navegador e serviços de segurança e medição. «Tecnologias semelhantes» incluem mecanismos de armazenamento ou acesso a informação no dispositivo, mesmo que não sejam cookies. Esta política deve ser lida com a política de privacidade. [PENDENTE — IDENTIFICAÇÃO DO RESPONSÁVEL E DATA DE VIGÊNCIA.]

## 2. Tecnologias identificadas

| Tecnologia | Finalidade e momento | Duração / origem e limitações |
|---|---|---|
| `azmora:theme` | Guarda o tema escolhido; a implementação lê a chave ao carregar a página, mesmo antes de nova escolha. | LocalStorage do website, sem expiração definida pelo código. Escolher tema do sistema remove a chave; o utilizador pode também limpar o armazenamento. |
| `azmora:favoritos` | Guarda identificadores das casas favoritas; é lida na inicialização e gravada quando a seleção muda. | LocalStorage do website, sem expiração definida; uma lista vazia pode continuar guardada até limpeza. |
| `azmora:comparar` | Guarda até três identificadores para comparação; lida na inicialização e gravada quando a seleção muda. | LocalStorage do website, sem expiração definida; limpar a comparação grava uma lista vazia. A ausência observada numa sessão Firefox não prova ausência geral. |
| Cloudflare Access | Autenticação e proteção do ADMIN. Cookies identificados na documentação incluem `CF_Authorization` e `CF_AppSession`; no navegador observado os nomes estavam truncados, pelo que a correspondência é provável e não plenamente confirmada. | Cloudflare; a sessão da aplicação foi configurada para 24 horas. A sessão global e atributos efetivos dependem da configuração e do contexto. |
| Turnstile e segurança Cloudflare | Verificação de segurança no formulário e eventual proteção de pedidos. O widget está em modo Managed; o pre-clearance foi comunicado como desativado. Outros mecanismos podem utilizar `cf_clearance` ou `__cf_bm` conforme configuração e desafio. | Cloudflare; emissão e duração dependem do mecanismo. O pre-clearance desativado não exclui cookies de outros mecanismos. |
| Cloudflare Web Analytics | Um beacon é injetado automaticamente no website público e envia medições de utilização e desempenho à Cloudflare, incluindo um pedido observado para `/cdn-cgi/rum`. A exclusão do ADMIN por regra foi comunicada como testada. | A Cloudflare afirma não usar cookies ou localStorage para as métricas; o prazo de retenção e o conjunto completo de dados acessíveis devem ser confirmados. A ausência de cookies não resolve, por si só, a necessidade de consentimento. |

As observações em navegadores são amostras e não garantem que não existam outros elementos em todos os dispositivos, sessões ou desafios. A rede de publicidade e cookies de marketing não foram identificados nesta auditoria; [PENDENTE — CONFIRMAR CONFIGURAÇÃO FINAL ANTES DA PUBLICAÇÃO].

## 3. Fundamento e escolha — decisão pendente
[PENDENTE — DECISÃO DOS RESPONSÁVEIS E JURISTA SOBRE APLICABILIDADE DA LEI N.º 41/2004, ARTIGO 5.º, E BASES RGPD PARA CADA MECANISMO.] A necessidade técnica deve ser avaliada por finalidade; uma leitura de preferências no carregamento e a recolha de métricas por um beacon exigem análise específica. Não se afirma isenção só por não existir cookie publicitário ou por o fornecedor não usar armazenamento local.

**Alternativa A — sem banner:** só usar se a análise jurídica fundamentar que todos os acessos e armazenamentos na configuração efetiva estão dispensados de consentimento e existir informação adequada. **Alternativa B — consentimento:** se exigido, bloquear os mecanismos sujeitos a consentimento antes de qualquer acesso ou recolha, oferecer aceitar e recusar de forma efetiva e permitir alteração e retirada da escolha. **Alternativa C — adaptação:** desativar ou adaptar mecanismos não essenciais e leituras antecipadas e rever a análise da configuração resultante. São opções de revisão, não funcionalidades existentes nem decisões aprovadas; eliminar as alternativas não escolhidas antes de publicar.

## 4. Gestão no navegador
Pode remover dados e cookies nas definições do navegador, e limpar favoritos/comparação nas opções do website. A eliminação de cookies de autenticação pode terminar a sessão administrativa. Ferramentas de privacidade do navegador podem bloquear o beacon. [PENDENTE — INDICAR MECANISMO REAL DE ESCOLHA, SE FOR IMPLEMENTADO, E EVENTUAIS CONSEQUÊNCIAS.] Para informação sobre dados pessoais consulte a política de privacidade.

---
**Fontes para revisão, não fazem parte do texto público:** [RGPD, artigos 5.º, 6.º, 12.º–14.º e capítulo V](https://eur-lex.europa.eu/eli/reg/2016/679/oj); [Lei n.º 41/2004, artigo 5.º](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2004-106523049); [DL n.º 7/2004, artigo 10.º](https://diariodarepublica.pt/dr/detalhe/decreto-lei/7-2004-240775); [EDPB, orientações 2/2023](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en); auditorias internas D.2 e D.3. A aplicabilidade e redação vigente devem ser validadas pelo jurista.


## Implementação local proposta — ainda não publicada

Foi preparado um painel que permite aceitar, recusar, personalizar e alterar escolhas. `azmora:consent-v1` guarda a escolha de preferências e medição, sem expiração automática nesta versão; critérios e prazo exigem decisão. Sem consentimento para preferências, tema e seleções são mantidos apenas na página atual; a recusa remove as chaves persistentes quando o armazenamento está disponível. Se o armazenamento estiver bloqueado, a escolha não persiste e a medição não é ativada. A política final depende de testes e validação jurídica, incluindo fundamento do armazenamento da própria escolha e duração.

O carregamento manual do beacon depende de consentimento e de um identificador público configurado no build. Não se garante ainda cessação de envios pendentes ao retirar consentimento; a injeção automática de produção continua ativa. O mecanismo não está pronto para produção até resolver e testar ambos os pontos. As ligações sociais são simples e não incluem SDKs.


## Estado técnico local mais recente — substitui a proposta anterior

A integração manual do Web Analytics foi removida da implementação local até existir solução fiável para a retirada. Em produção, a injeção automática continua ativa até alteração autorizada na Cloudflare. A versão local só estará alinhada com esta minuta depois de desativar e verificar todas as fontes de injeção automática. O painel local não oferece opção de medição porque a medição está desativada no código local; a escolha abrange a persistência opcional das preferências.

Sem persistência, a seleção de casas pode ser transferida, mediante navegação iniciada pelo visitante, para as páginas de favoritos ou comparação através do fragmento do endereço. O fragmento não é enviado no pedido HTTP, mas pode ficar no histórico e ser copiado ou partilhado com o URL; recarregar essas páginas preserva a seleção no URL. Outras páginas, outro separador e tema não preservam automaticamente o estado. Isto não utiliza sessionStorage; a análise jurídica do tratamento das escolhas e da própria escolha de consentimento permanece pendente.
