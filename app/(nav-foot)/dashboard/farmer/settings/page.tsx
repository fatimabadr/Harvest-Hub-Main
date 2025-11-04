"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function FarmerSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farmData, setFarmData] = useState<any>(null);
  const [formData, setFormData] = useState({
    farmName: "",
    farmDescription: "",
    farmAddress: "",
    farmerName: "",
    farmerPhone: "",
    farmerLocation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
          setFormData({
            farmName: data.farm_name || "",
            farmDescription: data.description || "",
            farmAddress: data.address || "",
            farmerName: data.farmer?.name || "",
            farmerPhone: data.farmer?.phone || "",
            farmerLocation: data.farmer?.location || "",
          });
        }
      } catch (error) {
        console.error("Error fetching farm data:", error);
        setError("Failed to load farm data");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType === "farmer") {
      fetchFarmData();
    }
  }, [user, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login/farmer");
        return;
      }

      const response = await fetch("/api/farmer/farm", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("Settings updated successfully!");
        
        const dataResponse = await fetch("/api/farmer/farm", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setFarmData(data);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update settings");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to update settings");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
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
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/farmer"
            className="inline-flex items-center text-green-700 hover:text-green-900 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 mb-4">
              Settings
            </h1>
            <p className="text-lg text-gray-600">
              Manage your account and farm information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Farm Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name *
                </label>
                <input
                  type="text"
                  id="farmName"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="farmDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="farmDescription"
                  value={formData.farmDescription}
                  onChange={(e) => setFormData({ ...formData, farmDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>

              <div>
                <label htmlFor="farmAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="farmAddress"
                  value={formData.farmAddress}
                  onChange={(e) => setFormData({ ...formData, farmAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="farmerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="farmerName"
                  value={formData.farmerName}
                  onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="farmerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="farmerPhone"
                    value={formData.farmerPhone}
                    onChange={(e) => setFormData({ ...formData, farmerPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="farmerLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="farmerLocation"
                    value={formData.farmerLocation}
                    onChange={(e) => setFormData({ ...formData, farmerLocation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {farmData?.farmer?.email || user?.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/farmer"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

