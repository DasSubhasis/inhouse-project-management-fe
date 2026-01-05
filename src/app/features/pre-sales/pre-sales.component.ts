import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { PreSales } from '../../core/models/pre-sales.model';

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
  isModalOpen = false;
  isLoading = false;
  isEditMode = false;
  editingIndex: number = -1;
  isDragging = false;
  selectedFiles: File[] = [];

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
      headerName: 'Actions',
      width: 120,
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

  constructor(private fb: FormBuilder) {}

  actionsCellRenderer(params: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex gap-2 h-full items-center justify-center';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors';
    viewBtn.title = 'View';
    viewBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>';
    viewBtn.addEventListener('click', () => this.viewPreSales(params.data));
    
    const editBtn = document.createElement('button');
    editBtn.className = 'p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors';
    editBtn.title = 'Edit';
    editBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>';
    editBtn.addEventListener('click', () => this.editPreSales(params.data, params.rowIndex));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
    deleteBtn.addEventListener('click', () => this.deletePreSales(params.rowIndex));
    
    container.appendChild(viewBtn);
    container.appendChild(editBtn);
    container.appendChild(deleteBtn);
    
    return container;
  }

  ngOnInit(): void {
    this.initForm();
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
        scopeOfDevelopment: 'Complete ERP system with inventory, accounting, and HR modules. Integration with existing systems required.',
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
        scopeOfDevelopment: 'Cross-platform mobile application for iOS and Android with backend API integration.',
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
      attachments: [null]
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
        this.rowData[this.editingIndex] = {
          projectNo: this.rowData[this.editingIndex].projectNo,
          ...formValue,
          projectValue: parseFloat(formValue.projectValue),
          attachmentUrls: []
        };
        
        Swal.fire('Success', 'Pre-sales record updated successfully', 'success');
      } else {
        // Add new record
        const newProjectNo = Math.max(...this.rowData.map(r => r.projectNo)) + 1;
        const newRecord: PreSales = {
          projectNo: newProjectNo,
          ...formValue,
          projectValue: parseFloat(formValue.projectValue),
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
              <p class="text-xs text-gray-500 uppercase font-semibold mb-2">Scope of Development</p>
              <p class="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded">${data.scopeOfDevelopment}</p>
            </div>
          </div>
        </div>
      `,
      width: 700,
      showCloseButton: true,
      showConfirmButton: false,
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
    
    this.preSalesForm.patchValue({
      partyName: data.partyName,
      projectName: data.projectName,
      contactPerson: data.contactPerson,
      mobileNumber: data.mobileNumber,
      emailId: data.emailId,
      agentName: data.agentName,
      projectValue: data.projectValue,
      scopeOfDevelopment: data.scopeOfDevelopment
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

  onGridReady(params: GridReadyEvent): void {
    params.api.sizeColumnsToFit();
  }
}
