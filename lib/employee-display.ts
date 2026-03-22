const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(s: string | undefined | null): boolean {
  if (!s || typeof s !== 'string') return false;
  return UUID_RE.test(s.trim());
}

/**
 * Tên hiển thị cho nhân viên (tránh dùng UUID / id làm dòng chính trong dropdown).
 */
export function getEmployeeDisplayLabel(emp: any): string {
  const raw =
    emp?.fullName ||
    emp?.full_name ||
    emp?.name ||
    emp?.displayName ||
    [emp?.firstName, emp?.lastName].filter(Boolean).join(' ').trim() ||
    emp?.user?.fullName ||
    emp?.user?.full_name ||
    '';
  let s = String(raw).trim();
  if (s && !isUuidLike(s)) return s;

  const email = emp?.email != null ? String(emp.email).trim() : '';
  if (email && email.includes('@')) return email;

  const phone = emp?.phoneNumber ?? emp?.phone;
  if (phone) return String(phone);

  const id = emp?.id != null ? String(emp.id) : '';
  if (id) {
    if (isUuidLike(id)) return `Nhân viên ${id.slice(0, 8)}…`;
    return id;
  }
  return 'Nhân viên';
}

/** Chuỗi phụ (email) khi đã có tên rõ ràng — không lặp UUID. */
export function getEmployeeSecondaryLine(emp: any): string | null {
  const email = emp?.email != null ? String(emp.email).trim() : '';
  if (email && email.includes('@')) return email;
  return null;
}
