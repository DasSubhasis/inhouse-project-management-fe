import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag, ApiResponse, PaginatedResponse } from '../models/tag.model';
import { CallStatus, CreateCallStatusRequest, UpdateCallStatusRequest } from '../models/call-status.model';
import { CallBehavior } from '../models/call-behavior.model';
import { SerialReport, SerialReportResponse, UserAccount } from '../models/serial-report.model';
import { User, CreateUserRequest, UpdateUserRequest, UserApiResponse, UserRole } from '../models/user.model';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
    // ============ MENU ENDPOINTS ============

    /**
     * Get all menus (with submenus)
     */
    getAllMenus(): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/Menu/all`);
    }

    /**
     * Get menus by role ID (for navigation)
     */
    getMenusByRole(roleId: string): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/Menu/all-by-role/${roleId}`);
    }

    /**
     * Get only main menus
     */
    getOnlyMainMenus(): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/Menu/only-main-menu`);
    }

    /**
     * Get a single menu by ID
     */
    getMenuById(menuId: string): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/Menu/${menuId}`);
    }

    /**
     * Create a new menu (main or submenu)
     */
    createMenu(menu: { menuName: string; menuURL: string; menuIcon: string; order: number; mainMenuId: string | null }): Observable<any> {
      return this.http.post<any>(`${this.baseUrl}/Menu/create`, menu);
    }

    /**
     * Update a menu by ID
     */
    updateMenu(menuId: string, menu: { menuName: string; menuURL: string; menuIcon: string; order: number; mainMenuId: string | null }): Observable<any> {
      return this.http.put<any>(`${this.baseUrl}/Menu/update/${menuId}`, menu);
    }

    /**
     * Delete a menu by ID
     */
    deleteMenu(menuId: string): Observable<any> {
      return this.http.delete<any>(`${this.baseUrl}/Menu/delete/${menuId}`);
    }

    // ============ AUTHORIZATION ENDPOINTS ============

    /**
     * Assign role-based permissions to a menu
     */
    createAuthorization(auth: { roleId: string; menuId: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }): Observable<any> {
      return this.http.post<any>(`${this.baseUrl}/Authorization/create`, auth);
    }

    /**
     * Get all authorizations
     */
    getAllAuthorizations(): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/Authorization/all`);
    }

    /**
     * Get all permissions for a role
     */
    getRoleAuthorizations(roleId: string): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/Authorization/role/${roleId}`);
    }

    /**
     * Update a role-menu authorization by ID
     */
    updateAuthorization(auth: { roleId: string; menuId: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }): Observable<any> {
      return this.http.put<any>(`${this.baseUrl}/Authorization/update`, auth);
    }

    /**
     * Delete a role-menu authorization by ID
     */
    deleteAuthorization(id: string): Observable<any> {
      return this.http.delete<any>(`${this.baseUrl}/Authorization/delete/${id}`);
    }
  constructor(private http: HttpClient, private configService: ConfigService) {}

  private get baseUrl(): string {
    return this.configService.apiBaseUrl;
  }

  // ============ AUTHENTICATION ENDPOINTS ============

  /**
   * Request OTP for login
   */
  requestOTP(emailId: string): Observable<any> {
    console.log('[ApiService] requestOTP called with:', { emailId, baseUrl: this.baseUrl });
    return this.http.post<any>(`${this.baseUrl}/Login/request-otp`, { emailId });
  }

  /**
   * Verify OTP for login
   */
  verifyOTP(emailId: string, loginCode: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Login/verify-otp`, { emailId, loginCode, otp });
  }

  // ============ TAG ENDPOINTS ============

  /**
   * Get all tags
   */
  getAllTags(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Tag/get-all`);
  }
  getTagsBySerialNo(serialNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Call/tags/by-serial/${serialNo}`);
  }
  getTagById(id: string): Observable<ApiResponse<Tag>> {
    return this.http.get<ApiResponse<Tag>>(`${this.baseUrl}/Tag/${id}`);
  }

  /**
   * Create a new tag
   */
  createTag(tag: { tagName: string; initialDate: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Tag/create`, tag);
  }

  /**
   * Update an existing tag
   */
  updateTag(tag: { tagId: string; tagName: string; initialDate: string; modifiedBy: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Tag/update`, tag);
  }

  /**
   * Delete a tag
   */
  deleteTag(tagId: string, deletedBy: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Tag/delete/${tagId}?deletedBy=${deletedBy}`);
  }

  /**
   * Search tags by name
   */
  searchTags(searchTerm: string): Observable<PaginatedResponse<Tag>> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<PaginatedResponse<Tag>>(`${this.baseUrl}/tags/search`, { params });
  }

  // ============ CALL STATUS ENDPOINTS ============

  /**
   * Get all call statuses
   */
  getAllCallStatuses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/CallStatus/get-all`);
  }

  /**
   * Get a single call status by ID
   */
  getCallStatusById(statusId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/CallStatus/get/${statusId}`);
  }

  /**
   * Create a new call status
   */
  createCallStatus(callStatus: { statusCode?: string; statusName: string; description?: string; callBehavior: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CallStatus/create`, callStatus);
  }

  /**
   * Update an existing call status
   */
  updateCallStatus(callStatus: { statusId: string; modifiedBy: string; statusName: string; description?: string; statusCode?: string; callBehavior: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/CallStatus/update`, callStatus);
  }

  /**
   * Delete a call status
   */
  deleteCallStatus(statusId: string, deletedBy: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/CallStatus/delete/${statusId}?deletedBy=${deletedBy}`);
  }

  // ============ CALL BEHAVIOR ENDPOINTS ============

  /**
   * Get all call behaviors
   */
  getCallBehaviors(): Observable<CallBehavior[]> {
    return this.http.get<CallBehavior[]>(`${this.baseUrl}/Call/call-behavior/getall`);
  }

  // ============ CALL ENDPOINTS ============

  /**
   * Get all calls
   */
  getAllCalls(page?: number, pageSize?: number): Observable<PaginatedResponse<any>> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (pageSize) params = params.set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/calls`, { params });
  }

  /**
   * Create a new call
   */
  createCall(call: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/calls`, call);
  }

  /**
   * Update a call
   */
  updateCall(id: string, call: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/calls/${id}`, call);
  }

  /**
   * Delete a call
   */
  deleteCall(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/calls/${id}`);
  }

  // ============ CONTACT ENDPOINTS ============

  /**
   * Get all contacts
   */
  getAllContacts(page?: number, pageSize?: number): Observable<PaginatedResponse<any>> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (pageSize) params = params.set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/contacts`, { params });
  }

  // ============ USER ENDPOINTS ============

  /**
   * Get all users for dropdown selection
   */
  getAllUsers(): Observable<PaginatedResponse<UserAccount>> {
    return this.http.get<PaginatedResponse<UserAccount>>(`${this.baseUrl}/users`);
  }

  /**
   * Get a single user by ID
   */
  getUserById(id: string): Observable<ApiResponse<UserAccount>> {
    return this.http.get<ApiResponse<UserAccount>>(`${this.baseUrl}/users/${id}`);
  }

  // ============ USER MASTER ENDPOINTS ============

  /**
   * Get all users from User Master
   */
  getAllUserMaster(): Observable<UserApiResponse<User[]>> {
    return this.http.get<UserApiResponse<User[]>>(`${this.baseUrl}/User/getall`);
  }

  /**
   * Create a new user
   */
  createUser(user: CreateUserRequest): Observable<UserApiResponse<User>> {
    return this.http.post<UserApiResponse<User>>(`${this.baseUrl}/User/insert`, user);
  }

  /**
   * Update an existing user
   */
  updateUser(user: UpdateUserRequest): Observable<UserApiResponse<User>> {
    return this.http.post<UserApiResponse<User>>(`${this.baseUrl}/User/update`, user);
  }

  /**
   * Delete a user by ID
   */
  deleteUser(id: string): Observable<UserApiResponse<void>> {
    return this.http.post<UserApiResponse<void>>(`${this.baseUrl}/User/delete/${id}`, {});
  }

  /**
   * Get all user roles
   */
  getAllUserRoles(): Observable<UserApiResponse<UserRole[]>> {
    return this.http.get<UserApiResponse<UserRole[]>>(`${this.baseUrl}/UserRole/getall`);
  }

  /**
   * Create a new user role
   */
  createUserRole(roleName: string): Observable<UserApiResponse<UserRole>> {
    return this.http.post<UserApiResponse<UserRole>>(`${this.baseUrl}/UserRole/insert`, { roleName });
  }

  /**
   * Update an existing user role
   */
  updateUserRole(role: { roleId: string; roleName: string; isActive: string }): Observable<UserApiResponse<UserRole>> {
    return this.http.post<UserApiResponse<UserRole>>(`${this.baseUrl}/UserRole/update`, role);
  }

  /**
   * Delete a user role by ID
   */
  deleteUserRole(id: string): Observable<UserApiResponse<void>> {
    return this.http.post<UserApiResponse<void>>(`${this.baseUrl}/UserRole/delete/${id}`, {});
  }

  // ============ SERIAL REPORT ENDPOINTS ============

  /**
   * Upload serial reports with user and tag mapping
   */
  uploadSerialReports(data: any[]): Observable<ApiResponse<SerialReportResponse[]>> {
    // Send array directly - API expects List<UploadedFileBulkModel>
    console.log('Sending to API:', data);
    return this.http.post<ApiResponse<SerialReportResponse[]>>(`${this.baseUrl}/UploadedFile/bulk-insert`, data);
  }

  /**
   * Get all serial reports
   */
  getAllSerialReports(page?: number, pageSize?: number): Observable<PaginatedResponse<SerialReportResponse>> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (pageSize) params = params.set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<SerialReportResponse>>(`${this.baseUrl}/serial-reports`, { params });
  }

  /**
   * Get serial reports by tag ID
   */
  getSerialReportsByTag(tagId: string): Observable<PaginatedResponse<SerialReportResponse>> {
    const params = new HttpParams().set('tagId', tagId);
    return this.http.get<PaginatedResponse<SerialReportResponse>>(`${this.baseUrl}/serial-reports/by-tag/${tagId}`, { params });
  }

  /**
   * Get serial reports by user ID
   */
  getSerialReportsByUser(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/UploadedFile/get-by-user/${userId}`);
  }

  /**
   * Get uploaded files by assignedBy (login id)
   */
  getUploadedFilesByAssignedBy(assignedBy: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/UploadedFile/get-by-assignedby/${assignedBy}`);
  }

  /**
   * Get contacts by serial number
   */
  getContactsBySerialNo(serialNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Contact/by-serial/${serialNo}`);
  }

  /**
   * Create a new contact
   */
  createContact(contactData: { serialNo: string; name: string; number: string; designation: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Contact/create`, contactData);
  }

  // ============ REFCONTACTS ENDPOINTS ============

  /**
   * Create a new RefContact
   */
  createRefContact(contactData: {
    fileDataId: string;
    contactName: string;
    contactNumber: string;
    serialNo: string;
    designation: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/RefContacts/create`, contactData);
  }

  /**
   * Get RefContacts by fileDataId
   */
  getRefContactsByFileId(fileDataId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/RefContacts/by-file/${fileDataId}`);
  }

  /**
   * Get RefContacts data by fileDataId (for campaigns/tags)
   */
  getRefContactsByFileData(fileDataId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/RefContacts/get-by-filedata/${fileDataId}`);
  }

  /**
   * Create RefContact call history
   */
  createRefContactCallHistory(callHistoryData: {
    fileDataId: string;
    callDate: string;
    callBy: string;
    callNotes: string;
    callType: string;
    nextFollowUpDate?: string;
    serialNo: string;
    tagId: string;
    transferId?: string;
    callBehavior: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/RefContacts/call-history/create`, callHistoryData);
  }

  /**
   * Get RefContact call history by fileDataId
   */
  getRefContactCallHistoryByFileId(fileDataId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/RefContacts/call-history/by-file/${fileDataId}`);
  }

  /**
   * Get all RefContact call history
   */
  getRefContactCallHistoryAll(callBy: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/RefContacts/call-history/get-all?callBy=${callBy}`);
  }

  /**
   * Create a new reference call record
   */
  createRefCall(refCallData: {
    userId: string;
    tagId: string;
    assignedBy: string;
    serialNo: string;
    flavor: string;
    skuName: string;
    versionName: string;
    dotnetId: string;
    tssDate: string | null;
    contactName: string;
    email: string;
    mobile: string;
    alternateMobile: string;
    partyName: string;
    address1: string;
    address2: string;
    address3: string;
    address4: string;
    pin: string;
    city: string;
    location: string;
    state: string;
    agentType: string;
    agentName: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/RefCall/create`, refCallData);
  }

  /**
   * Get RefCall records by assigned user
   */
  getRefCallByAssigned(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/RefCall/get-by-assigned/${userId}`);
  }

  /**
   * Update a RefCall record
   */
  updateRefCall(refCallData: {
    fileDataId: string;
    userId: string;
    tagId: string;
    assignedBy: string;
    serialNo: string;
    flavor: string;
    skuName: string;
    versionName: string;
    dotnetId: string;
    tssDate: string | null;
    contactName: string;
    email: string;
    mobile: string;
    alternateMobile: string;
    partyName: string;
    address1: string;
    address2: string;
    address3: string;
    address4: string;
    pin: string;
    city: string;
    location: string;
    state: string;
    agentType: string;
    agentName: string;
    modifiedBy: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/RefCall/update`, refCallData);
  }

  /**
   * Delete a RefCall record
   */
  deleteRefCall(fileDataId: string, deletedBy: string): Observable<any> {
    const params = new HttpParams().set('deletedBy', deletedBy);
    return this.http.delete<any>(`${this.baseUrl}/RefCall/delete/${fileDataId}`, { params });
  }

  /**
   * Delete a contact
   */
  deleteContact(contactId: string, deletedBy: string): Observable<any> {
    const params = new HttpParams().set('deletedBy', deletedBy);
    return this.http.delete<any>(`${this.baseUrl}/Contact/delete/${contactId}`, { params });
  }

  /**
   * Get all call history
   */
  getAllCallHistory(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/UploadedFile/call-history/getall`);
  }

  /**
   * Get call history by serial number
   */
  getCallHistoryBySerialNo(serialNo: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/UploadedFile/call-history/by-file/${serialNo}`);
  }
  getCallHistoryByUser(userId: string) {
    return this.http.get<any>(`${this.baseUrl}/UploadedFile/call-history/get-all/${userId}`);
}

  createCallHistory(callHistoryData: {
    serialNo: string; 
    callDate: string;
    callBy: string;
    callNotes: string;
    callType: string;
     callBehavior:string,
    tagId: string;
    transferId?: string;
    nextFollowUpDate?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/UploadedFile/call-history/create`, callHistoryData);
  }
  deleteSerialReport(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/serial-reports/${id}`);
  }

  /**
   * Delete uploaded file by fileDataId
   */
  deleteUploadedFile(fileDataId: string, deletedBy: string): Observable<any> {
    const params = new HttpParams().set('deletedBy', deletedBy);
    return this.http.delete<any>(`${this.baseUrl}/UploadedFile/delete/${fileDataId}`, { params });
  }

  // ============ PRE-SALES ENDPOINTS ============

  /**
   * Upload attachment file for pre-sales
   */
  uploadPreSalesAttachment(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<any>(`${this.baseUrl}/PreSales/logo`, formData);
  }

  /**
   * Get all pre-sales projects
   */
  getAllPreSales(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/PreSales/getall`);
  }

  /**
   * Get all confirmed projects (for development)
   */
  getAllConfirmedProjects(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Devlopment/getall-confirmed`);
  }

  /**
   * Get a single pre-sales project by project number
   */
  getPreSalesById(projectNo: number | string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/PreSales/${projectNo}`);
  }

  /**
   * Create a new pre-sales project
   */
  createPreSales(preSalesData: {
    partyName: string;
    projectName: string;
    contactPerson: string;
    mobileNumber: string;
    emailId: string;
    agentName: string;
    projectValue: number;
    scopeOfDevelopment: string;
    currentStage: string;
    attachmentUrls: string[];
    userId: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PreSales/create`, preSalesData);
  }

  /**
   * Update an existing pre-sales project
   */
  updatePreSales(projectNo: number, preSalesData: {
    partyName: string;
    projectName: string;
    contactPerson: string;
    mobileNumber: string;
    emailId: string;
    agentName: string;
    projectValue: number;
    scopeOfDevelopment: string;
    currentStage: string;
    attachmentUrls: string[];
    userId: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/PreSales/update/${projectNo}`, preSalesData);
  }

  /**
   * Delete a pre-sales project
   */
  deletePreSales(projectNo: number, userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.delete<any>(`${this.baseUrl}/PreSales/delete/${projectNo}`, { params });
  }

  /**
   * Add advance payment to a project
   */
  addAdvancePayment(projectNo: number, paymentData: {
    amount: number;
    paymentDate: string;
    tallyEntryNumber: string;
    userId: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PreSales/${projectNo}/advance-payment`, paymentData);
  }

  /**
   * Get all advance payments for a project
   */
  getAdvancePayments(projectNo: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/PreSales/${projectNo}/advance-payments`);
  }

  /**
   * Add serial number to a project (quotation endpoint)
   */
  addSerialNumber(projectNo: number, serialData: {
    serialNumber: string;
    version: string;
    recordedById: string;
    recordedDate: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PreSales/${projectNo}/quotation`, serialData);
  }

  // ============ GENERIC METHODS ============

  /**
   * Set the base URL for API calls (useful for different environments)
   */
  setBaseUrl(url: string): void {
    // Note: This won't work as baseUrl is private, but you can expose it if needed
    console.log('To change base URL, modify it directly in the service');
  }

  // ============ STATUS UPDATE ENDPOINTS ============

  /**
   * Get all statuses for dropdown
   */
  getStatuses(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Devlopment/status-master`);
  }

  /**
   * Create a new status update for a project
   */
  createStatusUpdate(projectNo: number, statusData: {
    notes: string;
    status: string;
    attachmentUrls: string[];
    createdBy: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Devlopment/${projectNo}/status`, statusData);
  }

  /**
   * Get all status updates for a project
   */
  getStatusUpdatesByProject(projectNo: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Devlopment/work-status/${projectNo}`);
  }

  // ============ GENERIC HTTP METHODS ============

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params });
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
