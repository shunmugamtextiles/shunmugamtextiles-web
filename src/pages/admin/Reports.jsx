import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Filter, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as XLSX from 'xlsx';

const Reports = () => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [weavers, setWeavers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    supervisorId: '',
    weaverId: '',
    receiptId: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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

    setFilteredReceipts(filtered);
  }, [filters, receipts]);

  // Get base column names (excluding products)
  const getBaseColumns = () => {
    return ['date', 'receiptNo', 'supervisorId', 'weaverId', 'weaverName', 'product'];
  };

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

  // Export to Excel
  const handleExportToExcel = () => {
    if (filteredReceipts.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel
    const baseColumns = getBaseColumns();
    const productColumns = products.map(p => p.name);
    const allColumns = [...baseColumns, ...productColumns];

    // Create worksheet data
    const worksheetData = [];

    // Add header row
    const headerRow = allColumns.map(col => {
      if (col === 'date') return 'DATE';
      if (col === 'receiptNo') return 'RECEIPT NO';
      if (col === 'supervisorId') return 'SUPERVISOR ID';
      if (col === 'weaverId') return 'LOOM NO';
      if (col === 'weaverName') return 'NAME';
      if (col === 'product') return 'PRODUCT';
      return col.toUpperCase();
    });
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
    const baseColumns = getBaseColumns();
    const productColumns = products.map(p => p.name);
    return [...baseColumns, ...productColumns];
  };

  const tableColumns = getTableColumns();
  const hasActiveFilters = filters.startDate || filters.endDate || filters.supervisorId || filters.weaverId || filters.receiptId;

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

                {/* Loom ID (Weaver ID) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loom ID (Weaver ID)
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
                        {columnName === 'date' ? 'DATE' :
                         columnName === 'receiptNo' ? 'RECEIPT NO' :
                         columnName === 'supervisorId' ? 'SUPERVISOR ID' :
                         columnName === 'weaverId' ? 'LOOM NO' :
                         columnName === 'weaverName' ? 'NAME' :
                         columnName === 'product' ? 'PRODUCT' :
                         columnName.toUpperCase()}
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
                            {getFieldValue(receipt, columnName) || '-'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {filteredReceipts.map((receipt) => (
                <div key={receipt.id} className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 space-y-3">
                  {tableColumns.slice(0, 5).map((columnName) => (
                    <div key={columnName}>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                        {columnName === 'date' ? 'DATE' :
                         columnName === 'receiptNo' ? 'RECEIPT NO' :
                         columnName === 'supervisorId' ? 'SUPERVISOR ID' :
                         columnName === 'weaverId' ? 'LOOM NO' :
                         columnName === 'weaverName' ? 'NAME' :
                         columnName === 'product' ? 'PRODUCT' :
                         columnName.toUpperCase()}
                      </p>
                      <p className="text-sm text-slate-700">{getFieldValue(receipt, columnName) || '-'}</p>
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
                              {columnName.toUpperCase()}
                            </p>
                            <p className="text-sm text-slate-700">{getFieldValue(receipt, columnName) || '-'}</p>
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

        {/* Export to Excel Button - Bottom Right Corner */}
        {!loading && filteredReceipts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleExportToExcel}
              className="bg-orange-600 text-white px-4 md:px-6 py-3 rounded-lg font-medium shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl flex items-center gap-2"
              title="Export to Excel"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Export to Excel</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
