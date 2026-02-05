import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { PreSales, ScopeVersion, StageHistory, ProjectStage, PROJECT_STAGES, AdvancePayment, SerialNumber } from '../../core/models/pre-sales.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User, UserRole } from '../../core/models/user.model';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-development',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './development.component.html',
  styleUrls: ['./development.component.scss']
})
export class DevelopmentComponent implements OnInit {
  isLoading = false;
  currentUserName = 'Admin User';
  currentUserId: string = '';
  projectStages = PROJECT_STAGES;

  // User Assignment Modal
  isUserAssignmentModalOpen = false;
  selectedProjectForAssignment: PreSales | null = null;
  allUsers: User[] = [];
  developmentUsers: User[] = [];
  filteredDevelopmentUsers: User[] = [];
  selectedUserId: string = '';
  userSearchTerm: string = '';

  // Status Update Modal
  isStatusModalOpen = false;
  selectedProject: PreSales | null = null;
  statusList: any[] = [];
  existingStatusUpdates: any[] = [];
  statusUpdate = {
    notes: '',
    statusCode: ''
  };
  sourceFile: File | null = null;
  compiledFile: File | null = null;
  isDraggingSource = false;
  isDraggingCompiled = false;
  showCompiledFileUpload = false;
  uploadedSourceUrl: string = '';
  uploadedCompiledUrl: string = '';

