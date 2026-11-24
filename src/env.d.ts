declare namespace App {
  interface Locals {
    houses?: import('./lib/catalog').House[];
    contactBackend?: boolean;
    turnstileSiteKey?: string;
  }
}
