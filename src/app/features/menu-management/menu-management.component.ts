import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss']
})
export class MenuManagementComponent implements OnInit {
  menus: any[] = [];
  mainMenus: any[] = [];
  showModal = false;
  isEditMode = false;
  activeTab: 'menus' | 'permissions' = 'menus';
  
  // Menu form
  menuForm = {
    menuId: '',
    menuName: '',
    menuURL: '',
    menuIcon: 'home',
    order: 1,
    menuType: 'main' as 'main' | 'submenu', // main or submenu
    mainMenuId: null as string | null
  };

  // Role authorization
  roles: any[] = [];
  selectedRoleId: string = '';
  allAuthorizations: any[] = []; // All authorizations from API
  roleAuthorizations: any[] = []; // Filtered by selected role
  filteredAuthorizations: any[] = []; // After search filter
  showAuthModal = false;
  isEditAuthMode = false;
  permissionSearchText: string = '';
  selectedPermissionFilter: string = 'all'; // all, full, view-only, none, partial

  authForm = {
    id: '',
    roleId: '',
    menuId: '',
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false
  };

  selectedMenuIds: string[] = [];

  availableIcons = [
    'home', 'phone', 'users', 'user', 'chart', 'settings', 
    'tag', 'document', 'folder'
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMenus();
    this.loadMainMenus();
    this.loadRoles();
    this.loadAllAuthorizations();
  }

  loadMenus(): void {
    this.apiService.getAllMenus().subscribe((res: any) => {
      if (Array.isArray(res)) {
        this.menus = res;
      } else if (res.data) {
        this.menus = res.data;
      } else {
        this.menus = [];
      }
    });
  }

  loadMainMenus(): void {
    this.apiService.getOnlyMainMenus().subscribe((res: any) => {
      if (Array.isArray(res)) {
        this.mainMenus = res;
      } else if (res.data) {
        this.mainMenus = res.data;
      } else {
        this.mainMenus = [];
      }
    });
  }

  loadRoles(): void {
    this.apiService.getAllUserRoles().subscribe((res: any) => {
      console.log('Roles API Response:', res);
      // Handle direct array response or wrapped response
      if (Array.isArray(res)) {
        this.roles = res;
      } else if (res.data) {
        this.roles = res.data;
      } else {
        this.roles = [];
      }
      console.log('Roles loaded:', this.roles);
    });
  }

