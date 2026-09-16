// Note: every Row/Insert/Update shape below is declared with `type`, not
// `interface`. Using `interface` here breaks Supabase's generic type
// inference for `.insert()`/`.update()` — the whole Database generic
// collapses to `never` for every table, not just the offending one.
export type UserRole = "employee" | "supervisor" | "hr_admin";

export type LeaveType =
  | "cuti"
  | "sakit"
  | "ijin"
  | "dinas_luar_kota"
  | "lainnya";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  nik: string;
  full_name: string;
  job_title: string | null;
  job_title_id: string | null;
  role: UserRole;
  supervisor_id: string | null;
  office_location_id: string | null;
  default_shift_id: string | null;
  ptkp_status: string | null;
  npwp: string | null;
  phone: string | null;
  personal_email: string | null;
  join_date: string | null;
  annual_leave_quota: number | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OfficeLocation = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
};

export type WorkShift = {
  id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  user_id: string;
  shift_id: string | null;
  office_location_id: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  notes: string | null;
  created_at: string;
};

export type LeaveRequest = {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  document_url: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type Payslip = {
  id: string;
  user_id: string;
  period_month: number;
  period_year: number;
  payslip_type: string;
  gross_income: number;
  total_deductions: number;
  take_home_pay: number;
  pdf_url: string | null;
  is_draft: boolean;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type AppDocument = {
  id: string;
  title: string;
  category: string | null;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
};

export type AssetType = "barang" | "akun_digital";

export type CompanyAsset = {
  id: string;
  asset_type: AssetType;
  asset_name: string;
  asset_code: string | null;
  assigned_to: string | null;
  office_location_id: string | null;
  status: string | null;
  notes: string | null;
  digital_email: string | null;
  digital_phone: string | null;
  digital_username: string | null;
  digital_password: string | null;
  created_at: string;
};

export type JobTitle = {
  id: string;
  name: string;
  created_at: string;
};

export type Salary = {
  id: string;
  job_title_id: string;
  base_salary: number;
  notes: string | null;
  created_at: string;
};

export type KpiRecord = {
  id: string;
  user_id: string;
  period_month: number;
  period_year: number;
  score: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type ProfileInsert = {
  id: string;
  nik: string;
  full_name: string;
  job_title?: string | null;
  job_title_id?: string | null;
  role?: UserRole;
  supervisor_id?: string | null;
  office_location_id?: string | null;
  default_shift_id?: string | null;
  ptkp_status?: string | null;
  npwp?: string | null;
  phone?: string | null;
  personal_email?: string | null;
  join_date?: string | null;
  annual_leave_quota?: number | null;
  avatar_url?: string | null;
  is_active?: boolean;
};
export type ProfileUpdate = {
  nik?: string;
  full_name?: string;
  job_title?: string | null;
  job_title_id?: string | null;
  role?: UserRole;
  supervisor_id?: string | null;
  office_location_id?: string | null;
  default_shift_id?: string | null;
  ptkp_status?: string | null;
  npwp?: string | null;
  phone?: string | null;
  personal_email?: string | null;
  join_date?: string | null;
  annual_leave_quota?: number | null;
  avatar_url?: string | null;
  is_active?: boolean;
};

export type OfficeLocationInsert = {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radius_meters?: number;
};
export type OfficeLocationUpdate = {
  name?: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
};

export type WorkShiftInsert = {
  shift_name: string;
  start_time: string;
  end_time: string;
};
export type WorkShiftUpdate = {
  shift_name?: string;
  start_time?: string;
  end_time?: string;
};

export type AttendanceInsert = {
  user_id: string;
  date: string;
  shift_id?: string | null;
  office_location_id?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_in_photo_url?: string | null;
  check_out_photo_url?: string | null;
  notes?: string | null;
};
export type AttendanceUpdate = {
  shift_id?: string | null;
  office_location_id?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_in_photo_url?: string | null;
  check_out_photo_url?: string | null;
  notes?: string | null;
};

export type LeaveRequestInsert = {
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string | null;
  document_url?: string | null;
  status?: LeaveStatus;
};
export type LeaveRequestUpdate = {
  status?: LeaveStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
};

export type PayslipInsert = {
  user_id: string;
  period_month: number;
  period_year: number;
  payslip_type: string;
  gross_income?: number;
  total_deductions?: number;
  take_home_pay?: number;
  pdf_url?: string | null;
  is_draft?: boolean;
};
export type PayslipUpdate = {
  period_month?: number;
  period_year?: number;
  payslip_type?: string;
  gross_income?: number;
  total_deductions?: number;
  take_home_pay?: number;
  pdf_url?: string | null;
  is_draft?: boolean;
};

export type AnnouncementInsert = {
  title: string;
  content?: string | null;
  file_url?: string | null;
  created_by?: string | null;
};
export type AnnouncementUpdate = {
  title?: string;
  content?: string | null;
  file_url?: string | null;
};

export type AppDocumentInsert = {
  title: string;
  category?: string | null;
  file_url: string;
  uploaded_by?: string | null;
};
export type AppDocumentUpdate = {
  title?: string;
  category?: string | null;
  file_url?: string;
};

export type CompanyAssetInsert = {
  asset_type?: AssetType;
  asset_name: string;
  asset_code?: string | null;
  assigned_to?: string | null;
  office_location_id?: string | null;
  status?: string | null;
  notes?: string | null;
  digital_email?: string | null;
  digital_phone?: string | null;
  digital_username?: string | null;
  digital_password?: string | null;
};
export type CompanyAssetUpdate = {
  asset_type?: AssetType;
  asset_name?: string;
  asset_code?: string | null;
  assigned_to?: string | null;
  office_location_id?: string | null;
  status?: string | null;
  notes?: string | null;
  digital_email?: string | null;
  digital_phone?: string | null;
  digital_username?: string | null;
  digital_password?: string | null;
};

export type JobTitleInsert = {
  name: string;
};
export type JobTitleUpdate = {
  name?: string;
};

export type SalaryInsert = {
  job_title_id: string;
  base_salary?: number;
  notes?: string | null;
};
export type SalaryUpdate = {
  job_title_id?: string;
  base_salary?: number;
  notes?: string | null;
};

export type KpiRecordInsert = {
  user_id: string;
  period_month: number;
  period_year: number;
  score?: number | null;
  notes?: string | null;
  created_by?: string | null;
};
export type KpiRecordUpdate = {
  period_month?: number;
  period_year?: number;
  score?: number | null;
  notes?: string | null;
};

// Minimal Database shape for the Supabase client generic. Only the columns
// used by the app so far are typed; extend each table's Row/Insert/Update
// as new features touch them. Ideally replace this with
// `supabase gen types typescript` output once the Supabase CLI is set up.
//
// `Relationships: []` is required by @supabase/postgrest-js's GenericTable
// type even though we don't use embedded relation queries yet.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      office_locations: {
        Row: OfficeLocation;
        Insert: OfficeLocationInsert;
        Update: OfficeLocationUpdate;
        Relationships: [];
      };
      work_shifts: {
        Row: WorkShift;
        Insert: WorkShiftInsert;
        Update: WorkShiftUpdate;
        Relationships: [];
      };
      attendances: {
        Row: Attendance;
        Insert: AttendanceInsert;
        Update: AttendanceUpdate;
        Relationships: [];
      };
      leave_requests: {
        Row: LeaveRequest;
        Insert: LeaveRequestInsert;
        Update: LeaveRequestUpdate;
        Relationships: [];
      };
      payslips: {
        Row: Payslip;
        Insert: PayslipInsert;
        Update: PayslipUpdate;
        Relationships: [];
      };
      announcements: {
        Row: Announcement;
        Insert: AnnouncementInsert;
        Update: AnnouncementUpdate;
        Relationships: [];
      };
      documents: {
        Row: AppDocument;
        Insert: AppDocumentInsert;
        Update: AppDocumentUpdate;
        Relationships: [];
      };
      company_assets: {
        Row: CompanyAsset;
        Insert: CompanyAssetInsert;
        Update: CompanyAssetUpdate;
        Relationships: [];
      };
      kpi_records: {
        Row: KpiRecord;
        Insert: KpiRecordInsert;
        Update: KpiRecordUpdate;
        Relationships: [];
      };
      job_titles: {
        Row: JobTitle;
        Insert: JobTitleInsert;
        Update: JobTitleUpdate;
        Relationships: [];
      };
      salaries: {
        Row: Salary;
        Insert: SalaryInsert;
        Update: SalaryUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
