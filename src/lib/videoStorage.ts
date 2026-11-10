import { FloatingVideoConfig, FloatingVideoItem } from '../types';
import { getProducts } from './dataClient';

const FLOATING_VIDEO_STORAGE_KEY = 'aura_floating_video_config_v1';
const IDB_NAME = 'aura_video_storage_db';
const IDB_STORE = 'videos';

function openVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Cache global compartilhado de ObjectURLs em memória para evitar recriar blobs repetidamente
function getVideoUrlCache(): Map<string, string> {
  const g = globalThis as unknown as { __auraVideoObjectUrlCache?: Map<string, string> };
  if (!g.__auraVideoObjectUrlCache) {
    g.__auraVideoObjectUrlCache = new Map<string, string>();
  }
  return g.__auraVideoObjectUrlCache;
}
const objectUrlCache = getVideoUrlCache();

export function normalizeVideoMimeType(fileNameOrMime?: string): string {
  const lower = (fileNameOrMime || '').toLowerCase();
  if (lower.includes('webm')) return 'video/webm';
  if (lower.includes('ogg') || lower.includes('ogv')) return 'video/ogg';
  return 'video/mp4';
}

export function dataUrlToVideoBlobUrl(dataUrl: string): string {
  const trimmed = dataUrl.trim();
  if (objectUrlCache.has(trimmed)) {
    return objectUrlCache.get(trimmed)!;
  }
  try {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) return trimmed;
    const header = trimmed.slice(0, commaIdx);
    const base64 = trimmed.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/i);
    const rawMime = mimeMatch ? mimeMatch[1].toLowerCase() : 'video/mp4';
    const mimeType = normalizeVideoMimeType(rawMime);

    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    objectUrlCache.set(trimmed, blobUrl);
    return blobUrl;
  } catch (err) {
    console.warn('Fallback para dataURL direto:', err);
    return trimmed;
  }
}

/**
 * Retorna sincronamente a URL reproduzível caso já esteja em cache (idb:// ou data:video/)
 */
export function getSyncPlayableVideoUrl(videoUrl?: string): string {
  if (!videoUrl || typeof videoUrl !== 'string') return '';
  const trimmed = videoUrl.trim();
  if (!trimmed) return '';
  if (objectUrlCache.has(trimmed)) {
    return objectUrlCache.get(trimmed)!;
  }
  if (trimmed.startsWith('data:video/')) {
    return dataUrlToVideoBlobUrl(trimmed);
  }
  if (trimmed.startsWith('idb://')) {
    // Dispara resolução assíncrona em background
    resolvePlayableVideoUrl(trimmed).catch(() => {});
    return '';
  }
  return trimmed;
}

/**
 * Salva um arquivo de vídeo (.mp4, .webm, .mov, .m4v) no IndexedDB do navegador,
 * normalizando o MIME type para reprodução 100% compatível e sem limite de 5MB do localStorage.
 */
