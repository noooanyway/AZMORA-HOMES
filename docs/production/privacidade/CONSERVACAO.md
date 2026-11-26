# Proposta de conservação e eliminação

**Interno — preliminar, não publicar; consulta 25/11/2026. Responsável pelo tratamento e aprovação jurídica pendentes.** Factos observados são identificados; descrições de fornecedores são condicionadas à configuração contratada.

**Precedência:** a consolidação de 25/11/2026 no fim deste documento atualiza e substitui os pontos antigos que lhe sejam contrários. Dados de painel são comunicados pelo responsável, não verificados diretamente nesta intervenção.

Sem prazos aprovados: estes grupos exigem responsável, finalidade, marco inicial, prazo fundamentado, revisão, sistema e método de eliminação. Não fixar valor por analogia.

| Categoria | Proposta de decisão |
|---|---|
| pedidos sem venda | estabelecer período proporcionado após fim da interação, com revisão e eliminação |
| clientes com venda e contratos | separar prospeção de documentação contratual e exercício de direitos; avaliar prazos de defesa e obrigações |
| faturas | contabilista confirma prazo e documentos obrigatórios; não eliminar antes da obrigação |
| logs de segurança | confirmar configuração, necessidade, acesso e expiração por serviço |
| histórico administrativo | correlacionar com pedido, controlar notas e acesso; eliminar quando elegível |
| email e exportações | mapear caixas, respostas, anexos e destinatários; aplicar retenção coerente e documentada |
| backups | definir rotação, acesso, eliminação segura e procedimento após restauro; conservar apenas tempo justificado |

Receção cria pedido e evento; edição de estado e notas cria eventos. Arquivar altera estado, não elimina. Eliminação no ADMIN exige arquivo, revisão correta e envio não em curso; trigger elimina histórico do mesmo contacto. A eliminação não apaga emails, ficheiros exportados, logs, cópias de fornecedores, backups nem necessariamente versões de recuperação D1. O restauro pode reintroduzir dados apagados: manter registo mínimo protegido de eliminações, reconciliar antes de disponibilizar o restauro e verificar obrigações legais. Hashes antiabuso expiram logicamente mas são apagados na submissão seguinte; nunca prometer apagamento físico exato.

## Constatações adicionais e reservas

Resend declara retenção operacional de emails/logs de 30 dias no plano Free enquanto ativa a conta; o DPA descreve eliminação dos dados de cliente até 90 dias após cessação e registos de conformidade durante três anos. Pedido de remoção antecipada de email enviado depende de contacto com o fornecedor; o mesmo não significa eliminação automática do email em Zoho. https://resend.com/security/gdpr/ .

Zoho: três cópias por distribuição, além de respostas/exportações e outras cópias possíveis. Reciclagem padrão 30 dias e faixa 5–180 reportadas pelo fornecedor, dependentes da data de receção e configuração; recuperação e logs seguem condições próprias. A afirmação de mais 30 dias após remoção da reciclagem não foi verificada como regra universal; confirmar por conta e documento aplicável. Não inferir que caixa ativa inteira expira em 30 dias. Histórico de autenticação é categoria separada de logs de email.

Cloudflare Zero Trust Free: Access logs 24 horas e admin logs 18 meses segundo documentação de fornecedor, sujeitos a plano/configuração. D1 Time Travel até sete dias foi observado como opção, sem teste de restauro; backups manuais seguem rotação por definir. Dados apagados podem regressar após restauro: reconciliar antes de reabrir acesso. Não adotar estes prazos técnicos como política jurídica aprovada.
