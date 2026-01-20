// import { useState } from "react";
// import { Advance } from "../BookingDetails.types";

// export function useAdvancePayments() {
//   const [advances, setAdvances] = useState<Advance[]>([]);

//   const addAdvance = () => {
//     setAdvances([
//       ...advances,
//       { amount: 0, mode: "CASH", date: "", note: "" },
//     ]);
//   };

//   const updateAdvance = (index: number, key: string, value: any) => {
//     const copy = [...advances];
//     copy[index] = { ...copy[index], [key]: value };
//     setAdvances(copy);
//   };

//   const removeAdvance = (index: number) => {
//     setAdvances(advances.filter((_, i) => i !== index));
//   };

//   const totalAdvance = advances.reduce(
//     (sum, a) => sum + (Number(a.amount) || 0),
//     0
//   );

//   return {
//     advances,
//     addAdvance,
//     updateAdvance,
//     removeAdvance,
//     totalAdvance,
//   };
// }



/*new v1*/
// import { useEffect,useState } from "react";
// import { Advance } from "../BookingDetails.types";

// export function useAdvancePayments(initialAdvances: Advance[] = []) {
//   const [advances, setAdvances] = useState<Advance[]>(initialAdvances);

//     useEffect(() => {
//     setAdvances(initialAdvances || []);
//   }, [initialAdvances]);

//   const addAdvance = () => {
//     setAdvances((prev) => [
//       ...prev,
//       {
//         amount: 0,
//         mode: "CASH",
//         date: "",
//         note: "",
//       },
//     ]);
//   };

//   const updateAdvance = (
//     index: number,
//     key: keyof Advance,
//     value: any
//   ) => {
//     setAdvances((prev) =>
//       prev.map((a, i) => (i === index ? { ...a, [key]: value } : a))
//     );
//   };

//   const removeAdvance = (index: number) => {
//     setAdvances((prev) => prev.filter((_, i) => i !== index));
//   };

//   const totalAdvance = advances.reduce(
//     (sum, a) => sum + (Number(a.amount) || 0),
//     0
//   );

//   return {
//     advances,
//     setAdvances,
//     addAdvance,
//     updateAdvance,
//     removeAdvance,
//     totalAdvance,
//   };
// }


/*v2 */
import { useEffect, useState } from "react";
import { Advance } from "../BookingDetails.types";

export function useAdvancePayments(initialAdvances: Advance[] = []) {
  const [advances, setAdvances] = useState<Advance[]>(initialAdvances);

  useEffect(() => {
    setAdvances(initialAdvances);
  }, [initialAdvances]);

  const addAdvance = () => {
    setAdvances((prev) => [
      ...prev,
      { amount: 0, mode: "CASH", date: "", note: "" },
    ]);
  };

  const updateAdvance = (index: number, key: keyof Advance, value: any) => {
    setAdvances((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [key]: value } : a))
    );
  };

  const removeAdvance = (index: number) => {
    setAdvances((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAdvance = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  return {
    advances,
    setAdvances,
    addAdvance,
    updateAdvance,
    removeAdvance,
    totalAdvance,
  };
}
