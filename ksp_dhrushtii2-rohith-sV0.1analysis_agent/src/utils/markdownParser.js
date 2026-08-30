/**
 * Markdown to HTML Parser Utility (SOLID - SRP)
 * Handles: **bold**, *italic*, `code`, ### headers, bullet lists, and GFM tables
 */
export function markdownToHtml(text) {
  if (!text) return '';
  // If text already contains rendered HTML tags (e.g. welcome message), return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  let html = text
    // Escape raw HTML characters to prevent XSS from unformatted strings
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // --- GFM Table ---
  // Match table blocks: header row | separator row | data rows
  html = html.replace(
    /^(\|.+\|[ \t]*\n)(\|[-: |]+\|[ \t]*\n)((\|.+\|[ \t]*\n?)*)/gm,
    (match, header, sep, body) => {
      const parseRow = (row) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const headers = parseRow(header);
      const rows = body.trim().split('\n').filter((r) => r.trim());

      const thead =
        '<thead><tr>' +
        headers
          .map((h) => `<th>${h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`)
          .join('') +
        '</tr></thead>';

      const tbody =
        '<tbody>' +
        rows
          .map(
            (r) =>
              '<tr>' +
              parseRow(r)
                .map((c) => `<td>${c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`)
                .join('') +
              '</tr>'
          )
          .join('') +
        '</tbody>';

      return `<table class="md-table">${thead}${tbody}</table>`;
    }
  );

  // --- Headers ---
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // --- Bold & Italic ---
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // --- Inline code ---
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // --- Bullet lists ---
  html = html.replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // --- Line breaks ---
  html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;

  // Clean empty paragraphs and nested block elements
  html = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-3]>)/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p>(<table)/g, '$1')
    .replace(/(<\/table>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');

  return html;
}
