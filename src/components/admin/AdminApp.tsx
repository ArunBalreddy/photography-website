"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState, type DragEvent } from "react";
import {
  changePasswordAction,
  deleteAssetAction,
  logoutAction,
  saveGalleryAction,
  uploadTicketAction,
  type FormState,
} from "@/app/admin/actions";
import { blurProps } from "@/content/blur";
import type { Manifest, StoredItem } from "@/lib/gallery";
import type { StorageMode } from "@/lib/storage";
import { MAX_VIDEO_BYTES, cloudinaryPoster, cloudinaryVideo, preparePhoto, prepareVideo, titleFromFilename, uploadFile } from "./media";

type Status = { kind: "idle" | "pending" | "saving" | "saved" | "error"; message?: string };
type Job = { key: string; name: string; progress: number; state: "preparing" | "uploading" | "done" | "error"; error?: string };

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "folder";

// Unique ids for new folders and upload rows (module-level so render stays pure).
let seq = 0;
const uniqueSuffix = () => `${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

/** New uploads go to the top of their folder. */
function insertAtFolderTop(items: StoredItem[], item: StoredItem) {
  const i = items.findIndex((x) => x.folder === item.folder);
  return i < 0 ? [...items, item] : [...items.slice(0, i), item, ...items.slice(i)];
}

const btn =
  "inline-flex h-9 items-center justify-center border border-line px-3 text-[11px] uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center border border-line text-sm text-foreground/75 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30";
const input =
  "w-full border-b border-line bg-transparent py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";

export default function AdminApp({
  initial,
  storage,
  username,
  loadError,
}: {
  initial: Manifest;
  storage: StorageMode;
  username: string;
  loadError?: string;
}) {
  const [m, setM] = useState<Manifest>(initial);
  const mRef = useRef(initial); // latest gallery, for async uploads finishing after other edits
  const [active, setActive] = useState(initial.folders[0]?.id ?? "");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [newFolder, setNewFolder] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const readOnly = Boolean(loadError) || storage === "none";

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (status.kind !== "pending" && status.kind !== "saving") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status.kind]);

  // Autosave: debounce edits, and run saves one after another so an older save never lands last.
  const persist = (next: Manifest) => {
    setStatus({ kind: "pending" });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      chain.current = chain.current.then(async () => {
        setStatus({ kind: "saving" });
        const res = await saveGalleryAction(next);
        setStatus(res.ok ? { kind: "saved" } : { kind: "error", message: res.error });
      });
    }, 700);
  };

  const mutate = (fn: (cur: Manifest) => Manifest) => {
    if (readOnly) return;
    const next = fn(mRef.current);
    mRef.current = next;
    setM(next);
    persist(next);
  };

  const folder = m.folders.find((f) => f.id === active) ?? m.folders[0];
  const items = m.items.filter((i) => i.folder === folder?.id);
  const count = (id: string) => m.items.filter((i) => i.folder === id).length;

  // ── folders ──
  const titleTaken = (title: string, except?: string) =>
    mRef.current.folders.some((f) => f.id !== except && f.title.toLowerCase() === title.toLowerCase());

  const addFolder = () => {
    const title = newFolder.trim().slice(0, 60);
    if (!title) return;
    if (titleTaken(title)) return alert(`There's already a folder called "${title}".`);
    const id = `${slugify(title)}-${uniqueSuffix()}`;
    mutate((cur) => ({ ...cur, folders: [...cur.folders, { id, title }] }));
    setActive(id);
    setNewFolder("");
  };

  const renameFolder = (id: string, value: string) => {
    const title = value.trim().slice(0, 60);
    const current = mRef.current.folders.find((f) => f.id === id);
    if (!current || !title || title === current.title) return;
    if (titleTaken(title, id)) return alert(`There's already a folder called "${title}".`);
    mutate((cur) => ({ ...cur, folders: cur.folders.map((f) => (f.id === id ? { ...f, title } : f)) }));
  };

  const moveFolder = (id: string, dir: -1 | 1) =>
    mutate((cur) => {
      const i = cur.folders.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.folders.length) return cur;
      const folders = [...cur.folders];
      [folders[i], folders[j]] = [folders[j], folders[i]];
      return { ...cur, folders };
    });

  const deleteFolder = async (id: string) => {
    const cur = mRef.current;
    const f = cur.folders.find((x) => x.id === id);
    if (!f) return;
    if (cur.folders.length === 1) return alert("Keep at least one folder.");
    const inside = cur.items.filter((i) => i.folder === id);
    const ok = confirm(
      inside.length
        ? `Delete the folder "${f.title}" and its ${inside.length} item(s)?\nUploaded files are deleted permanently.`
        : `Delete the empty folder "${f.title}"?`,
    );
    if (!ok) return;
    const failed = await deleteFiles(inside);
    mutate((c) => ({
      ...c,
      folders: c.folders.filter((x) => x.id !== id),
      items: c.items.filter((i) => i.folder !== id || failed.has(i.id)),
    }));
    setActive(cur.folders.find((x) => x.id !== id)!.id);
  };

  // ── items ──
  const deleteFiles = async (list: StoredItem[]) => {
    const failed = new Set<string>();
    for (const i of list) {
      if (!i.publicId) continue;
      const res = await deleteAssetAction(i.publicId, i.kind === "video" ? "video" : "photo");
      if (!res.ok) failed.add(i.id);
    }
    if (failed.size) alert(`${failed.size} file(s) couldn't be deleted from storage and were kept.`);
    return failed;
  };

  const renameItem = (id: string, value: string) => {
    const title = value.trim().slice(0, 120);
    const item = mRef.current.items.find((i) => i.id === id);
    if (!item || !title || title === item.title) return;
    mutate((cur) => ({
      ...cur,
      items: cur.items.map((i) => (i.id === id ? { ...i, title, alt: i.alt === i.title ? title : i.alt } : i)),
    }));
  };

  const moveItem = (id: string, folderId: string) =>
    mutate((cur) => ({ ...cur, items: cur.items.map((i) => (i.id === id ? { ...i, folder: folderId } : i)) }));

  const shiftItem = (id: string, dir: -1 | 1) =>
    mutate((cur) => {
      const item = cur.items.find((i) => i.id === id);
      if (!item) return cur;
      const positions = cur.items.flatMap((i, idx) => (i.folder === item.folder ? [idx] : []));
      const k = positions.indexOf(cur.items.indexOf(item));
      const other = positions[k + dir];
      if (other === undefined) return cur;
      const list = [...cur.items];
      [list[positions[k]], list[other]] = [list[other], list[positions[k]]];
      return { ...cur, items: list };
    });

  const deleteItem = async (item: StoredItem) => {
    if (!confirm(`Delete "${item.title}"?${item.publicId ? "\nThe uploaded file is deleted permanently." : ""}`)) return;
    const failed = await deleteFiles([item]);
    if (!failed.size) mutate((cur) => ({ ...cur, items: cur.items.filter((i) => i.id !== item.id) }));
  };

  // ── uploads ──
  const setJob = (key: string, patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...patch } : j)));

  const uploadOne = async (file: File, key: string, folderId: string) => {
    try {
      const ticket = await uploadTicketAction(folderId);
      if (ticket.mode === "none") throw new Error(ticket.error);
      const title = titleFromFilename(file.name);
      let item: StoredItem;
      if (file.type.startsWith("video/")) {
        if (file.size > MAX_VIDEO_BYTES) throw new Error("Videos must be under 100 MB — please compress it first.");
        const prep = await prepareVideo(file);
        if (!prep && ticket.mode !== "cloudinary") throw new Error("This browser can't read that video — try an MP4.");
        setJob(key, { state: "uploading" });
        const up = await uploadFile(ticket, folderId, file, "video", (p) => setJob(key, { progress: p }));
        const poster =
          ticket.mode === "cloudinary" ? cloudinaryPoster(up.url) : (await uploadFile(ticket, folderId, prep!.poster!, "image", () => {})).url;
        item = {
          id: up.publicId,
          kind: "video",
          folder: folderId,
          title,
          alt: title,
          src: poster,
          video: ticket.mode === "cloudinary" ? cloudinaryVideo(up.url) : up.url,
          width: prep?.width || up.width || 720,
          height: prep?.height || up.height || 1280,
          ...(prep?.blur ? { blur: prep.blur } : {}),
          publicId: up.publicId,
        };
      } else {
        const prep = await preparePhoto(file);
        setJob(key, { state: "uploading" });
        const up = await uploadFile(ticket, folderId, prep.blob, "image", (p) => setJob(key, { progress: p }));
        item = {
          id: up.publicId,
          kind: "photo",
          folder: folderId,
          title,
          alt: title,
          src: up.url,
          width: prep.width,
          height: prep.height,
          blur: prep.blur,
          publicId: up.publicId,
        };
      }
      mutate((cur) => ({ ...cur, items: insertAtFolderTop(cur.items, item) }));
      setJob(key, { state: "done", progress: 1 });
    } catch (err) {
      setJob(key, { state: "error", error: err instanceof Error ? err.message : "Upload failed." });
    }
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || readOnly || !folder) return;
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/") || /\.(hei[cf])$/i.test(f.name),
    );
    if (!files.length) return;
    const created = files.map((f) => ({ key: uniqueSuffix(), name: f.name, progress: 0, state: "preparing" as const }));
    setJobs((js) => [...created, ...js].slice(0, 30));
    for (let i = 0; i < files.length; i++) await uploadOne(files[i], created[i].key, folder.id);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  const statusText: Record<Status["kind"], string> = {
    idle: "All changes saved",
    pending: "Unsaved changes…",
    saving: "Saving…",
    saved: "All changes saved",
    error: "Not saved",
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="relative aspect-square w-10">
              <Image src="/brand/logo-ring.png" alt="" fill sizes="40px" />
              <Image src="/brand/logo-camera.png" alt="" fill sizes="40px" />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-xl font-semibold tracking-[0.18em]">PICTURESQUE</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Gallery admin</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <span
                role="status"
                className={`mr-2 flex items-center gap-2 text-xs ${status.kind === "error" ? "text-[#e57373]" : "text-muted"}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status.kind === "error"
                      ? "bg-[#e57373]"
                      : status.kind === "pending" || status.kind === "saving"
                        ? "animate-pulse bg-accent"
                        : "bg-[#25D366]"
                  }`}
                />
                {statusText[status.kind]}
                {status.kind === "error" && (
                  <button className="underline underline-offset-4" onClick={() => persist(mRef.current)}>
                    Retry
                  </button>
                )}
              </span>
            )}
            <a href="/#work" target="_blank" rel="noreferrer" className={btn}>
              View site ↗
            </a>
            <button className={btn} onClick={() => setShowPassword(true)}>
              Change password
            </button>
            <form action={logoutAction}>
              <button className={btn}>Log out</button>
            </form>
          </div>
        </div>
        {status.kind === "error" && status.message && (
          <p className="mx-auto max-w-7xl px-6 pb-3 text-xs text-[#e57373]">{status.message}</p>
        )}
      </header>

      {loadError && (
        <p className="mx-auto mt-6 max-w-7xl border border-[#e57373]/50 bg-[#e57373]/10 px-6 py-4 text-sm">
          Couldn&apos;t load the saved gallery ({loadError}). Editing is paused so nothing gets overwritten — refresh to try
          again.
        </p>
      )}
      {!loadError && storage === "none" && (
        <p className="mx-auto mt-6 max-w-7xl border border-accent/50 bg-accent/10 px-6 py-4 text-sm">
          Cloudinary isn&apos;t connected yet, so the gallery is read-only. Add <code>CLOUDINARY_URL</code> in Vercel →
          Settings → Environment Variables and redeploy.
        </p>
      )}
      {storage === "dev" && (
        <p className="mx-auto mt-6 max-w-7xl border border-line px-6 py-3 text-xs text-muted">
          Development mode: changes save to <code>.data/</code> and uploads to <code>public/uploads/</code> on this computer.
        </p>
      )}

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[300px_1fr]">
        {/* folders */}
        <aside>
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-accent">Folders</p>
          <ul className="space-y-2">
            {m.folders.map((f, i) => (
              <li
                key={f.id}
                className={`flex items-center gap-1 border pl-3 pr-1 transition-colors ${
                  f.id === folder?.id ? "border-accent bg-accent/10" : "border-line hover:border-foreground/30"
                }`}
              >
                <button onClick={() => setActive(f.id)} className="flex min-w-0 flex-1 items-baseline gap-2 py-2.5 text-left">
                  <span className="truncate font-serif text-lg">{f.title}</span>
                  <span className="text-[10px] text-muted">{count(f.id)}</span>
                </button>
                <button className={iconBtn} aria-label={`Move ${f.title} up`} disabled={readOnly || i === 0} onClick={() => moveFolder(f.id, -1)}>
                  ↑
                </button>
                <button
                  className={iconBtn}
                  aria-label={`Move ${f.title} down`}
                  disabled={readOnly || i === m.folders.length - 1}
                  onClick={() => moveFolder(f.id, 1)}
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addFolder();
            }}
          >
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="New folder name"
              maxLength={60}
              disabled={readOnly}
              className={input}
            />
            <button className={btn} disabled={readOnly || !newFolder.trim()}>
              + Add
            </button>
          </form>
          <p className="mt-6 text-xs leading-relaxed text-muted">
            Empty folders stay hidden on the site. The <span className="text-foreground">Films</span> folder fills itself
            with every video.
          </p>
        </aside>

        {/* folder workspace */}
        {folder && (
          <section className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
              <label className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent">Folder name</span>
                <input
                  key={`${folder.id}-${folder.title}`}
                  defaultValue={folder.title}
                  maxLength={60}
                  disabled={readOnly}
                  onBlur={(e) => renameFolder(folder.id, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="w-full border-b border-transparent bg-transparent font-serif text-4xl hover:border-line focus:border-accent focus:outline-none"
                />
              </label>
              <button className={`${btn} hover:!border-[#e57373] hover:!text-[#e57373]`} disabled={readOnly} onClick={() => deleteFolder(folder.id)}>
                Delete folder
              </button>
            </div>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors ${
                readOnly ? "pointer-events-none opacity-40" : ""
              } ${dragOver ? "border-accent bg-accent/10" : "border-line hover:border-foreground/40"}`}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*,.heic,.heif"
                className="sr-only"
                disabled={readOnly}
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="font-serif text-2xl">Drop photos & videos here</span>
              <span className="text-xs text-muted">
                or <span className="text-accent underline underline-offset-4">browse</span> — added to “{folder.title}”. Photos
                are resized and stripped of location data; videos up to 100 MB.
              </span>
            </label>

            {jobs.length > 0 && (
              <ul className="mt-4 space-y-2">
                {jobs.map((j) => (
                  <li key={j.key} className="border border-line px-4 py-2 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate">{j.name}</span>
                      <span className={j.state === "error" ? "text-[#e57373]" : j.state === "done" ? "text-[#25D366]" : "text-muted"}>
                        {j.state === "preparing" ? "Preparing…" : j.state === "uploading" ? `${Math.round(j.progress * 100)}%` : j.state === "done" ? "Added ✓" : "Failed"}
                      </span>
                    </div>
                    {j.state === "uploading" && (
                      <div className="mt-2 h-0.5 bg-line">
                        <div className="h-full bg-accent transition-[width]" style={{ width: `${j.progress * 100}%` }} />
                      </div>
                    )}
                    {j.error && <p className="mt-1 text-[#e57373]">{j.error}</p>}
                  </li>
                ))}
              </ul>
            )}

            <p className="mb-3 mt-8 text-[10px] uppercase tracking-[0.3em] text-muted">
              {items.length} item{items.length === 1 ? "" : "s"} · the first three photos are the folder&apos;s cover
            </p>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((item, idx) => (
                <li key={item.id} className="flex flex-col border border-line bg-surface">
                  <div className="relative aspect-square overflow-hidden bg-background">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 1280px) 18vw, (min-width: 640px) 28vw, 45vw"
                      className="object-cover"
                      {...blurProps(item.src, item.blur)}
                    />
                    <span className="absolute left-2 top-2 bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]">
                      {item.kind === "photo" ? "Photo" : item.kind === "video" ? "Film" : "Reel"}
                      {!item.publicId && " · built-in"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <input
                      key={`${item.id}-${item.title}`}
                      defaultValue={item.title}
                      maxLength={120}
                      disabled={readOnly}
                      aria-label="Title"
                      onBlur={(e) => renameItem(item.id, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      className={input}
                    />
                    <select
                      value={item.folder}
                      disabled={readOnly}
                      aria-label="Folder"
                      onChange={(e) => moveItem(item.id, e.target.value)}
                      className={`${input} [&>option]:bg-surface`}
                    >
                      {m.folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                    <div className="mt-auto flex items-center gap-1 pt-1">
                      <button className={iconBtn} aria-label="Move earlier" disabled={readOnly || idx === 0} onClick={() => shiftItem(item.id, -1)}>
                        ←
                      </button>
                      <button
                        className={iconBtn}
                        aria-label="Move later"
                        disabled={readOnly || idx === items.length - 1}
                        onClick={() => shiftItem(item.id, 1)}
                      >
                        →
                      </button>
                      <button
                        className={`${iconBtn} ml-auto hover:!border-[#e57373] hover:!text-[#e57373]`}
                        aria-label={`Delete ${item.title}`}
                        disabled={readOnly}
                        onClick={() => deleteItem(item)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {items.length === 0 && <p className="mt-4 text-sm text-muted">This folder is empty — upload something above.</p>}
          </section>
        )}
      </div>

      {showPassword && <PasswordDialog username={username} onClose={() => setShowPassword(false)} disabled={storage === "none"} />}
    </div>
  );
}

function PasswordDialog({ username, onClose, disabled }: { username: string; onClose: () => void; disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" role="dialog" aria-modal="true" aria-label="Change password" onClick={onClose}>
      <form action={action} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-5 border border-line bg-surface p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl">Change password</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-muted hover:text-accent">
            ×
          </button>
        </div>
        {disabled ? (
          <p className="text-sm text-muted">Connect Cloudinary first — the new password needs somewhere secure to be stored.</p>
        ) : (
          <>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Username</span>
              <input name="username" defaultValue={username} required autoComplete="username" className={input} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Current password</span>
              <input name="current" type="password" required autoComplete="current-password" className={input} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted">New password (10+ characters)</span>
              <input name="next" type="password" required minLength={10} autoComplete="new-password" className={input} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Repeat new password</span>
              <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={input} />
            </label>
            {state.error && <p role="alert" className="text-sm text-[#e57373]">{state.error}</p>}
            {state.ok && <p role="status" className="text-sm text-[#25D366]">{state.ok}</p>}
            <button
              disabled={pending}
              className="w-full bg-accent py-3.5 text-xs font-medium uppercase tracking-[0.25em] text-background hover:bg-foreground disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save new password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
