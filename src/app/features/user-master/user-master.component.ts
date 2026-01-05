import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, ModuleRegistry, themeBalham } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { UserService } from '../../core/services/user.service';
import { User, CreateUserRequest, UpdateUserRequest, UserRole } from '../../core/models/user.model';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { ApiService } from '../../core/services/api.service';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-user-master',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AgGridModule, ClickOutsideDirective],
  templateUrl: './user-master.component.html',
  styleUrls: ['./user-master.component.scss']
})
export class UserMasterComponent implements OnInit {
  @ViewChild('userGrid') userGrid!: AgGridAngular;
  @ViewChild('roleGrid') roleGrid!: AgGridAngular;

  userForm: FormGroup;
  roleForm: FormGroup;
  users: User[] = [];
  roles: UserRole[] = [];
  employeeTypes = ['Confirmed', 'Probation'];
  userGridApi!: GridApi;
  
  // Role search functionality
  roleSearchText: string = '';
  filteredRoles: UserRole[] = [];
  showRoleDropdown: boolean = false;
  creatingRoleFromUserModal: boolean = false; // Flag to track if role creation was triggered from user modal
  roleGridApi!: GridApi;
  isUserModalOpen = false;
  isRoleModalOpen = false;
  isEditMode = false;
  isRoleEditMode = false;
  selectedUser: User | null = null;
  selectedRole: UserRole | null = null;
  loading = false;
  theme = themeBalham;
  activeTab: 'users' | 'roles' | 'menus' | 'permissions' = 'users';

  // ========== Menu Management Properties ==========
  menus: any[] = [];
  mainMenus: any[] = [];
  showMenuModal = false;
  isEditMenuMode = false;
  menuActiveTab: 'menus' | 'permissions' = 'menus';
  
  // Menu form
  menuForm = {
    menuId: '',
    menuName: '',
    menuURL: '',
    menuIcon: 'home',
    order: 1,
    menuType: 'main' as 'main' | 'submenu',
    mainMenuId: null as string | null
  };

  // Role authorization for menus
  selectedRoleId: string = '';
  allAuthorizations: any[] = [];
  roleAuthorizations: any[] = [];
  filteredAuthorizations: any[] = [];
  showAuthModal = false;
  isEditAuthMode = false;
  permissionSearchText: string = '';
  selectedPermissionFilter: string = 'all';

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

