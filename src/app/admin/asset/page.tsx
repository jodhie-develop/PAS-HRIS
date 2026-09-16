import { createClient } from "@/lib/supabase/server";
import type { CompanyAsset, OfficeLocation, Profile } from "@/types/database";
import { AssetForm } from "./AssetForm";
import { AssetCard } from "./AssetCard";

export default async function AssetPage() {
  const supabase = await createClient();

  const [{ data: assets }, { data: employees }, { data: officeLocations }] = await Promise.all([
    supabase.from("company_assets").select("*").order("asset_name").returns<CompanyAsset[]>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("full_name")
      .returns<Profile[]>(),
    supabase.from("office_locations").select("*").order("name").returns<OfficeLocation[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Master Asset</h1>
        <p className="text-sm text-gray-500">
          Kelola aset perusahaan (barang &amp; akun digital) dan penugasannya ke karyawan.
        </p>
      </div>

      <AssetForm employees={employees ?? []} officeLocations={officeLocations ?? []} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(assets ?? []).length === 0 && <p className="text-sm text-gray-500">Belum ada aset.</p>}
        {(assets ?? []).map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            employees={employees ?? []}
            officeLocations={officeLocations ?? []}
          />
        ))}
      </div>
    </div>
  );
}
