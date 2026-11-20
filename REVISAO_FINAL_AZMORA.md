# Revisão final da Azmora Homes

20 de novembro de 2026 · Branch local `codex/auditoria-integral` · Referência inicial `9082909`

O percurso de escolha, comparação e pedido passou nos testes locais de produção. O site explica agora que a entrega da Azmora termina no porto comercial da ilha. O catálogo continua a apresentar as 16 unidades com preço e disponibilidade sob consulta. O lançamento comercial ainda depende da identificação da empresa e da operação descrita no final deste documento.

## O que mudou para o comprador

| Onde | Resultado |
| --- | --- |
| Início, Sobre e compra | Açores e Madeira aparecem logo na apresentação. O orçamento inclui IVA, transporte marítimo, descarga no porto e taxas portuárias. O guia identifica os encargos do cliente na ilha, a verificação municipal e a possibilidade de pagamento parcial para reservar após confirmação. |
| Ficha e contactos | A partir do preço é possível pedir um orçamento com a unidade selecionada ou consultar o que inclui a entrega. O exemplo de localidade passou a «Ponta Delgada, São Miguel». Bens e equipamentos continuam específicos de cada unidade. |
| Cartões | As duas O’Hara 734, as duas Super Mercure e as duas Super Octália distinguem-se por características presentes nas fichas. Os quatro títulos alterados usam dados que já constavam das respetivas descrições. As ligações existentes conservam o mesmo endereço. As ações de preço e comparação ficam alinhadas no fundo dos cartões da mesma linha. |
| Pesquisa e comparação | Os controlos indicam que a área mínima e a ordenação consideram a área anunciada. Na tabela, «29–30 m² (de referência)» e «30 m² (no anúncio)» têm significados distintos. As medidas desconhecidas continuam assinaladas. A barra acomoda nomes compridos e permite retirar a unidade. |
| Acessibilidade | O foco regressa à pesquisa ao remover uma etiqueta de filtro ou recuperar de uma pesquisa sem resultados. Os títulos dos cartões respeitam a hierarquia da página. O nome acessível do pedido de preço contém o texto da ligação. Nas fichas, cada rótulo e valor forma um par semântico válido. Corrigida a união tipográfica entre número e unidade. |
| Rodapé e identidade | O rodapé redistribui as colunas quando não há redes sociais ativas. Conforme a decisão do proprietário, foi preservada a composição dos destaques. A revisão conserva as fontes, os três temas e o logótipo aprovado. |
| Partilha e pesquisa externa | Cada ficha declara a fotografia da própria unidade, o texto alternativo, as dimensões da imagem e o percurso estruturado de navegação. Início, catálogo e Sobre têm descrições próprias. Favoritos e Comparar têm `noindex` e o sitemap continua a listar os 22 destinos públicos pretendidos. |

[Comparação visual das capturas de início, catálogo e ficha](docs/auditoria/comparacao.webp) · [Diagnóstico anterior às correções](AUDITORIA_AZMORA_HOMES.md)

## Verificações

| Ensaio | Resultado observado |
| --- | --- |
| Astro e TypeScript | `npm run check` terminou sem erros, avisos ou sugestões. Builds de produção e de antevisão concluídos, ambos com 25 páginas e 16 fichas. O verificador confirmou também o noindex da antevisão. |
| Catálogo e proveniência | `npm run catalog:validate` validou 16 unidades. Os IDs e URLs coincidem com o arquivo de fontes. Os 11 T2 e cinco T3 coincidem com as contagens de quartos. As 63 fotografias e miniaturas foram cruzadas com a página, o ID e a ordem do manifesto. As descrições técnicas foram avaliadas pelos registos do projeto. A medição física e a inspeção atual de cada casa cabem ao fornecedor. |
| Regressão | Seis testes Node passaram. Novos casos cobrem as medidas de comparação e a correspondência entre a galeria e o manifesto. |
| Navegação e fotografias | Chrome em 375, 430, 768 e 1440 px. Nove páginas por largura, antes e depois, sem transbordo horizontal do documento. As 63 imagens ampliadas descodificaram com caminho e texto alternativo corretos. Testados anterior, seguinte, teclado, clique exterior, Escape e reposição do foco. |
| Pesquisa, favoritos e comparação | Testados o salto de teclado para o conteúdo, as três perguntas frequentes, a pesquisa rápida da página inicial e a ordenação por nome. Exercitados os cinco filtros individualmente, filtros combinados, pesquisa sem resultados e recuperação, recarregamento por URL, vista em lista e ordenação por área. Favoritos persistentes, remoção, limite de três casas e pedido conjunto passaram. Em 375 px a tabela com três casas permite deslizar horizontalmente dentro da página. |
| Contactos e privacidade | Testados o email comercial, a seleção múltipla, o motivo no assunto, os campos opcionais, a referência do pedido e o bloqueio sem aceitação da privacidade. O ensaio interceta a chamada ao Formspree. Simulou rejeição, conservação dos campos, reenvio com a mesma referência e confirmação positiva. Telefone e ligação WhatsApp foram exercitados com números de ensaio numa compilação isolada. A ligação WhatsApp continha a casa selecionada. |
| Ligações, dados públicos e consola | `node scripts/verify-output.mjs` verificou 1 374 ligações e recursos locais e pesquisou referências públicas ao fornecedor. Os nove destinos externos institucionais responderam com HTTP 200. A ronda pelas vistas, filtros e galerias terminou sem erros de JavaScript ou avisos de consola. |
| Acessibilidade | axe em nove páginas, incluindo o catálogo com filtros abertos, nos três temas. O primeiro ensaio detetou uma lista de definições inválida na ficha nos três temas. Após a correção, as 27 combinações terminaram sem violações detetadas pelas regras WCAG A/AA executadas. Chrome testou também a preferência do dispositivo, a persistência do tema e o menu mobile. Falta validação humana com leitor de ecrã, Safari/iOS e equipamento físico. |

