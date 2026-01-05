import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { PreSales, ScopeVersion, StageHistory, ProjectStage, PROJECT_STAGES, AdvancePayment } from '../../core/models/pre-sales.model';

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
  isModalOpen = false;
  isAdvanceModalOpen = false;
  isLoading = false;
  isEditMode = false;
  editingIndex: number = -1;
  editingRecord: PreSales | null = null;
  selectedProjectForAdvance: PreSales | null = null;
  selectedProjectIndex: number = -1;
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
      width: 130
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
      field: 'contactPerson', 
      headerName: 'Contact Person', 
      flex: 1,
      minWidth: 180
    },
    { 
      field: 'projectValue', 
      headerName: 'Value', 
      width: 150,
      valueFormatter: (params: any) => {
        if (params.value != null) {
          return '₹ ' + params.value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        return '';
      }
    },
    { 
      field: 'currentStage', 
      headerName: 'Stage', 
      width: 140,
      cellRenderer: (params: any) => {
        const stage = params.value;
        const colors: { [key: string]: string } = {
          'Pre-Sales': 'bg-blue-100 text-blue-800',
          'Quotation': 'bg-yellow-100 text-yellow-800',
          'Confirmed': 'bg-green-100 text-green-800',
          'Development': 'bg-purple-100 text-purple-800',
          'Completed': 'bg-gray-100 text-gray-800'
        };
        return `<span class="px-2 py-1 text-xs font-medium rounded ${colors[stage] || 'bg-gray-100 text-gray-800'}">${stage}</span>`;
      }
    },
    {
      headerName: 'Actions',
      width: 180,
      cellRenderer: this.actionsCellRenderer.bind(this),
      pinned: 'right',
      sortable: false,
      filter: false
    }
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  rowData: PreSales[] = [];

  constructor(private fb: FormBuilder, private ngZone: NgZone) {}

  actionsCellRenderer(params: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex gap-2 h-full items-center justify-center';
    
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
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
    deleteBtn.addEventListener('click', () => {
      this.ngZone.run(() => this.deletePreSales(params.rowIndex));
    });
    
    container.appendChild(viewBtn);
    container.appendChild(editBtn);
    container.appendChild(deleteBtn);
    
    return container;
  }

  ngOnInit(): void {
    this.initForm();
    this.initAdvanceForm();
    this.loadSampleData();
  }

  loadSampleData(): void {
    this.rowData = [
      {
        projectNo: 1001,
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
        projectNo: 1002,
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
        attachmentUrls: []
      },
      {
        projectNo: 1003,
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
        projectNo: 1004,
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
        projectNo: 1005,
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
        // Add new record
        const newProjectNo = Math.max(...this.rowData.map(r => r.projectNo)) + 1;
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
      
      this.isLoading = false;
      this.closeModal();
    }, 1000);
  }

  viewPreSales(data: PreSales): void {
    Swal.fire({
      title: `<div class="text-left"><strong class="text-2xl text-gray-800">${data.projectName}</strong></div>`,
      html: `
        <div class="text-left">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Project No.</p>
                <p class="text-base font-bold text-blue-600">#${data.projectNo}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Value</p>
                <p class="text-base font-bold text-green-600">₹${data.projectValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
              </div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="border-l-4 border-blue-500 pl-3 py-1">
              <p class="text-xs text-gray-500 uppercase font-semibold">Party Name</p>
              <p class="text-sm text-gray-800 font-medium">${data.partyName}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="border-l-4 border-green-500 pl-3 py-1">
                <p class="text-xs text-gray-500 uppercase font-semibold">Contact Person</p>
                <p class="text-sm text-gray-800 font-medium">${data.contactPerson}</p>
              </div>
              <div class="border-l-4 border-purple-500 pl-3 py-1">
                <p class="text-xs text-gray-500 uppercase font-semibold">Agent Name</p>
                <p class="text-sm text-gray-800 font-medium">${data.agentName}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="border-l-4 border-orange-500 pl-3 py-1">
                <p class="text-xs text-gray-500 uppercase font-semibold">Mobile</p>
                <p class="text-sm text-gray-800 font-medium">${data.mobileNumber}</p>
              </div>
              <div class="border-l-4 border-pink-500 pl-3 py-1">
                <p class="text-xs text-gray-500 uppercase font-semibold">Email</p>
                <p class="text-sm text-gray-800 font-medium">${data.emailId}</p>
              </div>
            </div>
            
            <div class="border-l-4 border-indigo-500 pl-3 py-1">
              <p class="text-xs text-gray-500 uppercase font-semibold mb-2">Scope of Development (v${data.scopeHistory?.length || 1})</p>
              <p class="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded">${data.scopeOfDevelopment}</p>
              ${data.scopeHistory && data.scopeHistory.length > 1 ? 
                `<button class="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium" id="viewScopeHistory">View Scope History (${data.scopeHistory.length} versions)</button>` 
                : ''}
            </div>
          </div>
        </div>
      `,
      width: 700,
      showCloseButton: true,
      showConfirmButton: false,
      didOpen: () => {
        const historyBtn = document.getElementById('viewScopeHistory');
        if (historyBtn) {
          historyBtn.addEventListener('click', () => {
            Swal.close();
            this.viewScopeHistory(data);
          });
        }
      },
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        title: 'border-b pb-3',
        htmlContainer: 'pt-4'
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
      title: `<div class="text-left"><strong class="text-xl text-gray-800">Scope History - ${data.projectName}</strong></div>`,
      html: `
        <div class="text-left max-h-96 overflow-y-auto">
          <p class="text-sm text-gray-600 mb-4">Total versions: ${scopeHistory.length}</p>
          ${historyHtml}
        </div>
      `,
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
        html: `Advance payment of ₹${formValue.amount.toFixed(2)} added successfully!<br><small>Total advance: ₹${totalAdvance.toFixed(2)}</small>`,
        icon: 'success'
      });
    }, 500);
  }

  getTotalAdvance(data: PreSales): number {
    if (!data.advancePayments || data.advancePayments.length === 0) return 0;
    return data.advancePayments.reduce((sum, adv) => sum + adv.amount, 0);
  }

  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }
}
