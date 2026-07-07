# Step 03 — ImageKit Storage Provider

**Status:** ✅ Code complete, type-checked (2026-07-06) — not yet runtime-tested against a real ImageKit account
**Goal:** Add ImageKit as a 5th storage backend (`STORAGE_TYPE=imagekit`) alongside the existing `local`/`s3`/`gcs`/`azure` providers, so documents/attachments can be stored on ImageKit's free tier (no card required) instead of local disk.

---

## Why

User wants documents (chat attachments, Document Store files, vector-upsert files) stored on a free third-party cloud rather than local disk (`.flowise/storage/`), without adding card details. Chose ImageKit specifically (aware it's an image-CDN product being repurposed as generic blob storage, not a perfect fit — see caveats below).

## Package chosen

`imagekit` (npm, currently v6.0.0) — the classic/stable SDK. Verified via GitHub README (unpkg mirror) before writing code:
- `require('imagekit')` / `import ImageKit from 'imagekit'` — CommonJS-compatible, matches this repo's other storage-provider imports (`multer`, `@google-cloud/storage`, etc.)
- `new ImageKit({ publicKey, privateKey, urlEndpoint })`
- `imagekit.upload({ file: <url|base64|binary>, fileName, folder, useUniqueFileName, overwriteFile })` — accepts a raw Buffer directly, both callback and Promise style
- `imagekit.listFiles({ path, skip, limit })`, `getFileDetails(fileId)`, `deleteFile(fileId)`, `bulkDeleteFiles([fileIds])`, `deleteFolder(folderPath)` — all Promise-returning

Deliberately **not** using the newer `@imagekit/nodejs` (v7.x) package — it's ESM-oriented, requires wrapping Buffers via a `toFile()` helper, and risks CJS/ESM interop issues in this repo's `tsc`-compiled CommonJS build. Not worth the risk for a storage backend.

## Design mapping (IStorageProvider → ImageKit API)

| Interface method | ImageKit call | Notes |
|---|---|---|
| `addBase64FilesToStorage` / `addSingleFileToStorage` / `addArrayFilesToStorage` | `upload({ file: buffer, fileName, folder: <org/chatflow/...>, useUniqueFileName: false, overwriteFile: true })` | Deterministic folder+filename so it can be re-fetched later without needing to remember a `fileId` |
| `getFileFromStorage` / `streamStorageFile` | Direct CDN URL fetch: `axios.get(`${urlEndpoint}/${folder}/${filename}`, { responseType: 'arraybuffer' })` | ImageKit serves uploaded files over a public CDN URL by default — see Security caveat below |
| `getFileFromUpload` / `removeSpecificFileFromUpload` (multer temp-upload flow) | `getFileDetails(fileId)` then fetch `.url`; `deleteFile(fileId)` | Here `file.path` (as set by the custom multer engine) holds the ImageKit `fileId`, not a folder path — this flow is per-request/ephemeral, unlike the folder-based methods above |
| `getFilesListFromStorage` | `listFiles({ path: folder })` | |
| `removeFilesFromStorage` / `removeFolderFromStorage` | `deleteFolder(folderPath)` | Recursive delete, matches GCS/Azure prefix-delete semantics |
| `removeSpecificFileFromStorage` | `listFiles({ path: folder })` → find matching `name` → `deleteFile(fileId)` | No path-based single-file delete exists in ImageKit's API, so list-then-delete is required |
| `getStorageSize` | `listFiles({ path: '/' + orgId })` paginated via `skip`/`limit`, sum `.size` | Known limitation: unconfirmed whether ImageKit's `path` filter recurses through nested subfolders. Should work fine given this repo's shallow `org/chatflow/file` structure, but flagged as a caveat. |
| `getMulterStorage` | Custom multer storage engine (`_handleFile`/`_removeFile`) that buffers the incoming stream fully, then calls `upload()` | No existing `multer-imagekit` package was assumed to exist — writing our own engine class rather than depending on an unverified community package |
| `getLoggerTransports` | Custom minimal Winston transport that buffers log lines in memory and periodically uploads them as a single dated `.log` file per log type | ImageKit has no logging product — this is the same "best-effort, not critical path" compromise GCS/Azure make with their real logging integrations, just hand-rolled since no library exists |

## Known caveats (told to user)

1. **Public CDN by default.** Uploaded files are retrievable via a predictable URL (`urlEndpoint + folder + filename`) unless `isPrivateFile` is set — same general exposure model as an S3 bucket without ACLs, mitigated by UUIDs in the org/chatflow path segments, but worth knowing for confidential documents.
2. **`getStorageSize` recursion is unverified** against ImageKit's live API docs (see above).
3. **Not runtime-tested** — no ImageKit account/credentials available in this session. Verified against the SDK's published README/type surface only; user must smoke-test actual upload/download once they add real credentials.
4. **`getMulterStorage`/`getLoggerTransports` are hand-rolled**, not backed by ImageKit-provided integration packages (unlike GCS/Azure which use official `multer-cloud-storage`/`multer-azure-blob-storage`/`winston-azure-blob` packages).

## Files touched

- `packages/components/package.json` — add `imagekit` dependency
- `packages/components/src/storage/ImageKitStorageProvider.ts` — new file
- `packages/components/src/storage/StorageProviderFactory.ts` — add `case 'imagekit'`
- `packages/server/.env.example` — document `STORAGE_TYPE=imagekit`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`

## Verification

- `pnpm --filter accelance-components build` (or equivalent) — type-check only, since there's no live ImageKit account to exercise the code against
- User will need to sign up at imagekit.io (free, no card), create an account, get Public Key / Private Key / URL endpoint from their dashboard, set the 4 env vars, and manually test an actual upload (e.g. via Document Store or a chat attachment) before trusting this in production
