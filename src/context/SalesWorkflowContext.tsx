import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Closer,
  Lead,
  StudentEnrollment,
  PaymentRecord,
  SalesSyncEvent,
  VerificationAuditLog,
  CloserPerformance,
  FilterState,
  LeadStage,
  PaymentType,
  ProgramType
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLOSERS,
  INITIAL_LEADS,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
  INITIAL_SYNC_EVENTS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';

interface SalesWorkflowContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  
  // Entities
  closers: Closer[];
  leads: Lead[];
  students: StudentEnrollment[];
  payments: PaymentRecord[];
  syncEvents: SalesSyncEvent[];
  auditLogs: VerificationAuditLog[];
  filteredVerifiedPayments: PaymentRecord[];

  // Filters
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Real-time Computed KPIs
  totalVerifiedSales: number;
  totalVerifiedCollections: number;
  totalPendingCollections: number;
  teamSalesTarget: number;
  teamCollectionTarget: number;
  salesAchievementPct: number;
  collectionAchievementPct: number;
  remainingTeamSalesTarget: number;
  remainingTeamCollectionTarget: number;
  avgSaleValue: number;
  premiumStudentsCount: number;
  verifiedStudentsCount: number;
  closersOnQuota: number;
  closersOffQuota: number;
  closerPerformances: CloserPerformance[];

  // Lead Funnel & Conversion Stats
  funnelCounts: Record<LeadStage, number>;
  totalLeadsCount: number;
  conversionRates: {
    leadToContacted: number;
    contactedToDemo: number;
    demoToNegotiation: number;
    negotiationToEnrollment: number;
    enrollmentToVerifiedWon: number;
    overallLeadToWonRate: number;
  };

  // Workflow Handlers
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivityAt'>) => Lead;
  updateLeadStage: (leadId: string, stage: LeadStage) => void;
  closeStudentAndEnroll: (
    leadId: string,
    studentData: {
      fullName: string;
      email: string;
      phone: string;
      program: ProgramType;
      tier: 'Standard' | 'Premium' | 'Elite Cohort';
      totalContractValue: number;
      paymentPlan: 'Full Upfront' | '2-Part Installment' | '3-Part Installment' | 'Income Share Option';
    },
    paymentData: {
      amount: number;
      paymentType: PaymentType;
      transactionRef: string;
      notes?: string;
    }
  ) => { studentId: string; paymentId: string };
  
  verifyPayment: (paymentId: string, notes?: string) => void;
  rejectPayment: (paymentId: string, reason: string) => void;
  updateCloserQuota: (
    closerId: string,
    monthlyTarget: number,
    collectionTarget: number,
    baseCommissionPct?: number,
    acceleratorPct?: number
  ) => void;
  resetToDefaults: () => void;
  
  // Notification toast
  toastMessage: { title: string; desc: string; type: 'success' | 'info' | 'alert' } | null;
  dismissToast: () => void;
}

const SalesWorkflowContext = createContext<SalesWorkflowContextType | null>(null);

const STORAGE_PREFIX = 'tmt_sales_v1_';

