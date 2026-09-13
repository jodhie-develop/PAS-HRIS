import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInJakarta } from "@/lib/date";
import { PageHeader } from "@/components/PageHeader";
import type { LeaveRequest, Profile } from "@/types/database";
import { ApprovalRow } from "./ApprovalRow";

export default async function ApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  if (profile?.role === "employee") {
    redirect("/leave");
  }

  // Filter explicitly by role rather than relying on RLS alone: the given
  // RLS summary doesn't specify a supervisor-scoped read policy on
  // `profiles` itself (only on attendances/leave_requests/kpi_records/
  // company_assets), so a supervisor query without this filter could end
  // up listing the whole company if `profiles` turns out to be broadly
  // readable by any authenticated user.
  let membersQuery = supabase.from("profiles").select("*").eq("is_active", true);
  membersQuery =
    profile?.role === "supervisor"
      ? membersQuery.eq("supervisor_id", user!.id)
      : membersQuery.neq("id", user!.id);
  const { data: members } = await membersQuery.order("full_name").returns<Profile[]>();

  const memberIds = (members ?? []).map((m) => m.id);
  const today = todayInJakarta();

  let hadirCount = 0;
  let cutiCount = 0;

  if (memberIds.length > 0) {
    const { count: hadir } = await supabase
      .from("attendances")
      .select("*", { count: "exact", head: true })
      .in("user_id", memberIds)
      .eq("date", today)
      .not("check_in", "is", null);
    hadirCount = hadir ?? 0;

    const { count: cuti } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .in("user_id", memberIds)
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);
    cutiCount = cuti ?? 0;
  }

  const { data: requests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("status", "pending")
    .order("start_date", { ascending: true })
    .returns<LeaveRequest[]>();

  const userIds = [...new Set((requests ?? []).map((r) => r.user_id))];
  const requesterNames = new Map<string, string>();
  const documentUrls = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: requesters } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds)
      .returns<Profile[]>();

    for (const requester of requesters ?? []) {
      requesterNames.set(requester.id, requester.full_name);
    }
  }

  for (const request of requests ?? []) {
    if (request.document_url) {
      const { data } = await supabase.storage
        .from("leave-documents")
        .createSignedUrl(request.document_url, 60 * 10);
      if (data?.signedUrl) {
        documentUrls.set(request.id, data.signedUrl);
      }
    }
  }

  return (
    <div>
      <PageHeader title="Supervisor" />
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Anggota</p>
            <p className="text-xl font-semibold text-gray-900">{(members ?? []).length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Hadir</p>
            <p className="text-xl font-semibold text-green-700">{hadirCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">Cuti</p>
            <p className="text-xl font-semibold text-amber-700">{cutiCount}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900">Menunggu Persetujuan</h2>
          <div className="mt-2 space-y-2">
            {(requests ?? []).length === 0 && (
              <p className="text-sm text-gray-500">Tidak ada pengajuan yang menunggu.</p>
            )}
            {(requests ?? []).map((request) => (
              <ApprovalRow
                key={request.id}
                request={request}
                requesterName={requesterNames.get(request.user_id) ?? "-"}
                documentUrl={documentUrls.get(request.id) ?? null}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
