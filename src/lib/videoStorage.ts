import { FloatingVideoConfig, FloatingVideoItem } from '../types';
import { getProducts } from './dataClient';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const FLOATING_VIDEO_STORAGE_KEY = 'aura_floating_video_config_v1';
const CLOUD_VIDEO_MAP_KEY = 'aura_cloud_video_map_v1';
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

function getCloudVideoMap(): Record<string, string> {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(CLOUD_VIDEO_MAP_KEY);
      if (raw) return JSON.parse(raw) || {};
    }
  } catch {}
  return {};
}

function saveCloudVideoMapping(idbRef: string, publicUrl: string): void {
  try {
    if (typeof window !== 'undefined') {
      const map = getCloudVideoMap();
      map[idbRef] = publicUrl;
      localStorage.setItem(CLOUD_VIDEO_MAP_KEY, JSON.stringify(map));
    }
  } catch {}
}

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
 * Faz upload de um Blob de vídeo para o bucket público 'product-images' no Supabase Storage
 * para que o vídeo funcione tanto no computador quanto em qualquer smartphone.
 */
export async function uploadVideoBlobToCloud(
  blob: Blob,
  videoId: string,
  mimeType = 'video/mp4'
): Promise<string | null> {
  const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
  const filePath = `videos/${videoId}.${ext}`;

  // 1. Tenta via endpoint serverless /api/sync-store (usa Service Role Key e gera Signed Upload URL)
  try {
    const signRes = await fetch('/api/sync-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_upload_url',
        payload: { bucket: 'product-images', path: filePath },
      }),
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData?.token && signData?.publicUrl && isSupabaseConfigured()) {
        const { error: upErr } = await supabase.storage
          .from('product-images')
          .uploadToSignedUrl(signData.path || filePath, signData.token, blob, {
            contentType: mimeType,
            upsert: true,
          });
        if (!upErr) {
          return signData.publicUrl;
        }
      }
    }
  } catch {
    // Continua para tentativa direta
  }

  // 2. Tentativa direta via cliente Supabase autenticado
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, { contentType: mimeType, upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch {}
  }

  return null;
}

/**
 * Retorna sincronamente a URL reproduzível caso já esteja em cache (idb:// ou data:video/)
 */
export function getSyncPlayableVideoUrl(videoUrl?: string): string {
  if (!videoUrl || typeof videoUrl !== 'string') return '';
  const trimmed = videoUrl.trim();
  if (!trimmed || trimmed.includes('assets.mixkit.co')) return '';
  if (objectUrlCache.has(trimmed)) {
    return objectUrlCache.get(trimmed)!;
  }
  const cloudMap = getCloudVideoMap();
  if (cloudMap[trimmed]) {
    return cloudMap[trimmed];
  }
  if (trimmed.startsWith('data:video/')) {
    return dataUrlToVideoBlobUrl(trimmed);
  }
  if (trimmed.startsWith('idb://')) {
    resolvePlayableVideoUrl(trimmed).catch(() => {});
    return '';
  }
  return trimmed;
}

