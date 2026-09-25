import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Closer,
  Lead,
  StudentEnrollment,
  PaymentRecord,
  SalesSyncEvent,
  VerificationAuditLog,
  CloserPerformance,
  FilterState,
  FinanceSyncStatus,
  SalesDatabaseIntegrity,
  LeadStage,
  PaymentType,
  ProgramType
} from '../types';
import { salesApi } from '../api/salesApi';

interface SalesWorkflowContextType {
  isLoading: boolean;
  isSyncingFinance: boolean;
  connectionError: string | null;
  refreshData: () => Promise<void>;
  
  // Entities
  closers: Closer[];
  leads: Lead[];
  students: StudentEnrollment[];
  payments: PaymentRecord[];
  syncEvents: SalesSyncEvent[];
  auditLogs: VerificationAuditLog[];
  programOptions: ProgramType[];
  paymentTypeOptions: PaymentType[];
  effectivePeriod: string | null;
  filteredVerifiedPayments: PaymentRecord[];
  financeSync: FinanceSyncStatus | null;
  databaseIntegrity: SalesDatabaseIntegrity | null;

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
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivityAt'>) => Promise<Lead | null>;
  updateLeadStage: (leadId: string, stage: LeadStage) => Promise<void>;
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
  ) => Promise<{ studentId: string; paymentId: string } | null>;
  
  addPayment: (payment: {
    studentId: string;
    amount: number;
    paymentType: PaymentType;
    transactionRef: string;
    notes?: string;
  }) => Promise<PaymentRecord | null>;
  verifyPayment: (paymentId: string, notes?: string) => Promise<void>;
  rejectPayment: (paymentId: string, reason: string) => Promise<void>;
  updateCloserQuota: (
    closerId: string,
    monthlyTarget: number,
    collectionTarget: number,
    baseCommissionPct?: number,
    acceleratorPct?: number
  ) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  
  // Notification toast
  toastMessage: { title: string; desc: string; type: 'success' | 'info' | 'alert' } | null;
  dismissToast: () => void;
}

const SalesWorkflowContext = createContext<SalesWorkflowContextType | null>(null);

