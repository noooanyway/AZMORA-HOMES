declare namespace App {
  interface Locals {
    siteSettings?: { contacts?: { phone: string; secondPhone: string; whatsapp: string; email: string; openingHours: string; timezone: string; languages: string; social: {instagram: string; facebook: string} } };
    houses?: import('./lib/catalog').House[];
    contactBackend?: boolean;
    turnstileSiteKey?: string;
  }
}
