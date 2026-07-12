export type AssetStatus = 'Available' | 'Allocated' | 'Reserved' | 'UnderMaintenance' | 'Lost' | 'Retired' | 'Disposed';

export interface Asset {
  id: string;
  name: string;
  assetTag: string;
  categoryId: string;
  categoryName: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: string;
  location: string;
  photoUrl: string;
  isSharedBookable: boolean;
  status: AssetStatus;
  departmentId: string;
}

export type HeldByType = 'employee' | 'department';

export interface Allocation {
  id: string;
  assetId: string;
  heldByType: HeldByType;
  heldById: string;
  heldByName: string;
  allocatedDate: string;
  expectedReturnDate: string | null;
  returnedDate: string | null;
  status: string;
}

export type BookingStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface Booking {
  id: string;
  resourceAssetId: string;
  resourceName: string;
  bookedBy: string;
  bookedByName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
}

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus = 'Pending' | 'Approved' | 'Rejected' | 'TechnicianAssigned' | 'InProgress' | 'Resolved';

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  assetName: string;
  raisedBy: string;
  issueDescription: string;
  priority: MaintenancePriority;
  photoUrl: string;
  status: MaintenanceStatus;
  approvedBy: string | null;
  technicianId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type AuditScopeType = 'department' | 'location';
export type AuditStatus = 'Open' | 'Closed';

export interface AuditCycle {
  id: string;
  scopeType: AuditScopeType;
  scopeValue: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: AuditStatus;
  createdBy: string;
  auditorIds: string[];
}

export type AuditVerificationStatus = 'Verified' | 'Missing' | 'Damaged';

export interface AuditItem {
  id: string;
  cycleId: string;
  assetId: string;
  assetName: string;
  verificationStatus: AuditVerificationStatus;
  notes: string;
  verifiedBy: string;
  verifiedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headId: string;
  headName: string;
  parentDepartmentId: string | null;
  employeeCount: number;
  status: string;
}

export type EmployeeRole = 'Employee' | 'DepartmentHead' | 'AssetManager' | 'Admin';

export interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  role: EmployeeRole;
  status: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: string;
  timestamp: string;
  category: 'Alerts' | 'Approvals' | 'Bookings' | 'All';
}
