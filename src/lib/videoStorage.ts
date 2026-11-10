import { FloatingVideoConfig, FloatingVideoItem } from '../types';
import { getProducts } from './dataClient';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const FLOATING_VIDEO_STORAGE_KEY = 'aura_floating_video_config_v1';
const CLOUD_VIDEO_MAP_KEY = 'aura_cloud_video_map_v1';
const IDB_NAME = 'aura_video_storage_db';
const IDB_STORE = 'videos';
const IDB_CONFIG_STORE = 'video_config';

function openVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
      if (!db.objectStoreNames.contains(IDB_CONFIG_STORE)) {
        db.createObjectStore(IDB_CONFIG_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoConfigToIdb(config: FloatingVideoConfig): Promise<void> {
  try {
    const db = await openVideoDb();
    if (!db.objectStoreNames.contains(IDB_CONFIG_STORE)) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_CONFIG_STORE, 'readwrite');
      const store = tx.objectStore(IDB_CONFIG_STORE);
      store.put(config, 'current_config');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Erro ao salvar video config no IndexedDB:', err);
  }
}

export async function loadVideoConfigFromIdb(): Promise<FloatingVideoConfig | null> {
  try {
    const db = await openVideoDb();
    if (!db.objectStoreNames.contains(IDB_CONFIG_STORE)) return null;
    return await new Promise<FloatingVideoConfig | null>((resolve) => {
      const tx = db.transaction(IDB_CONFIG_STORE, 'readonly');
      const store = tx.objectStore(IDB_CONFIG_STORE);
      const req = store.get('current_config');
      req.onsuccess = () => resolve((req.result as FloatingVideoConfig) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
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
    // 1. Restaura configuração persistida no IndexedDB caso localStorage esteja vazio ou com menos itens
    const idbConfig = await loadVideoConfigFromIdb();
    if (idbConfig && Array.isArray(idbConfig.items) && idbConfig.items.length > 0) {
      const localRaw = typeof window !== 'undefined' ? localStorage.getItem(FLOATING_VIDEO_STORAGE_KEY) : null;
      const local = localRaw ? JSON.parse(localRaw) : null;
      if (!local || !Array.isArray(local.items) || local.items.length < idbConfig.items.length) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(idbConfig));
          window.dispatchEvent(
            new CustomEvent('aura_floating_video_updated', { detail: idbConfig })
          );
        }
      }
    }

    const db = await openVideoDb();
    if (db.objectStoreNames.contains(IDB_STORE)) {
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

function cleanConfigForStorage(config: FloatingVideoConfig): FloatingVideoConfig {
  return {
    ...config,
    items: (config.items || []).map((item) => {
      // Garante que fallbackImages contenha apenas URLs leves e nunca fotos base64 gigantes que excedem os 5MB do localStorage
      const cleanFallback = (item.fallbackImages || [])
        .filter((img) => typeof img === 'string' && !img.startsWith('data:image/') && img.length < 2000)
        .slice(0, 2);
      return {
        ...item,
        fallbackImages: cleanFallback.length > 0 ? cleanFallback : ['/images/macaco-bless.png'],
      };
    }),
  };
}

export function syncFloatingVideoConfigFromCloud(cloudConfig?: FloatingVideoConfig): void {
  if (!cloudConfig || typeof cloudConfig !== 'object' || !Array.isArray(cloudConfig.items)) return;
  try {
    if (typeof window !== 'undefined') {
      const currentRaw = localStorage.getItem(FLOATING_VIDEO_STORAGE_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : null;

      // Mescla itens da nuvem com os itens locais preservando todos os vídeos adicionados
      const mergedItemsMap = new Map<string, FloatingVideoItem>();

      // 1. Carrega itens atuais do navegador
      if (current && Array.isArray(current.items)) {
        current.items.forEach((it: FloatingVideoItem) => {
          if (it && it.id) mergedItemsMap.set(it.id, it);
        });
      }

      // 2. Mescla com itens da nuvem sem sobrescrever edições locais recentes
      cloudConfig.items.forEach((cloudIt: FloatingVideoItem) => {
        if (cloudIt && cloudIt.id) {
          const localIt = mergedItemsMap.get(cloudIt.id);
          if (localIt) {
            const preferCloudUrl =
              cloudIt.videoUrl &&
              cloudIt.videoUrl.startsWith('http') &&
              !cloudIt.videoUrl.includes('assets.mixkit.co');
            mergedItemsMap.set(cloudIt.id, {
              ...cloudIt,
              ...localIt,
              videoUrl: preferCloudUrl ? cloudIt.videoUrl : (localIt.videoUrl || cloudIt.videoUrl),
            });
          } else {
            mergedItemsMap.set(cloudIt.id, cloudIt);
          }
        }
      });

      // Se houver qualquer vídeo real cadastrado, remove o placeholder inicial vazio (fvid-default-1)
      let mergedItems = Array.from(mergedItemsMap.values());
      const hasRealVideo = mergedItems.some(
        (it) => it.id !== 'fvid-default-1' && Boolean(it.videoUrl && it.videoUrl.trim())
      );
      if (hasRealVideo) {
        mergedItems = mergedItems.filter(
          (it) => it.id !== 'fvid-default-1' || Boolean(it.videoUrl && it.videoUrl.trim())
        );
      }

      const updatedConfig: FloatingVideoConfig = {
        ...getDefaultFloatingVideoConfig(),
        ...cloudConfig,
        ...(current || {}),
        items: mergedItems.length > 0 ? mergedItems : cloudConfig.items,
      };

      const cleanConfig = cleanConfigForStorage(updatedConfig);
      try {
        localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(cleanConfig));
      } catch {}
      saveVideoConfigToIdb(cleanConfig);
      window.dispatchEvent(
        new CustomEvent('aura_floating_video_updated', { detail: cleanConfig })
      );
    }
  } catch (err) {
    console.warn('Erro ao mesclar configuração do mini-vídeo com a nuvem:', err);
  }
}

export function saveFloatingVideoConfig(config: FloatingVideoConfig): FloatingVideoConfig {
  const cleanConfig = cleanConfigForStorage(config);

  try {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(cleanConfig));
      } catch (storageErr) {
        console.warn('LocalStorage cheio, liberando caches auxiliares para salvar mini-vídeo:', storageErr);
        try {
          localStorage.removeItem('aura_updated_products_v1');
          localStorage.setItem(FLOATING_VIDEO_STORAGE_KEY, JSON.stringify(cleanConfig));
        } catch {}
      }

      // Salva de forma garantida no IndexedDB (onde não há limite de 5MB)
      saveVideoConfigToIdb(cleanConfig);

      // Dispara evento imediato para atualizar a UI em tempo real
      window.dispatchEvent(
        new CustomEvent('aura_floating_video_updated', { detail: cleanConfig })
      );

      // Sincroniza diretamente com o Supabase (store_settings.seo.floatingVideoConfig)
      if (isSupabaseConfigured()) {
        (async () => {
          try {
            const { data } = await supabase
              .from('store_settings')
              .select('seo')
              .eq('id', 'default')
              .maybeSingle();
            const currentSeo =
              data?.seo && typeof data.seo === 'object' ? data.seo : {};
            const updatedSeo = {
              ...currentSeo,
              floatingVideoConfig: cleanConfig,
              updatedAt: new Date().toISOString(),
            };
            await supabase
              .from('store_settings')
              .update({ seo: updatedSeo, updated_at: new Date().toISOString() })
              .eq('id', 'default');
          } catch {}
        })();
      }

      // E tenta também o endpoint serverless /api/sync-store
      fetch('/api/sync-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_store_extra',
          payload: { seoPatch: { floatingVideoConfig: cleanConfig } },
        }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Erro ao salvar configuração do mini-vídeo flutuante:', err);
  }
  return cleanConfig;
}

export function saveFloatingVideoItem(item: Partial<FloatingVideoItem>): FloatingVideoConfig {
  const current = getFloatingVideoConfig();
  let items = [...current.items];

  // Se a lista só possui o placeholder inicial sem vídeo, substitui diretamente pelo novo vídeo do usuário
  if (
    items.length === 1 &&
    items[0].id === 'fvid-default-1' &&
    (!items[0].videoUrl || !items[0].videoUrl.trim()) &&
    !item.id
  ) {
    items = [];
  }

  // Limpa fallbackImages para conter apenas referências seguras
  const cleanFallback = (item.fallbackImages || [])
    .filter((img) => typeof img === 'string' && !img.startsWith('data:') && img.length < 2000)
    .slice(0, 2);
  const safeFallback = cleanFallback.length > 0 ? cleanFallback : ['/images/macaco-bless.png'];

  if (item.id) {
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        ...item,
        fallbackImages: safeFallback,
      } as FloatingVideoItem;
    } else {
      items.push({
        id: item.id,
        title: item.title || 'Vídeo Destaque Aura',
        videoUrl: item.videoUrl || '',
        fallbackImages: safeFallback,
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
      fallbackImages: safeFallback,
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
