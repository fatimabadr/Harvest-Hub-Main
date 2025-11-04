"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Order {
  id: number;
  orderNumber: string;
  type: string;
  packageType?: string;
  status: string;
  total: number;
  orderDate: string;
  packageName?: string;
  packageDescription?: string;
  retailValue?: number | null;
  deliveryAddress: string;
  city: string;
  postcode: string;
  deliveryDates?: string[];
  farm: {
    id: number;
    name: string;
    address: string;
  } | null;
}

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchOrders = async () => {
      if (!isAuthenticated || user?.accountType === "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/user");
          return;
        }

        const response = await fetch("/api/user/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType !== "farmer") {
      fetchOrders();
    }
  }, [user, isAuthenticated, router]);

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
            <ShoppingBag className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          </div>
          <p className="text-gray-600">
            View all your past and current orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here
            </p>
            <Link
              href="/subscriptions"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Browse Subscriptions
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <div
                key={`${order.type}-${order.id}-${order.orderNumber}-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.type === "subscription" ? order.packageName : "Order #" + order.orderNumber}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Order #{order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {order.type === "subscription" ? (
                          order.total > 0 ? `£${order.total.toFixed(2)}` : (
                            <span className="text-green-600">Included</span>
                          )
                        ) : (
                          `£${order.total.toFixed(2)}`
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {order.packageDescription && order.type === "subscription" && (
                    <p className="text-gray-600 mb-4 text-sm">
                      {order.packageDescription}
                    </p>
                  )}
                  
                  {order.type === "order" && (
                    <p className="text-gray-600 mb-4 text-sm">
                      Regular order
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Delivery Address
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.deliveryAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.city} {order.postcode}
                        </p>
                      </div>
                    </div>

                    {order.farm && (
                      <div className="flex items-start gap-2">
                        <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Farm
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.farm.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.farm.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      {order.deliveryDates && order.deliveryDates.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              {order.deliveryDates.length}
                            </span>{" "}
                            delivery{order.deliveryDates.length !== 1 ? "s" : ""}{" "}
                            scheduled
                          </p>
                        </div>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "active"
                            ? "bg-green-100 text-green-800"
                            : order.status === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={order.type === "subscription" 
                        ? `/subscription-confirmation?id=${order.id}`
                        : `/order-details?id=${order.id}`}
                      className="text-green-600 hover:text-green-700 text-sm font-semibold"
                    >
                      View Details →
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

