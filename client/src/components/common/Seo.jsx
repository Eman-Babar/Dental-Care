import { useEffect } from "react";
import { useSiteContent } from "../../hooks/useSiteContent";

/**
 * Sets document title + meta description + Open Graph for basic on-page SEO.
 * Brand name comes from CMS (home.brand).
 */
function Seo({ title, description, image, path = "" }) {
  const { get } = useSiteContent();
  const brand = get("home.brand", "DentalCare");
  const defaultDesc = get(
    "brand.seo_description",
    "Modern family dentistry. Book appointments online."
  );
  const desc = description || defaultDesc;
  const ogImage =
    image ||
    get("brand.og_image", "") ||
    get("home.hero_image", "");

  useEffect(() => {
    const fullTitle = title.includes(brand) ? title : `${title} | ${brand}`;
    document.title = fullTitle;

    const setMeta = (attr, key, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", desc);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);

    if (ogImage) {
      setMeta("property", "og:image", ogImage);
      setMeta("name", "twitter:image", ogImage);
    }

    const origin = window.location.origin;
    const canonicalHref = `${origin}${path || window.location.pathname}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);
    setMeta("property", "og:url", canonicalHref);
  }, [title, desc, brand, ogImage, path]);

  return null;
}

export default Seo;
