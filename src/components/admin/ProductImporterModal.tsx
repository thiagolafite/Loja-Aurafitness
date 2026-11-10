import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FolderPlus,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  Layers,
  DollarSign,
  Boxes,
  Sparkles,
  Palette,
  Trash2,
  Tag,
  Loader2,
  ImageIcon,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bulkImportProductsAsync, getProducts } from '../../lib/dataClient';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import {
  classifyProduct,
  parseProductFromFolderOrFile,
  cleanModelName,
  normalizeText,
  resizeImageFile,
  STORE_CATEGORIES,
  STORE_COLORS,
  getStoredCategories,
  AvailableCategory,
  isFileAlreadyImported,
  getImportedFilesRegistry,
  registerImportedFiles,
  generateFileSignature,
  ImportedFileRecord,
} from '../../lib/productClassifier';

interface ProductImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedCSVRow {
  sku: string;
  name: string;
  category: string;
  isSet: boolean;
  detectedColors: { name: string; hex: string }[];
  price: number;
  promotionalPrice?: number;
  stock_P: number;
  stock_M: number;
  stock_G: number;
  stock_GG: number;
  description: string;
  isExisting: boolean;
  existingId?: string;
}

interface GroupedProductItem {
  id?: string;
  groupKey: string;
  name: string;
  category: string;
  price: number;
  promotionalPrice?: number;
  size?: string;
  colors: { name: string; hex: string }[];
  isSet: boolean;
  images: string[];
  isExisting?: boolean;
  existingSku?: string;
  newImagesCount?: number;
}

