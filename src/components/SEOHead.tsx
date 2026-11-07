import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'BARKA SOLUTIONS S.A.S | Imprimerie & Multiservices à Ngaoundéré';
const DEFAULT_DESCRIPTION =
  'BARKA SOLUTIONS S.A.S, imprimerie à Ngaoundéré : impression numérique, impression offset, sérigraphie, impression grand format, signalétique et conception graphique au Cameroun.';
const DEFAULT_KEYWORDS =
  'BARKA SOLUTIONS, imprimerie Ngaoundéré, impression numérique Ngaoundéré, impression offset Ngaoundéré, sérigraphie Ngaoundéré, impression grand format Ngaoundéré, conception graphique Ngaoundéré, signalétique Ngaoundéré, Cameroun';
const BASE_URL = 'https://barkasolutions.org';
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd,
}) => {
  const location = useLocation();

  const finalTitle = title ? `${title} | BARKA SOLUTIONS S.A.S` : DEFAULT_TITLE;
  const currentUrl = canonicalUrl || `${BASE_URL}${location.pathname}`;

  useEffect(() => {
    // 1. Document Title
    document.title = finalTitle;

    // Helper to update or create a meta tag
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'title', finalTitle);
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index, follow');

    // 3. Open Graph
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:site_name', 'BARKA SOLUTIONS S.A.S');
    setMetaTag('property', 'og:locale', 'fr_FR');

    // 4. Twitter Cards
    setMetaTag('property', 'twitter:card', 'summary_large_image');
    setMetaTag('property', 'twitter:title', finalTitle);
    setMetaTag('property', 'twitter:description', description);
    setMetaTag('property', 'twitter:image', ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 6. Dynamic Page-Specific JSON-LD
    const scriptId = 'page-specific-jsonld';
    let jsonLdScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = scriptId;
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.text = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [finalTitle, description, keywords, currentUrl, ogType, ogImage, jsonLd]);

  return null;
};
