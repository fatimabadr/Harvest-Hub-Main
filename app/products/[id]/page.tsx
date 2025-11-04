"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { Package, ArrowLeft, Plus, Minus, ShoppingCart, Tractor, MapPin, Check } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string | null;
  farmId: number;
  farmName: string;
  description?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { addToCart, cartItems } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = params.id;
        if (!productId) {
          setLoading(false);
          return;
        }
        const response = await fetch(`/api/products?limit=1000`);
        if (response.ok) {
          const products = await response.json();
          const foundProduct = products.find((p: Product) => p.id.toString() === productId.toString());
          
          if (foundProduct) {
            setProduct({
              ...foundProduct,
              imageUrl: foundProduct.imageUrl || null,
            });
            
            
            const farmResponse = await fetch(`/api/farms/${foundProduct.farmId}`);
            if (farmResponse.ok) {
              const farmData = await farmResponse.json();
              setFarm(farmData);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const cartItem = cartItems.find((item) => item.productId === product?.id);
  const currentQuantity = cartItem?.quantity || 0;

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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">Product not found</p>
          <Link
            href="/"
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center p-8">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="h-32 w-32 text-gray-400" />
              )}
            </div>
          </div>

          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mb-3">
                {product.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              {farm && (
                <Link
                  href={`/farms/${product.farmId}`}
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4"
                >
                  <Tractor className="h-4 w-4" />
                  <span className="font-medium">{product.farmName}</span>
                </Link>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-green-600">
                  £{product.price.toFixed(2)}
                </span>
                <span className="text-gray-500">per {product.unit}</span>
              </div>
            </div>

            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, val));
                    }}
                    className="w-16 text-center border-0 focus:ring-0"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-bold text-green-600">£{(product.price * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>

            
            <div className="space-y-3 mb-6">
              <button
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all ${
                  addedToCart
                    ? "bg-green-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </button>
              
              {currentQuantity > 0 && (
                <div className="text-center text-sm text-gray-600">
                  {currentQuantity} in cart
                </div>
              )}
            </div>

            
            {farm && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">About the Farm</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Tractor className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="font-medium">{farm.name}</span>
                  </div>
                  {farm.description && (
                    <p className="text-gray-600">{farm.description}</p>
                  )}
                  {farm.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{farm.address}</span>
                    </div>
                  )}
                  <Link
                    href={`/farms/${farm.id}`}
                    className="inline-block text-green-600 hover:text-green-700 font-medium mt-2"
                  >
                    View all products from this farm →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

