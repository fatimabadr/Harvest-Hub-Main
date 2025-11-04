"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { 
  Package, Tractor, Plus, Check, ArrowRight, Search, 
  Leaf, Truck, Recycle, Apple, Milk, Wheat, Beef, Coffee,
  Sparkles, MapPin, Star, TrendingUp
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string | null;
  farmId: number;
  farmName: string;
}

const categoryIcons: Record<string, any> = {
  "fruits": Apple,
  "vegetables": Leaf,
  "dairy": Milk,
  "grains & legumes": Wheat,
  "meats & seafood": Beef,
  "beverages": Coffee,
  "bakery": Wheat,
  "artisanal": Sparkles,
  "herbs & spices": Leaf,
  "poultry": Beef,
  "exotic": Star,
};

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?limit=100");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          
          const uniqueCategories = Array.from(
            new Set(data.map((p: Product) => p.category))
          ).sort() as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  
  useEffect(() => {
    setIsSearchActive(searchQuery.length > 0);
  }, [searchQuery]);

  
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.farmName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  
  const featuredProducts = filteredProducts.slice(0, 12);

  
  const getCategoryDisplayName = (category: string) => {
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCategoryIcon = (category: string) => {
    const key = category.toLowerCase();
    return categoryIcons[key] || Package;
  };

  if (isLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      
      <div className={`relative bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white overflow-hidden transition-all duration-500 ease-in-out ${
        isSearchActive ? 'max-h-0 opacity-0 -mt-16' : 'max-h-screen opacity-100'
      }`}>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 overflow-hidden ${
          isSearchActive ? 'py-0' : 'py-16 md:py-24'
        }`}>
          <div className="text-center max-w-3xl mx-auto">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6 transition-all duration-500 ${
              isSearchActive ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto mb-6'
            }`}>
              <Sparkles className="h-4 w-4" />
              Fresh from Farm to Door
            </div>
            
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight transition-all duration-500 ${
              isSearchActive ? 'opacity-0 h-0 mb-0 text-2xl' : 'opacity-100 h-auto mb-6'
            }`}>
              Fresh from Farm to Door
            </h1>
            
            <p className={`text-lg md:text-xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-500 ${
              isSearchActive ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto mb-10'
            }`}>
              Shop locally sourced fruits, vegetables, dairy, and more from our trusted network of sustainable farms.
            </p>

            
            <div className={`max-w-2xl mx-auto mb-10 transition-all duration-500 ${
              isSearchActive ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto mb-10'
            }`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg border-0 shadow-lg text-gray-900 focus:ring-2 focus:ring-white/50 focus:outline-none text-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            
            <div className={`flex flex-wrap justify-center gap-4 transition-all duration-500 ${
              isSearchActive ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto mb-0'
            }`}>
              <Link
                href="#products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl"
              >
                Shop Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-all border-2 border-white/30"
              >
                <Package className="h-5 w-5" />
                View Subscriptions
              </Link>
            </div>
          </div>
        </div>
      </div>

      
      <div className={`bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 shadow-lg transition-all duration-500 ${
        isSearchActive ? 'opacity-100 max-h-20 py-4' : 'opacity-0 max-h-0 py-0 overflow-hidden pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for products, farms, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none text-base"
              autoFocus={isSearchActive}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      
      <div className={`bg-white border-b border-gray-200 sticky z-20 shadow-sm transition-all duration-500 ${
        isSearchActive ? 'top-16' : 'top-0'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-green-600 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Package className="h-6 w-6" />
              <span className="text-xs">All</span>
            </button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-green-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:border-green-200 border-2 border-transparent"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center max-w-[80px] truncate">
                    {getCategoryDisplayName(category)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      
      <section id="products" className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
        isSearchActive ? 'py-6 md:py-8' : 'py-12 md:py-16'
      }`}>
        <div className={`mb-8 transition-all duration-500 ${
          isSearchActive ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100 h-auto mb-8'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {selectedCategory === "all" ? "Featured Products" : `${getCategoryDisplayName(selectedCategory)} Products`}
            </h2>
            {filteredProducts.length > 0 && (
              <span className="text-gray-600 font-medium">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </span>
            )}
          </div>
          <p className="text-gray-600">
            {selectedCategory === "all" 
              ? "Discover our handpicked selection of fresh, local produce" 
              : `Browse our selection of ${getCategoryDisplayName(selectedCategory).toLowerCase()}`}
          </p>
        </div>

        
        {isSearchActive && (
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {filteredProducts.length > 0 
                  ? `Search Results for "${searchQuery}"` 
                  : `No results for "${searchQuery}"`}
              </h2>
              {filteredProducts.length > 0 && (
                <span className="text-gray-600 font-medium">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "product found" : "products found"}
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {filteredProducts.length > 0 
                ? "Here's what we found for you"
                : "Try adjusting your search terms or browse our categories"}
            </p>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-16 text-center transition-all duration-500 ${
            isSearchActive ? 'animate-fadeIn' : ''
          }`}>
            <Package className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? "Try a different search term" : "Try selecting a different category"}
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 transition-all duration-500 ${
            isSearchActive ? 'animate-fadeIn' : ''
          }`}>
            {featuredProducts.map((product, index) => {
              const isAdded = addedItems.has(product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group animate-fadeInUp"
                  style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-gray-300" />
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-full shadow-sm">
                          {getCategoryDisplayName(product.category)}
                        </span>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-5">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-green-600 transition-colors min-h-[3rem]">
                        {product.name}
                      </h3>
                    </Link>
                    <Link
                      href={`/farms/${product.farmId}`}
                      className="text-sm text-gray-500 hover:text-green-600 transition-colors mb-3 flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      {product.farmName}
                    </Link>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-green-600">
                        £{product.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        per {product.unit}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product, 1);
                        setAddedItems((prev) => new Set(prev).add(product.id));
                        setTimeout(() => {
                          setAddedItems((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(product.id);
                            return newSet;
                          });
                        }, 2000);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                        isAdded
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200 hover:border-green-300"
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-5 w-5" />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      
      <section className={`bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 py-16 md:py-20 transition-all duration-500 ${
        isSearchActive ? 'opacity-0 h-0 py-0 overflow-hidden' : 'opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium mb-6">
                <TrendingUp className="h-4 w-4" />
                Best Value
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Weekly Farm Box
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Handpicked seasonal produce delivered fresh to your door every week. 
                Support local farms while enjoying the best of what's in season.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Seasonal, locally-sourced produce</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Flexible delivery schedule</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Save up to 20% compared to individual purchases</span>
                </li>
              </ul>
              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                Subscribe Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-green-200">
                <div className="aspect-square bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <Package className="h-32 w-32 text-green-600 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className={`bg-white py-16 md:py-20 transition-all duration-500 ${
        isSearchActive ? 'opacity-0 h-0 py-0 overflow-hidden' : 'opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Harvest Hub?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to bringing you the freshest, most sustainable produce from local farms
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Locally Sourced
              </h3>
              <p className="text-gray-600">
                All products come directly from nearby farms, ensuring freshness and supporting local agriculture.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Recycle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sustainable Farms
              </h3>
              <p className="text-gray-600">
                We partner with farms that prioritize sustainable and eco-friendly farming practices.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Freshly Delivered
              </h3>
              <p className="text-gray-600">
                Fast and reliable delivery to your door, keeping your produce as fresh as the day it was harvested.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
