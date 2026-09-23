import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bulkImportProducts, getProducts } from '../../lib/dataClient';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface ProductImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedCSVRow {
  sku: string;
  name: string;
  category: string;
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

interface UploadedImageItem {
  fileName: string;
  category: string;
  productName: string;
  dataUrl: string;
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

  // Image Import State
  const [selectedCategory, setSelectedCategory] = useState<string>('Leggings');
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateHeader = 'SKU;Nome;Categoria;Preco;PrecoPromocional;Estoque_P;Estoque_M;Estoque_G;Estoque_GG;Descricao\n';
    const sampleRow1 = 'AUR-LEG-101;Legging High Waist Olive;Leggings;189.90;159.90;10;15;12;5;Legging de alta compressao e cos anatomicamnete ajustado.\n';
    const sampleRow2 = 'AUR-TOP-102;Top Cross Back Black;Tops & Sports Bras;129.90;99.90;8;14;10;4;Top esportivo com sustentacao firme e alcas cruzadas.\n';
    const sampleRow3 = 'AUR-CNJ-103;Conjunto Style Olive;Conjuntos;299.90;249.90;5;12;8;2;Conjunto completo top e legging tom verde oliva.\n';

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
      const category = cols[2] || 'Leggings';
      const price = parseFloat(cols[3]?.replace(',', '.')) || 0;
      const promotionalPrice = cols[4] ? parseFloat(cols[4].replace(',', '.')) : undefined;

      const stock_P = parseInt(cols[5]) || 0;
      const stock_M = parseInt(cols[6]) || 0;
      const stock_G = parseInt(cols[7]) || 0;
      const stock_GG = parseInt(cols[8]) || 0;
      const description = cols[9] || '';

      const match = existingProducts.find(
        (p) => p.sku.toLowerCase() === sku.toLowerCase() || p.name.toLowerCase() === name.toLowerCase()
      );

      rows.push({
        sku,
        name,
        category,
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

  const handleProcessCSVImport = () => {
    if (parsedRows.length === 0) return;

    const productsToSave: Partial<Product>[] = parsedRows.map((row) => {
      const stockMap: Record<string, number> = {
        'P-Padrao': row.stock_P || 5,
        'M-Padrao': row.stock_M || 10,
        'G-Padrao': row.stock_G || 8,
        'GG-Padrao': row.stock_GG || 3,
      };

      return {
        id: row.existingId,
        sku: row.sku,
        name: row.name,
        category: row.category,
        price: row.price,
        promotionalPrice: row.promotionalPrice,
        stock: stockMap,
        description: row.description || 'Produto importado via sistema de tabela.',
      };
    });

    bulkImportProducts(productsToSave);
    setIsSuccess(true);
    setSuccessMessage(`${productsToSave.length} produtos/preços/estoques importados com sucesso!`);
    onSuccess();
  };

  // Image Folder Import Handler
  const handleImageFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: UploadedImageItem[] = [];

    let processedCount = 0;

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      // Extract folder name if available (webkitRelativePath: "Leggings/modelo_01.jpg")
      const relPath = file.webkitRelativePath || file.name;
      const pathParts = relPath.split('/');
      
      let detectedCategory = selectedCategory;
      let prodName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      if (pathParts.length > 1) {
        detectedCategory = pathParts[0]; // First folder name
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        newItems.push({
          fileName: file.name,
          category: detectedCategory,
          productName: prodName,
          dataUrl,
        });

        processedCount++;
        if (processedCount === fileList.length) {
          setUploadedImages((prev) => [...prev, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProcessImageImport = () => {
    if (uploadedImages.length === 0) return;

    // Group images by product name or category
    const productsToCreate: Partial<Product>[] = [];

    // Group by category and product name
    const grouped: Record<string, UploadedImageItem[]> = {};
    uploadedImages.forEach((img) => {
      const key = `${img.category}___${img.productName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(img);
    });

    Object.entries(grouped).forEach(([key, imgs]) => {
      const [category, prodName] = key.split('___');
      const dataUrls = imgs.map((i) => i.dataUrl);

      productsToCreate.push({
        name: prodName,
        category: category,
        images: dataUrls,
        price: 189.90,
        description: `Peça exclusiva da categoria ${category}.`,
        sku: `AUR-${category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        stock: { 'P-Padrao': 10, 'M-Padrao': 15, 'G-Padrao': 8 },
      });
    });

    bulkImportProducts(productsToCreate);
    setIsSuccess(true);
    setSuccessMessage(`${productsToCreate.length} produtos importados por categoria com imagens!`);
    setUploadedImages([]);
    onSuccess();
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
                  Importe produtos por categoria, tabela de preços, estoque e imagens.
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
              <span>2. Importar Pastas/Imagens por Categoria</span>
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
                            <th className="p-2.5 border-b">Categoria</th>
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
                              <td className="p-2.5">{row.category}</td>
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
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Processar Importação de Tabela</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-6">
                <div className="bg-secondary/50 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-primary" />
                    <span>Importar Pasta Completa com Imagens por Categoria</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Selecione uma pasta contendo subpastas com o nome das categorias (ex: Leggings/, Tops/, Conjuntos/), ou selecione várias fotos para uma categoria específica.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Categoria Padrão
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-input bg-card text-foreground"
                      >
                        <option value="Leggings">Leggings</option>
                        <option value="Tops & Sports Bras">Tops & Sports Bras</option>
                        <option value="Conjuntos">Conjuntos</option>
                        <option value="Macaquinhos">Macaquinhos</option>
                        <option value="Shorts">Shorts</option>
                        <option value="Acessórios">Acessórios</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        onChange={handleImageFolderUpload}
                        className="hidden"
                      />

                      <button
                        onClick={() => folderInputRef.current?.click()}
                        className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Selecionar Pasta com Imagens</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Uploaded Images Grid Preview */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">
                        Imagens Carregadas ({uploadedImages.length} fotos)
                      </h4>
                      <button
                        onClick={() => setUploadedImages([])}
                        className="text-xs text-destructive hover:underline font-semibold"
                      >
                        Limpar Fotos
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1">
                      {uploadedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-muted"
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.productName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px] text-white">
                            <span className="font-bold truncate">{img.productName}</span>
                            <span className="text-emerald-300">{img.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleProcessImageImport}
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Cadastrar Produtos e Imagens nas Categorias</span>
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