/**
 * Salva um arquivo de vídeo (.mp4, .webm, .mov, .m4v) no IndexedDB local para reprodução imediata
 * E faz upload para o Supabase Storage para que funcione também no smartphone e outros dispositivos.
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

    try {
      const db = await openVideoDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(normalizedBlob, videoId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Ignora erro local de IDB (ex: modo privado do Safari no iPhone)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('aura_video_blob_ready', { detail: { idbRef, url: immediateObjUrl } })
      );
    }

    // Faz upload para nuvem (Supabase Storage) para funcionar em smartphones e outros aparelhos
    const cloudUrl = await uploadVideoBlobToCloud(normalizedBlob, videoId, mimeType);
    if (cloudUrl) {
      objectUrlCache.set(cloudUrl, immediateObjUrl);
      saveCloudVideoMapping(idbRef, cloudUrl);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('aura_video_blob_ready', { detail: { idbRef: cloudUrl, url: immediateObjUrl } })
        );
      }
      return cloudUrl;
    }

    return idbRef;
  } catch (err) {
    console.error('Erro ao salvar vídeo, usando DataURL fallback:', err);
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
  if (!trimmed || trimmed.includes('assets.mixkit.co')) return '';

  if (objectUrlCache.has(trimmed)) {
    return objectUrlCache.get(trimmed)!;
  }

  const cloudMap = getCloudVideoMap();
  if (cloudMap[trimmed]) {
    return cloudMap[trimmed];
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
        window.dispatchEvent(
          new CustomEvent('aura_video_blob_ready', { detail: { idbRef: trimmed, url: objUrl } })
        );
      }

      // Sincroniza em background com o Supabase Storage caso ainda seja apenas local (idb://)
      uploadVideoBlobToCloud(playableBlob, videoId, playableBlob.type || 'video/mp4')
        .then((cloudUrl) => {
          if (cloudUrl) {
            objectUrlCache.set(cloudUrl, objUrl);
            saveCloudVideoMapping(trimmed, cloudUrl);
            migrateIdbReferencesToCloudUrl(trimmed, cloudUrl);
          }
        })
        .catch(() => {});

      return objUrl;
    }
  } catch (err) {
    console.error('Erro ao carregar vídeo do IndexedDB:', err);
  }
  return '';
}

function migrateIdbReferencesToCloudUrl(idbRef: string, cloudUrl: string): void {
  try {
    const cfg = getFloatingVideoConfig();
    let cfgChanged = false;
    const updatedItems = (cfg.items || []).map((item) => {
      if (item.videoUrl === idbRef) {
        cfgChanged = true;
        return { ...item, videoUrl: cloudUrl };
      }
      return item;
    });
    if (cfgChanged) {
      saveFloatingVideoConfig({ ...cfg, items: updatedItems });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('aura_video_cloud_migrated', { detail: { idbRef, cloudUrl } })
      );
    }
  } catch {}
}

/**
 * Pré-carrega na memória todos os vídeos salvos no IndexedDB ao iniciar a aplicação
 * e migra vídeos locais (idb://) para o Supabase Storage para que funcionem no smartphone
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
      .flatMap((p) => (Array.isArray(p.images) ? p.images : []))
      .filter((img) => Boolean(img) && !img.startsWith('idb://') && !img.startsWith('data:video/'))
      .slice(0, 8) || [
      '/images/macaco-bless.png',
      '/images/look-3214.png',
      '/images/look-3656.png',
      '/images/look-3103.png',
    ];

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
        videoUrl: '',
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
          const cloudMap = getCloudVideoMap();
          const sanitizedItems = parsed.items.map((it: FloatingVideoItem) => {
            let vUrl = it.videoUrl || '';
            if (vUrl.includes('assets.mixkit.co')) {
              vUrl = '';
            } else if (vUrl.startsWith('idb://') && cloudMap[vUrl]) {
              vUrl = cloudMap[vUrl];
            }
            return {
              ...it,
              videoUrl: vUrl,
            };
          });
          return {
            ...getDefaultFloatingVideoConfig(),
            ...parsed,
            items: sanitizedItems,
          };
        }
      }
    }
  } catch (err) {
    console.error('Erro ao ler configuração do mini-vídeo flutuante:', err);
  }
  return getDefaultFloatingVideoConfig();
}

export function syncFloatingVideoConfigFromCloud(cloudConfig?: FloatingVideoConfig): void {
  if (!cloudConfig || typeof cloudConfig !== 'object' || !Array.isArray(cloudConfig.items)) return;
  try {
    if (typeof window !== 'undefined') {
      const currentRaw = localStorage.getItem(FLOATING_VIDEO_STORAGE_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : null;
      // Atualiza se não houver configuração local customizada ou se a nuvem tiver vídeo HTTPS válido
      const cloudHasHttpVideo = cloudConfig.items.some(
        (i) => i.videoUrl && i.videoUrl.startsWith('http') && !i.videoUrl.includes('assets.mixkit.co')
      );
      const localHasOnlyDefault =
        !current ||
        !Array.isArray(current.items) ||
        current.items.every(
          (i: FloatingVideoItem) =>
            !i.videoUrl || i.videoUrl.includes('assets.mixkit.co') || i.id === 'fvid-default-1'
        );

      if (cloudHasHttpVideo || localHasOnlyDefault) {
        localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(cloudConfig));
        window.dispatchEvent(
          new CustomEvent('aura_floating_video_updated', { detail: cloudConfig })
        );
      }
    }
  } catch {}
}

export function saveFloatingVideoConfig(config: FloatingVideoConfig): FloatingVideoConfig {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(config));
      window.dispatchEvent(
        new CustomEvent('aura_floating_video_updated', { detail: config })
      );

      // Sincroniza com o Supabase (store_settings.seo.floatingVideoConfig) para funcionar no Smartphone
      fetch('/api/sync-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_store_extra',
          payload: { seoPatch: { floatingVideoConfig: config } },
        }),
      }).catch(() => {});
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
