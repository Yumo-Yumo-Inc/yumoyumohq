/**
 * Client-side image quality check
 * Validates image quality before upload to ensure better OCR results
 */

export interface ImageQualityIssue {
  type: 'blur' | 'orientation' | 'brightness' | 'size' | 'aspect';
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

export interface ImageQualityResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ImageQualityIssue[];
}

/**
 * Create Image object from File
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate blur score using Laplacian variance
 * Higher score = less blur
 */
function calculateBlurScore(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate Laplacian variance (edge detection)
  let variance = 0;
  let mean = 0;
  const laplacian: number[] = [];
  
  // Convert to grayscale and calculate Laplacian
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const idx = (y * canvas.width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Laplacian kernel
      const laplacianValue = Math.abs(
        gray * 4 -
        (data[((y - 1) * canvas.width + x) * 4] + data[((y + 1) * canvas.width + x) * 4] + 
         data[(y * canvas.width + (x - 1)) * 4] + data[(y * canvas.width + (x + 1)) * 4]) / 3
      );
      
      laplacian.push(laplacianValue);
      mean += laplacianValue;
    }
  }
  
  mean /= laplacian.length;
  
  // Calculate variance
  for (const val of laplacian) {
    variance += Math.pow(val - mean, 2);
  }
  variance /= laplacian.length;
  
  // Normalize to 0-100 scale (variance > 100 = sharp, < 50 = blurry)
  return Math.min(100, Math.max(0, (variance / 100) * 100));
}

/**
 * Calculate average brightness (0-1)
 */
function calculateBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0.5;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // RGB to grayscale
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += gray;
  }
  
  return sum / (data.length / 4) / 255;
}

/**
 * Check image quality before upload
 * Returns validation result with issues and suggestions
 */
type IqcLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

function pickIqc(locale: string, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  const l = locale as IqcLocale;
  if (l === "tr") return tr;
  if (l === "ru") return ru;
  if (l === "th") return th;
  if (l === "es") return es;
  if (l === "zh") return zh;
  return en;
}

