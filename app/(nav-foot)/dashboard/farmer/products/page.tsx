"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, X, Check, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  image_url?: string;
}

export default function ManageProductsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    unit: "",
    category: "",
    image_url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Meats & Seafood",
    "Grains & Legumes",
    "Bakery",
    "Beverages",
    "Herbs & Spices",
    "Artisanal",
    "Exotic",
    "Poultry",
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/registration-type");
      return;
    }
    if (!isLoading && isAuthenticated && user?.accountType !== "farmer") {
      router.push("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isAuthenticated || user?.accountType !== "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/farmer");
          return;
        }

        const response = await fetch("/api/farmer/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          setError("Failed to load products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType === "farmer") {
      fetchProducts();
    }
  }, [user, isAuthenticated, router]);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditingProduct({
      name: product.name,
      price: product.price,
      unit: product.unit,
      category: product.category,
      image_url: product.image_url || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingProduct({});
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/farmer/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingProduct.name,
          price: parseFloat(editingProduct.price as any),
          unit: editingProduct.unit,
          category: editingProduct.category,
          image_url: editingProduct.image_url || null,
        }),
      });

      if (response.ok) {
        const updatedProducts = products.map((p) =>
          p.id === id
            ? {
                ...p,
                name: editingProduct.name!,
                price: parseFloat(editingProduct.price as any),
                unit: editingProduct.unit!,
                category: editingProduct.category!,
                image_url: editingProduct.image_url,
              }
            : p
        );
        setProducts(updatedProducts);
        setEditingId(null);
        setEditingProduct({});
        setSuccess("Product updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update product");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/farmer/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id));
        setSuccess("Product deleted successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete product");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.unit || !newProduct.category) {
      setError("Please fill in all required fields");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/farmer/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          unit: newProduct.unit,
          category: newProduct.category,
          image_url: newProduct.image_url || null,
        }),
      });

      if (response.ok) {
        const product = await response.json();
        setProducts([...products, product]);
        setNewProduct({
          name: "",
          price: "",
          unit: "",
          category: "",
          image_url: "",
        });
        setShowAddForm(false);
        setSuccess("Product added successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add product");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add product");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.accountType !== "farmer") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 py-12">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/home/pattern-light.svg')] opacity-10"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/farmer"
            className="inline-flex items-center text-green-700 hover:text-green-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">
              Manage Products
            </h1>
            <p className="text-lg text-gray-600">
              View, edit, and manage your farm's products
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Products ({products.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Organic Tomatoes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 2.50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <input
                  type="text"
                  value={newProduct.unit}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, unit: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 1 kg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: "1 kg", "2 liters", "6 units", etc.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={newProduct.image_url}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewProduct({
                    name: "",
                    price: "",
                    unit: "",
                    category: "",
                    image_url: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Product
              </button>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-600 mb-4">No products found.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {editingId === product.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingProduct.name || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              value={editingProduct.price || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  price: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingProduct.unit || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  unit: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editingProduct.category || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  category: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveEdit(product.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              £{product.price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{product.unit}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

