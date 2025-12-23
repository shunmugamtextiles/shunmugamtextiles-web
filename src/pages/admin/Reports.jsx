import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Filter, X, ArrowUp, ArrowDown } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';
import {
  BASE_COLUMN_SEQUENCE,
  SUB_TOTAL_COLUMN_KEY,
  getAllReportColumns,
  getOrderedProductColumns
} from '../../utils/reportColumns';

const Reports = () => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [weavers, setWeavers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportView, setActiveReportView] = useState('supervisor');
  const [dateRangeInputs, setDateRangeInputs] = useState({ start: '', end: '' });
  const [dateRangeReport, setDateRangeReport] = useState({
    rows: [],
    productColumns: [],
    startDate: '',
    endDate: '',
    generated: false
  });
  const [dateRangeError, setDateRangeError] = useState('');
  const [dateRangeLoading, setDateRangeLoading] = useState(false);
  const [deleteRangeInputs, setDeleteRangeInputs] = useState({ start: '', end: '' });
  const [deleteRangeStatus, setDeleteRangeStatus] = useState({ type: '', message: '' });
  const [deleteRangeLoading, setDeleteRangeLoading] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supervisorId: '',
    weaverId: '',
    receiptId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [supervisorSort, setSupervisorSort] = useState({
    column: 'receiptNo',
    direction: 'desc'
  });
  const [dateRangeSort, setDateRangeSort] = useState({
    column: 'loomNo',
    direction: 'asc'
  });

  // Fetch supervisors from Firestore
  const fetchSupervisors = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'supervisors'));
      const supervisorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupervisors(supervisorsList);
      return supervisorsList;
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      return [];
    }
  };

  // Fetch weavers from Firestore
  const fetchWeavers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'weavers'));
      const weaversList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWeavers(weaversList);
      return weaversList;
    } catch (error) {
      console.error('Error fetching weavers:', error);
      return [];
    }
  };

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by name
      productsList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProducts(productsList);
      return productsList;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  // Fetch receipts from Firestore
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchSupervisors(),
        fetchWeavers()
      ]);
      
      const querySnapshot = await getDocs(collection(db, 'receipts'));
      const receiptsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first)
      receiptsList.sort((a, b) => {
        const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
        const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
        return dateB - dateA;
      });
      
      setReceipts(receiptsList);
      setFilteredReceipts(receiptsList);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceipts([]);
      setFilteredReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...receipts];

    // Filter by start date
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(receipt => {
        const receiptDate = receipt.date 
          ? (receipt.date.toDate ? receipt.date.toDate() : new Date(receipt.date))
          : null;
        if (!receiptDate) return false;
        receiptDate.setHours(0, 0, 0, 0);
        return receiptDate >= startDate;
      });
    }

    // Filter by end date
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(receipt => {
        const receiptDate = receipt.date 
          ? (receipt.date.toDate ? receipt.date.toDate() : new Date(receipt.date))
          : null;
        if (!receiptDate) return false;
        receiptDate.setHours(0, 0, 0, 0);
        return receiptDate <= endDate;
      });
    }

    // Filter by supervisor ID
    if (filters.supervisorId) {
      filtered = filtered.filter(receipt => {
        const supervisorId = receipt.supervisorId || receipt.supervisor_id || '';
        return supervisorId.toLowerCase().includes(filters.supervisorId.toLowerCase());
      });
    }

    // Filter by weaver ID (Loom ID)
    if (filters.weaverId) {
      filtered = filtered.filter(receipt => {
        const weaverId = receipt.weaverId || receipt.weaver_id || receipt.loomNo || receipt.loom_no || '';
        return weaverId.toLowerCase().includes(filters.weaverId.toLowerCase());
      });
    }

    // Filter by receipt ID
    if (filters.receiptId) {
      filtered = filtered.filter(receipt => {
        const receiptNo = receipt.receiptNo || receipt.receiptNumber || receipt.receipt_no || '';
        return receiptNo.toLowerCase().includes(filters.receiptId.toLowerCase());
      });
    }

    filtered = applySupervisorSort(filtered);
    setFilteredReceipts(filtered);
  }, [filters, receipts, supervisorSort]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      // Firestore timestamp
      const d = date.toDate();
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return date;
  };

  // Format date for Excel (YYYY-MM-DD)
  const formatDateForExcel = (date) => {
    if (!date) return '';
    let d;
    if (date.toDate) {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyCenterAlignment = (worksheet) => {
    if (!worksheet || !worksheet['!ref']) return;
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let row = range.s.R; row <= range.e.R; row += 1) {
      for (let col = range.s.C; col <= range.e.C; col += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          const alignment = { horizontal: 'center', vertical: 'center' };
          cell.s = cell.s
            ? { ...cell.s, alignment: { ...cell.s.alignment, ...alignment } }
            : { alignment };
        }
      }
    }
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
      return 'N/A';
    }
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Parse products from receipt and return quantities by product name
  const parseProductsFromReceipt = (receipt) => {
    // Try to find products field (could be products, product, items, etc.)
    const productsField = receipt.products || receipt.product || receipt.items || receipt.productsData;
    
    if (!productsField) {
      // Return object with all product names set to 0
      const result = {};
      products.forEach(p => {
        result[p.name] = 0;
      });
      return result;
    }

    let productsObj = {};
    
    // If it's a string, try to parse it
    if (typeof productsField === 'string') {
      try {
        productsObj = JSON.parse(productsField);
      } catch (e) {
        const result = {};
        products.forEach(p => {
          result[p.name] = 0;
        });
        return result;
      }
    } else if (typeof productsField === 'object') {
      productsObj = productsField;
    } else {
      const result = {};
      products.forEach(p => {
        result[p.name] = 0;
      });
      return result;
    }

    // Initialize result with all products set to 0
    const result = {};
    products.forEach(p => {
      result[p.name] = 0;
    });
    
    // Extract quantities from receipt products
    Object.values(productsObj).forEach(product => {
      if (product && typeof product === 'object') {
        const productName = product.productName || product.name || product.product_name || '';
        const quantity = product.quantity || 0;
        
        // Match by product name (case-insensitive)
        const matchedProduct = products.find(p => 
          p.name && p.name.toLowerCase().trim() === productName.toLowerCase().trim()
        );
        
        if (matchedProduct) {
          result[matchedProduct.name] = (result[matchedProduct.name] || 0) + quantity;
        }
      }
    });

    return result;
  };

  const calculateSubTotal = (receipt) => {
    const productQuantities = parseProductsFromReceipt(receipt);
    return Object.values(productQuantities).reduce((sum, qty) => {
      const numericQty = Number(qty);
      if (Number.isNaN(numericQty)) {
        return sum;
      }
      return sum + numericQty;
    }, 0);
  };

  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return value;
  };

  const getColumnLabel = (columnName) => {
    if (columnName === 'date') return 'DATE';
    if (columnName === 'receiptNo') return 'RECEIPT NO';
    if (columnName === 'supervisorId') return 'SUPERVISOR ID';
    if (columnName === 'weaverId') return 'LOOM NO';
    if (columnName === 'loomNo') return 'LOOM';
    if (columnName === 'weaverName') return 'WEAVER';
    if (columnName === 'product') return 'PRODUCT';
    if (columnName === 'sno') return 'S NO';
    if (columnName === 'total') return 'TOTAL';
    if (columnName === SUB_TOTAL_COLUMN_KEY) return 'TOTAL';
    return columnName.toUpperCase();
  };

  // Get value for a field
  const getFieldValue = (receipt, fieldName) => {
    // Handle date
    if (fieldName.toLowerCase() === 'date') {
      return formatDate(receipt.date);
    }
    
    // Handle receiptNo
    if (fieldName.toLowerCase() === 'receiptno' || fieldName.toLowerCase() === 'receiptno') {
      return receipt.receiptNo || receipt.receiptNumber || receipt.receipt_no || '';
    }
    
    // Handle supervisorId
    if (fieldName.toLowerCase() === 'supervisorid') {
      return receipt.supervisorId || receipt.supervisor_id || '';
    }
    
    // Handle weaverId (LOOM NO)
    if (fieldName.toLowerCase() === 'weaverid') {
      return receipt.weaverId || receipt.weaver_id || receipt.loomNo || receipt.loom_no || '';
    }
    
    // Handle weaverName (NAME)
    if (fieldName.toLowerCase() === 'weavername') {
      return receipt.weaverName || receipt.weaver_name || receipt.name || '';
    }
    
    // Handle product
    if (fieldName.toLowerCase() === 'product') {
      return receipt.product || receipt.productName || receipt.product_name || 'PCS';
    }

    if (fieldName === SUB_TOTAL_COLUMN_KEY) {
      return calculateSubTotal(receipt);
    }
    
    // Handle product columns (product names)
    const product = products.find(p => p.name === fieldName);
    if (product) {
      const productQuantities = parseProductsFromReceipt(receipt);
      return productQuantities[fieldName] || 0;
    }
    
    // Default
    const value = receipt[fieldName];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getRangeFieldValue = (row, columnName) => {
    if (columnName === 'sno') return row.sno;
    if (columnName === 'loomNo') return row.loomNo || '-';
    if (columnName === 'weaverName') return row.weaverName || '-';
    if (columnName === 'total') return row.total || 0;
    return row[columnName] ?? 0;
  };

  const getReceiptNumberFromRecord = (receipt) => {
    return receipt.receiptNo || receipt.receiptNumber || receipt.receipt_no || '';
  };

  const getSupervisorSortValue = (receipt, columnName) => {
    if (!receipt) return '';

    if (columnName === 'date') {
      const d = receipt.date
        ? (receipt.date.toDate ? receipt.date.toDate() : new Date(receipt.date))
        : null;
      return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    }

    if (columnName === 'receiptNo') {
      const raw = getReceiptNumberFromRecord(receipt) || '';
      const num = Number(raw);
      if (!Number.isNaN(num)) return num;
      return raw.toString().toLowerCase();
    }

    if (columnName === 'supervisorId') {
      return (receipt.supervisorId || receipt.supervisor_id || '').toString().toLowerCase();
    }

    if (columnName === 'weaverId' || columnName === 'loomNo') {
      const loom =
        receipt.weaverId ||
        receipt.weaver_id ||
        receipt.loomNo ||
        receipt.loom_no ||
        '';
      const num = Number(loom);
      if (!Number.isNaN(num)) return num;
      return loom.toString().toLowerCase();
    }

    if (columnName === 'weaverName') {
      return (receipt.weaverName || receipt.weaver_name || receipt.name || '').toString().toLowerCase();
    }

    if (columnName === SUB_TOTAL_COLUMN_KEY) {
      return Number(calculateSubTotal(receipt)) || 0;
    }

    const value = receipt[columnName];
    if (value === undefined || value === null) return '';
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    return value.toString().toLowerCase();
  };

  const applySupervisorSort = (list, sortOverride) => {
    const sortState = sortOverride || supervisorSort;
    const { column, direction } = sortState;
    if (!column) return [...list];

    const sorted = [...list].sort((a, b) => {
      const va = getSupervisorSortValue(a, column);
      const vb = getSupervisorSortValue(b, column);

      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const getDateRangeSortValue = (row, columnName) => {
    if (!row) return '';

    if (columnName === 'sno') {
      return Number(row.sno) || 0;
    }

    if (columnName === 'loomNo') {
      const loom = row.loomNo || '';
      const num = Number(loom);
      if (!Number.isNaN(num)) return num;
      return loom.toString().toLowerCase();
    }

    if (columnName === 'weaverName') {
      return (row.weaverName || '').toString().toLowerCase();
    }

    if (columnName === 'total') {
      return Number(row.total) || 0;
    }

    const value = row[columnName];
    if (value === undefined || value === null) return '';
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    return value.toString().toLowerCase();
  };

  const applyDateRangeSort = (rows, sortOverride) => {
    const sortState = sortOverride || dateRangeSort;
    const { column, direction } = sortState;
    if (!column) return [...rows];

    const sorted = [...rows].sort((a, b) => {
      const va = getDateRangeSortValue(a, column);
      const vb = getDateRangeSortValue(b, column);

      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const handleDeleteRangeInputChange = (field, value) => {
    setDeleteRangeInputs(prev => ({
      ...prev,
      [field]: value
    }));
    setDeleteRangeStatus({ type: '', message: '' });
  };

  const isReceiptWithinRange = (value, start, end) => {
    if (!value) return false;
    const trimmedValue = value.trim();
    if (!trimmedValue) return false;

    const toNumber = (val) => {
      const num = Number(val);
      return Number.isNaN(num) ? null : num;
    };

    const startNum = toNumber(start);
    const endNum = toNumber(end);

    if (startNum !== null && endNum !== null) {
      const targetNum = toNumber(trimmedValue);
      if (targetNum === null) return false;
      const min = Math.min(startNum, endNum);
      const max = Math.max(startNum, endNum);
      return targetNum >= min && targetNum <= max;
    }

    const normalizedStart = start.toLowerCase();
    const normalizedEnd = end.toLowerCase();
    const normalizedValue = trimmedValue.toLowerCase();

    const startFirst = normalizedStart <= normalizedEnd;
    if (startFirst) {
      return normalizedValue >= normalizedStart && normalizedValue <= normalizedEnd;
    }
    return normalizedValue >= normalizedEnd && normalizedValue <= normalizedStart;
  };

  const handleDeleteReceipts = () => {
    const start = deleteRangeInputs.start.trim();
    const end = deleteRangeInputs.end.trim();
    if (!start || !end) {
      setDeleteRangeStatus({ type: 'error', message: 'Please enter both start and end receipt numbers.' });
      return;
    }

    const matchingReceipts = receipts.filter(receipt =>
      isReceiptWithinRange(getReceiptNumberFromRecord(receipt), start, end)
    );

    if (matchingReceipts.length === 0) {
      setDeleteRangeStatus({ type: 'info', message: 'No receipts found in the specified range.' });
      return;
    }

    setDeleteConfirmData({
      start,
      end,
      receipts: matchingReceipts
    });
  };

  const confirmDeleteReceipts = async () => {
    if (!deleteConfirmData) return;
    const { receipts: receiptsToDelete, start, end } = deleteConfirmData;
    setDeleteRangeLoading(true);
    setDeleteRangeStatus({ type: '', message: '' });

    try {
      await Promise.all(
        receiptsToDelete.map(receipt => deleteDoc(doc(db, 'receipts', receipt.id)))
      );
      setDeleteRangeStatus({
        type: 'success',
        message: `Deleted ${receiptsToDelete.length} receipt(s) from ${start} to ${end}.`
      });
      setDeleteRangeInputs({ start: '', end: '' });
      setDeleteConfirmData(null);
      fetchReceipts();
    } catch (error) {
      console.error('Error deleting receipts:', error);
      setDeleteRangeStatus({
        type: 'error',
        message: 'Failed to delete receipts. Please try again.'
      });
    } finally {
      setDeleteRangeLoading(false);
    }
  };

  const cancelDeleteConfirmation = () => {
    setDeleteConfirmData(null);
  };

  const handleDateRangeInputChange = (field, value) => {
    setDateRangeInputs(prev => ({
      ...prev,
      [field]: value
    }));
    setDateRangeError('');
  };

  const generateDateRangeReport = () => {
    if (!dateRangeInputs.start || !dateRangeInputs.end) {
      setDateRangeError('Please select both start and end dates.');
      return;
    }

    const startDate = new Date(dateRangeInputs.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRangeInputs.end);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      setDateRangeError('Start date should be before end date.');
      return;
    }

    setDateRangeLoading(true);
    setDateRangeError('');

    const productColumns = getOrderedProductColumns(products);
    const rowsMap = new Map();

    receipts.forEach((receipt) => {
      const receiptDate = receipt.date
        ? (receipt.date.toDate ? receipt.date.toDate() : new Date(receipt.date))
        : null;
      if (!receiptDate) return;
      if (receiptDate < startDate || receiptDate > endDate) return;

      const loomNo = receipt.loomNo || receipt.loom_no || receipt.weaverId || receipt.weaver_id || 'N/A';
      const weaverName = receipt.weaverName || receipt.weaver_name || receipt.name || 'N/A';
      const key = `${loomNo}__${weaverName}`;

      if (!rowsMap.has(key)) {
        const initialRow = { loomNo, weaverName, total: 0 };
        productColumns.forEach(name => {
          initialRow[name] = 0;
        });
        rowsMap.set(key, initialRow);
      }

      const row = rowsMap.get(key);
      const productQuantities = parseProductsFromReceipt(receipt);
      productColumns.forEach(name => {
        const qty = Number(productQuantities[name]) || 0;
        if (!qty) return;
        row[name] = (row[name] || 0) + qty;
        row.total = (row.total || 0) + qty;
      });
    });

    const rows = Array.from(rowsMap.values())
      .sort((a, b) => {
        const loomA = parseInt(a.loomNo, 10);
        const loomB = parseInt(b.loomNo, 10);
        if (!Number.isNaN(loomA) && !Number.isNaN(loomB)) {
          return loomA - loomB;
        }
        return (a.loomNo || '').localeCompare(b.loomNo || '');
      })
      .map((row, index) => ({
        ...row,
        sno: index + 1
      }));

    setDateRangeReport({
      rows,
      productColumns,
      startDate: dateRangeInputs.start,
      endDate: dateRangeInputs.end,
      generated: true
    });
    setDateRangeLoading(false);
  };

  const handleDateRangeReportDownload = () => {
    if (!dateRangeReport.generated || dateRangeReport.rows.length === 0) {
      return;
    }

    const columns = ['sno', 'loomNo', 'weaverName', ...dateRangeReport.productColumns, 'total'];
    const headerRow = columns.map(col => {
      if (col === 'sno') return 'S NO';
      if (col === 'loomNo') return 'LOOM';
      if (col === 'weaverName') return 'WEAVER';
      if (col === 'total') return 'TOTAL';
      return col.toUpperCase();
    });

    const title = `PCS DELIVERY FROM DATE : ${formatDisplayDate(dateRangeReport.startDate)} TO : ${formatDisplayDate(dateRangeReport.endDate)}`;

    const worksheetData = [[title], headerRow];

    dateRangeReport.rows.forEach(row => {
      const dataRow = [
        row.sno,
        row.loomNo,
        row.weaverName,
        ...dateRangeReport.productColumns.map(name => row[name] || 0),
        row.total || 0
      ];
      worksheetData.push(dataRow);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    applyCenterAlignment(ws);

    if (columns.length > 1) {
      ws['!merges'] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: columns.length - 1 }
        }
      ];
    }

    ws['!cols'] = columns.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Date Range Report');

    const filename = `PCS_Delivery_${formatDateForExcel(dateRangeReport.startDate)}_to_${formatDateForExcel(dateRangeReport.endDate)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (filteredReceipts.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel
    const baseColumns = [...BASE_COLUMN_SEQUENCE];
    const productColumns = getOrderedProductColumns(products);
    const allColumns = [...baseColumns, ...productColumns, SUB_TOTAL_COLUMN_KEY];

    // Create worksheet data
    const worksheetData = [];

    // Add header row
    const headerRow = allColumns.map(col => getColumnLabel(col));
    worksheetData.push(headerRow);

    // Add data rows
    filteredReceipts.forEach(receipt => {
      const row = allColumns.map(col => {
        if (col === 'date') {
          return formatDateForExcel(receipt.date);
        }
        return getFieldValue(receipt, col);
      });
      worksheetData.push(row);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    applyCenterAlignment(ws);

    // Set column widths
    const colWidths = allColumns.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');

    // Generate filename with date range if filters are applied
    let filename = 'Reports';
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? formatDateForExcel(filters.startDate) : 'All';
      const end = filters.endDate ? formatDateForExcel(filters.endDate) : 'All';
      filename += `_${start}_to_${end}`;
    }
    filename += '.xlsx';

    // Save file
    XLSX.writeFile(wb, filename);
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      supervisorId: '',
      weaverId: '',
      receiptId: ''
    });
  };

  // Get all column names for table
  const getTableColumns = () => {
    return getAllReportColumns(products);
  };

  const tableColumns = getTableColumns();
  const dateRangeColumns = ['sno', 'loomNo', 'weaverName', ...dateRangeReport.productColumns, 'total'];

  const isProductColumn = (columnName) => {
    return products.some((p) => p.name === columnName);
  };

  const isDateRangeProductColumn = (columnName) => {
    return dateRangeReport.productColumns.includes(columnName);
  };

  // Grand totals for last column
  const supervisorGrandTotal = filteredReceipts.reduce(
    (sum, receipt) => sum + Number(calculateSubTotal(receipt) || 0),
    0
  );
  const dateRangeGrandTotal = dateRangeReport.rows.reduce(
    (sum, row) => sum + Number(row.total || 0),
    0
  );
  const reportOptions = [
    {
      key: 'supervisor',
      title: 'Supervisor Report',
      description: 'Filter receipts, view product quantities and export full data.'
    },
    {
      key: 'dateRange',
      title: 'Date to Date Report',
      description: 'Generate PCS delivery summary between two dates and download it.'
    },
    {
      key: 'delete',
      title: 'Delete Receipts',
      description: 'Remove receipts within a specific receipt number range.'
    }
  ];
  const hasActiveFilters = filters.startDate || filters.endDate || filters.supervisorId || filters.weaverId || filters.receiptId;
  const canDownloadSupervisorReport = activeReportView === 'supervisor' && !loading && filteredReceipts.length > 0;
  const canDownloadDateRangeReport = activeReportView === 'dateRange' && dateRangeReport.rows.length > 0;
  const canDownloadReport = canDownloadSupervisorReport || canDownloadDateRangeReport;

  const handleDownloadReport = () => {
    if (canDownloadSupervisorReport) {
      handleExportToExcel();
      return;
    }
    if (canDownloadDateRangeReport) {
      handleDateRangeReportDownload();
    }
  };

  const handleSupervisorSortClick = (columnName, direction) => {
    const sortState = { column: columnName, direction };
    setSupervisorSort(sortState);
    setFilteredReceipts((prev) => applySupervisorSort(prev, sortState));
  };

  const handleDateRangeSortClick = (columnName, direction) => {
    const sortState = { column: columnName, direction };
    setDateRangeSort(sortState);
    setDateRangeReport((prev) => ({
      ...prev,
      rows: applyDateRangeSort(prev.rows, sortState)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                to="/admin/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft size={20} className="md:w-6 md:h-6 text-blue-900" />
              </Link>
              <div className="flex items-center gap-2 md:gap-3">
                <FileText size={24} className="md:w-8 md:h-8 text-orange-600 shrink-0" />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-blue-900">Reports</h1>
                  <p className="text-xs md:text-sm text-slate-600">View and export receipts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Report Type Selector */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="p-4 md:p-6 border-b border-slate-200">
            <h2 className="text-lg md:text-xl font-bold text-blue-900">Choose Report</h2>
            <p className="text-sm text-slate-600 mt-1">
              Select the report type you want to view.
            </p>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportOptions.map((option) => {
              const isActive = activeReportView === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => {
                    setActiveReportView(option.key);
                    if (option.key === 'dateRange') {
                      setDateRangeError('');
                    }
                  }}
                  className={`text-left border rounded-2xl p-4 transition-all focus:outline-none ${
                    isActive
                      ? 'border-orange-500 bg-orange-50 shadow-lg'
                      : 'border-slate-200 hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {option.key === 'supervisor' ? 'Primary' : 'Summary'}
                  </p>
                  <h3 className="text-lg font-semibold text-blue-900">{option.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                  {isActive && (
                    <span className="inline-flex mt-3 text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeReportView === 'supervisor' && (
          <>
            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-md mb-6">
              <div className="p-4 md:p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Filter size={20} className="text-orange-600" />
                    <h2 className="text-lg md:text-xl font-bold text-blue-900">Filters</h2>
                    {hasActiveFilters && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-slate-600 hover:text-blue-900 transition-colors"
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* Supervisor ID */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Supervisor ID
                      </label>
                      <input
                        type="text"
                        value={filters.supervisorId}
                        onChange={(e) => handleFilterChange('supervisorId', e.target.value)}
                        placeholder="Enter Supervisor ID"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* Loom No */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Loom No
                      </label>
                      <input
                        type="text"
                        value={filters.weaverId}
                        onChange={(e) => handleFilterChange('weaverId', e.target.value)}
                        placeholder="Enter Loom ID"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* Receipt ID */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Receipt ID
                      </label>
                      <input
                        type="text"
                        value={filters.receiptId}
                        onChange={(e) => handleFilterChange('receiptId', e.target.value)}
                        placeholder="Enter Receipt ID"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
                      >
                        <X size={16} />
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-slate-600 mt-4">Loading receipts...</p>
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FileText size={64} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  {hasActiveFilters ? 'No Receipts Match Filters' : 'No Receipts Found'}
                </h3>
                <p className="text-slate-500">
                  {hasActiveFilters 
                    ? 'Try adjusting your filter criteria'
                    : 'No receipts available in the database'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden relative">
                <div className="p-4 md:p-6 border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-blue-900">Receipts List</h2>
                      <p className="text-xs md:text-sm text-slate-600 mt-1">
                        Showing {filteredReceipts.length} of {receipts.length} receipt(s)
                        {hasActiveFilters && ' (filtered)'}
                      </p>
                    </div>
                    {canDownloadSupervisorReport && (
                      <button
                        onClick={handleDownloadReport}
                        className="bg-orange-600 text-white px-4 md:px-6 py-2 rounded-lg text-sm font-medium shadow-md transition-all hover:bg-orange-700 hover:shadow-lg flex items-center gap-2"
                        title="Download Supervisor Report"
                      >
                        <Download size={18} />
                        <span className="hidden sm:inline">Download Report</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        {tableColumns.map((columnName) => (
                          <th
                            key={columnName}
                            className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                          >
                            <div className="flex items-center gap-1">
                              <span>{getColumnLabel(columnName)}</span>
                              {!isProductColumn(columnName) && (
                                <span className="flex flex-col -space-y-1 ml-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSupervisorSortClick(columnName, 'asc')}
                                    className={`p-0.5 hover:text-blue-900 ${
                                      supervisorSort.column === columnName &&
                                      supervisorSort.direction === 'asc'
                                        ? 'text-blue-900'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    <ArrowUp size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSupervisorSortClick(columnName, 'desc')}
                                    className={`p-0.5 hover:text-blue-900 ${
                                      supervisorSort.column === columnName &&
                                      supervisorSort.direction === 'desc'
                                        ? 'text-blue-900'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    <ArrowDown size={10} />
                                  </button>
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredReceipts.map((receipt) => (
                        <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                          {tableColumns.map((columnName) => (
                            <td key={columnName} className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-slate-700">
                                {getDisplayValue(getFieldValue(receipt, columnName))}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100">
                      <tr>
                        <td
                          colSpan={tableColumns.length - 1}
                          className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider"
                        >
                          GRAND TOTAL
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-blue-900">
                            {supervisorGrandTotal}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {filteredReceipts.map((receipt) => (
                    <div key={receipt.id} className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 space-y-3">
                      {tableColumns.slice(0, 5).map((columnName) => (
                        <div key={columnName}>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                            {getColumnLabel(columnName)}
                          </p>
                          <p className="text-sm text-slate-700">{getDisplayValue(getFieldValue(receipt, columnName))}</p>
                        </div>
                      ))}
                      {tableColumns.length > 5 && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 uppercase tracking-wide cursor-pointer">
                            View More ({tableColumns.length - 5})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {tableColumns.slice(5).map((columnName) => (
                              <div key={columnName}>
                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                                  {getColumnLabel(columnName)}
                                </p>
                                <p className="text-sm text-slate-700">{getDisplayValue(getFieldValue(receipt, columnName))}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeReportView === 'dateRange' && (
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-4 md:p-6 border-b border-slate-200">
              <h2 className="text-lg md:text-xl font-bold text-blue-900">Date to Date Report</h2>
              <p className="text-sm text-slate-600 mt-1">
                Generate PCS delivery summary for any custom date range.
              </p>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeInputs.start}
                    onChange={(e) => handleDateRangeInputChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRangeInputs.end}
                    onChange={(e) => handleDateRangeInputChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {dateRangeError && (
                <p className="text-sm text-red-600">{dateRangeError}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={generateDateRangeReport}
                  className="px-3 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
                  disabled={dateRangeLoading}
                >
                  {dateRangeLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
            <div className="border-t border-slate-200">
              {dateRangeReport.generated ? (
                dateRangeReport.rows.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No data found for the selected date range.
                  </div>
                ) : (
                  <>
                    <div className="px-4 md:px-6 py-3 flex justify-end">
                      {canDownloadDateRangeReport && (
                        <button
                          onClick={handleDownloadReport}
                          className="bg-orange-600 text-white px-4 md:px-6 py-2 rounded-lg text-sm font-medium shadow-md transition-all hover:bg-orange-700 hover:shadow-lg flex items-center gap-2"
                          title="Download Date Range Report"
                        >
                          <Download size={18} />
                          <span className="hidden sm:inline">Download Report</span>
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          {dateRangeColumns.map((column) => (
                            <th
                              key={column}
                              className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                            >
                              <div className="flex items-center gap-1">
                                <span>{getColumnLabel(column)}</span>
                                {!isDateRangeProductColumn(column) && (
                                  <span className="flex flex-col -space-y-1 ml-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDateRangeSortClick(column, 'asc')}
                                      className={`p-0.5 hover:text-blue-900 ${
                                        dateRangeSort.column === column &&
                                        dateRangeSort.direction === 'asc'
                                          ? 'text-blue-900'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      <ArrowUp size={10} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDateRangeSortClick(column, 'desc')}
                                      className={`p-0.5 hover:text-blue-900 ${
                                        dateRangeSort.column === column &&
                                        dateRangeSort.direction === 'desc'
                                          ? 'text-blue-900'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      <ArrowDown size={10} />
                                    </button>
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                        <tbody className="divide-y divide-slate-200">
                          {dateRangeReport.rows.map((row) => (
                            <tr key={`${row.loomNo}-${row.weaverName}`} className="hover:bg-slate-50 transition-colors">
                              {dateRangeColumns.map((column) => (
                                <td key={column} className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-sm text-slate-700">
                                    {getDisplayValue(getRangeFieldValue(row, column))}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100">
                          <tr>
                            <td
                              colSpan={dateRangeColumns.length - 1}
                              className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider"
                            >
                              GRAND TOTAL
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-semibold text-blue-900">
                                {dateRangeGrandTotal}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )
              ) : (
                <div className="p-6 text-center text-slate-500">
                  Select the date range and click "Generate Report" to view the summary.
                </div>
              )}
            </div>
          </div>
        )}

        {activeReportView === 'delete' && (
          <div className="bg-white rounded-xl shadow-md">
            <div className="p-4 md:p-6 border-b border-slate-200">
              <h2 className="text-lg md:text-xl font-bold text-blue-900">Delete Receipts</h2>
              <p className="text-sm text-slate-600 mt-1">
                Enter the receipt number range you want to remove. This action is irreversible.
              </p>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Receipt No
                  </label>
                  <input
                    type="text"
                    value={deleteRangeInputs.start}
                    onChange={(e) => handleDeleteRangeInputChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., 1001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Receipt No
                  </label>
                  <input
                    type="text"
                    value={deleteRangeInputs.end}
                    onChange={(e) => handleDeleteRangeInputChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., 1050"
                  />
                </div>
              </div>
              {deleteRangeStatus.message && (
                <div
                  className={`text-sm rounded-lg px-3 py-2 ${
                    deleteRangeStatus.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : deleteRangeStatus.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  {deleteRangeStatus.message}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeleteReceipts}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm w-full sm:w-auto"
                  disabled={deleteRangeLoading}
                >
                  {deleteRangeLoading ? 'Deleting...' : 'Delete Receipts'}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmData && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900">Confirm Deletion</h3>
                <button
                  onClick={cancelDeleteConfirmation}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                This will permanently delete {deleteConfirmData.receipts.length} receipt(s) from{' '}
                <span className="font-semibold">{deleteConfirmData.start}</span> to{' '}
                <span className="font-semibold">{deleteConfirmData.end}</span>. This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelDeleteConfirmation}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  disabled={deleteRangeLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteReceipts}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={deleteRangeLoading}
                >
                  {deleteRangeLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Reports;