export async function saveVideoFileToStorage(file: File): Promise<string> {
  const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const idbRef = `idb://${videoId}`;
  const mimeType = normalizeVideoMimeType(file.name || file.type);

  try {
    const buffer = await file.arrayBuffer();
    const normalizedBlob = new Blob([buffer], { type: mimeType });
    const immediateObjUrl = URL.createObjectURL(normalizedBlob);
    objectUrlCache.set(idbRef, immediateObjUrl);

    const db = await openVideoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(normalizedBlob, videoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura_video_blob_ready', { detail: { idbRef, url: immediateObjUrl } }));
    }
    return idbRef;
  } catch (err) {
    console.error('Erro ao salvar vídeo no IndexedDB, usando DataURL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let res = (reader.result as string) || '';
        const commaIdx = res.indexOf(',');
        if (commaIdx !== -1 && !res.startsWith('data:video/mp4') && !res.startsWith('data:video/webm')) {
          res = `data:${mimeType};base64,${res.slice(commaIdx + 1)}`;
        }
        resolve(res);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Resolve uma referência 'idb://...', 'data:video/...' ou URL direta para uma ObjectURL reproduzível na tag <video>
 */
export async function resolvePlayableVideoUrl(videoUrl: string): Promise<string> {
  if (!videoUrl || typeof videoUrl !== 'string') return '';
  const trimmed = videoUrl.trim();
  if (!trimmed) return '';

  if (objectUrlCache.has(trimmed)) {
    return objectUrlCache.get(trimmed)!;
  }

  if (trimmed.startsWith('data:video/')) {
    return dataUrlToVideoBlobUrl(trimmed);
  }

  if (!trimmed.startsWith('idb://')) return trimmed;

  const videoId = trimmed.replace('idb://', '');
  try {
    const db = await openVideoDb();
    const rawBlob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(videoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (rawBlob instanceof Blob) {
      let playableBlob = rawBlob;
      if (
        !rawBlob.type ||
        rawBlob.type === 'video/quicktime' ||
        rawBlob.type === 'application/octet-stream'
      ) {
        const buf = await rawBlob.arrayBuffer();
        playableBlob = new Blob([buf], { type: 'video/mp4' });
      }
      const objUrl = URL.createObjectURL(playableBlob);
      objectUrlCache.set(trimmed, objUrl);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aura_video_blob_ready', { detail: { idbRef: trimmed, url: objUrl } }));
      }
      return objUrl;
    }
  } catch (err) {
    console.error('Erro ao carregar vídeo do IndexedDB:', err);
  }
  return '';
}

/**
 * Pré-carrega na memória todos os vídeos salvos no IndexedDB ao iniciar a aplicação
 */
export async function preloadAllStoredVideos(): Promise<void> {
  try {
    const db = await openVideoDb();
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    for (const key of keys) {
      const idbRef = `idb://${String(key)}`;
      if (!objectUrlCache.has(idbRef)) {
        await resolvePlayableVideoUrl(idbRef);
      }
    }
  } catch {
    // Ignore if IDB not available
  }
}

if (typeof window !== 'undefined') {
  preloadAllStoredVideos();
}

export async function deleteVideoFromStorage(videoUrl?: string): Promise<void> {
  if (!videoUrl || !videoUrl.startsWith('idb://')) return;
  const videoId = videoUrl.replace('idb://', '');
  try {
    const cached = objectUrlCache.get(videoUrl);
    if (cached) {
      URL.revokeObjectURL(cached);
      objectUrlCache.delete(videoUrl);
    }
    const db = await openVideoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(videoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

export function getDefaultFloatingVideoConfig(): FloatingVideoConfig {
  const products = getProducts();
  const firstProd = products[0];
  const fallbackImgs =
    products
      .flatMap((p) => p.images || [])
      .filter(Boolean)
      .slice(0, 6) || ['/images/macaco-bless.png', '/images/look-3214.png', '/images/look-3656.png'];

  return {
    enabled: true,
    position: 'bottom-left',
    size: 'md',
    borderColor: '#F27474', // Moldura dupla estilo Lê Rose (personalizável no Admin)
    clickAction: 'direct-link',
    showCloseButton: true,
    showProductBadge: true,
    items: [
      {
        id: 'fvid-default-1',
        title: firstProd?.name || 'Destaque Coleção Aura Fitness',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-warm-up-exercises-40024-large.mp4',
        fallbackImages:
          firstProd?.images && firstProd.images.length > 0 ? firstProd.images : fallbackImgs,
        productId: firstProd?.id || 'prod-1',
        customLink: firstProd ? `/produto/${firstProd.id}` : '/catalogo',
        buttonText: 'Ver Produto',
        badgeText: 'LOOK EM VÍDEO',
        active: true,
        order: 1,
      },
    ],
  };
}

export function getFloatingVideoConfig(): FloatingVideoConfig {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(FLOATING_VIDEO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
          return {
            ...getDefaultFloatingVideoConfig(),
            ...parsed,
          };
        }
      }
    }
  } catch (err) {
    console.error('Erro ao ler configuração do mini-vídeo flutuante:', err);
  }
  return getDefaultFloatingVideoConfig();
}

export function saveFloatingVideoConfig(config: FloatingVideoConfig): FloatingVideoConfig {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(config));
      window.dispatchEvent(
        new CustomEvent('aura_floating_video_updated', { detail: config })
      );
    }
  } catch (err) {
    console.error('Erro ao salvar configuração do mini-vídeo flutuante:', err);
  }
  return config;
}

export function saveFloatingVideoItem(item: Partial<FloatingVideoItem>): FloatingVideoConfig {
  const current = getFloatingVideoConfig();
  const items = [...current.items];

  if (item.id) {
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...item } as FloatingVideoItem;
    } else {
      items.push({
        id: item.id,
        title: item.title || 'Vídeo Destaque Aura',
        videoUrl: item.videoUrl || '',
        fallbackImages: item.fallbackImages || ['/images/macaco-bless.png'],
        productId: item.productId,
        customLink: item.customLink || '/catalogo',
        buttonText: item.buttonText || 'Ver Produto',
        badgeText: item.badgeText || 'NOVO',
        active: item.active ?? true,
        order: item.order || items.length + 1,
      });
    }
  } else {
    items.push({
      id: `fvid-${Date.now()}`,
      title: item.title || 'Vídeo Destaque Aura',
      videoUrl: item.videoUrl || '',
      fallbackImages: item.fallbackImages || ['/images/macaco-bless.png'],
      productId: item.productId,
      customLink: item.customLink || '/catalogo',
      buttonText: item.buttonText || 'Ver Produto',
      badgeText: item.badgeText || 'NOVO',
      active: item.active ?? true,
      order: items.length + 1,
    });
  }

  const updated: FloatingVideoConfig = {
    ...current,
    items,
  };
  return saveFloatingVideoConfig(updated);
}

export async function deleteFloatingVideoItem(id: string): Promise<FloatingVideoConfig> {
  const current = getFloatingVideoConfig();
  const target = current.items.find((i) => i.id === id);
  if (target?.videoUrl?.startsWith('idb://')) {
    await deleteVideoFromStorage(target.videoUrl);
  }
  const updated: FloatingVideoConfig = {
    ...current,
    items: current.items.filter((i) => i.id !== id),
  };
  return saveFloatingVideoConfig(updated);
}
