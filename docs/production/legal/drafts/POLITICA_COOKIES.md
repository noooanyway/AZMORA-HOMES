# Política de cookies e tecnologias semelhantes

> **MINUTA INTERNA — NÃO PUBLICAR.** Sujeita à confirmação dos responsáveis e a validação jurídica; os campos [PENDENTE] têm de ser resolvidos. Descreve a implementação local revista; verificar a configuração efetiva antes da publicação.

## 1. Âmbito e responsável
Esta política descreve armazenamento ou acesso a informação no dispositivo ao usar o website https://www.azmorahomes.pt/. Aplica-se também a tecnologias que não sejam cookies tradicionais. Responsável: [PENDENTE — identificação e endereço]. Contacto: [PENDENTE — contacto confirmado]. A análise de cada finalidade e do respetivo fundamento é sujeita a validação jurídica.

## 2. Tecnologias utilizadas na implementação local

| Tecnologia | Finalidade e duração |
| --- | --- |
| `azmora:consent-v1` | LocalStorage: guarda a escolha de privacidade, quando disponível. O código não define expiração automática. [PENDENTE — aprovar prazo e fundamento da própria escolha.] |
| `azmora:theme` | LocalStorage: guarda o tema selecionado quando o visitante autoriza a persistência de preferências; sem expiração automática no código. |
| `azmora:favoritos` | LocalStorage: guarda unidades favoritas apenas com autorização para persistência; sem expiração automática no código. |
| `azmora:comparar` | LocalStorage: guarda até três unidades para comparação apenas com autorização para persistência; sem expiração automática no código. |
| Cloudflare Access | Protege a área administrativa e pode utilizar cookies e informação de sessão dos administradores. A duração e os nomes efetivos dependem da configuração. |
| Cloudflare Turnstile e segurança | Ajudam a verificar submissões e prevenir abuso; poderão envolver dados técnicos, cookies ou outros mecanismos conforme o desafio e a configuração efetiva. |

O código local não carrega Cloudflare Web Analytics e o painel não apresenta opção de medição. Não foram integrados pixels, SDKs ou widgets Meta: Facebook e Instagram são ligações diretas. A ausência de cookies tradicionais não decide, por si só, a necessidade de consentimento. [PENDENTE — verificar a ausência de injeção automática Cloudflare na configuração remota e na rede antes da publicação.]

## 3. Aceitar, recusar e alterar
Na primeira visita, o painel oferece «Aceitar todos», «Recusar opcionais» e «Personalizar preferências»; a opção de guardar preferências não vem previamente selecionada. Ao personalizar pode escolher se permite guardar tema, favoritos e comparação e depois guardar a escolha. A ligação permanente «Gerir preferências de privacidade» no rodapé permite alterar ou retirar a autorização. A recusa não impede consultar o catálogo.

Sem autorização de persistência, o tema funciona temporariamente na página atual e não é guardado para outras páginas. As seleções de favoritos e comparação podem ser abertas nas respetivas páginas através do fragmento do endereço quando a navegação é iniciada pelo utilizador; esse fragmento não é enviado no pedido HTTP, mas pode ficar no histórico ou ser copiado e partilhado. A atualização dessas páginas pode conservar a seleção no endereço; outras páginas e separadores não a preservam automaticamente. Não se usa sessionStorage para esse transporte.

Ao recusar ou retirar a persistência, o código procura remover as três chaves de preferências quando o armazenamento está acessível. Se o navegador bloquear o armazenamento, a escolha pode não persistir e terá de ser repetida. Também pode gerir dados e cookies nas definições do navegador; limpar dados de autenticação pode terminar a sessão ADMIN.

## 4. Fundamento e prazos
A persistência opcional é sujeita à escolha do visitante na implementação local. A necessidade de consentimento, eventuais exceções para segurança e a base e duração de armazenamento da própria escolha devem ser confirmadas pelo jurista à luz da configuração efetiva. [PENDENTE — aprovar prazo ou critérios para a escolha e as preferências, identificar durações efetivas de Access e segurança, e validar o texto.] Para dados pessoais consulte a política de privacidade.

[PENDENTE — aprovação dos responsáveis, validação jurídica e data de vigência.]
