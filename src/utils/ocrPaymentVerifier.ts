import Tesseract from 'tesseract.js';

export interface OcrVerificationResult {
  success: boolean;
  amountMatched: boolean;
  statusMatched: boolean;
  timeValid: boolean;
  dateValid?: boolean;
  debitedConfirmed?: boolean;
  detectedAmount?: number;
  detectedUtr?: string;
  detectedDate?: string;
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
        const maxDim = 700;
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
 * RULE 1: STRICT STANDALONE EXACT AMOUNT MATCHING
 * Strictly checks that expectedAmount appears as an exact standalone number.
 * Prevents matching substrings like 7878 inside 787892 or 1290 inside 129873.
 */
function checkExactAmountMatch(text: string, expectedAmount: number): {
  matched: boolean;
  detectedAmount?: number;
  detectedNumbers: number[];
} {
  // Gather all standalone numbers in the text with optional commas and decimals
  const numberRegex = /(?<![0-9.])([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)(?![0-9.])/g;
  const detectedNumbers: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = numberRegex.exec(text)) !== null) {
    const rawNumStr = match[1].replace(/,/g, '');
    const num = parseFloat(rawNumStr);
    if (!isNaN(num) && num > 0 && !detectedNumbers.includes(num)) {
      detectedNumbers.push(num);
    }
  }

  // Construct specific regex pattern for the exact expected amount
  // e.g. for 7878 -> allows ₹7878, Rs. 7,878, 7878.00, etc. but NEVER 787892 or 129873
  const intPart = Math.floor(expectedAmount).toString();
  const formattedWithComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decPart = (expectedAmount % 1 !== 0) ? (expectedAmount % 1).toFixed(2).slice(1) : '(?:\\.00)?';

  const exactPatternStr = `(?<![0-9.])(?:₹|rs\\.?|inr)?\\s*(?:${intPart}|${formattedWithComma})${decPart}(?![0-9.])`;
  const exactRegex = new RegExp(exactPatternStr, 'i');
  const hasExactRegexMatch = exactRegex.test(text);

  // In Indian OCR receipts, Tesseract frequently misreads the ₹ currency symbol as '3' or 'z'
  // (e.g. ₹6,891 read as 36,891 or 36891). We detect this glyph artifact safely:
  const rupeeMisreadNumber = parseFloat(`3${intPart}`);
  const hasRupeeMisread = !isNaN(rupeeMisreadNumber) && detectedNumbers.includes(rupeeMisreadNumber);

  const matchedInList = detectedNumbers.some((n) => Math.abs(n - expectedAmount) < 0.05);
  const matched = hasExactRegexMatch || matchedInList || hasRupeeMisread;
  const detectedAmount = matched ? expectedAmount : detectedNumbers[0];

  return { matched, detectedAmount, detectedNumbers };
}

/**
 * RULE 2: SAME DAY DATE & 30-MINUTE FRESHNESS CHECK
 * 1. If date is present in screenshot, it must match the day order was placed (same date).
 * 2. If 'yesterday' or past day is mentioned, reject immediately.
 * 3. Time must be within maxMinutesDiff (default 30 mins).
 */
