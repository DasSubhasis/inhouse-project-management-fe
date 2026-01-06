# Serial Numbers API Specification

## Overview
This document specifies the JSON structure for serial numbers functionality in the Pre-Sales API.

## Data Structure

### Serial Numbers in API Response

The `serialNumbers` array should be included in the `getPreSalesById` response and `getAllPreSales` response:

```json
{
  "success": true,
  "data": {
    "projectNo": 104,
    "partyName": "TESTT D",
    "projectName": "WMS",
    "contactPerson": "DEMO",
    "mobileNumber": "6789876567",
    "emailId": "test@gmail.com",
    "agentName": "DEMO",
    "projectValue": 30000.00,
    "scopeOfDevelopment": "TESTing Department new scrope",
    "currentStage": "Confirmed",
    "createdById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
    "createdByName": "Debangana Gupta",
    "createdDate": "2026-01-06 15:00:32",
    "modifiedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
    "modifiedByName": "Debangana Gupta",
    "modifiedDate": "2026-01-06 18:10:25",
    
    "serialNumbers": [
      {
        "serialNumber": "QTN/2026/0104",
        "version": "v1.0",
        "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
        "recordedByName": "Debangana Gupta",
        "recordedDate": "2026-01-06 15:00:32"
      },
      {
        "serialNumber": "QTN/2026/0104",
        "version": "v2.0",
        "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
        "recordedByName": "Debangana Gupta",
        "recordedDate": "2026-01-06 16:30:15"
      },
      {
        "serialNumber": "PO/2026/0104",
        "version": "v1.0",
        "recordedById": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
        "recordedByName": "John Doe",
        "recordedDate": "2026-01-06 17:45:22"
      }
    ],
    
    "scopeHistory": [...],
    "stageHistory": [...],
    "attachmentHistory": [...],
    "advancePayments": [...]
  }
}
```

## Field Specifications

### SerialNumber Object

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `serialNumber` | string | Yes | The serial/reference number for quotation/PO/etc. | `"QTN/2026/0104"` |
| `version` | string | No | Version of the serial number (optional) | `"v1.0"`, `"v2.0"` |
| `recordedById` | string (UUID) | Yes | User ID who recorded this serial number | `"da5f27c5-1de4-4e5c-81e7-d6865145777f"` |
| `recordedByName` | string | Yes | Full name of the user who recorded | `"Debangana Gupta"` |
| `recordedDate` | string (datetime) | Yes | Date and time when recorded | `"2026-01-06 15:00:32"` |

## Business Rules

1. **Multiple Serial Numbers**: A project can have multiple serial numbers (e.g., quotation number, PO number, invoice number)
2. **Versioning**: Each serial number can have multiple versions tracked separately
3. **History Tracking**: Each entry records who added it and when
4. **Same Number, Different Versions**: The same serial number can appear multiple times with different versions (e.g., `QTN/2026/0104 v1.0`, `QTN/2026/0104 v2.0`)

## Example Use Cases

### Example 1: Project with Quotation History
```json
"serialNumbers": [
  {
    "serialNumber": "QTN/2026/0104",
    "version": "v1.0",
    "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
    "recordedByName": "Debangana Gupta",
    "recordedDate": "2026-01-06 10:00:00"
  },
  {
    "serialNumber": "QTN/2026/0104",
    "version": "v2.0",
    "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
    "recordedByName": "Debangana Gupta",
    "recordedDate": "2026-01-06 14:30:00"
  }
]
```

### Example 2: Project with Multiple Document Types
```json
"serialNumbers": [
  {
    "serialNumber": "QTN/2026/0104",
    "version": "v1.0",
    "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
    "recordedByName": "Debangana Gupta",
    "recordedDate": "2026-01-06 10:00:00"
  },
  {
    "serialNumber": "PO/2026/0104",
    "recordedById": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
    "recordedByName": "John Doe",
    "recordedDate": "2026-01-06 15:00:00"
  },
  {
    "serialNumber": "INV/2026/0104",
    "recordedById": "b2c3d4e5-6f7g-8h9i-0j1k-l2m3n4o5p6q7",
    "recordedByName": "Jane Smith",
    "recordedDate": "2026-01-06 18:00:00"
  }
]
```

### Example 3: Empty Serial Numbers
```json
"serialNumbers": []
```

## Frontend Mapping

The frontend will automatically map the API response:
- `recordedByName` → `recordedBy` (for display)
- Preserves `recordedById`, `recordedByName`, and `recordedDate` for audit trail

## Database Schema Suggestion

### Table: `serial_numbers`
```sql
CREATE TABLE serial_numbers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    project_no INT NOT NULL,
    serial_number NVARCHAR(100) NOT NULL,
    version NVARCHAR(50) NULL,
    recorded_by_id UNIQUEIDENTIFIER NOT NULL,
    recorded_by_name NVARCHAR(255) NOT NULL,
    recorded_date DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (project_no) REFERENCES pre_sales(project_no),
    FOREIGN KEY (recorded_by_id) REFERENCES users(user_id)
);

CREATE INDEX idx_serial_numbers_project ON serial_numbers(project_no);
CREATE INDEX idx_serial_numbers_recorded_date ON serial_numbers(recorded_date);
```

## API Endpoints to Update

### 1. GET /api/PreSales/{projectNo}
Add `serialNumbers` array to response

### 2. GET /api/PreSales
Add `serialNumbers` array to each project in response

### 3. POST /api/PreSales/{projectNo}/serial-numbers (NEW)
Add a new serial number entry

**Request Body:**
```json
{
  "serialNumber": "QTN/2026/0104",
  "version": "v1.0",
  "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Serial number added successfully",
  "data": {
    "serialNumber": "QTN/2026/0104",
    "version": "v1.0",
    "recordedById": "da5f27c5-1de4-4e5c-81e7-d6865145777f",
    "recordedByName": "Debangana Gupta",
    "recordedDate": "2026-01-06 15:00:32"
  }
}
```

## Notes

1. The `version` field is optional - if not provided, it can be `null` or omitted
2. Date format: `YYYY-MM-DD HH:MM:SS` (24-hour format)
3. All user IDs should be UUIDs
4. Serial numbers should support various formats (QTN, PO, INV, etc.)
5. The same serial number can have multiple versions, tracking revisions
