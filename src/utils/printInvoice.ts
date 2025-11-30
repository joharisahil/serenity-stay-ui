export const openPrintWindow = (bill: any) => {
  const w = window.open("", "_blank", "width=900,height=1000,scrollbars=yes");
  if (!w) return alert("Enable popups for printing.");

  const escapeHtml = (s: any) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const styles = `/* your existing invoice CSS */`;

  const invoiceHtml = (copyLabel: string) => `
    /* same invoice template you wrote earlier */
  `;

  w.document.open();
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Invoice</title>${styles}</head>
    <body>
      ${invoiceHtml("Restaurant Copy")}
      ${invoiceHtml("Customer Copy")}
      <button onclick="window.print()">Print</button>
    </body>
    </html>
  `);
  w.document.close();

  setTimeout(() => w.print(), 400);
};