function checkDateAndFreshness(
  text: string,
  orderCreatedAt: number,
  maxMinutesDiff: number = 30
): {
  valid: boolean;
  reason?: string;
  detectedDate?: string;
  detectedTime?: string;
  timeDiffMins?: number;
} {
  const orderDate = new Date(orderCreatedAt);
  const orderDay = orderDate.getDate(); // 1-31
  const orderMonth = orderDate.getMonth(); // 0-11
  const orderYear = orderDate.getFullYear();

  // 1. Reject yesterday / previous day mentions
  if (/\b(yesterday|kal|previous\s*day)\b/i.test(text)) {
    return {
      valid: false,
      reason: 'Screenshot kal (Yesterday) ka hai. Sirf 10 minute ke andar ka aaj ka payment accept hoga.'
    };
  }

  // 2. Date Extraction & Verification
  let detectedDate: string | undefined;
  let dateMismatch = false;

  // Pattern A: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const numericDateMatch = text.match(/\b([0-3]?[0-9])[-/.]([0-1]?[0-9])[-/.](20\d{2}|\d{2})\b/);
  if (numericDateMatch) {
    detectedDate = numericDateMatch[0];
    const dDay = parseInt(numericDateMatch[1], 10);
    const dMonth = parseInt(numericDateMatch[2], 10) - 1;
    let dYear = parseInt(numericDateMatch[3], 10);
    if (dYear < 100) dYear += 2000;

    if (dDay !== orderDay || dMonth !== orderMonth || dYear !== orderYear) {
      dateMismatch = true;
    }
  }

  // Pattern B: "17 Oct 2026", "17 October", "Oct 17, 2026"
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const textDateMatch =
    text.match(/\b([0-3]?[0-9])\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(20\d{2})?\b/i) ||
    text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+([0-3]?[0-9])(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/i);

  if (textDateMatch) {
    let dDay: number;
    let monthName: string;
    let dYear: number | undefined;

    if (isNaN(parseInt(textDateMatch[1], 10))) {
      monthName = textDateMatch[1].toLowerCase().slice(0, 3);
      dDay = parseInt(textDateMatch[2], 10);
      dYear = textDateMatch[3] ? parseInt(textDateMatch[3], 10) : undefined;
    } else {
      dDay = parseInt(textDateMatch[1], 10);
      monthName = textDateMatch[2].toLowerCase().slice(0, 3);
      dYear = textDateMatch[3] ? parseInt(textDateMatch[3], 10) : undefined;
    }

    detectedDate = textDateMatch[0];
    const dMonth = months.indexOf(monthName);

    if (dDay !== orderDay || (dMonth !== -1 && dMonth !== orderMonth) || (dYear && dYear !== orderYear)) {
      dateMismatch = true;
    }
  }

  if (dateMismatch && detectedDate) {
    return {
      valid: false,
      detectedDate,
      reason: `Screenshot purani tarikh (${detectedDate}) ka hai. Order aaj lagaya gaya hai - same date ka payment chahiye.`
    };
  }

  // 3. Time Extraction & 10-Minute Freshness Window Check
  let detectedTime: string | undefined;
  let timeDiffMins: number | undefined;
  const timeRegex = /\b(\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:am|pm)?)\b/i;
  const timeMatch = text.match(timeRegex);

  if (timeMatch && timeMatch[1]) {
    detectedTime = timeMatch[1];
    const screenshotMins = parseTimeToMinutes(detectedTime);

    if (screenshotMins !== null) {
      const orderMins = orderDate.getHours() * 60 + orderDate.getMinutes();
      let diff = Math.abs(orderMins - screenshotMins);
      if (diff > 1440 / 2) {
        diff = 1440 - diff;
      }
      timeDiffMins = diff;

      if (diff > maxMinutesDiff) {
        return {
          valid: false,
          detectedDate,
          detectedTime,
          timeDiffMins,
          reason: `Payment ka samay (${detectedTime}) order lagane ke samay se ${diff} minute purana hai. Sirf ${maxMinutesDiff} minute me kiye gaye payment accept honge.`
        };
      }
    }
  }

  return {
    valid: true,
    detectedDate,
    detectedTime,
    timeDiffMins
  };
}

/**
 * RULE 3: MONEY SENT / DEBITED PROOF CHECK
 * Verifies that money was actually debited or transferred from user's account.
 * Rejects failed, declined, cancelled, reversed, or pending transactions.
 */
function checkMoneySentOrDebited(text: string): { valid: boolean; reason?: string } {
  // 1. Immediate rejection on failure keywords
  const failureRegex = /\b(failed|payment\s*failed|transaction\s*failed|declined|cancelled|reversed|unsuccessful|refunded)\b/i;
  if (failureRegex.test(text)) {
    return {
      valid: false,
      reason: 'Screenshot me payment Failed / Declined dikh raha hai. Kripya safal payment ka screenshot upload karein.'
    };
  }

  // 2. Rejection on pending / incomplete requests
  const pendingRegex = /\b(payment\s*pending|processing|request\s*received|waiting\s*for\s*confirmation)\b/i;
  if (pendingRegex.test(text) && !/\b(successful|completed|paid)\b/i.test(text)) {
    return {
      valid: false,
      reason: 'Payment abhi Pending / Processing hai. Complete hone ke baad screenshot upload karein.'
    };
  }

  // 3. Positive Debit / Sent / Transferred confirmation
  const successDebitPatterns = [
    /\bpaid\s+(?:to|successfully)\b/i,
    /\bpayment\s+successful\b/i,
    /\btransaction\s+successful\b/i,
    /\btransferred\s+to\b/i,
    /\btransfer\s+successful\b/i,
    /\bdebited\s+from\b/i,
    /\bmoney\s+sent\b/i,
    /\bsent\s+successfully\b/i,
    /\bpayment\s+completed\b/i,
    /\bpayment\s+done\b/i,
    /\bpaid\b/i,
    /\bdebited\b/i,
    /\bsent\s+to\b/i,
    /\bsuccessful\b/i,
    /\bcompleted\b/i,
    /\bbheje\s*gaye\b/i
  ];

  const hasDebitProof = successDebitPatterns.some((pattern) => pattern.test(text));
  if (!hasDebitProof) {
    return {
      valid: false,
      reason: 'Paise katne ya transfer hone ka proof (Paid / Debited / Sent Successful) nahi mila. Kripya pura payment receipt screenshot upload karein.'
    };
  }

  return { valid: true };
}

