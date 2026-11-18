import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { PRODUCTS_SEED } from '../data/catalogSeeds';
import { applyDocumentSeo, resolveRouteSeo } from '../lib/seo';

/**
 * Synchronizes `<head>` metadata (title, description, canonical, OpenGraph, Twitter Cards,
 * robots, and Schema.org JSON-LD) on every client-side navigation.
 */
export function RouteSeoManager() {
  const { pathname } = useLocation();
  const { events, products } = useAppData();

  const mergedProducts = useMemo(() => {
    const byId = new Map(PRODUCTS_SEED.map((item) => [item.id, item]));
    for (const p of products) {
      byId.set(p.id, p);
    }
    return Array.from(byId.values());
  }, [products]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const seoMeta = resolveRouteSeo(pathname, origin, {
      events,
      products: mergedProducts,
    });
    applyDocumentSeo(seoMeta);
  }, [pathname, events, mergedProducts]);

  return null;
}
