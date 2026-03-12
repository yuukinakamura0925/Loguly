"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  UploadIcon,
  TrashIcon,
  XIcon,
  LoaderIcon,
  ImageIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  FolderIcon,
  FolderPlusIcon,
  FolderOpenIcon,
  PencilIcon,
  PlusIcon,
  AlertTriangleIcon,
  SearchIcon,
  LayoutGridIcon,
  ListIcon,
  ChevronRightIcon,
  FolderInputIcon,
} from "@/components/icons";
import { checkEasterEgg } from "./use-emoji-rain";
import {
  uploadGalleryImage,
  deleteGalleryImage,
  renameGalleryImage,
  createGalleryFolder,
  renameGalleryFolder,
  deleteGalleryFolder,
  moveImageToFolder,
  moveFolderToParent,
} from "./actions";
import type { GalleryImage, GalleryFolder } from "@/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORAGE_LIMIT_GB = 100;
const WARN_FILE_SIZE_MB = 10;

function getPublicUrl(filePath: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/gallery/${filePath}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ViewMode = "grid" | "list";

type Props = {
  initialImages: GalleryImage[];
  initialStorageUsage: { totalBytes: number; imageCount: number };
  initialFolders: GalleryFolder[];
};

export function GalleryClient({ initialImages, initialStorageUsage, initialFolders }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [storageUsage, setStorageUsage] = useState(initialStorageUsage);
  const [folders, setFolders] = useState(initialFolders);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);
  const [copied, setCopied] = useState(false);

  // 表示モード
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 現在開いているフォルダ（null = ルート）
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFolderLoading, setCreatingFolderLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [folderDragOver, setFolderDragOver] = useState<number | null>(null);

  // サイドバーの展開状態
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // 検索
  const [searchQuery, setSearchQuery] = useState("");

  // 画像リネーム
  const [renamingImageId, setRenamingImageId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // モバイル長押し移動
  const [moveMenuTarget, setMoveMenuTarget] = useState<{ type: "image" | "folder"; id: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggerRef = useRef(false);

  const storageLimitBytes = STORAGE_LIMIT_GB * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, (storageUsage.totalBytes / storageLimitBytes) * 100);
  const isStorageWarning = storagePercent >= 80;
  const isStorageDanger = storagePercent >= 95;

  // ── ツリーヘルパー ──

  const getChildFolders = (parentId: number | null) =>
    folders.filter((f) => f.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name));

  const getImagesInFolder = (folderId: number | null) =>
    images.filter((img) => img.folder_id === folderId);

  // フォルダとその子孫に含まれる全画像数
  const getTotalImageCount = (folderId: number | null): number => {
    const direct = getImagesInFolder(folderId).length;
    const children = getChildFolders(folderId);
    return direct + children.reduce((sum, child) => sum + getTotalImageCount(child.id), 0);
  };

  // パンくず: ルートからcurrentFolderIdまでの階層
  const getBreadcrumb = (): GalleryFolder[] => {
    const path: GalleryFolder[] = [];
    let id = currentFolderId;
    while (id !== null) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parent_id;
    }
    return path;
  };

  // フォルダIDの子孫かどうか
  const isDescendantOf = (folderId: number, ancestorId: number): boolean => {
    let id: number | null = folderId;
    while (id !== null) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) return false;
      if (folder.parent_id === ancestorId) return true;
      id = folder.parent_id;
    }
    return false;
  };

  // 現在のフォルダの直下にあるフォルダと画像
  const currentChildFolders = (() => {
    const children = getChildFolders(currentFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return children.filter((f) => f.name.toLowerCase().includes(q));
    }
    return children;
  })();

  const currentImages = (() => {
    if (searchQuery.trim()) {
      // 検索時は全画像を横断
      const q = searchQuery.trim().toLowerCase();
      return images.filter((img) => img.file_name.toLowerCase().includes(q));
    }
    return getImagesInFolder(currentFolderId);
  })();

  const breadcrumb = getBreadcrumb();
  const currentFolderName = currentFolderId !== null
    ? folders.find((f) => f.id === currentFolderId)?.name ?? ""
    : "画像保管庫";

  // ── アップロード ──

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const largeFiles = Array.from(files).filter((f) => f.size > WARN_FILE_SIZE_MB * 1024 * 1024);
    if (largeFiles.length > 0) {
      const names = largeFiles.map((f) => `${f.name} (${formatFileSize(f.size)})`).join("\n");
      if (!confirm(`以下のファイルは${WARN_FILE_SIZE_MB}MBを超えています。アップロードしますか？\n\n${names}`)) {
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        if (currentFolderId !== null) formData.append("folderId", String(currentFolderId));
        const result = await uploadGalleryImage(formData);
        if (result.error) {
          alert(`${file.name}: ${result.error}`);
        }
      }
      router.refresh();
      const { getGalleryImages, getGalleryStorageUsage } = await import("./actions");
      const [updated, usage] = await Promise.all([getGalleryImages(), getGalleryStorageUsage()]);
      setImages(updated);
      setStorageUsage(usage);
    } finally {
      setUploading(false);
    }
  }, [router, currentFolderId]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.types.includes("Files") && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // ── 削除 ──

  const handleDelete = async (id: number) => {
    if (!confirm("この画像を削除しますか？")) return;
    setDeleting(id);
    const result = await deleteGalleryImage(id);
    if (result.error) {
      alert(result.error);
    } else {
      const deleted = images.find((img) => img.id === id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (deleted) {
        setStorageUsage((prev) => ({
          totalBytes: Math.max(0, prev.totalBytes - deleted.file_size),
          imageCount: Math.max(0, prev.imageCount - 1),
        }));
      }
      if (lightbox?.id === id) setLightbox(null);
    }
    setDeleting(null);
  };

  // ── URLコピー ──

  const handleCopyUrl = async (filePath: string) => {
    const url = getPublicUrl(filePath);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── フォルダ CRUD ──

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || creatingFolderLoading) return;
    setCreatingFolderLoading(true);
    try {
      const result = await createGalleryFolder(newFolderName, currentFolderId);
      if (result.error) {
        alert(result.error);
        return;
      }
      if (result.folder) {
        setFolders((prev) => [...prev, result.folder!]);
        navigateToFolder(result.folder.id);
        // 🌸 イースターエッグ
        checkEasterEgg(newFolderName);
      }
      setNewFolderName("");
      setCreatingFolder(false);
    } finally {
      setCreatingFolderLoading(false);
    }
  };

  const handleRenameFolder = async (id: number) => {
    if (!editFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    const result = await renameGalleryFolder(id, editFolderName);
    if (result.error) {
      alert(result.error);
    } else {
      setFolders((prev) =>
        prev.map((f) => f.id === id ? { ...f, name: editFolderName.trim() } : f)
      );
    }
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (id: number) => {
    const count = getTotalImageCount(id);
    const childCount = getChildFolders(id).length;
    const parts: string[] = [];
    if (childCount > 0) parts.push(`${childCount} 個のサブフォルダ`);
    if (count > 0) parts.push(`${count} 枚の画像`);
    const detail = parts.length > 0 ? `\n含まれる${parts.join("と")}も削除されます。` : "";
    if (!confirm(`「${folders.find((f) => f.id === id)?.name}」を削除しますか？${detail}`)) return;

    const result = await deleteGalleryFolder(id);
    if (result.error) {
      alert(result.error);
    } else {
      // カスケード削除: 子孫フォルダも削除される
      const descendantIds = new Set<number>();
      const collectDescendants = (parentId: number) => {
        descendantIds.add(parentId);
        folders.filter((f) => f.parent_id === parentId).forEach((f) => collectDescendants(f.id));
      };
      collectDescendants(id);

      setFolders((prev) => prev.filter((f) => !descendantIds.has(f.id)));
      setImages((prev) => prev.filter((img) => !img.folder_id || !descendantIds.has(img.folder_id)));
      if (currentFolderId !== null && descendantIds.has(currentFolderId)) {
        setCurrentFolderId(folders.find((f) => f.id === id)?.parent_id ?? null);
      }
    }
  };

  // ── 画像リネーム ──

  const handleRenameImage = async (id: number) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingImageId(null);
      return;
    }
    const result = await renameGalleryImage(id, trimmed);
    if (result.error) {
      alert(result.error);
    } else {
      setImages((prev) => prev.map((img) => img.id === id ? { ...img, file_name: trimmed } : img));
      if (lightbox?.id === id) setLightbox((prev) => prev ? { ...prev, file_name: trimmed } : null);
    }
    setRenamingImageId(null);
  };

  // ── 画像のフォルダ移動 ──

  const handleMoveImage = async (imageId: number, folderId: number | null) => {
    const previousImages = images;
    setImages((prev) => prev.map((img) => img.id === imageId ? { ...img, folder_id: folderId } : img));
    const result = await moveImageToFolder(imageId, folderId);
    if (result.error) {
      setImages(previousImages);
      alert(result.error);
    }
  };

  // ── フォルダ移動 ──

  const handleMoveFolder = async (folderId: number, newParentId: number | null) => {
    if (folderId === newParentId) return;
    if (newParentId !== null && isDescendantOf(newParentId, folderId)) return;

    const previousFolders = folders;
    setFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, parent_id: newParentId } : f));
    const result = await moveFolderToParent(folderId, newParentId);
    if (result.error) {
      setFolders(previousFolders);
      alert(result.error);
    }
  };

  // ── ドラッグ&ドロップ ──

  const handleDragStart = (e: React.DragEvent, type: "image" | "folder", id: number) => {
    e.dataTransfer.setData("application/x-gallery-type", type);
    e.dataTransfer.setData("application/x-gallery-id", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    setFolderDragOver(null);
    const type = e.dataTransfer.getData("application/x-gallery-type");
    const idStr = e.dataTransfer.getData("application/x-gallery-id");
    if (!type || !idStr) return;
    const id = Number(idStr);
    if (type === "image") {
      await handleMoveImage(id, targetFolderId);
    } else if (type === "folder") {
      await handleMoveFolder(id, targetFolderId);
    }
  };

  const handleFolderDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-gallery-type")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  };

  // ── サイドバー展開トグル ──

  const toggleExpand = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // フォルダを開いたときサイドバーも展開
  const navigateToFolder = (folderId: number | null) => {
    setCurrentFolderId(folderId);
    // パンくずの親を全て展開
    if (folderId !== null) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        let id: number | null = folderId;
        while (id !== null) {
          const folder = folders.find((f) => f.id === id);
          if (!folder) break;
          next.add(id);
          id = folder.parent_id;
        }
        return next;
      });
    }
  };

  // ── モバイル長押し ──

  const handleTouchStart = (type: "image" | "folder", id: number) => {
    longPressTriggerRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggerRef.current = true;
      setMoveMenuTarget({ type, id });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    // スクロール時はキャンセル
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 長押しメニューの移動先フォルダ一覧を構築
  const getMoveDestinations = (): { id: number | null; name: string; depth: number }[] => {
    if (!moveMenuTarget) return [];
    const destinations: { id: number | null; name: string; depth: number }[] = [];

    // ルートに移動
    destinations.push({ id: null, name: "画像保管庫（ルート）", depth: 0 });

    // 全フォルダをツリー順に展開
    const addFolders = (parentId: number | null, depth: number) => {
      const children = getChildFolders(parentId);
      for (const folder of children) {
        // 自分自身と自分の子孫は除外（フォルダ移動時）
        if (moveMenuTarget.type === "folder") {
          if (folder.id === moveMenuTarget.id) continue;
          if (isDescendantOf(folder.id, moveMenuTarget.id)) continue;
        }
        destinations.push({ id: folder.id, name: folder.name, depth });
        addFolders(folder.id, depth + 1);
      }
    };
    addFolders(null, 1);

    // 現在の場所を除外
    if (moveMenuTarget.type === "image") {
      const img = images.find((i) => i.id === moveMenuTarget.id);
      return destinations.filter((d) => d.id !== (img?.folder_id ?? null));
    } else {
      const folder = folders.find((f) => f.id === moveMenuTarget.id);
      return destinations.filter((d) => d.id !== (folder?.parent_id ?? null));
    }
  };

  const handleMoveMenuSelect = async (destinationFolderId: number | null) => {
    if (!moveMenuTarget) return;
    if (moveMenuTarget.type === "image") {
      await handleMoveImage(moveMenuTarget.id, destinationFolderId);
    } else {
      await handleMoveFolder(moveMenuTarget.id, destinationFolderId);
    }
    setMoveMenuTarget(null);
  };

  // ── サイドバーツリーレンダリング ──

  const renderFolderTree = (parentId: number | null, depth: number = 0) => {
    const children = getChildFolders(parentId);
    if (children.length === 0) return null;

    return children.map((folder) => {
      const hasChildren = getChildFolders(folder.id).length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = currentFolderId === folder.id;
      const imgCount = getTotalImageCount(folder.id);

      return (
        <div key={folder.id}>
          <div
            onDragOver={(e) => { handleFolderDragOver(e); setFolderDragOver(folder.id); }}
            onDragLeave={() => setFolderDragOver(null)}
            onDrop={(e) => handleFolderDrop(e, folder.id)}
            className={`group flex items-center rounded-lg transition-colors ${
              folderDragOver === folder.id ? "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20" :
              isSelected
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            style={{ paddingLeft: `${depth * 12}px` }}
          >
            {/* 展開ボタン */}
            <button
              onClick={() => hasChildren && toggleExpand(folder.id)}
              className={`w-5 h-5 flex items-center justify-center shrink-0 ${hasChildren ? "text-slate-400" : "text-transparent"}`}
            >
              <ChevronRightIcon
                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                strokeWidth={2}
              />
            </button>

            {editingFolderId === folder.id ? (
              <input
                autoFocus
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameFolder(folder.id);
                  if (e.key === "Escape") setEditingFolderId(null);
                }}
                onBlur={() => handleRenameFolder(folder.id)}
                className="flex-1 mx-1 px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <>
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className={`flex-1 flex items-center gap-2 px-1 py-2 text-sm min-w-0 ${
                    isSelected
                      ? "text-blue-700 dark:text-blue-300 font-medium"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {isSelected
                    ? <FolderOpenIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    : <FolderIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  }
                  <span className="truncate flex-1 text-left">{folder.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{imgCount}</span>
                </button>
                <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                  <button
                    onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title="名前変更"
                  >
                    <PencilIcon className="w-3 h-3" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500"
                    title="削除"
                  >
                    <TrashIcon className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              </>
            )}
          </div>
          {isExpanded && renderFolderTree(folder.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full">
      {/* ── フォルダサイドバー ── */}
      <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto hidden md:block">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">フォルダ</h2>
            <button
              onClick={() => { setCreatingFolder(true); setNewFolderName(""); }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="フォルダ作成"
            >
              <PlusIcon className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          <nav className="space-y-0.5">
            {/* ルート */}
            <button
              onClick={() => navigateToFolder(null)}
              onDragOver={(e) => { handleFolderDragOver(e); setFolderDragOver(null); }}
              onDragLeave={() => setFolderDragOver(null)}
              onDrop={(e) => handleFolderDrop(e, null)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                currentFolderId === null
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate flex-1 text-left">画像保管庫</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{images.length}</span>
            </button>

            {/* フォルダツリー */}
            {renderFolderTree(null)}
          </nav>
        </div>
      </aside>

      {/* ── メインコンテンツ ── */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* ツールバー */}
          <div className="flex flex-col gap-4 mb-6">
            {/* 上段: パンくず */}
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
              <button
                onClick={() => navigateToFolder(null)}
                className={`text-sm shrink-0 ${
                  currentFolderId === null
                    ? "font-medium text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                画像保管庫
              </button>
              {breadcrumb.map((folder) => (
                <span key={folder.id} className="flex items-center gap-1.5 shrink-0">
                  <ChevronRightIcon className="w-3 h-3 text-slate-300 dark:text-slate-600" strokeWidth={2} />
                  <button
                    onClick={() => navigateToFolder(folder.id)}
                    className={`text-sm ${
                      folder.id === currentFolderId
                        ? "font-medium text-slate-900 dark:text-white"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
              <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-1">
                {currentImages.length} 枚
              </span>
            </div>

            {/* 中段: ボタン群 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 表示切替 */}
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    viewMode === "grid"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title="グリッド表示"
                >
                  <LayoutGridIcon className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${
                    viewMode === "list"
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  title="リスト表示"
                >
                  <ListIcon className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <Button
                variant="secondary"
                onClick={() => { setCreatingFolder(true); setNewFolderName(""); }}
              >
                <FolderPlusIcon className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">新規フォルダ</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadIcon className="w-4 h-4" strokeWidth={1.5} />
                )}
                <span className="hidden sm:inline">{uploading ? "アップロード中..." : "アップロード"}</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </div>

            {/* 下段: 検索バー + ストレージ */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="名前で検索..."
                  className="w-full pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <XIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 shrink-0">
                <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isStorageDanger ? "bg-red-500" : isStorageWarning ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <span className={isStorageDanger ? "text-red-500" : isStorageWarning ? "text-amber-500" : ""}>
                  {formatFileSize(storageUsage.totalBytes)} / {STORAGE_LIMIT_GB} GB
                </span>
                {isStorageWarning && <AlertTriangleIcon className="w-3.5 h-3.5" strokeWidth={2} />}
              </div>
            </div>
          </div>

          {/* モバイル用パンくず */}
          <div className="md:hidden mb-4 flex items-center gap-1.5 overflow-x-auto text-sm">
            <button
              onClick={() => navigateToFolder(null)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
            >
              ルート
            </button>
            {breadcrumb.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1.5 shrink-0">
                <ChevronRightIcon className="w-3 h-3 text-slate-300 dark:text-slate-600" strokeWidth={2} />
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className={folder.id === currentFolderId
                    ? "font-medium text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          {/* 新規フォルダ入力（メインエリア） */}
          {creatingFolder && (
            <div className="mb-4 flex items-center gap-2">
              <FolderPlusIcon className="w-5 h-5 text-blue-400 shrink-0" strokeWidth={1.5} />
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                }}
                placeholder="新規フォルダ名"
                disabled={creatingFolderLoading}
                className="flex-1 max-w-xs px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
              <Button size="sm" onClick={handleCreateFolder} disabled={creatingFolderLoading || !newFolderName.trim()}>
                {creatingFolderLoading ? <LoaderIcon className="w-4 h-4 animate-spin" /> : "作成"}
              </Button>
              <button
                onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XIcon className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {/* ドロップゾーン + コンテンツ */}
          <div
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault();
                setDragOver(true);
              }
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`relative transition-all duration-200 ${
              dragOver ? "ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900 rounded-2xl" : ""
            }`}
          >
            {dragOver && (
              <div className="absolute inset-0 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                <div className="text-center">
                  <UploadIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">ここにドロップ</p>
                  {currentFolderId !== null && (
                    <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">
                      「{currentFolderName}」に追加
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentChildFolders.length === 0 && currentImages.length === 0 ? (
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-16 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" strokeWidth={1} />
                <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-2">
                  {searchQuery.trim()
                    ? `「${searchQuery.trim()}」に一致する項目がありません`
                    : "このフォルダは空です"}
                </p>
                {!searchQuery.trim() && (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    クリックまたはドラッグ＆ドロップでアップロード
                  </p>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* ── グリッド表示 ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* アップロードカード */}
                {!searchQuery.trim() && (
                  <div
                    className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors mb-2" strokeWidth={1.5} />
                    <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">追加</span>
                  </div>
                )}

                {/* サブフォルダ */}
                {currentChildFolders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "folder", folder.id)}
                    onClick={() => { if (!longPressTriggerRef.current) navigateToFolder(folder.id); }}
                    onDragOver={(e) => { handleFolderDragOver(e); setFolderDragOver(folder.id); }}
                    onDragLeave={() => setFolderDragOver(null)}
                    onDrop={(e) => handleFolderDrop(e, folder.id)}
                    onTouchStart={() => handleTouchStart("folder", folder.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                      folderDragOver === folder.id
                        ? "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
                    }`}
                  >
                    <FolderIcon className="w-12 h-12 text-blue-400 dark:text-blue-500 mb-2" strokeWidth={1} />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[90%] px-2">{folder.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{getTotalImageCount(folder.id)} 枚</p>
                  </div>
                ))}

                {/* 画像 */}
                {currentImages.map((image) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "image", image.id)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-2 hover:ring-blue-400 transition-all"
                    onClick={() => { if (!longPressTriggerRef.current) setLightbox(image); }}
                    onTouchStart={() => handleTouchStart("image", image.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                  >
                    <Image
                      src={getPublicUrl(image.file_path)}
                      alt={image.file_name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate">{image.file_name}</p>
                        <p className="text-white/70 text-xs">{formatFileSize(image.file_size)}</p>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyUrl(image.file_path); }}
                          className="h-7 px-2 bg-white/20 backdrop-blur-sm rounded-lg flex items-center gap-1.5 hover:bg-white/30 transition-colors"
                          title="URLをコピー"
                        >
                          <CopyIcon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                          <span className="text-white text-xs font-medium">URL</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                          disabled={deleting === image.id}
                          className="w-7 h-7 bg-red-500/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors disabled:opacity-50"
                          title="削除"
                        >
                          {deleting === image.id ? (
                            <LoaderIcon className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : (
                            <TrashIcon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ── リスト表示 ── */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="w-10" />
                  <div>名前</div>
                  <div className="w-20 text-right hidden sm:block">サイズ</div>
                  <div className="w-28 text-right hidden sm:block">日付</div>
                  <div className="w-24" />
                </div>

                {/* サブフォルダ行 */}
                {currentChildFolders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "folder", folder.id)}
                    onClick={() => { if (!longPressTriggerRef.current) navigateToFolder(folder.id); }}
                    onDragOver={(e) => { handleFolderDragOver(e); setFolderDragOver(folder.id); }}
                    onDragLeave={() => setFolderDragOver(null)}
                    onDrop={(e) => handleFolderDrop(e, folder.id)}
                    onTouchStart={() => handleTouchStart("folder", folder.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${
                      folderDragOver === folder.id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <FolderIcon className="w-8 h-8 text-blue-400 dark:text-blue-500" strokeWidth={1} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{folder.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{getTotalImageCount(folder.id)} 枚</p>
                    </div>
                    <div className="w-20 hidden sm:block" />
                    <div className="w-28 text-right text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                      {formatDate(folder.created_at)}
                    </div>
                    <div className="w-24 flex justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="名前変更"
                      >
                        <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="削除"
                      >
                        <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 画像行 */}
                {currentImages.map((image) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, "image", image.id)}
                    onClick={() => { if (!longPressTriggerRef.current) setLightbox(image); }}
                    onTouchStart={() => handleTouchStart("image", image.id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    className="group grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 relative shrink-0">
                      <Image
                        src={getPublicUrl(image.file_path)}
                        alt={image.file_name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      {renamingImageId === image.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameImage(image.id);
                            if (e.key === "Escape") setRenamingImageId(null);
                          }}
                          onBlur={() => handleRenameImage(image.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{image.file_name}</p>
                      )}
                      {searchQuery.trim() && image.folder_id && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {folders.find((f) => f.id === image.folder_id)?.name}
                        </p>
                      )}
                    </div>
                    <div className="w-20 text-right text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                      {formatFileSize(image.file_size)}
                    </div>
                    <div className="w-28 text-right text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                      {formatDate(image.created_at)}
                    </div>
                    <div className="w-24 flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingImageId(image.id); setRenameValue(image.file_name); }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="名前変更"
                      >
                        <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyUrl(image.file_path); }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="URLをコピー"
                      >
                        <CopyIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                        disabled={deleting === image.id}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        title="削除"
                      >
                        {deleting === image.id ? (
                          <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* コピー完了トースト */}
      {copied && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <CheckIcon className="w-4 h-4" strokeWidth={2} />
          <span className="text-sm font-medium">URLをコピーしました</span>
        </div>
      )}

      {/* モバイル移動メニュー（ボトムシート） */}
      {moveMenuTarget && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setMoveMenuTarget(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full sm:w-96 sm:rounded-xl rounded-t-xl max-h-[70vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FolderInputIcon className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {moveMenuTarget.type === "image" ? "画像を移動" : "フォルダを移動"}
                </h3>
              </div>
              <button
                onClick={() => setMoveMenuTarget(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XIcon className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-2 py-2 text-xs text-slate-500 dark:text-slate-400 px-4">
              {moveMenuTarget.type === "image"
                ? `「${images.find((i) => i.id === moveMenuTarget.id)?.file_name ?? ""}」`
                : `「${folders.find((f) => f.id === moveMenuTarget.id)?.name ?? ""}」`}
              の移動先を選択
            </div>
            <div className="overflow-y-auto flex-1 pb-safe">
              {getMoveDestinations().map((dest) => (
                <button
                  key={dest.id ?? "root"}
                  onClick={() => handleMoveMenuSelect(dest.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  style={{ paddingLeft: `${16 + dest.depth * 16}px` }}
                >
                  {dest.id === null
                    ? <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
                    : <FolderIcon className="w-4 h-4 text-blue-400 shrink-0" strokeWidth={1.5} />
                  }
                  <span className="truncate">{dest.name}</span>
                </button>
              ))}
              {getMoveDestinations().length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  移動先がありません
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ライトボックス */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <XIcon className="w-5 h-5 text-white" strokeWidth={2} />
            </button>

            <div className="relative w-full h-[70vh] rounded-xl overflow-hidden bg-black">
              <Image
                src={getPublicUrl(lightbox.file_path)}
                alt={lightbox.file_name}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-2">
              <div>
                {renamingImageId === lightbox.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameImage(lightbox.id);
                      if (e.key === "Escape") setRenamingImageId(null);
                    }}
                    onBlur={() => handleRenameImage(lightbox.id)}
                    className="w-full px-2 py-1 text-sm bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <button
                    onClick={() => { setRenamingImageId(lightbox.id); setRenameValue(lightbox.file_name); }}
                    className="flex items-center gap-2 group/rename"
                    title="クリックで名前変更"
                  >
                    <p className="text-white font-medium">{lightbox.file_name}</p>
                    <PencilIcon className="w-3.5 h-3.5 text-white/40 group-hover/rename:text-white/70 transition-colors" strokeWidth={2} />
                  </button>
                )}
                <p className="text-white/50 text-sm mt-0.5">
                  {formatFileSize(lightbox.file_size)} ・ {formatDate(lightbox.created_at)}
                  {lightbox.folder_id && ` ・ ${folders.find((f) => f.id === lightbox.folder_id)?.name ?? ""}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyUrl(lightbox.file_path)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <CopyIcon className="w-4 h-4" strokeWidth={1.5} />
                  URLコピー
                </Button>
                <a
                  href={getPublicUrl(lightbox.file_path)}
                  download={lightbox.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <DownloadIcon className="w-4 h-4" strokeWidth={1.5} />
                    ダウンロード
                  </Button>
                </a>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(lightbox.id)}
                  disabled={deleting === lightbox.id}
                >
                  {deleting === lightbox.id ? (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <TrashIcon className="w-4 h-4" strokeWidth={1.5} />
                  )}
                  削除
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
