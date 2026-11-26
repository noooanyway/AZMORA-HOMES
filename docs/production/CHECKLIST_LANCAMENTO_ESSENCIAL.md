# Azmora Homes — checklist essencial para lançamento

## 1. Proprietários e documentos legais

- [ ] Enviar o documento de aprovação ao Rúben e à Filipa e receber as respostas pendentes, incluindo a identificação do operador e do responsável pelo tratamento dos dados.
- [ ] Confirmar os conteúdos comerciais, preços, características e disponibilidade das casas.
- [ ] Obter validação jurídica e aprovação dos quatro textos legais.

Documento para enviar: [APROVACAO_FINAL_PROPRIETARIOS.txt](APROVACAO_FINAL_PROPRIETARIOS.txt).

## 2. Finalizar o website

- [ ] Inserir os textos aprovados, ativar as quatro páginas legais e confirmar as ligações do rodapé e formulário.
- [ ] Rever os dados reais na D1 e os conteúdos publicados no ADMIN.
- [ ] Executar os testes locais finais e guardar todas as alterações necessárias num commit.

## 3. Publicar

- [ ] Confirmar autorização, versão a publicar e deployment anterior para eventual rollback.
- [ ] Suspender as operações de escrita e concluir os pedidos em curso.
- [ ] Fazer backup real da D1 e R2, verificar a integridade e testar o restauro isolado.
- [ ] Confirmar as migrações pendentes e aplicar a 0005, apenas após autorização.
- [ ] Fazer push e confirmar o deployment na Cloudflare.

## 4. Validar e entregar

- [ ] Testar catálogo, fotografias, formulário, CRM, notificações e ADMIN com dados de teste.
- [ ] Testar páginas legais, contactos, redes sociais, consentimento e retirada da autorização.
- [ ] Confirmar a ausência do beacon Analytics, o sitemap e o funcionamento em computador e telemóvel.
- [ ] Limpar os dados de teste e reabrir as operações de escrita.
- [ ] Entregar o manual e demonstrar o ADMIN aos proprietários; definir responsáveis pelos backups e manutenção.

Para a sequência detalhada e o rollback, consultar [PUBLICACAO_E_ROLLBACK.md](PUBLICACAO_E_ROLLBACK.md). Não restaurar um backup antigo sobre a base ativa sem preservar e reconciliar os dados posteriores.
