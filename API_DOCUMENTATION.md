# API Documentation - POST Request JSON Formats

**Project:** In-House Project Management System  
**Date:** January 6, 2026  
**Frontend Framework:** Angular 18  

This document outlines the JSON format requirements for all POST/PUT requests from the frontend application to the backend API.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Pre-Sales Management](#2-pre-sales-management)
3. [User Management](#3-user-management)
4. [Tag Management](#4-tag-management)
5. [Call Status Management](#5-call-status-management)
6. [Menu Management](#6-menu-management)
7. [Authorization Management](#7-authorization-management)
8. [Serial Reports](#8-serial-reports)
9. [Contact Management](#9-contact-management)
10. [Call History](#10-call-history)
11. [Common Response Formats](#11-common-response-formats)

---

## 1. Authentication

### 1.1 Request OTP for Login
**Endpoint:** `POST /Login/request-otp`

**Request Body:**
```json
{
  "emailId": "user@example.com"
}
```

**Field Descriptions:**
- `emailId` (string, required): User's email address

---

### 1.2 Verify OTP for Login
**Endpoint:** `POST /Login/verify-otp`

**Request Body:**
```json
{
  "emailId": "user@example.com",
  "loginCode": "ABC123",
  "otp": "123456"
}
```

**Field Descriptions:**
- `emailId` (string, required): User's email address
- `loginCode` (string, required): Login code received
- `otp` (string, required): OTP code received via email

---

## 2. Pre-Sales Management

### 2.1 Create Pre-Sales Project
**Endpoint:** `POST /PreSales/create`

**Request Body:**
```json
{
  "partyName": "Tech Solutions Pvt Ltd",
  "projectName": "ERP Implementation",
  "contactPerson": "Rajesh Kumar",
  "mobileNumber": "9876543210",
  "emailId": "rajesh@techsolutions.com",
  "agentName": "Amit Sharma",
  "projectValue": 1500000.00,
  "scopeOfDevelopment": "Complete ERP system with inventory, accounting, HR, and CRM modules",
  "currentStage": "Pre-Sales",
  "attachmentUrls": []
}
```

**Field Descriptions:**
- `partyName` (string, required, min 3 chars): Company/party name
- `projectName` (string, required, min 3 chars): Name of the project
- `contactPerson` (string, required, min 3 chars): Contact person name
- `mobileNumber` (string, required, pattern: 10 digits): Contact mobile number
- `emailId` (string, required, valid email): Contact email address
- `agentName` (string, required, min 3 chars): Sales agent name
- `projectValue` (number, required, min: 0): Project value in rupees
- `scopeOfDevelopment` (string, required, min 10 chars): Detailed project scope (current version only)
- `currentStage` (string, required): One of: "Pre-Sales", "Quotation", "Confirmed", "Development", "Completed"
- `attachmentUrls` (array, optional): Array of attachment URL strings (e.g., S3 URLs, file paths)

**Important Notes:**
- **Backend Responsibility:** Backend will automatically create the initial version in `scopeHistory` table/collection
- **Backend Responsibility:** Backend will automatically create the initial entry in `stageHistory` table/collection
- **Backend Responsibility:** Backend will automatically create entries in `attachmentHistory` when attachmentUrls are provided
- Frontend only sends the **current/latest** values, not the full history

---

### 2.2 Update Pre-Sales Project
**Endpoint:** `PUT /PreSales/update/{projectNo}`

**Request Body:**
```json
{
  "projectNo": 1001,
  "partyName": "Tech Solutions Pvt Ltd",
  "projectName": "ERP Implementation - Updated",
  "contactPerson": "Rajesh Kumar",
  "mobileNumber": "9876543210",
  "emailId": "rajesh@techsolutions.com",
  "agentName": "Amit Sharma",
  "projectValue": 1750000.00,
  "scopeOfDevelopment": "Complete ERP system with inventory, accounting, HR, CRM modules and mobile app",
  "currentStage": "Quotation",
  "attachmentUrls": [
    "https://storage.example.com/files/project-document-v2.pdf",
    "https://storage.example.com/files/requirements.docx"
  ],
  "modifiedBy": "Admin User"
}
```

**Field Descriptions:** Same as Create, plus:
- `projectNo` (number, required): Existing project number
- `modifiedBy` (string, required): User making the update (for audit trail)

**Backend Automatic Actions:**
1. **Scope Change Detection:** 
   - If `scopeOfDevelopment` differs from current value, backend creates new version in `scopeHistory` table
   - Increment version number automatically
   - Record `modifiedBy` and `modifiedDate`

2. **Stage Change Detection:**
   - If `currentStage` differs from current value, backend creates new entry in `stageHistory` table
   - Record `changedBy` and `changedDate`
   - **Validate:** Stage can only progress forward (Pre-Sales → Quotation → Confirmed → Development → Completed)
   - **Return Error:** If attempting to revert to previous stage

3. **Attachment Change Detection:**
   - If `attachmentUrls` differs from current value, backend creates new entry in `attachmentHistory` table
   - Record uploaded/modified date and user
   - Store previous URLs for historical reference

**Important Notes:**
- Frontend sends only the **latest/current** scope and stage, not full history arrays
- Backend is responsible for comparing with existing data and creating history records
- Backend should return error if stage progression rules are violated

---

### 2.3 Add Advance Payment
**Endpoint:** `POST /PreSales/{projectNo}/advance-payment`

**Request Body:**
```json
{
  "projectNo": 1001,
  "amount": 150000.00,
  "date": "2026-01-05T00:00:00Z",
  "tallyEntryNumber": "TLY-2026-000012",
  "receivedBy": "Admin User",
  "receivedDate": "2026-01-05T14:20:00Z"
}
```

**Field Descriptions:**
- `projectNo` (number, required): Project number
- `amount` (number, required, min: 1): Advance payment amount
- `date` (string, ISO 8601, required): Payment date
- `tallyEntryNumber` (string, required, min 1 char): Tally entry reference
- `receivedBy` (string, auto-generated): User who received payment (from auth context)
- `receivedDate` (string, ISO 8601, auto-generated): Timestamp when payment was received

**Note:** This endpoint should only be available when `currentStage` is "Quotation" or "Confirmed"

---

### 2.4 Pre-Sales History Management (Backend Responsibility)

**Important:** Frontend does NOT send history arrays. Backend automatically manages all history tracking.

#### Scope History Management
**When:** Any update where `scopeOfDevelopment` changes

**Backend Actions:**
1. Compare incoming `scopeOfDevelopment` with current database value
2. If different, insert new record into `ScopeHistory` table:
```sql
INSERT INTO ScopeHistory (
  projectNo,
  version,
  scope,
  modifiedBy,
  modifiedDate
) VALUES (
  {projectNo},
  {lastVersion + 1},
  {newScopeValue},
  {modifiedBy},
  CURRENT_TIMESTAMP
)
```
3. Update main PreSales table with new scope value

#### Stage History Management
**When:** Any update where `currentStage` changes

**Backend Actions:**
1. Compare incoming `currentStage` with current database value
2. **Validate:** Check if new stage is forward progression only
3. If valid and different, insert new record into `StageHistory` table:
```sql
INSERT INTO StageHistory (
  projectNo,
  stage,
  changedBy,
  changedDate
) VALUES (
  {projectNo},
  {newStageValue},
  {modifiedBy},
  CURRENT_TIMESTAMP
)
```
4. Update main PreSales table with new stage value

#### Attachment History Management
**When:** Any create/update where `attachmentUrls` is provided and differs from current

**Backend Actions:**
1. Compare incoming `attachmentUrls` array with current database value
2. If different, insert new record into `AttachmentHistory` table:
```sql
INSERT INTO AttachmentHistory (
  projectNo,
  attachmentUrls,
  uploadedBy,
  uploadedDate
) VALUES (
  {projectNo},
  {newAttachmentUrlsArray},
  {modifiedBy},
  CURRENT_TIMESTAMP
)
```
3. Update main PreSales table with new attachment URLs

**Stage Progression Validation Rules:**
- Pre-Sales (0) → Quotation (1) ✅
- Quotation (1) → Confirmed (2) ✅
- Confirmed (2) → Development (3) ✅
- Development (3) → Completed (4) ✅
- Any backward movement ❌ (Should return error)
- Skipping stages is allowed (e.g., Pre-Sales → Confirmed) ✅

---

### 2.5 Delete Pre-Sales Project
**Endpoint:** `DELETE /PreSales/delete/{projectNo}?deletedBy={userId}`

**Query Parameters:**
- `projectNo` (number, required): Project number to delete
- `deletedBy` (string, required): User ID performing the deletion

---

## 3. User Management

### 3.1 Create User
**Endpoint:** `POST /User/insert`

**Request Body:**
```json
{
  "userName": "John Doe",
  "emailId": "john.doe@company.com",
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "userCode": "JD001",
  "employeeType": "Full-Time"
}
```

**Field Descriptions:**
- `userName` (string, required): Full name of the user
- `emailId` (string, required, valid email): User's email address
- `roleId` (string, required, UUID): Role ID (from UserRole table)
- `userCode` (string, required): Unique employee code
- `employeeType` (string, required): Type of employment (e.g., "Full-Time", "Part-Time", "Contract")

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "userName": "John Doe",
    "emailId": "john.doe@company.com",
    "roleId": "550e8400-e29b-41d4-a716-446655440000",
    "userCode": "JD001",
    "employeeType": "Full-Time",
    "roleName": "Administrator"
  },
  "message": "User created successfully"
}
```

---

### 3.2 Update User
**Endpoint:** `POST /User/update`

**Request Body:**
```json
{
  "userId": "660e8400-e29b-41d4-a716-446655440001",
  "userName": "John Doe Updated",
  "emailId": "john.doe@company.com",
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "userCode": "JD001",
  "employeeType": "Full-Time",
  "roleName": "Administrator"
}
```

**Field Descriptions:** Same as Create, plus:
- `userId` (string, required, UUID): Existing user ID
- `roleName` (string, required): Role name (for display)

---

### 3.3 Delete User
**Endpoint:** `POST /User/delete/{userId}`

**URL Parameters:**
- `userId` (string, required, UUID): User ID to delete

---

## 4. Tag Management

### 4.1 Create Tag
**Endpoint:** `POST /Tag/create`

**Request Body:**
```json
{
  "tagName": "Campaign Q1 2026",
  "initialDate": "2026-01-01"
}
```

**Field Descriptions:**
- `tagName` (string, required): Name of the tag
- `initialDate` (string, required, YYYY-MM-DD): Initial/start date for the tag

---

### 4.2 Update Tag
**Endpoint:** `PUT /Tag/update`

**Request Body:**
```json
{
  "tagId": "770e8400-e29b-41d4-a716-446655440002",
  "tagName": "Campaign Q1 2026 - Updated",
  "initialDate": "2026-01-01",
  "modifiedBy": "Admin User"
}
```

**Field Descriptions:** Same as Create, plus:
- `tagId` (string, required, UUID): Existing tag ID
- `modifiedBy` (string, required): User making the update

---

### 4.3 Delete Tag
**Endpoint:** `DELETE /Tag/delete/{tagId}?deletedBy={userId}`

**Query Parameters:**
- `tagId` (string, required, UUID): Tag ID to delete
- `deletedBy` (string, required): User ID performing the deletion

---

## 5. Call Status Management

### 5.1 Create Call Status
**Endpoint:** `POST /CallStatus/create`

**Request Body:**
```json
{
  "statusCode": "CS001",
  "statusName": "Follow-up Required",
  "description": "Customer needs follow-up call",
  "callBehavior": "Positive"
}
```

**Field Descriptions:**
- `statusCode` (string, optional): Custom status code
- `statusName` (string, required): Name of the status
- `description` (string, optional): Detailed description
- `callBehavior` (string, required): Behavior type (e.g., "Positive", "Negative", "Neutral")

---

### 5.2 Update Call Status
**Endpoint:** `PUT /CallStatus/update`

**Request Body:**
```json
{
  "statusId": "880e8400-e29b-41d4-a716-446655440003",
  "modifiedBy": "Admin User",
  "statusName": "Follow-up Required - Updated",
  "description": "Customer needs immediate follow-up call",
  "statusCode": "CS001",
  "callBehavior": "Positive"
}
```

**Field Descriptions:** Same as Create, plus:
- `statusId` (string, required, UUID): Existing status ID
- `modifiedBy` (string, required): User making the update

---

### 5.3 Delete Call Status
**Endpoint:** `DELETE /CallStatus/delete/{statusId}?deletedBy={userId}`

**Query Parameters:**
- `statusId` (string, required, UUID): Status ID to delete
- `deletedBy` (string, required): User ID performing the deletion

---

## 6. Menu Management

### 6.1 Create Menu (Main or Submenu)
**Endpoint:** `POST /Menu/create`

**Main Menu Request:**
```json
{
  "menuName": "Dashboard",
  "menuURL": "/dashboard",
  "menuIcon": "dashboard",
  "order": 1,
  "mainMenuId": null
}
```

**Submenu Request:**
```json
{
  "menuName": "User Management",
  "menuURL": "/admin/users",
  "menuIcon": "people",
  "order": 1,
  "mainMenuId": "990e8400-e29b-41d4-a716-446655440004"
}
```

**Field Descriptions:**
- `menuName` (string, required): Display name of the menu
- `menuURL` (string, required): Route/URL path
- `menuIcon` (string, required): Icon name/identifier
- `order` (number, required): Display order
- `mainMenuId` (string, nullable): Parent menu ID (null for main menu, UUID for submenu)

---

### 6.2 Update Menu
**Endpoint:** `PUT /Menu/update/{menuId}`

**Request Body:**
```json
{
  "menuName": "Dashboard - Updated",
  "menuURL": "/dashboard",
  "menuIcon": "dashboard_new",
  "order": 1,
  "mainMenuId": null
}
```

**Field Descriptions:** Same as Create

---

### 6.3 Delete Menu
**Endpoint:** `DELETE /Menu/delete/{menuId}`

**URL Parameters:**
- `menuId` (string, required, UUID): Menu ID to delete

---

## 7. Authorization Management

### 7.1 Create Authorization (Role-Menu Permission)
**Endpoint:** `POST /Authorization/create`

**Request Body:**
```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "menuId": "990e8400-e29b-41d4-a716-446655440004",
  "canView": true,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```

**Field Descriptions:**
- `roleId` (string, required, UUID): User role ID
- `menuId` (string, required, UUID): Menu ID
- `canView` (boolean, required): View permission
- `canCreate` (boolean, required): Create permission
- `canEdit` (boolean, required): Edit permission
- `canDelete` (boolean, required): Delete permission

---

### 7.2 Update Authorization
**Endpoint:** `PUT /Authorization/update`

**Request Body:**
```json
{
  "roleId": "550e8400-e29b-41d4-a716-446655440000",
  "menuId": "990e8400-e29b-41d4-a716-446655440004",
  "canView": true,
  "canCreate": true,
  "canEdit": true,
  "canDelete": true
}
```

**Field Descriptions:** Same as Create

---

### 7.3 Delete Authorization
**Endpoint:** `DELETE /Authorization/delete/{id}`

**URL Parameters:**
- `id` (string, required, UUID): Authorization record ID to delete

---

## 8. Serial Reports

### 8.1 Bulk Upload Serial Reports
**Endpoint:** `POST /UploadedFile/bulk-insert`

**Request Body:**
```json
[
  {
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "tagId": "770e8400-e29b-41d4-a716-446655440002",
    "assignedBy": "Admin User",
    "serialNo": "SN123456",
    "flavor": "Professional",
    "skuName": "SKU-001",
    "versionName": "v2.5",
    "dotnetId": "DN-12345",
    "tssDate": "2025-12-15T00:00:00Z",
    "contactName": "Rajesh Kumar",
    "email": "rajesh@company.com",
    "mobile": "9876543210",
    "alternateMobile": "9876543211",
    "partyName": "Tech Solutions Ltd",
    "address1": "Building 123",
    "address2": "Sector 45",
    "address3": "Industrial Area",
    "address4": "",
    "pin": "400001",
    "city": "Mumbai",
    "location": "Andheri",
    "state": "Maharashtra",
    "agentType": "Distributor",
    "agentName": "Amit Sharma"
  }
]
```

**Field Descriptions:**
- Array of objects, each containing:
- `userId` (string, required, UUID): User ID to assign
- `tagId` (string, required, UUID): Tag ID for categorization
- `assignedBy` (string, required): User who assigned
- `serialNo` (string, required): Product serial number
- `flavor` (string, optional): Product flavor/variant
- `skuName` (string, optional): SKU name
- `versionName` (string, optional): Version name
- `dotnetId` (string, optional): .NET ID
- `tssDate` (string, ISO 8601, nullable): TSS date
- `contactName` (string, optional): Contact person name
- `email` (string, optional): Contact email
- `mobile` (string, optional): Contact mobile
- `alternateMobile` (string, optional): Alternate mobile
- `partyName` (string, optional): Party/company name
- `address1` (string, optional): Address line 1
- `address2` (string, optional): Address line 2
- `address3` (string, optional): Address line 3
- `address4` (string, optional): Address line 4
- `pin` (string, optional): PIN code
- `city` (string, optional): City
- `location` (string, optional): Location
- `state` (string, optional): State
- `agentType` (string, optional): Type of agent
- `agentName` (string, optional): Agent name

---

### 8.2 Delete Uploaded File
**Endpoint:** `DELETE /UploadedFile/delete/{fileDataId}?deletedBy={userId}`

**Query Parameters:**
- `fileDataId` (string, required, UUID): File data ID to delete
- `deletedBy` (string, required): User ID performing the deletion

---

## 9. Contact Management

### 9.1 Create Contact
**Endpoint:** `POST /Contact/create`

**Request Body:**
```json
{
  "serialNo": "SN123456",
  "name": "Rajesh Kumar",
  "number": "9876543210",
  "designation": "Manager"
}
```

**Field Descriptions:**
- `serialNo` (string, required): Serial number reference
- `name` (string, required): Contact person name
- `number` (string, required): Contact phone number
- `designation` (string, required): Job designation

---

### 9.2 Create RefContact
**Endpoint:** `POST /RefContacts/create`

**Request Body:**
```json
{
  "fileDataId": "AA0e8400-e29b-41d4-a716-446655440005",
  "contactName": "Priya Patel",
  "contactNumber": "9988776655",
  "serialNo": "SN123456",
  "designation": "Director"
}
```

**Field Descriptions:**
- `fileDataId` (string, required, UUID): File data ID reference
- `contactName` (string, required): Contact name
- `contactNumber` (string, required): Contact number
- `serialNo` (string, required): Serial number
- `designation` (string, required): Job designation

---

### 9.3 Delete Contact
**Endpoint:** `DELETE /Contact/delete/{contactId}?deletedBy={userId}`

**Query Parameters:**
- `contactId` (string, required, UUID): Contact ID to delete
- `deletedBy` (string, required): User ID performing the deletion

---

## 10. Call History

### 10.1 Create Call History
**Endpoint:** `POST /UploadedFile/call-history/create`

**Request Body:**
```json
{
  "serialNo": "SN123456",
  "callDate": "2026-01-06T10:30:00Z",
  "callBy": "Admin User",
  "callNotes": "Customer interested in upgrade. Will follow up next week.",
  "callType": "Outgoing",
  "callBehavior": "Positive",
  "tagId": "770e8400-e29b-41d4-a716-446655440002",
  "transferId": null,
  "nextFollowUpDate": "2026-01-13T00:00:00Z"
}
```

**Field Descriptions:**
- `serialNo` (string, required): Serial number reference
- `callDate` (string, ISO 8601, required): Date and time of call
- `callBy` (string, required): User who made the call
- `callNotes` (string, required): Notes about the call
- `callType` (string, required): Type of call (e.g., "Incoming", "Outgoing", "Missed")
- `callBehavior` (string, required): Call behavior (e.g., "Positive", "Negative", "Neutral")
- `tagId` (string, required, UUID): Tag ID for categorization
- `transferId` (string, optional, UUID): Transfer ID if call was transferred
- `nextFollowUpDate` (string, ISO 8601, optional): Next follow-up date

---

### 10.2 Create RefContact Call History
**Endpoint:** `POST /RefContacts/call-history/create`

**Request Body:**
```json
{
  "fileDataId": "AA0e8400-e29b-41d4-a716-446655440005",
  "callDate": "2026-01-06T10:30:00Z",
  "callBy": "Admin User",
  "callNotes": "Discussed project requirements",
  "callType": "Outgoing",
  "nextFollowUpDate": "2026-01-13T00:00:00Z",
  "serialNo": "SN123456",
  "tagId": "770e8400-e29b-41d4-a716-446655440002",
  "transferId": null,
  "callBehavior": "Positive"
}
```

**Field Descriptions:** Same as Create Call History, plus:
- `fileDataId` (string, required, UUID): File data ID reference

---

## 11. Common Response Formats

### 11.1 Success Response (Generic)
```json
{
  "success": true,
  "data": { /* ... returned data object ... */ },
  "message": "Operation completed successfully"
}
```

### 11.2 Error Response
```json
{
  "success": false,
  "error": "Error message details",
  "message": "Operation failed",
  "statusCode": 400
}
```

### 11.3 Paginated Response
```json
{
  "success": true,
  "data": [ /* ... array of objects ... */ ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "message": "Data retrieved successfully"
}
```

---

## Important Notes for Backend Developer

### Date/Time Formats
- All dates should be in **ISO 8601 format**: `YYYY-MM-DDTHH:mm:ssZ`
- Frontend will send dates in UTC
- Example: `"2026-01-06T10:30:00Z"`

### UUID Format
- All IDs (userId, tagId, menuId, etc.) should be **UUID/GUID format**
- Example: `"550e8400-e29b-41d4-a716-446655440000"`

### Boolean Values
- Use standard JSON boolean: `true` or `false`
- Some legacy fields might use `"Y"` or `"N"` strings (check isActive fields)

### Required Headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (after successful login)

### Validation Rules Summary
- **Mobile Numbers**: Exactly 10 digits
- **Emails**: Valid email format
- **Minimum String Lengths**: Typically 3 characters for names
- **Project Value**: Must be ≥ 0
- **Stage Progression**: Only forward (Pre-Sales → Quotation → Confirmed → Development → Completed)

### Soft Delete Pattern
Most DELETE endpoints use soft delete with `deletedBy` parameter:
- Don't actually delete records from database
- Set `isActive` to `"N"` or `false`
- Record `deletedBy` and `deletedDate` values

### Audit Trail Pattern
All UPDATE operations should record:
- `modifiedBy`: User who made the change
- `modifiedDate`: Timestamp of change
- For version-tracked items (like Pre-Sales scope), maintain history in separate array

---

## Pre-Sales API Endpoints (TO BE IMPLEMENTED)

**Note:** The Pre-Sales functionality is currently working with mock data in the frontend. The following endpoints need to be implemented in the backend:

1. **GET** `/PreSales/getall` - Get all pre-sales projects
2. **GET** `/PreSales/{projectNo}` - Get single project by project number
3. **POST** `/PreSales/create` - Create new pre-sales project
4. **PUT** `/PreSales/update/{projectNo}` - Update existing project
5. **DELETE** `/PreSales/delete/{projectNo}?deletedBy={userId}` - Delete project
6. **POST** `/PreSales/{projectNo}/advance-payment` - Add advance payment
7. **GET** `/PreSales/{projectNo}/advance-payments` - Get all advance payments for a project

### Frontend Sends (Create/Update):
✅ `partyName`, `projectName`, `contactPerson`, `mobileNumber`, `emailId`  
✅ `agentName`, `projectValue`  
✅ `scopeOfDevelopment` (current/latest scope only)  
✅ `currentStage` (current/latest stage only)  
✅ `attachmentUrls` (array of URLs)  
✅ `modifiedBy` (for updates)  

### Frontend Does NOT Send:
❌ `scopeHistory` array  
❌ `stageHistory` array  
❌ `attachmentHistory` array  
❌ Version numbers  

### Backend Automatically Creates:
🔄 New version in `scopeHistory` when scope changes  
🔄 New entry in `stageHistory` when stage changes  
🔄 New entry in `attachmentHistory` when attachments change  
🔄 Auto-increment version numbers  
🔄 Auto-populate timestamps (`modifiedDate`, `changedDate`, `uploadedDate`)  

### Backend Returns (GET):
📥 Complete project data with all history arrays populated  
📥 For list view (`/getall`): Basic project info without history (performance)  
📥 For single view (`/{projectNo}`): Full data including all history arrays  

---

### Expected GET Response Format for Pre-Sales

**GET Single Project:** `/PreSales/{projectNo}`

```json
{
  "success": true,
  "data": {
    "projectNo": 1001,
    "partyName": "Tech Solutions Pvt Ltd",
    "projectName": "ERP Implementation",
    "contactPerson": "Rajesh Kumar",
    "mobileNumber": "9876543210",
    "emailId": "rajesh@techsolutions.com",
    "agentName": "Amit Sharma",
    "projectValue": 1500000.00,
    "scopeOfDevelopment": "Complete ERP system with inventory, accounting, HR, CRM modules and mobile app",
    "currentStage": "Quotation",
    "scopeHistory": [
      {
        "version": 1,
        "scope": "Complete ERP system with inventory and accounting modules",
        "modifiedBy": "Admin User",
        "modifiedDate": "2025-11-01T10:30:00Z"
      },
      {
        "version": 2,
        "scope": "Complete ERP system with inventory, accounting, HR, CRM modules and mobile app",
        "modifiedBy": "Admin User",
        "modifiedDate": "2026-01-06T14:20:00Z"
      }
    ],
    "stageHistory": [
      {
        "stage": "Pre-Sales",
        "changedBy": "Admin User",
        "changedDate": "2025-11-01T10:30:00Z"
      },
      {
        "stage": "Quotation",
        "changedBy": "Admin User",
        "changedDate": "2026-01-06T14:20:00Z"
      }
    ],
    "attachmentHistory": [
      {
        "attachmentUrls": ["https://storage.example.com/files/initial-requirements.pdf"],
        "uploadedBy": "Admin User",
        "uploadedDate": "2025-11-01T10:30:00Z"
      },
      {
        "attachmentUrls": [
          "https://storage.example.com/files/project-document-v2.pdf",
          "https://storage.example.com/files/requirements.docx"
        ],
        "uploadedBy": "Admin User",
        "uploadedDate": "2026-01-06T14:20:00Z"
      }
    ],
    "advancePayments": [
      {
        "amount": 250000.00,
        "date": "2025-12-15T00:00:00Z",
        "tallyEntryNumber": "TLY-2025-001234",
        "receivedBy": "Amit Sharma",
        "receivedDate": "2025-12-15T10:30:00Z"
      }
    ],
    "attachmentUrls": [
      "https://storage.example.com/files/project-document-v2.pdf",
      "https://storage.example.com/files/requirements.docx"
    ],
    "createdBy": "Admin User",
    "createdDate": "2025-11-01T10:30:00Z",
    "modifiedBy": "Admin User",
    "modifiedDate": "2026-01-06T14:20:00Z"
  },
  "message": "Pre-sales project retrieved successfully"
}
```

**GET All Projects:** `/PreSales/getall`

```json
{
  "success": true,
  "data": [
    {
      "projectNo": 1001,
      "partyName": "Tech Solutions Pvt Ltd",
      "projectName": "ERP Implementation",
      "contactPerson": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "emailId": "rajesh@techsolutions.com",
      "agentName": "Amit Sharma",
      "projectValue": 1500000.00,
      "scopeOfDevelopment": "Complete ERP system...",
      "currentStage": "Quotation",
      "attachmentUrls": [
        "https://storage.example.com/files/project-document-v2.pdf"
      ],
      "createdDate": "2025-11-01T10:30:00Z",
      "modifiedBy": "Admin User",
      "modifiedDate": "2026-01-06T14:20:00Z"
    }
  ],
  "message": "Pre-sales projects retrieved successfully"
}
```

**Note:** When getting all projects (list view), history arrays are NOT included for performance. History is only returned when fetching a single project by projectNo.

---

## Testing Checklist

- [ ] All POST endpoints accept JSON with Content-Type header
- [ ] All date fields accept ISO 8601 format
- [ ] All UUID fields validate format
- [ ] Email validation works correctly
- [ ] Mobile number validation (10 digits)
- [ ] Soft delete implemented for all DELETE operations
- [ ] Audit trail (modifiedBy, modifiedDate) captured on updates
- [ ] Pre-Sales stage progression validation (forward-only)
- [ ] Pre-Sales scope history maintained on updates
- [ ] Advance payments only allowed for Quotation/Confirmed stages
- [ ] Authorization rules enforced (canView, canCreate, canEdit, canDelete)
- [ ] Proper error messages returned for validation failures
- [ ] CORS configured for frontend origin
- [ ] Authentication token required and validated

---

**Document Version:** 1.0  
**Last Updated:** January 6, 2026  
**Contact:** Frontend Development Team
