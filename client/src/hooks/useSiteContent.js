import { useEffect, useState } from "react";
import api from "../api/axios";

const cache = { data: null, at: 0 };
const CACHE_MS = 30_000;

export function useSiteContent() {
  const [content, setContent] = useState(cache.data || {});
  const [loading, setLoading] = useState(!cache.data);

  useEffect(() => {
    let cancelled = false;
    const fresh = cache.data && Date.now() - cache.at < CACHE_MS;
    if (fresh) {
      setContent(cache.data);
      setLoading(false);
      return;
    }

    api
      .get("/content")
      .then(({ data }) => {
        if (cancelled) return;
        const next = data.content || {};
        cache.data = next;
        cache.at = Date.now();
        setContent(next);
      })
      .catch(() => {
        if (!cancelled) setContent((prev) => prev || {});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const get = (key, fallback = "") => content[key] ?? fallback;

  return { content, get, loading };
}

export function invalidateSiteContentCache() {
  cache.data = null;
  cache.at = 0;
}
