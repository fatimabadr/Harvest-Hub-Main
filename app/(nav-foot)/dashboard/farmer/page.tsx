"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Package, Edit, ShoppingBag, Settings } from "lucide-react";
import Link from "next/link";

export default function FarmerDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [farmData, setFarmData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/registration-type");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchFarmData = async () => {
      if (!user || user.accountType !== "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/farmer/farm", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFarmData(data);
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
  }, [user, isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.accountType !== "farmer") {
    return null;
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
              Farmer Dashboard
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-green-900 mb-6 leading-tight">
              Welcome Back, {user?.firstName || "Farmer"}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Manage your farm, products, and packages all in one place
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {farmData ? (
          <div className="mb-12 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-green-900 mb-2">{farmData.farm_name}</h2>
            <p className="text-gray-600 mb-4">{farmData.description}</p>
            <p className="text-sm text-gray-500">📍 {farmData.address}</p>
          </div>
        ) : (
          <div className="mb-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-yellow-800">
              No farm linked to your account yet. Please contact support.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/subscriptions/create">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="p-3 bg-green-100 rounded-full w-fit mb-4">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-900">Create Package</h3>
              <p className="text-gray-600 text-sm">Design new subscription packages for your customers</p>
            </div>
          </Link>

          <Link href="/dashboard/farmer/products">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="p-3 bg-green-100 rounded-full w-fit mb-4">
                <Edit className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-900">Manage Products</h3>
              <p className="text-gray-600 text-sm">View and edit your farm's products</p>
            </div>
          </Link>

          <Link href="/dashboard/farmer/orders">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="p-3 bg-green-100 rounded-full w-fit mb-4">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-900">Orders & Subscriptions</h3>
              <p className="text-gray-600 text-sm">Manage customer orders and subscriptions</p>
            </div>
          </Link>

          <Link href="/dashboard/farmer/packages">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="p-3 bg-green-100 rounded-full w-fit mb-4">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-900">My Packages</h3>
              <p className="text-gray-600 text-sm">View and manage your subscription packages</p>
            </div>
          </Link>

          <Link href="/dashboard/farmer/settings">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
              <div className="p-3 bg-green-100 rounded-full w-fit mb-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-900">Settings</h3>
              <p className="text-gray-600 text-sm">Manage your account and farm settings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

