import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, FileText } from "lucide-react";

interface CompanyFormProps {
  formData: {
    companyName: string;
    companyGSTIN: string;
    companyAddress: string;
  };
  onChange: (updates: Partial<CompanyFormProps["formData"]>) => void;
}

export function CompanyForm({ formData, onChange }: CompanyFormProps) {
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
            placeholder="Company / Organization"
            value={formData.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </div>

        <div className="erp-field">
          <Label className="erp-label">
            <FileText className="inline h-3.5 w-3.5 mr-1" />
            GSTIN
          </Label>
          <Input
            placeholder="22AAAAA0000A1Z5"
            value={formData.companyGSTIN}
            onChange={(e) => onChange({ companyGSTIN: e.target.value.toUpperCase() })}
            maxLength={15}
          />
        </div>
      </div>

      <div className="erp-field">
        <Label className="erp-label">Company Address</Label>
        <Textarea
          rows={2}
          placeholder="Registered office address"
          value={formData.companyAddress}
          onChange={(e) => onChange({ companyAddress: e.target.value })}
        />
      </div>
    </div>
  );
}