## Performance, arquitetura e alojamento

Lighthouse 12.8.2, perfil móvel, Chrome local e artefacto estático. Uma execução por versão na página inicial.

| Indicador | Antes | Depois |
| --- | ---: | ---: |
| Performance | 68 | 94 |
| Acessibilidade / boas práticas / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| LCP | 2,5 s | 2,3 s |
| CLS | 0 | 0 |
| TBT | 1 960 ms | 230 ms |
| Transferência estimada | 300 KiB | 296 KiB |
| Caracteres no índice de unidades do HTML inicial | 32 706 | 1 649 |

O corte de 95% no índice incluído em cada página resulta diretamente da alteração. Só o catálogo e o comparador recebem os dados detalhados de seleção. Cada galeria recebe os endereços das próprias fotografias. A velocidade do computador variou entre execuções (índice de referência 344 e 665), pelo que não se pode atribuir toda a variação do TBT ou da pontuação ao código. Faltam dados de campo de LCP, INP e CLS de clientes reais. [Medição dos Core Web Vitals](https://web.dev/articles/vitals)

As 63 vistas principais WebP ocupam cerca de 9 MiB no conjunto do catálogo. As miniaturas somam cerca de 1,5 MiB e as 16 capas AVIF cerca de 554 KiB. O navegador carrega variantes por largura, dá prioridade à imagem principal e adia as restantes. O conjunto integral das fotografias ampliadas só é pedido à medida que o utilizador navega. Lighthouse ainda estima até 84 KiB de poupança na entrega das imagens da página inicial. Vale medir uma variante de capa menor em aparelhos de baixa e alta densidade antes de a adotar.

As fontes são locais. O build gera recursos de código e fontes com nomes versionados. Na consulta ao site publicado, o HTML da página inicial respondeu com `Cache-Control: max-age=600` e `ETag`. A aplicação continua estática para Pages. Foram removidas regras CSS da antiga ficha técnica e de componentes de formulário sem consumidores. Não foi necessário adicionar dependências de execução.

O projeto está alojado em `/AZMORA-HOMES/`. Um `robots.txt` dentro desse subdiretório não controla o domínio. O site indica as diretivas nas páginas e expõe o sitemap. Com domínio próprio, configurar o ficheiro na raiz desse domínio e verificar o sitemap na Search Console. Os dados estruturados das casas descrevem o percurso de navegação. Preços, classificações, stock e identidade jurídica não confirmados ficam fora desses dados. [Localização do robots.txt](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)

## Antes de receber clientes em escala

1. **Identificação e apoio.** Preencher denominação legal, NIF/NIPC, sede, dados de registo, telemóvel, horário e condições de visita. Ativar WhatsApp e redes quando existirem canais reais. Confirmar o registo no Livro de Reclamações e, após definição do local de contratação presencial, a informação de arbitragem aplicável.
2. **Orçamentos e catálogo.** Designar quem confirma preço e disponibilidade antes de cada proposta. Só duas unidades têm área anunciada e apenas uma tem comprimento e largura anunciados em conjunto. Confirmar medidas, inventário, conservação e fotografias atuais junto do fornecedor. As condições conhecidas de IVA e transporte já estão no site.
3. **Reserva e entrega.** Definir validade do orçamento, porto para cada proposta, montante da reserva, condições de cancelamento, pagamento do remanescente, garantia aplicável e contacto pós-venda. Enviar estas condições por escrito antes da reserva.
4. **Pedidos e retenção.** Os proprietários devem acompanhar o Gmail e a pasta Spam do Formspree, o limite do plano e a eliminação dos pedidos sem venda até 12 meses após a última interação. O formulário usa um campo-armadilha, limites de comprimento e confirmação positiva do prestador. A proteção efetiva contra abuso inclui as definições do prestador. Validar permissões, contratos dos prestadores e tratamento de dados. A entrega real de uma nova mensagem no Gmail e a resposta ao comprador devem ser ensaiadas depois da publicação autorizada.
5. **Aceitação da versão.** Rever as capturas e testar num iPhone e com leitor de ecrã. A branch e os commits são locais. A decisão de merge, push e publicação continua com o proprietário.

[Inventário de placeholders](docs/PLACEHOLDERS_AZMORA.md) · [Pendências por unidade](PENDENCIAS_CATALOGO_AZMORA.md)
