import defaults from '../data/site-content.json' with { type: 'json' };

type Faq = { question: string; answer: string; visible: boolean; source?: string };
export function faqSource(faq: Faq): string | undefined {
  if (faq.source === 'custom') return undefined;
  if (faq.source) return faq.source;
  // Only the exact original question and answer are linked; custom edits remain free text.
  return defaults.faq.find((entry) => entry.question === faq.question && entry.answer === faq.answer && 'source' in entry)?.source;
}
export function faqAnswer(faq: Faq, commercial: typeof defaults.commercial): string {
  const source = faqSource(faq);
  if (source === 'price') return [commercial.included, commercial.transport, commercial.delivery, commercial.excluded].filter(Boolean).join(' ');
  if (source && Object.hasOwn(commercial, source)) return commercial[source as keyof typeof commercial];
  return faq.answer;
}
