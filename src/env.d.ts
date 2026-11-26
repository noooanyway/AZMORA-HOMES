declare namespace App {
  interface Locals {
    siteSettings?: { content?: typeof import('./data/site-content.json'); contacts?: { phone: string; secondPhone: string; whatsapp: string; email: string; openingHours: string; timezone: string; languages: string; social: {instagram: string; facebook: string}; visibility?: Record<string, boolean> } };
    houses?: import('./lib/catalog').House[];
    contactBackend?: boolean;
    turnstileSiteKey?: string;
  }
}
