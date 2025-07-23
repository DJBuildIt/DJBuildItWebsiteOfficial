/*
 * List of countries that our Printful + Stripe integration supports for shipping.
 * This is derived from the Printful V2 API documentation and removes countries that
 * are explicitly excluded by Printful (e.g. sanctioned regions).
 *
 * We purposefully co-locate the ISO code and human-readable name so the
 * consumer (UI, backend, etc.) can choose whichever representation they need.
 */

export interface CountryOption {
  code: string;
  name: string;
}

export const ALLOWED_COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'PT', name: 'Portugal' },
];

// A lightweight array of just the ISO-3166-1 alpha-2 codes. Useful when a plain
// string array is required (e.g. Stripe allowed_countries configuration).
export const ALLOWED_COUNTRY_CODES = ALLOWED_COUNTRIES.map((c) => c.code); 