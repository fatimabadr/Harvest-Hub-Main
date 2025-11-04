"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Truck, LeafyGreen, ShieldCheck } from "lucide-react";
import { PlanType } from "@/types/types";
import SubscriptionPlans from "@/app/components/subscriptions/SubscriptionPlans";
import PackageSelection from "@/app/components/subscriptions/PackageSelection";
import { useAuth } from "@/app/context/AuthContext";

export default function SubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("weekly");
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  
  if (isAuthenticated && user?.accountType === "farmer") {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 py-20">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/home/pattern-light.svg')] opacity-10"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
                Subscribe & Save
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-green-900 mb-6 leading-tight">
                Fresh From Farm to Table
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Choose your perfect subscription plan and enjoy fresh, local
                produce delivered right to your doorstep
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16">
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-3 bg-green-100 rounded-full mb-4">
                    <Sprout className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-green-900">
                    Fresh & Organic
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Locally sourced produce from trusted farmers
                  </p>
                </div>
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-3 bg-green-100 rounded-full mb-4">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-green-900">
                    Free Delivery
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Right to your doorstep with care
                  </p>
                </div>
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-3 bg-green-100 rounded-full mb-4">
                    <LeafyGreen className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-green-900">
                    Seasonal Variety
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    Fresh seasonal produce all year round
                  </p>
                </div>
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-3 bg-green-100 rounded-full mb-4">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-green-900">
                    Quality Assured
                  </h3>
                  <p className="text-gray-600 text-center text-sm">
                    100% satisfaction guaranteed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
              Flexible Plans
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Select Your Plan
            </h2>
            <div className="h-1 w-20 bg-green-500 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Choose the perfect plan that fits your lifestyle and budget
            </p>
          </div>

          <SubscriptionPlans
            selectedPlan={selectedPlan}
            onPlanChange={setSelectedPlan}
          />

          <div className="mt-32">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-4">
                Personalize
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
                Customize Your Package
              </h2>
              <div className="h-1 w-20 bg-green-500 mx-auto rounded-full mb-6"></div>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
                Choose from our curated pre-made packages or create your own
                custom selection
              </p>
            </div>
            <PackageSelection selectedPlan={selectedPlan} />
          </div>
        </div>
      </div>
    </>
  );
}
