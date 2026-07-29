import { useEffect } from "react";

/**
 * Sets document title + meta description for basic on-page SEO.
 */
function Seo({
  title,
  description = "DentalCare — modern family dentistry. Book appointments online.",
}) {
  useEffect(() => {
    const fullTitle = title.includes("DentalCare")
      ? title
      : `${title} | DentalCare`;
    document.title = fullTitle;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description);
  }, [title, description]);

  return null;
}

export default Seo;
