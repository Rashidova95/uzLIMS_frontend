import { useSelector } from 'react-redux';
import { selectUserRole } from '../../features/auth/authSlice';

/**
 * RoleGuard — bolalarini faqat ruxsat etilgan rol egasi ko'radi.
 * Masalan: <RoleGuard allow={['admin', 'chemist']}><Button>Tasdiqlash</Button></RoleGuard>
 */
export default function RoleGuard({ allow = [], children }) {
  const role = useSelector(selectUserRole);
  if (!role || !allow.includes(role)) return null;
  return children;
}
