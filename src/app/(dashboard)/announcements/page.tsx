import { createClient } from "@/lib/supabase/server";
import type { Announcement, Profile } from "@/types/database";
import { PageHeader } from "@/components/PageHeader";
import { AnnouncementForm } from "./AnnouncementForm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: announcements }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>(),
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).returns<Announcement[]>(),
  ]);

  const authorIds = [...new Set((announcements ?? []).map((a) => a.created_by).filter((id): id is string => !!id))];
  const authorNames = new Map<string, string>();
  const attachmentUrls = new Map<string, string>();

  const [{ data: authors }, signedUrlResults] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("profiles").select("*").in("id", authorIds).returns<Profile[]>()
      : Promise.resolve({ data: [] as Profile[] }),
    Promise.all(
      (announcements ?? [])
        .filter((announcement) => announcement.file_url)
        .map(async (announcement) => ({
          id: announcement.id,
          result: await supabase.storage.from("announcements").createSignedUrl(announcement.file_url!, 60 * 10),
        }))
    ),
  ]);

  for (const author of authors ?? []) {
    authorNames.set(author.id, author.full_name);
  }
  for (const { id, result } of signedUrlResults) {
    if (result.data?.signedUrl) attachmentUrls.set(id, result.data.signedUrl);
  }

  return (
    <div>
      <PageHeader title="Memo" />
      <div className="space-y-6 p-4">
        {profile?.role === "hr_admin" && <AnnouncementForm />}

        <div className="space-y-2">
          {(announcements ?? []).length === 0 && (
            <p className="text-sm text-gray-500">Belum ada pengumuman.</p>
          )}
          {(announcements ?? []).map((announcement) => (
            <div key={announcement.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
              <p className="text-xs text-gray-500">
                {announcement.created_by ? authorNames.get(announcement.created_by) ?? "HR" : "HR"} ·{" "}
                {formatDate(announcement.created_at)}
              </p>
              {announcement.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{announcement.content}</p>
              )}
              {attachmentUrls.has(announcement.id) && (
                <a
                  href={attachmentUrls.get(announcement.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-brand-navy underline"
                >
                  Lihat lampiran
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
