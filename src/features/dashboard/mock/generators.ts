import { addDays, subDays, subMonths } from 'date-fns';
import type { Asset, Allocation, Booking, MaintenanceRequest, AuditItem, Department, Employee, Notification, ActivityLog } from '@/lib/types';

// MOCK: Replace with Supabase call in src/lib/api.ts

const today = new Date();

export function generateDepartments(): Department[] {
  return [
    { id: 'd1', name: 'IT Infrastructure', code: 'IT', headId: 'e1', headName: 'Alice Smith', parentDepartmentId: null, employeeCount: 15, status: 'Active' },
    { id: 'd2', name: 'Facilities', code: 'FAC', headId: 'e2', headName: 'Bob Jones', parentDepartmentId: null, employeeCount: 8, status: 'Active' },
    { id: 'd3', name: 'Field Operations', code: 'OPS', headId: 'e3', headName: 'Charlie Davis', parentDepartmentId: null, employeeCount: 42, status: 'Active' },
  ];
}

export function generateEmployees(): Employee[] {
  return [
    { id: 'e1', name: 'Alice Smith', email: 'alice@example.com', departmentId: 'd1', role: 'DepartmentHead', status: 'Active' },
    { id: 'e2', name: 'Bob Jones', email: 'bob@example.com', departmentId: 'd2', role: 'DepartmentHead', status: 'Active' },
    { id: 'e3', name: 'Charlie Davis', email: 'charlie@example.com', departmentId: 'd3', role: 'DepartmentHead', status: 'Active' },
    { id: 'e4', name: 'Diana Prince', email: 'diana@example.com', departmentId: 'd1', role: 'AssetManager', status: 'Active' },
    { id: 'e5', name: 'Evan Wright', email: 'evan@example.com', departmentId: 'd3', role: 'Employee', status: 'Active' },
  ];
}

export function generateAssets(): Asset[] {
  return [
    { id: 'a1', name: 'MacBook Pro 16"', assetTag: 'IT-LT-001', categoryId: 'c1', categoryName: 'Laptops', serialNumber: 'C02XD001', acquisitionDate: subMonths(today, 14).toISOString(), acquisitionCost: 2400, condition: 'Good', location: 'HQ - Floor 2', photoUrl: '', isSharedBookable: false, status: 'Allocated', departmentId: 'd1' },
    { id: 'a2', name: 'Dell XPS 15', assetTag: 'IT-LT-002', categoryId: 'c1', categoryName: 'Laptops', serialNumber: 'DL002', acquisitionDate: subMonths(today, 38).toISOString(), acquisitionCost: 1800, condition: 'Fair', location: 'HQ - Floor 2', photoUrl: '', isSharedBookable: false, status: 'UnderMaintenance', departmentId: 'd1' },
    { id: 'a3', name: 'Ford Transit Van', assetTag: 'OPS-V-001', categoryId: 'c2', categoryName: 'Vehicles', serialNumber: 'VIN123456789', acquisitionDate: subMonths(today, 24).toISOString(), acquisitionCost: 45000, condition: 'Good', location: 'Warehouse Parking', photoUrl: '', isSharedBookable: true, status: 'Available', departmentId: 'd3' },
    { id: 'a4', name: 'Sony A7IV Camera', assetTag: 'MKT-CAM-001', categoryId: 'c3', categoryName: 'AV Equipment', serialNumber: 'SNCAM1', acquisitionDate: subMonths(today, 6).toISOString(), acquisitionCost: 2500, condition: 'Excellent', location: 'Media Room', photoUrl: '', isSharedBookable: true, status: 'Allocated', departmentId: 'd1' },
    { id: 'a5', name: 'Conference Projector', assetTag: 'FAC-PRJ-001', categoryId: 'c3', categoryName: 'AV Equipment', serialNumber: 'PRJ1', acquisitionDate: subMonths(today, 40).toISOString(), acquisitionCost: 1200, condition: 'Fair', location: 'Room 3A', photoUrl: '', isSharedBookable: true, status: 'Available', departmentId: 'd2' },
    { id: 'a6', name: 'Toyota Hilux', assetTag: 'OPS-V-002', categoryId: 'c2', categoryName: 'Vehicles', serialNumber: 'VIN987654321', acquisitionDate: subMonths(today, 48).toISOString(), acquisitionCost: 38000, condition: 'Poor', location: 'Site B', photoUrl: '', isSharedBookable: true, status: 'Available', departmentId: 'd3' },
  ];
}

export function generateAllocations(): Allocation[] {
  return [
    { id: 'al1', assetId: 'a1', heldByType: 'employee', heldById: 'e4', heldByName: 'Diana Prince', allocatedDate: subMonths(today, 12).toISOString(), expectedReturnDate: null, returnedDate: null, status: 'Active' },
    { id: 'al2', assetId: 'a4', heldByType: 'employee', heldById: 'e5', heldByName: 'Evan Wright', allocatedDate: subDays(today, 5).toISOString(), expectedReturnDate: subDays(today, 1).toISOString(), returnedDate: null, status: 'Overdue' }, // Overdue!
  ];
}