export async function checkImageQuality(
  file: File,
  locale: string = 'tr',
  isAdmin: boolean = false
): Promise<ImageQualityResult> {
  const issues: ImageQualityIssue[] = [];
  let score = 100;

  // Only check images, not PDFs
  if (!file.type.startsWith('image/')) {
    return { isValid: true, score: 100, issues: [] };
  }

  try {
    const img = await createImageFromFile(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { isValid: false, score: 0, issues: [{
        type: 'size',
        severity: 'error',
        message: pickIqc(locale, 'Görüntü yüklenemedi', 'Failed to load image', 'Не удалось загрузить изображение', 'โหลดภาพไม่สำเร็จ', 'No se pudo cargar la imagen', '无法加载图片'),
        suggestion: pickIqc(
          locale,
          'Lütfen farklı bir görüntü deneyiniz. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Please try a different image. Screenshots are not accepted.',
          'Пожалуйста, попробуйте другое изображение. Скриншоты не принимаются.',
          'โปรดลองใช้ภาพอื่น ไม่รับภาพหน้าจอ',
          'Por favor prueba con otra imagen. No se aceptan capturas de pantalla.',
          '请尝试其他图片。不接受截图。',
        ),
      }]};
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 1. Check image size (minimum resolution)
    if (img.width < 800 || img.height < 600) {
      issues.push({
        type: 'size',
        severity: isAdmin ? 'warning' : 'error',
        message: pickIqc(
          locale,
          'Fişin tamamı fotoğrafta görünmüyor',
          'The entire receipt is not visible in the photo',
          'Чек виден не полностью на фото',
          'ใบเสร็จไม่ปรากฏครบในภาพ',
          'No se ve todo el recibo en la foto',
          '照片中未显示完整的收据',
        ),
        suggestion: pickIqc(
          locale,
          'Lütfen kameranızı fişten uzaklaştırınız ki fişin tamamı ve etrafında biraz boşluk görünsün. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Please move your camera away from the receipt so the entire receipt and some space around it are visible. Screenshots are not accepted.',
          'Отодвиньте камеру так, чтобы был виден весь чек и немного места вокруг. Скриншоты не принимаются.',
          'โปรดถ่างกล้องออกให้เห็นใบเสร็จทั้งใบและขอบรอบๆ ไม่รับภาพหน้าจอ',
          'Aleja la cámara para que se vea todo el recibo y un poco de espacio alrededor. No se aceptan capturas de pantalla.',
          '请将相机后移以拍到整张收据及周围少量空间。不接受截图。',
        ),
      });
      score -= isAdmin ? 10 : 30;
    }

    // 2. Check aspect ratio
    const aspectRatio = img.width / img.height;
    if (aspectRatio < 0.3 || aspectRatio > 3.0) {
      issues.push({
        type: 'aspect',
        severity: 'error',
        message: pickIqc(
          locale,
          'Fiş dik olarak durmak zorundadır',
          'Receipt must be upright',
          'Чек должен быть в вертикальном положении',
          'ใบเสร็จต้องตั้งตรง',
          'El recibo debe estar en vertical',
          '收据必须保持直立',
        ),
        suggestion: pickIqc(
          locale,
          'Lütfen fişi düz bir yüzeye koyunuz ve kameranızı fişe dik açıyla tutunuz. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Please place the receipt on a flat surface and hold your camera perpendicular to the receipt. Screenshots are not accepted.',
          'Положите чек на плоскую поверхность и держите камеру перпендикулярно чеку. Скриншоты не принимаются.',
          'วางใบเสร็จบนพื้นเรียบและถือกล้องตั้งฉากกับใบเสร็จ ไม่รับภาพหน้าจอ',
          'Coloca el recibo sobre una superficie plana y mantén la cámara perpendicular al recibo. No se aceptan capturas.',
          '请将收据放在平坦表面，并使相机与收据保持垂直。不接受截图。',
        ),
      });
      score -= 20;
    }

    // 3. Check blur
    const blurScore = calculateBlurScore(canvas);
    if (blurScore < 50) {
      issues.push({
        type: 'blur',
        severity: 'error',
        message: pickIqc(locale, 'Fotoğraf bulanık', 'Photo is blurry', 'Фото размыто', 'ภาพเบลอ', 'La foto está borrosa', '照片模糊'),
        suggestion: pickIqc(
          locale,
          'Lütfen kameranızı sabit tutunuz ve fişe odaklanınız. Işığın yeterli olduğundan emin olunuz. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Please hold your camera steady and focus on the receipt. Ensure there is sufficient lighting. Screenshots are not accepted.',
          'Держите камеру неподвижно и сфокусируйтесь на чеке. Убедитесь, что освещения достаточно. Скриншоты не принимаются.',
          'ถือกล้องให้นิ่งและโฟกัสที่ใบเสร็จ ตรวจสอบว่ามีแสงพอ ไม่รับภาพหน้าจอ',
          'Mantén la cámara firme y enfoca el recibo. Asegúrate de tener buena iluminación. No se aceptan capturas.',
          '请稳定相机并对焦收据。确保光线充足。不接受截图。',
        ),
      });
      score -= 25;
    } else if (blurScore < 70) {
      issues.push({
        type: 'blur',
        severity: 'warning',
        message: pickIqc(
          locale,
          'Fotoğraf biraz bulanık olabilir',
          'Photo may be slightly blurry',
          'Фото может быть слегка размытым',
          'ภาพอาจเบลอเล็กน้อย',
          'La foto podría estar levemente borrosa',
          '照片可能略微模糊',
        ),
        suggestion: pickIqc(
          locale,
          'Daha net bir fotoğraf için kameranızı sabit tutunuz. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Hold your camera steady for a sharper photo. Screenshots are not accepted.',
          'Держите камеру неподвижно для более чёткого фото. Скриншоты не принимаются.',
          'ถือกล้องให้นิ่งเพื่อภาพที่คมชัดขึ้น ไม่รับภาพหน้าจอ',
          'Mantén la cámara firme para una foto más nítida. No se aceptan capturas.',
          '稳定相机以获得更清晰的照片。不接受截图。',
        ),
      });
      score -= 10;
    }

    // 4. Check brightness
    const brightness = calculateBrightness(canvas);
    if (brightness < 0.2) {
      issues.push({
        type: 'brightness',
        severity: 'error',
        message: pickIqc(locale, 'Fotoğraf çok karanlık', 'Photo too dark', 'Фото слишком тёмное', 'ภาพมืดเกินไป', 'Foto demasiado oscura', '照片太暗'),
        suggestion: pickIqc(
          locale,
          'Lütfen ışığın yeterli olduğuna emin olunuz. Daha iyi aydınlatılmış bir yerde çekiniz. Ekran görüntüsü (screenshot) kabul edilmemektedir; lütfen fişin fotoğrafını çekiniz.',
          'Please ensure there is sufficient lighting. Take the photo in a well-lit area. Screenshots are not accepted; please take a photo of the receipt.',
          'Убедитесь в достаточном освещении. Сделайте фото в хорошо освещённом месте. Скриншоты не принимаются — снимите чек.',
          'โปรดให้แสงเพียงพอ ถ่ายในที่ที่มีแสงสว่าง ไม่รับภาพหน้าจอ — โปรดถ่ายภาพใบเสร็จจริง',
          'Asegúrate de tener buena iluminación. Toma la foto en un lugar bien iluminado. No se aceptan capturas; toma una foto del recibo.',
          '请确保光线充足。在光线良好的地方拍摄。不接受截图，请拍摄收据原件。',
        ),
      });
      score -= 20;
    } else if (brightness < 0.3) {
      issues.push({
        type: 'brightness',
        severity: 'warning',
        message: pickIqc(
          locale,
          'Fotoğraf biraz karanlık olabilir',
          'Photo may be a bit dark',
          'Фото может быть немного тёмным',
          'ภาพอาจมืดเล็กน้อย',
          'La foto podría estar un poco oscura',
          '照片可能略暗',
        ),
        suggestion: pickIqc(
          locale,
          'Daha iyi okuma için daha aydınlık bir yerde çekmeyi deneyebilirsiniz. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Try taking the photo in a brighter area for better reading. Screenshots are not accepted.',
          'Попробуйте снять в более светлом месте, чтобы лучше прочитать. Скриншоты не принимаются.',
          'ลองถ่ายในที่ที่สว่างกว่าเพื่อให้อ่านง่ายขึ้น ไม่รับภาพหน้าจอ',
          'Intenta sacar la foto en un lugar más iluminado para mejor lectura. No se aceptan capturas.',
          '尝试在更亮的环境中拍摄以便识别。不接受截图。',
        ),
      });
      score -= 5;
    } else if (brightness > 0.9) {
      issues.push({
        type: 'brightness',
        severity: 'warning',
        message: pickIqc(locale, 'Fotoğraf çok parlak', 'Photo too bright', 'Фото слишком яркое', 'ภาพสว่างเกินไป', 'Foto demasiado brillante', '照片过亮'),
        suggestion: pickIqc(
          locale,
          'Lütfen doğrudan ışık kaynağından kaçınınız. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Please avoid direct light sources. Screenshots are not accepted.',
          'Избегайте прямого света. Скриншоты не принимаются.',
          'โปรดหลีกเลี่ยงแสงโดยตรง ไม่รับภาพหน้าจอ',
          'Evita fuentes de luz directas. No se aceptan capturas.',
          '请避免直射光源。不接受截图。',
        ),
      });
      score -= 10;
    }

    // Background/contrast check REMOVED — caused false positives for e-faturas and low-contrast images
    // (receipt on similar background triggered edge noise as "background objects")

    return {
      isValid: score >= 70 && issues.filter(i => i.severity === 'error').length === 0,
      score: Math.max(0, score),
      issues
    };
  } catch (error: any) {
    console.error('[image-quality-check] Error:', error);
    return {
      isValid: false,
      score: 0,
      issues: [{
        type: 'size',
        severity: 'error',
        message: pickIqc(locale, 'Görüntü analiz edilemedi', 'Failed to analyze image', 'Не удалось проанализировать изображение', 'วิเคราะห์ภาพไม่สำเร็จ', 'No se pudo analizar la imagen', '无法分析图片'),
        suggestion: pickIqc(
          locale,
          'Lütfen farklı bir görüntü deneyiniz. Ekran görüntüsü (screenshot) kabul edilmemektedir.',
          'Please try a different image. Screenshots are not accepted.',
          'Попробуйте другое изображение. Скриншоты не принимаются.',
          'โปรดลองใช้ภาพอื่น ไม่รับภาพหน้าจอ',
          'Por favor prueba con otra imagen. No se aceptan capturas.',
          '请尝试其他图片。不接受截图。',
        ),
      }]
    };
  }
}
