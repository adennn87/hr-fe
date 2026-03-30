'use client';

import { useStoredUser } from './use-stored-user';
import { isAdminRoleName } from './role-utils';
import { SYSTEM_FUNCTIONS } from './permissions';

export function usePermissions() {
  const user = useStoredUser();

  /**
   * Check if user has a specific permission (by code or name).
   * @param permissionCodeOrName Code or Name of permission.
   * @returns boolean
   */
  const hasPermission = (permissionCodeOrName: string): boolean => {
    if (isAdminRoleName(user.role)) return true;
    
    // Find permission info in SYSTEM_FUNCTIONS
    const func = SYSTEM_FUNCTIONS.find(
      f => f.code === permissionCodeOrName || f.name === permissionCodeOrName
    );

    // If permission not found in system, still try to check directly in user.permissions
    if (!func) {
      return user.permissions?.includes(permissionCodeOrName) || false;
    }

    // Check if user has code or name of this permission
    return (
      user.permissions?.includes(func.code) || 
      user.permissions?.includes(func.name) || 
      false
    );
  };

  /**
   * Check if user has any permission in a module.
   * @param module Module name (e.g. 'USER', 'ROLE').
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
