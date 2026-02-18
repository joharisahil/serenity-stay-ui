// import { Layout } from "@/components/layout/Layout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { ArrowLeft, Save } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { toast } from "sonner";

// export default function AddInventory() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     itemName: "",
//     category: "",
//     quantity: "",
//     minThreshold: "",
//     supplier: "",
//     purchasePrice: "",
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     toast.success("Inventory item added successfully!");
//     navigate("/inventory/list");
//   };

//   return (
//     <Layout>
//       <div className="space-y-6">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="icon" onClick={() => navigate("/inventory")}>
//             <ArrowLeft className="h-5 w-5" />
//           </Button>
//           <div>
//             <h1 className="text-3xl font-bold">Add Inventory Item</h1>
//             <p className="text-muted-foreground">Create a new inventory entry</p>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <Card>
//             <CardHeader>
//               <CardTitle>Item Details</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <div className="space-y-2">
//                   <Label htmlFor="itemName">Item Name *</Label>
//                   <Input
//                     id="itemName"
//                     required
//                     value={formData.itemName}
//                     onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="category">Category *</Label>
//                   <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select category" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="linens">Linens</SelectItem>
//                       <SelectItem value="toiletries">Toiletries</SelectItem>
//                       <SelectItem value="supplies">Supplies</SelectItem>
//                       <SelectItem value="food">Food Items</SelectItem>
//                       <SelectItem value="cleaning">Cleaning Products</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="quantity">Current Quantity *</Label>
//                   <Input
//                     id="quantity"
//                     type="number"
//                     min="0"
//                     required
//                     value={formData.quantity}
//                     onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="minThreshold">Minimum Threshold *</Label>
//                   <Input
//                     id="minThreshold"
//                     type="number"
//                     min="0"
//                     required
//                     value={formData.minThreshold}
//                     onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="supplier">Supplier Name</Label>
//                   <Input
//                     id="supplier"
//                     value={formData.supplier}
//                     onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
//                   <Input
//                     id="purchasePrice"
//                     type="number"
//                     min="0"
//                     value={formData.purchasePrice}
//                     onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="mt-6 flex justify-end gap-4">
//             <Button type="button" variant="outline" onClick={() => navigate("/inventory/list")}>
//               Cancel
//             </Button>
//             <Button type="submit">
//               <Save className="mr-2 h-4 w-4" />
//               Add Item
//             </Button>
//           </div>
//         </form>
//       </div>
//     </Layout>
//   );
// }
