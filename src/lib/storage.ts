import { supabase } from "./supabaseClient";

/** Upload a File (or data-URL string) to a Supabase Storage bucket and return
 *  the public URL.  Throws on failure. */
export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  /* Convert File → ArrayBuffer for controlled upload. */
  const arrayBuf = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuf, {
      contentType: file.type,
      upsert: true, // replace if same path
    });

  if (uploadErr) throw uploadErr;

  /* Get public URL. */
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Could not resolve public URL");

  onProgress?.(100);
  return data.publicUrl;
}

/** Delete a file from Supabase Storage. */
export async function deleteFile(bucket: string, path: string) {
  await supabase.storage.from(bucket).remove([path]).catch(() => {});
}

/** Download URL helper. */
export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
