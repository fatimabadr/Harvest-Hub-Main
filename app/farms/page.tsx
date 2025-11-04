"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Tractor, MapPin, Package, ArrowRight } from "lucide-react";

interface Farm {
  id: number;
  name: string;
  description: string;
  address: string;
  productCount: number;
}

export default function FarmsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await fetch("/api/farms");
        if (response.ok) {
          const data = await response.json();
          setFarms(data);
        }
      } catch (error) {
        console.error("Error fetching farms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/home/pattern-light.svg')] opacity-10"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
              Our Farms
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-green-900 mb-6 leading-tight">
              Meet Our Farmers
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover our network of local farms and the fresh produce they offer
            </p>
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {farms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Tractor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No farms found
            </h2>
            <p className="text-gray-600">Check back soon for new farms!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {farms.map((farm) => (
              <Link
                key={farm.id}
                href={`/farms/${farm.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <Tractor className="h-16 w-16 text-green-600" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {farm.name}
                    </h3>
                    <div className="flex items-center gap-1 text-green-600">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {farm.productCount}
                      </span>
                    </div>
                  </div>
                  {farm.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {farm.description}
                    </p>
                  )}
                  {farm.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{farm.address}</span>
                    </div>
                  )}
                  <div className="flex items-center text-green-600 font-semibold text-sm">
                    View Products
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

