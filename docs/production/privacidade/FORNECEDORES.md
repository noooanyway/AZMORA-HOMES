# Matriz de fornecedores e tratamento

**Interno — preliminar, não publicar; consulta 25/11/2026. Responsável pelo tratamento e aprovação jurídica pendentes.** Factos observados são identificados; descrições de fornecedores são condicionadas à configuração contratada.

**Precedência:** a consolidação de 25/11/2026 no fim deste documento atualiza e substitui os pontos antigos que lhe sejam contrários. Dados de painel são comunicados pelo responsável, não verificados diretamente nesta intervenção.

Papel indicado é hipótese operacional a confirmar por contratos e decisão do responsável; localizações, subprocessadores, DPA, retenção e eliminação efetivas estão pendentes em todas as linhas. Regiões de armazenamento não provam local de todos os tratamentos. Titulares incluem visitantes, clientes e administradores conforme linha.

| Serviço | Finalidade e dados enviados/guardados | Papel presumido e pontos por confirmar |
|---|---|---|
| Pages | HTML/assets; pedidos, IP e dados técnicos de visitantes | Cloudflare, alojamento; logs, região e retenção |
| Workers | executa site/API; pedido, IP, conteúdo submetido | Cloudflare; logs, telemetria e localização |
| D1 | dados de contacto, estados, notas, histórico, payload da notificação e hashes | Cloudflare; região, Time Travel, exclusão e cópias |
| R2 | fotos de casas, eventualmente metadados inseridos por operador | Cloudflare; região, versões e metadados |
| Access | autenticação; identidade e eventos de acesso de administradores | Cloudflare e fornecedor de identidade; sessão, logs e duração |
| Turnstile | segurança; sinais de dispositivo/rede e token; Siteverify recebe IP e token | Cloudflare; tratamento e retenção dos sinais |
| Web Analytics | beacon, medições de navegação e desempenho dos visitantes | Cloudflare; modos, regras, campos e retenção reais |
| Resend | notificação: dados do pedido e destinatário, Reply-To e conteúdo | fornecedor de envio; retenção de conteúdo/logs, DPA e subprocessadores |
| Zoho Mail | distribuição de notificações e respostas; endereços, conteúdo e anexos | Zoho e destinatários; membros do grupo, região, cópias e retenção |
| WhatsApp | contacto iniciado pelo visitante; número e conteúdo da conversa | Meta/WhatsApp; papel independente ou partilhado conforme configuração; política e transferências a confirmar |

Fontes oficiais: https://www.cloudflare.com/cloudflare-customer-dpa/ ; https://developers.cloudflare.com/turnstile/ ; https://developers.cloudflare.com/web-analytics/ ; https://resend.com/legal/dpa ; https://www.zoho.com/privacy.html ; https://www.whatsapp.com/legal/privacy-policy . Conferir contrato efetivo e lista atual de subprocessadores; links não demonstram aceitação do DPA.

## Consolidação de configurações, contratos e limites

**Cloudflare — comunicado pelo responsável:** D1 `azmora-inventario`, Western Europe, jurisdiction None, read replication desativada, oito tabelas, 217 KB na data; Time Travel até sete dias, sem restauro testado. R2 `azmora-fotos`, WEUR Standard, 145 objetos/11,6 MB, sem URL pública de desenvolvimento ou domínio público, CORS ou retenção automática de objetos completos identificada; abort multipart ativo, sem Bucket Lock, Data Access Logs e Local Uploads desativados. Erro 10006 da consulta com `--jurisdiction eu` é forte indício de jurisdição predefinida, não garantia absoluta nem prova de residência exclusiva europeia. Não migrar. Localização de dados não descreve todo o tratamento e suporte.

DPA Cloudflare público v6.4 (3/4/2026) prevê tratamento enquanto subcontratante quando aplicável, CCT UE e outras garantias conforme transferência; verificar termos, entidade contratante e versão efetivamente aceites, cobertura dos produtos e avaliação de transferências. Lista de subprocessadores não prova quais são usados nesta conta: https://www.cloudflare.com/cloudflare-customer-dpa/ ; https://www.cloudflare.com/gdpr/subprocessors/cloudflare-services/ . Verificar monitorização de alterações e medidas suplementares, não presumir validade automática para toda a cadeia.

**Resend — painel comunicado:** plano Free, domínio de envio verificado, Ireland eu-west-1 como região de envio, sem tracking de aberturas/cliques configurado, sem contactos de marketing; TLS enforced e envio real confirmado. Esses factos não estabelecem processamento ou armazenamento exclusivo na UE. O PDF contratual privado, 19 páginas, versão 31/12/2025, assinado pelo fornecedor em 14/01/2026, identifica Plus Five Five, Inc.; processador para dados do cliente e responsável independente por certos dados de conta/utilização; operações principais nos EUA, CCT incorporadas e DPF declarado, 14 dias de pré-aviso de subprocessadores, assistência a direitos, notificação de incidente sem demora injustificada nos termos e cifragem declarada. Texto prevê vinculação por aceitação do contrato ou execução; campo de assinatura do cliente está vazio. Identidade do cliente e termos efetivamente aceites por confirmar; não afirmar assinatura bilateral. Documento continua em Downloads fora do repositório; assegurar guarda privada durável. O fornecedor descreve 30 dias para emails/logs no Free e até 90 dias após encerramento para dados do cliente; registos de conformidade contratuais podem durar três anos. Não confundir prazos. https://resend.com/security/gdpr/ ; https://resend.com/legal/subprocessors .

**Zoho — painel comunicado:** conta europeia Mail Free, três contas e um grupo com três membros internos; geral distribui três cópias, sem membros externos ou reencaminhamento automático nas definições inspecionadas. Não exclui outras regras e cópias; respostas usam endereços individuais. Três notificações entregues em 24/11; um teste real adicional foi reportado. DPA em formulário ainda não submetido; `VirtualOffice` apresentado na interface não é prova de identidade legal. Validar titular, entidade, categorias e contrato antes de qualquer formalização. Zoho informa reciclagem por defeito 30 dias, configurável 5–180, recuperação limitada, logs de email seis meses e histórico de login 90 dias; definir a configuração efetiva e distinguir recuperação de eliminação definitiva. As fontes não comprovam genericamente 30 dias adicionais em todas as situações. https://www.zoho.com/mail/help/deleting-mail.html ; https://www.zoho.com/mail/help/data-deletion-policy.html ; https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html ; https://www.zoho.com/mail/help/api/get-login-history.html .

**Retenção de logs Cloudflare:** fornecedor indica Zero Trust Free Access Logs 24 h e Admin Logs 18 meses; aplicabilidade a cada categoria e acesso real devem ser confirmados. Auditoria administrativa não é log de acessos individuais, nem Web Analytics. https://developers.cloudflare.com/cloudflare-one/insights/logs/ .
