import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#18181b',
    colorPrimaryHover: '#27272a',
    colorText: '#09090b',
    colorTextSecondary: '#71717a',
    colorTextTertiary: '#a1a1aa',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#e4e4e7',
    colorBorderSecondary: '#f4f4f5',
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    fontFamily: "'Inter', 'Pretendard', -apple-system, sans-serif",
    fontSize: 14,
    colorSuccess: '#16a34a',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    controlHeight: 36,
    controlHeightSM: 32,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    Table: {
      headerBg: '#f8f8fa',
      headerColor: '#71717a',
      rowHoverBg: '#fafafa',
      borderColor: '#f4f4f5',
      headerBorderRadius: 0,
    },
    Card: {
      paddingLG: 24,
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: '#f1f1f4',
      itemSelectedBg: '#f1f1f4',
      itemSelectedColor: '#09090b',
      itemColor: '#71717a',
    },
    Input: {
      activeBorderColor: '#18181b',
      hoverBorderColor: '#d4d4d8',
    },
    Tag: {
      borderRadiusSM: 999,
    },
  },
};
