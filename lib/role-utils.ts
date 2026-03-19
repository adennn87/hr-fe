const DEFAULT_ADMIN_ROLE_IDS = ['a61c71f4-54c3-4138-802a-99f6c52cfc31'];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type JwtRoleInfo = {
  roleId: string | null;
  roleName: string | null;
};

export const normalizeRoleId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return UUID_REGEX.test(normalized) ? normalized : null;
};

export const getAdminRoleIds = (): string[] => {
  const fromEnv = (process.env.NEXT_PUBLIC_ADMIN_ROLE_IDS || process.env.NEXT_PUBLIC_ADMIN_ROLE_ID || '')
    .split(',')
    .map((id) => normalizeRoleId(id))
    .filter((id): id is string => Boolean(id));

  return fromEnv.length > 0 ? fromEnv : DEFAULT_ADMIN_ROLE_IDS;
};

export const isAdminRoleId = (roleId: unknown): boolean => {
  const normalizedRoleId = normalizeRoleId(roleId);
  if (!normalizedRoleId) return false;
  return getAdminRoleIds().includes(normalizedRoleId);
};

export const getJwtRoleInfo = (): JwtRoleInfo => {
  if (typeof window === 'undefined') {
    return { roleId: null, roleName: null };
  }

  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  if (!token) return { roleId: null, roleName: null };

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload?.role;

    if (role && typeof role === 'object') {
      return {
        roleId: normalizeRoleId(role.id),
        roleName: typeof role.name === 'string' ? role.name : null,
      };
    }

    return {
      roleId: null,
      roleName: typeof role === 'string' ? role : null,
    };
  } catch (error) {
    console.warn('Error decoding JWT token role info:', error);
    return { roleId: null, roleName: null };
  }
};
