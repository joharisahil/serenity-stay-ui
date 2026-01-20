import { useEffect, useState } from "react";
import { searchGuestsApi } from "@/api/guestApi";

import { useDebounce } from "./useDebounce";
export function useGuestSearch(
  guestName: string,
  guestPhone: string
) {
  const [results, setResults] = useState<any[]>([]);
  const [activeField, setActiveField] =
    useState<"name" | "phone" | null>(null);

  const debouncedName = useDebounce(guestName, 400);
  const debouncedPhone = useDebounce(guestPhone, 400);

  useEffect(() => {
    if (activeField !== "name") return;
    if (!debouncedName) return;

    searchGuestsApi(debouncedName, "name").then(setResults);
  }, [debouncedName, activeField]);

  useEffect(() => {
    if (activeField !== "phone") return;
    if (!debouncedPhone) return;

    searchGuestsApi(debouncedPhone, "phone").then(setResults);
  }, [debouncedPhone, activeField]);

  return {
    results,
    activeField,
    setActiveField,
    clearResults: () => setResults([]),
  };
}
