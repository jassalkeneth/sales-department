export type UserRole = 'sales_manager' | 'finance_officer' | 'closer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  closerId?: string; // for closers
}

export type ProgramType = string;

export type PaymentType = string;

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded';

export type LeadStage =
  | 'new_lead'
  | 'contacted'
  | 'demo_call'
  | 'negotiation'
  | 'enrolled'
  | 'closed_won'
  | 'lost';

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  targetProgram: ProgramType;
  assignedCloserId: string;
  stage: LeadStage;
  estimatedDealValue: number;
  source: string;
  createdAt: string;
  notes?: string;
  lastActivityAt: string;
  enrollmentId?: string;
}

export interface StudentEnrollment {
  id: string;
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
  program: ProgramType;
  tier: 'Standard' | 'Premium' | 'Elite Cohort';
  assignedCloserId: string;
  totalContractValue: number;
  paymentPlan: 'Full Upfront' | '2-Part Installment' | '3-Part Installment' | 'Income Share Option';
  enrolledAt: string;
  financeStatus: 'pending_payment' | 'partially_collected' | 'fully_collected';
}

export interface PaymentRecord {
  id: string;
  transactionRef: string;
  studentId: string;
  studentName: string;
  closerId: string;
  closerName: string;
  program: ProgramType;
  amount: number;
  paymentType: PaymentType;
  installmentNumber: number;
  totalInstallments: number;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  financeNotes?: string;
  isDuplicateFlag?: boolean;
  incomeProduct?: string;
}

export interface FinanceSyncStatus {
  source: string;
  sourceRecords: number;
  importedRecords: number;
  verifiedRecords: number;
  pendingRecords: number;
  skipped: Record<string, number>;
  sourceUpdatedAt?: string;
  syncedAt: string;
}

export interface SalesDatabaseIntegrity {
  financeRecords: number;
  orphanedStudents: number;
  orphanedClosers: number;
}

export interface CloserQuota {
  closerId: string;
  monthlyTarget: number; // Target booked sales ($)
  collectionTarget: number; // Target cash collected ($)
  effectivePeriod: string;
  baseCommissionPct: number; // e.g. 10%
  acceleratorPct: number; // e.g. 15% when >100%
}

export interface Closer {
  id: string;
  name: string;
  email: string;
  title: string;
  avatarUrl: string;
  quota: CloserQuota;
}

export interface CloserPerformance {
  closer: Closer;
  actualSales: number; // Sum of verified contract sales
  actualCollections: number; // Sum of verified cash payments
  pendingCollections: number; // In pending verification queue
  salesAchievementPct: number; // (actualSales / monthlyTarget) * 100
  collectionAchievementPct: number; // (actualCollections / collectionTarget) * 100
  remainingSalesTarget: number;
  remainingCollectionTarget: number;
  closedDealsCount: number;
  avgSaleValue: number;
  premiumStudentsCount: number;
  estimatedCommissions: number;
  rank: number;
}

export interface SalesSyncEvent {
  id: string;
  timestamp: string;
  paymentId: string;
  transactionRef: string;
  closerName: string;
  studentName: string;
  amount: number;
  program: ProgramType;
  status: 'SYNCED' | 'DEDUPLICATED' | 'VALIDATION_FAILED';
  verificationLatencyMs: number;
  details: string;
}

export interface VerificationAuditLog {
  id: string;
  paymentId: string;
  transactionRef: string;
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
  officerName: string;
  timestamp: string;
  notes?: string;
}

export interface DateRangeFilter {
  start: string;
  end: string;
}

export interface FilterState {
  closerId: string; // 'all' or specific closer
  program: string; // 'all' or specific program
  paymentType: string; // 'all' or specific type
  paymentStatus: string; // 'all' or specific status
  searchQuery: string;
  dateRange: 'all' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  customStartDate: string;
  customEndDate: string;
}