export function generateBookings(): Booking[] {
  return [
    { id: 'b1', resourceAssetId: 'a3', resourceName: 'Ford Transit Van', bookedBy: 'e5', bookedByName: 'Evan Wright', startTime: addDays(today, 1).toISOString(), endTime: addDays(today, 3).toISOString(), status: 'Upcoming' },
    { id: 'b2', resourceAssetId: 'a5', resourceName: 'Conference Projector', bookedBy: 'e1', bookedByName: 'Alice Smith', startTime: subDays(today, 1).toISOString(), endTime: addDays(today, 1).toISOString(), status: 'Ongoing' },
  ];
}

export function generateMaintenanceRequests(): MaintenanceRequest[] {
  return [
    { id: 'm1', assetId: 'a2', assetName: 'Dell XPS 15', raisedBy: 'e1', issueDescription: 'Battery swelling and not holding charge', priority: 'High', photoUrl: '', status: 'InProgress', approvedBy: 'e1', technicianId: 'tech1', createdAt: subDays(today, 2).toISOString(), resolvedAt: null },
    { id: 'm2', assetId: 'a6', assetName: 'Toyota Hilux', raisedBy: 'e3', issueDescription: 'Regular 50k miles service', priority: 'Medium', photoUrl: '', status: 'Pending', approvedBy: null, technicianId: null, createdAt: subDays(today, 1).toISOString(), resolvedAt: null },
    { id: 'm3', assetId: 'a2', assetName: 'Dell XPS 15', raisedBy: 'e1', issueDescription: 'Screen flickering', priority: 'High', photoUrl: '', status: 'Resolved', approvedBy: 'e1', technicianId: 'tech1', createdAt: subMonths(today, 2).toISOString(), resolvedAt: subMonths(today, 1).toISOString() },
    { id: 'm4', assetId: 'a2', assetName: 'Dell XPS 15', raisedBy: 'e1', issueDescription: 'Keyboard keys sticking', priority: 'Medium', photoUrl: '', status: 'Resolved', approvedBy: 'e1', technicianId: 'tech1', createdAt: subMonths(today, 4).toISOString(), resolvedAt: subMonths(today, 4).toISOString() },
    { id: 'm5', assetId: 'a2', assetName: 'Dell XPS 15', raisedBy: 'e1', issueDescription: 'Overheating issue', priority: 'High', photoUrl: '', status: 'Resolved', approvedBy: 'e1', technicianId: 'tech1', createdAt: subMonths(today, 5).toISOString(), resolvedAt: subMonths(today, 5).toISOString() },
  ];
}

export function generateNotifications(): Notification[] {
  return [
    { id: 'n1', type: 'Asset Assigned', title: 'New Asset Assigned', message: 'MacBook Pro 16" has been assigned to you.', entityType: 'Asset', entityId: 'a1', isRead: false, createdAt: subDays(today, 1).toISOString() },
    { id: 'n2', type: 'Overdue Return Alert', title: 'Asset Overdue', message: 'Sony A7IV Camera is overdue for return.', entityType: 'Allocation', entityId: 'al2', isRead: false, createdAt: subDays(today, 0).toISOString() },
    { id: 'n3', type: 'Maintenance Approved', title: 'Maintenance Approved', message: 'Request for Dell XPS 15 has been approved.', entityType: 'Maintenance', entityId: 'm1', isRead: true, createdAt: subDays(today, 2).toISOString() },
  ];
}

export function generateActivityLogs(): ActivityLog[] {
  return [
    { id: 'log1', actor: 'Alice Smith', actorId: 'e1', action: 'Approved Maintenance', entityType: 'MaintenanceRequest', entityId: 'm1', entityName: 'Dell XPS 15', details: 'Approved battery replacement', timestamp: subDays(today, 1).toISOString(), category: 'Approvals' },
    { id: 'log2', actor: 'System', actorId: 'sys', action: 'Flagged Overdue', entityType: 'Allocation', entityId: 'al2', entityName: 'Sony A7IV Camera', details: 'Asset not returned by expected date', timestamp: subDays(today, 0).toISOString(), category: 'Alerts' },
    { id: 'log3', actor: 'Evan Wright', actorId: 'e5', action: 'Created Booking', entityType: 'Booking', entityId: 'b1', entityName: 'Ford Transit Van', details: 'Booked for upcoming site visit', timestamp: subDays(today, 2).toISOString(), category: 'Bookings' },
    { id: 'log4', actor: 'Diana Prince', actorId: 'e4', action: 'Registered Asset', entityType: 'Asset', entityId: 'a4', entityName: 'Sony A7IV Camera', details: 'Added to Media Room inventory', timestamp: subMonths(today, 6).toISOString(), category: 'All' },
  ];
}

export function generateAuditItems(): AuditItem[] {
  return [
    { id: 'aui1', cycleId: 'auc1', assetId: 'a5', assetName: 'Conference Projector', verificationStatus: 'Missing', notes: 'Not found in Room 3A', verifiedBy: 'e2', verifiedAt: subDays(today, 3).toISOString() },
    { id: 'aui2', cycleId: 'auc1', assetId: 'a6', assetName: 'Toyota Hilux', verificationStatus: 'Damaged', notes: 'Dent on rear bumper', verifiedBy: 'e3', verifiedAt: subDays(today, 2).toISOString() },
  ];
}
