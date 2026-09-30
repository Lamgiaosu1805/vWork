export const CRM_COLORS = {
  primary: "#FF5722",
  primaryMid: "#FF7043",
  primaryLight: "#FF8A65",
  primaryDark: "#E64A19",
  primaryDeep: "#BF360C",
  accent: "#0052FF",
  accentDark: "#1D4ED8",
  background: "#F4F6F9",
  white: "#FFFFFF",
  textDark: "#1A1D26",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  inactiveTab: "#94A3B8",
};

export const CRM_RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const CRM_SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 2,
  },
  cta: {
    shadowColor: CRM_COLORS.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 6,
  },
  accent: {
    shadowColor: CRM_COLORS.accent,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
};
