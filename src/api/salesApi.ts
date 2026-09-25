import {
  Closer,
  FinanceSyncStatus,
  Lead,
  PaymentRecord,
  SalesSyncEvent,
  StudentEnrollment,
  User,
  VerificationAuditLog
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'tmt-sales-access-token';

type ApiRecord = Record<string, unknown>;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    if (response.status === 401 && path !== '/login' && token) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new Event('sales-auth-expired'));
    }

    const body = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null;
    const validationMessage = body?.errors ? Object.values(body.errors).flat()[0] : undefined;
    throw new ApiError(validationMessage || body?.message || `API request failed (${response.status})`, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

const stringValue = (record: ApiRecord, key: string) => String(record[key] ?? '');
const numberValue = (record: ApiRecord, key: string) => Number(record[key] ?? 0);

const mapCloser = (record: ApiRecord): Closer => ({
  id: stringValue(record, 'id'),
  name: stringValue(record, 'name'),
  email: stringValue(record, 'email'),
  title: stringValue(record, 'title'),
  avatarUrl: stringValue(record, 'avatar_url'),
  quota: {
    closerId: stringValue(record, 'id'),
    monthlyTarget: numberValue(record, 'monthly_target'),
    collectionTarget: numberValue(record, 'collection_target'),
    effectivePeriod: stringValue(record, 'effective_period'),
    baseCommissionPct: numberValue(record, 'base_commission_pct'),
    acceleratorPct: numberValue(record, 'accelerator_pct')
  }
});

const mapLead = (record: ApiRecord): Lead => ({
  id: stringValue(record, 'id'),
  fullName: stringValue(record, 'full_name'),
  email: stringValue(record, 'email'),
  phone: stringValue(record, 'phone'),
  targetProgram: stringValue(record, 'target_program') as Lead['targetProgram'],
  assignedCloserId: stringValue(record, 'assigned_closer_id'),
  stage: stringValue(record, 'stage') as Lead['stage'],
  estimatedDealValue: numberValue(record, 'estimated_deal_value'),
  source: stringValue(record, 'source') as Lead['source'],
  createdAt: stringValue(record, 'created_at_source'),
  notes: record.notes ? String(record.notes) : undefined,
  lastActivityAt: stringValue(record, 'last_activity_at'),
  enrollmentId: record.enrollment_id ? String(record.enrollment_id) : undefined
});

const mapStudent = (record: ApiRecord): StudentEnrollment => ({
  id: stringValue(record, 'id'),
  leadId: stringValue(record, 'lead_id'),
  fullName: stringValue(record, 'full_name'),
  email: stringValue(record, 'email'),
  phone: stringValue(record, 'phone'),
  program: stringValue(record, 'program') as StudentEnrollment['program'],
  tier: stringValue(record, 'tier') as StudentEnrollment['tier'],
  assignedCloserId: stringValue(record, 'assigned_closer_id'),
  totalContractValue: numberValue(record, 'total_contract_value'),
  paymentPlan: stringValue(record, 'payment_plan') as StudentEnrollment['paymentPlan'],
  enrolledAt: stringValue(record, 'enrolled_at'),
  financeStatus: stringValue(record, 'finance_status') as StudentEnrollment['financeStatus']
});

const mapPayment = (record: ApiRecord): PaymentRecord => ({
  id: stringValue(record, 'id'),
  transactionRef: stringValue(record, 'transaction_ref'),
  studentId: stringValue(record, 'student_id'),
  studentName: stringValue(record, 'student_name'),
  closerId: stringValue(record, 'closer_id'),
  closerName: stringValue(record, 'closer_name'),
  program: stringValue(record, 'program') as PaymentRecord['program'],
  amount: numberValue(record, 'amount'),
  paymentType: stringValue(record, 'payment_type') as PaymentRecord['paymentType'],
  installmentNumber: numberValue(record, 'installment_number'),
  totalInstallments: numberValue(record, 'total_installments'),
  status: stringValue(record, 'status') as PaymentRecord['status'],
  createdAt: stringValue(record, 'created_at_source'),
  verifiedAt: record.verified_at ? String(record.verified_at) : undefined,
  verifiedBy: record.verified_by ? String(record.verified_by) : undefined,
  financeNotes: record.finance_notes ? String(record.finance_notes) : undefined,
  isDuplicateFlag: Boolean(record.is_duplicate_flag),
  incomeProduct: record.income_product ? String(record.income_product) : undefined
});

const mapSyncEvent = (record: ApiRecord): SalesSyncEvent => ({
  id: stringValue(record, 'id'),
  timestamp: stringValue(record, 'occurred_at'),
  paymentId: stringValue(record, 'payment_id'),
  transactionRef: stringValue(record, 'transaction_ref'),
  closerName: stringValue(record, 'closer_name'),
  studentName: stringValue(record, 'student_name'),
  amount: numberValue(record, 'amount'),
  program: stringValue(record, 'program') as SalesSyncEvent['program'],
  status: stringValue(record, 'status') as SalesSyncEvent['status'],
  verificationLatencyMs: numberValue(record, 'verification_latency_ms'),
  details: stringValue(record, 'details')
});

const mapAuditLog = (record: ApiRecord): VerificationAuditLog => ({
  id: stringValue(record, 'id'),
  paymentId: stringValue(record, 'payment_id'),
  transactionRef: stringValue(record, 'transaction_ref'),
  previousStatus: stringValue(record, 'previous_status') as VerificationAuditLog['previousStatus'],
  newStatus: stringValue(record, 'new_status') as VerificationAuditLog['newStatus'],
  officerName: stringValue(record, 'officer_name'),
  timestamp: stringValue(record, 'occurred_at'),
  notes: record.notes ? String(record.notes) : undefined
});

const mapUser = (record: ApiRecord): User => ({
  id: stringValue(record, 'id'),
  name: stringValue(record, 'name'),
  email: stringValue(record, 'email'),
  role: stringValue(record, 'role') as User['role'],
  avatarUrl: record.avatar_url ? String(record.avatar_url) : undefined,
  closerId: record.closer_id ? String(record.closer_id) : undefined
});

const jsonBody = (data: unknown): Pick<RequestInit, 'body' | 'method'> => ({
  method: 'POST',
  body: JSON.stringify(data)
});

export const salesApi = {
  hasStoredSession(): boolean {
    return Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY));
  },

  async login(email: string, password: string): Promise<User> {
    const response = await request<{ token: string; user: ApiRecord }>('/login', jsonBody({ email, password }));
    window.localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    return mapUser(response.user);
  },

  async currentUser(): Promise<User> {
    return mapUser(await request<ApiRecord>('/user'));
  },

  async logout(): Promise<void> {
    try {
      await request('/logout', { method: 'POST' });
    } finally {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  inspect(path: string): Promise<unknown> {
    return request(path);
  },

  async loadDashboard(forceFinanceSync = false) {
    const financeSync = await request<FinanceSyncStatus>(`/finance-sync${forceFinanceSync ? '?force=1' : ''}`, { method: 'POST' });
    const dashboard = await request<{
      closers: ApiRecord[];
      leads: ApiRecord[];
      students: ApiRecord[];
      payments: ApiRecord[];
      syncEvents: ApiRecord[];
      auditLogs: ApiRecord[];
      integrity: {
        financeRecords: number;
        orphanedStudents: number;
        orphanedClosers: number;
      };
      fetchedAt: string;
    }>('/sales-dashboard');

    return {
      closers: dashboard.closers.map(mapCloser),
      leads: dashboard.leads.map(mapLead),
      students: dashboard.students.map(mapStudent),
      payments: dashboard.payments.map(mapPayment),
      syncEvents: dashboard.syncEvents.map(mapSyncEvent),
      auditLogs: dashboard.auditLogs.map(mapAuditLog),
      integrity: dashboard.integrity,
      fetchedAt: dashboard.fetchedAt,
      financeSync
    };
  },

  async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<Lead> {
    const response = await request<ApiRecord>('/leads', jsonBody({
      full_name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      target_program: lead.targetProgram,
      assigned_closer_id: lead.assignedCloserId,
      stage: lead.stage,
      estimated_deal_value: lead.estimatedDealValue,
      source: lead.source,
      notes: lead.notes
    }));
    return mapLead(response);
  },

  async updateLeadStage(leadId: string, stage: Lead['stage']): Promise<Lead> {
    const response = await request<ApiRecord>(`/leads/${leadId}`, {
      ...jsonBody({ stage }),
      method: 'PATCH'
    });
    return mapLead(response);
  },

  async closeStudent(
    lead: Lead,
    student: Omit<StudentEnrollment, 'id' | 'leadId' | 'assignedCloserId' | 'enrolledAt' | 'financeStatus'>,
    payment: Pick<PaymentRecord, 'amount' | 'paymentType' | 'transactionRef' | 'installmentNumber' | 'totalInstallments' | 'financeNotes'>
  ): Promise<{ student: StudentEnrollment; payment: PaymentRecord }> {
    const response = await request<{ student: ApiRecord; payment: ApiRecord }>('/students', jsonBody({
      lead_id: lead.id,
      full_name: student.fullName,
      email: student.email,
      phone: student.phone,
      program: student.program,
      tier: student.tier,
      assigned_closer_id: lead.assignedCloserId,
      total_contract_value: student.totalContractValue,
      payment_plan: student.paymentPlan,
      initial_payment: {
        transaction_ref: payment.transactionRef,
        amount: payment.amount,
        payment_type: payment.paymentType,
        installment_number: payment.installmentNumber,
        total_installments: payment.totalInstallments,
        finance_notes: payment.financeNotes
      }
    }));

    return { student: mapStudent(response.student), payment: mapPayment(response.payment) };
  },

  async createPayment(payment: Pick<PaymentRecord, 'studentId' | 'closerId' | 'amount' | 'paymentType' | 'transactionRef' | 'installmentNumber' | 'totalInstallments' | 'financeNotes'>): Promise<PaymentRecord> {
    const response = await request<ApiRecord>('/payments', jsonBody({
      transaction_ref: payment.transactionRef,
      student_id: payment.studentId,
      closer_id: payment.closerId,
      amount: payment.amount,
      payment_type: payment.paymentType,
      installment_number: payment.installmentNumber,
      total_installments: payment.totalInstallments,
      finance_notes: payment.financeNotes
    }));
    return mapPayment(response);
  },

  async verifyPayment(paymentId: string, action: 'verified' | 'rejected', notes?: string): Promise<PaymentRecord> {
    const response = await request<ApiRecord>(`/payments/${paymentId}/verify`, jsonBody({ action, notes }));
    return mapPayment(response);
  },

  async updateCloserQuota(closerId: string, quota: Closer['quota']): Promise<Closer> {
    const response = await request<ApiRecord>(`/closers/${closerId}`, {
      ...jsonBody({
        monthly_target: quota.monthlyTarget,
        collection_target: quota.collectionTarget,
        base_commission_pct: quota.baseCommissionPct,
        accelerator_pct: quota.acceleratorPct
      }),
      method: 'PATCH'
    });
    return mapCloser(response);
  }
};
