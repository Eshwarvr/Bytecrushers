import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';
import { 
  Building2, 
  Tag, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter, 
  LogOut, 
  X, 
  AlertTriangle,
  Loader2,
  UserCog,
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Employee' | 'DepartmentHead' | 'AssetManager' | 'Admin';
  status: 'Active' | 'Inactive';
  department_id: string | null;
  department?: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
  head_id: string | null;
  parent_department_id: string | null;
  employee_count: number;
  status: 'Active' | 'Inactive';
  head?: { id: string; name: string } | null;
}

interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
}

interface AssetCategory {
  id: string;
  name: string;
  custom_fields: CustomField[];
}

export default function OrgSetup() {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'employees'>('departments');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Search & Filters (Tab C)
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [empRoleFilter, setEmpRoleFilter] = useState('all');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');

  // Modals Open State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);

  // Edit / Form States
  // Department Form
  const [deptId, setDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptParentId, setDeptParentId] = useState<string>('');
  const [deptHeadId, setDeptHeadId] = useState<string>('');
  const [deptStatus, setDeptStatus] = useState<'Active' | 'Inactive'>('Active');

  // Category Form
  const [catId, setCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Employee Form (Admin edits role/department/status)
  const [empId, setEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState<'Employee' | 'DepartmentHead' | 'AssetManager' | 'Admin'>('Employee');
  const [empDeptId, setEmpDeptId] = useState<string>('');
  const [empStatus, setEmpStatus] = useState<'Active' | 'Inactive'>('Active');

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Verify access via backend /api/me
      const profileRes = await api.get('/api/me');
      setCurrentUser(profileRes.data);

      if (profileRes.data.employee.role !== 'Admin') {
        // Redirection for non-admins
        navigate('/dashboard');
        return;
      }

      // 2. Fetch data from backend
      const [deptsRes, empsRes, catsRes] = await Promise.all([
        api.get('/api/admin/departments'),
        api.get('/api/admin/employees'),
        api.get('/api/admin/categories')
      ]);

      setDepartments(deptsRes.data);
      setEmployees(empsRes.data);
      setCategories(catsRes.data);
    } catch (err: any) {
      console.error('Failed to load Org Setup data:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please log in again.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Defer exit
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  // ================= DEPARTMENTS TAB HANDLERS =================
  const openNewDeptModal = () => {
    setDeptId(null);
    setDeptName('');
    setDeptCode('');
    setDeptParentId('');
    setDeptHeadId('');
    setDeptStatus('Active');
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: Department) => {
    setDeptId(dept.id);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptParentId(dept.parent_department_id || '');
    setDeptHeadId(dept.head_id || '');
    setDeptStatus(dept.status);
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) {
      showNotification('Name and Code are required.', 'error');
      return;
    }

    try {
      const payload = {
        name: deptName,
        code: deptCode,
        parent_department_id: deptParentId || null,
        head_id: deptHeadId || null,
        status: deptStatus
      };

      if (deptId) {
        await api.put(`/api/admin/departments/${deptId}`, payload);
        showNotification('Department updated successfully', 'success');
      } else {
        await api.post('/api/admin/departments', payload);
        showNotification('Department created successfully', 'success');
      }
      setIsDeptModalOpen(false);
      fetchProfileAndData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const toggleDeptStatus = async (dept: Department) => {
    try {
      const newStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/api/admin/departments/${dept.id}`, { status: newStatus });
      showNotification(`Department set to ${newStatus}`, 'success');
      fetchProfileAndData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Status toggle failed', 'error');
    }
  };

  // ================= CATEGORIES TAB HANDLERS =================
  const openNewCatModal = () => {
    setCatId(null);
    setCatName('');
    setCustomFields([]);
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat: AssetCategory) => {
    setCatId(cat.id);
    setCatName(cat.name);
    setCustomFields(cat.custom_fields || []);
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      showNotification('Category Name is required.', 'error');
      return;
    }

    // Filter out fields with empty names
    const fieldsToSave = customFields.filter(f => f.name.trim() !== '');

    try {
      const payload = {
        name: catName,
        custom_fields: fieldsToSave
      };

      if (catId) {
        await api.put(`/api/admin/categories/${catId}`, payload);
        showNotification('Category updated successfully', 'success');
      } else {
        await api.post('/api/admin/categories', payload);
        showNotification('Category created successfully', 'success');
      }
      setIsCatModalOpen(false);
      fetchProfileAndData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      showNotification('Category deleted successfully', 'success');
      fetchProfileAndData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Deletion failed', 'error');
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', type: 'text', required: false }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, key: keyof CustomField, value: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [key]: value };
    setCustomFields(updated);
  };

  // ================= EMPLOYEES TAB HANDLERS =================
  const openEditEmpModal = (emp: Employee) => {
    setEmpId(emp.id);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpRole(emp.role);
    setEmpDeptId(emp.department_id || '');
    setEmpStatus(emp.status);
    setIsEmpModalOpen(true);
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) return;

    try {
      const payload = {
        role: empRole,
        department_id: empDeptId || null,
        status: empStatus
      };

      await api.put(`/api/admin/employees/${empId}`, payload);
      showNotification('Employee records updated successfully', 'success');
      setIsEmpModalOpen(false);
      fetchProfileAndData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Employee update failed', 'error');
    }
  };

  // Employee filtering logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(empSearch.toLowerCase());
    
    const matchesDept = empDeptFilter === 'all' || emp.department_id === empDeptFilter;
    const matchesRole = empRoleFilter === 'all' || emp.role === empRoleFilter;
    const matchesStatus = empStatusFilter === 'all' || emp.status === empStatusFilter;

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-muted-foreground font-outfit">Loading secure admin environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] -z-10"></div>

      {/* HEADER SECTION */}
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-outfit text-white tracking-wider flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded text-xs">ERP</span>
              AssetFlow
            </span>
            <div className="hidden md:block h-4 w-[1px] bg-white/10 mx-2"></div>
            <span className="hidden md:block text-xs font-semibold text-purple-400 font-inter uppercase tracking-wider">
              Administration Center
            </span>
          </div>

          <div className="flex items-center gap-4 font-inter">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{currentUser?.employee?.name || 'Administrator'}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {currentUser?.employee?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 font-inter">
        
        {/* BANNER NOTIFICATIONS */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* HERO TITLE */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Organization Setup</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Establish departments, define schema blueprints for asset categories, and regulate employee ranks.
          </p>
        </div>

        {/* GLASS TABS MENU */}
        <div className="flex border-b border-white/10 mb-8 p-1 bg-white/5 rounded-xl max-w-lg">
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === 'departments' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Departments
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            Asset Categories
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === 'employees' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Employee Registry
          </button>
        </div>

        {/* TAB CORE VIEWPORT */}
        <div className="glass-card rounded-2xl p-6 relative">
          
          {/* TAB A: DEPARTMENTS VIEW */}
          {activeTab === 'departments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold font-outfit text-white">Department Structures</h3>
                  <p className="text-xs text-muted-foreground">Manage hierarchy, designate heads, and toggle active states</p>
                </div>
                <button
                  onClick={openNewDeptModal}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Department
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <th className="py-4 px-4">Code</th>
                      <th className="py-4 px-4">Name</th>
                      <th className="py-4 px-4">Head of Dept</th>
                      <th className="py-4 px-4">Parent Dept</th>
                      <th className="py-4 px-4 text-center">Employees</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                          No departments defined. Click "Create Department" to set the first up.
                        </td>
                      </tr>
                    ) : (
                      departments.map(dept => {
                        const parent = departments.find(d => d.id === dept.parent_department_id);
                        return (
                          <tr key={dept.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 font-mono text-xs text-purple-400 font-semibold">{dept.code}</td>
                            <td className="py-4 px-4 font-semibold text-white">{dept.name}</td>
                            <td className="py-4 px-4">
                              {dept.head ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20 font-medium">
                                  {dept.head.name}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-400">
                              {parent ? parent.name : <span className="text-slate-500">—</span>}
                            </td>
                            <td className="py-4 px-4 text-center font-semibold text-white">{dept.employee_count}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                dept.status === 'Active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {dept.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditDeptModal(dept)}
                                  className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleDeptStatus(dept)}
                                  className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                                  title={dept.status === 'Active' ? 'Deactivate' : 'Activate'}
                                >
                                  {dept.status === 'Active' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB B: ASSET CATEGORIES VIEW */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold font-outfit text-white">Asset Category Blueprints</h3>
                  <p className="text-xs text-muted-foreground">Construct JSON schemas for tracking category-specific attributes</p>
                </div>
                <button
                  onClick={openNewCatModal}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                    No asset categories defined. Click "Create Category" to set the first up.
                  </div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-purple-500/35 transition-all group">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-white tracking-wide">{cat.name}</h4>
                          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditCatModal(cat)}
                              className="p-1 text-slate-400 hover:text-white bg-white/5 rounded border border-white/15 hover:bg-white/15 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 bg-white/5 rounded border border-white/15 hover:bg-white/15 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                            Custom Fields ({cat.custom_fields?.length || 0})
                          </span>
                          {(!cat.custom_fields || cat.custom_fields.length === 0) ? (
                            <span className="text-xs text-slate-500 italic">No custom fields defined</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.custom_fields.map((field, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono font-medium"
                                  title={`Type: ${field.type}${field.required ? ' (Required)' : ''}`}
                                >
                                  {field.name}
                                  <span className="text-[10px] text-purple-400 font-normal">({field.type[0]})</span>
                                  {field.required && <span className="text-rose-400 text-xs font-bold font-sans">*</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB C: EMPLOYEE DIRECTORY */}
          {activeTab === 'employees' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold font-outfit text-white">Employee Registry</h3>
                  <p className="text-xs text-muted-foreground">List staff and promote users to managerial roles</p>
                </div>
              </div>

              {/* SEARCH & FILTERS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10 font-inter">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium"
                  />
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={empDeptFilter}
                    onChange={(e) => setEmpDeptFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium appearance-none cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <UserCog className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={empRoleFilter}
                    onChange={(e) => setEmpRoleFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium appearance-none cursor-pointer"
                  >
                    <option value="all">All Ranks / Roles</option>
                    <option value="Employee">Employee</option>
                    <option value="DepartmentHead">Department Head</option>
                    <option value="AssetManager">Asset Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={empStatusFilter}
                    onChange={(e) => setEmpStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-xs font-medium appearance-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {/* DIRECTORY TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <th className="py-4 px-4">Name</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Department</th>
                      <th className="py-4 px-4">Rank / Role</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-right">Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                          No employees match the search queries.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-semibold text-white">{emp.name}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-xs">{emp.email}</td>
                          <td className="py-4 px-4">
                            {emp.department ? (
                              <span className="text-xs text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded font-medium">
                                {emp.department.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-xs">Unassigned</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${
                              emp.role === 'Admin' 
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                                : emp.role === 'AssetManager' 
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                                : emp.role === 'DepartmentHead'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-white/10'
                            }`}>
                              {emp.role === 'DepartmentHead' ? 'Dept Head' : emp.role === 'AssetManager' ? 'Asset Manager' : emp.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              emp.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => openEditEmpModal(emp)}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-purple-400 flex items-center gap-1.5 transition-all ml-auto cursor-pointer"
                            >
                              <UserCog className="w-3.5 h-3.5" />
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL DIALOGS ================= */}

      {/* 1. DEPARTMENT SETUP MODAL */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-2xl relative overflow-hidden font-inter">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit text-white">
                {deptId ? 'Edit Department details' : 'Create New Department'}
              </h3>
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unique Code</label>
                <input
                  type="text"
                  placeholder="e.g. ENG"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parent Department</label>
                <select
                  value={deptParentId}
                  onChange={(e) => setDeptParentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer"
                >
                  <option value="">No Parent (Root Department)</option>
                  {departments
                    .filter(d => d.id !== deptId) // Avoid circular loops
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department Head</label>
                <select
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {employees
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operation Status</label>
                <select
                  value={deptStatus}
                  onChange={(e) => setDeptStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/15 cursor-pointer"
                >
                  {deptId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ASSET CATEGORY SCHEMA SETUP MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-2xl relative overflow-hidden font-inter">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit text-white">
                {catId ? 'Edit Asset Category Details' : 'Create New Asset Category'}
              </h3>
              <button 
                onClick={() => setIsCatModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCatSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Laptops"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Schema Fields</label>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <div className="space-y-3">
                  {customFields.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2 text-center border border-dashed border-white/10 rounded-xl">
                      No custom fields added. Standard items will map globally.
                    </p>
                  ) : (
                    customFields.map((field, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white/5 p-3 rounded-xl border border-white/10">
                        <input
                          type="text"
                          placeholder="Field name (e.g. Warranty Months)"
                          value={field.name}
                          onChange={(e) => updateCustomField(idx, 'name', e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg glass-input text-xs"
                          required
                        />

                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(idx, 'type', e.target.value as any)}
                          className="px-3 py-1.5 rounded-lg glass-input text-xs cursor-pointer"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Checkbox</option>
                        </select>

                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateCustomField(idx, 'required', e.target.checked)}
                            className="rounded border-white/15 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-transparent"
                          />
                          Req
                        </label>

                        <button
                          type="button"
                          onClick={() => removeCustomField(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/15 cursor-pointer"
                >
                  {catId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EMPLOYEE MANAGEMENT MODAL (PROMOTIONS & DEP TRANSFERS) */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-2xl relative overflow-hidden font-inter">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold font-outfit text-white">Manage Employee Profile</h3>
              <button 
                onClick={() => setIsEmpModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmpSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Employee Name</span>
                <p className="text-sm font-bold text-white mt-1">{empName}</p>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-2 block">Email Address</span>
                <p className="text-xs text-slate-400 font-mono mt-1">{empEmail}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Promote / Set Role Rank
                </label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer"
                >
                  <option value="Employee">Employee (Base Access)</option>
                  <option value="DepartmentHead">Department Head (Manager)</option>
                  <option value="AssetManager">Asset Manager (Procurements)</option>
                  <option value="Admin">System Administrator</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">
                  * Note: Department Head triggers will automatically grant department ownership capabilities.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department Assignment</label>
                <select
                  value={empDeptId}
                  onChange={(e) => setEmpDeptId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer"
                >
                  <option value="">No Department Assigned</option>
                  {departments
                    .filter(d => d.status === 'Active')
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Employment Status</label>
                <select
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Deactivated (Blocks Login Sessions)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/15 cursor-pointer"
                >
                  Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
