"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, Package, ShoppingBag, Calendar, TrendingUp, Clock } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalOrders: number;
  activeSubscriptions: number;
  totalSpent: number;
  upcomingDeliveries: number;
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  packageName: string;
  total: number;
  orderDate: string;
  status: string;
}

interface UpcomingDelivery {
  id: number;
  packageName: string;
  nextDelivery: string;
  type: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    activeSubscriptions: 0,
    totalSpent: 0,
    upcomingDeliveries: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<UpcomingDelivery[]>([]);
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
    const fetchDashboardData = async () => {
      if (!isAuthenticated || user?.accountType === "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/user");
          return;
        }

        
        const [ordersResponse, subscriptionsResponse] = await Promise.all([
          fetch("/api/user/orders", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/user/subscriptions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (ordersResponse.ok && subscriptionsResponse.ok) {
          const orders = await ordersResponse.json();
          const subscriptions = await subscriptionsResponse.json();

          
          const activeSubs = subscriptions.filter(
            (sub: any) => sub.status === "active"
          );
          
          const now = new Date();
          const upcoming = subscriptions.filter((sub: any) => {
            if (!sub.nextDelivery) return false;
            const deliveryDate = new Date(sub.nextDelivery);
            return deliveryDate > now && deliveryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
          });

          const totalSpent = orders.reduce(
            (sum: number, order: any) => sum + (order.total || 0),
            0
          );

          setStats({
            totalOrders: orders.length,
            activeSubscriptions: activeSubs.length,
            totalSpent,
            upcomingDeliveries: upcoming.length,
          });

          
          const recent = orders
            .slice(0, 3)
            .map((order: any) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              packageName: order.packageName,
              total: order.total,
              orderDate: order.orderDate,
              status: order.status,
            }));
          setRecentOrders(recent);

          
          const upcomingList = upcoming
            .sort((a: any, b: any) => {
              const dateA = new Date(a.nextDelivery).getTime();
              const dateB = new Date(b.nextDelivery).getTime();
              return dateA - dateB;
            })
            .slice(0, 3)
            .map((sub: any) => ({
              id: sub.id,
              packageName: sub.packageName,
              nextDelivery: sub.nextDelivery,
              type: sub.type,
            }));
          setUpcomingDeliveries(upcomingList);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType !== "farmer") {
      fetchDashboardData();
    }
  }, [user, isAuthenticated, router]);

  if (isLoading || loading) {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome Back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your account
          </p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalOrders}
            </h3>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.activeSubscriptions}
            </h3>
            <p className="text-sm text-gray-600">Active Subscriptions</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              £{stats.totalSpent.toFixed(2)}
            </h3>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.upcomingDeliveries}
            </h3>
            <p className="text-sm text-gray-600">Upcoming Deliveries</p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Profile & Settings</p>
                    <p className="text-sm text-gray-500">Manage your account</p>
                  </div>
                </Link>

                <Link
                  href="/subscriptions"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Browse Subscriptions</p>
                    <p className="text-sm text-gray-500">Explore new packages</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/orders"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View All Orders</p>
                    <p className="text-sm text-gray-500">Order history</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Orders
                </h2>
                <Link
                  href="/dashboard/orders"
                  className="text-green-600 hover:text-green-700 text-sm font-semibold"
                >
                  View All →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link
                    href="/subscriptions"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/subscription-confirmation?id=${order.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.packageName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.orderNumber} •{" "}
                            {new Date(order.orderDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            £{order.total.toFixed(2)}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              order.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming Deliveries
                </h2>
                <Link
                  href="/dashboard/subscriptions"
                  className="text-green-600 hover:text-green-700 text-sm font-semibold"
                >
                  View All →
                </Link>
              </div>
              {upcomingDeliveries.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No upcoming deliveries</p>
                  <Link
                    href="/subscriptions"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    Start a Subscription
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingDeliveries.map((delivery) => (
                    <Link
                      key={delivery.id}
                      href={`/subscription-confirmation?id=${delivery.id}`}
                      className="block p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-600 rounded-lg">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {delivery.packageName}
                            </p>
                            <p className="text-sm text-gray-600 capitalize">
                              {delivery.type} subscription
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-700">
                            {new Date(delivery.nextDelivery).toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.ceil(
                              (new Date(delivery.nextDelivery).getTime() -
                                Date.now()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
