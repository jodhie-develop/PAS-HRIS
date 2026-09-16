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

  const today = todayInJakarta();

  const [{ data: members }, { data: requests }] = await Promise.all([
    membersQuery.order("full_name").returns<Profile[]>(),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "pending")
      .order("start_date", { ascending: true })
      .returns<LeaveRequest[]>(),
  ]);

  const memberIds = (members ?? []).map((m) => m.id);
  const userIds = [...new Set((requests ?? []).map((r) => r.user_id))];
  const requesterNames = new Map<string, string>();
  const documentUrls = new Map<string, string>();

  const [counts, { data: requesters }, signedUrlResults] = await Promise.all([
    memberIds.length > 0
      ? Promise.all([
          supabase
            .from("attendances")
            .select("*", { count: "exact", head: true })
            .in("user_id", memberIds)
            .eq("date", today)
            .not("check_in", "is", null),
          supabase
            .from("leave_requests")
            .select("*", { count: "exact", head: true })
            .in("user_id", memberIds)
            .eq("status", "approved")
            .lte("start_date", today)
            .gte("end_date", today),
        ])
      : Promise.resolve([{ count: 0 }, { count: 0 }] as const),
    userIds.length > 0
      ? supabase.from("profiles").select("*").in("id", userIds).returns<Profile[]>()
      : Promise.resolve({ data: [] as Profile[] }),
    Promise.all(
      (requests ?? [])
        .filter((request) => request.document_url)
        .map(async (request) => ({
          id: request.id,
          result: await supabase.storage.from("leave-documents").createSignedUrl(request.document_url!, 60 * 10),
        }))
    ),
  ]);

  const hadirCount = counts[0].count ?? 0;
  const cutiCount = counts[1].count ?? 0;

  for (const requester of requesters ?? []) {
    requesterNames.set(requester.id, requester.full_name);
  }
  for (const { id, result } of signedUrlResults) {
    if (result.data?.signedUrl) {
      documentUrls.set(id, result.data.signedUrl);
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