export const SalesWorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Closers & Quotas
  const [closers, setClosers] = useState<Closer[]>([]);

  // Leads
  const [leads, setLeads] = useState<Lead[]>([]);

  // Students
  const [students, setStudents] = useState<StudentEnrollment[]>([]);

  // Finance Payments
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Sales Sync Log
  const [syncEvents, setSyncEvents] = useState<SalesSyncEvent[]>([]);

  // Verification Audit Logs
  const [auditLogs, setAuditLogs] = useState<VerificationAuditLog[]>([]);
  const [financeSync, setFinanceSync] = useState<FinanceSyncStatus | null>(null);
  const [databaseIntegrity, setDatabaseIntegrity] = useState<SalesDatabaseIntegrity | null>(null);
  const lastFinanceSyncRef = useRef<string | null>(null);

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

  const applyDashboardData = (data: Awaited<ReturnType<typeof salesApi.loadDashboard>>) => {
    setClosers(data.closers);
    setLeads(data.leads);
    setStudents(data.students);
    setPayments(data.payments);
    setSyncEvents(data.syncEvents);
    setAuditLogs(data.auditLogs);
    setFinanceSync(data.financeSync);
    lastFinanceSyncRef.current = data.financeSync.syncedAt;
    setDatabaseIntegrity(data.integrity);
  };

  const refreshData = async () => {
    setIsSyncingFinance(true);
    try {
      const sync = await salesApi.syncFinance();
      if (sync.state === 'ready') {
        applyDashboardData(await salesApi.loadDashboard());
      } else {
        setFinanceSync(sync);
      }
      setConnectionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach the sales API.';
      setConnectionError(message);
      throw error;
    } finally {
      setIsSyncingFinance(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    salesApi.loadDashboard()
      .then((data) => {
        if (!isMounted) return;
        applyDashboardData(data);
        setConnectionError(null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setConnectionError(error instanceof Error ? error.message : 'Unable to reach the sales API.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const poll = window.setInterval(async () => {
      try {
        const status = await salesApi.financeSyncStatus();
        if (!isMounted) return;
        setFinanceSync(status);
        setIsSyncingFinance(status.state === 'syncing');

        if (status.state === 'ready' && status.syncedAt && status.syncedAt !== lastFinanceSyncRef.current) {
          applyDashboardData(await salesApi.loadDashboard());
          setConnectionError(null);
        }
      } catch (error) {
        if (isMounted) {
          setConnectionError(error instanceof Error ? error.message : 'Unable to refresh Sales data.');
        }
      }
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(poll);
    };
  }, []);

  const programOptions = useMemo(() => Array.from(new Set([
    ...leads.map((lead) => lead.targetProgram),
    ...students.map((student) => student.program),
    ...payments.map((payment) => payment.program)
  ])).sort(), [leads, payments, students]);

  const paymentTypeOptions = useMemo(
    () => Array.from(new Set(payments.map((payment) => payment.paymentType))).sort(),
    [payments]
  );

  const effectivePeriod = closers.find((closer) => closer.quota.effectivePeriod)?.quota.effectivePeriod || null;

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
      // Revenue belongs to the transaction period, not the later date Finance reviewed it.
      const verifiedDate = new Date(payment.createdAt);

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
      const closerSalePayments = closerVerifiedPayments.filter(
        (payment) => payment.incomeProduct !== 'Premium Collection'
      );
      const studentIdsWithVerifiedPayment = new Set(closerSalePayments.map((p) => p.studentId));
      const closerStudents = students.filter(
        (s) => s.assignedCloserId === closer.id && studentIdsWithVerifiedPayment.has(s.id)
      );
      
      const actualSales = closerSalePayments
        .reduce((sum, payment) => sum + payment.amount, 0);

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

      const closedDealsCount = new Set(
        closerSalePayments.map((payment) => payment.studentId)
      ).size;
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
    return filteredVerifiedPayments
      .filter((payment) => payment.incomeProduct !== 'Premium Collection')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }, [filteredVerifiedPayments]);

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
    const verifiedStudentIds = new Set(
      filteredVerifiedPayments
        .filter((payment) => payment.incomeProduct !== 'Premium Collection')
        .map((payment) => payment.studentId)
    );
    return students.filter((s) => verifiedStudentIds.has(s.id)).length;
  }, [filteredVerifiedPayments, students]);

  const avgSaleValue = verifiedStudentsCount > 0 ? totalVerifiedSales / verifiedStudentsCount : 0;

  const premiumStudentsCount = useMemo(() => {
    const verifiedStudentIds = new Set(
      filteredVerifiedPayments
        .filter((payment) => payment.incomeProduct !== 'Premium Collection')
        .map((payment) => payment.studentId)
    );
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
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<Lead | null> => {
    try {
      const newLead = await salesApi.createLead(leadData);
      setLeads((previous) => [newLead, ...previous]);
      showToast('New Lead Captured', `${newLead.fullName} added to the backend pipeline.`, 'info');
      return newLead;
    } catch (error) {
      showToast('Lead Not Saved', error instanceof Error ? error.message : 'The API request failed.', 'alert');
      return null;
    }
  };

  const updateLeadStage = async (leadId: string, stage: LeadStage): Promise<void> => {
    try {
      const updatedLead = await salesApi.updateLeadStage(leadId, stage);
      setLeads((previous) => previous.map((lead) => lead.id === leadId ? updatedLead : lead));
      showToast('Pipeline Updated', `Lead moved to ${stage.replace('_', ' ').toUpperCase()}`, 'info');
    } catch (error) {
      showToast('Pipeline Not Updated', error instanceof Error ? error.message : 'The API request failed.', 'alert');
    }
  };

  // STEP 1 & 2: Closer Closes Student & Submits to Finance System
  const closeStudentAndEnroll = async (
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
  ): Promise<{ studentId: string; paymentId: string } | null> => {
    const lead = leads.find((candidate) => candidate.id === leadId);
    if (!lead) {
      showToast('Enrollment Not Saved', 'The selected lead no longer exists.', 'alert');
      return null;
    }

    let totalInstallments = 1;
    if (studentData.paymentPlan === '2-Part Installment') totalInstallments = 2;
    if (studentData.paymentPlan === '3-Part Installment') totalInstallments = 3;

    try {
      const result = await salesApi.closeStudent(lead, studentData, {
        amount: paymentData.amount,
        paymentType: paymentData.paymentType,
        transactionRef: paymentData.transactionRef.trim(),
        installmentNumber: 1,
        totalInstallments,
        financeNotes: paymentData.notes
      });
      await refreshData();
      showToast(
        'Student Closed & Enrolled',
        `${studentData.fullName} and the pending payment were saved atomically by the backend.`,
        'success'
      );
      return { studentId: result.student.id, paymentId: result.payment.id };
    } catch (error) {
      showToast('Enrollment Not Saved', error instanceof Error ? error.message : 'The API request failed.', 'alert');
      return null;
    }
  };

  const addPayment = async (paymentData: {
    studentId: string;
    amount: number;
    paymentType: PaymentType;
    transactionRef: string;
    notes?: string;
  }): Promise<PaymentRecord | null> => {
    const student = students.find((candidate) => candidate.id === paymentData.studentId);
    if (!student) return null;

    try {
      const payment = await salesApi.createPayment({
        studentId: student.id,
        closerId: student.assignedCloserId,
        amount: paymentData.amount,
        paymentType: paymentData.paymentType,
        transactionRef: paymentData.transactionRef.trim(),
        installmentNumber: 1,
        totalInstallments: 1,
        financeNotes: paymentData.notes
      });
      setPayments((previous) => [payment, ...previous]);
      showToast('Payment Logged', 'The payment was saved to the backend verification queue.', 'success');
      return payment;
    } catch (error) {
      showToast('Payment Not Saved', error instanceof Error ? error.message : 'The API request failed.', 'alert');
      return null;
    }
  };

  const verifyPayment = async (paymentId: string, notes?: string): Promise<void> => {
    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) return;

    try {
      await salesApi.verifyPayment(paymentId, 'verified', notes);
      await refreshData();
      showToast(
        'Payment Verified & Synced!',
        `₱${targetPayment.amount.toLocaleString()} confirmed and persisted to the attribution ledger.`,
        'success'
      );
    } catch (error) {
      showToast('Verification Failed', error instanceof Error ? error.message : 'The API request failed.', 'alert');
    }
  };

  const rejectPayment = async (paymentId: string, reason: string): Promise<void> => {
    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment) return;

    try {
      await salesApi.verifyPayment(paymentId, 'rejected', reason);
      await refreshData();
      showToast('Payment Rejected', `Flagged for ${targetPayment.closerName} resolution.`, 'alert');
    } catch (error) {
      showToast('Rejection Failed', error instanceof Error ? error.message : 'The API request failed.', 'alert');
    }
  };

  const updateCloserQuota = async (
    closerId: string,
    monthlyTarget: number,
    collectionTarget: number,
    baseCommissionPct?: number,
    acceleratorPct?: number
  ): Promise<void> => {
    const closer = closers.find((candidate) => candidate.id === closerId);
    if (!closer) return;

    try {
      const updatedCloser = await salesApi.updateCloserQuota(closerId, {
        ...closer.quota,
        monthlyTarget,
        collectionTarget,
        baseCommissionPct: baseCommissionPct ?? closer.quota.baseCommissionPct,
        acceleratorPct: acceleratorPct ?? closer.quota.acceleratorPct
      });
      setClosers((previous) => previous.map((candidate) => candidate.id === closerId ? updatedCloser : candidate));
      showToast('Quota Targets Updated', 'Closer targets were saved to the backend.', 'info');
    } catch (error) {
      showToast('Quota Not Updated', error instanceof Error ? error.message : 'The API request failed.', 'alert');
    }
  };

  const resetFilters = () => setFilter(initialFilter);

  const resetToDefaults = async () => {
    setFilter(initialFilter);
    try {
      await refreshData();
      showToast('Data Refreshed', 'The latest state was loaded from the backend.', 'info');
    } catch {
      showToast('Refresh Failed', 'The backend could not be reached.', 'alert');
    }
  };

  return (
    <SalesWorkflowContext.Provider
      value={{
        isLoading,
        isSyncingFinance,
        connectionError,
        refreshData,
        closers,
        leads,
        students,
        payments,
        syncEvents,
        auditLogs,
        programOptions,
        paymentTypeOptions,
        effectivePeriod,
        filteredVerifiedPayments,
        financeSync,
        databaseIntegrity,
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
        addPayment,
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
