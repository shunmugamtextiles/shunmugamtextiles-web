import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Trash2, Edit2, X, AlertCircle, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

// Modal Component for Confirmations and Messages
const Modal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
      // Don't auto-close here - let the handler manage modal lifecycle
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mb-6">
          <div className="flex items-start gap-3">
            {type === 'success' && (
              <CheckCircle size={24} className="text-green-600 shrink-0 mt-0.5" />
            )}
            {type === 'error' && (
              <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
            )}
            {type === 'warning' && (
              <AlertCircle size={24} className="text-yellow-600 shrink-0 mt-0.5" />
            )}
            <p className="text-slate-700">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          {onConfirm && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-medium transition-all hover:bg-slate-50"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  type === 'error' || type === 'warning'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confirmText}
              </button>
            </>
          )}
          {!onConfirm && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all hover:bg-blue-700 w-full"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    status: 'in stock'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ensure stable ordering by serialNo (ascending), fallback to createdAt, then name
      productsList.sort((a, b) => {
        const aSerial = Number(a.serialNo);
        const bSerial = Number(b.serialNo);
        if (!Number.isNaN(aSerial) && !Number.isNaN(bSerial)) return aSerial - bSerial;
        if (!Number.isNaN(aSerial)) return -1;
        if (!Number.isNaN(bSerial)) return 1;
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aDate !== bDate) return aDate - bDate;
        return (a.name || '').localeCompare(b.name || '');
      });

      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
      showModal('Error', 'Failed to load products. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getNextSerialNo = () => {
    if (!products || products.length === 0) return 1;
    const maxSerial = products.reduce((max, p) => {
      const val = Number(p.serialNo);
      if (Number.isNaN(val)) return max;
      return Math.max(max, val);
    }, 0);
    return maxSerial + 1;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showModal('Error', 'Please select a valid image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showModal('Error', 'Image size should be less than 5MB', 'error');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Cloudinary
  const handleImageUpload = async () => {
    if (!imageFile) {
      return formData.imageUrl; // Return existing URL if no new file
    }

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToCloudinary(imageFile);
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Show modal helper
  const showModal = (title, message, type = 'info', onConfirm = null, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  // Close modal helper
  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      onConfirm: null,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
  };

  // Handle edit product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      imageUrl: product.imageUrl || '',
      status: product.status || 'in stock',
      serialNo: product.serialNo
    });
    setImagePreview(product.imageUrl || '');
    setImageFile(null);
    setShowEditForm(true);
    setShowAddForm(false);
    // Scroll to the form when editing is triggered
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);
  };

  // Handle form submission (both add and edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate inputs
      if (!formData.name || !formData.status) {
        showModal('Validation Error', 'Product name and status are required', 'error');
        setSubmitting(false);
        return;
      }

      // Upload image if a new file is selected
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        try {
          finalImageUrl = await handleImageUpload();
        } catch (error) {
          showModal('Error', error.message, 'error');
          setSubmitting(false);
          return;
        }
      }

      // Validate image URL exists
      if (!finalImageUrl) {
        showModal('Validation Error', 'Product image is required', 'error');
        setSubmitting(false);
        return;
      }

      if (showEditForm && editingProduct) {
        // Edit mode - check if product name is changed and already exists
        if (formData.name !== editingProduct.name) {
          const existingProduct = products.find(
            p => p.name.toLowerCase() === formData.name.toLowerCase() && p.id !== editingProduct.id
          );
          if (existingProduct) {
            showModal('Error', 'Product with this name already exists', 'error');
            setSubmitting(false);
            return;
          }
        }

        // Update in Firestore (serialNo stays unchanged)
        await updateDoc(doc(db, 'products', editingProduct.id), {
          name: formData.name,
          imageUrl: finalImageUrl,
          status: formData.status,
          serialNo: editingProduct.serialNo,
          updatedAt: new Date().toISOString()
        });

        showModal('Success', 'Product updated successfully!', 'success');
        resetForm();
      } else {
        // Add mode - check if product name already exists
        const existingProduct = products.find(
          p => p.name.toLowerCase() === formData.name.toLowerCase()
        );
        if (existingProduct) {
          showModal('Error', 'Product with this name already exists', 'error');
          setSubmitting(false);
          return;
        }

        // Add to Firestore with serialNo
        const serialNo = getNextSerialNo();
        await addDoc(collection(db, 'products'), {
          name: formData.name,
          imageUrl: finalImageUrl,
          status: formData.status,
          serialNo,
          createdAt: new Date().toISOString()
        });

        showModal('Success', 'Product added successfully!', 'success');
        resetForm();
      }
      
      // Refresh the list
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showModal('Error', showEditForm ? 'Failed to update product. Please try again.' : 'Failed to add product. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete product
  const handleDelete = (id, productName) => {
    showModal(
      'Delete Product',
      `Are you sure you want to delete product "${productName}"? This action cannot be undone.`,
      'warning',
      async () => {
        closeModal(); // Close confirmation modal first
        try {
          await deleteDoc(doc(db, 'products', id));
          fetchProducts();
          // Show success modal after a brief delay
          setTimeout(() => {
            showModal('Success', 'Product deleted successfully!', 'success');
          }, 100);
        } catch (error) {
          console.error('Error deleting product:', error);
          // Show error modal after a brief delay
          setTimeout(() => {
            showModal('Error', 'Failed to delete product. Please try again.', 'error');
          }, 100);
        }
      },
      'Delete',
      'Cancel'
    );
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', imageUrl: '', status: 'in stock', serialNo: undefined });
    setImageFile(null);
    setImagePreview('');
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingProduct(null);
  };

  // Cancel form
  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm || null}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />

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
                <Package size={24} className="md:w-8 md:h-8 text-purple-600 shrink-0" />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-blue-900">Products</h1>
                  <p className="text-xs md:text-sm text-slate-600">Manage product catalog</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                handleCancel();
                setShowAddForm(true);
              }}
              className="bg-purple-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all hover:bg-purple-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Add/Edit Product Form */}
        {(showAddForm || showEditForm) && (
          <div
            ref={formRef}
            className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6"
          >
            <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-4">
              {showEditForm ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10"
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    S.NO (auto)
                  </label>
                  <input
                    type="text"
                    value={
                      showEditForm && editingProduct
                        ? editingProduct.serialNo ?? ''
                        : formData.serialNo ?? ''
                    }
                    readOnly
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                    placeholder={showEditForm ? 'N/A' : 'Will be assigned'}
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 bg-white"
                    required
                  >
                    <option value="in stock">In Stock</option>
                    <option value="out of stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Product Image *
                </label>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-full max-w-xs">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-slate-200"
                      />
                      {imageFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(editingProduct?.imageUrl || '');
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Image Upload Input */}
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="image-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          {imagePreview ? 'Change Image' : 'Upload Image'}
                        </>
                      )}
                    </label>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {!imagePreview && (
                      <p className="text-sm text-slate-500">
                        Select an image file (max 5MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="bg-purple-600 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {submitting 
                    ? (showEditForm ? 'Updating...' : 'Adding...') 
                    : (showEditForm ? 'Update Product' : 'Add Product')
                  }
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-200 text-slate-700 px-4 md:px-6 py-2 rounded-lg font-medium transition-all hover:bg-slate-300 text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-blue-900">Products List</h2>
            <p className="text-sm text-slate-600 mt-1">Total: {products.length} product(s)</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-slate-600 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Products Yet</h3>
              <p className="text-slate-500 mb-4">Click "Add Product" to create your first product</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        S.NO
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products.map((product, index) => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="24"%3E%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                              <ImageIcon size={24} className="text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-purple-900">{product.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              (product.status || 'in stock') === 'in stock'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(product.status || 'in stock') === 'in stock' ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-slate-500 text-sm">
                            {product.createdAt 
                              ? new Date(product.createdAt).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-purple-600 hover:text-purple-800 transition-colors p-2 hover:bg-purple-50 rounded-lg"
                              title="Edit product"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Delete product"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-white border-2 border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23e2e8f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="24"%3E%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                          <ImageIcon size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                          S.NO: <span className="font-semibold text-slate-700">{index + 1}</span>
                        </p>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Product Name</p>
                        <p className="font-semibold text-purple-900 truncate">{product.name}</p>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-2 ${
                            (product.status || 'in stock') === 'in stock'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(product.status || 'in stock') === 'in stock' ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created At</p>
                      <p className="text-slate-500 text-sm">
                        {product.createdAt 
                          ? new Date(product.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminProducts;
