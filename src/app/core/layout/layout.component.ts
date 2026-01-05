import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { User } from '../models/auth.model';
import { MenuItem } from '../models/menu-item.model';
import menuItems from '../../data/menu-items.json'; // Using hardcoded menu items

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  isSidebarOpen = false;
  currentUser: User | null = null;
  menuItems: MenuItem[] = menuItems as MenuItem[]; // Using hardcoded menu items
  filteredMenuItems: MenuItem[] = [];  private authState$: any;
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authState$ = this.authService.authState$.subscribe((state: any) => {
      this.currentUser = state.user;
      console.log('Layout - Current user:', this.currentUser);
      console.log('Layout - User role:', this.currentUser?.role);
      
      // Using hardcoded menu items for now - filter by role
      this.filterMenuItems();
    });
  }

  ngOnDestroy(): void {
    if (this.authState$) {
      this.authState$.unsubscribe();
    }
  }

  filterMenuItems(): void {
    console.log('Showing all menu items to user');
    this.filteredMenuItems = this.filterMenuByRole(this.menuItems);
  }

  filterMenuByRole(items: MenuItem[]): MenuItem[] {
    const filtered = items
      .filter(item => {
        // Only show active items - show all active items regardless of role
        if (!item.active) {
          console.log('Item inactive:', item.label);
          return false;
        }
        return true;
      })
      .map(item => ({
        ...item,
        children: item.children ? this.filterMenuByRole(item.children) : undefined
      }))
      .filter(item => {
        // Keep items without children, or items with at least one visible child
        const shouldKeep = !item.children || item.children.length > 0;
        if (item.children && item.children.length === 0) {
          console.log('Removing parent with no visible children:', item.label);
        }
        return shouldKeep;
      });
    
    console.log('Filtered items count:', filtered.length);
    return filtered;
  }

  toggleSubmenu(item: MenuItem): void {
    // Using hardcoded JSON structure (children)
    const hasSubitems = item.children && item.children.length > 0;
    if (hasSubitems) {
      item.expanded = !item.expanded;
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      'home': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      'briefcase': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      'search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'code': 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      'check': 'M5 13l4 4L19 7',
      'phone': 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      'users': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      'user': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'settings': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'tag': 'M7 7h.01M7 3h5c.82 0 1.584.36 2.11.97l2.85 3.02c.26.28.4.65.4 1.04v5.96c0 .91-.73 1.65-1.64 1.65H7.64C6.73 17 6 16.26 6 15.35V4.65C6 3.74 6.73 3 7.64 3z',
      'document': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'folder': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      'menu': 'M4 6h16M4 12h16M4 18h16'
    };
    return icons[iconName] || icons['home'];
  }
}
