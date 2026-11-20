# Placeholders a substituir antes do lançamento

Os campos em falta aparecem na antevisão como «a definir», «a confirmar» ou «a validar». Os contactos provisórios são texto. Acrescentar apenas dados reais. Os blocos sem valor são omitidos na compilação comercial.

| Campo | Onde preencher | Onde aparece |
| --- | --- | --- |
| Denominação legal / entidade responsável pelo tratamento | `legalName` em `src/data/company.json` | Informação legal e Privacidade |
| NIF / NIPC | `taxId` | Informação legal |
| Dados de registo aplicáveis | `registration` | Informação legal |
| Morada completa da empresa | `registeredAddress` | Contacte-nos, rodapé, Informação legal e Privacidade |
| Morada para visitas e forma de marcação | `visitAddress` | Contacte-nos |
| Telemóvel comercial e indicativo | `phone` ou variável `PUBLIC_CONTACT_PHONE` | Cabeçalho, ficha, Contacte-nos, rodapé e Informação legal |
| Horário de atendimento | `openingHours` | Contacte-nos |
| Número do WhatsApp Business com indicativo internacional | `PUBLIC_WHATSAPP` nas variáveis de publicação ou `.env` | Ícone do WhatsApp no rodapé e em Contacte-nos |
| Endereços dos perfis de Instagram e Facebook | `social.instagram` e `social.facebook` em `src/data/company.json` | Ícones no rodapé |
| Receção das notificações do formulário | Validar a entrega em `azmorahomes@gmail.com` e a opção de resposta para o email do cliente | Formulário Contacte-nos, ligado ao Formspree |
| Validação das bases jurídicas por finalidade | `privacyBasis` em Privacidade, incluindo avaliação do interesse legítimo para contactos gerais | Privacidade |
| Processo de eliminação dos pedidos | Os proprietários revêm Formspree e Gmail. Apagar pedidos sem venda até 12 meses após a última interação, ou antes quando deixarem de ser necessários | Privacidade |
| Enquadramento das transferências dos prestadores | Rever as condições e os acordos aplicáveis às contas Formspree e Gmail utilizadas | Privacidade |
| Centro de arbitragem para os contratos presenciais | Definir o concelho e se a assinatura decorre em estabelecimento comercial. Se aplicável, preencher `ralName` e `ralUrl` | Informação legal já indica os centros insulares para vendas à distância e o diretório oficial |
| Registo no Livro de Reclamações e ligação aplicável | Confirmar o registo com a identificação legal e usar `complaintsUrl` se houver ligação específica | Rodapé e Informação legal já mostram o portal oficial |

Os nomes em camelCase pertencem a `src/data/company.json`. O texto «Chamada para a rede móvel nacional» pressupõe que o número divulgado é móvel português e que não há um preço único para a chamada. Se a linha for de outro tipo, confirmar a redação aplicável antes de publicar. [Orientação da ASAE sobre linhas telefónicas](https://www.asae.gov.pt/perguntas-frequentes1/area-economica/faqs-decreto-lei-n-592021-de-14-de-julho.aspx)

Antes de ativar o formulário, confirmar destinatário, prestadores, acessos, conservação e texto final de privacidade. Testar a receção com um pedido sobre uma casa e um pedido geral. Se não houver WhatsApp, showroom ou visitas, omitir esses dados na versão comercial.

Depois de criar o perfil comercial do WhatsApp, preencher o número em formato internacional e testar o ícone em desktop e telemóvel. As ligações sociais por configurar aparecem apenas como ícones provisórios na antevisão.

O catálogo tem uma lista própria para medidas, estado, inventário, preços, disponibilidade e aprovação de unidades. [Pendências por casa](../PENDENCIAS_CATALOGO_AZMORA.md)
