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

  // Sort by serialNo (ascending), then by name for stability/fallback
  const sorted = [...products].sort((a, b) => {
    const aSerial = Number(a?.serialNo);
    const bSerial = Number(b?.serialNo);
    const aHas = !Number.isNaN(aSerial);
    const bHas = !Number.isNaN(bSerial);

    if (aHas && bHas && aSerial !== bSerial) return aSerial - bSerial;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;

    return (a?.name || '').localeCompare(b?.name || '');
  });

  const seen = new Set();
  const orderedColumns = [];

  sorted.forEach((product) => {
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