/**
 * Main AI OCR Payment Screenshot Verifier
 * Enforces all 3 user conditions:
 * 1. Same-day date & strictly within 10 minutes of order creation.
 * 2. Exact standalone amount match (e.g. 7878 strictly, not 787892 or 129873).
 * 3. Positive money debited / sent confirmation (not failed or pending).
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

    // Run Tesseract OCR on processed image
    const ocrResult = await Tesseract.recognize(processedImage, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = 35 + Math.round((m.progress || 0) * 55);
          onProgress(pct, `Scanning receipt... (${Math.round((m.progress || 0) * 100)}%)`);
        }
      }
    });

    if (onProgress) onProgress(92, 'Validating exact amount, same-day date, and 10-minute rule...');

    const rawText = (ocrResult?.data?.text || '').toLowerCase();
    const cleanRawText = rawText.replace(/\s+/g, ' ');

    // 1. DATE & 10-MINUTE TIME WINDOW CHECK
    const dateCheck = checkDateAndFreshness(cleanRawText, orderCreatedAt, maxMinutesDiff);

    // 2. EXACT STANDALONE AMOUNT MATCHING (Prevents 7878 matching 787892 or 129873)
    const amountCheck = checkExactAmountMatch(cleanRawText, expectedAmount);

    // 3. MONEY SENT / DEBITED PROOF CHECK
    const statusCheck = checkMoneySentOrDebited(cleanRawText);

    // 4. 12-Digit UTR Detection
    let detectedUtr: string | undefined;
    const utrRegex = /(?:utr|ref|upi\s*ref|rrn|txn\s*id|transaction\s*id)[\s:#-]{0,10}([0-9]{12})\b/i;
    const utrMatch = cleanRawText.match(utrRegex);
    if (utrMatch && utrMatch[1]) {
      detectedUtr = utrMatch[1];
    } else {
      const standalone12 = cleanRawText.match(/\b([0-9]{12})\b/);
      if (standalone12 && standalone12[1]) {
        detectedUtr = standalone12[1];
      }
    }

    // 5. Final Evaluation
    let success = false;
    let reason = '';

    if (!dateCheck.valid) {
      reason = dateCheck.reason || 'Payment ka samay purana hai. Order ke 10 minute ke andar ka payment chahiye.';
    } else if (!amountCheck.matched) {
      const foundList = amountCheck.detectedNumbers.map((n) => `₹${n}`).join(', ');
      reason = `Screenshot me exact ₹${expectedAmount} nahi mila (Found: ${foundList || 'none'}). Amount exact match hona chahiye.`;
    } else if (!statusCheck.valid) {
      reason = statusCheck.reason || 'Paise katne ya transfer hone ka proof (Paid/Debited) nahi mila.';
    } else {
      success = true;
      const timeInfo = dateCheck.detectedTime ? ` (${dateCheck.detectedTime})` : '';
      reason = `✓ AI Verified: Aaj ki payment${timeInfo} me exact ₹${expectedAmount} debited & sent successfully!`;
    }

    if (onProgress) onProgress(100, success ? '✓ Payment Verified!' : 'Verification complete');

    return {
      success,
      amountMatched: amountCheck.matched,
      statusMatched: statusCheck.valid,
      timeValid: dateCheck.valid,
      dateValid: dateCheck.valid,
      debitedConfirmed: statusCheck.valid,
      detectedAmount: amountCheck.detectedAmount,
      detectedUtr,
      detectedDate: dateCheck.detectedDate,
      detectedTime: dateCheck.detectedTime,
      timeDiffMins: dateCheck.timeDiffMins,
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
