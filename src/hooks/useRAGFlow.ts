// ─── RAGFlow OCR/document pipeline ───────────────────────────────────────────
// Supports: JPEG, PNG, WEBP, PDF

const RAGFLOW_BASE = 'https://a1-ragflow1.alem.ai';
const RAGFLOW_KEY  = process.env.RAGFLOW_API_KEY ?? '';

async function rfFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${RAGFLOW_BASE}${path}`, {
    ...opts,
    headers: { 'Authorization': `Bearer ${RAGFLOW_KEY}`, ...opts.headers },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`RAGFlow ${res.status} ${path}: ${txt}`);
  }
  return res.json();
}

async function createDataset(name: string): Promise<string> {
  const data = await rfFetch('/api/v1/datasets', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      chunk_method:  'naive',
      parser_config: { layout_recognize: 'DeepDOC' },
    }),
  });
  return data.data.id as string;
}

async function uploadDocument(datasetId: string, file: File): Promise<string> {
  const form = new FormData();
  // Keep original filename with correct extension for RAGFlow to determine parser
  form.append('file', file, file.name);
  const res = await fetch(`${RAGFLOW_BASE}/api/v1/datasets/${datasetId}/documents`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${RAGFLOW_KEY}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  const data = await res.json();
  return (data.data?.[0]?.id ?? data.data?.id) as string;
}

async function startParsing(datasetId: string, docId: string): Promise<void> {
  await rfFetch(`/api/v1/datasets/${datasetId}/documents/run`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_ids: [docId], run: 1 }),
  });
}

async function waitForParsing(
  datasetId: string, docId: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const TIMEOUT = 90; // seconds — PDF may take longer than image
  for (let i = 0; i < TIMEOUT; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const data = await rfFetch(`/api/v1/datasets/${datasetId}/documents?id=${docId}`);
    const doc  = data.data?.docs?.[0] ?? data.data?.[0];
    if (!doc) continue;
    const progress = doc.progress ?? 0;
    onProgress?.(Math.round(progress * 100));
    if (doc.run === '3' || doc.status === 'available' || progress >= 1) return;
    if (doc.run === '2' || doc.status === 'fail') throw new Error('Parsing failed — try a clearer scan');
  }
  throw new Error('Parsing timeout — try a clearer scan or smaller file');
}

async function getChunks(datasetId: string): Promise<string> {
  const data  = await rfFetch(`/api/v1/datasets/${datasetId}/chunks?page=1&size=100`);
  const chunks = (data.data?.chunks ?? data.data ?? []) as { content: string }[];
  return chunks.map(c => c.content).join('\n\n').trim();
}

async function deleteDataset(datasetId: string): Promise<void> {
  await rfFetch('/api/v1/datasets', {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [datasetId] }),
  }).catch(() => {/* best-effort */});
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function extractTextFromFile(
  file: File,
  onStep?: (step: string, pct?: number) => void,
): Promise<string> {
  const name = `gradeai_${Date.now()}`;
  let datasetId = '';
  try {
    onStep?.('Создаю рабочее пространство в RAGFlow...');
    datasetId = await createDataset(name);

    const isPdf = file.type === 'application/pdf';
    onStep?.(isPdf ? 'Загружаю PDF документ...' : 'Загружаю изображение...');
    const docId = await uploadDocument(datasetId, file);

    onStep?.('Запускаю распознавание текста...');
    await startParsing(datasetId, docId);

    onStep?.(isPdf ? 'RAGFlow читает PDF (OCR)...' : 'RAGFlow читает текст с фото...', 0);
    await waitForParsing(datasetId, docId, pct => {
      onStep?.(isPdf ? `OCR PDF: ${pct}%` : `OCR: ${pct}%`, pct);
    });

    onStep?.('Извлекаю результат...');
    const text = await getChunks(datasetId);
    if (!text.trim()) throw new Error('OCR не извлёк текст. Попробуйте более чёткий скан.');
    return text;
  } finally {
    if (datasetId) deleteDataset(datasetId);
  }
}
