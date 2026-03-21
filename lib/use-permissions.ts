'use client';

import { useStoredUser } from './use-stored-user';
import { isAdminRoleName } from './role-utils';
import { SYSTEM_FUNCTIONS } from './permissions';

export function usePermissions() {
  const user = useStoredUser();

  /**
   * Kiểm tra xem người dùng có một quyền cụ thể hay không (theo code hoặc name).
   * @param permissionCodeOrName Mã (code) hoặc Tên (name) của quyền.
   * @returns boolean
   */
  const hasPermission = (permissionCodeOrName: string): boolean => {
    if (isAdminRoleName(user.role)) return true;
    
    // Tìm thông tin quyền trong SYSTEM_FUNCTIONS
    const func = SYSTEM_FUNCTIONS.find(
      f => f.code === permissionCodeOrName || f.name === permissionCodeOrName
    );

    // Nếu không tìm thấy quyền trong hệ thống, vẫn thử check trực tiếp trong user.permissions
    if (!func) {
      return user.permissions?.includes(permissionCodeOrName) || false;
    }

    // Kiểm tra xem user có code hoặc name của quyền này không
    return (
      user.permissions?.includes(func.code) || 
      user.permissions?.includes(func.name) || 
      false
    );
  };

  /**
   * Kiểm tra xem người dùng có bất kỳ quyền nào trong một module hay không.
   * @param module Tên module (ví dụ: 'USER', 'ROLE').
   * @returns boolean
   */
  const hasModuleAccess = (module: string): boolean => {
    if (isAdminRoleName(user.role)) return true;

    const moduleFunctions = SYSTEM_FUNCTIONS.filter(f => f.module === module);
    const modulePermissionNames = moduleFunctions.map(f => f.name);
    const modulePermissionCodes = moduleFunctions.map(f => f.code);

    return user.permissions?.some(p => 
      modulePermissionNames.includes(p) || modulePermissionCodes.includes(p)
    ) || false;
  };

  return {
    hasPermission,
    hasModuleAccess,
    userPermissions: user.permissions || [],
    isAdmin: isAdminRoleName(user.role),
  };
}
