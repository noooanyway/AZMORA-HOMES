# Estrutura das páginas legais — desenvolvimento local

As rotas `/privacidade/` e `/termos/` existentes mantêm os seus endereços e conteúdos anteriores. A versão atual de `/termos/` é a página de informação legal existente; ainda não contém os termos definitivos aprovados. As rotas `/cookies/` e `/aviso-legal/` são estruturas temporárias exclusivamente para o servidor `astro dev`, com indicação de pré-visualização e `noindex`. Não incluem as minutas internas.

A integração `legal-local` em `astro.config.mjs` regista as duas novas rotas apenas quando o comando é `dev`. Os componentes ficam em `src/legal-local/`, fora de `src/pages/`. O rodapé mostra as quatro ligações apenas em desenvolvimento; nos builds mantém as ligações anteriores a privacidade e informação legal. O formulário conserva a ligação existente para `/privacidade/` e o rodapé conserva o comando de gestão de preferências. A página local de cookies também permite abrir esse painel.

Para rever localmente, executar `npm run dev` e abrir o endereço local apresentado. Manter o servidor vinculado a localhost: `noindex` não é autenticação e um servidor de desenvolvimento aberto à rede pode expor as pré-visualizações. Nenhuma opção de ambiente de produção ativa estas rotas; o build Cloudflare usa configuração própria, sem a integração de desenvolvimento.

## Quando existirem textos aprovados

1. Os responsáveis e o profissional competente devem concluir e aprovar os quatro documentos, incluindo os campos pendentes. Não copiar automaticamente os documentos internos nem expor versões incompletas.
2. Substituir os conteúdos existentes de `/privacidade/` e `/termos/` pelos textos finais, preservando os endereços e, para compatibilidade das ligações existentes, a âncora `/termos/#terreno` enquanto estiver em uso. Criar as páginas definitivas de `/cookies/` e `/aviso-legal/` em `src/pages/`, a partir das estruturas locais ou de componentes equivalentes com a mesma classe `legal-page`. Remover a integração temporária ou evitar qualquer duplicação de rotas no modo dev. Inserir apenas conteúdo final validado.
3. Ativar as quatro ligações permanentes no rodapé, manter a ligação do formulário à política de privacidade e a gestão de preferências. Atualizar sitemap e metadados das novas rotas após aprovação; retirar o `noindex` apenas quando as páginas estiverem prontas. Preservar as ligações existentes para as páginas e âncoras antigas.
4. Repetir testes em mobile e desktop, navegação por teclado, acessibilidade, fluxo de consentimento, formulário, HTML e isolamento de documentos internos, builds e ensaio de produção. Seguir `PUBLICACAO_E_ROLLBACK.md` para a futura publicação autorizada.

## Verificação desta preparação

As quatro rotas responderam em `astro dev`; verificaram-se títulos, ligações do rodapé e formulário, botão de preferências e ausência de overflow a 390 e 1440 px. As novas estruturas tinham `noindex`. Os builds estático e Cloudflare passaram; as páginas e mensagens de pré-visualização locais não foram encontradas nos artefactos públicos. `astro check` passou com duas sugestões existentes; `git diff --check` passou. O teste não constitui auditoria integral de acessibilidade, nem validação legal. Não foram executados backups, migrações, push ou deployment.
