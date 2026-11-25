# Estratégia de SEO orgânico — Azmora Homes

Revisão: 25 novembro 2026. Escopo: casas móveis usadas para Açores e Madeira; sem vendas para Portugal continental. A implementação encontra-se local e só fica pública após deployment autorizado.

## Diagnóstico e posicionamento

Ser uma opção clara para compradores das duas regiões, com fichas verdadeiras, fotografias, condições sob consulta e informações de preparação de compra. A página inicial identificava o produto na introdução, mas o H1 era sobretudo editorial; a ligação para duas páginas com H1 explícito resolve a descoberta sem substituir a identidade. O catálogo já tinha filtros e as fichas tinham marca, tipologia, fotografia, canonical, Open Graph e breadcrumb; faltavam páginas regionais e uma descrição gerada por ficha que não dependesse do preenchimento manual. O texto alternativo existente descreve as fotografias e continua a ser gerido com cada imagem: preencher fielmente também nas novas fotografias, sem repetir palavras-chave nem inventar conteúdo. URLs legíveis e detalhes em /casas/{slug}/ devem manter-se estáveis.

A auditoria é baseada no repositório e nas páginas de concorrentes consultadas, não numa medição independente do site em produção, indisponível para a ferramenta de pesquisa. Os 22 URLs do sitemap, a configuração do Search Console e os resultados PageSpeed foram comunicados pelo proprietário; são dados declarados, não verificados aqui. Pontuação Lighthouse não é medição real de Core Web Vitals nem garante posições.

## Matriz de pesquisas (hipóteses, não volumes medidos)

| Intenção e pesquisa | Região | Página preferencial |
|---|---|---|
| casas móveis Açores; casas móveis usadas Açores; mobile homes Açores; comprar casa móvel nos Açores | Açores | /casas-moveis-acores/ |
| casas móveis Madeira; casas móveis usadas Madeira; mobile homes Madeira; comprar casa móvel na Madeira | Madeira | /casas-moveis-madeira/ |
| casas móveis em segunda mão; casas móveis usadas para as ilhas | Ambas | /casas/ |
| casas móveis T2; casas móveis T3; casas móveis com 2 ou 3 quartos | Ambas | /casas/ e fichas que efetivamente tenham esses dados |
| preços de casas móveis; quanto custa casa móvel usada | Ambas | /casas/ e /contactos/; guia de custos somente após confirmação |
| transporte de casas móveis para os Açores / Madeira | Respetiva região | página regional; condições por confirmar em /contactos/ |
| marca e modelo de unidade em catálogo | Ambas | /casas/{slug}/ correspondente; não criar páginas para marcas inexistentes |
| como escolher casa móvel usada; verificar estado casa móvel | Ambas | /guias/como-escolher-casa-movel-usada/ |
| casas móveis São Miguel, Terceira, Pico ou Porto Santo | Ilha referida | página regional; não presumir cobertura ou transporte para qualquer ilha |
| instalação ou licenciamento de casa móvel | Ambas | guia de compra e /termos/#terreno; guia jurídico especializado apenas após revisão competente |

São termos de trabalho sugeridos, sem afirmações sobre volume, dificuldade ou posição. Confirmar consultas reais no Search Console antes de expandir. Não criar páginas individuais por ilha enquanto cobertura, procura e conteúdo próprio não estiverem demonstrados.

## Concorrência observada

