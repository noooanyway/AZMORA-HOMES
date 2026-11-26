# Azmora Homes — o que falta para concluir

**Estado em 26/11/2026:** o website já está publicado. A migração 0005 foi aplicada, o commit `957e455` foi enviado e o deployment automático concluiu. Os quatro documentos legais continuam preliminares; a informação do responsável pelo tratamento é prioritária, porque o site já pode receber pedidos.

## 1. Proprietários e privacidade

- [ ] Enviar [APROVACAO_FINAL_PROPRIETARIOS.txt](APROVACAO_FINAL_PROPRIETARIOS.txt) ao Rúben e à Filipa e receber as respostas, incluindo identificação legal do operador e do responsável pelo tratamento, contactos, retenção, fornecedores e reclamações.
- [ ] Rever as condições comerciais e as fichas realmente publicadas; confirmar direitos sobre as imagens.
- [ ] Concluir e obter validação jurídica e aprovação das quatro políticas. A revisão preliminar está em [REVISAO_PRELIMINAR_RGPD_COOKIES.md](REVISAO_PRELIMINAR_RGPD_COOKIES.md).

## 2. Website e ADMIN

- [ ] Testar no ADMIN publicado as configurações: abrir, guardar um rascunho, confirmar que não altera o site, publicar uma alteração autorizada e verificar o resultado. Testar recuperação com cuidado e sem substituir trabalho dos proprietários. A correção e a base estão publicadas, mas o percurso autenticado real ainda não foi confirmado.
- [ ] Inserir os quatro textos legais aprovados e disponibilizar `/privacidade/`, `/termos/`, `/cookies/` e `/aviso-legal/`; atualizar ligações do rodapé, formulário e sitemap. As duas últimas são apenas estruturas de desenvolvimento local.
- [ ] Testar consentimento e retirada, catálogo, fotografias, contactos, formulário, CRM e notificações; coordenar eventuais pedidos sintéticos com os proprietários.
- [ ] Rever títulos, descrições, sitemap e apresentação em computador e telemóvel.

## 3. Cloudflare e correio

- [ ] Confirmar que cada proprietário autorizado consegue entrar no ADMIN e que a política Access/MFA protege `/admin/` e os seus descendentes; rever também previews e deployments antigos.
- [ ] Confirmar Turnstile, ligações à D1 e ao R2 privado, destinos das notificações e receção no Zoho, sem alterar a configuração durante a verificação.
- [ ] Confirmar nos painéis e na rede do browser que não há injeção nem pedidos de Cloudflare Web Analytics. A verificação pontual do HTML não substitui o teste de rede.
- [ ] Confirmar contratos de tratamento, titularidade e transferências de Cloudflare, Resend e Zoho; verificar o estado do DPA Zoho com o responsável. Não se presume que a região de envio prove tratamento exclusivo na UE.
- [ ] Rever as melhorias de segurança do Zoho anteriormente adiadas: TFA obrigatório, alertas, credenciais temporárias e recuperação. Decidir e executar apenas com os responsáveis pela conta.

## 4. Backups, entrega e manutenção

- [ ] Fazer e verificar uma cópia completa D1 + R2, com restauro isolado e segunda cópia protegida. Foi feita uma exportação D1 antes da 0005, restaurada em memória; não incluiu R2 nem prova consistência entre serviços.
- [ ] Definir quem faz backups, frequência, retenção, localização segura e ensaios de recuperação.
- [ ] Fazer os testes finais em produção, limpar apenas dados de teste identificados e verificar o deployment.
- [ ] Entregar o manual, demonstrar o ADMIN aos proprietários e definir responsável e condições de manutenção.

A migração 0005 **não deve ser aplicada novamente**. As consultas de leitura de 26/11/2026 confirmaram 0001–0005 aplicadas e apenas `0006_commercial_history.sql` pendente; verificar de novo antes da publicação. O procedimento de futuros deployments e rollback encontra-se em [PUBLICACAO_E_ROLLBACK.md](PUBLICACAO_E_ROLLBACK.md); distinguir passos históricos já executados dos passos necessários a uma nova publicação.
