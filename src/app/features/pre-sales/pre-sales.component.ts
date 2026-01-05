import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { PreSales, ScopeVersion, StageHistory, ProjectStage, PROJECT_STAGES, AdvancePayment, SerialNumber } from '../../core/models/pre-sales.model';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-pre-sales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AgGridAngular],
  templateUrl: './pre-sales.component.html',
  styleUrls: ['./pre-sales.component.scss']
})
export class PreSalesComponent implements OnInit {
  preSalesForm!: FormGroup;
  advanceForm!: FormGroup;
  serialForm!: FormGroup;
  isModalOpen = false;
  isAdvanceModalOpen = false;
  isSerialModalOpen = false;
  isLoading = false;
  isEditMode = false;
  editingIndex: number = -1;
  editingRecord: PreSales | null = null;
  selectedProjectForAdvance: PreSales | null = null;
  selectedProjectIndex: number = -1;
  selectedProjectForSerial: PreSales | null = null;
  selectedProjectIndexForSerial: number = -1;
  isDragging = false;
  selectedFiles: File[] = [];
  currentUserName = 'Admin User'; // This should come from auth service
  scopeHistoryExpanded = false;
  projectStages = PROJECT_STAGES;
  stageHistoryExpanded = false;

  // AG Grid Configuration
  columnDefs: ColDef[] = [
    { 
      field: 'projectNo', 
      headerName: 'Project No.', 
      width: 180
    },
    { 
      field: 'projectName', 
      headerName: 'Project Name', 
      flex: 1,
      minWidth: 200
    },
    { 
      field: 'partyName', 
      headerName: 'Party Name', 
      flex: 1,
      minWidth: 180
    },
    { 
      field: 'projectValue', 
      headerName: 'Value', 
      width: 150,
      valueFormatter: (params: any) => {
        if (params.value != null) {
          return params.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        return '';
      },
      cellStyle: (params: any): any => {
        if (params.node.rowPinned) {
          return { 'font-weight': 'bold', 'background-color': '#f3f4f6', 'text-align': 'right' };
        }
        return { 'text-align': 'right' };
      }
    },
    { 
      field: 'currentStage', 
      headerName: 'Stage', 
      width: 180,
      cellRenderer: (params: any) => {
        const stage = params.value;
        const colors: { [key: string]: string } = {
          'Pre-Sales': 'bg-blue-100 text-blue-800',
          'Quotation': 'bg-yellow-100 text-yellow-800',
          'Confirmed': 'bg-green-100 text-green-800',
          'Development': 'bg-purple-100 text-purple-800',
          'Completed': 'bg-gray-100 text-gray-800'
        };
        
        // Check if confirmed stage but no serial numbers
        const needsSerial = stage === 'Confirmed' && (!params.data.serialNumbers || params.data.serialNumbers.length === 0);
        
        const container = document.createElement('span');
        container.className = `px-2 py-1 text-xs font-medium rounded ${colors[stage] || 'bg-gray-100 text-gray-800'}`;
        container.textContent = stage;
        
        if (needsSerial) {
          const warningWrapper = document.createElement('span');
          warningWrapper.className = 'text-red-600 ml-1 inline-flex items-center cursor-help';
          warningWrapper.title = 'Serial number required for confirmed projects';
          warningWrapper.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
          warningWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            this.ngZone.run(() => {
              Swal.fire({
                icon: 'warning',
                title: 'Serial Number Required',
                text: 'This project is in Confirmed stage but has no serial numbers added. Please add at least one serial number using the Serial button.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#6366f1'
              });
            });
          });
          container.appendChild(warningWrapper);
        }
        
        return container;
      }
    },
    {
      headerName: 'Actions',
      width: 260,
      cellRenderer: this.actionsCellRenderer.bind(this),
      pinned: 'right',
      sortable: false,
      filter: false,
      cellStyle: { textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  rowData: PreSales[] = [];
  pinnedBottomRowData: any[] = [];
  gridApi: any;

  constructor(private fb: FormBuilder, private ngZone: NgZone) {}

  actionsCellRenderer(params: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex gap-2 h-full items-center justify-center';
    
    // Don't render buttons for pinned rows (total row)
    if (params.node.rowPinned) {
      return container;
    }
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors';
    viewBtn.title = 'View';
    viewBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
    viewBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.viewPreSales(params.data));
    });
    
