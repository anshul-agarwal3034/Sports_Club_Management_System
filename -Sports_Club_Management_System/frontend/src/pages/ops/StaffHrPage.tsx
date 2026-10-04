import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Employee } from '@/types';
import { api } from '@/services/api';

export default function StaffHr() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getClubId = (): string => {
    try {
      const stored = localStorage.getItem('sportshub_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.club_id || parsed.clubId) return parsed.club_id || parsed.clubId;
      }
    } catch {
      // ignore
    }
    return '11111111-1111-1111-1111-111111111111';
  };

  const loadEmployees = async () => {
    setIsLoading(true);
    const clubId = getClubId();
    try {
      const data = await api.getEmployees(clubId);
      setEmployees(data || []);
    } catch {
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleEmployeeStatusUpdate = async (empId: string, status: 'APPROVED' | 'REJECTED') => {
    const clubId = getClubId();
    try {
      await api.updateEmployeeStatus(clubId, empId, status);
      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? { ...e, status } : e))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to update employee verification status');
    }
  };

  const handleLeaveAction = (empId: string, leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          return {
            ...emp,
            leave_requests: (emp.leave_requests || []).map((l) =>
              l.id === leaveId ? { ...l, status } : l
            ),
          };
        }
        return emp;
      })
    );
  };

  const allLeaveRequests = employees.flatMap((e) =>
    (e.leave_requests || []).map((l) => ({ ...l, employeeName: e.full_name, employeeId: e.id }))
  );

  const pendingCount = employees.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> HR &amp; Staff Operations
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Staff Roster &amp; Coach Verification
          </h1>
          <p className="text-sm text-slate-500">
            Verify new staff/coach registrations, manage shifts, leave approvals, and roster status.
          </p>
        </div>

        <button
          onClick={loadEmployees}
          disabled={isLoading}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start"
          title="Refresh Staff Roster"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 font-medium">
            <Clock className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span>
              <strong className="font-bold">Owner Action Required:</strong> {pendingCount} new registration request(s) (Staff / Coach / Kitchen Manager) are pending your approval before portal access is granted.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0b1c30] border-b border-slate-200 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#006c49]" /> Staff &amp; Coach Roster
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                {pendingCount} Pending Approval
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading staff members...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No staff members or coaches registered for this club yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Owner Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-[#0b1c30]">
                        {emp.full_name}
                        {emp.email && <div className="text-[10px] text-slate-400 font-normal">{emp.email}</div>}
                      </td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{emp.phone || 'N/A'}</td>
                      <td className="p-3">
                        {emp.status === 'PENDING' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        ) : emp.status === 'REJECTED' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {emp.status === 'PENDING' ? (
                          <div className="inline-flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleEmployeeStatusUpdate(emp.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-[#006c49] hover:bg-[#005237] text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleEmployeeStatusUpdate(emp.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        ) : emp.status === 'REJECTED' ? (
                          <button
                            onClick={() => handleEmployeeStatusUpdate(emp.id, 'APPROVED')}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Re-Approve
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0b1c30] border-b border-slate-200 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Leave Approval Requests
          </h2>

          {allLeaveRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No pending leave requests.
            </div>
          ) : (
            <div className="space-y-3">
              {allLeaveRequests.map((l) => (
                <div key={l.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-[#0b1c30]">
                    <span>{l.employeeName}</span>
                    <span className="text-amber-800 text-[11px]">{l.date}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Reason: {l.reason}</p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <span className="capitalize text-[11px] font-semibold text-slate-500">Status: {l.status}</span>
                    {l.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLeaveAction(l.employeeId, l.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-[#006c49] hover:bg-[#005237] text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleLeaveAction(l.employeeId, l.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
