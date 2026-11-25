/**
 * Compresses an uploaded image File into a compact JPEG data URL (< ~120KB)
 * so both front and back BI photos fit reliably across mobile networks,
 * HTTP proxies, and browser localStorage quota.
 */
async function decodeImageSource(file: File, rawDataUrl: string): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback to HTMLImageElement below
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Formato de imagem inválido ou não suportado pelo navegador.'));
    image.src = rawDataUrl;
  });
}

export async function compressImageToDataUrl(
  file: File,
  maxWidth = 720,
  quality = 0.62
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

  let decoded: (HTMLImageElement | ImageBitmap) | null = null;
  try {
    decoded = await decodeImageSource(file, rawDataUrl);

    const srcWidth =
      'naturalWidth' in decoded ? decoded.naturalWidth || decoded.width : decoded.width;
    const srcHeight =
      'naturalHeight' in decoded ? decoded.naturalHeight || decoded.height : decoded.height;

    const render = (targetWidth: number, q: number): string => {
      let width = srcWidth || targetWidth;
      let height = srcHeight || Math.round(targetWidth * 0.65);

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
      ctx.drawImage(decoded as CanvasImageSource, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', q);
    };

    let compressed = render(maxWidth, quality);
    if (compressed.length > 150 * 1024) {
      compressed = render(560, 0.48);
    }
    if (compressed.length > 165 * 1024) {
      compressed = render(440, 0.38);
    }
    return compressed;
  } catch {
    if (rawDataUrl.length <= 280 * 1024) {
      return rawDataUrl;
    }
    throw new Error(
      'Não foi possível processar esta fotografia (formato/tamanho incompatível). Tira uma captura de ecrã (print) ou escolhe uma foto JPEG/PNG.'
    );
  } finally {
    if (decoded && 'close' in decoded && typeof decoded.close === 'function') {
      try {
        decoded.close();
      } catch {}
    }
  }
}

export async function readReceiptFileToDataUrl(file: File): Promise<string> {
  const isImage =
    (file.type && file.type.startsWith('image/')) ||
    /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '');

  if (isImage) {
    const compressed = await compressImageToDataUrl(file, 760, 0.64);
    if (compressed.length > 350 * 1024) {
      throw new Error('A imagem selecionada é demasiado pesada mesmo após compressão. Tenta outra fotografia.');
    }
    return compressed;
  }

  // Non-image files (e.g. PDF) cannot be canvas-compressed; enforce ~450KB raw limit so base64 stays light
  if (file.size > 450 * 1024) {
    throw new Error('O ficheiro PDF do comprovativo excede 450KB. Por favor envia uma captura de ecrã (imagem) ou um PDF mais leve.');
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