- [Green Village — Ribeirinha](https://www.greenvillagemobilehomes.com/lojas/ribeirinha): o próprio concorrente apresenta estabelecimento nos Açores, catálogo, tipologias e páginas regionais. Mostra a importância de informação de destino e fichas detalhadas; não implica que a Azmora tenha instalação local.
- [MobileHome.pt](https://www.mobilehome.pt/): catálogo com marcas, tipologias e preços; uma [ficha](https://www.mobilehome.pt/property/ohara-724-t2-toda-equipada/) afirma servir as ilhas e orçamentar transporte. Condições são do concorrente e podem mudar.
- [OLX](https://www.olx.pt/imoveis/casas-moradias-para-arrendar-vender/moradias-venda/q-mobile-homes/): classificados concorrem por nomes de modelo e tipologia; informação e vendedor variam por anúncio.
- [CustoJusto nos Açores](https://www.custojusto.pt/acores/q/casas%20usadas?f=p&sp=2): classificados regionais com resultados mistos; concorrência indireta para pesquisas locais.
- [Japro em São Miguel](https://prefabfind.com/pt/empresas/japro): alternativa regional de estruturas pré-fabricadas de madeira, não necessariamente equivalente a casas móveis usadas; informação apresentada por diretório externo carece de verificação com a empresa.

As observações não constituem ranking de resultados nem medição de tráfego. Diferenciar através de informação rigorosa e confirmação de condições, não de afirmações competitivas sem prova.

## Guias e prioridades editoriais

1. Publicado no código: guia de escolha de casa móvel usada, com checklist de condição, medidas, custos e terreno.
2. Rascunho: transporte e descarga para as ilhas — aguarda confirmação por ilha, responsabilidades, exclusões e forma de orçamento.
3. Rascunho: preços e custo total — aguarda preços, IVA, serviços e pressupostos aprovados pelo proprietário; não usar preços dos concorrentes como preços Azmora.
4. Rascunho: T2 versus T3 e marcas/modelos — basear em fichas reais e disponibilidade atual, sem presumir equipamento.
5. Rascunho: conservação, instalação e licenciamento — precisa de fontes técnicas e legais atuais e validação especializada por região e município; não prometer dispensa de licenças. O guia publicado orienta a consultar o município, sem afirmar regras legais específicas.

## SEO técnico e operação

- Canonical e Open Graph por URL no layout; domínio e BASE_PATH devem corresponder à produção. Sitemap dinâmico contém páginas públicas e unidades publicadas provenientes do inventário; robots bloqueia /admin e /api e aponta para o sitemap. Bloqueio robots não substitui controlo de acesso existente.
- A configuração existente aplica noindex em preview e quando não há inventário público; avaliar no Search Console depois de garantir catálogo publicado. As páginas de favoritos/comparação são utilitárias e não constam no sitemap.
- Fichas geram título e descrição com nome, tipologia e quartos quando existentes; os campos SEO manuais prevalecem. Não são gerados preços, disponibilidade ou propriedades estruturadas fictícias. As fotos conservam o texto alternativo registado.
- BreadcrumbList nas fichas, regiões e guia segue o percurso apresentado. Não foi adicionado FAQPage nem Product com ofertas, preço, avaliações ou localização não confirmados. Validar dados estruturados renderizados após publicação.
- Unidades despublicadas deixam de constar no sitemap e detalhe devolve 404; unidades vendidas ainda publicadas continuam visíveis com estado existente. Não prometer redirecionamento de fichas nem manter ofertas falsas.
- [Orientações Google para sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) e [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls); sitemap não garante indexação.

## Ligações externas gratuitas

Procurar ligações editoriais úteis em associações empresariais reais das ilhas, fornecedores e parceiros confirmados, diretórios regionais adequados, imprensa local e conteúdos ou testemunhos autorizados. Partilhar o guia e fichas que acrescentem valor. Não comprar links, criar moradas falsas, diretórios em massa ou esquemas de trocas. Perfis locais só quando elegíveis e com dados reais.

## Search Console: linha de base e revisão

Depois do deployment autorizado: verificar propriedade e domínio canónico, abrir Indexação > Sitemaps e confirmar /sitemap.xml; inspeção de URL nas duas páginas regionais, guia e amostra de fichas; confirmar canonical escolhida, indexação, renderização, breadcrumb e estado noindex. Pedir indexação apenas após confirmar a versão publicada. Rever problemas em Páginas e Core Web Vitals sem confundir dados de laboratório com dados de utilizadores. Verificar manualmente as condições reais de contacto.

Em Desempenho > Resultados de pesquisa, comparar períodos equivalentes de 28 dias, filtrando tipo Web, páginas regionais, catálogo, fichas e consultas relevantes. Registar cliques, impressões, CTR, posição média e páginas indexadas; filtrar Portugal não permite distinguir automaticamente Açores de Madeira: usar consultas com nome da região e outras fontes agregadas autorizadas, sem inferir localidade dos utilizadores. Cliques em contacto só com medição de eventos consentida e configurada; Search Console não mede vendas.

- Dia 0, após publicação: exportar linha de base de 28 dias, sitemap, páginas indexadas e principais consultas; anotar alterações e data.
- Dia 30: verificar descoberta, indexação e erros; comparar impressões e consultas, sem concluir tendência a partir de poucos dados.
- Dia 60: comparar cliques, CTR, posição média e consultas regionais por página; rever títulos apenas perante evidência e intenção reais.
- Dia 90: comparar 28 dias com linha de base e avaliar contactos quando dados fiáveis existirem; atualizar prioridades editoriais com base em perguntas reais. Não prometer prazos ou posições.

## Pendências do proprietário

Confirmar ilhas efetivamente servidas, condições de transporte e descarga, custos/IVA, instalação, cobertura e perguntas frequentes comerciais; autorizar validação legal quando necessária. Confirmar deployment e usar Search Console e teste de resultados avançados com as páginas já publicadas. Verificar no ADMIN títulos/descrições manuais existentes e atualizá-los caso estejam genéricos, dado que prevalecem sobre os automáticos.
