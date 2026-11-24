import { env } from 'cloudflare:workers';
import { submitContact } from './contacts.mjs';
export const ALL = async ({ request }) => {
  try {
    return await submitContact(request, env);
  } catch {
    return Response.json(
      {
        message:
          'Não foi possível confirmar o pedido. Tente novamente com a mesma referência.',
      },
      { status: 503 },
    );
  }
};
