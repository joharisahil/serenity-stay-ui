import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getCategoriesApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "@/api/menuApi";
import { Edit, Trash2, ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EditCategoriesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadCategories = async () => {
    try {
      const list = await getCategoriesApi();
      setCategories(list);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  // Load on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const startEdit = (category: any) => {
    setEditingId(category._id);
    setEditName(category.name);
  };

  const saveEdit = async (id: string) => {
    try {
      await updateCategoryApi(id, { name: editName });
      toast.success("Category updated");
      setEditingId(null);
      loadCategories();
    } catch {
      toast.error("Update failed");
    }
  };

  const deleteCat = async (id: string) => {
    try {
      await deleteCategoryApi(id);
      toast.success("Category deleted");
      loadCategories();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/menu")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Categories</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between border rounded p-3"
                >
                  {editingId === cat._id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs"
                    />
                  ) : (
                    <p className="font-medium">{cat.name}</p>
                  )}

                  <div className="flex gap-2">
                    {editingId === cat._id ? (
                      <Button
                        size="sm"
                        onClick={() => saveEdit(cat._id)}
                      >
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(cat)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCat(cat._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
