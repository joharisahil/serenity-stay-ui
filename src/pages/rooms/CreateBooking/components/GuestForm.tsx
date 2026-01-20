import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Phone, MapPin, Globe } from "lucide-react";

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
            placeholder="Full name as per ID"
            value={formData.guestName}
            onFocus={() => onFieldFocus("name")}
            onChange={(e) => {
              onFieldFocus("name");
              onChange({ guestName: e.target.value });
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
              className="pl-9"
              placeholder="+91 9876543210"
              value={formData.guestPhone}
              onFocus={() => onFieldFocus("phone")}
              onChange={(e) => {
                onFieldFocus("phone");
                onChange({ guestPhone: e.target.value });
              }}
            />
          </div>

          {activeField === "phone" && (
            <GuestSuggestions
              items={suggestions}
              onSelect={(g) => {
                onSelectGuest(g);
                onFieldFocus(null);
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
            placeholder="City of residence"
            value={formData.guestCity}
            onChange={(e) => onChange({ guestCity: e.target.value })}
          />
        </div>

        <div className="erp-field">
          <Label className="erp-label">
            <Globe className="inline h-3.5 w-3.5 mr-1" />
            Nationality
          </Label>
          <Input
            placeholder="Indian"
            value={formData.guestNationality}
            onChange={(e) => onChange({ guestNationality: e.target.value })}
          />
        </div>
      </div>

      {/* ===============================
          Address
      ================================ */}
      <div className="erp-field">
        <Label className="erp-label">Address</Label>
        <Textarea
          rows={2}
          placeholder="Full residential address"
          value={formData.guestAddress}
          onChange={(e) => onChange({ guestAddress: e.target.value })}
        />
      </div>
    </div>
  );
}


// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Users, Phone, MapPin, Globe } from "lucide-react";

// interface GuestFormProps {
//   formData: {
//     guestName: string;
//     guestPhone: string;
//     guestCity: string;
//     guestNationality: string;
//     guestAddress: string;
//     adults: string;
//     children: string;
//   };
//   onChange: (updates: Partial<GuestFormProps["formData"]>) => void;
// }

// export function GuestForm({ formData, onChange }: GuestFormProps) {
//   return (
//     <div className="space-y-4">
//       {/* Primary Guest */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="erp-field">
//           <Label className="erp-label erp-required">Guest Name</Label>
//           <Input
//             placeholder="Full name as per ID"
//             value={formData.guestName}
//             onChange={(e) => onChange({ guestName: e.target.value })}
//           />
//         </div>

//         <div className="erp-field">
//           <Label className="erp-label erp-required">Mobile Number</Label>
//           <div className="relative">
//             <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               className="pl-9"
//               placeholder="+91 9876543210"
//               value={formData.guestPhone}
//               onChange={(e) => onChange({ guestPhone: e.target.value })}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Occupancy */}
//       <div className="grid grid-cols-2 gap-4">
//         <div className="erp-field">
//           <Label className="erp-label erp-required">
//             <Users className="inline h-3.5 w-3.5 mr-1" />
//             Adults
//           </Label>
//           <Input
//             type="number"
//             min={1}
//             max={10}
//             value={formData.adults}
//             onChange={(e) => onChange({ adults: e.target.value })}
//           />
//         </div>

//         <div className="erp-field">
//           <Label className="erp-label">Children</Label>
//           <Input
//             type="number"
//             min={0}
//             max={10}
//             value={formData.children}
//             onChange={(e) => onChange({ children: e.target.value })}
//           />
//         </div>
//       </div>

//       {/* Location */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="erp-field">
//           <Label className="erp-label">
//             <MapPin className="inline h-3.5 w-3.5 mr-1" />
//             City
//           </Label>
//           <Input
//             placeholder="City of residence"
//             value={formData.guestCity}
//             onChange={(e) => onChange({ guestCity: e.target.value })}
//           />
//         </div>

//         <div className="erp-field">
//           <Label className="erp-label">
//             <Globe className="inline h-3.5 w-3.5 mr-1" />
//             Nationality
//           </Label>
//           <Input
//             placeholder="Indian"
//             value={formData.guestNationality}
//             onChange={(e) => onChange({ guestNationality: e.target.value })}
//           />
//         </div>
//       </div>

//       {/* Address */}
//       <div className="erp-field">
//         <Label className="erp-label">Address</Label>
//         <Textarea
//           rows={2}
//           placeholder="Full residential address"
//           value={formData.guestAddress}
//           onChange={(e) => onChange({ guestAddress: e.target.value })}
//         />
//       </div>
//     </div>
//   );
// }