  // AG Grid Configuration
  columnDefs: ColDef[] = [
    { 
      field: 'projectNo', 
      headerName: 'Project No.', 
      width: 120,
      valueFormatter: (params: any) => {
        if (params.node.rowPinned) {
          return '';
        }
        return params.value || '';
      }
    },
    { 
      field: 'projectName', 
      headerName: 'Project Name', 
      flex: 2,
      minWidth: 180
    },
    { 
      field: 'partyName', 
      headerName: 'Party Name', 
      flex: 2,
      minWidth: 150
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 150,
      cellRenderer: (params: any) => {
        if (params.node.rowPinned) return '';
        const assignedTo = params.data.assignedTo;
        if (assignedTo && assignedTo.trim() !== '') {
          return `<span style="color: #059669; font-weight: 600;">${assignedTo}</span>`;
        }
        return `<span style="color: #9ca3af; font-style: italic;">Unassigned</span>`;
      }
    },
    {
      headerName: 'Actions',
      width: 180,
      cellRenderer: this.actionsCellRenderer.bind(this),
      pinned: 'right',
      sortable: false,
      filter: false,
      cellStyle: { textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  rowData: PreSales[] = [];
  gridApi: any;

  constructor(
    private ngZone: NgZone,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  actionsCellRenderer(params: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex gap-2 h-full items-center justify-end';
    
    // Don't render buttons for pinned rows (total row)
    if (params.node.rowPinned) {
      return container;
    }
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors';
    viewBtn.title = 'View Details';
    viewBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
    viewBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.viewPreSales(params.data));
    });
    
    const statusBtn = document.createElement('button');
    statusBtn.className = 'p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors';
    statusBtn.title = 'Add Status Update';
    statusBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>';
    statusBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.openStatusModal(params.data));
    });
    
    const assignBtn = document.createElement('button');
    assignBtn.className = 'p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors';
    assignBtn.title = 'Assign User';
    assignBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>';
    assignBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.openUserAssignmentModal(params.data));
    });
    
    container.appendChild(viewBtn);
    container.appendChild(statusBtn);
    container.appendChild(assignBtn);
    
    return container;
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadUsers();
    this.loadPreSalesData();
  }

  loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserName = user.name || 'Admin User';
      this.currentUserId = user.id?.toString() || '';
    }
  }

  loadUsers(): void {
    this.apiService.getAllUserMaster().subscribe({
      next: (response: any) => {
        console.log('Users API response:', response);
        // Handle both response formats: direct array or wrapped in success/data
        if (Array.isArray(response)) {
          this.allUsers = response;
        } else if (response.success && response.data) {
          this.allUsers = response.data;
        } else if (response.data) {
          this.allUsers = response.data;
        }
        
        console.log('All users loaded:', this.allUsers);
        // Filter for development team roles
        this.filterDevelopmentUsers();
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  filterDevelopmentUsers(): void {
    // Filter users with "Development Team" role exactly
    this.developmentUsers = this.allUsers.filter(user => {
      const roleName = user.roleName?.trim() || '';
      return roleName === 'Development Team';
    });
    
    console.log('Development Team users:', this.developmentUsers);
    
    // If no development team users found, show all users as fallback
    if (this.developmentUsers.length === 0) {
      console.warn('No Development Team users found, showing all users');
      this.developmentUsers = this.allUsers;
    }
    
    this.filteredDevelopmentUsers = [...this.developmentUsers];
    console.log('Filtered development users:', this.filteredDevelopmentUsers);
  }

  filterUsers(): void {
    const searchTerm = this.userSearchTerm.toLowerCase().trim();
    if (!searchTerm) {
      this.filteredDevelopmentUsers = [...this.developmentUsers];
    } else {
      this.filteredDevelopmentUsers = this.developmentUsers.filter(user =>
        user.userName?.toLowerCase().includes(searchTerm) ||
        user.roleName?.toLowerCase().includes(searchTerm) ||
        user.emailId?.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Map API response to component data structure
  mapApiResponseToPreSales(apiData: any): PreSales {
    return {
      ...apiData,
      scopeHistory: apiData.scopeHistory?.map((scope: any) => ({
        version: scope.version,
        scope: scope.scope,
        modifiedBy: scope.modifiedByName || scope.modifiedBy || 'Unknown',
        modifiedDate: scope.modifiedDate,
        attachments: scope.attachments || []
      })) || [],
      stageHistory: apiData.stageHistory?.map((stage: any) => ({
        stage: stage.stage,
        changedBy: stage.changedByName || stage.changedBy || 'Unknown',
        changedDate: stage.changedDate,
        remarks: stage.remarks
      })) || [],
      advancePayments: apiData.advancePayments?.map((payment: any) => ({
        amount: payment.amount,
        date: payment.date,
        tallyEntryNumber: payment.tallyEntryNumber,
        receivedBy: payment.receivedByName || payment.receivedBy || 'Unknown',
        receivedDate: payment.receivedDate
      })) || [],
      serialNumbers: apiData.serialNumbers?.map((serial: any) => ({
        serialNumber: serial.serialNumber,
        version: serial.version,
        recordedBy: serial.recordedByName || serial.recordedBy || 'Unknown',
        recordedDate: serial.recordedDate
      })) || [],
      attachmentHistory: apiData.attachmentHistory?.map((history: any) => ({
        attachmentUrls: history.attachmentUrls,
        uploadedById: history.uploadedById,
        uploadedByName: history.uploadedByName || 'Unknown',
        uploadedDate: history.uploadedDate
      })) || []
    };
  }

  loadPreSalesData(): void {
    this.isLoading = true;
    // Pass the current user's ID to filter projects
    this.apiService.getAllConfirmedProjects(this.currentUserId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          console.log('Raw API response data:', response.data);
          this.rowData = response.data.map((item: any) => this.mapApiResponseToPreSales(item));
          console.log('Loaded row data:', this.rowData.length, 'rows');
          console.log('First row data:', this.rowData[0]);
          console.log('ProjectValue of first row:', this.rowData[0]?.projectValue);
          
          // Refresh grid cells to update cell renderers (like the stage badge with warning icon)
          if (this.gridApi) {
            this.gridApi.refreshCells({ force: true });
          }
        } else {
          console.warn('No data returned from API, using empty array');
          this.rowData = [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading confirmed projects data:', error);
        Swal.fire('Error', error.error?.message || 'Failed to load data from server', 'error');
        this.rowData = [];
      }
    });
  }

  // User Assignment Modal Methods
  openUserAssignmentModal(project: PreSales): void {
    this.selectedProjectForAssignment = project;
    this.selectedUserId = '';
    this.userSearchTerm = '';
    this.filteredDevelopmentUsers = [...this.developmentUsers];
    this.isUserAssignmentModalOpen = true;
  }

  closeUserAssignmentModal(): void {
    this.isUserAssignmentModalOpen = false;
    this.selectedProjectForAssignment = null;
    this.selectedUserId = '';
    this.userSearchTerm = '';
  }

  assignUserToProject(): void {
    if (!this.selectedProjectForAssignment || !this.selectedUserId) {
      Swal.fire('Error', 'Please select a user', 'error');
      return;
    }

    const selectedUser = this.developmentUsers.find(u => u.userId === this.selectedUserId);
    if (!selectedUser) {
      Swal.fire('Error', 'Invalid user selection', 'error');
      return;
    }

    this.isLoading = true;

    // Call API to assign user - passing selectedUserId as assignedBy
    this.apiService.assignUserToProject(
      this.selectedProjectForAssignment.projectNo,
      this.selectedUserId
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          Swal.fire('Success', 'User assigned successfully', 'success');
          this.closeUserAssignmentModal();
          this.loadPreSalesData(); // Refresh the grid
        } else {
          Swal.fire('Error', response.message || 'Failed to assign user', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error assigning user:', error);
        Swal.fire('Error', error.error?.message || 'Failed to assign user', 'error');
      }
    });
  }

  loadSampleDataOld_REMOVED(): void {
    // Removed hardcoded data - now using API
    this.rowData = [
      {
        projectNo: '2025-NOV-0001',
        partyName: 'Tech Solutions Pvt Ltd',
        projectName: 'ERP Implementation',
        contactPerson: 'Rajesh Kumar',
        mobileNumber: '9876543210',
        emailId: 'rajesh@techsolutions.com',
        agentName: 'Amit Sharma',
        projectValue: 1500000.00,
        scopeOfDevelopment: 'Complete ERP system with inventory, accounting, HR, and CRM modules. Integration with existing systems and third-party APIs required. Mobile app support included.',
        currentStage: 'Quotation' as ProjectStage,
        scopeHistory: [
          {
            version: 1,
            scope: 'Basic ERP system with inventory and accounting modules.',
            modifiedBy: 'Rajesh Kumar',
            modifiedDate: new Date('2025-11-01T10:30:00')
          },
          {
            version: 2,
            scope: 'Complete ERP system with inventory, accounting, and HR modules.',
            modifiedBy: 'Amit Sharma',
            modifiedDate: new Date('2025-11-15T14:45:00')
          },
          {
            version: 3,
            scope: 'Complete ERP system with inventory, accounting, and HR modules. Integration with existing systems required.',
            modifiedBy: 'Admin User',
            modifiedDate: new Date('2025-12-05T09:20:00')
          },
          {
            version: 4,
            scope: 'Complete ERP system with inventory, accounting, HR, and CRM modules. Integration with existing systems and third-party APIs required. Mobile app support included.',
            modifiedBy: 'Amit Sharma',
            modifiedDate: new Date('2026-01-03T11:15:00')
          }
        ],
        stageHistory: [
          {
            stage: 'Pre-Sales',
            changedBy: 'Rajesh Kumar',
            changedDate: new Date('2025-11-01T10:30:00')
          },
          {
            stage: 'Quotation',
            changedBy: 'Amit Sharma',
            changedDate: new Date('2025-12-10T14:00:00')
          }
        ],
        advancePayments: [
          {
            amount: 250000.00,
            date: new Date('2025-12-15'),
            tallyEntryNumber: 'TLY-2025-001234',
            receivedBy: 'Amit Sharma',
            receivedDate: new Date('2025-12-15T10:30:00')
          },
          {
            amount: 150000.00,
            date: new Date('2026-01-05'),
            tallyEntryNumber: 'TLY-2026-000012',
            receivedBy: 'Admin User',
            receivedDate: new Date('2026-01-05T14:20:00')
          }
        ],
        attachmentUrls: []
      },
      {
        projectNo: '2025-DEC-0001',
        partyName: 'Global Enterprises',
        projectName: 'Mobile App Development',
        contactPerson: 'Priya Patel',
        mobileNumber: '9988776655',
        emailId: 'priya@globalenterprises.com',
        agentName: 'Neha Gupta',
        projectValue: 850000.00,
        scopeOfDevelopment: 'Cross-platform mobile application for iOS and Android with backend API integration, push notifications, and analytics dashboard.',
        currentStage: 'Confirmed' as ProjectStage,
        scopeHistory: [
          {
            version: 1,
            scope: 'Cross-platform mobile application for iOS and Android.',
            modifiedBy: 'Neha Gupta',
            modifiedDate: new Date('2025-12-10T16:00:00')
          },
          {
            version: 2,
            scope: 'Cross-platform mobile application for iOS and Android with backend API integration.',
            modifiedBy: 'Admin User',
            modifiedDate: new Date('2025-12-20T13:30:00')
          },
          {
            version: 3,
            scope: 'Cross-platform mobile application for iOS and Android with backend API integration, push notifications, and analytics dashboard.',
            modifiedBy: 'Priya Patel',
            modifiedDate: new Date('2026-01-02T10:00:00')
          }
        ],
        stageHistory: [
          {
            stage: 'Pre-Sales',
            changedBy: 'Neha Gupta',
            changedDate: new Date('2025-12-10T16:00:00')
          },
          {
            stage: 'Quotation',
            changedBy: 'Priya Patel',
            changedDate: new Date('2025-12-22T11:30:00')
          },
          {
            stage: 'Confirmed',
            changedBy: 'Admin User',
            changedDate: new Date('2026-01-04T09:45:00')
          }
        ],
        serialNumbers: [
          {
            serialNumber: 'SN-MOBILE-2026-0001',
            version: 'v1.0.0',
            recordedBy: 'Admin User',
            recordedDate: new Date('2026-01-04T10:15:00')
          },
          {
            serialNumber: 'SN-MOBILE-2026-0002',
            version: 'v1.0.1',
            recordedBy: 'Priya Patel',
            recordedDate: new Date('2026-01-05T11:30:00')
          }
        ],
        attachmentUrls: []
      },
      {
        projectNo: '2025-DEC-0002',
        partyName: 'Retail Chain Co',
        projectName: 'POS System',
        contactPerson: 'Vikram Singh',
        mobileNumber: '9876501234',
        emailId: 'vikram@retailchain.com',
        agentName: 'Ravi Verma',
        projectValue: 2250000.00,
        scopeOfDevelopment: 'Point of Sale system with inventory management, barcode scanning, and real-time reporting for 50+ stores.',
        currentStage: 'Pre-Sales' as ProjectStage,
        scopeHistory: [
          {
            version: 1,
            scope: 'Point of Sale system with inventory management, barcode scanning, and real-time reporting for 50+ stores.',
            modifiedBy: 'Ravi Verma',
            modifiedDate: new Date('2025-12-18T15:20:00')
          }
        ],
        stageHistory: [
          {
            stage: 'Pre-Sales',
            changedBy: 'Ravi Verma',
            changedDate: new Date('2025-12-18T15:20:00')
          }
        ],
        attachmentUrls: []
      },
      {
        projectNo: '2025-DEC-0003',
        partyName: 'Education Hub',
        projectName: 'Learning Management System',
        contactPerson: 'Sneha Reddy',
        mobileNumber: '9123456789',
        emailId: 'sneha@educationhub.com',
        agentName: 'Amit Sharma',
        projectValue: 675000.00,
        scopeOfDevelopment: 'LMS with video streaming, assignment management, student tracking, and parent portal.',
        currentStage: 'Pre-Sales' as ProjectStage,
        scopeHistory: [
          {
            version: 1,
            scope: 'LMS with video streaming, assignment management, student tracking, and parent portal.',
            modifiedBy: 'Amit Sharma',
            modifiedDate: new Date('2025-12-22T11:00:00')
          }
        ],
        stageHistory: [
          {
            stage: 'Pre-Sales',
            changedBy: 'Amit Sharma',
            changedDate: new Date('2025-12-22T11:00:00')
          }
        ],
        attachmentUrls: []
      },
      {
        projectNo: '2025-DEC-0004',
        partyName: 'Healthcare Systems',
        projectName: 'Hospital Management',
        contactPerson: 'Dr. Anil Mehta',
        mobileNumber: '9898989898',
        emailId: 'anil@healthcaresys.com',
        agentName: 'Neha Gupta',
        projectValue: 3200000.00,
        scopeOfDevelopment: 'Comprehensive HMS including patient records, appointments, billing, pharmacy, and lab management.',
        currentStage: 'Pre-Sales' as ProjectStage,
        scopeHistory: [
          {
            version: 1,
            scope: 'Comprehensive HMS including patient records, appointments, billing, pharmacy, and lab management.',
            modifiedBy: 'Neha Gupta',
            modifiedDate: new Date('2025-12-28T14:30:00')
          }
        ],
        stageHistory: [
          {
            stage: 'Pre-Sales',
            changedBy: 'Neha Gupta',
            changedDate: new Date('2025-12-28T14:30:00')
          }
        ],
        attachmentUrls: []
      },
      {
        projectNo: '2026-JAN-0001',
        partyName: 'Manufacturing Corp',
        projectName: 'Inventory Management System',
        contactPerson: 'Suresh Patel',
        mobileNumber: '9123456780',
        emailId: 'suresh@manufacturing.com',
        agentName: 'Ravi Verma',
        projectValue: 1200000.00,
        scopeOfDevelopment: 'Complete inventory management system with warehouse tracking, stock alerts, and reporting dashboard.',
        currentStage: 'Confirmed' as ProjectStage,
        scopeHistory: [
          {
            version: 1,
            scope: 'Complete inventory management system with warehouse tracking, stock alerts, and reporting dashboard.',
            modifiedBy: 'Ravi Verma',
            modifiedDate: new Date('2025-12-20T09:00:00')
          }
        ],
        stageHistory: [
          {
            stage: 'Pre-Sales',
            changedBy: 'Ravi Verma',
            changedDate: new Date('2025-12-20T09:00:00')
          },
          {
            stage: 'Quotation',
            changedBy: 'Suresh Patel',
            changedDate: new Date('2025-12-28T14:00:00')
          },
          {
            stage: 'Confirmed',
            changedBy: 'Admin User',
            changedDate: new Date('2026-01-03T11:00:00')
          }
        ],
        attachmentUrls: []
      }
    ];
    
  }









  viewPreSales(data: PreSales): void {
    // Fetch fresh data from API
    this.isLoading = true;
    const projectNoNumber = typeof data.projectNo === 'string' ? parseInt(data.projectNo, 10) : data.projectNo;
    
    this.apiService.getPreSalesById(projectNoNumber).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          const mappedData = this.mapApiResponseToPreSales(response.data);
          this.showPreSalesDetails(mappedData);
        } else {
          Swal.fire('Error', response.message || 'Failed to load project details', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading project details:', error);
        Swal.fire('Error', error.error?.message || 'Failed to load project details', 'error');
      }
    });
  }

  showPreSalesDetails(data: PreSales): void {
    // Build advance payments section
    let advanceSection = '';
    if (data.advancePayments && data.advancePayments.length > 0) {
      const totalAdvance = data.advancePayments.reduce((sum, adv) => sum + adv.amount, 0);
      advanceSection = `
        <div class="content-section">
          <h2 class="section-title">💰 Advance Payments <span style="color: #059669; font-size: 0.875rem; margin-left: 12px; font-weight: 700;">₹${totalAdvance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span></h2>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th style="text-align: right; min-width: 120px;">Amount</th>
                <th style="text-align: left; min-width: 100px;">Date</th>
                <th style="text-align: left; min-width: 120px;">Tally Entry</th>
                <th style="text-align: left; min-width: 140px;">Received By</th>
                <th style="text-align: left; min-width: 120px;">Received Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.advancePayments.map((adv, idx) => `
                <tr>
                  <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                  <td style="text-align: right;"><span class="amount-value">₹${adv.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span></td>
                  <td style="text-align: left;">${new Date(adv.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style="text-align: left; font-family: monospace; font-size: 0.75rem;">${adv.tallyEntryNumber}</td>
                  <td style="text-align: left; color: #475569;">${adv.receivedBy}</td>
                  <td style="text-align: left; color: #64748b; font-size: 0.75rem;">${new Date(adv.receivedDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      advanceSection = '<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">No advance payments recorded</div><div class="empty-subtext">Payments will appear here once added</div></div>';
    }
    
    // Build serial numbers section
    let serialSection = '';
    if (data.serialNumbers && data.serialNumbers.length > 0) {
      serialSection = `
        <div class="content-section">
          <h2 class="section-title">🔢 Serial Numbers <span style="color: #7c3aed; font-size: 0.875rem; margin-left: 12px; font-weight: 700;">${data.serialNumbers.length} items</span></h2>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">#</th>
                <th style="text-align: left; min-width: 180px;">Serial Number</th>
                <th style="text-align: left; min-width: 100px;">Version</th>
                <th style="text-align: left; min-width: 150px;">Recorded By</th>
                <th style="text-align: left; min-width: 120px;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.serialNumbers.map((serial, idx) => `
                <tr>
                  <td style="text-align: center; color: #64748b;">${idx + 1}</td>
                  <td style="text-align: left;"><span style="font-weight: 700; color: #7c3aed; font-family: monospace; font-size: 0.813rem;">${serial.serialNumber}</span></td>
                  <td style="text-align: left;"><span class="badge badge-version">${serial.version || 'N/A'}</span></td>
                  <td style="text-align: left; color: #475569;">${serial.recordedBy}</td>
                  <td style="text-align: left; color: #64748b; font-size: 0.75rem;">${new Date(serial.recordedDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      serialSection = '<div class="empty-state"><div class="empty-icon">🔢</div><div class="empty-text">No serial numbers assigned</div><div class="empty-subtext">Serial numbers will be listed after assignment</div></div>';
    }
    
    // Build stage history section
    let stageSection = '';
    if (data.stageHistory && data.stageHistory.length > 0) {
      stageSection = `
        <div class="content-section">
          <h2 class="section-title">📊 Stage History <span style="color: #10b981; font-size: 0.875rem; margin-left: 12px; font-weight: 700;">Current: ${data.currentStage}</span></h2>
          <div class="timeline-list">
            ${data.stageHistory.slice().reverse().map((stage, idx) => `
              <div class="timeline-item ${idx === 0 ? 'current' : ''}">
                <div class="timeline-header">
                  <div class="timeline-title">${stage.stage} ${idx === 0 ? '<span class="badge badge-current" style="margin-left: 8px;">CURRENT</span>' : ''}</div>
                  <div class="timeline-date">${new Date(stage.changedDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="timeline-meta">By ${stage.changedBy}</div>
                ${stage.remarks ? '<div class="timeline-content">' + stage.remarks + '</div>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Build scope history section
    let scopeSection = '';
    if (data.scopeHistory && data.scopeHistory.length > 0) {
      const totalVersions = data.scopeHistory.length;
      scopeSection = `
        <div class="content-section">
          <h2 class="section-title">📄 Scope Versions <span style="color: #7c3aed; font-size: 0.875rem; margin-left: 12px; font-weight: 700;">${totalVersions} versions</span></h2>
          <div class="timeline-list">
            ${data.scopeHistory.slice().reverse().map((scope: any, idx: number) => {
              const attachmentsHtml = scope.attachments && scope.attachments.length > 0 ? `
                <div class="timeline-attachments" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                    Attachments (${scope.attachments.length})
                  </div>
                  <div class="attachments-grid">
                    ${scope.attachments.map((attachment: any, attIdx: number) => {
                      const fileName = attachment.fileUrl.split('/').pop() || `Attachment ${attIdx + 1}`;
                      return `
                        <a href="${attachment.fileUrl}" target="_blank" rel="noopener noreferrer" class="attachment-card">
                          <div class="attachment-icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          </div>
                          <div class="attachment-info">
                            <div class="attachment-name">${fileName}</div>
                            <div class="attachment-action">Click to open</div>
                          </div>
                        </a>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : '';
              
              return `
                <div class="timeline-item ${idx === 0 ? 'current' : ''}">
                  <div class="timeline-header">
                    <div class="timeline-title">
                      Version ${scope.version}
                      ${idx === 0 ? '<span class="badge badge-current" style="margin-left: 8px;">CURRENT</span>' : '<span class="badge badge-version" style="margin-left: 8px;">v' + scope.version + '</span>'}
                    </div>
                    <div class="timeline-date">${new Date(scope.modifiedDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div class="timeline-meta">Modified by ${scope.modifiedBy}</div>
                  <div class="timeline-content">${scope.scope}</div>
                  ${attachmentsHtml}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;    }
    
    // Build attachments section
    let attachmentsSection = '';
    if (data.attachmentHistory && data.attachmentHistory.length > 0) {
      const totalFiles = data.attachmentHistory.reduce((sum: number, history: any) => 
        sum + (history.attachmentUrls?.length || 0), 0);
      
      attachmentsSection = `
        <div class="content-section">
          <h2 class="section-title">📎 Attachments <span style="color: #7c3aed; font-size: 0.875rem; margin-left: 12px; font-weight: 700;">${totalFiles} file${totalFiles !== 1 ? 's' : ''}</span></h2>
          ${data.attachmentHistory.map((history: any, historyIdx: number) => {
            const uploadDate = history.uploadedDate ? new Date(history.uploadedDate).toLocaleString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '';
            
            return `
              <div class="upload-batch" style="margin-bottom: ${historyIdx < (data.attachmentHistory?.length || 0) - 1 ? '20px' : '0'};">
                <div class="upload-meta" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #7c3aed;">
                  <div style="flex: 1;">
                    <div style="font-size: 0.813rem; font-weight: 600; color: #1e293b;">
                      <svg width="14" height="14" style="display: inline-block; vertical-align: middle; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      ${history.uploadedByName || 'Unknown User'}
                    </div>
                    <div style="font-size: 0.688rem; color: #64748b; margin-top: 2px;">
                      <svg width="12" height="12" style="display: inline-block; vertical-align: middle; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      ${uploadDate}
                    </div>
                  </div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: #7c3aed; background: #ede9fe; padding: 4px 10px; border-radius: 12px;">
                    ${history.attachmentUrls?.length || 0} file${(history.attachmentUrls?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div class="attachments-grid">
                  ${(history.attachmentUrls || []).map((url: string, idx: number) => {
                    const fileName = url.split('/').pop() || `Attachment ${idx + 1}`;
                    return `
                      <a href="${url}" target="_blank" rel="noopener noreferrer" class="attachment-card">
                        <div class="attachment-icon">
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <div class="attachment-info">
                          <div class="attachment-name">${fileName}</div>
                          <div class="attachment-action">Click to open</div>
                        </div>
                      </a>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    Swal.fire({
      html: `
        <style>
          .swal2-popup.fullscreen-modal {
            width: 98vw !important;
            max-width: 1800px !important;
            height: 95vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #1e293b !important;
            border-radius: 12px !important;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3) !important;
            overflow: hidden !important;
          }
          .swal2-popup.fullscreen-modal .swal2-html-container {
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .swal2-popup.fullscreen-modal .swal2-title,
          .swal2-popup.fullscreen-modal .swal2-header {
            display: none !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 0 !important;
          }
          .swal2-popup.fullscreen-modal .swal2-actions {
            display: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .modal-layout {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100%;
            background: #1e293b;
            margin: 0;
            padding: 0;
          }
          .modal-header-bar {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 12px 20px;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            flex-shrink: 0;
            margin: 0;
          }
          .project-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 6px 0;
            letter-spacing: -0.025em;
          }
          .header-meta {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          }
          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 3px 10px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 4px;
            backdrop-filter: blur(10px);
          }
          .meta-label {
            font-size: 0.625rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-value {
            font-size: 0.813rem;
            color: #ffffff;
            font-weight: 700;
          }
          .content-wrapper {
            display: flex;
            flex: 1;
            overflow: hidden;
          }
          .sidebar-nav {
            width: 180px;
            background: #ffffff;
            border-right: 1px solid #e2e8f0;
            padding: 16px 0;
            overflow-y: auto;
          }
          .nav-item {
            padding: 8px 16px;
            cursor: pointer;
            color: #64748b;
            font-size: 0.813rem;
            font-weight: 500;
            transition: all 0.15s ease;
            border-left: 3px solid transparent;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .nav-item:hover {
            background: #f8fafc;
            color: #334155;
          }
          .nav-item.active {
            background: #ede9fe;
            color: #5b21b6;
            border-left-color: #7c3aed;
            font-weight: 600;
          }
          .nav-icon {
            width: 16px;
            height: 16px;
            opacity: 0.6;
          }
          .nav-item.active .nav-icon {
            opacity: 1;
          }
          .main-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8fafc;
          }
          .tab-panel {
            display: none;
            animation: slideUp 0.2s ease;
          }
          .tab-panel.active {
            display: block;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .content-section {
            background: #ffffff;
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
          }
          .section-title {
            font-size: 1rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 12px;
          }
          .field-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .field-label {
            font-size: 0.688rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .field-value {
            font-size: 0.875rem;
            color: #0f172a;
            font-weight: 500;
            padding: 6px 10px;
            background: #f8fafc;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .timeline-list {
            position: relative;
            padding-left: 24px;
          }
          .timeline-list::before {
            content: '';
            position: absolute;
            left: 6px;
            top: 6px;
            bottom: 6px;
            width: 2px;
            background: linear-gradient(to bottom, #7c3aed, #e2e8f0);
          }
          .timeline-item {
            position: relative;
            padding: 10px 14px;
            margin-bottom: 10px;
            background: #ffffff;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            transition: all 0.15s ease;
          }
          .timeline-item:hover {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
            transform: translateX(3px);
          }
          .timeline-item::before {
            content: '';
            position: absolute;
            left: -18px;
            top: 16px;
            width: 10px;
            height: 10px;
            background: #7c3aed;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 2px #ddd6fe;
          }
          .timeline-item.current::before {
            background: #10b981;
            box-shadow: 0 0 0 2px #d1fae5;
          }
          .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 4px;
          }
          .timeline-title {
            font-size: 0.875rem;
            font-weight: 700;
            color: #1e293b;
          }
          .timeline-date {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 500;
          }
          .timeline-meta {
            font-size: 0.75rem;
            color: #64748b;
          }
          .timeline-content {
            font-size: 0.813rem;
            color: #475569;
            line-height: 1.5;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #f1f5f9;
          }
          .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 0.813rem;
          }
          .data-table thead {
            background: #f8fafc;
          }
          .data-table th {
            padding: 8px 12px;
            text-align: left;
            font-size: 0.688rem;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e2e8f0;
          }
          .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.813rem;
            color: #1e293b;
          }
          .data-table tbody tr {
            transition: background 0.1s ease;
          }
          .data-table tbody tr:hover {
            background: #f8fafc;
          }
          .amount-value {
            font-weight: 700;
            color: #059669;
            font-size: 0.875rem;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.688rem;
            font-weight: 600;
            letter-spacing: 0.025em;
          }
          .badge-current {
            background: #d1fae5;
            color: #065f46;
          }
          .badge-version {
            background: #ddd6fe;
            color: #5b21b6;
          }
          .empty-state {
            text-align: center;
            padding: 50px 20px;
            color: #94a3b8;
          }
          .empty-icon {
            font-size: 3rem;
            margin-bottom: 12px;
            opacity: 0.4;
          }
          .empty-text {
            font-size: 0.938rem;
            font-weight: 600;
            color: #64748b;
          }
          .empty-subtext {
            font-size: 0.813rem;
            color: #94a3b8;
            margin-top: 6px;
          }
          .attachments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
          }
          .attachment-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.15s ease;
            cursor: pointer;
          }
          .attachment-card:hover {
            border-color: #7c3aed;
            box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15);
            transform: translateY(-2px);
          }
          .attachment-icon {
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3f4f6;
            border-radius: 6px;
            color: #7c3aed;
          }
          .attachment-info {
            flex: 1;
            min-width: 0;
          }
          .attachment-name {
            font-size: 0.813rem;
            font-weight: 600;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .attachment-action {
            font-size: 0.688rem;
            color: #64748b;
            margin-top: 2px;
          }
        </style>
        <div class="modal-layout">
          <div class="modal-header-bar">
            <h1 class="project-title">${data.projectName}</h1>
            <div class="header-meta">
              <div class="meta-item">
                <div>
                  <div class="meta-label">Project No</div>
                  <div class="meta-value">#${data.projectNo}</div>
                </div>
              </div>
              <div class="meta-item">
                <div>
                  <div class="meta-label">Project Value</div>
                  <div class="meta-value">${data.projectValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
                </div>
              </div>
              <div class="meta-item">
                <div>
                  <div class="meta-label">Current Stage</div>
                  <div class="meta-value">${data.currentStage}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="content-wrapper">
            <div class="sidebar-nav">
              <div class="nav-item active" data-tab="basic">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Basic Info</span>
              </div>
              <div class="nav-item" data-tab="scope">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <span>Scope</span>
              </div>
              <div class="nav-item" data-tab="serial">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                <span>Serial Numbers</span>
              </div>
            </div>
            
            <div class="main-content">
              <div id="basic" class="tab-panel active">
                <div class="content-section">
                  <h2 class="section-title">📋 Project Details</h2>
                  <div class="info-grid">
                  <div class="field-group">
                    <div class="field-label">Party Name</div>
                    <div class="field-value">${data.partyName}</div>
                  </div>
                  
                  <div class="field-group">
                    <div class="field-label">Contact Person</div>
                    <div class="field-value">${data.contactPerson}</div>
                  </div>
                  
                  <div class="field-group">
                    <div class="field-label">Agent Name</div>
                    <div class="field-value">${data.agentName}</div>
                  </div>
                  
                  <div class="field-group">
                    <div class="field-label">Mobile Number</div>
                    <div class="field-value">${data.mobileNumber}</div>
                  </div>
                  
                  <div class="field-group" style="grid-column: span 2;">
                    <div class="field-label">Email Address</div>
                    <div class="field-value">${data.emailId}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div id="scope" class="tab-panel">
              ${scopeSection}
            </div>
            
            <div id="serial" class="tab-panel">
              ${serialSection}
            </div>
            </div>
          </div>
        </div>
      `,
      width: '95vw',
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        const navItems = document.querySelectorAll('.nav-item');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        navItems.forEach(item => {
          item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            
            if (!tabName) return;
            
            // Remove active class from all nav items and panels
            navItems.forEach(n => n.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked item and corresponding panel
            item.classList.add('active');
            const panelElement = document.getElementById(tabName);
            if (panelElement) {
              panelElement.classList.add('active');
            }
          });
        });
      },
      customClass: {
        popup: 'rounded-xl shadow-2xl fullscreen-modal',
        htmlContainer: ''
      }
    });
  }

  // Status Update Methods
  openStatusModal(project: PreSales): void {
    this.selectedProject = project;
    this.isStatusModalOpen = true;
    this.loadStatuses();
    this.loadExistingStatusUpdates();
    this.resetStatusForm();
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
    this.selectedProject = null;
    this.resetStatusForm();
  }

  resetStatusForm(): void {
    this.statusUpdate = {
      notes: '',
      statusCode: ''
    };
    this.sourceFile = null;
    this.compiledFile = null;
    this.uploadedSourceUrl = '';
    this.uploadedCompiledUrl = '';
    this.showCompiledFileUpload = false;
    this.isDraggingSource = false;
    this.isDraggingCompiled = false;
    this.existingStatusUpdates = [];
  }

  loadStatuses(): void {
    this.apiService.getStatuses().subscribe({
      next: (response) => {
        if (response.success) {
          this.statusList = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        Swal.fire('Error', 'Failed to load status list', 'error');
      }
    });
  }

  loadExistingStatusUpdates(): void {
    if (!this.selectedProject) return;

    const projectNoNumber = typeof this.selectedProject.projectNo === 'string'
      ? parseInt(this.selectedProject.projectNo, 10)
      : this.selectedProject.projectNo;

    this.apiService.getStatusUpdatesByProject(projectNoNumber).subscribe({
      next: (response) => {
        if (response.success) {
          this.existingStatusUpdates = response.data || [];
          // Set default status: last status from history or 'Not Started'
          this.setDefaultStatus();
        }
      },
      error: (error) => {
        console.error('Error loading status updates:', error);
        this.existingStatusUpdates = [];
        // Set default status even on error
        this.setDefaultStatus();
      }
    });
  }

  setDefaultStatus(): void {
    if (this.existingStatusUpdates && this.existingStatusUpdates.length > 0) {
      // Sort by date descending to get the most recent status
      const sortedUpdates = [...this.existingStatusUpdates].sort((a, b) => {
        const dateA = new Date(a.createdDate || a.updatedDate || 0).getTime();
        const dateB = new Date(b.createdDate || b.updatedDate || 0).getTime();
        return dateB - dateA; // Most recent first
      });
      
      // Set to the most recent status from history
      const lastStatus = sortedUpdates[0];
      this.statusUpdate.statusCode = lastStatus.statusCode || lastStatus.status || '';
      
      console.log('[DefaultStatus] Most recent status:', lastStatus.statusCode || lastStatus.status, 'from date:', lastStatus.createdDate || lastStatus.updatedDate);
    } else {
      // Set to 'Not Started' if no history
      const notStartedStatus = this.statusList.find(s => 
        s.statusName?.toLowerCase() === 'not started' || 
        s.statusCode === 'NS'
      );
      if (notStartedStatus) {
        this.statusUpdate.statusCode = notStartedStatus.statusCode;
      }
    }
    // Trigger status change to show/hide compiled file upload
    this.onStatusChange();
  }

  onStatusChange(): void {
    const selectedStatus = this.statusList.find(s => s.statusCode === this.statusUpdate.statusCode);
    if (selectedStatus) {
      // Check if this is Testing Started (TS) or Completed (CP)
      const statusCode = this.statusUpdate.statusCode;
      this.showCompiledFileUpload = statusCode === 'TS' || statusCode === 'CP';
      
      // Clear files when status changes
      if (!this.showCompiledFileUpload) {
        this.compiledFile = null;
        this.uploadedCompiledUrl = '';
      }
    }
  }

  isCompiledFileMandatory(): boolean {
    // Compiled file is mandatory only for Testing Started (TS)
    const statusCode = this.statusUpdate.statusCode;
    return statusCode === 'TS';
  }

  showSourceUpload(): boolean {
    // Show source upload for all statuses except Testing Started (TS)
    // Completed (CP) should show both source and compiled
    const statusCode = this.statusUpdate.statusCode;
    return statusCode !== 'TS';
  }

  onFileChange(event: any, type: 'source' | 'compiled'): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (type === 'source') {
        if (!file.name.endsWith('.zip')) {
          Swal.fire('Invalid File', 'Please select a .zip file for source code', 'error');
          return;
        }
        this.sourceFile = file;
        this.uploadFileImmediately(file, 'source');
      } else {
        if (!file.name.endsWith('.tcp') && !file.name.endsWith('.zip')) {
          Swal.fire('Invalid File', 'Please select a .tcp or .zip file for compiled file', 'error');
          return;
        }
        this.compiledFile = file;
        this.uploadFileImmediately(file, 'compiled');
      }
    }
    event.target.value = '';
  }

  onDragOver(event: DragEvent, type: 'source' | 'compiled'): void {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'source') {
      this.isDraggingSource = true;
    } else {
      this.isDraggingCompiled = true;
    }
  }

  onDragLeave(type: 'source' | 'compiled'): void {
    if (type === 'source') {
      this.isDraggingSource = false;
    } else {
      this.isDraggingCompiled = false;
    }
  }

  onDrop(event: DragEvent, type: 'source' | 'compiled'): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (type === 'source') {
      this.isDraggingSource = false;
    } else {
      this.isDraggingCompiled = false;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (type === 'source') {
        if (!file.name.endsWith('.zip')) {
          Swal.fire('Invalid File', 'Please select a .zip file for source code', 'error');
          return;
        }
        this.sourceFile = file;
        this.uploadFileImmediately(file, 'source');
      } else {
        if (!file.name.endsWith('.tcp') && !file.name.endsWith('.zip')) {
          Swal.fire('Invalid File', 'Please select a .tcp or .zip file for compiled file', 'error');
          return;
        }
        this.compiledFile = file;
        this.uploadFileImmediately(file, 'compiled');
      }
    }
  }

  uploadFileImmediately(file: File, type: 'source' | 'compiled'): void {
    console.log(`[File Upload] Starting upload for ${type} file:`, file.name);
    
    // Show loading message
    Swal.fire({
      title: 'Uploading File',
      html: `<div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <div class="spinner-border" role="status" style="width: 3rem; height: 3rem; border: 4px solid #f3f4f6; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin: 0; color: #6b7280;">Processing ${type} file...</p>
        <p style="margin: 0; font-size: 0.875rem; color: #9ca3af;">${file.name}</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    this.apiService.uploadPreSalesAttachment(file).subscribe({
      next: (response) => {
        console.log(`[File Upload] Full Response for ${type}:`, JSON.stringify(response, null, 2));
        console.log(`[File Upload] Response type:`, typeof response);
        console.log(`[File Upload] Response keys:`, response ? Object.keys(response) : 'null');
        
        if (response) {
          // API returns {fullUrlPath, filename, contentType} directly
          const url = response.fullUrlPath || response.data?.fullUrlPath || response.data;
          console.log(`[File Upload] Extracted URL for ${type}:`, url);
          console.log(`[File Upload] response.fullUrlPath:`, response.fullUrlPath);
          console.log(`[File Upload] response.data:`, response.data);
          console.log(`[File Upload] response.data?.fullUrlPath:`, response.data?.fullUrlPath);
          
          if (!url) {
            console.error(`[File Upload] WARNING: URL is empty/undefined for ${type}!`);
            Swal.fire({
              icon: 'warning',
              title: 'Upload Warning',
              text: `File uploaded but no URL returned for ${type} file`,
              confirmButtonColor: '#3b82f6'
            });
          } else {
            // Close loading and show success
            Swal.fire({
              icon: 'success',
              title: 'Upload Successful',
              text: `${type.charAt(0).toUpperCase() + type.slice(1)} file uploaded successfully`,
              timer: 1500,
              showConfirmButton: false
            });
          }
          
          if (type === 'source') {
            this.uploadedSourceUrl = url || '';
            console.log('[File Upload] Source URL saved:', this.uploadedSourceUrl);
          } else {
            this.uploadedCompiledUrl = url || '';
            console.log('[File Upload] Compiled URL saved:', this.uploadedCompiledUrl);
          }
        } else {
          console.error(`[File Upload] Response is null/undefined for ${type}`);
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'No response received from server',
            confirmButtonColor: '#dc2626'
          });
        }
      },
      error: (error) => {
        console.error(`[File Upload] Error uploading ${type} file:`, error);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: `Failed to upload ${type} file. Please try again.`,
          confirmButtonColor: '#dc2626'
        });
        if (type === 'source') {
          this.sourceFile = null;
        } else {
          this.compiledFile = null;
        }
      }
    });
  }

  removeFile(type: 'source' | 'compiled'): void {
    if (type === 'source') {
      this.sourceFile = null;
      this.uploadedSourceUrl = '';
    } else {
      this.compiledFile = null;
      this.uploadedCompiledUrl = '';
    }
  }

  submitStatusUpdate(): void {
    if (!this.statusUpdate.notes || !this.statusUpdate.statusCode) {
      Swal.fire('Validation Error', 'Please fill in all required fields', 'error');
      return;
    }

    // Validate Testing Started (TS) requires compiled file
    const statusCode = this.statusUpdate.statusCode;
    if (statusCode === 'TS' && !this.uploadedCompiledUrl) {
      Swal.fire({
        icon: 'error',
        title: 'Compiled File Required',
        text: 'Testing Started status requires compiled file (.tcp or .zip) to be uploaded',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    if (!this.selectedProject) {
      return;
    }

    this.isLoading = true;

    const attachments = [];
    console.log('[Submit] Current uploadedSourceUrl:', this.uploadedSourceUrl);
    console.log('[Submit] Current uploadedCompiledUrl:', this.uploadedCompiledUrl);
    
    if (this.uploadedSourceUrl) {
      console.log('[Submit] Adding source URL to attachments:', this.uploadedSourceUrl);
      attachments.push(this.uploadedSourceUrl);
    } else {
      console.log('[Submit] No source URL to add (empty or undefined)');
    }
    if (this.uploadedCompiledUrl) {
      console.log('[Submit] Adding compiled URL to attachments:', this.uploadedCompiledUrl);
      attachments.push(this.uploadedCompiledUrl);
    } else {
      console.log('[Submit] No compiled URL to add (empty or undefined)');
    }

    console.log('[Submit] Total attachments:', attachments);
    console.log('[Submit] Attachments length:', attachments.length);
    console.log('[Submit] Attachments array contents:', JSON.stringify(attachments));

    const projectNoNumber = typeof this.selectedProject.projectNo === 'string' 
      ? parseInt(this.selectedProject.projectNo, 10) 
      : this.selectedProject.projectNo;

    const payload = {
      notes: this.statusUpdate.notes,
      status: this.statusUpdate.statusCode,
      attachmentUrls: attachments,
      createdBy: this.currentUserId
    };

    console.log('[Submit] Final payload:', payload);
    console.log('[Submit] Project number:', projectNoNumber);

    this.apiService.createStatusUpdate(projectNoNumber, payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          Swal.fire('Success', 'Status update added successfully', 'success');
          this.resetStatusForm();
          this.loadExistingStatusUpdates(); // Refresh the status updates table and set new default
          this.loadPreSalesData(); // Refresh the grid
        } else {
          Swal.fire('Error', response.message || 'Failed to add status update', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error adding status update:', error);
        Swal.fire('Error', error.error?.message || 'Failed to add status update', 'error');
      }
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  onFilterChanged(): void {
    // Filter changed - grid handles display automatically
  }
}
