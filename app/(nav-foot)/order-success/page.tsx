"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Home, ShoppingBag } from "lucide-react";

export default function OrderSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your order. We've received it and will process it shortly.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-6 w-6 text-green-600" />
            <p className="text-gray-700 font-medium">
              You will receive a confirmation email shortly
            </p>
          </div>
          <p className="text-sm text-gray-600">
            We'll send you updates about your order status via email.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