    const editBtn = document.createElement('button');
    editBtn.className = 'p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors';
    editBtn.title = 'Edit';
    editBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
    editBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.editPreSales(params.data, params.rowIndex));
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
    deleteBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.deletePreSales(params.rowIndex));
    });
    
    // Append buttons in order: Serial (conditional), Advance (conditional), View, Edit, Delete
    
    // Show Serial button if stage is Confirmed
    if (params.data.currentStage === 'Confirmed') {
      const serialBtn = document.createElement('button');
      serialBtn.className = 'p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors';
      serialBtn.title = 'Add Serial Number';
      serialBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>';
      serialBtn.addEventListener('click', () => {
        this.ngZone.run(() => this.openSerialModal(params.data, params.rowIndex));
      });
      container.appendChild(serialBtn);
    }
    
    // Show Advance button if stage is Quotation or Confirmed
    if (params.data.currentStage === 'Quotation' || params.data.currentStage === 'Confirmed') {
      const advanceBtn = document.createElement('button');
      advanceBtn.className = 'p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors';
      advanceBtn.title = 'Add Advance';
      advanceBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
      advanceBtn.addEventListener('click', () => {
        this.ngZone.run(() => this.openAdvanceModal(params.data, params.rowIndex));
      });
      container.appendChild(advanceBtn);
    }
    
    container.appendChild(viewBtn);
    container.appendChild(editBtn);
    container.appendChild(deleteBtn);
    
    return container;
  }

  ngOnInit(): void {
    this.initForm();
    this.initAdvanceForm();
    this.initSerialForm();
    this.loadSampleData();
  }

  loadSampleData(): void {
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
    
    this.updateTotalRow();
  }
  
  updateTotalRow(): void {
    let total = 0;
    
    if (this.gridApi) {
      // Calculate total from filtered/displayed rows only
      this.gridApi.forEachNodeAfterFilter((node: any) => {
        if (node.data && node.data.projectValue) {
          total += node.data.projectValue;
        }
      });
    } else {
      // Fallback: calculate from all rows if grid API not available yet
      total = this.rowData.reduce((sum, project) => sum + (project.projectValue || 0), 0);
    }
    
    this.pinnedBottomRowData = [
      {
        projectNo: '',
        partyName: '',
        projectName: 'Total',
        projectValue: total,
        currentStage: '',
        actions: ''
      }
    ];
  }

  initForm(): void {
    this.preSalesForm = this.fb.group({
      partyName: ['', [Validators.required, Validators.minLength(3)]],
      projectName: ['', [Validators.required, Validators.minLength(3)]],
      contactPerson: ['', [Validators.required, Validators.minLength(3)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      emailId: ['', [Validators.required, Validators.email]],
      agentName: ['', [Validators.required, Validators.minLength(3)]],
      projectValue: ['', [Validators.required, Validators.min(0)]],
      scopeOfDevelopment: ['', [Validators.required, Validators.minLength(10)]],
      currentStage: ['Pre-Sales', Validators.required],
      attachments: [null]
    });
  }

  initAdvanceForm(): void {
    this.advanceForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      date: ['', Validators.required],
      tallyEntryNumber: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  initSerialForm(): void {
    this.serialForm = this.fb.group({
      serialNumber: ['', [Validators.required, Validators.minLength(1)]],
      version: [''] // Optional field
    });
  }

  openModal(): void {
    this.isEditMode = false;
    this.editingIndex = -1;
    this.preSalesForm.reset();
    this.selectedFiles = [];
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.preSalesForm.reset();
    this.selectedFiles = [];
    this.isEditMode = false;
    this.editingIndex = -1;
    this.editingRecord = null;
    this.scopeHistoryExpanded = false;
  }

  onSubmit(): void {
    if (this.preSalesForm.invalid) {
      Object.keys(this.preSalesForm.controls).forEach(key => {
        this.preSalesForm.controls[key].markAsTouched();
      });
      Swal.fire('Validation Error', 'Please fill all required fields correctly', 'error');
      return;
    }

    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      const formValue = this.preSalesForm.value;
      
      if (this.isEditMode && this.editingIndex >= 0) {
        // Update existing record
        const existingRecord = this.rowData[this.editingIndex];
        const scopeChanged = existingRecord.scopeOfDevelopment !== formValue.scopeOfDevelopment;
        const stageChanged = existingRecord.currentStage !== formValue.currentStage;
        
        // Check if stage is being reverted
        const currentStageIndex = PROJECT_STAGES.indexOf(existingRecord.currentStage);
        const newStageIndex = PROJECT_STAGES.indexOf(formValue.currentStage);
        
        if (stageChanged && newStageIndex < currentStageIndex) {
          this.isLoading = false;
          Swal.fire('Invalid Stage Change', 'Cannot revert to a previous stage. Stages can only progress forward.', 'error');
          return;
        }
        
        // Create new scope version if scope changed
        let updatedScopeHistory = existingRecord.scopeHistory || [];
        if (scopeChanged) {
          const newVersion: ScopeVersion = {
            version: (updatedScopeHistory.length || 0) + 1,
            scope: formValue.scopeOfDevelopment,
            modifiedBy: this.currentUserName,
            modifiedDate: new Date()
          };
          updatedScopeHistory = [...updatedScopeHistory, newVersion];
        }
        
        // Create stage history entry if stage changed
        let updatedStageHistory = existingRecord.stageHistory || [];
        if (stageChanged) {
          const newStageEntry: StageHistory = {
            stage: formValue.currentStage,
            changedBy: this.currentUserName,
            changedDate: new Date()
          };
          updatedStageHistory = [...updatedStageHistory, newStageEntry];
        }
        
        this.rowData[this.editingIndex] = {
          projectNo: existingRecord.projectNo,
          ...formValue,
          projectValue: parseFloat(formValue.projectValue),
          scopeHistory: updatedScopeHistory,
          stageHistory: updatedStageHistory,
          attachmentUrls: []
        };
        
        let message = 'Pre-sales record updated successfully';
        if (scopeChanged) message += ' (New scope version created)';
        if (stageChanged) message += ` (Stage updated to ${formValue.currentStage})`;
        
        Swal.fire('Success', message, 'success');
      } else {
        // Add new record - Generate project number in YYYY-MMM-XXXX format
        const now = new Date();
        const year = now.getFullYear();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = monthNames[now.getMonth()];
        
        // Extract sequence numbers from existing project numbers for current month
        const currentMonthPrefix = `${year}-${month}-`;
        const existingSequences = this.rowData
          .filter(r => r.projectNo.startsWith(currentMonthPrefix))
          .map(r => parseInt(r.projectNo.split('-')[2]))
          .filter(n => !isNaN(n));
        
        const nextSequence = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
        const newProjectNo = `${year}-${month}-${nextSequence.toString().padStart(4, '0')}`;
        
        const initialScopeVersion: ScopeVersion = {
          version: 1,
          scope: formValue.scopeOfDevelopment,
          modifiedBy: this.currentUserName,
          modifiedDate: new Date()
        };
        
        const initialStageEntry: StageHistory = {
          stage: formValue.currentStage,
          changedBy: this.currentUserName,
          changedDate: new Date()
        };
        
        const newRecord: PreSales = {
          projectNo: newProjectNo,
          ...formValue,
          projectValue: parseFloat(formValue.projectValue),
          scopeHistory: [initialScopeVersion],
          stageHistory: [initialStageEntry],
          attachmentUrls: []
        };
        
        this.rowData = [newRecord, ...this.rowData];
        
        Swal.fire('Success', 'Pre-sales record added successfully', 'success');
      }
      
      this.updateTotalRow();
      this.isLoading = false;
      this.closeModal();
    }, 1000);
  }

  viewPreSales(data: PreSales): void {
    // Build advance payments section
    let advanceSection = '';
    if (data.advancePayments && data.advancePayments.length > 0) {
      const totalAdvance = data.advancePayments.reduce((sum, adv) => sum + adv.amount, 0);
      advanceSection = `
        <div class="content-section">
          <h2 class="section-title">💰 Advance Payments <span style="color: #059669; font-size: 1.125rem; margin-left: 16px;">Total: ${totalAdvance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span></h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Tally Entry</th>
                <th>Received By</th>
              </tr>
            </thead>
            <tbody>
              ${data.advancePayments.map((adv, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><span class="amount-value">${adv.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span></td>
                  <td>${new Date(adv.date).toLocaleDateString()}</td>
                  <td>${adv.tallyEntryNumber}</td>
                  <td>${adv.receivedBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      advanceSection = '<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">No advance payments recorded</div><div class="empty-subtext">Payments will appear here once they are added</div></div>';
    }
    
    // Build serial numbers section
    let serialSection = '';
    if (data.serialNumbers && data.serialNumbers.length > 0) {
      serialSection = `
        <div class="content-section">
          <h2 class="section-title">🔢 Serial Numbers <span style="color: #3b82f6; font-size: 1.125rem; margin-left: 16px;">Total: ${data.serialNumbers.length}</span></h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Serial Number</th>
                <th>Version</th>
                <th>Recorded By</th>
                <th>Recorded Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.serialNumbers.map((serial, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><span style="font-weight: 700; color: #3b82f6;">${serial.serialNumber}</span></td>
                  <td>${serial.version || 'N/A'}</td>
                  <td>${serial.recordedBy}</td>
                  <td>${new Date(serial.recordedDate).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      serialSection = '<div class="empty-state"><div class="empty-icon">🔢</div><div class="empty-text">No serial numbers assigned</div><div class="empty-subtext">Serial numbers will be listed here after assignment</div></div>';
    }
    
    // Build stage history section
    let stageSection = '';
    if (data.stageHistory && data.stageHistory.length > 0) {
      stageSection = `
        <div class="content-section">
          <h2 class="section-title">📊 Stage History <span style="color: #10b981; font-size: 1.125rem; margin-left: 16px;">Current: ${data.currentStage}</span></h2>
          <div class="timeline-list">
            ${data.stageHistory.slice().reverse().map((stage, idx) => `
              <div class="timeline-item ${idx === 0 ? 'current' : ''}">
                <div class="timeline-header">
                  <div class="timeline-title">${stage.stage}</div>
                  <div class="timeline-date">${new Date(stage.changedDate).toLocaleDateString()}</div>
                </div>
                <div class="timeline-meta">Changed by: ${stage.changedBy}</div>
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
          <h2 class="section-title">📄 Scope Versions <span style="color: #3b82f6; font-size: 1.125rem; margin-left: 16px;">Total: ${totalVersions}</span></h2>
          <div class="timeline-list">
            ${data.scopeHistory.slice().reverse().map((scope, idx) => `
              <div class="timeline-item ${idx === 0 ? 'current' : ''}">
                <div class="timeline-header">
                  <div class="timeline-title">
                    Version ${scope.version}
                    ${idx === 0 ? '<span class="badge badge-current" style="margin-left: 12px;">CURRENT</span>' : '<span class="badge badge-version" style="margin-left: 12px;">v' + scope.version + '</span>'}
                  </div>
                  <div class="timeline-date">${new Date(scope.modifiedDate).toLocaleDateString()}</div>
                </div>
                <div class="timeline-meta">Modified by: ${scope.modifiedBy}</div>
                <div class="timeline-content">${scope.scope}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    Swal.fire({
      html: `
        <style>
          .swal2-popup.fullscreen-modal {
            width: 96vw !important;
            max-width: 1600px !important;
            height: 92vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border-radius: 16px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          }
          .swal2-popup.fullscreen-modal .swal2-html-container {
            height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .modal-layout {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #fafbfc;
          }
          .modal-header-bar {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 24px 32px;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .project-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 16px 0;
            letter-spacing: -0.025em;
          }
          .header-meta {
            display: flex;
            gap: 24px;
            align-items: center;
          }
          .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            backdrop-filter: blur(10px);
          }
          .meta-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-value {
            font-size: 1rem;
            color: #ffffff;
            font-weight: 700;
          }
          .content-wrapper {
            display: flex;
            flex: 1;
            overflow: hidden;
          }
          .sidebar-nav {
            width: 220px;
            background: #ffffff;
            border-right: 1px solid #e2e8f0;
            padding: 24px 0;
            overflow-y: auto;
          }
          .nav-item {
            padding: 12px 24px;
            cursor: pointer;
            color: #64748b;
            font-size: 0.938rem;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: 3px solid transparent;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .nav-item:hover {
            background: #f8fafc;
            color: #334155;
          }
          .nav-item.active {
            background: #f1f5f9;
            color: #1e293b;
            border-left-color: #3b82f6;
            font-weight: 600;
          }
          .nav-icon {
            width: 20px;
            height: 20px;
            opacity: 0.6;
          }
          .nav-item.active .nav-icon {
            opacity: 1;
          }
          .main-content {
            flex: 1;
            overflow-y: auto;
            padding: 32px;
            background: #fafbfc;
          }
          .tab-panel {
            display: none;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .tab-panel.active {
            display: block;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .content-section {
            background: #ffffff;
            border-radius: 12px;
            padding: 28px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            margin-bottom: 24px;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 2px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
          }
          .field-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .field-label {
            font-size: 0.813rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .field-value {
            font-size: 1rem;
            color: #0f172a;
            font-weight: 500;
            padding: 10px 14px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .timeline-list {
            position: relative;
            padding-left: 32px;
          }
          .timeline-list::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 8px;
            bottom: 8px;
            width: 2px;
            background: linear-gradient(to bottom, #3b82f6, #e2e8f0);
          }
          .timeline-item {
            position: relative;
            padding: 16px 20px;
            margin-bottom: 16px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
          }
          .timeline-item:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: translateX(4px);
          }
          .timeline-item::before {
            content: '';
            position: absolute;
            left: -24px;
            top: 24px;
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 3px #dbeafe;
          }
          .timeline-item.current::before {
            background: #10b981;
            box-shadow: 0 0 0 3px #d1fae5;
          }
          .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 8px;
          }
          .timeline-title {
            font-size: 1rem;
            font-weight: 700;
            color: #1e293b;
          }
          .timeline-date {
            font-size: 0.813rem;
            color: #64748b;
            font-weight: 500;
          }
          .timeline-meta {
            font-size: 0.875rem;
            color: #64748b;
          }
          .timeline-content {
            font-size: 0.938rem;
            color: #475569;
            line-height: 1.6;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f1f5f9;
          }
          .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }
          .data-table thead {
            background: #f8fafc;
          }
          .data-table th {
            padding: 12px 16px;
            text-align: left;
            font-size: 0.813rem;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e2e8f0;
          }
          .data-table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.938rem;
            color: #1e293b;
          }
          .data-table tbody tr {
            transition: background 0.15s ease;
          }
          .data-table tbody tr:hover {
            background: #f8fafc;
          }
          .amount-value {
            font-weight: 700;
            color: #059669;
            font-size: 1rem;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.813rem;
            font-weight: 600;
            letter-spacing: 0.025em;
          }
          .badge-current {
            background: #d1fae5;
            color: #065f46;
          }
          .badge-version {
            background: #dbeafe;
            color: #1e40af;
          }
          .empty-state {
            text-align: center;
            padding: 80px 24px;
            color: #94a3b8;
          }
          .empty-icon {
            font-size: 4rem;
            margin-bottom: 16px;
            opacity: 0.4;
          }
          .empty-text {
            font-size: 1.125rem;
            font-weight: 600;
            color: #64748b;
          }
          .empty-subtext {
            font-size: 0.938rem;
            color: #94a3b8;
            margin-top: 8px;
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
              <div class="nav-item" data-tab="stage">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                <span>Stage History</span>
              </div>
              <div class="nav-item" data-tab="scope">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <span>Scope</span>
              </div>
              <div class="nav-item" data-tab="advance">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <span>Advance Payments</span>
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
            
            <div id="stage" class="tab-panel">
              ${stageSection}
            </div>
            
            <div id="scope" class="tab-panel">
              ${scopeSection}
            </div>
            
            <div id="advance" class="tab-panel">
              ${advanceSection}
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

  editPreSales(data: PreSales, index: number): void {
    this.isEditMode = true;
    this.editingIndex = index;
    this.editingRecord = data;
    this.scopeHistoryExpanded = false;
    this.stageHistoryExpanded = false;
    
    this.preSalesForm.patchValue({
      partyName: data.partyName,
      projectName: data.projectName,
      contactPerson: data.contactPerson,
      mobileNumber: data.mobileNumber,
      emailId: data.emailId,
      agentName: data.agentName,
      projectValue: data.projectValue,
      scopeOfDevelopment: data.scopeOfDevelopment,
      currentStage: data.currentStage
    });
    
    this.isModalOpen = true;
  }

  deletePreSales(index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this pre-sales record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        
        setTimeout(() => {
          this.rowData = this.rowData.filter((_, i) => i !== index);
          this.updateTotalRow();
          this.isLoading = false;
          
          Swal.fire('Deleted!', 'Pre-sales record has been deleted.', 'success');
        }, 500);
      }
    });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.preSalesForm.patchValue({ attachments: this.selectedFiles });
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.preSalesForm.patchValue({ attachments: this.selectedFiles });
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.preSalesForm.patchValue({ attachments: this.selectedFiles });
  }

  viewScopeHistory(data: PreSales): void {
    const scopeHistory = data.scopeHistory || [];
    
    if (scopeHistory.length === 0) {
      Swal.fire('No History', 'No scope history available for this project.', 'info');
      return;
    }
    
    const historyHtml = scopeHistory
      .slice()
      .reverse()
      .map(version => `
        <div class="mb-4 border-l-4 ${version.version === scopeHistory.length ? 'border-green-500' : 'border-gray-300'} pl-3 py-2 bg-gray-50 rounded">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-bold ${version.version === scopeHistory.length ? 'text-green-600' : 'text-gray-700'}">
              Version ${version.version} ${version.version === scopeHistory.length ? '(Current)' : ''}
            </span>
            <span class="text-xs text-gray-500">
              ${new Date(version.modifiedDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <p class="text-xs text-gray-600 mb-1">Modified by: <strong>${version.modifiedBy}</strong></p>
          <p class="text-sm text-gray-700 leading-relaxed bg-white p-2 rounded border border-gray-200">${version.scope}</p>
        </div>
      `)
      .join('');
    
    Swal.fire({
      title: '<div class="text-left"><strong class="text-xl text-gray-800">Scope History - ' + data.projectName + '</strong></div>',
      html: '<div class="text-left max-h-96 overflow-y-auto"><p class="text-sm text-gray-600 mb-4">Total versions: ' + scopeHistory.length + '</p>' + historyHtml + '</div>',
      width: 800,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'border-b pb-3',
        htmlContainer: 'pt-4'
      }
    });
  }

  viewCurrentScopeHistory(): void {
    if (this.editingIndex >= 0) {
      this.viewScopeHistory(this.rowData[this.editingIndex]);
    }
  }

  toggleScopeHistoryExpanded(): void {
    this.scopeHistoryExpanded = !this.scopeHistoryExpanded;
  }

  getReversedScopeHistory(): ScopeVersion[] {
    if (!this.editingRecord?.scopeHistory) return [];
    return [...this.editingRecord.scopeHistory].reverse();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  toggleStageHistoryExpanded(): void {
    this.stageHistoryExpanded = !this.stageHistoryExpanded;
  }

  getReversedStageHistory(): StageHistory[] {
    if (!this.editingRecord?.stageHistory) return [];
    return [...this.editingRecord.stageHistory].reverse();
  }

  needsSerialNumber(data: PreSales): boolean {
    return data.currentStage === 'Confirmed' && (!data.serialNumbers || data.serialNumbers.length === 0);
  }

  getAvailableStages(): ProjectStage[] {
    if (!this.isEditMode || !this.editingRecord) {
      return PROJECT_STAGES;
    }
    
    const currentStageIndex = PROJECT_STAGES.indexOf(this.editingRecord.currentStage);
    // Only show current stage and forward stages
    return PROJECT_STAGES.slice(currentStageIndex);
  }

  openAdvanceModal(data: PreSales, index: number): void {
    this.selectedProjectForAdvance = data;
    this.selectedProjectIndex = index;
    this.advanceForm.reset();
    this.isAdvanceModalOpen = true;
  }

  closeAdvanceModal(): void {
    this.isAdvanceModalOpen = false;
    this.selectedProjectForAdvance = null;
    this.selectedProjectIndex = -1;
    this.advanceForm.reset();
  }

  onAdvanceSubmit(): void {
    if (this.advanceForm.invalid) {
      Object.keys(this.advanceForm.controls).forEach(key => {
        this.advanceForm.controls[key].markAsTouched();
      });
      Swal.fire('Validation Error', 'Please fill all required fields correctly', 'error');
      return;
    }

    if (this.selectedProjectIndex < 0) {
      Swal.fire('Error', 'No project selected', 'error');
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      const formValue = this.advanceForm.value;
      const existingRecord = this.rowData[this.selectedProjectIndex];
      
      const newAdvance: AdvancePayment = {
        amount: parseFloat(formValue.amount),
        date: new Date(formValue.date),
        tallyEntryNumber: formValue.tallyEntryNumber,
        receivedBy: this.currentUserName,
        receivedDate: new Date()
      };

      const updatedAdvances = [...(existingRecord.advancePayments || []), newAdvance];
      
      this.rowData[this.selectedProjectIndex] = {
        ...existingRecord,
        advancePayments: updatedAdvances
      };

      const totalAdvance = updatedAdvances.reduce((sum, adv) => sum + adv.amount, 0);
      
      this.isLoading = false;
      this.closeAdvanceModal();
      
      Swal.fire({
        title: 'Success',
        html: 'Advance payment of Rs. ' + formValue.amount.toFixed(2) + ' added successfully!<br><small>Total advance: Rs. ' + totalAdvance.toFixed(2) + '</small>',
        icon: 'success'
      });
    }, 500);
  }

  getTotalAdvance(data: PreSales): number {
    if (!data.advancePayments || data.advancePayments.length === 0) return 0;
    return data.advancePayments.reduce((sum, adv) => sum + adv.amount, 0);
  }

  openSerialModal(data: PreSales, index: number): void {
    this.selectedProjectForSerial = data;
    this.selectedProjectIndexForSerial = index;
    this.serialForm.reset();
    this.isSerialModalOpen = true;
  }

  closeSerialModal(): void {
    this.isSerialModalOpen = false;
    this.selectedProjectForSerial = null;
    this.selectedProjectIndexForSerial = -1;
    this.serialForm.reset();
  }

  onSerialSubmit(): void {
    if (this.serialForm.get('serialNumber')?.invalid) {
      this.serialForm.get('serialNumber')?.markAsTouched();
      Swal.fire('Validation Error', 'Please enter a serial number', 'error');
      return;
    }

    if (this.selectedProjectIndexForSerial < 0) {
      Swal.fire('Error', 'No project selected', 'error');
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      const formValue = this.serialForm.value;
      const existingRecord = this.rowData[this.selectedProjectIndexForSerial];
      
      const newSerial: SerialNumber = {
        serialNumber: formValue.serialNumber,
        version: formValue.version || undefined,
        recordedBy: this.currentUserName,
        recordedDate: new Date()
      };

      const updatedSerials = [...(existingRecord.serialNumbers || []), newSerial];
      
      this.rowData[this.selectedProjectIndexForSerial] = {
        ...existingRecord,
        serialNumbers: updatedSerials
      };
      
      this.isLoading = false;
      this.closeSerialModal();
      
      Swal.fire({
        title: 'Success',
        html: 'Serial number added successfully!<br><small>Total serials: ' + updatedSerials.length + '</small>',
        icon: 'success'
      });
    }, 500);
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  onFilterChanged(): void {
    this.updateTotalRow();
  }
}
