# Azmora Homes — entrega aos responsáveis e tarefas técnicas

**Documento de coordenação — 25/11/2026. Não é parecer jurídico, política aprovada nem autorização de publicação.** Destinatários: Ruben e Filipa, com apoio dos seus profissionais. O programador é responsável pelo desenvolvimento e gestão técnica do website; não é, por esse facto, responsável pela atividade, vendedor ou responsável pelo tratamento. A definição jurídica depende dos factos e da validação competente.

## Decisão de âmbito

A investigação e os registos D.2 e D.3 permanecem guardados como referência preliminar, sem validação profissional presumida. A investigação jurídica aprofundada e a elaboração de contratos de venda e modelos operacionais pelo programador estão suspensas. Foram preparadas quatro minutas específicas do website para revisão dos responsáveis e jurista: termos de utilização, privacidade, cookies e aviso legal. O gerador de documentos comerciais no ADMIN está fora do âmbito atual. O programador implementará conteúdos e medidas depois de receber documentação aprovada e instruções claras; não decide condições comerciais nem aprova obrigações legais ou contabilísticas.

## Informação já confirmada — não voltar a solicitar

- Casas móveis em segunda mão para os Açores e a Madeira; não há vendas para Portugal continental. Pretende-se abranger todas as ilhas habitadas, sujeitas à confirmação logística.
- Preços com IVA e transporte até ao porto marítimo da ilha de destino, nas condições do orçamento. Descarga, transporte dentro da ilha, preparação do terreno, instalação e ligações são da responsabilidade comercial do cliente. Esta repartição não determina, por si, os direitos legais ou a transferência do risco.
- Visitas mediante agendamento e deslocação ao local; preços não negociáveis; não é disponibilizado financiamento. Casas inspecionadas e reparadas quando necessário; mobiliário e equipamentos apresentados incluídos de acordo com cada unidade.
- Telefones +351 913 667 365 e +351 961 533 260; WhatsApp apenas no primeiro; email geral@azmorahomes.pt. Atendimento de segunda a sexta, 08h00–17h00, em português, inglês e francês. Não existe morada de atendimento presencial.
- Instagram confirmado: https://www.instagram.com/azmorahomes/ (ainda não implementado no website).
- Fase C publicada segundo confirmação dos responsáveis; D.1 comercial implementada e testada localmente, ainda não publicada. O envio real do formulário foi comunicado como bem-sucedido.

## Lista única para finalizar as quatro minutas

As [quatro minutas internas](legal/drafts/) estão preparadas para revisão: os proprietários não precisam de redigir os textos de raiz. Não publicar sem preencher os campos, validar as afirmações e aprovar as versões finais.

**Dados factuais a fornecer pelos proprietários**

- Identidade legal, NIF/NIPC, endereço geográfico e registos aplicáveis do operador do website; identificar também vendedor e faturador quando a informação seja exigível, sem presumir sociedade ou morada de atendimento.
- Identidade e contacto do responsável pelo tratamento, eventual responsável conjunto e encarregado de proteção de dados, se aplicável; confirmação do canal de privacidade e das pessoas autorizadas a aceder aos pedidos.
- Tratamentos efetivos de contactos, WhatsApp e Instagram, categorias de destinatários, acessos e eventuais cópias, e prova dos direitos de utilização de conteúdos de terceiros. Não partilhar credenciais.
- Prazos ou critérios reais para pedidos, segurança, emails, histórico, exportações e backups, incluindo procedimento após restauro; confirmações contratuais dos fornecedores, transferências efetivas e garantias e forma de as consultar.
- Informação verificável sobre registo do Livro de Reclamações, eventual vínculo RAL e contactos legalmente relevantes. Não apresentar inscrições ou adesões sem prova.

**Decisões para aprovação dos proprietários**

- Aprovar responsáveis, finalidades, critérios de conservação, contactos, textos e data de vigência; designar quem atende pedidos de direitos e quem aprova alterações futuras.
- Decidir, após parecer jurídico, se mantêm a configuração de tecnologias atual, se autorizam adaptações ou se pretendem um mecanismo de consentimento; decidir também eventual mitigação temporária do formulário.
- Aprovar a apresentação pública do Instagram confirmado no website e o momento da sua inclusão na D.1. A confirmação do endereço não é uma autorização para publicar nesta execução.

**Questões para validação jurídica**

- Validar identidade, informação obrigatória, fundamentos RGPD propostos por finalidade, interesses legítimos e respetiva ponderação; verificar tratamento por telefone, WhatsApp e Instagram, direitos, transferências e contratos dos fornecedores.
- Determinar a necessidade de consentimento para cada tecnologia, incluindo leituras de localStorage na abertura da página, RUM, Turnstile e cookies Access; decidir o tratamento de alternativas na política antes de publicar.
- Rever os quatro documentos, a informação do formulário, a identificação legal e as menções ao Livro de Reclamações e RAL. Quando necessário, obter validação contabilística da identificação fiscal e faturação; condições de venda e contratos continuam fora do âmbito destas minutas.

**Alterações técnicas eventualmente necessárias**

