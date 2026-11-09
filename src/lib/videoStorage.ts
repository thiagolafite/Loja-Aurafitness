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

/**
 * Salva um arquivo de vídeo (.mp4, .webm, .mov) no IndexedDB do navegador,
 * permitindo vídeos grandes sem limite de 5MB do localStorage.
 */
export async function saveVideoFileToStorage(file: File): Promise<string> {
  const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    const db = await openVideoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(file, videoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return `idb://${videoId}`;
  } catch (err) {
    console.error('Erro ao salvar vídeo no IndexedDB, usando DataURL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

// Cache de ObjectURLs em memória para evitar recriar blobs repetidamente
const objectUrlCache = new Map<string, string>();

/**
 * Resolve uma referência 'idb://...' para uma ObjectURL reproduzível na tag <video>
 */
export async function resolvePlayableVideoUrl(videoUrl: string): Promise<string> {
  if (!videoUrl) return '';
  if (!videoUrl.startsWith('idb://')) return videoUrl;

  if (objectUrlCache.has(videoUrl)) {
    return objectUrlCache.get(videoUrl)!;
  }

  const videoId = videoUrl.replace('idb://', '');
  try {
    const db = await openVideoDb();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(videoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob instanceof Blob) {
      const objUrl = URL.createObjectURL(blob);
      objectUrlCache.set(videoUrl, objUrl);
      return objUrl;
    }
  } catch (err) {
    console.error('Erro ao carregar vídeo do IndexedDB:', err);
  }
  return '';
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
