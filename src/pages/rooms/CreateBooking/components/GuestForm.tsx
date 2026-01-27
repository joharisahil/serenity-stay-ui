import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { AlertCircle, Check, Users, Phone, MapPin, Globe } from "lucide-react";
import { handleUppercaseInput , validatePhoneNumber} from "../../../../validators/validator.js";
/* ===============================
   Types
================================ */

interface GuestFormProps {
  formData: {
    guestName: string;
    guestPhone: string;
    guestCity: string;
    guestNationality: string;
    guestAddress: string;
    adults: string;
    children: string;
  };

  onChange: (updates: Partial<GuestFormProps["formData"]>) => void;

  // 🔽 Autocomplete props (from CreateBooking)
  suggestions: any[];
  activeField: "name" | "phone" | null;
  onFieldFocus: (field: "name" | "phone" | null) => void;
  onSelectGuest: (guest: any) => void;
}

/* ===============================
   Dropdown Component
================================ */

function GuestSuggestions({
  items = [],
  onSelect,
}: {
  items?: any[];
  onSelect: (guest: any) => void;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
      {items.map((g, i) => (
        <div
          key={i}
          className="cursor-pointer px-3 py-2 hover:bg-muted"
          onClick={() => onSelect(g)}
        >
          <div className="font-medium">{g.guestName}</div>

          <div className="text-xs text-muted-foreground">
            📞 {g.guestPhone}
            {g.guestCity ? ` • ${g.guestCity}` : ""}
          </div>

          {g.guestAddress && (
            <div className="text-[11px] text-muted-foreground truncate">
              📍 {g.guestAddress}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ===============================
   Main Component
================================ */

export function GuestForm({
  formData,
  onChange,
  suggestions,
  activeField,
  onFieldFocus,
  onSelectGuest,
}: GuestFormProps) {
  type PhoneStatus = "idle" | "invalid" | "valid";

  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");

  return (
    <div className="space-y-4">
      {/* ===============================
          Guest Name & Phone
      ================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest Name */}
        <div className="erp-field relative">
          <Label className="erp-label erp-required">Guest Name</Label>
          <Input
            name="guestName"
            placeholder="Full name as per ID"
            value={formData.guestName}
            onFocus={() => onFieldFocus("name")}
            onChange={(e) => {
              onFieldFocus("name");
              handleUppercaseInput(e, onChange);
            }}
          />

          {activeField === "name" && (
            <GuestSuggestions
              items={suggestions}
              onSelect={(g) => {
                onSelectGuest(g);
                onFieldFocus(null);
              }}
            />
          )}
        </div>

        {/* Mobile Number */}
        <div className="erp-field relative">
          <Label className="erp-label erp-required">Mobile Number</Label>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              name="guestPhone"
              className={`pl-9 pr-10 ${
                phoneStatus === "invalid"
                  ? "border-red-500 focus-visible:ring-red-500"
                  : phoneStatus === "valid"
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
              }`}
              placeholder="XXXXXXXXXX"
              value={formData.guestPhone}
              onFocus={() => onFieldFocus("phone")}
              onChange={(e) => {
                onFieldFocus("phone");

                // allow only digits
                const value = e.target.value.replace(/\D/g, "");
                onChange({ guestPhone: value });

                setPhoneStatus("idle");
              }}
              onBlur={(e) => {
                if (!e.target.value) {
                  setPhoneStatus("idle");
                } else if (validatePhoneNumber(e.target.value)) {
                  setPhoneStatus("valid");
                } else {
                  setPhoneStatus("invalid");
                }
              }}
            />

            {phoneStatus === "invalid" && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            )}

            {phoneStatus === "valid" && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>

          {phoneStatus === "invalid" && (
            <p className="text-xs text-red-500 mt-1">
              Enter valid 10-digit Indian mobile number
            </p>
          )}

          {activeField === "phone" && (
            <GuestSuggestions
              items={suggestions}
              onSelect={(g) => {
                onSelectGuest(g);
                onFieldFocus(null);
                setPhoneStatus("valid");
              }}
            />
          )}
        </div>
      </div>

      {/* ===============================
          Occupancy
      ================================ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="erp-field">
          <Label className="erp-label erp-required">
            <Users className="inline h-3.5 w-3.5 mr-1" />
            Adults
          </Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={formData.adults}
            onChange={(e) => onChange({ adults: e.target.value })}
          />
        </div>

        <div className="erp-field">
          <Label className="erp-label">Children</Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={formData.children}
            onChange={(e) => onChange({ children: e.target.value })}
          />
        </div>
      </div>

      {/* ===============================
          Location
      ================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="erp-field">
          <Label className="erp-label">
            <MapPin className="inline h-3.5 w-3.5 mr-1" />
            City
          </Label>
          <Input
            name="guestCity"
            placeholder="City of residence"
            value={formData.guestCity}
            onChange={(e) => handleUppercaseInput(e, onChange)}
          />
        </div>

        <div className="erp-field">
          <Label className="erp-label">
            <Globe className="inline h-3.5 w-3.5 mr-1" />
            Nationality
          </Label>
          <Input
            name="guestNationality"
            placeholder="Indian"
            value={formData.guestNationality}
            onChange={(e) => handleUppercaseInput(e, onChange)}
          />
        </div>
      </div>

      {/* ===============================
          Address
      ================================ */}
      <div className="erp-field">
        <Label className="erp-label">Address</Label>
        <Textarea
          name="guestAddress"
          rows={2}
          placeholder="Full residential address"
          value={formData.guestAddress}
          onChange={(e) => handleUppercaseInput(e, onChange)}
        />
      </div>
    </div>
  );
}


