import { toast } from "sonner";

/* ---------- TOAST HELPERS ---------- */

export function toastIfInvalid(condition, message) {
  if (!condition) {
    toast.error(message);
    return false;
  }
  return true;
}

/* =========================================
   UNIVERSAL VALIDATOR & FORMATTER FILE
   Used in: Frontend + Backend (ERP Safe)
========================================= */

/* ---------- 1. CAPITALIZE PAYLOAD ---------- */
export function toUpperCasePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(toUpperCasePayload);
  }

  if (payload !== null && typeof payload === "object") {
    const result = {};
    for (const key in payload) {
      result[key] = toUpperCasePayload(payload[key]);
    }
    return result;
  }

  if (typeof payload === "string") {
    return payload.trim().toUpperCase();
  }

  return payload;
}

/* ---------- 2. PHONE NUMBER VALIDATION (INDIA) ---------- */
export function validatePhoneNumber(phone) {
  if (!phone) return false;
  const value = phone.toString().trim();
  return /^[6-9]\d{9}$/.test(value);
}

/* ---------- 3. DOCUMENT TYPE VALIDATION ---------- */
export const ALLOWED_DOCUMENTS = [
  "AADHAAR CARD",
  "DRIVING LICENSE",
  "PASSPORT",
  "VOTER ID",
  "PAN CARD",
];

export function validateDocumentType(type) {
  if (!type) return false;
  return ALLOWED_DOCUMENTS.includes(type.toUpperCase());
}

/* ---------- 4. DOCUMENT NUMBER VALIDATION ---------- */
export function validateDocumentNumber(type, number) {
  if (!type || !number) return false;

  const docType = type.toUpperCase();
  const value = number.toString().trim().toUpperCase();

  switch (docType) {
    case "AADHAAR CARD":
      return /^\d{12}$/.test(value);

    case "PAN CARD":
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);

    case "PASSPORT":
      return /^[A-Z][0-9]{7}$/.test(value);

    case "DRIVING LICENSE":
    case "VOTER ID":
      return value.length >= 6;

    default:
      return false;
  }
}

/* ---------- 5. NON-NEGATIVE NUMBER VALIDATION ---------- */
export function validateNonNegativeNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/* ---------- 6. DISCOUNT VALIDATION (0–100%) ---------- */
export function validateDiscountPercent(discount) {
  const num = Number(discount);
  return !isNaN(num) && num >= 0 && num <= 100;
}

/* ---------- 7. REQUIRED FIELD VALIDATION ---------- */
export function validateRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

/* ---------- 8. SAFE NUMBER (NO NaN / NO NEGATIVE) ---------- */
export function validateSafeAmount(value) {
  const num = Number(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
}

/* ---------- 9. CAPITALIZE INPUT ---------- */
export function toUppercaseValue(value) {
  if (typeof value !== "string") return value;
  return value.toUpperCase();
}

/* ---------- 10. GSTIN VALIDATION ---------- */
export function validateGSTIN(gstin) {
  if (!gstin) return true; // OPTIONAL field (company billing only)

  const value = gstin.toString().trim().toUpperCase();

  const GSTIN_REGEX =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return GSTIN_REGEX.test(value);
}

/* ---------- 11. AUTO CAPITALIZE INPUT (ON TYPE) ---------- */
/* ---------- 11. AUTO CAPITALIZE INPUT (ON TYPE) ---------- */
export function handleUppercaseInput(event, onChange) {
  const { name, value } = event.target;

  onChange({
    [name]: typeof value === "string" ? value.toUpperCase() : value,
  });
}


/* =========================================
   HUMAN READABLE VALIDATION MESSAGES
========================================= */

export const validationMessages = {
  phone: "Please enter a valid 10-digit mobile number.",
  gstin: "GSTIN format is incorrect. Example: 22AAAAA0000A1Z5",
  discountPercent: "Discount must be between 0% and 100%.",
  negativeAmount: "Amount cannot be negative.",
  required: "This field is required.",
  documentType: "Please select a valid ID proof type.",
  documentNumber: "Entered ID number does not match the selected ID type.",
  advanceExceeded: "Advance amount cannot be more than the total bill.",
  pastDate: "Selected date cannot be in the past.",
  checkoutBeforeCheckin: "Check-out date must be after check-in.",
};
