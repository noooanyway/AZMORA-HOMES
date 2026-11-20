# Preparar o lançamento da Azmora Homes

A [lista de placeholders](PLACEHOLDERS_AZMORA.md) indica os dados por preencher, o respetivo campo de configuração e a página onde aparecem.

## Ativar o formulário de contacto

1. O formulário [Azmora Homes no Formspree](https://formspree.io/f/xkjrzaav) já está ligado ao site. Na configuração de notificações, confirmar que `azmorahomes@gmail.com` é o destinatário verificado.
2. O endereço público e o formulário estão configurados em `src/data/company.json`. As variáveis opcionais `PUBLIC_CONTACT_EMAIL` e `PUBLIC_FORM_ENDPOINT`, em `.env` ou no GitHub Actions, permitem substituir estes valores.
3. Na versão publicada, testar um pedido a partir de uma ficha e confirmar a entrega e a opção de responder para o email do cliente. Repetir com um pedido geral e um pedido com várias casas. Confirmar as definições de spam e as regras de privacidade e retenção.

O assunto segue o formato `[Azmora Homes] Preço e disponibilidade — IRM Super Venus - T2 · AZ-1234ABCD`. Sem uma casa escolhida, usa a tipologia pretendida ou «Pedido geral». A referência aparece também na confirmação do site e no corpo da notificação. Se faltar uma notificação, pode ser usada para procurar o pedido no Formspree e no Gmail. A confirmação do site indica que o Formspree aceitou o pedido. O email apresenta os nomes das casas numa lista e as ligações para as fichas num bloco separado. As ligações usam endereços baseados no nome da casa. Os dados de contacto aparecem primeiro. Os campos opcionais indicam quando não foram preenchidos. A caixa de privacidade é obrigatória no site. [Documentação do assunto no Formspree](https://help.formspree.io/articles/building-your-form/email-subject-line)

## Gestão dos pedidos e privacidade

- O contacto para exercer direitos é `azmorahomes@gmail.com`. O acesso ao Formspree e ao Gmail comercial cabe aos proprietários. Confirmar as permissões e remover acessos que já não sejam necessários.
- Para pedidos sem venda, registar a data da última interação e rever os pedidos regularmente. Apagar os que ultrapassem 12 meses e os que já não sejam necessários, tanto no Formspree como no Gmail. A política documenta este critério. A eliminação depende da rotina de revisão dos proprietários.
- Validar o interesse legítimo para contactos gerais e as condições de tratamento e transferências das contas em uso. Completar a identificação legal, confirmar o centro de arbitragem competente e validar o registo no Livro de Reclamações. [RGPD](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=pt) · [Resolução de conflitos de consumo](https://www.gov.pt/guias/resolucao-de-conflitos-de-consumo) · [Livro de Reclamações na ASAE](https://www.asae.gov.pt/reclamacoes-e-denuncias/livro-de-reclamacoes.aspx)

## Decisões comerciais antes de abrir ao público

- Definir quem recebe os pedidos, em quanto tempo se responde e quem mantém o catálogo atualizado.
- Para cada unidade selecionada, confirmar o preço e o que inclui, situação comercial, estado, inventário, medidas e fotografias atuais. Definir o tratamento de IVA e a validade de um orçamento.
- Definir como funcionam visitas, reservas, pagamentos e cancelamentos, incluindo quando uma casa deixa de aparecer disponível.
- Definir os destinos do transporte, como se calcula o orçamento, quem verifica o acesso ao terreno e quem é responsável pela descarga, instalação e ligações. Confirmar a garantia e o apoio pós-venda aplicáveis.
- Na secção «Como funciona», confirmar antes de anunciar como incluídos o IVA, os portes marítimos e as taxas portuárias. Para Açores e Madeira, definir os portos servidos, o que fica a cargo da Azmora e o que se orçamenta à parte, incluindo transporte por estrada, descarga, grua e colocação.
- Confirmar a entidade responsável, os contactos públicos, os textos legais e a política de tratamento dos pedidos. Rever quem pode aceder às mensagens e durante quanto tempo são guardadas.

## Última revisão visual

- Rever a ordem das fotografias em cada ficha e escolher capas que mostrem o exterior e distingam exemplares do mesmo modelo.
- Usar o mesmo tratamento visual em preço, disponibilidade e chamada para contacto no catálogo e nas fichas. Rever a versão móvel com preços, estados e conteúdo reais, incluindo casos reservados ou vendidos.
- Acrescentar à página Contacte-nos os dados comerciais, horários ou forma de combinar visitas quando estiverem definidos. Verificar também o aspeto da confirmação e dos erros de envio.
