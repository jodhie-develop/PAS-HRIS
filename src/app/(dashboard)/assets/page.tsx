import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import type { CompanyAsset } from "@/types/database";
import { AssetDigitalDetails } from "./AssetDigitalDetails";

export default async function AssetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {asset.asset_type === "akun_digital" ? "Akun Digital" : "Barang"}
                </span>
                <p className="mt-1.5 text-sm font-medium text-gray-900">{asset.asset_name}</p>
                {asset.asset_code && <p className="text-xs text-gray-500">{asset.asset_code}</p>}
              </div>
              {asset.status && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {asset.status}
                </span>
              )}
            </div>
            {asset.asset_type === "akun_digital" && <AssetDigitalDetails asset={asset} />}
            {asset.notes && <p className="mt-2 text-xs text-gray-500">{asset.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
