"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Package, MapPin, Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  imageUrl: string | null;
  farm: {
    id: number;
    name: string;
    address: string;
  } | null;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  total: number;
  deliveryAddress: string;
  city: string;
  postcode: string;
  deliveryInstructions: string | null;
  status: string;
  orderDate: string;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login/user");
      return;
    }

    const fetchOrderDetails = async () => {
      const orderId = searchParams.get("id");
      if (!orderId) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/user");
          return;
        }

        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else if (response.status === 404) {
          setError("Order not found");
        } else {
          setError("Failed to load order details");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError("An error occurred while loading order details");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The order you're looking for doesn't exist."}</p>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          </div>
          <p className="text-gray-600">
            Order #{order.orderNumber}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Order Summary
                </h2>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.orderDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  order.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{order.firstName} {order.lastName}</p>
                  <p>{order.email}</p>
                  {order.phoneNumber && <p>{order.phoneNumber}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{order.deliveryAddress}</p>
                  <p>{order.city}, {order.postcode}</p>
                  {order.deliveryInstructions && (
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Instructions:</span> {order.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    {item.farm && (
                      <p className="text-sm text-gray-600 mb-1">
                        From: {item.farm.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      £{item.price.toFixed(2)} per {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600">
                  £{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

