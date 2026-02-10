export interface MenuItem {
  // Old structure (from JSON) - keeping for backward compatibility
  id?: number;
  label?: string;
  path?: string;
  icon?: string;
  active?: boolean;
  roles?: string[];
  children?: MenuItem[];
  // New structure (from API)
  menuId?: string;
  menuName?: string;
  menuURL?: string;
  menuIcon?: string;
  order?: number;
  mainMenuId?: string | null;
  submenu?: MenuItem[];
  // UI state
  expanded?: boolean;
}
