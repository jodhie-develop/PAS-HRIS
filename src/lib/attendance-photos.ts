// Private bucket for "anywhere" check-in/out selfies, laid out as
// {user_id}/{date}/{checkin|checkout}-{timestamp}.jpg. The attendance row
// stores the object path; pages turn it into a short-lived signed URL.
export const ATTENDANCE_PHOTO_BUCKET = "attendance-photos";
