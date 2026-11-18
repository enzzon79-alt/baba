/**
 * Compresses an uploaded image File into a compact JPEG data URL (< ~150KB)
 * so both front and back BI photos fit comfortably inside Firestore's 1MB document limit
 * and browser localStorage quota.
 */
export async function compressImageToDataUrl(
  file: File,
  maxWidth = 850,
  quality = 0.72
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        resolve(ev.target.result);
      } else {
        reject(new Error('Falha ao ler a imagem selecionada.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o ficheiro de imagem.'));
    reader.readAsDataURL(file);
  });

  // Skip canvas re-encoding for SVGs
  if (file.type === 'image/svg+xml' || rawDataUrl.startsWith('data:image/svg+xml')) {
    return rawDataUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Formato de imagem inválido.'));
      image.src = rawDataUrl;
    });

    const render = (targetWidth: number, q: number): string => {
      let width = img.naturalWidth || img.width || targetWidth;
      let height = img.naturalHeight || img.height || Math.round(targetWidth * 0.65);

      if (width > targetWidth) {
        height = Math.round((height * targetWidth) / width);
        width = targetWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return rawDataUrl;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', q);
    };

    let compressed = render(maxWidth, quality);
    // Second pass if still larger than ~220KB
    if (compressed.length > 220 * 1024) {
      compressed = render(680, 0.56);
    }
    // Third pass if still larger than ~240KB so BI front+back or receipts never breach Firestore 1MB doc cap
    if (compressed.length > 240 * 1024) {
      compressed = render(540, 0.45);
    }
    return compressed;
  } catch {
    return rawDataUrl;
  }
}

export async function readReceiptFileToDataUrl(file: File): Promise<string> {
  const isImage =
    (file.type && file.type.startsWith('image/')) ||
    /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '');

  if (isImage) {
    const compressed = await compressImageToDataUrl(file, 900, 0.7);
    if (compressed.length > 750 * 1024) {
      throw new Error('A imagem selecionada é demasiado pesada mesmo após compressão. Tenta outra fotografia.');
    }
    return compressed;
  }

  // Non-image files (e.g. PDF) cannot be canvas-compressed; enforce ~680KB raw limit so base64 < 1MB Firestore cap
  if (file.size > 680 * 1024) {
    throw new Error('O ficheiro PDF do comprovativo excede 680KB. Por favor envia uma captura de ecrã (imagem) ou um PDF mais leve.');
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao ler o ficheiro do comprovativo.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o ficheiro selecionado.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Copies text to clipboard using navigator.clipboard with a reliable
 * textarea + document.execCommand('copy') fallback for sandboxed iframes.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below (common in iframes with restricted permissions policy)
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  return false;
}