  // Tab switching
  switchTab(tab: 'menus' | 'permissions'): void {
    this.activeTab = tab;
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(menu: any): void {
    this.isEditMode = true;
    this.menuForm = {
      menuId: menu.menuId,
      menuName: menu.menuName,
      menuURL: menu.menuURL,
      menuIcon: menu.menuIcon,
      order: menu.order,
      menuType: menu.mainMenuId ? 'submenu' : 'main',
      mainMenuId: menu.mainMenuId
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.menuForm = {
      menuId: '',
      menuName: '',
      menuURL: '',
      menuIcon: 'home',
      order: 1,
      menuType: 'main',
      mainMenuId: null
    };
  }

  onMenuTypeChange(): void {
    if (this.menuForm.menuType === 'main') {
      this.menuForm.mainMenuId = null;
    }
  }

  saveMenu(): void {
    const payload = {
      menuName: this.menuForm.menuName,
      menuURL: this.menuForm.menuURL,
      menuIcon: this.menuForm.menuIcon,
      order: this.menuForm.order,
      mainMenuId: this.menuForm.menuType === 'submenu' ? this.menuForm.mainMenuId : null
    };

    if (this.isEditMode) {
      this.apiService.updateMenu(this.menuForm.menuId, payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Menu updated successfully',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadMenus();
          this.loadMainMenus();
          this.closeModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: err.error?.message || 'Failed to update menu',
          });
        }
      });
    } else {
      this.apiService.createMenu(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Menu created successfully',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadMenus();
          this.loadMainMenus();
          this.closeModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: err.error?.message || 'Failed to create menu',
          });
        }
      });
    }
  }

  deleteMenu(menuId: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the menu and all its submenus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteMenu(menuId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Menu has been deleted.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadMenus();
            this.loadMainMenus();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: err.error?.message || 'Failed to delete menu',
            });
          }
        });
      }
    });
  }

  getMenuTypeBadge(menu: any): string {
    return menu.mainMenuId ? 'Submenu' : 'Main Menu';
  }

  // Role Authorization Methods
  loadAllAuthorizations(): void {
    this.apiService.getAllAuthorizations().subscribe((res: any) => {
      console.log('Authorizations API Response:', res);
      if (Array.isArray(res)) {
        this.allAuthorizations = res;
      } else if (res.data) {
        this.allAuthorizations = res.data;
      } else {
        this.allAuthorizations = [];
      }
      console.log('All Authorizations loaded:', this.allAuthorizations);
      if (this.selectedRoleId) {
        this.filterAuthorizationsByRole();
      }
    });
  }

  onRoleChange(): void {
    if (this.selectedRoleId) {
      this.filterAuthorizationsByRole();
    } else {
      this.roleAuthorizations = [];
    }
  }

  filterAuthorizationsByRole(): void {
    this.roleAuthorizations = this.allAuthorizations.filter(
      auth => auth.roleId === this.selectedRoleId
    );
  }

  getPermissionLevel(auth: any): string {
    const permissions = [auth.canView, auth.canCreate, auth.canEdit, auth.canDelete];
    const trueCount = permissions.filter(p => p).length;
    
    if (trueCount === 0) return 'none';
    if (trueCount === 4) return 'full';
    if (trueCount === 1 && auth.canView) return 'view-only';
    return 'partial';
  }

  getPermissionBadge(auth: any): { label: string; class: string } {
    const level = this.getPermissionLevel(auth);
    const badges: any = {
      'full': { label: 'Full Access', class: 'bg-green-100 text-green-800' },
      'view-only': { label: 'View Only', class: 'bg-blue-100 text-blue-800' },
      'partial': { label: 'Partial Access', class: 'bg-yellow-100 text-yellow-800' },
      'none': { label: 'No Access', class: 'bg-gray-100 text-gray-800' }
    };
    return badges[level] || badges['none'];
  }

  openAuthModal(): void {
    if (!this.selectedRoleId) {
      Swal.fire({
        icon: 'warning',
        title: 'No Role Selected',
        text: 'Please select a role first',
      });
      return;
    }
    this.isEditAuthMode = false;
    this.resetAuthForm();
    this.authForm.roleId = this.selectedRoleId;
    this.showAuthModal = true;
  }

  openEditAuthModal(auth: any): void {
    this.isEditAuthMode = true;
    this.authForm = {
      id: auth.authorizationId, // Use authorizationId from API response
      roleId: auth.roleId,
      menuId: auth.menuId,
      canView: auth.canView,
      canCreate: auth.canCreate,
      canEdit: auth.canEdit,
      canDelete: auth.canDelete
    };
    this.showAuthModal = true;
  }

  closeAuthModal(): void {
    this.showAuthModal = false;
    this.resetAuthForm();
  }

  resetAuthForm(): void {
    this.authForm = {
      id: '',
      roleId: this.selectedRoleId || '',
      menuId: '',
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    };
    this.selectedMenuIds = [];
  }

  // Quick toggle for inline permission changes - simplified to just toggle access
  toggleAccess(auth: any): void {
    const currentValue = auth.canView;
    const payload = {
      roleId: auth.roleId,
      menuId: auth.menuId,
      canView: !currentValue,
      canCreate: true, // Always true
      canEdit: true, // Always true
      canDelete: true // Always true
    };

    this.apiService.updateAuthorization(payload).subscribe({
      next: () => {
        auth.canView = !currentValue;
        auth.canCreate = true;
        auth.canEdit = true;
        auth.canDelete = true;
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Access ${!currentValue ? 'enabled' : 'disabled'} successfully`,
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: err.error?.message || 'Failed to update access',
        });
      }
    });
  }

  isMenuSelected(menuId: string): boolean {
    return this.selectedMenuIds.includes(menuId);
  }

  toggleMenuSelection(menuId: string): void {
    const index = this.selectedMenuIds.indexOf(menuId);
    if (index > -1) {
      this.selectedMenuIds.splice(index, 1);
    } else {
      this.selectedMenuIds.push(menuId);
    }
  }

  saveAuthorization(): void {
    if (this.isEditAuthMode) {
      // Edit mode - update single authorization
      const payload = {
        roleId: this.authForm.roleId,
        menuId: this.authForm.menuId,
        canView: true, // Always true
        canCreate: true, // Always true
        canEdit: true, // Always true
        canDelete: true // Always true
      };

      this.apiService.updateAuthorization(payload).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Permission updated successfully',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadAllAuthorizations();
          this.closeAuthModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: err.error?.message || 'Failed to update permission',
          });
        }
      });
    } else {
      // Create mode - assign multiple menus
      if (this.selectedMenuIds.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Menus Selected',
          text: 'Please select at least one menu to assign'
        });
        return;
      }

      // Create authorization for each selected menu
      const requests = this.selectedMenuIds.map(menuId => {
        const payload = {
          roleId: this.authForm.roleId,
          menuId: menuId,
          canView: true, // Always true
          canCreate: true, // Always true
          canEdit: true, // Always true
          canDelete: true // Always true
        };
        return this.apiService.createAuthorization(payload);
      });

      // Execute all requests
      let completed = 0;
      let failed = 0;

      requests.forEach(request => {
        request.subscribe({
          next: () => {
            completed++;
            if (completed + failed === requests.length) {
              if (failed === 0) {
                Swal.fire({
                  icon: 'success',
                  title: 'Success!',
                  text: `${completed} menu(s) assigned successfully`,
                  timer: 2000,
                  showConfirmButton: false
                });
              } else {
                Swal.fire({
                  icon: 'warning',
                  title: 'Partially Complete',
                  text: `${completed} succeeded, ${failed} failed`
                });
              }
              this.loadAllAuthorizations();
              this.closeAuthModal();
            }
          },
          error: () => {
            failed++;
            if (completed + failed === requests.length) {
              if (completed === 0) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Failed to assign menus'
                });
              } else {
                Swal.fire({
                  icon: 'warning',
                  title: 'Partially Complete',
                  text: `${completed} succeeded, ${failed} failed`
                });
              }
              this.loadAllAuthorizations();
              this.closeAuthModal();
            }
          }
        });
      });
    }
  }

  deleteAuthorization(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the menu permission!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteAuthorization(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'Permission has been removed.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadAllAuthorizations();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: err.error?.message || 'Failed to remove permission',
            });
          }
        });
      }
    });
  }

  getMenuNameById(menuId: string): string {
    const findMenu = (items: any[]): any => {
      for (const item of items) {
        if (item.menuId === menuId) return item;
        if (item.submenu) {
          const found = findMenu(item.submenu);
          if (found) return found;
        }
      }
      return null;
    };
    const menu = findMenu(this.menus);
    return menu ? menu.menuName : menuId;
  }

  getRoleName(roleId: string): string {
    const role = this.roles.find(r => r.roleId === roleId);
    return role ? role.roleName : roleId;
  }

  getFlattenedMenus(): any[] {
    const flattened: any[] = [];
    const flatten = (items: any[], parentName?: string) => {
      items.forEach(item => {
        flattened.push({
          ...item,
          displayName: parentName ? `${parentName} → ${item.menuName}` : item.menuName
        });
        if (item.submenu) {
          flatten(item.submenu, item.menuName);
        }
      });
    };
    flatten(this.menus);
    return flattened;
  }
}
