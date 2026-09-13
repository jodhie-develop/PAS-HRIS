import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import type { CompanyAsset, Profile } from "@/types/database";
import { AssetForm } from "./AssetForm";

export default async function AssetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  if (profile?.role === "hr_admin") {
    const { data: employees } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("full_name")
      .returns<Profile[]>();

    const { data: assets } = await supabase
      .from("company_assets")
      .select("*")
      .order("asset_name")
      .returns<CompanyAsset[]>();

    const employeeNames = new Map((employees ?? []).map((e) => [e.id, e.full_name]));

    return (
      <div>
        <PageHeader title="Asset" />
        <div className="space-y-6 p-4">
          <AssetForm employees={employees ?? []} />

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Semua Aset</h2>
            {(assets ?? []).length === 0 && (
              <p className="text-sm text-gray-500">Belum ada aset.</p>
            )}
            {(assets ?? []).map((asset) => (
              <div key={asset.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{asset.asset_name}</p>
                    {asset.asset_code && <p className="text-xs text-gray-500">{asset.asset_code}</p>}
                  </div>
                  {asset.status && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {asset.status}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {asset.assigned_to ? employeeNames.get(asset.assigned_to) ?? "-" : "Tidak ditugaskan"}
                </p>
                {asset.notes && <p className="mt-1 text-xs text-gray-500">{asset.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { data: assets } = await supabase
    .from("company_assets")
    .select("*")
    .eq("assigned_to", user!.id)
    .order("asset_name")
    .returns<CompanyAsset[]>();

  return (
    <div>
      <PageHeader title="Asset" />
      <div className="space-y-2 p-4">
        {(assets ?? []).length === 0 && (
          <p className="text-sm text-gray-500">Belum ada aset yang ditugaskan ke Anda.</p>
        )}
        {(assets ?? []).map((asset) => (
          <div key={asset.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{asset.asset_name}</p>
                {asset.asset_code && <p className="text-xs text-gray-500">{asset.asset_code}</p>}
              </div>
              {asset.status && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {asset.status}
                </span>
              )}
            </div>
            {asset.notes && <p className="mt-2 text-xs text-gray-500">{asset.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
