# Custos e quotas — estimativas em 25/11/2026

Valores indicativos, não proposta nem contrato; confirmar plano, IVA, câmbio, renovações e limites. Não converter preços USD para EUR sem taxa vigente. O valor de domínio indicado pelo proprietário é 15,98 €/ano, a confirmar; assumir constante e sem nova inflação para ilustrar, sem presumir o tratamento fiscal.

| Horizonte | Domínio apenas, a 15,98 €/ano | Serviços gratuitos se dentro das quotas | Backup independente |
|---|---:|---:|---|
| 1 ano | 15,98 € | 0 € | não contratado; custo a confirmar |
| 5 anos | 79,90 € | 0 € | não contratado; custo a confirmar |
| 10 anos | 159,80 € | 0 € | não contratado; custo a confirmar |

O domínio pago anteriormente a 2,45 € foi promocional; as projeções acima representam renovações futuras, não repetem a promoção. Não incluem email pago, tempo de suporte, IVA adicional quando aplicável, custos de recuperação, tráfego, fornecedor de backup ou excedentes. Planos gratuitos e preços podem mudar; não se pode estimar custo total real com confiança sem volumes, região e contrato do backup.

Referências de planeamento: [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) inclui 10 GB-mês standard e 1 milhão operações A/10 milhões B mensais; acima, preços indicados em USD e arredondamentos. [D1](https://developers.cloudflare.com/d1/platform/pricing/) Free inclui 5 milhões leituras/dia, 100 mil escritas/dia e 5 GB totais sujeitos a 500 MB por base; [limites D1](https://developers.cloudflare.com/d1/platform/limits/). [Pages](https://developers.cloudflare.com/pages/platform/limits/) Free: 500 builds/mês, Functions sujeitas às quotas Workers. [Resend](https://resend.com/pricing): Free 3.000/mês e 100/dia; a aplicação limita tentativas conservadoramente. [Zoho](https://www.zoho.com/mail/compare/overview.html): plano gratuito anunciado para até 5 utilizadores em datacenters elegíveis, sujeito a condições. [GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) depende da visibilidade e do plano.

Cenários sem preços inventados: reduzido = dentro de todas as quotas e fotografias/backup pequenos; custo base domínio + destino privado. Médio = crescimento de fotos e snapshots, aumentando operações R2, minutos Actions e armazenamento cifrado; calcular com métricas reais. Elevado = proximidade/ultrapassagem de quotas de Workers, D1, email e backup, podendo exigir plano pago; obter simulação do fornecedor antes da mudança. Para preço base de referência, [Backblaze B2](https://www.backblaze.com/cloud-storage/pricing) anuncia $6,95/TB/30 dias em PAYG, sujeito a alterações, impostos, mínimos e operações: confirmar condições atuais e escolher outro fornecedor se mais adequado. O Restic deduplica dados mas não impede custos de leitura e validação integral. Exigir orçamento, alertas e revisão mensal antes de ativar retenção.

**Decisão atual:** não contratar nem ativar backup externo automático. O backup manual usa o computador e os recursos Cloudflare existentes; listagem e leitura R2 continuam sujeitas às quotas da conta. Não há subscrição nova por esta decisão.
