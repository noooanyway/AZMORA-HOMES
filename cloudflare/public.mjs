import { catalogRecord } from '../src/lib/catalog';
export const GET = ({ locals }) =>
  Response.json(locals.houses.map(catalogRecord));
