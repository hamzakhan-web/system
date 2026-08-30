// Generates clean SVG representation of a QR Code pattern for receipts
export function generateQrSvgString(text: string, size = 100): string {
  // Deterministic 21x21 grid based on hashing input
  const gridSize = 21;
  const cellSize = size / (gridSize + 4);
  const offset = cellSize * 2;

  // Simple deterministic hash based on text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Pre-seed matrix
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Corner finder patterns (7x7)
  const markFinder = (rStart: number, cStart: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[rStart + r][cStart + c] = true;
        }
      }
    }
  };

  markFinder(0, 0); // Top Left
  markFinder(0, gridSize - 7); // Top Right
  markFinder(gridSize - 7, 0); // Bottom Left

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data fill with deterministic pseudo-random variation
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8)
      ) {
        continue;
      }
      const val = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 0.123)) > 0.48;
      matrix[r][c] = val;
    }
  }

  let rects = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (matrix[r][c]) {
        const x = (offset + c * cellSize).toFixed(2);
        const y = (offset + r * cellSize).toFixed(2);
        const w = (cellSize + 0.1).toFixed(2);
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="#0f172a" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#ffffff" rx="4" />
      ${rects}
    </svg>
  `;
}

// Generates clean SVG representation of Code 128 / EAN style barcodes
export function generateBarcodeSvgString(code: string, width = 240, height = 70): string {
  // Deterministic bar widths based on char codes
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const barHeight = height - 20;

  // Start guard
  bars.push({ x: currentX, w: 2 });
  currentX += 3;
  bars.push({ x: currentX, w: 1 });
  currentX += 2;
  bars.push({ x: currentX, w: 2 });
  currentX += 4;

  const chars = (code || '000000000000').split('');
  for (let i = 0; i < chars.length; i++) {
    const charCode = chars[i].charCodeAt(0);
    const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 3) + 1, ((charCode >> 2) % 3) + 1, 1];

    for (let j = 0; j < pattern.length; j++) {
      const isBar = j % 2 === 0;
      const w = pattern[j];
      if (isBar) {
        bars.push({ x: currentX, w });
      }
      currentX += w + 1;
    }
  }

  // End guard
  bars.push({ x: currentX, w: 2 });
  currentX += 3;
  bars.push({ x: currentX, w: 1 });
  currentX += 2;
  bars.push({ x: currentX, w: 2 });
  currentX += 10;

  const totalWidth = Math.max(width, currentX);

  const rects = bars
    .map((b) => `<rect x="${b.x}" y="10" width="${b.w}" height="${barHeight}" fill="#0f172a" />`)
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${totalWidth}" height="${height}" class="w-full h-auto">
      <rect width="${totalWidth}" height="${height}" fill="#ffffff" rx="4" />
      ${rects}
      <text x="${totalWidth / 2}" y="${height - 4}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600" fill="#334155">${code}</text>
    </svg>
  `;
}

// Export data to CSV file download
export function exportToCsv(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        let text = val === null || val === undefined ? '' : String(val);
        text = text.replace(/"/g, '""');
        if (text.search(/("|,|\n)/g) >= 0) {
          text = `"${text}"`;
        }
        return text;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
