# Fotografias no iPhone — correção local (27/11/2026)

## Causa e alteração

A mensagem da captura é emitida depois da descodificação e desenho da imagem: o ADMIN exigia que canvas.toBlob produzisse image/webp. Quando o formato não é suportado, a especificação permite a devolução de PNG; um erro de codificação também pode devolver null. Assim, uma fotografia já aberta era rejeitada. Isto não demonstra, por si só, um problema com HEIC.

Referência técnica pontual: [HTML Standard — canvas](https://html.spec.whatwg.org/multipage/canvas.html).

A preparação tenta WebP e recorre automaticamente a JPEG se não resultar. Mantém o limite de 1800 px, fundo opaco, compressão e limite de 3 MB por envio. Liberta o bitmap/imagem e a memória do canvas após cada ficheiro. Não envia o original com metadados para serviços externos.

O servidor aceita WebP ou JPEG, valida a estrutura binária e dimensões, remove APP/COM de JPEG (incluindo EXIF/GPS), rejeita ficheiros truncados e dados após o fim da imagem e grava o formato real em R2. Rotas ADMIN/públicas, validação de fichas, importador de media e verificação de backup reconhecem .jpg. Imagens de rascunhos continuam privadas. Não existe nova migração.

## Validação

- 64 testes automatizados: JPEG real gerado por canvas, metadados, assinatura inválida, truncagem, dimensões e frames duplicados; verificador de backup aceita referência JPEG.
- Testes Worker: MIME falsificado, JPEG inválido e tipo não autorizado rejeitados sem registar uploads.
- Browser: createImageBitmap indisponível; exportação WebP a devolver PNG ou null; alternativa JPEG, miniaturas, gravação, publicação e resposta image/jpeg. A primeira fotografia WebP é preservada durante os envios seguintes.
- Regressão Worker/ADMIN e layouts em seis larguras; tipos, build Cloudflare e diff check.
- Corrigida uma espera no teste de consulta de unidade arquivada: lia o texto da ficha anterior antes do evento assíncrono de fecho do seletor e abertura da ficha. Sem alteração funcional nessa operação.

## Limites e publicação

Os testes reproduzem as falhas de codificação em Chrome local; não substituem um ensaio num iPhone físico. A abertura de HEIC/HEIF continua dependente do descodificador do navegador; esta correção resolve a falha posterior de exportação WebP mostrada na captura.

É necessário publicar conjuntamente o ADMIN e as rotas do Worker, e depois atualizar/reabrir o ADMIN no iPhone. Nenhuma configuração Cloudflare, migração, dado real ou fotografia de produção foi alterada nesta intervenção. Sem push/deployment.

Após existirem uploads JPEG, um rollback deve manter o suporte JPEG nas rotas, validação e backups: o código antigo exclusivamente WebP não serve estes novos ficheiros. Não eliminar nem converter fotografias reais para fazer rollback de código.
