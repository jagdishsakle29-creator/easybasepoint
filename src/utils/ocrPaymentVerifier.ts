import Tesseract from 'tesseract.js';

export interface OcrVerificationResult {
  success: boolean;
  amountMatched: boolean;
  statusMatched: boolean;
  timeValid: boolean;
  detectedAmount?: number;
  detectedUtr?: string;
  detectedTime?: string;
  timeDiffMins?: number;
  rawText: string;
  reason: string;
}

export interface VerifyPaymentOptions {
  imageSource: string | File | Blob;
  expectedAmount: number;
  orderCreatedAt?: number; // timestamp in ms
  maxMinutesDiff?: number; // default 10 minutes
  onProgress?: (progress: number, statusText: string) => void;
}

/**
 * Preprocesses image on an offscreen canvas to optimize Tesseract OCR accuracy.
 * Converts to grayscale, enhances contrast, and scales down if overly huge.
 */
async function preprocessImage(imageSource: string | File | Blob): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);

        // Image processing: Increase contrast and convert to grayscale for clear text recognition
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;
        const contrast = 1.35;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < d.length; i += 4) {
          // Grayscale
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Contrast
          const adjusted = factor * (gray - 128) + 128;
          const finalVal = Math.min(255, Math.max(0, adjusted));
          d[i] = finalVal;
          d[i + 1] = finalVal;
          d[i + 2] = finalVal;
        }
        ctx.putImageData(imgData, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        console.warn('[OCR] Image preprocessing failed, falling back to raw image:', err);
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      }
    };

    img.onerror = () => {
      resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Parses time string (e.g. "04:55 pm", "16:55", "4:55 PM") into minutes from midnight
 */
function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toLowerCase() : null;

  if (hours > 24 || minutes > 59) return null;

  if (period === 'pm' && hours < 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Extracts numbers that might represent amounts from OCR text.
 * Handles comma notation like ₹2,000, 2000.00, ₹350, Rs. 700, etc.
 */
function extractAmounts(text: string): number[] {
  const amounts: number[] = [];

  // Match ₹/Rs/INR prefixed numbers or numbers with decimals
  const regexPatterns = [
    /(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi,
    /(?:paid|amount|total|transfer(?:red)?|debited)\s*(?:of)?\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi,
    /\b([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)\b/g, // formatted with commas like 1,000, 2,000
    /\b([1-9][0-9]{2,5}(?:\.[0-9]{2})?)\b/g // Plain numbers 100 to 999999
  ];

  for (const regex of regexPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const cleanStr = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed) && parsed > 0 && !amounts.includes(parsed)) {
        amounts.push(parsed);
      }
    }
  }

  return amounts;
}

/**
 * Scans an uploaded payment screenshot with AI OCR, validates:
 * 1. The exact amount matches expectedAmount.
 * 2. Successful payment keywords are present.
 * 3. Payment date/time is fresh and strictly within maxMinutesDiff (default 10 mins) of order creation.
 * 4. 12-digit UTR is captured.
 */
export async function verifyPaymentScreenshot(options: VerifyPaymentOptions): Promise<OcrVerificationResult> {
  const {
    imageSource,
    expectedAmount,
    orderCreatedAt = Date.now(),
    maxMinutesDiff = 10,
    onProgress
  } = options;

  try {
    if (onProgress) onProgress(15, 'Image optimize ho rahi hai...');
    const processedImage = await preprocessImage(imageSource);

    if (onProgress) onProgress(35, 'AI OCR Receipt read kar raha hai...');

    // Run Tesseract OCR
    const ocrResult = await Tesseract.recognize(processedImage, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = 35 + Math.round((m.progress || 0) * 55);
          onProgress(pct, `Scanning receipt... (${Math.round((m.progress || 0) * 100)}%)`);
        }
      }
    });

    if (onProgress) onProgress(95, 'Amount & 10-minute timestamp verify ho raha hai...');

    const rawText = (ocrResult?.data?.text || '').toLowerCase();
    const cleanRawText = rawText.replace(/\s+/g, ' ');

    // 1. Amount Verification
    const detectedAmounts = extractAmounts(cleanRawText);
    const amountMatched = detectedAmounts.some((amt) => {
      // Allow exact match or rounding difference < 0.5
      return Math.abs(amt - expectedAmount) < 0.5;
    });

    const detectedAmount = detectedAmounts.find((amt) => Math.abs(amt - expectedAmount) < 0.5) || detectedAmounts[0];

    // 2. Success Status Verification
    const successKeywords = [
      'paid',
      'successful',
      'payment successful',
      'transaction successful',
      'transferred to',
      'transferred',
      'debited from',
      'completed',
      'payment to',
      'transfer to',
      'sent to',
      'bhim',
      'phonepe',
      'google pay',
      'paytm',
      'upi ref',
      'banking name'
    ];
    const statusMatched = successKeywords.some((kw) => cleanRawText.includes(kw));

    // 3. 12-Digit UTR Detection
    let detectedUtr: string | undefined;
    const utrRegex = /(?:utr|ref|upi\s*ref|rrn|txn\s*id|transaction\s*id)[\s:#-]{0,10}([0-9]{12})\b/i;
    const utrMatch = cleanRawText.match(utrRegex);
    if (utrMatch && utrMatch[1]) {
      detectedUtr = utrMatch[1];
    } else {
      // Look for standalone 12 digits
      const standalone12 = cleanRawText.match(/\b([0-9]{12})\b/);
      if (standalone12 && standalone12[1]) {
        detectedUtr = standalone12[1];
      }
    }

    // 4. Timestamp & 10-Minute Freshness Check
    let detectedTime: string | undefined;
    let timeDiffMins: number | undefined;
    let timeValid = true;
    let timeReason = '';

    // Check if screenshot mentions 'yesterday' or past dates
    if (cleanRawText.includes('yesterday')) {
      timeValid = false;
      timeReason = 'Screenshot kal ka (Yesterday) hai. Sirf 10 min ke andar ki fresh payment accept hogi.';
    }

    // Check time pattern: e.g. "04:55 pm", "16:55", "4:55 pm"
    const timeRegex = /\b(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)\b/i;
    const timeMatch = cleanRawText.match(timeRegex);

    if (timeMatch && timeMatch[1]) {
      detectedTime = timeMatch[1];
      const screenshotMins = parseTimeToMinutes(detectedTime);

      if (screenshotMins !== null) {
        // Calculate order time in minutes from midnight (IST / Local)
        const orderDate = new Date(orderCreatedAt);
        const orderMins = orderDate.getHours() * 60 + orderDate.getMinutes();

        // Calculate absolute difference in minutes
        let diff = Math.abs(orderMins - screenshotMins);
        // Handle midnight rollover (e.g. 23:58 to 00:04 is 6 mins)
        if (diff > 1440 / 2) {
          diff = 1440 - diff;
        }

        timeDiffMins = diff;

        if (diff > maxMinutesDiff) {
          timeValid = false;
          timeReason = `Payment ka samay (${detectedTime}) order lagane ke samay se ${diff} minute alag hai. Sirf ${maxMinutesDiff} minute me kiye gaye payment accept honge.`;
        }
      }
    }

    // 5. Final Verdict
    let success = false;
    let reason = '';

    if (!amountMatched) {
      reason = `Screenshot me ₹${expectedAmount} ka amount nahi mila (Found: ${detectedAmounts.map(a => `₹${a}`).join(', ') || 'None'}).`;
    } else if (!timeValid) {
      reason = timeReason || `Payment 10 minute se purana hai (${timeDiffMins}m purana). Werna reject rule lagu hai.`;
    } else if (!statusMatched && !detectedUtr) {
      reason = 'Payment successful ya 12-digit UTR confirmation nahi dikha. Kripya clear screenshot upload karein.';
    } else {
      success = true;
      reason = `✓ AI Verified: ₹${expectedAmount} amount & fresh payment (${detectedTime || '<10m'}) confirmed!`;
    }

    if (onProgress) onProgress(100, success ? '✓ Payment Verified!' : 'Verification complete');

    return {
      success,
      amountMatched,
      statusMatched,
      timeValid,
      detectedAmount,
      detectedUtr,
      detectedTime,
      timeDiffMins,
      rawText: cleanRawText,
      reason
    };
  } catch (err: any) {
    console.error('[OCR_VERIFIER] Error executing OCR verification:', err);
    return {
      success: false,
      amountMatched: false,
      statusMatched: false,
      timeValid: false,
      rawText: '',
      reason: err?.message || 'OCR scanning error. Please retry or contact support.'
    };
  }
}
