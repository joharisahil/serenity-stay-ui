export const PLAN_NAMES: Record<string, string> = {
  EP: "European Plan",
  CP: "Continental Plan",
  AP: "American Plan",
  MAP: "Modified American Plan",
};

export const invoiceStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; padding: 20px; background: #fff; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { font-size: 14px; color: #555; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { padding: 5px 0; }
    .info-item strong { display: inline-block; min-width: 140px; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th, .table td { border: 1px solid #333; padding: 8px; text-align: left; }
    .table th { background-color: #f0f0f0; font-weight: bold; }
    .table td.text-right, .table th.text-right { text-align: right; }
    .table td.text-center { text-align: center; }
    .total-section { margin-top: 20px; border-top: 2px solid #333; padding-top: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .total-row.grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; text-align: center; font-size: 12px; color: #666; }
    .company-box { background-color: #f9f9f9; padding: 12px; border: 1px solid #ddd; margin-bottom: 15px; border-radius: 4px; }
    .gst-badge { display: inline-block; padding: 2px 8px; background-color: #4CAF50; color: white; border-radius: 3px; font-size: 11px; margin-left: 8px; }
    .no-gst-badge { display: inline-block; padding: 2px 8px; background-color: #999; color: white; border-radius: 3px; font-size: 11px; margin-left: 8px; }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; }
    }
  </style>
`;
