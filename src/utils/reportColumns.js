export const BASE_COLUMN_SEQUENCE = [
  'receiptNo',
  'supervisorId',
  'weaverId',
  'weaverName',
  'date'
];

export const SUB_TOTAL_COLUMN_KEY = 'subTotal';

export const getOrderedProductColumns = (products = []) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const seen = new Set();
  const orderedColumns = [];

  products.forEach((product) => {
    const name = (product?.name || '').trim();
    if (!name) return;

    const key = name.toLowerCase();
    if (seen.has(key)) return;

    orderedColumns.push(name);
    seen.add(key);
  });

  return orderedColumns;
};

export const getAllReportColumns = (products = []) => {
  const orderedProductColumns = getOrderedProductColumns(products);
  return [...BASE_COLUMN_SEQUENCE, ...orderedProductColumns, SUB_TOTAL_COLUMN_KEY];
};

