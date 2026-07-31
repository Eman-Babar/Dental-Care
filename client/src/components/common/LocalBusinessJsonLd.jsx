import { useEffect } from "react";
import { useSiteContent } from "../../hooks/useSiteContent";

/**
 * Injects LocalBusiness JSON-LD for local SEO.
 */
function LocalBusinessJsonLd() {
  const { content, loading } = useSiteContent();

  useEffect(() => {
    if (loading) return;

    const brand = content["home.brand"] || "DentalCare";
    const data = {
      "@context": "https://schema.org",
      "@type": "Dentist",
      name: brand,
      description:
        content["brand.seo_description"] ||
        "Modern family dentistry. Book appointments online.",
      url: window.location.origin,
      telephone: content["contact.phone"] || "",
      email: content["contact.email"] || "",
      image: content["brand.og_image"] || content["home.hero_image"] || "",
      address: {
        "@type": "PostalAddress",
        streetAddress: content["contact.address"] || "",
      },
      openingHours: content["contact.hours"] || "",
    };

    const id = "dentalcare-localbusiness-jsonld";
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }, [content, loading]);

  return null;
}

export default LocalBusinessJsonLd;
