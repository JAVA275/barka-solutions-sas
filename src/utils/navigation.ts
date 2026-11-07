import { TabType } from '../types';

export type PublicTab = TabType;

export function pathToTab(pathname: string): PublicTab {
  if (pathname.startsWith('/services')) return 'services';
  if (pathname.startsWith('/tarifs')) return 'tarifs';
  if (pathname.startsWith('/portfolio')) return 'galerie';
  if (pathname.startsWith('/devis')) return 'devis';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/a-propos') || pathname.startsWith('/apropos')) return 'apropos';
  return 'accueil';
}

export function tabToPath(tab: TabType): string {
  switch (tab) {
    case 'accueil':
      return '/';
    case 'services':
      return '/services';
    case 'tarifs':
      return '/tarifs';
    case 'galerie':
      return '/portfolio';
    case 'devis':
      return '/devis';
    case 'contact':
      return '/contact';
    case 'apropos':
      return '/a-propos';
    default:
      return '/';
  }
}
