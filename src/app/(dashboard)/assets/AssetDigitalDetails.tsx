"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "@/components/icons";
import type { CompanyAsset } from "@/types/database";

export function AssetDigitalDetails({ asset }: { asset: CompanyAsset }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
      {asset.digital_email && <p>Email: {asset.digital_email}</p>}
      {asset.digital_phone && <p>No. WhatsApp: {asset.digital_phone}</p>}
      {asset.digital_username && <p>Username: {asset.digital_username}</p>}
      {asset.digital_password && (
        <p className="flex items-center gap-1.5">
          Password: {showPassword ? asset.digital_password : "••••••••"}
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
          </button>
        </p>
      )}
    </div>
  );
}
