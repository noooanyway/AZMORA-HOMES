# Preparar o lançamento da Azmora Homes

A [lista de placeholders](PLACEHOLDERS_AZMORA.md) indica os dados por preencher, o respetivo campo de configuração e a página onde aparecem.

## Ativar o formulário de contacto

1. Criar um formulário no [Formspree](https://formspree.io/) e confirmar o endereço comercial que deve receber as notificações.
2. Copiar o endereço público do formulário, no formato `https://formspree.io/f/...`, para `PUBLIC_FORM_ENDPOINT` em `.env` local ou nas variáveis do workflow GitHub Pages. Definir `PUBLIC_CONTACT_EMAIL` se o endereço também for para aparecer no site. O destinatário é configurado no Formspree.
3. Na versão publicada, testar um pedido a partir de uma ficha e confirmar a entrega e a opção de responder para o email do cliente. Repetir com um pedido geral e um pedido com várias casas. Confirmar as definições de spam e as regras de privacidade e retenção.

O assunto segue o formato `[Azmora Homes] Preço e disponibilidade — Exposul 01` ou `[Azmora Homes] Pedido de contacto — Pedido geral`. Sem uma casa escolhida, usa a tipologia pretendida ou «Pedido geral». O email inclui os nomes e links das casas, a mensagem, os dados de contacto e os campos opcionais que o visitante preencher. O campo `subject` preenche o assunto no Formspree. [Documentação do assunto no Formspree](https://help.formspree.io/articles/building-your-form/email-subject-line)

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
