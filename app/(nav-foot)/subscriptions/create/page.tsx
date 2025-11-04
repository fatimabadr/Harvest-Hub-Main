"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import CreatePackage from "@/app/components/subscriptions/CreatePackage";
import PackageList from "@/app/components/subscriptions/PackageList";

export default function CreatePackagePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [farmId, setFarmId] = useState<string>("");
  const [farmData, setFarmData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login/farmer");
      return;
    }
    if (!isLoading && isAuthenticated && user?.accountType !== "farmer") {
      router.push("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchFarmData = async () => {
      if (!isAuthenticated || user?.accountType !== "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/farmer");
          return;
        }

        const response = await fetch("/api/farmer/farm", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFarmData(data);
          setFarmId(data.farm_id.toString());
        } else if (response.status === 404) {
          setFarmData(null);
        }
      } catch (error) {
        console.error("Error fetching farm data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType === "farmer") {
      fetchFarmData();
    }
  }, [user, isAuthenticated, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Create New Package
            </h1>
            <div className="mt-4 flex justify-center">
              <p className="text-xl leading-8 text-gray-600 max-w-2xl">
                Design your perfect package by selecting products from your farm. Make it unique and attractive for your customers.
              </p>
            </div>
          </div>

          {farmData && (
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-green-200">
              <h2 className="text-2xl font-bold text-green-900 mb-2">{farmData.farm_name}</h2>
              <p className="text-gray-600 mb-2">{farmData.description}</p>
              <p className="text-sm text-gray-500">📍 {farmData.address}</p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-b from-gray-50 to-white px-6">
                <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
              </span>
            </div>
          </div>

          <div className="mt-12 space-y-12">
            {farmId ? (
              <PackageList farmId={farmId} />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-yellow-800">
                  No farm linked to your account. Please contact support.
                </p>
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gradient-to-b from-gray-50 to-white px-6">
                  <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </span>
              </div>
            </div>

            <div className="mt-8">
              {farmId && farmData ? (
                <CreatePackage farmId={farmId} farmName={farmData.farm_name} />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                  <p className="text-yellow-800">
                    No farm linked to your account. Please contact support.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
