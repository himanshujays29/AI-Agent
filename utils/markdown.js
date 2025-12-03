
/**
 * Utility to clean markdown characters for plain text formats (like PDF)
 */
export const cleanMarkdownForPdf = (markdown) => {
  if (!markdown) return "";
  return markdown
    .replace(/[*#`]/g, "") // Remove bold, headers, code ticks
    .replace(/^- /gm, "• ") // Replace list hyphens with bullets
    .replace(/^\s*\n/gm, "\n") // Remove extra whitespace lines
    .trim();
};