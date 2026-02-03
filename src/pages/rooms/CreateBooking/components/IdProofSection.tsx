import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, IdCard, User, AlertCircle, Check } from "lucide-react";
import {
  handleUppercaseInput,
  validateDocumentType,
  validateDocumentNumber,
} from "../../../../validators/validator.js";
import { useState } from "react";
interface IdProof {
  type: string;
  idNumber: string;
  nameOnId: string;
}

interface IdProofSectionProps {
  idProofs: IdProof[];
  onChange: (idProofs: IdProof[]) => void;
}

const ID_TYPES = [
  { value: "Aadhaar Card", label: "Aadhaar Card" },
  { value: "Driving License", label: "Driving License" },
  { value: "Passport", label: "Passport" },
  { value: "Voter ID", label: "Voter ID" },
  { value: "PAN Card", label: "PAN Card" },
];
// ================== ID TYPE MAPPER ==================

const ID_TYPE_API_TO_UI: Record<string, string> = {
  "AADHAAR CARD": "Aadhaar Card",
  "DRIVING LICENSE": "Driving License",
  PASSPORT: "Passport",
  "VOTER ID": "Voter ID",
  "PAN CARD": "PAN Card",
};

const ID_TYPE_UI_TO_API: Record<string, string> = {
  "Aadhaar Card": "AADHAAR CARD",
  "Driving License": "DRIVING LICENSE",
  Passport: "PASSPORT",
  "Voter ID": "VOTER ID",
  "PAN Card": "PAN CARD",
};

export function IdProofSection({ idProofs, onChange }: IdProofSectionProps) {
  type IdStatus = "idle" | "invalid" | "valid";
  const normalizedIdProofs = idProofs.map((proof) => ({
    ...proof,
    type: ID_TYPE_API_TO_UI[proof.type] ?? proof.type ?? "",
  }));
  const [idStatusMap, setIdStatusMap] = useState<Record<number, IdStatus>>({});
  const setStatus = (index: number, status: IdStatus) => {
    setIdStatusMap((prev) => ({ ...prev, [index]: status }));
  };

  const canAddMore = idProofs.every((proof, i) => idStatusMap[i] === "valid");

  const addIdProof = () => {
    onChange([...idProofs, { type: "", idNumber: "", nameOnId: "" }]);
  };

  const updateIdProof = (index: number, updates: Partial<IdProof>) => {
    const updated = [...idProofs];

    updated[index] = {
      ...updated[index],
      ...updates,
      type: updates.type
        ? (ID_TYPE_UI_TO_API[updates.type] ?? updates.type)
        : updated[index].type,
    };

    onChange(updated);
  };

  const removeIdProof = (index: number) => {
    onChange(idProofs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {idProofs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
          No ID proofs added. Add at least one for check-in.
        </p>
      )}

      {normalizedIdProofs.map((proof, idx) => (
        <div key={idx} className="id-proof-row animate-fade-in">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="erp-field">
              <Label className="erp-label">
                <IdCard className="inline h-3 w-3 mr-1" />
                ID Type
              </Label>
              <Select
                value={proof.type}
                onValueChange={(v) => {
                  updateIdProof(idx, { type: v, idNumber: "" });
                  setStatus(idx, "idle");
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select ID" />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="erp-field">
              <Label className="erp-label">ID Number</Label>

              <div className="relative">
                <Input
                  name="idNumber"
                  className={`h-9 pr-10 ${
                    idStatusMap[idx] === "invalid"
                      ? "border-red-500 focus-visible:ring-red-500"
                      : idStatusMap[idx] === "valid"
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                  }`}
                  placeholder="Enter ID number"
                  value={proof.idNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    updateIdProof(idx, { idNumber: value });
                    setStatus(idx, "idle");
                  }}
                  onBlur={() => {
                    if (!proof.idNumber || !proof.type) {
                      setStatus(idx, "idle");
                      return;
                    }

                    if (
                      validateDocumentType(proof.type) &&
                      validateDocumentNumber(proof.type, proof.idNumber)
                    ) {
                      setStatus(idx, "valid");
                    } else {
                      setStatus(idx, "invalid");
                    }
                  }}
                />

                {idStatusMap[idx] === "invalid" && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}

                {idStatusMap[idx] === "valid" && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>

              {idStatusMap[idx] === "invalid" && (
                <p className="text-xs text-red-500 mt-1">
                  Invalid {proof.type || "ID"} number
                </p>
              )}
            </div>

            <div className="erp-field">
              <Label className="erp-label">
                <User className="inline h-3 w-3 mr-1" />
                Name on ID
              </Label>
              <Input
                className="h-9"
                placeholder="As printed on ID"
                value={proof.nameOnId}
                onChange={(e) =>
                  updateIdProof(idx, { nameOnId: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
            onClick={() => removeIdProof(idx)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addIdProof}
        disabled={!canAddMore}
        className="w-full mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add ID Proof
      </Button>
    </div>
  );
}
