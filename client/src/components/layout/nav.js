import {
  LayoutDashboard, MessagesSquare, Ticket, CalendarDays, FolderOpen,
  ClipboardList, Award, Bell, Users, ShieldCheck,
} from 'lucide-react';

// Central nav definition. `roles` gates visibility; the server still enforces access.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'parent', 'teacher', 'student'], end: true },
  { to: '/messages', label: 'Messages', icon: MessagesSquare, roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/moderation', label: 'Moderation', icon: ShieldCheck, roles: ['teacher', 'admin'] },
  { to: '/tickets', label: 'Tickets', icon: Ticket, roles: ['admin', 'parent', 'teacher'] },
  { to: '/events', label: 'Events', icon: CalendarDays, roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/documents', label: 'Documents', icon: FolderOpen, roles: ['admin', 'parent', 'teacher'] },
  { to: '/surveys', label: 'Surveys', icon: ClipboardList, roles: ['admin', 'parent', 'teacher'] },
  { to: '/rewards', label: 'Rewards', icon: Award, roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'parent', 'teacher', 'student'] },
];

export const navForRole = (role) => NAV_ITEMS.filter((i) => i.roles.includes(role));
