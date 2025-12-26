import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Trash2, Edit2, X, AlertCircle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${type === 'error' || type === 'warning'
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

const Weavers = () => {
    const [weavers, setWeavers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingWeaver, setEditingWeaver] = useState(null);
    const [formData, setFormData] = useState({
        weaverId: '',
        name: '',
        status: 'active'
    });
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
    const [sortConfig, setSortConfig] = useState({
        key: 'weaverId',
        direction: 'desc'
    });

    // Fetch weavers from Firestore
    const fetchWeavers = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'weavers'));
            const weaversList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWeavers(weaversList);
        } catch (error) {
            console.error('Error fetching weavers:', error);
            showModal('Error', 'Failed to load weavers. Please refresh the page.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeavers();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    // Handle edit weaver
    const handleEdit = (weaver) => {
        setEditingWeaver(weaver);
        setFormData({
            weaverId: weaver.weaverId,
            name: weaver.name,
            status: weaver.status || 'active'
        });
        setShowEditForm(true);
        setShowAddForm(false);
    };

    // Validate weaver ID format (1, 2, 3, etc. - numbers only)
    const validateWeaverId = (id) => {
        const pattern = /^\d+$/;
        return pattern.test(id);
    };

    // Handle form submission (both add and edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate inputs
            if (!formData.weaverId || !formData.name || !formData.status) {
                showModal('Validation Error', 'All fields are required', 'error');
                setSubmitting(false);
                return;
            }

            // Validate weaver ID format
            if (!validateWeaverId(formData.weaverId)) {
                showModal('Validation Error', 'Weaver ID must be a number (e.g., 1, 2, 3, etc.)', 'error');
                setSubmitting(false);
                return;
            }

            if (showEditForm && editingWeaver) {
                // Edit mode - check if weaver ID is changed and already exists
                if (formData.weaverId !== editingWeaver.weaverId) {
                    const existingWeaver = weavers.find(
                        w => w.weaverId === formData.weaverId && w.id !== editingWeaver.id
                    );
                    if (existingWeaver) {
                        showModal('Error', 'Weaver ID already exists', 'error');
                        setSubmitting(false);
                        return;
                    }
                }

                // Update in Firestore
                await updateDoc(doc(db, 'weavers', editingWeaver.id), {
                    weaverId: formData.weaverId,
                    name: formData.name,
                    status: formData.status,
                    updatedAt: new Date().toISOString()
                });

                showModal('Success', 'Weaver updated successfully!', 'success');
                setFormData({ weaverId: '', name: '', status: 'active' });
                setShowEditForm(false);
                setEditingWeaver(null);
            } else {
                // Add mode - check if weaver ID already exists
                const existingWeaver = weavers.find(
                    w => w.weaverId === formData.weaverId
                );
                if (existingWeaver) {
                    showModal('Error', 'Weaver ID already exists', 'error');
                    setSubmitting(false);
                    return;
                }

                // Add to Firestore
                await addDoc(collection(db, 'weavers'), {
                    weaverId: formData.weaverId,
                    name: formData.name,
                    status: formData.status,
                    createdAt: new Date().toISOString()
                });

                showModal('Success', 'Weaver added successfully!', 'success');
                setFormData({ weaverId: '', name: '', status: 'active' });
                setShowAddForm(false);
            }

            // Refresh the list
            fetchWeavers();
        } catch (error) {
            console.error('Error saving weaver:', error);
            showModal('Error', showEditForm ? 'Failed to update weaver. Please try again.' : 'Failed to add weaver. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete weaver
    const handleDelete = (id, weaverId) => {
        showModal(
            'Delete Weaver',
            `Are you sure you want to delete weaver "${weaverId}"? This action cannot be undone.`,
            'warning',
            async () => {
                closeModal(); // Close confirmation modal first
                try {
                    await deleteDoc(doc(db, 'weavers', id));
                    fetchWeavers();
                    // Show success modal after a brief delay
                    setTimeout(() => {
                        showModal('Success', 'Weaver deleted successfully!', 'success');
                    }, 100);
                } catch (error) {
                    console.error('Error deleting weaver:', error);
                    // Show error modal after a brief delay
                    setTimeout(() => {
                        showModal('Error', 'Failed to delete weaver. Please try again.', 'error');
                    }, 100);
                }
            },
            'Delete',
            'Cancel'
        );
    };

    // Cancel form
    const handleCancel = () => {
        setFormData({ weaverId: '', name: '', status: 'active' });
        setShowAddForm(false);
        setShowEditForm(false);
        setEditingWeaver(null);
    };

    const getSortValue = (weaver, key) => {
        if (key === 'weaverId') {
            const num = Number(weaver.weaverId);
            if (!Number.isNaN(num)) return num;
            return (weaver.weaverId || '').toString().toLowerCase();
        }
        return (weaver[key] || '').toString().toLowerCase();
    };

    const sortedWeavers = [...weavers].sort((a, b) => {
        const va = getSortValue(a, sortConfig.key);
        const vb = getSortValue(b, sortConfig.key);

        if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key, direction) => {
        setSortConfig({ key, direction });
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
                                <Users size={24} className="md:w-8 md:h-8 text-green-600 shrink-0" />
                                <div>
                                    <h1 className="text-lg md:text-2xl font-bold text-blue-900">Weavers</h1>
                                    <p className="text-xs md:text-sm text-slate-600">Manage weaver information</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                handleCancel();
                                setShowAddForm(true);
                            }}
                            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all hover:bg-green-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
                        >
                            <Plus size={18} className="md:w-5 md:h-5" />
                            <span>Add Weaver</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
                {/* Add/Edit Weaver Form */}
                {(showAddForm || showEditForm) && (
                    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
                        <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-4">
                            {showEditForm ? 'Edit Weaver' : 'Add New Weaver'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div>
                                    <label htmlFor="weaverId" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Weaver ID *
                                    </label>
                                    <input
                                        type="text"
                                        id="weaverId"
                                        name="weaverId"
                                        value={formData.weaverId}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-600/10 ${formData.weaverId && !validateWeaverId(formData.weaverId)
                                                ? 'border-red-300 focus:border-red-600'
                                                : 'border-slate-200 focus:border-green-600'
                                            }`}
                                        placeholder="Enter weaver ID (e.g., 1, 2, 3)"
                                        required
                                        disabled={showEditForm}
                                    />
                                    {showEditForm && (
                                        <p className="text-xs text-slate-500 mt-1">Weaver ID cannot be changed</p>
                                    )}
                                    {formData.weaverId && !validateWeaverId(formData.weaverId) && (
                                        <p className="text-xs text-red-600 mt-1">Weaver ID must be a number (e.g., 1, 2, 3)</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10"
                                        placeholder="Enter name"
                                        required
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
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 bg-white"
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-green-600 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                                >
                                    {submitting
                                        ? (showEditForm ? 'Updating...' : 'Adding...')
                                        : (showEditForm ? 'Update Weaver' : 'Add Weaver')
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

                {/* Weavers List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-blue-900">Weavers List</h2>
                        <p className="text-sm text-slate-600 mt-1">Total: {weavers.length} weaver(s)</p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                            <p className="text-slate-600 mt-4">Loading weavers...</p>
                        </div>
                    ) : weavers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users size={64} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Weavers Yet</h3>
                            <p className="text-slate-500 mb-4">Click "Add Weaver" to create your first weaver account</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-1">
                                                    <span>Weaver ID</span>
                                                    <span className="flex flex-col -space-y-1 ml-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSort('weaverId', 'asc')}
                                                            className={`p-0.5 hover:text-blue-900 ${sortConfig.key === 'weaverId' && sortConfig.direction === 'asc'
                                                                ? 'text-blue-900'
                                                                : 'text-slate-400'
                                                                }`}
                                                        >
                                                            <ArrowUp size={10} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSort('weaverId', 'desc')}
                                                            className={`p-0.5 hover:text-blue-900 ${sortConfig.key === 'weaverId' && sortConfig.direction === 'desc'
                                                                ? 'text-blue-900'
                                                                : 'text-slate-400'
                                                                }`}
                                                        >
                                                            <ArrowDown size={10} />
                                                        </button>
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                Name
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
                                        {sortedWeavers.map((weaver) => (
                                            <tr key={weaver.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium text-green-900">{weaver.weaverId}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-slate-700">{weaver.name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${(weaver.status || 'active') === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {(weaver.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-slate-500 text-sm">
                                                        {weaver.createdAt
                                                            ? new Date(weaver.createdAt).toLocaleDateString()
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(weaver)}
                                                            className="text-green-600 hover:text-green-800 transition-colors p-2 hover:bg-green-50 rounded-lg"
                                                            title="Edit weaver"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(weaver.id, weaver.weaverId)}
                                                            className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                            title="Delete weaver"
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
                                {sortedWeavers.map((weaver) => (
                                    <div key={weaver.id} className="bg-white border-2 border-slate-200 rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Weaver ID</p>
                                                <p className="font-semibold text-green-900">{weaver.weaverId}</p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${(weaver.status || 'active') === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {(weaver.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                                            <p className="text-slate-700">{weaver.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created At</p>
                                            <p className="text-slate-500 text-sm">
                                                {weaver.createdAt
                                                    ? new Date(weaver.createdAt).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                                            <button
                                                onClick={() => handleEdit(weaver)}
                                                className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 transition-colors py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={16} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(weaver.id, weaver.weaverId)}
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

export default Weavers;
