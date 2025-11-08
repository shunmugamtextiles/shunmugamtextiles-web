import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Reports = () => {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const productsList = await fetchProducts();
      
      const querySnapshot = await getDocs(collection(db, 'receipts'));
      const receiptsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date (newest first)
      receiptsList.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
      
      setReceipts(receiptsList);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

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

  // Format date for print (DD-MM-YYYY)
  const formatDateForPrint = (date) => {
    if (!date) return '';
    let d;
    if (date.toDate) {
      d = date.toDate();
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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

  // Print receipt
  const handlePrint = (receipt) => {
    const printWindow = window.open('', '_blank');
    
    // Get all fields except metadata
    const fields = Object.keys(receipt).filter(key => 
      key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
    );

    // Extract specific fields for header (matching the image format)
    const date = formatDateForPrint(receipt.date);
    const receiptNo = receipt.receiptNo || receipt.receiptNumber || receipt.receipt_no || '';
    const supervisorId = receipt.supervisorId || receipt.supervisor_id || '';
    // weaverId should be displayed as LOOM NO
    const loomNo = receipt.weaverId || receipt.weaver_id || receipt.loomNo || receipt.loom_no || '';
    // weaver name should be displayed as NAME
    const name = receipt.weaverName || receipt.weaver_name || receipt.name || '';
    const product = receipt.product || receipt.productName || receipt.product_name || 'PCS';

    // Parse products quantities
    const productQuantities = parseProductsFromReceipt(receipt);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptNo}</title>
          <style>
            @media print {
              @page {
                margin: 10mm;
                size: A4;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              border: 3px solid #000;
            }
            .receipt-table td {
              border: 1px solid #000;
              padding: 8px 12px;
              text-align: left;
            }
            .receipt-table td:first-child {
              font-weight: bold;
              width: 40%;
            }
            .receipt-table td:last-child {
              text-align: right;
            }
            .header-cell {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              padding: 12px;
            }
            .total-row td {
              font-weight: bold;
            }
            .item-row td:last-child {
              text-align: right;
            }
          </style>
        </head>
        <body>
          <table class="receipt-table">
            <tr>
              <td colspan="2" class="header-cell">SHUNMUGAM TEXTILES</td>
            </tr>
            <tr>
              <td colspan="2" class="header-cell">KOMARAPALAYAM</td>
            </tr>
            <tr>
              <td>DATE</td>
              <td style="text-align: right;">${date}</td>
            </tr>
            <tr>
              <td>RECIEPT NO</td>
              <td style="text-align: right;">${receiptNo}</td>
            </tr>
            <tr>
              <td>SUPERVISOR ID</td>
              <td style="text-align: right;">${supervisorId}</td>
            </tr>
            <tr>
              <td>LOOM NO</td>
              <td style="text-align: right;">${loomNo}</td>
            </tr>
            <tr>
              <td>NAME</td>
              <td style="text-align: right;">${name}</td>
            </tr>
            <tr>
              <td>PRODUCT</td>
              <td style="text-align: right;">${product}</td>
            </tr>
            ${products.map(product => {
              const quantity = productQuantities[product.name] || 0;
              return `
                <tr class="item-row">
                  <td>${product.name.toUpperCase()}</td>
                  <td style="text-align: right;">${quantity}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td style="text-align: right;"></td>
            </tr>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Get all column names for table
  const getTableColumns = () => {
    const baseColumns = getBaseColumns();
    const productColumns = products.map(p => p.name);
    return [...baseColumns, ...productColumns];
  };

  const tableColumns = getTableColumns();

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
                  <p className="text-xs md:text-sm text-slate-600">View and print receipts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="text-slate-600 mt-4">Loading receipts...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Receipts Found</h3>
            <p className="text-slate-500">No receipts available in the database</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden relative">
            <div className="p-4 md:p-6 border-b border-slate-200">
              <h2 className="text-lg md:text-xl font-bold text-blue-900">Receipts List</h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1">Total: {receipts.length} receipt(s)</p>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                      {tableColumns.map((columnName) => (
                        <td key={columnName} className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-700">
                            {getFieldValue(receipt, columnName) || '-'}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handlePrint(receipt)}
                          className="text-orange-600 hover:text-orange-800 transition-colors p-2 hover:bg-orange-50 rounded-lg flex items-center gap-2"
                          title="Print receipt"
                        >
                          <Printer size={18} />
                          <span className="text-sm">Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {receipts.map((receipt) => (
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
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handlePrint(receipt)}
                      className="w-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Printer size={16} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Button - Bottom Right Corner (shown after loading) */}
        {!loading && receipts.length > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => {
                if (receipts.length > 0) {
                  handlePrint(receipts[0]);
                }
              }}
              className="bg-orange-600 text-white px-4 md:px-6 py-3 rounded-lg font-medium shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl flex items-center gap-2"
              title="Print first receipt"
            >
              <Printer size={20} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;

