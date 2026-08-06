"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../config";
import { can, getCurrentUserContext } from "../data/context";
import { createClient } from "../supabase/server";
import { optionalText, positiveNumber, requiredText } from "../validation";

type RpcResult = { id?: string; number?: string; amount?: number; employees?: number; status?: string };
const result = (value: unknown): RpcResult => value && typeof value === "object" ? value as RpcResult : {};
async function requireHr() { if (!isSupabaseConfigured()) throw new Error("HR and payroll actions are disabled in demo mode."); const context = await getCurrentUserContext({ required: true }); if (!context || !can(context, "manage_hr")) throw new Error("You do not have permission to manage HR and payroll."); return context; }
async function rpc(name: string, args: Record<string, unknown>) { const supabase = await createClient(); const { data, error } = await supabase.rpc(name, args); if (error) throw new Error(error.message); return result(data); }
function done(tab: string, code: "recordCreated" | "recordUpdated" | "moneyRecorded", record: string, amount?: number) { const params = new URLSearchParams({ tab, successCode: code, record }); if (amount !== undefined) params.set("amount", String(amount)); redirect(`/hr?${params.toString()}`); }

export async function createEmployeeAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("create_employee", { p_organization_id: context.organizationId, p_branch_id: context.branchId, p_first_name: requiredText(formData.get("firstName"), "firstName", 100), p_last_name: requiredText(formData.get("lastName"), "lastName", 100), p_email: optionalText(formData.get("email"), 180), p_phone: optionalText(formData.get("phone"), 80), p_tax_id: optionalText(formData.get("taxId"), 80), p_pension_id: optionalText(formData.get("pensionId"), 80), p_hire_date: requiredText(formData.get("hireDate"), "hireDate", 10), p_department: optionalText(formData.get("department"), 120), p_position_title: optionalText(formData.get("positionTitle"), 120), p_employment_type: requiredText(formData.get("employmentType") || "permanent", "employmentType", 30), p_bank_name: optionalText(formData.get("bankName"), 120), p_bank_account_masked: optionalText(formData.get("bankAccountMasked"), 80), p_actor_id: context.userId });
  revalidatePath("/hr"); done("employees", "recordCreated", data.number || "Employee");
}
export async function recordAttendanceAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("record_attendance", { p_organization_id: context.organizationId, p_employee_id: requiredText(formData.get("employeeId"), "employeeId", 80), p_attendance_date: requiredText(formData.get("attendanceDate"), "attendanceDate", 10), p_status: requiredText(formData.get("status"), "status", 30), p_check_in: optionalText(formData.get("checkIn"), 8), p_check_out: optionalText(formData.get("checkOut"), 8), p_regular_hours: positiveNumber(formData.get("regularHours") || "0", "regularHours", true), p_overtime_hours: positiveNumber(formData.get("overtimeHours") || "0", "overtimeHours", true), p_notes: optionalText(formData.get("notes"), 500), p_actor_id: context.userId });
  revalidatePath("/hr"); done("attendance", "recordUpdated", data.number || "Attendance");
}
export async function createLeaveRequestAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("create_leave_request", { p_organization_id: context.organizationId, p_employee_id: requiredText(formData.get("employeeId"), "employeeId", 80), p_leave_type: requiredText(formData.get("leaveType"), "leaveType", 30), p_start_date: requiredText(formData.get("startDate"), "startDate", 10), p_end_date: requiredText(formData.get("endDate"), "endDate", 10), p_days: positiveNumber(formData.get("days"), "days"), p_reason: optionalText(formData.get("reason"), 500), p_actor_id: context.userId });
  revalidatePath("/hr"); done("leave", "recordCreated", data.number || "Leave request");
}
export async function setLeaveRequestStatusAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("set_leave_request_status", { p_organization_id: context.organizationId, p_leave_request_id: requiredText(formData.get("leaveRequestId"), "leaveRequestId", 80), p_status: requiredText(formData.get("status"), "status", 20), p_approver_note: optionalText(formData.get("approverNote"), 500), p_actor_id: context.userId });
  revalidatePath("/hr"); done("leave", "recordUpdated", data.number || "Leave request");
}
export async function setSalaryStructureAction(formData: FormData) {
  const context = await requireHr();
  const baseSalary = positiveNumber(formData.get("baseSalary"), "baseSalary", true);
  const data = await rpc("set_salary_structure", { p_organization_id: context.organizationId, p_employee_id: requiredText(formData.get("employeeId"), "employeeId", 80), p_effective_from: requiredText(formData.get("effectiveFrom"), "effectiveFrom", 10), p_base_salary: baseSalary, p_recurring_allowances: positiveNumber(formData.get("recurringAllowances") || "0", "recurringAllowances", true), p_recurring_deductions: positiveNumber(formData.get("recurringDeductions") || "0", "recurringDeductions", true), p_employee_pension_rate: positiveNumber(formData.get("employeePensionRate") || "0", "employeePensionRate", true), p_employer_pension_rate: positiveNumber(formData.get("employerPensionRate") || "0", "employerPensionRate", true), p_income_tax_rate: positiveNumber(formData.get("incomeTaxRate") || "0", "incomeTaxRate", true), p_overtime_hourly_rate: positiveNumber(formData.get("overtimeHourlyRate") || "0", "overtimeHourlyRate", true), p_actor_id: context.userId });
  revalidatePath("/hr"); done("employees", "moneyRecorded", data.number || "Salary structure", Number(data.amount || baseSalary));
}
export async function createPayrollRunAction(formData: FormData) {
  const context = await requireHr();
  const periodStart = requiredText(formData.get("periodStart"), "periodStart", 10);
  const periodEnd = requiredText(formData.get("periodEnd"), "periodEnd", 10);
  const requestedPayDate = requiredText(formData.get("payDate"), "payDate", 10);
  const payDate = requestedPayDate < periodEnd ? periodEnd : requestedPayDate;
  const data = await rpc("create_payroll_run", { p_organization_id: context.organizationId, p_branch_id: context.branchId, p_period_start: periodStart, p_period_end: periodEnd, p_pay_date: payDate, p_notes: optionalText(formData.get("notes"), 1000), p_actor_id: context.userId });
  revalidatePath("/hr"); done("payroll", "moneyRecorded", `${data.number || "Payroll"} · ${Number(data.employees || 0)} employees`, Number(data.amount || 0));
}
export async function approvePayrollRunAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("approve_payroll_run", { p_organization_id: context.organizationId, p_payroll_run_id: requiredText(formData.get("payrollRunId"), "payrollRunId", 80), p_actor_id: context.userId });
  revalidatePath("/hr"); done("payroll", "recordUpdated", data.number || "Payroll run");
}
export async function postPayrollRunAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("post_payroll_run", { p_organization_id: context.organizationId, p_payroll_run_id: requiredText(formData.get("payrollRunId"), "payrollRunId", 80), p_actor_id: context.userId });
  revalidatePath("/hr"); revalidatePath("/finance"); done("payroll", "moneyRecorded", data.number || "Payroll run", Number(data.amount || 0));
}
export async function markPayrollPaidAction(formData: FormData) {
  const context = await requireHr();
  const data = await rpc("mark_payroll_paid", { p_organization_id: context.organizationId, p_payroll_run_id: requiredText(formData.get("payrollRunId"), "payrollRunId", 80), p_cash_account_id: requiredText(formData.get("cashAccountId"), "cashAccountId", 80), p_actor_id: context.userId });
  revalidatePath("/hr"); revalidatePath("/finance"); done("payroll", "moneyRecorded", data.number || "Payroll payment", Number(data.amount || 0));
}