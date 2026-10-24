import { createHash } from "node:crypto";

// The SDK can finish waiting after an individual upload failed. Do not let a
// Blob or an error be silently serialized into a supposedly saved project.
export function assertSnackFilesUploaded(files) {
  const failed = Object.entries(files).filter(([, file]) =>
    file.error || typeof file.contents !== "string" ||
    (file.type === "ASSET" && !file.contents.startsWith("https://")));
  if (failed.length) {
    throw new Error(`Snack files are not ready to save: ${failed.map(([name]) => name).join(", ")}`);
  }
}
// Expo returned content-addressed asset URLs for both PNG and WebP uploads.
// Reuse an existing object only after its SHA-256 matches our local bytes.
// A missing object goes through the normal SDK upload instead.
export async function findUploadedSnackAsset(bytes, expectedHash, fetcher = fetch) {
  const address = createHash("md5").update(bytes).digest("hex");
  const url = `https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/${address}`;
  let response;
  try {
    response = await fetcher(url, { signal: AbortSignal.timeout(15000) });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const remote = new Uint8Array(await response.arrayBuffer());
  if (createHash("sha256").update(remote).digest("hex") !== expectedHash) {
    throw new Error("Existing Snack image bytes do not match the local source");
  }
  return url;
}