export const SalesWorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Users
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currentUser`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_USERS[0]; // Default to Executive Sales Manager
  });

  // Closers & Quotas
  const [closers, setClosers] = useState<Closer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}closers`);
    return saved ? JSON.parse(saved) : INITIAL_CLOSERS;
  });

  // Leads
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}leads`);
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  // Students
  const [students, setStudents] = useState<StudentEnrollment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}students`);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  // Finance Payments
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}payments`);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  // Sales Sync Log
  const [syncEvents, setSyncEvents] = useState<SalesSyncEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}syncEvents`);
    return saved ? JSON.parse(saved) : INITIAL_SYNC_EVENTS;
  });

  // Verification Audit Logs
  const [auditLogs, setAuditLogs] = useState<VerificationAuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}auditLogs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Filters State
  const initialFilter: FilterState = {
    closerId: 'all',
    program: 'all',
    paymentType: 'all',
    paymentStatus: 'all',
    searchQuery: '',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: ''
  };
  const [filter, setFilter] = useState<FilterState>(initialFilter);

  // Toast
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'alert';
  } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'alert' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  const dismissToast = () => setToastMessage(null);

  // Persist State Changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}currentUser`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}closers`, JSON.stringify(closers));
  }, [closers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}leads`, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}students`, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}syncEvents`, JSON.stringify(syncEvents));
  }, [syncEvents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}auditLogs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Compute Verified and Filtered Datasets
  const allVerifiedPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'verified');
  }, [payments]);

  const pendingPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'pending');
  }, [payments]);

  const filteredVerifiedPayments = useMemo(() => {
    const studentsById = new Map(students.map((student) => [student.id, student]));
    const now = new Date();
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const today = startOfDay(now);
    const searchQuery = filter.searchQuery.trim().toLowerCase();

    return allVerifiedPayments.filter((payment) => {
      const student = studentsById.get(payment.studentId);
      const verifiedDate = new Date(payment.verifiedAt || payment.createdAt);

      if (filter.closerId !== 'all' && payment.closerId !== filter.closerId) return false;
      if (filter.program !== 'all' && payment.program !== filter.program) return false;
      if (filter.paymentType !== 'all' && payment.paymentType !== filter.paymentType) return false;

      if (searchQuery) {
        const searchableText = [payment.studentName, payment.closerName, payment.program, student?.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(searchQuery)) return false;
      }

      if (filter.dateRange === 'daily' && startOfDay(verifiedDate).getTime() !== today.getTime()) return false;
      if (filter.dateRange === 'weekly' && verifiedDate < startOfWeek) return false;
      if (filter.dateRange === 'monthly' && verifiedDate < startOfMonth) return false;
      if (filter.dateRange === 'quarterly' && verifiedDate < startOfQuarter) return false;
      if (filter.dateRange === 'yearly' && verifiedDate < startOfYear) return false;
      if (filter.dateRange === 'custom') {
        const start = filter.customStartDate ? new Date(`${filter.customStartDate}T00:00:00`) : null;
        const end = filter.customEndDate ? new Date(`${filter.customEndDate}T23:59:59.999`) : null;
        if ((start && verifiedDate < start) || (end && verifiedDate > end)) return false;
      }

      return true;
    });
  }, [allVerifiedPayments, filter, students]);

  const reportingClosers = useMemo(() => {
    return filter.closerId === 'all'
      ? closers
      : closers.filter((closer) => closer.id === filter.closerId);
  }, [closers, filter.closerId]);

  // Closer Performances & Leaderboard Engine
  const closerPerformances: CloserPerformance[] = useMemo(() => {
    return reportingClosers.map((closer) => {
      // Find all verified payments attributed to this closer
      const closerVerifiedPayments = filteredVerifiedPayments.filter((p) => p.closerId === closer.id);
      const actualCollections = closerVerifiedPayments.reduce((acc, curr) => acc + curr.amount, 0);

      // Find all students with at least 1 verified payment attributed to this closer
      const studentIdsWithVerifiedPayment = new Set(closerVerifiedPayments.map((p) => p.studentId));
      const closerStudents = students.filter(
        (s) => s.assignedCloserId === closer.id && studentIdsWithVerifiedPayment.has(s.id)
      );
      
      const actualSales = closerStudents.reduce((acc, curr) => acc + curr.totalContractValue, 0);

      // Pending verification amount for this closer
      const pendingCollections = payments
        .filter((p) => p.closerId === closer.id && p.status === 'pending')
        .reduce((acc, curr) => acc + curr.amount, 0);

      const salesAchievementPct = closer.quota.monthlyTarget > 0
        ? (actualSales / closer.quota.monthlyTarget) * 100
        : 0;

      const collectionAchievementPct = closer.quota.collectionTarget > 0
        ? (actualCollections / closer.quota.collectionTarget) * 100
        : 0;

      const remainingSalesTarget = Math.max(0, closer.quota.monthlyTarget - actualSales);
      const remainingCollectionTarget = Math.max(0, closer.quota.collectionTarget - actualCollections);

      const closedDealsCount = closerStudents.length;
      const avgSaleValue = closedDealsCount > 0 ? actualSales / closedDealsCount : 0;
      const premiumStudentsCount = closerStudents.filter(
        (s) => s.tier === 'Premium' || s.tier === 'Elite Cohort'
      ).length;

      // Commission calculations: Base % up to 100% quota, Accelerator % on surplus
      let estimatedCommissions = 0;
      if (actualCollections <= closer.quota.collectionTarget) {
        estimatedCommissions = (actualCollections * closer.quota.baseCommissionPct) / 100;
      } else {
        const basePool = (closer.quota.collectionTarget * closer.quota.baseCommissionPct) / 100;
        const surplus = actualCollections - closer.quota.collectionTarget;
        const acceleratorPool = (surplus * closer.quota.acceleratorPct) / 100;
        estimatedCommissions = basePool + acceleratorPool;
      }

      return {
        closer,
        actualSales,
        actualCollections,
        pendingCollections,
        salesAchievementPct,
        collectionAchievementPct,
        remainingSalesTarget,
        remainingCollectionTarget,
        closedDealsCount,
        avgSaleValue,
        premiumStudentsCount,
        estimatedCommissions,
        rank: 0 // set below
      };
    })
    .sort((a, b) => b.actualSales - a.actualSales)
    .map((perf, index) => ({
      ...perf,
      rank: index + 1
    }));
  }, [reportingClosers, filteredVerifiedPayments, payments, students]);

  // Team Aggregate KPIs
  const totalVerifiedSales = useMemo(() => {
    // Unique students who have at least one verified payment
    const verifiedStudentIds = new Set(filteredVerifiedPayments.map((p) => p.studentId));
    return students
      .filter((s) => verifiedStudentIds.has(s.id))
      .reduce((sum, s) => sum + s.totalContractValue, 0);
  }, [filteredVerifiedPayments, students]);

  const totalVerifiedCollections = useMemo(() => {
    return filteredVerifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredVerifiedPayments]);

  const totalPendingCollections = useMemo(() => {
    return pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [pendingPayments]);

  const teamSalesTarget = useMemo(() => {
    return reportingClosers.reduce((sum, c) => sum + c.quota.monthlyTarget, 0);
  }, [reportingClosers]);

  const teamCollectionTarget = useMemo(() => {
    return reportingClosers.reduce((sum, c) => sum + c.quota.collectionTarget, 0);
  }, [reportingClosers]);

  const salesAchievementPct = teamSalesTarget > 0 ? (totalVerifiedSales / teamSalesTarget) * 100 : 0;
  const collectionAchievementPct = teamCollectionTarget > 0 ? (totalVerifiedCollections / teamCollectionTarget) * 100 : 0;
  const remainingTeamSalesTarget = Math.max(0, teamSalesTarget - totalVerifiedSales);
  const remainingTeamCollectionTarget = Math.max(0, teamCollectionTarget - totalVerifiedCollections);

  const verifiedStudentsCount = useMemo(() => {
    const verifiedStudentIds = new Set(filteredVerifiedPayments.map((p) => p.studentId));
    return students.filter((s) => verifiedStudentIds.has(s.id)).length;
  }, [filteredVerifiedPayments, students]);

  const avgSaleValue = verifiedStudentsCount > 0 ? totalVerifiedSales / verifiedStudentsCount : 0;

  const premiumStudentsCount = useMemo(() => {
    const verifiedStudentIds = new Set(filteredVerifiedPayments.map((p) => p.studentId));
    return students.filter(
      (s) => verifiedStudentIds.has(s.id) && (s.tier === 'Premium' || s.tier === 'Elite Cohort')
    ).length;
  }, [filteredVerifiedPayments, students]);

  const closersOnQuota = useMemo(() => {
    return closerPerformances.filter((performance) => performance.salesAchievementPct >= 100).length;
  }, [closerPerformances]);

  const closersOffQuota = closerPerformances.length - closersOnQuota;

  // Funnel & Pipeline Real-time Calculations
  const funnelCounts = useMemo(() => {
    const counts: Record<LeadStage, number> = {
      new_lead: 0,
      contacted: 0,
      demo_call: 0,
      negotiation: 0,
      enrolled: 0,
      closed_won: 0,
      lost: 0
    };
    leads.forEach((l) => {
      counts[l.stage] = (counts[l.stage] || 0) + 1;
    });
    const leadIds = new Set(leads.map((lead) => lead.id));

    // Include imported enrollments that have no corresponding pipeline lead.
    students.forEach((s) => {
      if (leadIds.has(s.leadId)) return;

      const hasVerified = allVerifiedPayments.some((p) => p.studentId === s.id);
      if (hasVerified) {
        counts.closed_won += 1;
      } else {
        counts.enrolled += 1;
      }
    });
    return counts;
  }, [leads, students, allVerifiedPayments]);

  const totalLeadsCount = useMemo(() => {
    return (
      funnelCounts.new_lead +
      funnelCounts.contacted +
      funnelCounts.demo_call +
      funnelCounts.negotiation +
      funnelCounts.enrolled +
      funnelCounts.closed_won +
      funnelCounts.lost
    );
  }, [funnelCounts]);

  const conversionRates = useMemo(() => {
    // Cumulative funnel flow calculations
    const reachedContacted =
      funnelCounts.contacted +
      funnelCounts.demo_call +
      funnelCounts.negotiation +
      funnelCounts.enrolled +
      funnelCounts.closed_won;
    const reachedDemo =
      funnelCounts.demo_call +
      funnelCounts.negotiation +
      funnelCounts.enrolled +
      funnelCounts.closed_won;
    const reachedNegotiation =
      funnelCounts.negotiation + funnelCounts.enrolled + funnelCounts.closed_won;
    const reachedEnrolled = funnelCounts.enrolled + funnelCounts.closed_won;
    const reachedWon = funnelCounts.closed_won;

    const leadToContacted = totalLeadsCount > 0 ? (reachedContacted / totalLeadsCount) * 100 : 0;
    const contactedToDemo = reachedContacted > 0 ? (reachedDemo / reachedContacted) * 100 : 0;
    const demoToNegotiation = reachedDemo > 0 ? (reachedNegotiation / reachedDemo) * 100 : 0;
    const negotiationToEnrollment =
      reachedNegotiation > 0 ? (reachedEnrolled / reachedNegotiation) * 100 : 0;
    const enrollmentToVerifiedWon =
      reachedEnrolled > 0 ? (reachedWon / reachedEnrolled) * 100 : 0;
    const overallLeadToWonRate = totalLeadsCount > 0 ? (reachedWon / totalLeadsCount) * 100 : 0;

    return {
      leadToContacted,
      contactedToDemo,
      demoToNegotiation,
      negotiationToEnrollment,
      enrollmentToVerifiedWon,
      overallLeadToWonRate
    };
  }, [funnelCounts, totalLeadsCount]);

  // Actions
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastActivityAt'>): Lead => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };
    setLeads((prev) => [newLead, ...prev]);
    showToast('New Lead Captured', `${newLead.fullName} added to pipeline.`, 'info');
    return newLead;
  };

  const updateLeadStage = (leadId: string, stage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, stage, lastActivityAt: new Date().toISOString() }
          : l
      )
    );
    showToast('Pipeline Updated', `Lead moved to ${stage.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // STEP 1 & 2: Closer Closes Student & Submits to Finance System
  const closeStudentAndEnroll = (
    leadId: string,
    studentData: {
      fullName: string;
      email: string;
      phone: string;
      program: ProgramType;
      tier: 'Standard' | 'Premium' | 'Elite Cohort';
      totalContractValue: number;
      paymentPlan: 'Full Upfront' | '2-Part Installment' | '3-Part Installment' | 'Income Share Option';
    },
    paymentData: {
      amount: number;
      paymentType: PaymentType;
      transactionRef: string;
      notes?: string;
    }
  ) => {
    const studentId = `stu-${Date.now().toString().slice(-4)}`;
    const paymentId = `pay-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const targetCloser =
      currentUser.role === 'closer' && currentUser.closerId
        ? closers.find((c) => c.id === currentUser.closerId) || closers[0]
        : closers[0];

    // Determine installments count
    let totalInstallments = 1;
    if (studentData.paymentPlan === '2-Part Installment') totalInstallments = 2;
    if (studentData.paymentPlan === '3-Part Installment') totalInstallments = 3;

    // 1. Create Student Enrollment
    const newStudent: StudentEnrollment = {
      id: studentId,
      leadId,
      fullName: studentData.fullName,
      email: studentData.email,
      phone: studentData.phone,
      program: studentData.program,
      tier: studentData.tier,
      assignedCloserId: targetCloser.id,
      totalContractValue: studentData.totalContractValue,
      paymentPlan: studentData.paymentPlan,
      enrolledAt: nowIso,
      financeStatus: 'pending_payment'
    };

    // 2. Create Initial Finance Payment Record (Status: PENDING)
    const newPayment: PaymentRecord = {
      id: paymentId,
      transactionRef: paymentData.transactionRef.trim() || `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      studentId,
      studentName: studentData.fullName,
      closerId: targetCloser.id,
      closerName: targetCloser.name,
      program: studentData.program,
      amount: paymentData.amount,
      paymentType: paymentData.paymentType,
      installmentNumber: 1,
      totalInstallments,
      status: 'pending',
      createdAt: nowIso,
      financeNotes: paymentData.notes || 'Submitted by admissions closer. Awaiting bank / processor settlement.'
    };

    // 3. Update Lead
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: 'enrolled',
              enrollmentId: studentId,
              lastActivityAt: nowIso
            }
          : l
      )
    );

    setStudents((prev) => [newStudent, ...prev]);
    setPayments((prev) => [newPayment, ...prev]);

    showToast(
      'Student Closed & Enrolled',
      `${studentData.fullName} enrolled ($${studentData.totalContractValue.toLocaleString()}). Payment of $${paymentData.amount.toLocaleString()} is now PENDING verification in Finance.`,
      'success'
    );

    return { studentId, paymentId };
  };

  // STEP 3, 4 & 5: Finance Verification -> Sales Data Sync -> Attribution
  const verifyPayment = (paymentId: string, notes?: string) => {
    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) return;

    const nowIso = new Date().toISOString();
    const officerName = currentUser.name;

    // Deduplication check: Check if same transactionRef already exists and verified
    const isDuplicate = payments.some(
      (p) => p.id !== paymentId && p.transactionRef === targetPayment.transactionRef && p.status === 'verified'
    );

    if (isDuplicate) {
      showToast(
        'Duplicate Transaction Prevented',
        `Transaction Ref "${targetPayment.transactionRef}" is already recorded in the ledger!`,
        'alert'
      );
      return;
    }

    // 1. Update Payment Record to 'verified'
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'verified',
              verifiedAt: nowIso,
              verifiedBy: officerName,
              financeNotes: notes || p.financeNotes || 'Verified by Finance verification team.'
            }
          : p
      )
    );

    // 2. Update Student Enrollment Status
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === targetPayment.studentId) {
          const isComplete =
            targetPayment.installmentNumber >= targetPayment.totalInstallments ||
            targetPayment.amount >= s.totalContractValue;
          return {
            ...s,
            financeStatus: isComplete ? 'fully_collected' : 'partially_collected'
          };
        }
        return s;
      })
    );

    // 3. Update associated Lead to 'closed_won'
    const student = students.find((s) => s.id === targetPayment.studentId);
    if (student?.leadId) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === student.leadId
            ? { ...l, stage: 'closed_won', lastActivityAt: nowIso }
            : l
        )
      );
    }

    // 4. Record Sales Sync Event
    const latency = Math.floor(65 + Math.random() * 85);
    const syncEvent: SalesSyncEvent = {
      id: `sync-${Date.now()}`,
      timestamp: nowIso,
      paymentId: targetPayment.id,
      transactionRef: targetPayment.transactionRef,
      closerName: targetPayment.closerName,
      studentName: targetPayment.studentName,
      amount: targetPayment.amount,
      program: targetPayment.program,
      status: 'SYNCED',
      verificationLatencyMs: latency,
      details: `Attribution matched: $${targetPayment.amount.toLocaleString()} credited to ${targetPayment.closerName} for ${targetPayment.program}.`
    };
    setSyncEvents((prev) => [syncEvent, ...prev]);

    // 5. Record Verification Audit Log
    const auditLog: VerificationAuditLog = {
      id: `audit-${Date.now()}`,
      paymentId: targetPayment.id,
      transactionRef: targetPayment.transactionRef,
      previousStatus: targetPayment.status,
      newStatus: 'verified',
      officerName,
      timestamp: nowIso,
      notes: notes || 'Verified and approved for sales attribution.'
    };
    setAuditLogs((prev) => [auditLog, ...prev]);

    showToast(
      'Payment Verified & Synced!',
      `$${targetPayment.amount.toLocaleString()} confirmed. Attribution credited to ${targetPayment.closerName}.`,
      'success'
    );
  };

  const rejectPayment = (paymentId: string, reason: string) => {
    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) return;

    const nowIso = new Date().toISOString();
    const officerName = currentUser.name;

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'rejected',
              verifiedAt: nowIso,
              verifiedBy: officerName,
              financeNotes: `Rejected: ${reason}`
            }
          : p
      )
    );

    const auditLog: VerificationAuditLog = {
      id: `audit-${Date.now()}`,
      paymentId: targetPayment.id,
      transactionRef: targetPayment.transactionRef,
      previousStatus: targetPayment.status,
      newStatus: 'rejected',
      officerName,
      timestamp: nowIso,
      notes: reason
    };
    setAuditLogs((prev) => [auditLog, ...prev]);

    showToast('Payment Rejected', `Flagged for ${targetPayment.closerName} resolution.`, 'alert');
  };

  const updateCloserQuota = (
    closerId: string,
    monthlyTarget: number,
    collectionTarget: number,
    baseCommissionPct?: number,
    acceleratorPct?: number
  ) => {
    setClosers((prev) =>
      prev.map((c) =>
        c.id === closerId
          ? {
              ...c,
              quota: {
                ...c.quota,
                monthlyTarget,
                collectionTarget,
                baseCommissionPct: baseCommissionPct ?? c.quota.baseCommissionPct,
                acceleratorPct: acceleratorPct ?? c.quota.acceleratorPct
              }
            }
          : c
      )
    );
    showToast('Quota Targets Updated', 'Closer quota and targets successfully recalculated.', 'info');
  };

  const resetFilters = () => setFilter(initialFilter);

  const resetToDefaults = () => {
    setClosers(INITIAL_CLOSERS);
    setLeads(INITIAL_LEADS);
    setStudents(INITIAL_STUDENTS);
    setPayments(INITIAL_PAYMENTS);
    setSyncEvents(INITIAL_SYNC_EVENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setFilter(initialFilter);
    showToast('Demo Data Reset', 'Workflow state re-initialized to initial benchmark state.', 'info');
  };

  return (
    <SalesWorkflowContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        closers,
        leads,
        students,
        payments,
        syncEvents,
        auditLogs,
        filteredVerifiedPayments,
        filter,
        setFilter,
        resetFilters,
        totalVerifiedSales,
        totalVerifiedCollections,
        totalPendingCollections,
        teamSalesTarget,
        teamCollectionTarget,
        salesAchievementPct,
        collectionAchievementPct,
        remainingTeamSalesTarget,
        remainingTeamCollectionTarget,
        avgSaleValue,
        premiumStudentsCount,
        verifiedStudentsCount,
        closersOnQuota,
        closersOffQuota,
        closerPerformances,
        funnelCounts,
        totalLeadsCount,
        conversionRates,
        addLead,
        updateLeadStage,
        closeStudentAndEnroll,
        verifyPayment,
        rejectPayment,
        updateCloserQuota,
        resetToDefaults,
        toastMessage,
        dismissToast
      }}
    >
      {children}
    </SalesWorkflowContext.Provider>
  );
};

export const useSalesWorkflow = () => {
  const context = useContext(SalesWorkflowContext);
  if (!context) {
    throw new Error('useSalesWorkflow must be used within a SalesWorkflowProvider');
  }
  return context;
};
