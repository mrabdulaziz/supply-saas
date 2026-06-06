/**
 * Generic CSV export utility
 * Usage: exportCsv(orders, ['orderNumber','totalAmount','status'], 'orders-export')
 */
export function exportCsv(data: any[], columns: string[], filename: string) {
  if (!data.length) return;

  const headers = columns.join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const val = col.split('.').reduce((obj, key) => obj?.[key], row);
      const str = val === null || val === undefined ? '' : String(val);
      // Escape commas and quotes
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
