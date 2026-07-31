import { getClinicBrand, getClientUrl } from "./brand.js";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Simple branded HTML email wrapper (inline styles for inbox compatibility).
 */
export async function buildBrandedEmail({ title, intro, rows = [], footerNote, cta }) {
  const brand = await getClinicBrand();
  const siteUrl = getClientUrl();
  const safeTitle = escapeHtml(title || brand);
  const safeIntro = escapeHtml(intro || "");
  const safeFooter = escapeHtml(
    footerNote || `You're receiving this from ${brand}.`
  );

  const rowsHtml = rows
    .filter((r) => r && (r.label || r.value))
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;color:#5b6b6a;font-size:13px;width:34%;vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:8px 0;color:#14201f;font-size:14px;font-weight:600;white-space:pre-line;">${escapeHtml(r.value).replace(/\n/g, "<br>")}</td>
      </tr>`
    )
    .join("");

  const ctaHtml = cta?.url
    ? `<p style="margin:24px 0 8px;">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#0a6b6b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">
          ${escapeHtml(cta.label || "Open clinic site")}
        </a>
      </p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f8f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f8f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d7e3e1;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#064e4f;padding:20px 24px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${escapeHtml(brand)}</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">${safeTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${safeIntro ? `<p style="margin:0 0 16px;color:#3d4a49;font-size:15px;line-height:1.55;">${safeIntro}</p>` : ""}
              ${
                rowsHtml
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e8f0ef;border-bottom:1px solid #e8f0ef;margin:8px 0 4px;">${rowsHtml}</table>`
                  : ""
              }
              ${ctaHtml}
              <p style="margin:20px 0 0;color:#7a8a89;font-size:12px;line-height:1.5;">${safeFooter}</p>
              <p style="margin:8px 0 0;"><a href="${escapeHtml(siteUrl)}" style="color:#0a6b6b;font-size:12px;">${escapeHtml(siteUrl)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    brand,
    title,
    "",
    intro,
    "",
    ...rows.map((r) => `${r.label}: ${r.value}`),
    cta?.url ? `\n${cta.label || "Link"}: ${cta.url}` : "",
    "",
    footerNote || `— ${brand}`,
    siteUrl,
  ].filter(Boolean);

  return { brand, html, text: textLines.join("\n") };
}
