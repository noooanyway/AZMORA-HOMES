# Email, autenticação e validação manual

O proprietário confirmou Zoho a receber em `geral@azmorahomes.pt`, domínio Resend verificado e assinatura em funcionamento. Não foi inspecionada a conta, nem cabeçalhos reais de entrega. Não alterar automaticamente o DNS. O Resend envia notificações internas a partir de `send.azmorahomes.pt`; respostas humanas são feitas no Zoho por pessoas autorizadas.

## DMARC e entregabilidade

1. No DNS da Cloudflare abrir azmorahomes.pt → DNS → Records. Localizar `_dmarc`, SPF da raiz, `zmail._domainkey` e os registos do Resend. Não apagar nem duplicar SPF/DKIM/MX. Anotar a configuração atual em local privado.
2. No Zoho Admin Console → Domains → azmorahomes.pt verificar SPF, DKIM e MX. No Resend → Domains → send.azmorahomes.pt verificar SPF/DKIM e estado Verified.
3. Enviar mensagens de teste do Zoho para caixas próprias Gmail e Outlook e enviar uma notificação do website com dados fictícios. Em Gmail abrir mensagem → menu → Mostrar original; em Outlook abrir propriedades/detalhes da mensagem. Confirmar SPF, DKIM e DMARC pass, domínios alinhados com o From e chegada à caixa de entrada. SPF sozinho não assegura alinhamento; testar também DKIM. Não encaminhar cabeçalhos com dados reais para canais públicos.
4. A política anteriormente observada `p=none` monitoriza, sem rejeição. Antes de alterar, configurar endereço `rua` operacional para relatórios e analisar todas as fontes legítimas por várias semanas. Depois avaliar `p=quarantine` progressivo e só mais tarde `p=reject`, se o alinhamento estiver comprovado e os responsáveis aprovarem. Ver https://www.zoho.com/mail/help/adminconsole/dmarc-policy.html. Não inventar endereço de relatórios.

## Zoho e acesso

1. Em https://accounts.zoho.eu/ → segurança da conta, confirmar MFA ativo, métodos de recuperação e códigos de emergência guardados em local seguro.
2. No Zoho Admin Console rever utilizadores e permissões. Criar acesso pessoal separado para cada pessoa quando o plano o permitir; confirmar efetivamente no painel a delegação e o preço antes de a ativar. A tabela comercial varia por plano/região; não assumir delegação completa gratuita. Não partilhar password nem autenticador.
3. O plano gratuito no datacenter europeu é anunciado até cinco utilizadores e 5 GB cada, sem IMAP/POP/ActiveSync; confirmar plano real e limites: https://www.zoho.com/mail/compare/overview.html.
4. Repetir testes de entrega depois de qualquer mudança DNS ou fornecedor. A aceitação do Resend não prova entrega, e sem webhooks de entrega o painel não fornece prova de leitura.

## Nome de apresentação do Zoho

Em https://mail.zoho.eu/ entrar na conta profissional → Settings → Send Mail As → selecionar `geral@azmorahomes.pt` → Display Name = `Azmora Homes` → Update. Enviar mensagem de teste para uma caixa controlada e confirmar o nome e endereço. https://www.zoho.com/mail/help/dynamic-from-address.html

Consulta DNS pública não destrutiva nesta revisão: DMARC presente com `p=none`; existe um único TXT SPF na raiz e inclui `zohomail.eu`; os seletores TXT `zmail._domainkey.azmorahomes.pt` e `resend._domainkey.send.azmorahomes.pt` responderam. A presença de registos não comprova alinhamento nem entrega; testar cabeçalhos de mensagens reais antes de alterar política. Nenhum registo DNS foi alterado.
