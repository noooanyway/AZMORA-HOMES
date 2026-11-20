# Azmora Homes

Site estático de revenda de casas móveis em Astro e TypeScript. A antevisão inclui 16 unidades distintas, com fichas, fotografias locais, filtros partilháveis, favoritos e comparação de duas ou três casas.

## Desenvolvimento

Usar Node.js 24. Na raiz do projeto:

```sh
npm ci
npm run dev
```

Abrir o endereço indicado pelo Astro com o caminho /AZMORA-HOMES/. A antevisão é o modo local predefinido. Para validar e compilar:

```sh
npm run catalog:validate
npm run check
npm test
npm run build
node scripts/verify-output.mjs
npm run preview
```

## Editar o catálogo

O ficheiro `src/data/houses.json` contém os campos de apresentação e os estados de revisão. A referência identifica a unidade mesmo quando há modelos repetidos. Usar `npm run catalog:import -- caminho/ficheiro.csv` para rever uma importação antes de aplicar alterações. As fotografias estão em `public/images/casas/<media_slug>/`, com ficheiros cujo nome começa pelo nome da casa e termina com o número da fotografia e a variante. O [registo de fontes e fotografias](docs/catalogo.md) explica a recolha e o manifesto.

Os componentes de apresentação estão em `src/components/`, as rotas em `src/pages/` e os estilos em `src/styles/`. A lógica de pesquisa, ordenação e comparação está em `src/lib/catalog.ts`. O JavaScript do navegador guarda apenas IDs de seleção em localStorage.

## Contactos e publicação

Copiar `.env.example` para `.env` para testar canais confirmados da Azmora. O WhatsApp e o formulário recebem as referências escolhidas. O endpoint do formulário deve aceitar POST de um formulário HTML, tratar abuso e devolver uma confirmação verdadeira. Testar com o prestador e rever a privacidade antes de ativar o envio.

A compilação com `CATALOG_MODE=production` inclui apenas unidades com `publish:true` e respetivas imagens. O workflow do GitHub Pages é manual e usa esse modo por defeito. As 16 unidades atuais estão aprovadas para publicação. O [guia de validação e publicação](docs/VALIDACAO.md) contém os comandos para os dois modos, as variáveis do repositório e os passos de publicação.
