import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, FileText } from "lucide-react";
import { handleUppercaseInput, validateGSTIN } from "../../../../validators/validator.js";
import { useState } from "react";
import { AlertCircle , ShieldCheck} from "lucide-react";


interface CompanyFormProps {
  formData: {
    companyName: string;
    companyGSTIN: string;
    companyAddress: string;
  };
  onChange: (updates: Partial<CompanyFormProps["formData"]>) => void;
}

export function CompanyForm({ formData, onChange }: CompanyFormProps) {
type GstinStatus = "idle" | "invalid" | "valid";

const [gstinStatus, setGstinStatus] = useState<GstinStatus>("idle");


  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Fill only if billing to a company or B2B guest
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="erp-field">
          <Label className="erp-label">
            <Building2 className="inline h-3.5 w-3.5 mr-1" />
            Company Name
          </Label>
          <Input
            name="companyName"
            placeholder="Company / Organization"
            value={formData.companyName}
            onChange={(e) => handleUppercaseInput(e, (data) => onChange(data))}
          />
        </div>

       <div className="erp-field">
  <Label className="erp-label">
    <FileText className="inline h-3.5 w-3.5 mr-1" />
    GSTIN
  </Label>

  <div className="relative">
    <Input
      name="companyGSTIN"
      placeholder="22AAAAA0000A1Z5"
      value={formData.companyGSTIN}
      maxLength={15}
      onChange={(e) => {
        handleUppercaseInput(e, onChange);
        setGstinStatus("idle");
      }}
      onBlur={(e) => {
        const value = e.target.value;
        if (!value) {
          setGstinStatus("idle");
        } else if (validateGSTIN(value)) {
          setGstinStatus("valid");
        } else {
          setGstinStatus("invalid");
        }
      }}
      className={
        gstinStatus === "invalid"
          ? "border-red-500 focus-visible:ring-red-500 pr-10"
          : gstinStatus === "valid"
          ? "border-green-500 focus-visible:ring-green-500 pr-10"
          : ""
      }
    />

    {gstinStatus === "invalid" && (
      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
    )}

    {gstinStatus === "valid" && (
      <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
    )}
  </div>

  {gstinStatus === "invalid" && (
    <p className="text-xs text-red-500 mt-1">
      Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)
    </p>
  )}
</div>


      </div>

      <div className="erp-field">
        <Label className="erp-label">Company Address</Label>
        <Textarea
          name="companyAddress"
          rows={2}
          placeholder="Registered office address"
          value={formData.companyAddress}
          onChange={(e) => handleUppercaseInput(e, (data) => onChange(data))}
        />
      </div>
    </div>
  );
}
