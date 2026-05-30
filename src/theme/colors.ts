export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  border: string;
  borderLight: string;
  divider: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  input: {
    bg: string;
    border: string;
    placeholder: string;
  };
  status: {
    success: string;
    successBg: string;
    successText: string;
    warning: string;
    warningBg: string;
    warningText: string;
    error: string;
    errorBg: string;
    errorText: string;
    info: string;
    infoBg: string;
    infoText: string;
  };
  chip: {
    defaultBg: string;
    defaultBorder: string;
    defaultText: string;
    activeBg: string;
    activeText: string;
  };
  badge: {
    draftBg: string;
    draftText: string;
    submittedBg: string;
    submittedText: string;
    publishedBg: string;
    publishedText: string;
  };
  avatar: {
    bg: string;
    text: string;
  };
  card: {
    bg: string;
    border: string;
    shadow: string;
  };
  overlay: string;
  skeleton: string;
  tabBar: string;
  tabBarBorder: string;
  headerBg: string;
  headerText: string;
}

export const lightColors: ThemeColors = {
  primary: '#e35336',
  primaryLight: '#FEE2E2',
  primaryDark: '#C73B1E',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  input: {
    bg: '#F9FAFB',
    border: '#D1D5DB',
    placeholder: '#9CA3AF',
  },
  status: {
    success: '#10B981',
    successBg: '#D1FAE5',
    successText: '#065F46',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    errorText: '#991B1B',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
    infoText: '#1E40AF',
  },
  chip: {
    defaultBg: '#FFFFFF',
    defaultBorder: '#E2E8F0',
    defaultText: '#374151',
    activeBg: '#e35336',
    activeText: '#FFFFFF',
  },
  badge: {
    draftBg: '#F3F4F6',
    draftText: '#6B7280',
    submittedBg: '#DBEAFE',
    submittedText: '#1D4ED8',
    publishedBg: '#D1FAE5',
    publishedText: '#065F46',
  },
  avatar: { bg: '#e35336', text: '#FFFFFF' },
  card: { bg: '#FFFFFF', border: '#E2E8F0', shadow: '#000000' },
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#E5E7EB',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  headerBg: '#FFFFFF',
  headerText: '#111827',
};

export const darkColors: ThemeColors = {
  primary: '#e35336',
  primaryLight: '#3D1C12',
  primaryDark: '#FF6B4A',
  background: '#0F172A',
  surface: '#1E293B',
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
    inverse: '#0F172A',
  },
  input: {
    bg: '#1E293B',
    border: '#475569',
    placeholder: '#64748B',
  },
  status: {
    success: '#22C55E',
    successBg: '#064E3B',
    successText: '#86EFAC',
    warning: '#F59E0B',
    warningBg: '#451A03',
    warningText: '#FCD34D',
    error: '#EF4444',
    errorBg: '#450A0A',
    errorText: '#FCA5A5',
    info: '#3B82F6',
    infoBg: '#0F172A',
    infoText: '#93C5FD',
  },
  chip: {
    defaultBg: '#1E293B',
    defaultBorder: '#475569',
    defaultText: '#CBD5E1',
    activeBg: '#e35336',
    activeText: '#FFFFFF',
  },
  badge: {
    draftBg: '#334155',
    draftText: '#94A3B8',
    submittedBg: '#1E3A5F',
    submittedText: '#93C5FD',
    publishedBg: '#064E3B',
    publishedText: '#86EFAC',
  },
  avatar: { bg: '#e35336', text: '#FFFFFF' },
  card: { bg: '#1E293B', border: '#334155', shadow: '#000000' },
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#334155',
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
  headerBg: '#1E293B',
  headerText: '#F1F5F9',
};

export const colors = lightColors;
