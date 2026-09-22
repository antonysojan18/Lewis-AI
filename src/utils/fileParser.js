// File Parser: Multi-File, PDF, CSV, and Code Extractor

export async function parseUploadedFiles(files) {
  const parsedFiles = [];

  for (const file of files) {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let content = '';
      let type = 'text';

      if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'sql', 'cpp', 'c', 'rs', 'go', 'java', 'php', 'rb', 'sh', 'md', 'txt', 'xml', 'yaml', 'yml'].includes(ext)) {
        content = await readFileAsText(file);
        type = 'code';
      } else if (ext === 'csv') {
        const rawCsv = await readFileAsText(file);
        content = formatCsvSummary(rawCsv);
        type = 'dataset';
      } else if (file.type.startsWith('text/')) {
        content = await readFileAsText(file);
        type = 'text';
      } else {
        // Binary / PDF fallback representation with metadata
        content = `[Attached Document: ${file.name} | Size: ${(file.size / 1024).toFixed(1)} KB | Type: ${file.type || ext.toUpperCase()}]`;
        type = 'document';
      }

      parsedFiles.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: type,
        rawSize: file.size,
        content: content,
      });
    } catch (err) {
      console.warn(`Error reading file ${file.name}:`, err);
    }
  }

  return parsedFiles;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || '');
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

function formatCsvSummary(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return csvText;

  const header = lines[0];
  const totalRows = lines.length - 1;
  const sampleRows = lines.slice(1, 6).join('\n');

  return `CSV Dataset Summary (${totalRows} records):\nColumns: ${header}\nSample Data:\n${sampleRows}\n\nFull Content:\n${csvText.slice(0, 10000)}`;
}

export function buildFilePromptContext(parsedFiles) {
  if (!parsedFiles || parsedFiles.length === 0) return '';

  return parsedFiles.map((f) => {
    return `### 📄 Uploaded File: ${f.name} (${f.size})\n\`\`\`${f.name.split('.').pop() || ''}\n${f.content}\n\`\`\``;
  }).join('\n\n');
}
