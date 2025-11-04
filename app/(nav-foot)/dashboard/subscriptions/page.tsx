"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Package, Truck, Clock } from "lucide-react";
import Link from "next/link";

interface Subscription {
  id: number;
  type: string;
  packageType: string;
  status: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  packageName: string;
  packageDescription: string;
  retailValue: number | null;
  deliveryAddress: string;
  city: string;
  postcode: string;
  deliveryInstructions: string;
  deliveryDates: string[];
  nextDelivery: string | null;
  farm: {
    id: number;
    name: string;
    description: string;
    address: string;
  } | null;
}

export default function SubscriptionsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "cancelled">("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/registration-type");
      return;
    }
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!isAuthenticated || user?.accountType === "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/user");
          return;
        }

        const response = await fetch("/api/user/subscriptions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data);
        } else {
          console.error("Failed to fetch subscriptions");
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType !== "farmer") {
      fetchSubscriptions();
    }
  }, [user, isAuthenticated, router]);

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter === "all") return true;
    return sub.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
          </div>
          <p className="text-gray-600">
            Manage your active subscriptions and view delivery schedules
          </p>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "all"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "active"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("paused")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "paused"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Paused
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === "cancelled"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Cancelled
          </button>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No subscriptions found
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === "all"
                ? "Start a subscription to see it here"
                : `No ${filter} subscriptions`}
            </p>
            {filter === "all" && (
              <Link
                href="/subscriptions"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Browse Subscriptions
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow ${
                  subscription.nextDelivery &&
                  new Date(subscription.nextDelivery) <=
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ? "border-green-500 ring-2 ring-green-200"
                    : "border-gray-200"
                } hover:shadow-md`}
              >
                {subscription.nextDelivery &&
                  new Date(subscription.nextDelivery) <=
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                    <div className="bg-green-50 border-b border-green-200 px-6 py-2">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        Next delivery coming soon!
                      </div>
                    </div>
                  )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {subscription.packageName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            subscription.status
                          )}`}
                        >
                          {subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 capitalize">
                        {subscription.type} •{" "}
                        {subscription.packageType === "premade"
                          ? "Pre-made Package"
                          : "Custom Package"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        £{subscription.price.toFixed(2)}
                        <span className="text-sm font-normal text-gray-500">
                          /{subscription.type === "weekly" ? "week" : subscription.type === "biweekly" ? "2 weeks" : "month"}
                        </span>
                      </p>
                      {subscription.retailValue && (
                        <p className="text-sm text-gray-500 line-through">
                          £{subscription.retailValue.toFixed(2)} retail
                        </p>
                      )}
                    </div>
                  </div>

                  {subscription.packageDescription && (
                    <p className="text-gray-600 mb-4 text-sm">
                      {subscription.packageDescription}
                    </p>
                  )}

                  {subscription.farm && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900 mb-1">
                        {subscription.farm.name}
                      </p>
                      {subscription.farm.description && (
                        <p className="text-xs text-green-700 mb-1">
                          {subscription.farm.description}
                        </p>
                      )}
                      <p className="text-xs text-green-600">
                        {subscription.farm.address}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Delivery Address
                        </p>
                        <p className="text-sm text-gray-600">
                          {subscription.deliveryAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          {subscription.city} {subscription.postcode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Next Delivery
                        </p>
                        {subscription.nextDelivery ? (
                          <p className="text-sm text-gray-900 font-semibold">
                            {new Date(
                              subscription.nextDelivery
                            ).toLocaleDateString("en-GB", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">No upcoming deliveries</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {subscription.deliveryDates.length} total delivery
                          {subscription.deliveryDates.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscription.deliveryInstructions && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Delivery Instructions
                      </p>
                      <p className="text-xs text-gray-600">
                        {subscription.deliveryInstructions}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <Link
                      href={`/subscription-confirmation?id=${subscription.id}`}
                      className="text-green-600 hover:text-green-700 text-sm font-semibold"
                    >
                      View Full Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

