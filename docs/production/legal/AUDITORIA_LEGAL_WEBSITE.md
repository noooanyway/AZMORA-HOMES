# Auditoria do website — prioridades

**INTERNO — PRELIMINAR, NÃO PUBLICAR. Consulta: 25/11/2026. Não constitui parecer jurídico, validação da atividade ou instrução contratual.** A aplicação depende do vendedor, contrato, unidade e destino. Jurista/contabilista devem confirmar redação consolidada na data do ato. A data de publicação do diploma original não garante a sua versão vigente.

Escopo: análise do código e configurações locais D.1; Fase C foi reportada publicada. As alterações locais podem diferir do site em produção; não foi realizado novo levantamento completo de produção nesta fase. Classificação de risco do projeto não é decisão de ilegalidade.

| Prioridade | Evidência | Obrigação condicional / mitigação proposta, sem execução |
|---|---|---|
| Crítico | `company.json` sem entidade/morada; privacidade reconhece pendência enquanto formulário recebe pedidos | Identificar decisor e base/informação RGPD arts. 5.º, 6.º, 13.º; avaliar suspensão temporária da recolha ou informação mínima validada, sem apagar dados. Validar jurista. |
| Alto | `termos.astro` refere identificação por confirmar; prestador e NIF desconhecidos | Identificar operador e dados obrigatórios antes de vendas, DL 7/2004 art. 10.º; sem inventar entidade. |
| Alto | link genérico para livro; inscrição efetiva desconhecida | Verificar aplicabilidade e inscrição, titular, entidade competente e ligação; não apresentar registo como ativo sem prova. DL 156/2005. |
| Alto | RAL regional indicado genericamente | Confirmar jurisdição, vínculo, informação efetivamente exigida por Lei 144/2015 art. 18.º; rever texto de vendas à distância por email que pode ser excessivamente específico. |
| Alto | ficha e FAQ: porto e responsabilidades comerciais | Esclarecer que divisão de custos não elimina direitos legais nem determina transferência do risco; DL 84/2021 art. 11.º. Confirmar taxas e custos em orçamento. |
| Alto | ausência de informação contratual, garantia, devolução e assistência | Antes de contratação à distância, confirmar pressupostos e informações do DL 24/2014 arts. 4.º–6.º, 10.º–13.º e DL 84/2021; não afirmar ausência de garantia. |
| Médio | privacidade com base e retenção por definir; prestadores e RUM | Completar informação RGPD art. 13.º, transferências e retenção e investigar terminal; ver D.2. |
| Médio | inspeção/reparação comunicadas | Garantir evidência real por unidade, descrição de equipamentos e defeitos, evitar afirmações específicas sem prova; DL 84/2021 art. 7.º. |
| Baixo | consultas municipais e navegação | Reforçar orientação específica por município e unidade, sem prometer licenciamento. |

Nada foi publicado ou alterado. A priorização imediata não constitui ordem para alterar site; apresentar opções aos responsáveis e jurista.

## Observação direta da produção — 25/11/2026

Consulta anónima não destrutiva em Chrome: início, `/contactos/`, `/privacidade/` e `/termos/` devolveram HTTP 200. A política publicada declara expressamente que denominação e morada do responsável estão por confirmar e apresenta base e retenção por definir; o formulário está presente. Os termos exibem a mesma pendência de identificação e ligação genérica ao Livro Eletrónico; não se verificou registo. A página inicial publicada diz transporte até à ilha; a D.1 local precisa porto marítimo. Os termos apresentam centros de referência para vendas à distância por email sem comprovar vínculo. São riscos indicados na matriz; a observação não testa um processo de venda nem prova não conformidade.
