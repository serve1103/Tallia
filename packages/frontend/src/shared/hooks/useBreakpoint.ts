import { Grid } from 'antd';

const { useBreakpoint } = Grid;

interface Breakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Ant Design Grid.useBreakpoint() 래퍼.
 * sm 이하 → 모바일, md → 태블릿, lg 이상 → 데스크톱
 */
export function useBreakpoints(): Breakpoints {
  const screens = useBreakpoint();

  const isMobile = !!screens.xs || (!!screens.sm && !screens.md);
  const isTablet = !!screens.md && !screens.lg;
  const isDesktop = !!screens.lg;

  return { isMobile, isTablet, isDesktop };
}
