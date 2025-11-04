"use client";

import { useState, useEffect } from "react";
import { Package, Clock, Tag, Copy, Archive, ChevronRight, Search, Filter, X, ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PlanType } from "../../../types/types";
import { useRouter } from "next/navigation";

interface PackagePreview {
  id: string;
  name: string;
  description: string;
  retailValue: number;
  itemCount: number;
  planType: PlanType;
  createdAt: string;
  tags: string[];
  items: Array<{ name: string; quantity: string }>;
  farmName: string;
  farmDescription: string;
  farmLocation: string;
}

interface PackageListProps {
  farmId: string;
}

export default function PackageList({ farmId }: PackageListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PackagePreview[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | "all">("all");
  const [selectedPackage, setSelectedPackage] = useState<PackagePreview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`/api/subscription/packages/farmer?farmId=${farmId}`);
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        setPackages(data);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (farmId) {
      fetchPackages();
    }
  }, [farmId]);

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPlanType = selectedPlanType === "all" || pkg.planType === selectedPlanType;
    
    return matchesSearch && matchesPlanType;
  });

  
  const handleViewDetails = (packageId: string) => {
    router.push(`/subscription/packages/${packageId}`);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this package? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/subscription/packages?packageId=${packageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete package");
      }

      
      const updatedResponse = await fetch(`/api/subscription/packages/farmer?farmId=${farmId}`);
      if (!updatedResponse.ok) throw new Error("Failed to fetch updated packages");
      const updatedData = await updatedResponse.json();
      setPackages(updatedData);
    } catch (error) {
      console.error("Error deleting package:", error);
      alert("Failed to delete package. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Your Packages</h2>
          <p className="mt-1 text-gray-500">View and manage your created packages</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedPlanType}
            onChange={(e) => setSelectedPlanType(e.target.value as PlanType | "all")}
            className="block px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors shadow-sm bg-white"
          >
            <option value="all">All Plans</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-6" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-lg w-full" />
                <div className="h-4 bg-gray-200 rounded-lg w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPackages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="group bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 hover:shadow-md hover:ring-emerald-500/10 transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Package className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(pkg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-4 text-sm text-gray-600 line-clamp-2">{pkg.description}</p>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{pkg.itemCount} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{pkg.planType}</span>
                  </div>
                </div>

                {pkg.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {pkg.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {pkg.tags.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        +{pkg.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="font-medium">
                    <span className="text-gray-500">Value:</span>{" "}
                    <span className="text-emerald-600">£{pkg.retailValue.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedPackage(pkg)}
                    className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No packages found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedPlanType !== "all"
              ? "Try adjusting your search or filters"
              : "Start by creating your first package"}
          </p>
        </div>
      )}

      
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedPackage.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {formatDistanceToNow(new Date(selectedPackage.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {selectedPackage.planType} Plan
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Farm Details</h3>
                <p className="text-sm text-gray-600">{selectedPackage.farmName}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedPackage.farmDescription}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedPackage.farmLocation}</p>
              </div>

              <p className="text-gray-600 mb-6">{selectedPackage.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPackage.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Contents</h2>
                <div className="grid gap-4">
                  {selectedPackage.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                      <span className="text-gray-600">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-500">Package Value:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    £{selectedPackage.retailValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 