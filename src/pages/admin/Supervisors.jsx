import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Plus, Trash2, Edit2, Eye, EyeOff, X, AlertCircle, CheckCircle } from 'lucide-react';
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

const Supervisors = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [formData, setFormData] = useState({
    supervisorId: '',
    name: '',
    password: '',
    status: 'active'
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});
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

  // Fetch supervisors from Firestore
  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'supervisors'));
      const supervisorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      showModal('Error', 'Failed to load supervisors. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
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

  // Handle edit supervisor
  const handleEdit = (supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      supervisorId: supervisor.supervisorId,
      name: supervisor.name,
      password: supervisor.password,
      status: supervisor.status || 'active'
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // Handle form submission (both add and edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate inputs
      if (!formData.supervisorId || !formData.name || !formData.password || !formData.status) {
        showModal('Validation Error', 'All fields are required', 'error');
        setSubmitting(false);
        return;
      }

      if (showEditForm && editingSupervisor) {
        // Edit mode - check if supervisor ID is changed and already exists
        if (formData.supervisorId !== editingSupervisor.supervisorId) {
          const existingSupervisor = supervisors.find(
            s => s.supervisorId === formData.supervisorId && s.id !== editingSupervisor.id
          );
          if (existingSupervisor) {
            showModal('Error', 'Supervisor ID already exists', 'error');
            setSubmitting(false);
            return;
          }
        }

        // Update in Firestore
        await updateDoc(doc(db, 'supervisors', editingSupervisor.id), {
          supervisorId: formData.supervisorId,
          name: formData.name,
          password: formData.password,
          status: formData.status,
          updatedAt: new Date().toISOString()
        });

        showModal('Success', 'Supervisor updated successfully!', 'success');
        setFormData({ supervisorId: '', name: '', password: '', status: 'active' });
        setShowEditForm(false);
        setEditingSupervisor(null);
      } else {
        // Add mode - check if supervisor ID already exists
        const existingSupervisor = supervisors.find(
          s => s.supervisorId === formData.supervisorId
        );
        if (existingSupervisor) {
          showModal('Error', 'Supervisor ID already exists', 'error');
          setSubmitting(false);
          return;
        }

        // Add to Firestore
        await addDoc(collection(db, 'supervisors'), {
          supervisorId: formData.supervisorId,
          name: formData.name,
          password: formData.password,
          status: formData.status,
          createdAt: new Date().toISOString()
        });

        showModal('Success', 'Supervisor added successfully!', 'success');
        setFormData({ supervisorId: '', name: '', password: '', status: 'active' });
        setShowAddForm(false);
      }
      
      // Refresh the list
      fetchSupervisors();
    } catch (error) {
      console.error('Error saving supervisor:', error);
      showModal('Error', showEditForm ? 'Failed to update supervisor. Please try again.' : 'Failed to add supervisor. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete supervisor
  const handleDelete = (id, supervisorId) => {
    showModal(
      'Delete Supervisor',
      `Are you sure you want to delete supervisor "${supervisorId}"? This action cannot be undone.`,
      'warning',
      async () => {
        closeModal(); // Close confirmation modal first
        try {
          await deleteDoc(doc(db, 'supervisors', id));
          fetchSupervisors();
          // Show success modal after a brief delay
          setTimeout(() => {
            showModal('Success', 'Supervisor deleted successfully!', 'success');
          }, 100);
        } catch (error) {
          console.error('Error deleting supervisor:', error);
          // Show error modal after a brief delay
          setTimeout(() => {
            showModal('Error', 'Failed to delete supervisor. Please try again.', 'error');
          }, 100);
        }
      },
      'Delete',
      'Cancel'
    );
  };

  // Toggle password visibility
  const togglePasswordVisibility = (supervisorId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [supervisorId]: !prev[supervisorId]
    }));
  };

  // Cancel form
  const handleCancel = () => {
    setFormData({ supervisorId: '', name: '', password: '', status: 'active' });
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingSupervisor(null);
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
                <UserCheck size={24} className="md:w-8 md:h-8 text-blue-600 shrink-0" />
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-blue-900">Supervisors</h1>
                  <p className="text-xs md:text-sm text-slate-600">Manage supervisor accounts</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                handleCancel();
                setShowAddForm(true);
              }}
              className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all hover:bg-blue-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              <span>Add Supervisor</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Add/Edit Supervisor Form */}
        {(showAddForm || showEditForm) && (
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-4">
              {showEditForm ? 'Edit Supervisor' : 'Add New Supervisor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label htmlFor="supervisorId" className="block text-sm font-semibold text-slate-700 mb-2">
                    Supervisor ID *
                  </label>
                  <input
                    type="text"
                    id="supervisorId"
                    name="supervisorId"
                    value={formData.supervisorId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    placeholder="Enter supervisor ID"
                    required
                    disabled={showEditForm}
                  />
                  {showEditForm && (
                    <p className="text-xs text-slate-500 mt-1">Supervisor ID cannot be changed</p>
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
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 bg-white"
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
                  className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {submitting 
                    ? (showEditForm ? 'Updating...' : 'Adding...') 
                    : (showEditForm ? 'Update Supervisor' : 'Add Supervisor')
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

        {/* Supervisors List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-blue-900">Supervisors List</h2>
            <p className="text-sm text-slate-600 mt-1">Total: {supervisors.length} supervisor(s)</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Loading supervisors...</p>
            </div>
          ) : supervisors.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck size={64} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Supervisors Yet</h3>
              <p className="text-slate-500 mb-4">Click "Add Supervisor" to create your first supervisor account</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Supervisor ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Password
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
                    {supervisors.map((supervisor) => (
                      <tr key={supervisor.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-blue-900">{supervisor.supervisorId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-slate-700">{supervisor.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-700 font-mono text-sm">
                              {visiblePasswords[supervisor.id] 
                                ? supervisor.password 
                                : '•'.repeat(8)
                              }
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(supervisor.id)}
                              className="text-slate-500 hover:text-blue-600 transition-colors p-1 hover:bg-slate-100 rounded"
                              title={visiblePasswords[supervisor.id] ? 'Hide password' : 'Show password'}
                            >
                              {visiblePasswords[supervisor.id] ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              (supervisor.status || 'active') === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(supervisor.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-slate-500 text-sm">
                            {supervisor.createdAt 
                              ? new Date(supervisor.createdAt).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(supervisor)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                              title="Edit supervisor"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(supervisor.id, supervisor.supervisorId)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Delete supervisor"
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
                {supervisors.map((supervisor) => (
                  <div key={supervisor.id} className="bg-white border-2 border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Supervisor ID</p>
                        <p className="font-semibold text-blue-900">{supervisor.supervisorId}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                          (supervisor.status || 'active') === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {(supervisor.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                      <p className="text-slate-700">{supervisor.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Password</p>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-mono text-sm">
                          {visiblePasswords[supervisor.id] 
                            ? supervisor.password 
                            : '•'.repeat(8)
                          }
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(supervisor.id)}
                          className="text-slate-500 hover:text-blue-600 transition-colors p-1 hover:bg-slate-100 rounded"
                          title={visiblePasswords[supervisor.id] ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswords[supervisor.id] ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Created At</p>
                      <p className="text-slate-500 text-sm">
                        {supervisor.createdAt 
                          ? new Date(supervisor.createdAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleEdit(supervisor)}
                        className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(supervisor.id, supervisor.supervisorId)}
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

export default Supervisors;
