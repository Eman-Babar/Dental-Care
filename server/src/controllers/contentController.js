import prisma from "../config/prisma.js";
import { DEFAULT_SITE_CONTENT } from "../utils/defaultSiteContent.js";

export async function ensureDefaultContent() {
  for (const item of DEFAULT_SITE_CONTENT) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
}

export const getPublicContent = async (req, res) => {
  try {
    await ensureDefaultContent();
    const rows = await prisma.siteContent.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });
    const content = {};
    for (const row of rows) {
      content[row.key] = row.value;
    }
    return res.json({ success: true, content, items: rows });
  } catch (error) {
    console.error("Get content error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminContent = async (req, res) => {
  try {
    await ensureDefaultContent();
    const items = await prisma.siteContent.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });
    return res.json({ success: true, items });
  } catch (error) {
    console.error("Get admin content error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateContentItem = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, label } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ message: "Value is required." });
    }

    const item = await prisma.siteContent.upsert({
      where: { key },
      update: {
        value: String(value),
        ...(label ? { label: String(label) } : {}),
      },
      create: {
        key,
        label: label || key,
        value: String(value),
        group: key.includes(".") ? key.split(".")[0] : "general",
      },
    });

    return res.json({
      success: true,
      message: "Content updated.",
      item,
    });
  } catch (error) {
    console.error("Update content error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const bulkUpdateContent = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required." });
    }

    const updated = [];
    for (const entry of items) {
      if (!entry?.key || entry.value === undefined) continue;
      const item = await prisma.siteContent.upsert({
        where: { key: entry.key },
        update: { value: String(entry.value) },
        create: {
          key: entry.key,
          label: entry.label || entry.key,
          value: String(entry.value),
          group: entry.key.includes(".") ? entry.key.split(".")[0] : "general",
        },
      });
      updated.push(item);
    }

    return res.json({
      success: true,
      message: "Content saved.",
      items: updated,
    });
  } catch (error) {
    console.error("Bulk update content error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
