"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Tractor, MapPin, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string | null;
}

interface Farm {
  id: number;
  name: string;
  description: string;
  address: string;
  products: Product[];
}

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const farmId = params.id;
        const response = await fetch(`/api/farms/${farmId}`);
        if (response.ok) {
          const data = await response.json();
          setFarm(data);
        } else {
          console.error("Failed to fetch farm");
        }
      } catch (error) {
        console.error("Error fetching farm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchFarm();
    }
  }, [params.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">Farm not found</p>
          <Link
            href="/farms"
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← Back to Farms
          </Link>
        </div>
      </div>
    );
  }

  const categories = Array.from(
    new Set(farm.products.map((p) => p.category))
  ).sort();

  const filteredProducts =
    selectedCategory === "all"
      ? farm.products
      : farm.products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/home/pattern-light.svg')] opacity-10"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/farms"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Farms
          </Link>
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white rounded-xl shadow-sm">
              <Tractor className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">
                {farm.name}
              </h1>
              {farm.description && (
                <p className="text-lg text-gray-700 mb-4 max-w-2xl">
                  {farm.description}
                </p>
              )}
              {farm.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5" />
                  <span>{farm.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === "all"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All ({farm.products.length})
              </button>
              {categories.map((category) => {
                const count = farm.products.filter(
                  (p) => p.category === category
                ).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedCategory === category
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)} (
                    {count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Products ({filteredProducts.length})
          </h2>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products in this category
              </h3>
              <p className="text-gray-600">Try selecting a different category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          £{product.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          per {product.unit}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