  columnDefs: ColDef[] = [
      {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: this.actionCellRenderer.bind(this),
      width: 120,
      sortable: false,
      filter: false,
      pinned: 'left',
      suppressSizeToFit: true
    },
    {
      field: 'userName',
      headerName: 'User Name',
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
      },
      flex: 1,
      minWidth: 180
    },
    {
      field: 'emailId',
      headerName: 'Email',
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
      },
      flex: 1,
      minWidth: 200
    },    
    {
      field: 'roleName',
      headerName: 'Role',
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
      },
      flex: 1,
      minWidth: 150
    },
    // {
    //   field: 'employeeType',
    //   headerName: 'Status',
    //   width: 100,
    //   filter: 'agTextColumnFilter',
    //   filterParams: {
    //     buttons: ['reset', 'apply'],
    // }
    // }
  ];

  roleColumnDefs: ColDef[] = [
     {
      headerName: 'Actions',
      cellRenderer: this.roleActionCellRenderer.bind(this),
      width: 120,
      sortable: false,
      filter: false,
      suppressSizeToFit: true
    },
    {
      field: 'roleName',
      headerName: 'Role Name',
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
      },
      flex: 1,
      minWidth: 200
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      suppressSizeToFit: true,
      cellRenderer: (params: any) => {
        const isActive = params.value === 'Y' || params.value === '1' || params.value === true;
        return isActive 
          ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>'
          : '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>';
      }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: { display: 'flex', alignItems: 'center' },
    // floatingFilter: true,
  };

  pagination = true;
  paginationPageSize = 20;
  paginationPageSizeSelector = [10, 20, 50, 100];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private zone: NgZone,
    private apiService: ApiService
  ) {
    this.userForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(2)]],
      emailId: ['', [Validators.required, Validators.email]],
      roleId: ['', Validators.required],
      employeeType: ['', Validators.required]
    });
    
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(2)]],
      isActive: ['Y', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadMenus();
    this.loadMainMenus();
    this.loadAllAuthorizations();
  }

  onGridReady(params: GridReadyEvent): void {
    this.userGridApi = params.api;
    this.userGridApi.sizeColumnsToFit();
  }

  onRoleGridReady(params: GridReadyEvent): void {
    this.roleGridApi = params.api;
    this.roleGridApi.sizeColumnsToFit();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        console.log('Users API Response:', response);
        // Handle direct array response or wrapped response
        if (Array.isArray(response)) {
          this.users = response;
          console.log('Users loaded (direct array):', this.users);
        } else if (response.success && response.data) {
          this.users = response.data;
          console.log('Users loaded (wrapped):', this.users);
        } else {
          this.users = [];
        }
        
        // Refresh the grid to show updated data
        if (this.userGridApi) {
          this.userGridApi.setGridOption('rowData', this.users);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load users. Please try again.',
          confirmButtonColor: '#d33'
        });
        this.loading = false;
      }
    });
  }

  loadRoles(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getAllRoles().subscribe({
        next: (response) => {
          console.log('Roles API Response:', response);
          // Handle direct array response or wrapped response
          if (Array.isArray(response)) {
            this.roles = response;
            console.log('Roles loaded (direct array):', this.roles);
          } else if (response.success && response.data) {
            this.roles = response.data;
            console.log('Roles loaded (wrapped):', this.roles);
          } else {
            console.warn('No roles data in response');
            this.roles = [];
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load roles. Please check if the API is available.',
            confirmButtonColor: '#d33'
          });
          reject(error);
        }
      });
    });
  }

  openModal(mode: 'create' | 'edit', user?: User): void {
    this.isUserModalOpen = true;
    this.isEditMode = mode === 'edit';
    
    if (mode === 'edit' && user) {
      this.selectedUser = user;
      this.userForm.patchValue({
        userName: user.userName,
        emailId: user.emailId,
        roleId: user.roleId,
        employeeType: user.employeeType
      });
      // Initialize role search first
      this.initializeRoleSearch();
      // Then set the role name for search input in edit mode
      const selectedRole = this.roles.find(r => r.roleId === user.roleId);
      if (selectedRole) {
        this.roleSearchText = selectedRole.roleName;
      }
    } else {
      this.selectedUser = null;
      this.userForm.reset({
        userName: '',
        emailId: '',
        roleId: '',
        employeeType: ''
      });
      this.initializeRoleSearch();
    }
  }

  closeModal(): void {
    this.isUserModalOpen = false;
    this.isEditMode = false;
    this.selectedUser = null;
    this.userForm.reset({
      userName: '',
      emailId: '',
      roleId: '',
      employeeType: ''
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.userForm.value;

    if (this.isEditMode && this.selectedUser) {
      this.updateUser(formValue);
    } else {
      this.createUser(formValue);
    }
  }

  createUser(formValue: any): void {
    const newUser: CreateUserRequest = {
      userName: formValue.userName,
      emailId: formValue.emailId,
      roleId: formValue.roleId,
      userCode: '00000000-0000-0000-0000-000000000000',
      employeeType: 'Confirmed'
    };

    this.loading = true;
    this.userService.createUser(newUser).subscribe({
      next: (response: any) => {
        console.log('Create User Response:', response);
        this.loading = false;
        
        // Handle response with statusCode or success field
        const isSuccess = response?.statusCode === 200 || response?.success === true;
        const message = response?.message || 'User created successfully!';
        
        if (isSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false
          });
          this.closeModal();
          this.loadUsers();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message || 'Failed to create user.',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Failed to create user. Please try again.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  updateUser(formValue: any): void {
    if (!this.selectedUser?.userId) return;

    const updateUser: UpdateUserRequest = {
      userId: this.selectedUser.userId,
      userName: formValue.userName,
      emailId: formValue.emailId,
      roleId: formValue.roleId,
      userCode: '00000000-0000-0000-0000-000000000000',
      employeeType: formValue.employeeType,
      roleName: this.selectedUser.roleName || ''
    };

    this.loading = true;
    this.userService.updateUser(updateUser).subscribe({
      next: (response: any) => {
        console.log('Update User Response:', response);
        this.loading = false;
        
        const isSuccess = response?.statusCode === 200 || response?.success === true;
        const message = response?.message || 'User updated successfully!';
        
        if (isSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false
          });
          this.closeModal();
          this.loadUsers();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message || 'Failed to update user.',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Failed to update user. Please try again.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  deleteUser(user: User): void {
    if (!user.userId) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete user "${user.userName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed && user.userId) {
        this.loading = true;
        this.userService.deleteUser(user.userId).subscribe({
          next: (response: any) => {
            console.log('Delete User Response:', response);
            this.loading = false;
            
            const isSuccess = response?.statusCode === 200 || response?.success === true;
            const message = response?.message || 'User has been deleted.';
            
            if (isSuccess) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: message,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadUsers();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message || 'Failed to delete user.',
                confirmButtonColor: '#d33'
              });
            }
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Failed to delete user. Please try again.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  actionCellRenderer(params: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex gap-2 items-center h-full';

    const editButton = document.createElement('button');
    editButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    `;
    editButton.className = 'text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition';
    editButton.title = 'Edit';
    editButton.addEventListener('click', () => {
      this.zone.run(() => {
        this.openModal('edit', params.data);
      });
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    `;
    deleteButton.className = 'text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition';
    deleteButton.title = 'Delete';
    deleteButton.addEventListener('click', () => {
      this.zone.run(() => {
        this.deleteUser(params.data);
      });
    });

    container.appendChild(editButton);
    container.appendChild(deleteButton);

    return container;
  }

  onFilterTextBoxChanged(): void {
    const filterText = (document.getElementById('filter-text-box') as HTMLInputElement)?.value;
    this.userGridApi.setGridOption('quickFilterText', filterText);
  }

  // ============ ROLE MANAGEMENT METHODS ============

  openRoleModal(mode: 'create' | 'edit', role?: UserRole): void {
    this.isRoleModalOpen = true;
    this.isRoleEditMode = mode === 'edit';
    
    if (mode === 'edit' && role) {
      this.selectedRole = role;
      this.roleForm.patchValue({
        roleName: role.roleName,
        isActive: role.isActive || 'Y'
      });
    } else {
      this.selectedRole = null;
      this.roleForm.reset({
        roleName: '',
        isActive: 'Y'
      });
    }
  }

  closeRoleModal(): void {
    this.isRoleModalOpen = false;
    this.isRoleEditMode = false;
    this.selectedRole = null;
    this.roleForm.reset({
      roleName: '',
      isActive: 'Y'
    });
  }

  onRoleSubmit(): void {
    if (this.roleForm.invalid) {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.roleForm.value;

    if (this.isRoleEditMode && this.selectedRole) {
      this.updateRole(formValue);
    } else {
      this.createRole(formValue);
    }
  }

  createRole(formValue: any): void {
    this.loading = true;
    this.userService.createRole(formValue.roleName).subscribe({
      next: (response: any) => {
        console.log('Create Role Response:', response);
        this.loading = false;
        
        const isSuccess = response?.statusCode === 200 || response?.success === true || response?.message;
        const message = response?.message || 'Role created successfully!';
        
        if (isSuccess) {
          // If role was created from user modal search, auto-select it
          if (this.creatingRoleFromUserModal) {
            this.loadRoles().then(() => {
              // Find the newly created role
              const newRole = this.roles.find(r => r.roleName.toLowerCase() === formValue.roleName.toLowerCase());
              if (newRole) {
                // Select the new role in user form
                this.userForm.patchValue({ roleId: newRole.roleId });
                this.roleSearchText = newRole.roleName;
                this.filteredRoles = [...this.roles];
              }
              // Reset flag and close role modal
              this.creatingRoleFromUserModal = false;
              this.closeRoleModal();
              
              // Show success message
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: message,
                timer: 2000,
                showConfirmButton: false
              });
            });
          } else {
            // Normal role creation flow
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: message,
              timer: 2000,
              showConfirmButton: false
            });
            this.closeRoleModal();
            this.loadRoles();
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message || 'Failed to create role.',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (error) => {
        console.error('Error creating role:', error);
        this.loading = false;
        this.creatingRoleFromUserModal = false; // Reset flag on error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Failed to create role. Please try again.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  updateRole(formValue: any): void {
    if (!this.selectedRole?.roleId) return;

    const updateRole = {
      roleId: this.selectedRole.roleId,
      roleName: formValue.roleName,
      isActive: formValue.isActive
    };

    this.loading = true;
    this.userService.updateRole(updateRole).subscribe({
      next: (response: any) => {
        console.log('Update Role Response:', response);
        this.loading = false;
        
        const isSuccess = response?.statusCode === 200 || response?.success === true || response?.message;
        const message = response?.message || 'Role updated successfully!';
        
        if (isSuccess) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false
          });
          this.closeRoleModal();
          this.loadRoles();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message || 'Failed to update role.',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (error) => {
        console.error('Error updating role:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Failed to update role. Please try again.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  deleteRole(role: UserRole): void {
    if (!role.roleId) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete role "${role.roleName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed && role.roleId) {
        this.loading = true;
        this.userService.deleteRole(role.roleId).subscribe({
          next: (response: any) => {
            console.log('Delete Role Response:', response);
            this.loading = false;
            
            const isSuccess = response?.statusCode === 200 || response?.success === true || response?.message;
            const message = response?.message || 'Role has been deleted.';
            
            if (isSuccess) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: message,
                timer: 2000,
                showConfirmButton: false
              });
              this.loadRoles();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message || 'Failed to delete role.',
                confirmButtonColor: '#d33'
              });
            }
          },
          error: (error) => {
            console.error('Error deleting role:', error);
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.error?.message || 'Failed to delete role. Please try again.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  roleActionCellRenderer(params: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex gap-2 items-center h-full';

    const editButton = document.createElement('button');
    editButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    `;
    editButton.className = 'text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition';
    editButton.title = 'Edit';
    editButton.addEventListener('click', () => {
      this.zone.run(() => {
        this.openRoleModal('edit', params.data);
      });
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    `;
    deleteButton.className = 'text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition';
    deleteButton.title = 'Delete';
    deleteButton.addEventListener('click', () => {
      this.zone.run(() => {
        this.deleteRole(params.data);
      });
    });

    container.appendChild(editButton);
    container.appendChild(deleteButton);

    return container;
  }

  switchTab(tab: 'users' | 'roles' | 'menus' | 'permissions'): void {
    this.activeTab = tab;
  }

  switchMenuTab(tab: 'menus' | 'permissions'): void {
    this.menuActiveTab = tab;
  }

  get activeUsersCount(): number {
    return this.users.length;
  }

  get activeRolesCount(): number {
    return this.roles.filter(r => r.isActive === 'Y').length;
  }

  get totalRolesCount(): number {
    return this.roles.length;
  }

  /**
   * Filter roles based on search text
   */
  filterRoles(): void {
    if (!this.roleSearchText || this.roleSearchText.trim() === '') {
      this.filteredRoles = [...this.roles];
    } else {
      const searchLower = this.roleSearchText.toLowerCase();
      this.filteredRoles = this.roles.filter(role => 
        role.roleName.toLowerCase().includes(searchLower)
      );
    }
  }

  /**
   * Select a role from the dropdown
   */
  selectRole(role: UserRole): void {
    this.userForm.patchValue({ roleId: role.roleId });
    this.roleSearchText = role.roleName;
    this.showRoleDropdown = false;
  }

  /**
   * Initialize filtered roles when modal opens
   */
  private initializeRoleSearch(): void {
    this.roleSearchText = '';
    this.filteredRoles = [...this.roles];
    this.showRoleDropdown = false;
  }

  /**
   * Create a new role from the search text
   */
  createRoleFromSearch(): void {
    if (!this.roleSearchText || this.roleSearchText.trim() === '') {
      return;
    }

    // Close the dropdown
    this.showRoleDropdown = false;

    // Set flag to indicate role is being created from user modal
    this.creatingRoleFromUserModal = true;

    // Set the role name in the role form
    this.roleForm.patchValue({
      roleName: this.roleSearchText.trim()
    });

    // Open the role modal in create mode
    this.isRoleModalOpen = true;
    this.isRoleEditMode = false;
    this.selectedRole = null;
  }

  // ============ MENU MANAGEMENT METHODS ============

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

  openCreateMenuModal(): void {
    this.isEditMenuMode = false;
    this.resetMenuForm();
    this.showMenuModal = true;
  }

  openEditMenuModal(menu: any): void {
    this.isEditMenuMode = true;
    this.menuForm = {
      menuId: menu.menuId,
      menuName: menu.menuName,
      menuURL: menu.menuURL,
      menuIcon: menu.menuIcon,
      order: menu.order,
      menuType: menu.mainMenuId ? 'submenu' : 'main',
      mainMenuId: menu.mainMenuId
    };
    this.showMenuModal = true;
  }

  closeMenuModal(): void {
    this.showMenuModal = false;
    this.resetMenuForm();
  }

  resetMenuForm(): void {
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

    if (this.isEditMenuMode) {
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
          this.closeMenuModal();
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
          this.closeMenuModal();
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

  onRoleChangeForPermissions(): void {
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
    const trueCount = permissions.filter((p: any) => p).length;
    
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
      id: auth.authorizationId,
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

  toggleAccess(auth: any): void {
    const currentValue = auth.canView;
    const payload = {
      roleId: auth.roleId,
      menuId: auth.menuId,
      canView: !currentValue,
      canCreate: true,
      canEdit: true,
      canDelete: true
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
      const payload = {
        roleId: this.authForm.roleId,
        menuId: this.authForm.menuId,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
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
      if (this.selectedMenuIds.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Menus Selected',
          text: 'Please select at least one menu to assign'
        });
        return;
      }

      const requests = this.selectedMenuIds.map(menuId => {
        const payload = {
          roleId: this.authForm.roleId,
          menuId: menuId,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        };
        return this.apiService.createAuthorization(payload);
      });

      let completed = 0;
      let failed = 0;
      let errorMessages: string[] = [];

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
                  text: `${completed} succeeded, ${failed} failed`,
                  html: errorMessages.length > 0 ? `<div class="text-sm mt-2">${errorMessages.join('<br>')}</div>` : undefined
                });
              }
              this.loadAllAuthorizations();
              this.closeAuthModal();
            }
          },
          error: (error) => {
            failed++;
            const errorMessage = error?.error?.message || error?.message || 'Failed to assign menu';
            errorMessages.push(errorMessage);
            
            if (completed + failed === requests.length) {
              if (completed === 0) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: errorMessages[0]
                });
              } else {
                Swal.fire({
                  icon: 'warning',
                  title: 'Partially Complete',
                  text: `${completed} succeeded, ${failed} failed`,
                  html: errorMessages.length > 0 ? `<div class="text-sm mt-2">${errorMessages.join('<br>')}</div>` : undefined
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

  getRoleNameById(roleId: string): string {
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
