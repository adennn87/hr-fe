'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Laptop, Plus, Search, Filter, MoreHorizontal,
  Trash2, Pencil, CheckCircle2, XCircle,
  ArrowRightLeft, History, Loader2, User,
  Calendar, FileText, Tag, Hash
} from 'lucide-react';
import { assetService, Asset, AllocatedAsset } from '@/services/asset.service';
import { employeeService, Employee } from '@/services/employee.service';
import { usePermissions } from '@/lib/use-permissions';
import { toast } from 'sonner';

export default function AssetManagementPage() {
  const { hasPermission, isAdmin } = usePermissions();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inventory' | 'allocations'>('allocations');
  const [isLoading, setIsLoading] = useState(true);
  const [allocatedAssets, setAllocatedAssets] = useState<any[]>([]);
  const [inventoryAssets, setInventoryAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAssetToAllocate, setSelectedAssetToAllocate] = useState<Asset | null>(null);

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'Laptop',
    serialNumber: '',
    assetCode: '',
    brand: '',
    model: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    status: 'AVAILABLE',
    note: '',
  });

  const [allocationForm, setAllocationForm] = useState({
    userId: '',
    allocatedDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  // Utility to open modal for editing
  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      category: asset.category,
      serialNumber: asset.serialNumber,
      assetCode: asset.assetCode,
      brand: asset.brand,
      model: asset.model,
      purchaseDate: asset.purchaseDate.split('T')[0],
      purchasePrice: Number(asset.purchasePrice),
      status: asset.status.toUpperCase(),
      note: asset.note || '',
    });
    setIsModalOpen(true);
  };

  // Permission checks
  const canViewAllocations = isAdmin || hasPermission('ASSET_VIEW');
  const canViewInventory = isAdmin || hasPermission('ASSET_VIEW');
  const canCreateAsset = isAdmin || hasPermission('ASSET_CREATE');
  const canAllocate = isAdmin || hasPermission('ASSET_ALLOCATE_CREATE');

  // Redirect if not admin and lacks ASSET_VIEW permission
  // Redirect if not authorized
  useEffect(() => {
    const isAuthorized = isAdmin || hasPermission('ASSET_VIEW') || hasPermission('ASSET_ALLOCATE_VIEW');
    if (!isAuthorized) {
      router.replace('/dashboard');
    }
  }, [isAdmin, hasPermission, router]);

  // Set initial tab based on permissions
  useEffect(() => {
    if (!canViewAllocations && canViewInventory) {
      setActiveTab('inventory');
    } else if (canViewAllocations && !canViewInventory) {
      setActiveTab('allocations');
    }
  }, [canViewAllocations, canViewInventory]);

  useEffect(() => {
    if (canViewAllocations || canViewInventory) {
      if (activeTab === 'allocations') {
        fetchAllocatedAssets();
      } else {
        fetchInventoryAssets();
      }
    }
  }, [activeTab, canViewAllocations, canViewInventory, statusFilter]);

  const fetchAllocatedAssets = async () => {
    setIsLoading(true);
    try {
      const data = await assetService.getAllocatedAssets(statusFilter);
      setAllocatedAssets(data);
    } catch (error: any) {
      toast.error('Cannot load allocation list', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventoryAssets = async () => {
    setIsLoading(true);
    try {
      const data = await assetService.getInventoryAssets();
      setInventoryAssets(data);
    } catch (error: any) {
      toast.error('Cannot load asset inventory', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...assetForm,
        purchasePrice: Number(assetForm.purchasePrice)
      };

      if (editingAsset) {
        await assetService.updateAsset(editingAsset.id, payload);
        toast.success('Asset updated successfully');
      } else {
        await assetService.createAsset(payload);
        toast.success('Asset created successfully');
      }

      setIsModalOpen(false);
      setEditingAsset(null);
      setAssetForm({
        name: '',
        category: 'Laptop',
        serialNumber: '',
        assetCode: '',
        brand: '',
        model: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        status: 'AVAILABLE',
        note: '',
      });
      activeTab === 'allocations' ? fetchAllocatedAssets() : fetchInventoryAssets();
    } catch (error: any) {
      toast.error(editingAsset ? 'Error updating asset' : 'Error creating asset', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (error: any) {
      toast.error('Cannot load employee list');
    }
  };

  const openAllocateModal = (asset: Asset) => {
    setSelectedAssetToAllocate(asset);
    setAllocationForm({
      userId: '',
      allocatedDate: new Date().toISOString().split('T')[0],
      note: `Hand over asset ${asset.name} to employee for use`,
    });
    fetchEmployees();
    setIsAllocateModalOpen(true);
  };

  const handleAllocateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetToAllocate) return;

    setIsSubmitting(true);
    try {
      await assetService.allocateAsset({
        ...allocationForm,
        assetId: selectedAssetToAllocate.id,
      });
      toast.success('Asset allocated successfully');
      setIsAllocateModalOpen(false);
      fetchInventoryAssets();
    } catch (error: any) {
      toast.error('Error allocating asset', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnAsset = async (allocationId: string) => {
    if (!window.confirm('Are you sure you want to return this asset?')) return;

    setIsLoading(true);
    try {
      await assetService.returnAsset(allocationId);
      toast.success('Asset returned successfully');
      fetchAllocatedAssets();
    } catch (error: any) {
      toast.error('Error returning asset', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin && !hasPermission('ASSET_VIEW')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <Laptop className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Asset Management</h2>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
              Inventory & equipment allocation management system
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets, employees..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canCreateAsset && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {canViewAllocations && (
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'allocations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Allocated
          </button>
        )}
        {canViewInventory && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Asset Inventory
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading data...</p>
          </div>
        ) : activeTab === 'allocations' ? (
          <div className="grid gap-6">
            {allocatedAssets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No allocation data</h3>
                <p className="text-slate-500 mt-2">Start allocating assets to employees.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Allocation Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allocatedAssets.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                              {item.user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{item.user?.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{item.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <Laptop className="w-3.5 h-3.5 text-slate-400" />
                              {item.asset?.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{item.asset?.assetCode} • {item.asset?.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {item.allocatedDate ? new Intl.DateTimeFormat('vi-VN').format(new Date(item.allocatedDate)) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${item.status === 'allocated' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                            {item.status === 'allocated' ? 'Allocated' : 'Returned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                              <History className="w-4 h-4" />
                            </button>
                            {hasPermission('ASSET_ALLOCATE_UPDATE') && item.status === 'allocated' && (
                              <button
                                onClick={() => handleReturnAsset(item.id)}
                                title="Return asset"
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-amber-600 transition-all"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {inventoryAssets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Asset inventory is empty</h3>
                <p className="text-slate-500 mt-2">No assets in inventory.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Info</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Price</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventoryAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                              <Laptop className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{asset.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{asset.assetCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-600">
                            {asset.brand} • {asset.model}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">SN: {asset.serialNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(asset.purchasePrice))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${asset.status.toLowerCase() === 'available'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : asset.status.toLowerCase() === 'allocated'
                              ? 'bg-green-50 text-green-600 border border-green-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                            {asset.status.toLowerCase() === 'available' ? 'Available' : asset.status.toLowerCase() === 'allocated' ? 'Allocated' : asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {canAllocate && asset.status.toLowerCase() === 'available' && (
                              <button
                                onClick={() => openAllocateModal(asset)}
                                title="Allocate"
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-green-600 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission('ASSET_UPDATE') && (
                              <button
                                onClick={() => openEditModal(asset)}
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {hasPermission('ASSET_DELETE') && (
                              <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-red-600 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{editingAsset ? 'Update Asset' : 'Add New Asset'}</h3>
                  <p className="text-slate-500 text-xs font-medium">{editingAsset ? 'Edit equipment info' : 'Enter equipment details'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAsset(null);
                  setAssetForm({
                    name: '',
                    category: 'Laptop',
                    serialNumber: '',
                    assetCode: '',
                    brand: '',
                    model: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    purchasePrice: 0,
                    status: 'AVAILABLE',
                    note: '',
                  });
                }}
                className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitAsset} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Asset Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Dell Latitude 5440 Laptop"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.name}
                    onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.category}
                    onChange={e => setAssetForm({ ...assetForm, category: e.target.value })}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="PC">PC</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Keyboard">Keyboard</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Serial Number</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: DL5440SN001"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.serialNumber}
                    onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Asset Code</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: TS0001"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.assetCode}
                    onChange={e => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Brand</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Dell"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.brand}
                    onChange={e => setAssetForm({ ...assetForm, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Model</label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Latitude 5440"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.model}
                    onChange={e => setAssetForm({ ...assetForm, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Purchase Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.purchaseDate}
                    onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Purchase Price (VND)</label>
                  <input
                    type="number"
                    placeholder="VD: 25000000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    value={assetForm.purchasePrice}
                    onChange={e => setAssetForm({ ...assetForm, purchasePrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium resize-none"
                  value={assetForm.note}
                  onChange={e => setAssetForm({ ...assetForm, note: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAsset ? 'Update' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Allocate Asset Modal */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Allocate Asset</h3>
                  <p className="text-slate-500 text-xs font-medium">{selectedAssetToAllocate?.name}</p>
                </div>
              </div>
              <button onClick={() => setIsAllocateModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAllocateAsset} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Receiving Employee</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  value={allocationForm.userId}
                  onChange={e => setAllocationForm({ ...allocationForm, userId: e.target.value })}
                >
                  <option value="">Select employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.position || 'N/A'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Allocation Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  value={allocationForm.allocatedDate}
                  onChange={e => setAllocationForm({ ...allocationForm, allocatedDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Allocation Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium resize-none"
                  value={allocationForm.note}
                  onChange={e => setAllocationForm({ ...allocationForm, note: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !allocationForm.userId}
                  className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Allocate Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
