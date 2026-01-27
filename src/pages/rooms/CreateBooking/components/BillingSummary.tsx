import {
  Receipt,
  Percent,
  Calculator,
  CreditCard,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import {
  validateDiscountPercent,
  validateNonNegativeNumber,
  validationMessages,
} from "@/validators/validator";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import "../css/BillingSummary.css";
interface BillingSummaryProps {
  summary: {
    nights: number;
    roomPrice: number;
    extrasTotal: number;
    discountAmount: number;
    taxable: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
    balanceDue: number;
    roundOffAmount: number;
  };
  formData: {
    discount: string;
    discountAmountInput: string;
    discountScope: string;
    gstEnabled: string;
    roundOffEnabled: string;
    advanceAmount: string;
    advancePaymentMode: string;
    finalRoomPrice?: string;
  };
  onFormChange: (updates: Partial<BillingSummaryProps["formData"]>) => void;
}

export function BillingSummary({
  summary,
  formData,
  onFormChange,
}: BillingSummaryProps) {
  type FieldStatus = "idle" | "invalid";

  const [discountStatus, setDiscountStatus] = useState<FieldStatus>("idle");
  const [discountAmountStatus, setDiscountAmountStatus] =
    useState<FieldStatus>("idle");
  const [advanceStatus, setAdvanceStatus] = useState<FieldStatus>("idle");
  const [specialPriceStatus, setSpecialPriceStatus] =
    useState<FieldStatus>("idle");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const paymentModes = [
    { value: "CASH", label: "Cash", icon: Banknote },
    { value: "UPI", label: "UPI", icon: CreditCard },
    { value: "CARD", label: "Card", icon: CreditCard },
  ];

  return (
    <div className="billing-panel erp-billing sticky top-4">
      {/* Header */}
      <div className="billing-header">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Live Billing Summary
          </h2>
        </div>
      </div>
      {/* offer Pricing */}
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-primary uppercase tracking-wide">
            Offer Room Price
          </Label>

          {formData.finalRoomPrice && (
            <span className="text-[11px] font-medium text-primary">
              Offer pricing applied
            </span>
          )}
        </div>

        <Input
          type="number"
          min="0"
          className={`h-9 text-sm pr-10 ${
            specialPriceStatus === "invalid"
              ? "border-red-500 focus-visible:ring-red-500"
              : ""
          }`}
          placeholder="Final price per night (GST inclusive)"
          value={formData.finalRoomPrice || ""}
          onChange={(e) => {
            onFormChange({ finalRoomPrice: e.target.value });
            setSpecialPriceStatus("idle");
          }}
          onBlur={(e) => {
            if (!e.target.value) {
              setSpecialPriceStatus("idle");
            } else if (!validateNonNegativeNumber(e.target.value)) {
              setSpecialPriceStatus("invalid");
              toast.error(validationMessages.negativeAmount);
            }
          }}
        />

        {specialPriceStatus === "invalid" && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
        )}

        <p className="text-[11px] text-muted-foreground leading-tight">
          Overrides plan price. Amount includes CGST + SGST (5%). Leave empty to
          use standard plan pricing.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Charges Section */}
        <div className="space-y-1">
          <div className="billing-row">
            <span className="billing-row-label">
              Room Charges ({summary.nights} nights)
            </span>
            <span className="billing-row-value">
              {formatCurrency(summary.roomPrice)}
            </span>
          </div>
          <div className="billing-row">
            <span className="billing-row-label">Extra Services</span>
            <span className="billing-row-value">
              {formatCurrency(summary.extrasTotal)}
            </span>
          </div>
        </div>

        <div className="billing-divider" />

        {/* Discount Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Percent className="h-3.5 w-3.5" />
            Discount
          </div>

          <Select
            value={formData.discountScope}
            onValueChange={(v) => onFormChange({ discountScope: v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Apply on" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOTAL">Total Bill</SelectItem>
              <SelectItem value="ROOM">Room Only</SelectItem>
              <SelectItem value="EXTRAS">Extras Only</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">%</Label>
              <Input
                type="number"
                placeholder="0"
                className={`h-8 text-sm pr-10 ${
                  discountStatus === "invalid"
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
                value={formData.discount}
                disabled={!!formData.discountAmountInput}
                onChange={(e) => {
                  onFormChange({ discount: e.target.value });
                  setDiscountStatus("idle");
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    setDiscountStatus("idle");
                  } else if (!validateDiscountPercent(e.target.value)) {
                    setDiscountStatus("invalid");
                    toast.error(validationMessages.discountPercent);
                  }
                }}
              />

              {discountStatus === "invalid" && (
                <p className="text-xs text-red-500 mt-1">
                  Discount must be 0–100%
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">₹ Amount</Label>
              <Input
                type="number"
                placeholder="0"
                className={`h-8 text-sm ${
                  discountAmountStatus === "invalid"
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
                value={formData.discountAmountInput}
                disabled={!!formData.discount}
                onChange={(e) => {
                  onFormChange({ discountAmountInput: e.target.value });
                  setDiscountAmountStatus("idle");
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    setDiscountAmountStatus("idle");
                  } else if (!validateNonNegativeNumber(e.target.value)) {
                    setDiscountAmountStatus("invalid");
                    toast.error(validationMessages.negativeAmount);
                  }
                }}
              />

              {discountAmountStatus === "invalid" && (
                <p className="text-xs text-red-500 mt-1">
                  Amount cannot be negative
                </p>
              )}
            </div>
          </div>

          {summary.discountAmount > 0 && (
            <div className="billing-row text-erp-success">
              <span className="text-xs">Discount Applied</span>
              <span className="text-sm font-medium">
                -{formatCurrency(summary.discountAmount)}
              </span>
            </div>
          )}
        </div>

        <div className="billing-divider" />

        {/* Tax Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">
                GST
              </span>
            </div>
            <Switch
              checked={formData.gstEnabled === "true"}
              onCheckedChange={(checked) =>
                onFormChange({ gstEnabled: checked ? "true" : "false" })
              }
            />
          </div>

          {formData.gstEnabled === "true" && (
            <div className="pl-5 space-y-1 text-sm">
              <div className="billing-row">
                <span className="billing-row-label">CGST (2.5%)</span>
                <span className="billing-row-value">
                  {formatCurrency(summary.cgst)}
                </span>
              </div>
              <div className="billing-row">
                <span className="billing-row-label">SGST (2.5%)</span>
                <span className="billing-row-value">
                  {formatCurrency(summary.sgst)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="billing-divider" />

        {/* Round Off */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Round Off</span>
          <div className="flex items-center gap-2">
            {formData.roundOffEnabled === "true" &&
              summary.roundOffAmount !== 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {summary.roundOffAmount > 0 ? "+" : ""}
                  {formatCurrency(summary.roundOffAmount)}
                </span>
              )}
            <Switch
              checked={formData.roundOffEnabled === "true"}
              onCheckedChange={(checked) =>
                onFormChange({ roundOffEnabled: checked ? "true" : "false" })
              }
            />
          </div>
        </div>

        {/* Grand Total */}
        <div className="billing-grand-total">
          <span>Grand Total</span>
          <span className="text-primary">
            {formatCurrency(summary.grandTotal)}
          </span>
        </div>

        <div className="billing-divider" />

        {/* Payment Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <CreditCard className="h-3.5 w-3.5" />
            Advance Payment
          </div>

          <div className="flex gap-2">
            {paymentModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={`payment-mode flex-1 ${formData.advancePaymentMode === mode.value ? "selected" : ""}`}
                onClick={() => onFormChange({ advancePaymentMode: mode.value })}
              >
                <mode.icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Advance Received
            </Label>
            <Input
              type="number"
              placeholder="0"
              className={`h-9 text-sm ${
                advanceStatus === "invalid"
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }`}
              value={formData.advanceAmount}
              onChange={(e) => {
                onFormChange({ advanceAmount: e.target.value });
                setAdvanceStatus("idle");
              }}
              onBlur={(e) => {
                const value = Number(e.target.value);

                if (!e.target.value) {
                  setAdvanceStatus("idle");
                } else if (!validateNonNegativeNumber(value)) {
                  setAdvanceStatus("invalid");
                  toast.error(validationMessages.negativeAmount);
                } else if (value > summary.grandTotal) {
                  setAdvanceStatus("invalid");
                  toast.error(validationMessages.advanceExceeded);
                }
              }}
            />

            {advanceStatus === "invalid" && (
              <p className="text-xs text-red-500 mt-1">
                Advance cannot exceed Grand Total
              </p>
            )}
          </div>
        </div>

        {/* Balance Due */}
        <div
          className={`billing-balance ${summary.balanceDue > 0 ? "text-erp-warning" : "text-erp-success"}`}
        >
          <span>Balance Due</span>
          <span className="text-xl">{formatCurrency(summary.balanceDue)}</span>
        </div>
      </div>
    </div>
  );
}
