"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Package, User, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

interface Subscription {
  id: number;
  subscriptionType: string;
  packageType: string;
  status: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  packageName: string;
  packageDescription: string;
  deliveryAddress: string;
  city: string;
  postcode: string;
  deliveryInstructions: string;
  deliveryDates: string[];
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
}

export default function FarmerOrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

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
    const fetchOrders = async () => {
      if (!isAuthenticated || user?.accountType !== "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/farmer");
          return;
        }

        const response = await fetch("/api/farmer/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data);
        } else {
          console.error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType === "farmer") {
      fetchOrders();
    }
  }, [user, isAuthenticated, router]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "paused":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

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

  const getUpcomingDeliveries = (deliveryDates: string[]) => {
    if (!deliveryDates || !Array.isArray(deliveryDates)) return [];
    const now = new Date();
    return deliveryDates.filter(date => {
      const deliveryDate = new Date(date);
      return deliveryDate >= now;
    }).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  };

  const getPastDeliveries = (deliveryDates: string[]) => {
    if (!deliveryDates || !Array.isArray(deliveryDates)) return [];
    const now = new Date();
    return deliveryDates.filter(date => {
      const deliveryDate = new Date(date);
      return deliveryDate < now;
    }).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === "all") return true;
    const upcoming = getUpcomingDeliveries(sub.deliveryDates);
    const past = getPastDeliveries(sub.deliveryDates);
    if (filter === "upcoming") return upcoming.length > 0;
    if (filter === "past") return past.length > 0;
    return true;
  });

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
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
              Orders & Subscriptions
            </h1>
            <p className="text-lg text-gray-600">
              Manage customer orders and delivery schedules
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All ({subscriptions.length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "upcoming"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Upcoming ({subscriptions.filter(s => getUpcomingDeliveries(s.deliveryDates).length > 0).length})
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "past"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Past ({subscriptions.filter(s => getPastDeliveries(s.deliveryDates).length > 0).length})
          </button>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No orders found</p>
            <p className="text-gray-500">
              {filter === "all" 
                ? "You don't have any orders yet." 
                : filter === "upcoming"
                ? "No upcoming deliveries."
                : "No past deliveries."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubscriptions.map((subscription) => {
              const upcoming = getUpcomingDeliveries(subscription.deliveryDates);
              const past = getPastDeliveries(subscription.deliveryDates);
              const displayDates = filter === "upcoming" ? upcoming : filter === "past" ? past : subscription.deliveryDates;

              return (
                <div key={subscription.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {subscription.packageName || `Subscription #${subscription.id}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(subscription.status)}`}>
                            {getStatusIcon(subscription.status)}
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {subscription.packageType === "premade" ? "Pre-made Package" : "Custom Package"} • {subscription.subscriptionType.charAt(0).toUpperCase() + subscription.subscriptionType.slice(1)} Delivery
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          £{subscription.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer Information
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {(subscription.customerFirstName || subscription.customerLastName) ? (
                            <p>
                              <strong>Name:</strong> {subscription.customerFirstName || ""} {subscription.customerLastName || ""}
                            </p>
                          ) : (
                            <p>
                              <strong>Name:</strong> <span className="text-gray-500 italic">Guest Customer</span>
                            </p>
                          )}
                          <p>
                            <strong>Email:</strong> {subscription.customerEmail || <span className="text-gray-500 italic">Not provided</span>}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Delivery Address
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{subscription.deliveryAddress}</p>
                          <p>{subscription.city}, {subscription.postcode}</p>
                          {subscription.deliveryInstructions && (
                            <p className="mt-2">
                              <strong>Instructions:</strong> {subscription.deliveryInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Delivery Schedule
                      </h4>
                      {displayDates && displayDates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {displayDates.map((date: string, idx: number) => {
                            const deliveryDate = new Date(date);
                            const isUpcoming = deliveryDate >= new Date();
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border text-sm ${
                                  isUpcoming
                                    ? "bg-green-50 border-green-200 text-green-900"
                                    : "bg-gray-50 border-gray-200 text-gray-600"
                                }`}
                              >
                                <div className="font-medium">
                                  {deliveryDate.toLocaleDateString("en-GB", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-xs mt-1">
                                  {deliveryDate.toLocaleTimeString("en-GB", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No delivery dates scheduled</p>
                      )}
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      Created: {new Date(subscription.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