- Inserir dados e textos aprovados nas páginas públicas, criar/ligar a política de cookies e adequar a primeira camada do formulário; remover todos os marcadores e alternativas não escolhidas.
- Se a decisão jurídica o exigir, adaptar leituras antecipadas, desativar ou bloquear mecanismos sujeitos a consentimento até escolha válida e disponibilizar gestão e retirada de consentimento. Nenhum banner foi implementado.
- Adicionar a ligação Instagram na configuração existente depois de autorizada a implementação, e testar os restantes contactos D.1. Verificar em browser e produção autorizada o comportamento real, a acessibilidade, os links, os serviços e a ausência de documentação interna no build.

A prioridade imediata continua a ser identificar o responsável pelo tratamento; receber documentos quase completos não substitui a decisão nem a aprovação legal dos proprietários.

## Risco atual e opções técnicas — propostas, não executadas

O website publicado recebe pedidos e a página de privacidade indica que a identidade do responsável está por confirmar. Os responsáveis devem decidir prontamente com jurista a medida provisória. O programador pode preparar, mediante instrução:

- **Continuar a recolha:** implementar a informação e instruções de privacidade validadas pelos responsáveis e jurista; isto depende de identificarem o responsável e decidirem fundamentos, retenção e destinatários. Não supõe conformidade apenas por publicar texto.
- **Suspender pedidos pelo formulário:** desativar a submissão também no endpoint do Worker, além de desativar/ocultar a interface e comunicar temporariamente a indisponibilidade; testar que pedidos diretos são recusados. Manter catálogo, ADMIN, CRM e dados existentes, sem eliminar registos, e planear reversão testada. Turnstile pode deixar de ser carregado na página se a implementação o permitir e isso for aprovado. A suspensão exige publicação autorizada e não elimina pedidos já recebidos ou cópias.
- **Canais e restantes tratamentos:** email e WhatsApp diretos continuam a permitir envio de dados mesmo com formulário suspenso; os responsáveis têm de decidir, com apoio jurídico, se permanecem disponíveis e que informação fornecer. A desativação do formulário não suspende por si Web Analytics, logs, cookies de segurança ou acessos ao ADMIN. Cada mecanismo carece de decisão própria; não se presume que remover ligações elimine todos os tratamentos.
- **Identificação atual validada:** implementar a identificação fornecida pelos responsáveis mesmo que a futura estrutura esteja ainda por definir, apenas depois de validação jurídica e sem presumir que a pessoa técnica é responsável. Esta opção pode coexistir com as anteriores conforme decisão dos proprietários.

Nenhuma destas alternativas foi implementada ou recomendada como solução jurídica suficiente. D.1 pode ser publicada separadamente mediante autorização, mas não resolve a identificação do responsável nem substitui a análise de privacidade; os proprietários devem decidir o momento e as dependências com os seus profissionais.

## Checklist exclusiva do programador

### A aguardar conteúdos ou decisões dos responsáveis

- [ ] Receber identificação do responsável pelo tratamento, instruções e textos finais validados; verificar que não contêm marcadores pendentes antes de implementar.
- [ ] Receber decisão dos responsáveis sobre eventual mitigação provisória e autorização para qualquer alteração pública. Se pedida a suspensão do formulário, cobrir interface e endpoint; preservar CRM, dados e reversão.
- [ ] Implementar os textos e ligações legais aprovados e a solução de cookies/consentimento apenas de acordo com a decisão fundamentada dos responsáveis e do jurista.
- [ ] Rever e testar a D.1 comercial existente antes da publicação autorizada; verificar em produção telefones, WhatsApp, textos, catálogo, formulário, SEO e ADMIN, sem enviar dados reais sem coordenação.
- [ ] Executar testes locais adequados, tipos, builds e verificação de diff; validar responsividade, acessibilidade e que documentos internos não entram no output. Após autorização, publicar e efetuar testes de produção acordados.

### Segurança e recuperação — adiadas, executar apenas quando autorizadas e coordenadas

- [ ] Coordenar ativação de TFA obrigatório Zoho e os primeiros acessos e MFA individuais de Ruben e Filipa.
- [ ] Coordenar política Zoho de mínimo de 16 caracteres, histórico de cinco e manutenção de um carácter especial e um numérico, sem expiração periódica; ativar alertas de início de sessão suspeito.
- [ ] Substituir credenciais temporárias anteriormente partilhadas e confirmar recuperação segura das contas.
- [ ] Avaliar e testar controladamente HttpOnly, Binding Cookie, SameSite e âmbito do cookie Cloudflare Access; confirmar duração global da sessão, sem prejudicar acesso.
- [ ] Coordenar cópia manual real e teste de recuperação isolada, incluindo reconciliação de eliminações. Backups automáticos permanecem adiados.
- [ ] Apoiar tecnicamente o inventário e a formalização de fornecedores após decisão dos titulares; a aceitação contratual e respetiva identidade competem aos responsáveis.

As minutas de website são preliminares e internas; sem alterações de infraestrutura, dados ou serviços nesta entrega. As verificações anteriores em `privacidade/` e `legal/` são históricas e subordinadas à presente redefinição de responsabilidades e âmbito.