export const ProductImporterModal: React.FC<ProductImporterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'images'>('csv');

  // CSV State
  const [csvText, setCsvText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [csvError, setCsvError] = useState<string>('');

  // Categories
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());

  // Image Import State
  const [selectedDefaultCategory, setSelectedDefaultCategory] = useState<string>(
    () => getStoredCategories()[0]?.name || 'Conjuntos'
  );

  useEffect(() => {
    const syncCats = () => {
      const latest = getStoredCategories();
      setCategories(latest);
      setSelectedDefaultCategory((prev) =>
        latest.some((c) => c.name.toLowerCase() === prev.toLowerCase())
          ? prev
          : latest[0]?.name || 'Conjuntos'
      );
    };
    syncCats();
    window.addEventListener('aura_categories_updated', syncCats);
    window.addEventListener('storage', syncCats);
    return () => {
      window.removeEventListener('aura_categories_updated', syncCats);
      window.removeEventListener('storage', syncCats);
    };
  }, [isOpen]);

  const [groupedProducts, setGroupedProducts] = useState<GroupedProductItem[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Deduplication & Smart Batch State
  const [ignoreAlreadyImported, setIgnoreAlreadyImported] = useState<boolean>(true);
  const [mergeIntoExistingCatalog, setMergeIntoExistingCatalog] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<{
    totalScanned: number;
    alreadyImported: number;
    newFiles: number;
    existingProductsUpdated: number;
    newProductsCreated: number;
  } | null>(null);
  const [allAlreadyImported, setAllAlreadyImported] = useState<boolean>(false);
  const [filesToRegisterOnSave, setFilesToRegisterOnSave] = useState<ImportedFileRecord[]>([]);
  const [lastSelectedFiles, setLastSelectedFiles] = useState<File[]>([]);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateHeader =
      'SKU;Nome;Categoria;Preco;PrecoPromocional;Estoque_P;Estoque_M;Estoque_G;Estoque_GG;Descricao\n';
    const sampleRow1 =
      'AUR-LEG-101;Legging High Waist Olive;Leggings;189.90;159.90;10;15;12;5;Legging de alta compressao e cos anatomicamnete ajustado.\n';
    const sampleRow2 =
      'AUR-TOP-102;Top Cross Back Black;Tops;129.90;99.90;8;14;10;4;Top esportivo com sustentacao firme e alcas cruzadas.\n';
    const sampleRow3 =
      'AUR-CNJ-103;Conjunto Style Olive;Conjuntos;299.90;249.90;5;12;8;2;Conjunto completo top e legging tom verde oliva.\n';

    const blob = new Blob([templateHeader + sampleRow1 + sampleRow2 + sampleRow3], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_aura_fitness.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV Text
  const parseCSVContent = (content: string) => {
    setCsvError('');
    if (!content.trim()) {
      setParsedRows([]);
      return;
    }

    const existingProducts = getProducts();
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setCsvError('O arquivo CSV deve conter um cabeçalho e pelo menos 1 linha de dados.');
      setParsedRows([]);
      return;
    }

    // Auto detect separator (, or ;)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    const rows: ParsedCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 3) continue;

      const sku = cols[0] || `SKU-IMP-${Date.now()}-${i}`;
      const name = cols[1] || `Produto Importado ${i}`;
      const description = cols[9] || '';

      // Análise Inteligente de Padrões pelo Nome/Descrição
      const classification = classifyProduct(name, description);
      const categoryFromCsv = cols[2]?.trim();
      const category =
        categoryFromCsv && categoryFromCsv !== '' && categoryFromCsv !== 'Geral'
          ? categoryFromCsv
          : classification.category;

      const price = parseFloat(cols[3]?.replace(',', '.')) || 0;
      const promotionalPrice = cols[4] ? parseFloat(cols[4].replace(',', '.')) : undefined;

      const stock_P = parseInt(cols[5]) || 0;
      const stock_M = parseInt(cols[6]) || 0;
      const stock_G = parseInt(cols[7]) || 0;
      const stock_GG = parseInt(cols[8]) || 0;

      const match = existingProducts.find(
        (p) =>
          p.sku.toLowerCase() === sku.toLowerCase() ||
          p.name.toLowerCase() === name.toLowerCase()
      );

      rows.push({
        sku,
        name,
        category,
        isSet: classification.isSet,
        detectedColors: classification.colors,
        price,
        promotionalPrice: promotionalPrice && promotionalPrice > 0 ? promotionalPrice : undefined,
        stock_P,
        stock_M,
        stock_G,
        stock_GG,
        description,
        isExisting: !!match,
        existingId: match?.id,
      });
    }

    if (rows.length === 0) {
      setCsvError('Não foi possível identificar linhas válidas no CSV.');
    } else {
      setParsedRows(rows);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSVContent(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleProcessCSVImport = async () => {
    if (parsedRows.length === 0) return;
    setIsSaving(true);

    try {
      const productsToSave: Partial<Product>[] = parsedRows.map((row) => {
        const primaryColorName = row.detectedColors[0]?.name || 'Padrao';
        const stockMap: Record<string, number> = {
          [`P-${primaryColorName}`]: row.stock_P || 5,
          [`M-${primaryColorName}`]: row.stock_M || 10,
          [`G-${primaryColorName}`]: row.stock_G || 8,
          [`GG-${primaryColorName}`]: row.stock_GG || 3,
        };

        return {
          id: row.existingId,
          sku: row.sku,
          name: row.name,
          category: row.category,
          colors: row.detectedColors,
          price: row.price,
          promotionalPrice: row.promotionalPrice,
          stock: stockMap,
          description: row.description || `Produto oficial Aura Fitness da categoria ${row.category}.`,
        };
      });

      await bulkImportProductsAsync(productsToSave);
      setIsSuccess(true);
      setSuccessMessage(`${productsToSave.length} produtos/preços/estoques sincronizados com sucesso!`);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Image Processing & Compression Handler (Folder or Multiple Files)
  const processImageFiles = async (
    files: FileList | File[] | null,
    forceReimport = false,
    forceNewProduct = false
  ) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setLastSelectedFiles(imageFiles);
    setIsProcessingImages(true);
    setAllAlreadyImported(false);
    setIsSuccess(false);
    setProcessingProgress({ current: 0, total: imageFiles.length });

    const registry = getImportedFilesRegistry();
    const existingStoreProducts = getProducts();
    const activeCats = getStoredCategories();
    const validDefaultCat =
      activeCats.find((c) => c.name.toLowerCase() === selectedDefaultCategory.toLowerCase())
        ?.name ||
      activeCats[0]?.name ||
      'Conjuntos';

    // 1. Identificação precisa de imagens novas vs imagens já importadas (validando se o produto ainda existe na loja)
    const existingFiles: File[] = [];
    const newFiles: File[] = [];

    for (const f of imageFiles) {
      const already = isFileAlreadyImported(f, registry, existingStoreProducts);
      if (already) {
        existingFiles.push(f);
      } else {
        newFiles.push(f);
      }
    }

    const shouldIgnore = ignoreAlreadyImported && !forceReimport;
    const filesToProcess = shouldIgnore ? newFiles : imageFiles;

    setImportStats({
      totalScanned: imageFiles.length,
      alreadyImported: shouldIgnore ? existingFiles.length : 0,
      newFiles: filesToProcess.length,
      existingProductsUpdated: 0,
      newProductsCreated: 0,
    });

    if (shouldIgnore && newFiles.length === 0 && existingFiles.length > 0) {
      setAllAlreadyImported(true);
      setIsProcessingImages(false);
      return;
    }

    // Mapa para agrupar produtos pelo padrão do modelo dentro do lote atual
    const productMap = new Map<string, GroupedProductItem>();
    const recordsToRegister: ImportedFileRecord[] = [];
    const shouldMergeExisting = mergeIntoExistingCatalog && !forceNewProduct;

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setProcessingProgress({ current: i + 1, total: filesToProcess.length });

      try {
        const compressedDataUrl = await resizeImageFile(file, 900, 900, 0.78);
        if (!compressedDataUrl) continue;

        const relPath = file.webkitRelativePath || file.name;
        const parsed = parseProductFromFolderOrFile(relPath, file.name, validDefaultCat);
        const validCategory =
          activeCats.find((c) => c.name.toLowerCase() === parsed.category.toLowerCase())?.name ||
          validDefaultCat;

        // Só mescla em produto existente se a opção de mesclagem estiver ativa
        const storeMatch = shouldMergeExisting
          ? existingStoreProducts.find((p) => {
              const matchKey = cleanModelName(p.name).groupKey;
              return matchKey === parsed.groupKey || normalizeText(p.name) === parsed.groupKey;
            })
          : undefined;

        const sig = generateFileSignature(file);
        recordsToRegister.push({
          signature: sig,
          fileName: file.name,
          fileSize: file.size,
          lastModified: file.lastModified,
          groupKey: parsed.groupKey,
          targetProductId: storeMatch?.id,
          targetProductName: storeMatch?.name || parsed.productName,
          importedAt: new Date().toISOString(),
        });

        if (productMap.has(parsed.groupKey)) {
          const existing = productMap.get(parsed.groupKey)!;
          if (!existing.images.includes(compressedDataUrl)) {
            existing.images.push(compressedDataUrl);
            existing.newImagesCount = (existing.newImagesCount || 0) + 1;
          }
          if (!existing.size && parsed.size) existing.size = parsed.size;
          parsed.colors.forEach((col) => {
            if (!existing.colors.some((c) => c.name.toLowerCase() === col.name.toLowerCase())) {
              existing.colors.push(col);
            }
          });
        } else {
          const initialImages = storeMatch ? [...(storeMatch.images || [])] : [];
          let isNewImg = true;
          if (initialImages.includes(compressedDataUrl)) {
            isNewImg = false;
          } else {
            initialImages.push(compressedDataUrl);
          }

          productMap.set(parsed.groupKey, {
            id: storeMatch?.id,
            groupKey: parsed.groupKey,
            name: storeMatch ? storeMatch.name : parsed.productName,
            category: storeMatch ? storeMatch.category : validCategory,
            price: storeMatch ? storeMatch.price : parsed.price,
            promotionalPrice: storeMatch?.promotionalPrice,
            size: parsed.size || storeMatch?.sizes?.[0],
            colors:
              storeMatch && storeMatch.colors && storeMatch.colors.length > 0
                ? storeMatch.colors
                : parsed.colors,
            isSet: parsed.isSet,
            images: initialImages,
            isExisting: !!storeMatch,
            existingSku: storeMatch?.sku,
            newImagesCount: isNewImg ? 1 : 0,
          });
        }
      } catch (err) {
        console.error('Erro ao processar imagem:', file.name, err);
      }
    }

    setFilesToRegisterOnSave(recordsToRegister);
    const resultList = Array.from(productMap.values());
    setGroupedProducts(resultList);

    const existingCount = resultList.filter((p) => p.isExisting).length;
    const newCount = resultList.filter((p) => !p.isExisting).length;
    setImportStats((prev) =>
      prev
        ? {
            ...prev,
            existingProductsUpdated: existingCount,
            newProductsCreated: newCount,
          }
        : null
    );

    setIsProcessingImages(false);
  };

  const handleForceReimportAll = () => {
    if (lastSelectedFiles.length === 0) return;
    processImageFiles(lastSelectedFiles, true, true);
  };

  const handleUpdateGroupedProduct = (index: number, updates: Partial<GroupedProductItem>) => {
    setGroupedProducts((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const nextItem = { ...current, ...updates };
      // Se o administrador alterou o nome manualmente, garante que seja salvo como o produto desejado
      if (updates.name !== undefined && updates.name.trim() !== current.name.trim() && current.isExisting) {
        nextItem.id = undefined;
        nextItem.isExisting = false;
        nextItem.existingSku = undefined;
      }
      copy[index] = nextItem;
      return copy;
    });
  };

  const handleRemoveGroupedProduct = (index: number) => {
    setGroupedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessGroupedProductsImport = async () => {
    if (groupedProducts.length === 0) return;
    setIsSaving(true);

    try {
      const productsToCreate: Partial<Product>[] = groupedProducts.map((g, idx) => {
        const primaryColorName = g.colors[0]?.name || 'Preto';
        const defaultSizes = g.size
          ? [g.size, 'P', 'M', 'G'].filter((v, i, a) => a.indexOf(v) === i)
          : ['P', 'M', 'G'];

        const stockMap: Record<string, number> = {};
        defaultSizes.forEach((s) => {
          stockMap[`${s}-${primaryColorName}`] = g.size && s === g.size ? 10 : 8;
        });

        return {
          id: g.id, // Se o produto já existe, preserva ID para atualização direta sem duplicar!
          name: g.name,
          category: g.category,
          colors: g.colors,
          images: g.images,
          price: g.price,
          promotionalPrice: g.promotionalPrice,
          sizes: defaultSizes,
          stock: stockMap,
          description: `Peça oficial Aura Fitness da categoria ${g.category}. Tecido de alta compressão, toque aveludado e zero transparência.`,
          sku: g.existingSku || `AUR-${g.category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${idx + 1}`,
        };
      });

      await bulkImportProductsAsync(productsToCreate);

      // Registra os arquivos importados no histórico de assinaturas
      if (filesToRegisterOnSave.length > 0) {
        registerImportedFiles(filesToRegisterOnSave);
      }

      setIsSuccess(true);
      const updatedCount = groupedProducts.filter((p) => p.isExisting).length;
      const createdCount = groupedProducts.filter((p) => !p.isExisting).length;

      let msg = '';
      if (createdCount > 0 && updatedCount > 0) {
        msg = `✓ ${createdCount} novo(s) modelo(s) cadastrado(s) e ${updatedCount} produto(s) existente(s) atualizados com novas fotos!`;
      } else if (createdCount > 0) {
        msg = `✓ ${createdCount} novo(s) produto(s) cadastrado(s) com sucesso na sua loja!`;
      } else {
        msg = `✓ ${updatedCount} produto(s) existente(s) atualizado(s) com as novas fotos no carrossel!`;
      }

      setSuccessMessage(msg);
      setGroupedProducts([]);
      setFilesToRegisterOnSave([]);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-card text-card-foreground border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#1c3022] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg">Central de Importação em Massa</h3>
                <p className="text-xs text-white/70">
                  Importe produtos por pasta, fotos do WhatsApp/câmera ou tabela CSV com categorização inteligente por IA.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-muted/40">
            <button
              onClick={() => {
                setActiveTab('csv');
                setIsSuccess(false);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'csv'
                  ? 'border-primary text-primary bg-card'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>1. Tabela CSV (Preços & Estoque)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('images');
                setIsSuccess(false);
              }}
              className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'images'
                  ? 'border-primary text-primary bg-card'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>2. Importar Pastas & Fotos (Agrupamento Automático)</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {isSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div className="text-xs font-semibold">{successMessage}</div>
              </div>
            )}

            {activeTab === 'csv' && (
              <div className="space-y-6">
                {/* Download Template Banner */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Modelo Oficial CSV / Excel</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Baixe o modelo pré-formatado com SKU, Preço De/Por, Categoria e Estoque.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Planilha Modelo</span>
                  </button>
                </div>

                {/* File Upload / Drag & Drop */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Carregar Arquivo CSV ou Colar Texto
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                    />
                  </div>

                  <textarea
                    rows={4}
                    value={csvText}
                    onChange={(e) => {
                      setCsvText(e.target.value);
                      parseCSVContent(e.target.value);
                    }}
                    placeholder="Cole aqui o conteúdo CSV (separado por ';' ou ',')..."
                    className="w-full text-xs font-mono p-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {csvError && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{csvError}</span>
                  </div>
                )}

                {/* Parsed Preview Table */}
                {parsedRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>Pré-visualização dos Produtos ({parsedRows.length} itens)</span>
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {parsedRows.filter((r) => r.isExisting).length} existentes (atualização) |{' '}
                        {parsedRows.filter((r) => !r.isExisting).length} novos
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border max-h-60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted text-foreground font-semibold sticky top-0">
                          <tr>
                            <th className="p-2.5 border-b">Status</th>
                            <th className="p-2.5 border-b">SKU</th>
                            <th className="p-2.5 border-b">Nome</th>
                            <th className="p-2.5 border-b">Categoria & Cores (Padrão IA)</th>
                            <th className="p-2.5 border-b">Preço De</th>
                            <th className="p-2.5 border-b">Preço Por</th>
                            <th className="p-2.5 border-b">Estoque (P/M/G/GG)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-muted/40 transition-colors">
                              <td className="p-2.5">
                                {row.isExisting ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                    Atualizar
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                    Novo
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 font-mono font-semibold">{row.sku}</td>
                              <td className="p-2.5 font-medium">{row.name}</td>
                              <td className="p-2.5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-foreground">{row.category}</span>
                                    {row.isSet && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                                        👗 Conjunto
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {row.detectedColors.map((col, cIdx) => (
                                      <span
                                        key={cIdx}
                                        className="inline-flex items-center gap-1 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded-md"
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full border border-black/20"
                                          style={{ backgroundColor: col.hex }}
                                        />
                                        <span>{col.name}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="p-2.5 font-semibold">{formatCurrency(row.price)}</td>
                              <td className="p-2.5 text-emerald-600 font-semibold">
                                {row.promotionalPrice ? formatCurrency(row.promotionalPrice) : '-'}
                              </td>
                              <td className="p-2.5 font-mono">
                                {row.stock_P} / {row.stock_M} / {row.stock_G} / {row.stock_GG}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={handleProcessCSVImport}
                      disabled={isSaving}
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Confirmar e Processar Importação de Tabela</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                <div className="bg-secondary/40 p-4 rounded-xl space-y-3 border border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">
                        Carregamento Inteligente por Pasta ou Fotos Avulsas
                      </h4>
                    </div>

                    {/* Toggles Anti-Duplicação & Modo de Inclusão */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <label className="flex items-center gap-2 cursor-pointer bg-card px-3 py-1.5 rounded-xl border border-border text-xs text-foreground font-semibold shadow-sm">
                        <input
                          type="checkbox"
                          checked={ignoreAlreadyImported}
                          onChange={(e) => setIgnoreAlreadyImported(e.target.checked)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span className="flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Evitar duplicatas já importadas</span>
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer bg-card px-3 py-1.5 rounded-xl border border-border text-xs text-foreground font-semibold shadow-sm">
                        <input
                          type="checkbox"
                          checked={mergeIntoExistingCatalog}
                          onChange={(e) => setMergeIntoExistingCatalog(e.target.checked)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span className="flex items-center gap-1 text-[11px]">
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                          <span>Mesclar em produtos existentes de mesmo nome</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você pode selecionar uma <strong>pasta inteira</strong> ou <strong>várias fotos</strong> mesmo que já as tenha selecionado antes. O sistema <strong>detecta fotos novas</strong>, <strong>evita imagens duplicadas</strong> e <strong>reconhece o padrão do modelo</strong> para agrupar todas as fotos da mesma peça no mesmo anúncio!
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Categoria Sugerida (Fallback)
                      </label>
                      <select
                        value={selectedDefaultCategory}
                        onChange={(e) => setSelectedDefaultCategory(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-input bg-card text-foreground"
                      >
                        {categories.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hidden Native File Inputs */}
                    <input
                      ref={folderInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      // @ts-ignore
                      webkitdirectory=""
                      directory=""
                      onChange={(e) => {
                        processImageFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    <input
                      ref={filesInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        processImageFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => folderInputRef.current?.click()}
                        disabled={isProcessingImages}
                        className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Selecionar Pasta</span>
                      </button>

                      <button
                        onClick={() => filesInputRef.current?.click()}
                        disabled={isProcessingImages}
                        className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 border border-border shadow-sm"
                      >
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span>Selecionar Fotos</span>
                      </button>
                    </div>
                  </div>

                  {isProcessingImages && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-700 dark:text-amber-300 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>
                        Analisando fotos, detectando novidades e agrupando modelos: {processingProgress.current} de{' '}
                        {processingProgress.total}...
                      </span>
                    </div>
                  )}
                </div>

                {/* Banner de Estatísticas de Detecção / Prevenção de Duplicatas */}
                {importStats && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm">
                          {importStats.newFiles} nova(s) foto(s) detectada(s)
                          {importStats.existingProductsUpdated > 0 && (
                            <span className="font-normal text-muted-foreground">
                              {' '}• {importStats.existingProductsUpdated} modelo(s) existente(s) serão atualizados
                            </span>
                          )}
                          {importStats.newProductsCreated > 0 && (
                            <span className="font-normal text-muted-foreground">
                              {' '}• {importStats.newProductsCreated} novo(s) modelo(s) agrupado(s)
                            </span>
                          )}
                        </h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {importStats.alreadyImported > 0 ? (
                            <>
                              <strong>{importStats.alreadyImported} foto(s)</strong> já haviam sido importadas anteriormente e foram <strong>ignoradas automaticamente</strong> para não duplicar anúncios nem fotos repetidas no carrossel.
                            </>
                          ) : (
                            'Todas as fotos selecionadas estão prontas para importação sem duplicatas.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aviso quando TODAS as fotos da pasta já foram importadas */}
                {allAlreadyImported && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 text-center space-y-2 text-blue-900 dark:text-blue-200">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-blue-600" />
                    <h4 className="font-bold text-sm">
                      Todas as {importStats?.totalScanned} fotos desta pasta já foram importadas anteriormente!
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      O sistema identificou com precisão que todas as imagens desta pasta já estão no catálogo da loja. Nenhuma duplicata foi criada.
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleForceReimportAll}
                        className="text-xs font-semibold px-4 py-2 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 border border-border"
                      >
                        Forçar reimportação de todas as fotos mesmo assim
                      </button>
                    </div>
                  </div>
                )}

                {/* Grouped Products Preview Cards */}
                {groupedProducts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>Modelos Reconhecidos ({groupedProducts.length} itens prontos)</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          (Total de {groupedProducts.reduce((acc, p) => acc + p.images.length, 0)} fotos agrupadas)
                        </span>
                      </h4>
                      <button
                        onClick={() => setGroupedProducts([])}
                        className="text-xs text-destructive hover:underline font-semibold"
                      >
                        Limpar Lista
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {groupedProducts.map((prod, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          {/* Image Thumbnail & Counter */}
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                              {prod.images.length > 1 && (
                                <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-tl-md">
                                  +{prod.images.length - 1}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              {/* Status Badge */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {prod.isExisting ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                      <RefreshCw className="w-3 h-3" />
                                      <span>Atualizar no Catálogo (+{prod.newImagesCount || 0} novas fotos)</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateGroupedProduct(idx, {
                                          id: undefined,
                                          isExisting: false,
                                          existingSku: undefined,
                                        })
                                      }
                                      className="text-[10px] font-bold text-emerald-600 hover:underline"
                                    >
                                      Criar como Novo Produto
                                    </button>
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Novo Produto ({prod.images.length} foto{prod.images.length > 1 ? 's' : ''})</span>
                                  </span>
                                )}
                              </div>

                              {/* Editable Name */}
                              <input
                                type="text"
                                value={prod.name}
                                onChange={(e) =>
                                  handleUpdateGroupedProduct(idx, { name: e.target.value })
                                }
                                className="font-bold text-xs bg-transparent border-b border-dashed border-border focus:border-primary focus:outline-none w-full max-w-xs text-foreground"
                                placeholder="Nome do Produto"
                              />

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {prod.size && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                    Tam: {prod.size}
                                  </span>
                                )}
                                {prod.isSet && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                                    👗 Conjunto
                                  </span>
                                )}
                                {prod.colors.map((c, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="inline-flex items-center gap-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-md"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-black/20"
                                      style={{ backgroundColor: c.hex }}
                                    />
                                    <span>{c.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Category and Price Controls */}
                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <div className="w-36">
                              <label className="text-[10px] font-bold text-muted-foreground block">
                                Categoria
                              </label>
                              <select
                                value={prod.category}
                                onChange={(e) =>
                                  handleUpdateGroupedProduct(idx, { category: e.target.value })
                                }
                                className="w-full text-xs p-1.5 rounded-lg border border-input bg-background text-foreground"
                              >
                                {categories.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-24">
                              <label className="text-[10px] font-bold text-muted-foreground block">
                                Preço (R$)
                              </label>
                              <input
                                type="number"
                                step="0.10"
                                value={prod.price}
                                onChange={(e) =>
                                  handleUpdateGroupedProduct(idx, {
                                    price: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-full text-xs p-1.5 rounded-lg border border-input bg-background font-semibold text-foreground"
                              />
                            </div>

                            <button
                              onClick={() => handleRemoveGroupedProduct(idx)}
                              className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors mt-3"
                              title="Remover este produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleProcessGroupedProductsImport}
                      disabled={isSaving}
                      className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>
                        Cadastrar / Atualizar {groupedProducts.length} Produtos no Catálogo Oficial
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
