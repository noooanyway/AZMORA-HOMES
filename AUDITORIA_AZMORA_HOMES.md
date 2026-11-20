# Auditoria da Azmora Homes

20 de novembro de 2026 · Versão inicial `9082909` · Branch `codex/auditoria-integral`

## Diagnóstico

O catálogo permite chegar de uma fotografia real a um pedido identificado pela unidade. O ponto mais fraco nesse percurso é comercial. Na primeira dobra percebe-se que se vendem casas usadas, mas um cliente dos Açores ou da Madeira só descobre as condições de entrega muito abaixo dos destaques. A frase sobre descarga chega a sugerir que a descarga no porto fica por sua conta.

A tipografia Source Serif 4 e DM Sans, o verde do logótipo, a fotografia sem texto sobreposto e os ícones discretos das fichas já formam uma identidade reconhecível. Conservar os três temas, o menu legível, os filtros na página, a associação entre unidades e fotografias e a identificação das medidas de referência. A repetição dos cartões facilita a comparação no catálogo. Na página inicial, mostrar três cartões praticamente iguais aos do catálogo dá pouca personalidade à seleção editorial.

## Inspeção inicial

- Astro com TypeScript e saída estática sob um subcaminho. Dados e regras em `src/data` e `src/lib`, componentes Astro, CSS global e folhas por secção. JavaScript nativo para catálogo, seleção, diálogos e contacto. Formspree recebe os pedidos. Playwright, testes Node, verificador de artefactos e workflow manual de Pages já existem.
- Lidos o briefing original, a investigação arquivada por unidade, os registos e o manifesto de fotografias, o guia de lançamento e as páginas de privacidade e informação legal. A confirmação comercial do proprietário nesta revisão atualiza as reservas sobre IVA e transporte do briefing inicial.
- Chrome local em 375, 430, 768 e 1440 px. Capturas das primeiras dobras de início, catálogo, ficha, contactos, sobre, comparação, favoritos, privacidade e informação legal. Nessas 36 combinações a largura do documento coube no ecrã. Os estados selecionados, os filtros e as ampliações exigem ensaios interativos adicionais.
- 16 unidades, 11 T2 e 5 T3, com três ou quatro fotografias por unidade. Duas áreas anunciadas. Os registos distinguem área anunciada, intervalos de modelos comparáveis e valores desconhecidos. Preço e stock comercial continuam por confirmar nas 16.
- Lighthouse móvel local, início, uma execução inicial. Performance 68, acessibilidade 100, boas práticas 100 e SEO 100. LCP 2,5 s, CLS 0, TBT 1960 ms e transferência indicada de 300 KiB. A pontuação automática global de acessibilidade coexiste com um aviso sobre o nome de uma ligação. O TBT varia com a carga do computador. INP de clientes reais exige dados de campo.

## Problemas, prioridades e plano

| Página ou componente | Evidência e impacto para o cliente | Correção proposta | Gravidade / impacto / esforço |
| --- | --- | --- | --- |
| Início e Sobre | A introdução poderia pertencer a qualquer revendedor. Não identifica os arquipélagos no ponto de entrada. | Dizer onde se entrega e até onde vai o serviço, junto da primeira ação. | Alta / alto / baixo |
| Guia de compra, termos e ficha | Portes, IVA e descarga aparecem como custos a confirmar. O guia agrupa descarga e colocação no terreno. | Identificar IVA, envio, taxas e descarga no porto incluídos. Distinguir transporte terrestre, instalação e ligações. Explicar a reserva parcial sujeita a disponibilidade. | Alta / alto / baixo |
| Catálogo e cartões | O filtro e a ordenação dizem «área», mas só usam duas áreas anunciadas. Modelos repetidos têm o mesmo título curto. | Identificar a área anunciada nos controlos e distinguir exemplares repetidos com características já documentadas. | Média / alto / baixo |
| Comparador e favoritos | O comparador mostra «A confirmar» para áreas com referência visível no cartão. Ligações de seleções pessoais podem ser indexadas. | Partilhar a regra das medidas e indicar a natureza de cada valor. Manter acessíveis as seleções pessoais e retirá-las da indexação. | Média / alto / baixo |
| Galerias, layout partilhado | O bloco JSON inicial tem 32 706 caracteres mesmo em Contactos e nos textos legais. Inclui todas as galerias. | Transmitir o índice mínimo global, os campos de pesquisa/comparação onde são usados e apenas a galeria aberta. | Média / alto / médio |
| Navegação e formulários | Área de contactos dá «Lagos» como exemplo de destino. A pesquisa sem resultados e a remoção de filtros podem fazer desaparecer o controlo focado. | Usar um destino insular e devolver o foco a um controlo estável quando se limpa a seleção. | Média / médio / baixo |
| Acessibilidade dos cartões e galeria | Os títulos dos cartões são sempre h3, incluindo listas diretamente sob h1. O nome acessível do preço omite parte do texto visível. | Respeitar a hierarquia no contexto, aproveitar o texto visível e manter nomes distinguíveis para as ações. Testar foco, teclado e temas. | Média / médio / baixo |
| Fichas e partilha | Open Graph não indica imagem. Há descrições genéricas repetidas em páginas de descoberta. | Associar a capa real e texto alternativo às fichas, rever descrições e testar URLs absolutas sob a base de Pages. | Média / médio / baixo |
| Rodapé | Em produção «Redes sociais» fica sem destinos quando nenhum canal existe. | Mostrar a secção de acordo com os canais configurados e preservar os placeholders de antevisão. | Baixa / médio / baixo |
| Cabeçalho, mobile e fotos | Cabeçalho amplo em desktop, colapsado em tablet, menus usam diálogos com foco. Na ficha mobile as especificações precedem a imagem. | Conservar a navegação e a galeria ampliada. Avaliar a prioridade da foto em mobile com a proposta editorial abaixo. | Baixa / médio / médio |
| Informação legal e canais | Identificação empresarial incompleta. Sem telemóvel ou WhatsApp comercial configurados. O frontend aceita o pedido mediante resposta positiva do prestador. | Dados e contas reais dependem dos proprietários. Verificar o caminho do formulário com respostas locais de sucesso e erro. Manter email direto. | Alta / alto / depende da empresa |

## Direção artística para aprovação

Proponho transformar apenas a seleção da página inicial numa abertura editorial. Uma fotografia principal teria uma legenda sobre uma característica confirmada dessa unidade, ao lado de duas alternativas mais compactas. Em telemóvel a fotografia e a legenda viriam juntas, seguidas das alternativas. O catálogo conservaria a grelha regular. Assim a página inicial ajuda a descobrir e o catálogo permite comparar. Antes de redesenhar, aprovar esta composição e a prioridade da fotografia na ficha mobile. O logótipo, as cores e o sistema tipográfico mantêm a identidade aprovada.

## Execução e limites

1. Fixar o ponto de recuperação e guardar as capturas iniciais.
2. Corrigir o conteúdo comercial e o percurso do orçamento com as condições confirmadas.
3. Corrigir o comparador, os rótulos, a navegação por teclado e o volume de dados. Completar a partilha social.
4. Compilar em modo comercial, validar referências locais, cruzar o manifesto com as fichas e testar o percurso no Chrome. Comparar capturas e repetir o Lighthouse.
5. Registar resultados, limites das medições, decisões comerciais em aberto e proposta visual separada. A publicação depende de decisão do proprietário.
