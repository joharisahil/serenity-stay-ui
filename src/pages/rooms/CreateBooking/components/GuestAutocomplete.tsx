interface Props {
  items: any[];
  onSelect: (guest: any) => void;
}

export function GuestAutocomplete({ items, onSelect }: Props) {
  if (!items.length) return null;

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
        </div>
      ))}
    </div>
  );
}
