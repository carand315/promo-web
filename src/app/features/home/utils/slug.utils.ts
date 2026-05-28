import { Ciudad, Promocion } from '../../admin/promociones/models/promocion.model';

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function promoSlug(promo: Promocion): string {
  return `${promo.id}-${toSlug(promo.titulo)}`;
}

export function ciudadToSlug(ciudad: Ciudad): string {
  return toSlug(ciudad.nombre);
}

export function idFromSlug(slug: string): number {
  return parseInt(slug.split('-')[0], 10);
}
