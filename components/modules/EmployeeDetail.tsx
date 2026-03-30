"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff, Lock, Mail, Phone, MapPin, Calendar, CreditCard, Briefcase, Building2, User, Edit, Save } from 'lucide-react';
import { employeeService, type Employee } from '@/services/employee.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmployeeDetailProps {
  employeeId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function EmployeeDetail({ employeeId, onClose, onUpdate }: EmployeeDetailProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    setIsLoading(true);
    try {
      const data = await employeeService.getEmployeeById(employeeId);
      setEmployee(data);
      setFormData(data);
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      toast.error('Cannot load employee information', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!employee) return;

    try {
      await employeeService.updateEmployee(employeeId, formData);
      toast.success('Information updated successfully');
      setIsEditing(false);
      await fetchEmployee(); // Refresh data
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error('Cannot update information', {
        description: error.message || 'Please try again later',
      });
    }
  };

  const maskData = (data: string | undefined) => {
    if (!data) return 'N/A';
    if (showSensitiveData) return data;
    return "••••••••" + data.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-4 text-slate-500 text-center">Loading information...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <p className="text-slate-900 font-bold mb-4">Employee not found</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? formData : employee;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl font-black text-purple-600">
              {employee.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{employee.fullName}</h2>
              <p className="text-slate-500 text-sm font-medium">{employee.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-purple-600 transition-colors"
              title={showSensitiveData ? 'Hide sensitive information' : 'Show sensitive information'}
            >
              {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(employee);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Full Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-11"
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900">{employee.fullName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11"
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900">{employee.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone Number
                  {!showSensitiveData && <Lock className="w-3 h-3 text-amber-500" />}
                </Label>
                {isEditing ? (
                    <Input
                      value={formData.phoneNumber || ''}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="h-11"
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-900">{maskData(employee.phoneNumber ?? undefined)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Gender</Label>
                {isEditing ? (
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-base font-bold text-slate-900">{employee.gender || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date of Birth
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="h-11"
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900">
                    {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-US') : 'N/A'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  CCCD/ID Number
                  {!showSensitiveData && <Lock className="w-3 h-3 text-amber-500" />}
                </Label>
                {isEditing ? (
                    <Input
                      value={formData.citizen_Id || ''}
                      onChange={(e) => setFormData({ ...formData, citizen_Id: e.target.value })}
                      className="h-11"
                      maxLength={12}
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-900">{maskData(employee.citizen_Id ?? undefined)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Work Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Department
                </Label>
                {isEditing ? (
                  <Input
                    value={typeof formData.department === 'object' && formData.department !== null ? (formData.department as any).name : (formData.department as string) || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="h-11"
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900">{typeof employee.department === 'object' && employee.department !== null ? (employee.department as any).name : (employee.department as string) || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Position</Label>
                {isEditing ? (
                  <Input
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="h-11"
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900">
                    {employee.position === 'Manager' ? 'Manager' : employee.position || 'N/A'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Employee ID</Label>
                <p className="text-base font-bold text-slate-900 font-mono">{employee.id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Status</Label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                  employee.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Other Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Other Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider">Address</Label>
                {isEditing ? (
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11"
                  />
                ) : (
                  <p className="text-base font-bold text-slate-900">{employee.address || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Tax Code
                  {!showSensitiveData && <Lock className="w-3 h-3 text-amber-500" />}
                </Label>
                {isEditing ? (
                    <Input
                      value={formData.taxCode || ''}
                      onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                      className="h-11"
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-900">{maskData(employee.taxCode ?? undefined)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
