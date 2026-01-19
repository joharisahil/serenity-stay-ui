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
import { Plus, Trash2, IdCard, User } from "lucide-react";

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

export function IdProofSection({ idProofs, onChange }: IdProofSectionProps) {
  const addIdProof = () => {
    onChange([...idProofs, { type: "", idNumber: "", nameOnId: "" }]);
  };

  const updateIdProof = (index: number, updates: Partial<IdProof>) => {
    const updated = [...idProofs];
    updated[index] = { ...updated[index], ...updates };
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

      {idProofs.map((proof, idx) => (
        <div key={idx} className="id-proof-row animate-fade-in">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="erp-field">
              <Label className="erp-label">
                <IdCard className="inline h-3 w-3 mr-1" />
                ID Type
              </Label>
              <Select
                value={proof.type}
                onValueChange={(v) => updateIdProof(idx, { type: v })}
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
              <Input
                className="h-9"
                placeholder="Enter ID number"
                value={proof.idNumber}
                onChange={(e) => updateIdProof(idx, { idNumber: e.target.value })}
              />
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
                onChange={(e) => updateIdProof(idx, { nameOnId: e.target.value })}
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
        className="w-full mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add ID Proof
      </Button>
    </div>
  );
}
