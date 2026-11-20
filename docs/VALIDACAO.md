# Validar e publicar a Azmora Homes

O modo de antevisão inclui as unidades do kit autorizadas para revisão e marca as páginas com `noindex`. A compilação comercial inclui apenas as unidades cujo campo `publish` está aprovado. Antes de disponibilizar o site a clientes, a Azmora deve validar as referências, condições de venda, identidade empresarial, textos legais e canais de contacto.

## Verificação local no Windows

Com Node.js 24 e npm, na raiz do projeto:

```powershell
npm ci
npm run check
npm test
$env:BASE_PATH='/AZMORA-HOMES/'
$env:CATALOG_MODE='preview'
npm run build
node scripts/verify-output.mjs
npm run preview
```

Abrir o URL local indicado pelo Astro, incluindo `/AZMORA-HOMES/`. O teste de saída percorre o HTML gerado e as folhas de estilos: verifica as páginas institucionais, conta as fichas autorizadas para o modo escolhido e resolve ligações internas, imagens, CSS e scripts a partir do URL real de cada página. Também verifica as âncoras internas e a existência de `noindex` na antevisão.

Para verificar a versão comercial, parar o servidor local e repetir a compilação em PowerShell:

```powershell
$env:CATALOG_MODE='production'
npm run build
node scripts/verify-output.mjs
```

Este teste adicional procura referências de unidades por aprovar nos ficheiros HTML, JS, JSON e XML gerados. Para voltar à antevisão local, definir `$env:CATALOG_MODE='preview'`.

## Ensaio no navegador

O teste de interface usa a antevisão do catálogo e um perfil temporário do Chrome. Com o servidor de antevisão em execução, numa segunda consola:

```powershell
$env:TEST_URL='http://127.0.0.1:4321/AZMORA-HOMES/'
node tests/browser-smoke.mjs
```

Ajustar a porta a partir do URL indicado pelo Astro. Se necessário, definir `CHROME_BIN` com o caminho do executável Chrome. O teste exercita pesquisa, filtros e URLs partilháveis, favoritos após recarregar, limite de comparação, pedido de contacto, galeria por teclado e navegação a 360 px.

## Publicação em GitHub Pages

1. Enviar o código-fonte, o ficheiro `package-lock.json` e o workflow para a branch principal de `noooanyway/AZMORA-HOMES`.
2. No GitHub, selecionar **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Em **Actions → Publicar no GitHub Pages → Run workflow**, selecionar a branch e o modo. A opção predefinida é `production`. Selecionar `preview` apenas para disponibilizar a antevisão no endereço do Pages. Quem tiver acesso ao endereço poderá ver os modelos de antevisão, mesmo com `noindex`.
4. Após o sucesso das etapas de compilação e publicação, abrir o endereço indicado no ambiente `github-pages`. Abrir diretamente uma ficha comercial aprovada e atualizar o navegador para confirmar o acesso por ligação partilhada.

Para ativar os canais confirmados em produção, preencher as variáveis de repositório em **Settings → Secrets and variables → Actions → Variables**. `PUBLIC_CONTACT_EMAIL` permite substituir o email comercial definido em `src/data/company.json`, `PUBLIC_CONTACT_PHONE` recebe o telemóvel comercial apresentado no site. `PUBLIC_WHATSAPP` recebe o número da Azmora em formato internacional e `PUBLIC_FORM_ENDPOINT` permite substituir o endereço público do formulário definido em `src/data/company.json`. Estes valores tornam-se públicos no site; o serviço externo guarda eventuais segredos e trata a proteção contra abuso. Repetir o workflow depois de alterar os valores.

O [guia de lançamento](LANCAMENTO_AZMORA.md) descreve a configuração do destinatário, o formato do assunto e os pedidos a testar antes de abrir o formulário ao público.

O workflow é manual, executa a verificação TypeScript e os testes e valida os caminhos sob `/AZMORA-HOMES/` antes de entregar o artefacto ao Pages. Para um domínio próprio, adaptar `SITE_URL` e `BASE_PATH`, bem como o domínio definido nas configurações do Pages.

Referência: [publicar Astro em GitHub Pages](https://docs.astro.build/en/guides/deploy/github/).

## Resultados da verificação de 19 de novembro de 2026

- **Antevisão:** 24 páginas estáticas, 16 fichas individuais e 1 226 referências locais verificadas sob `/AZMORA-HOMES/`.
- **Produção com os registos atuais:** 16 unidades aprovadas para publicação, com as respetivas fichas e fotografias. O verificador percorre os artefactos HTML, JS, JSON e XML e deteta referências públicas a unidades por aprovar.
- **Chrome, 1440 e 360 px:** o ensaio passou com pesquisa normalizada, filtros combinados após recarregar, alternância de vista, ordenação por área, recuperação de uma pesquisa sem resultados, favoritos persistentes e remoção. A quarta tentativa de comparação manteve as três referências anteriores. O pedido conjunto incluiu apenas as selecionadas, e foi possível retirar uma unidade e limpar a seleção.
- **Ficha e navegação:** recarregamento direto da ficha, ampliação de fotografia, avanço por seta e fecho com Escape passaram. Em mobile o filtro devolveu o foco ao botão e o menu abriu a página selecionada. A verificação de largura na página inicial, catálogo, comparação, favoritos, contactos, ficha e página institucional passou a 360 px.
- **Contacto:** foi confirmado o botão de envio desativado enquanto o serviço está por configurar. Uma compilação de teste com contactos fictícios confirmou o endereço de email, o destinatário e os links de unidade na mensagem WhatsApp, e os campos do POST do formulário. O navegador intercetou esse POST localmente. A entrega efetiva depende da ativação dos canais comerciais definitivos. A publicação no GitHub Pages e a leitura com leitor de ecrã exigem verificações próprias.



- **Lighthouse móvel, página inicial**. A medição local sobre o artefacto estático final obteve 99/100 em desempenho e 100/100 em acessibilidade, com LCP de 2,0 s e CLS de 0. Foi usado Lighthouse 12 com Chrome headless. Os valores variam com o equipamento, a rede e o alojamento.
