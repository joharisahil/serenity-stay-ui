// import { Layout } from "@/components/layout/Layout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Package, AlertTriangle, TrendingDown, Plus } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const stats = [
//   { title: "Total Items", value: "248", icon: Package, color: "text-primary" },
//   { title: "Low Stock Items", value: "12", icon: AlertTriangle, color: "text-warning" },
//   { title: "Out of Stock", value: "3", icon: TrendingDown, color: "text-destructive" },
// ];

// const lowStockItems = [
//   { name: "Towels", current: 15, minimum: 50, category: "Linens" },
//   { name: "Bed Sheets", current: 20, minimum: 40, category: "Linens" },
//   { name: "Soap Bars", current: 25, minimum: 100, category: "Toiletries" },
//   { name: "Shampoo Bottles", current: 30, minimum: 80, category: "Toiletries" },
//   { name: "Tissue Boxes", current: 18, minimum: 60, category: "Supplies" },
// ];

// const categoryStats = [
//   { name: "Linens", items: 85, value: "35%" },
//   { name: "Toiletries", items: 62, value: "25%" },
//   { name: "Supplies", items: 48, value: "19%" },
//   { name: "Food Items", items: 53, value: "21%" },
// ];

// export default function InventoryDashboard() {
//   const navigate = useNavigate();

//   return (
//     <Layout>
//       <div className="space-y-6">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
//             <p className="text-muted-foreground">Monitor and manage inventory stock</p>
//           </div>
//           <div className="flex gap-2">
//             <Button variant="outline" onClick={() => navigate("/inventory/list")}>
//               View All Items
//             </Button>
//             <Button onClick={() => navigate("/inventory/add")}>
//               <Plus className="mr-2 h-4 w-4" />
//               Add Item
//             </Button>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid gap-4 md:grid-cols-3">
//           {stats.map((stat) => (
//             <Card key={stat.title}>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
//                 <stat.icon className={`h-4 w-4 ${stat.color}`} />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stat.value}</div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         <div className="grid gap-6 lg:grid-cols-2">
//           {/* Low Stock Alerts */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <AlertTriangle className="h-5 w-5 text-warning" />
//                 Low Stock Alerts
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {lowStockItems.map((item) => (
//                   <div
//                     key={item.name}
//                     className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 p-3"
//                   >
//                     <div className="space-y-1">
//                       <p className="font-medium">{item.name}</p>
//                       <p className="text-sm text-muted-foreground">{item.category}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-bold text-warning">{item.current} left</p>
//                       <p className="text-xs text-muted-foreground">Min: {item.minimum}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Category Breakdown */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Category Breakdown</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {categoryStats.map((category) => (
//                   <div key={category.name} className="space-y-2">
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="font-medium">{category.name}</span>
//                       <span className="text-muted-foreground">{category.items} items ({category.value})</span>
//                     </div>
//                     <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
//                       <div
//                         className="h-full bg-primary transition-all"
//                         style={{ width: category.value }}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </Layout>
//   );
// }
