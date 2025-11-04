"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBasket,
  Package,
  Plus,
  Minus,
  Leaf,
  Star,
  MapPin,
  Check,
  Loader2,
} from "lucide-react";
import {
  PlanType,
  PackageType,
  DBFarm,
  DBProduct,
  DBPackage,
  SUBSCRIPTION_PLANS,
} from "../../../types/types";

interface PackageSelectionProps {
  selectedPlan: PlanType;
}

export default function PackageSelection({
  selectedPlan,
}: PackageSelectionProps) {
  const router = useRouter();
  const [packageType, setPackageType] = useState<PackageType>("premade");
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customItems, setCustomItems] = useState<Record<number, number>>({});
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [farms, setFarms] = useState<DBFarm[]>([]);
  const [packages, setPackages] = useState<DBPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        
        const [farmsResponse, weeklyPackagesResponse] = await Promise.all([
          fetch("/api/subscription/farms"),
          fetch("/api/subscription/packages?planType=weekly")
        ]);

        if (!farmsResponse.ok) {
          const farmsError = await farmsResponse.text();
          throw new Error(
            `Failed to fetch farms: ${farmsResponse.status} ${farmsResponse.statusText}. ${farmsError}`
          );
        }

        const farmsData = await farmsResponse.json();
        setFarms(farmsData);
        setError(null);
        setLoading(false); 

        
        let weeklyPackages: DBPackage[] = [];
        if (weeklyPackagesResponse.ok) {
          weeklyPackages = await weeklyPackagesResponse.json();
          setPackages(weeklyPackages);
          setPackagesLoading(false); 
        }

        
        const [biweeklyResponse, monthlyResponse] = await Promise.all([
          fetch("/api/subscription/packages?planType=biweekly"),
          fetch("/api/subscription/packages?planType=monthly")
        ]);

        if (biweeklyResponse.ok && monthlyResponse.ok) {
          const biweeklyPackages = await biweeklyResponse.json();
          const monthlyPackages = await monthlyResponse.json();
          
          
          setPackages([...weeklyPackages, ...biweeklyPackages, ...monthlyPackages]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load data. Please try again later."
        );
      } finally {
        setLoading(false);
        setPackagesLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuantityChange = (itemId: number, change: number) => {
    setCustomItems((prev) => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);

      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [itemId]: newQty };
    });
  };

  const calculateItemPrice = (basePrice: number) => {
    return (
      basePrice * (1 - SUBSCRIPTION_PLANS[selectedPlan].productDiscount / 100)
    );
  };

  const calculateCustomTotal = () => {
    return Object.entries(customItems).reduce((total, [itemId, quantity]) => {
      const farm = farms.find((f) =>
        f.products.some((p) => p.id === Number(itemId))
      );
      const item = farm?.products.find((p) => p.id === Number(itemId));
      if (!item) return total;

      const priceAfterDiscounts = calculateItemPrice(item.price);
      return total + priceAfterDiscounts * quantity;
    }, 0);
  };

  const calculateTotalSavings = () => {
    const originalTotal = Object.entries(customItems).reduce(
      (total, [itemId, quantity]) => {
        const farm = farms.find((f) =>
          f.products.some((p) => p.id === Number(itemId))
        );
        const item = farm?.products.find((p) => p.id === Number(itemId));
        return total + (item?.price || 0) * quantity;
      },
      0
    );

    return originalTotal - calculateCustomTotal();
  };

  const getSelectedFarmProducts = () => {
    if (!selectedFarm) return [];
    const farm = farms.find((f) => f.farm_id === selectedFarm);
    return farm?.products || [];
  };

  const getCategories = () => {
    const products = getSelectedFarmProducts();
    return ["All", ...new Set(products.map((item) => item.category))];
  };

  const parseUnit = (unitStr: string) => {
    const match = unitStr.match(/^(\d+)\s*(.+)$/);
    if (match) {
      return {
        value: parseInt(match[1]),
        unit: match[2],
      };
    }
    return { value: 1, unit: unitStr };
  };

  const formatTotalQuantity = (baseUnit: string, quantity: number) => {
    const { value, unit } = parseUnit(baseUnit);
    const totalValue = value * quantity;
    return `${totalValue}${unit}`;
  };

  const handleProceedToCheckout = () => {
    if (packageType === "premade" && selectedPackage) {
      const selectedPkg = packages.find(
        (pkg) => pkg.package_id === selectedPackage
      );
      localStorage.setItem(
        "selectedPackage",
        JSON.stringify({
          type: "premade",
          plan: selectedPlan,
          package: selectedPkg,
        })
      );
    } else if (
      packageType === "custom" &&
      Object.keys(customItems).length > 0
    ) {
      const customSelection = {
        type: "custom",
        plan: selectedPlan,
        items: Object.entries(customItems).map(([itemId, quantity]) => {
          const farm = farms.find((f) =>
            f.products.some((p) => p.id === Number(itemId))
          );
          const item = farm?.products.find((p) => p.id === Number(itemId));
          return {
            id: itemId,
            name: item?.name,
            quantity,
            price: calculateItemPrice(item?.price || 0),
            unit: item?.unit || "",
          };
        }),
        total: calculateCustomTotal(),
        savings: calculateTotalSavings(),
      };
      localStorage.setItem("selectedPackage", JSON.stringify(customSelection));
    }

    router.push("/subscription-delivery-details");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-center space-x-4 mb-12">
        <button
          onClick={() => setPackageType("premade")}
          className={`flex items-center px-6 py-3 rounded-lg ${
            packageType === "premade"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 border-2 border-gray-200"
          }`}
        >
          <Package className="w-5 h-5 mr-2" />
          Pre-made Packages
        </button>
        <button
          onClick={() => setPackageType("custom")}
          className={`flex items-center px-6 py-3 rounded-lg ${
            packageType === "custom"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 border-2 border-gray-200"
          }`}
        >
          <ShoppingBasket className="w-5 h-5 mr-2" />
          Custom Selection
        </button>
      </div>

      {packageType === "premade" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages
            .filter((pkg) => pkg.plan_type === selectedPlan)
            .map((pkg: DBPackage) => (
              <div
                key={pkg.package_id}
                className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
                  selectedPackage === pkg.package_id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-200"
                }`}
              >
                <div
                  className={`p-6 ${
                    selectedPackage === pkg.package_id ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {pkg.package_name}
                      </h3>
                      <p className="text-sm text-gray-500">{pkg.farm_name}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {pkg.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        {item.name} ({item.quantity})
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col mb-4">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-green-600">
                        Free
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        with your {selectedPlan} plan
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-green-600">
                        Save £{Number(pkg.retail_value).toFixed(2)} per package
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        (£{Number(pkg.retail_value).toFixed(2)} retail value)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {pkg.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedPackage(pkg.package_id)}
                    className={`w-full py-2 rounded-lg ${
                      selectedPackage === pkg.package_id
                        ? "bg-green-600 text-white"
                        : "bg-white text-green-600 border border-green-600"
                    }`}
                  >
                    {selectedPackage === pkg.package_id
                      ? "Selected"
                      : "Select Package"}
                  </button>
                </div>

                {selectedPackage === pkg.package_id && (
                  <div className="border-t border-green-100">
                    <div className="p-6 bg-white">
                      <div className="space-y-6">
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-3">
                            Package Summary
                          </h4>
                          <ul className="space-y-2 text-sm text-green-700">
                            <li className="flex items-center">
                              <Check className="w-4 h-4 mr-2" />
                              {pkg.items.length} items included
                            </li>
                            <li className="flex items-center">
                              <Check className="w-4 h-4 mr-2" />
                              Free delivery with your {selectedPlan} plan
                            </li>
                            <li className="flex items-center">
                              <Check className="w-4 h-4 mr-2" />
                              Retail value: £
                              {Number(pkg.retail_value).toFixed(2)}
                            </li>
                            <li className="flex items-center">
                              <Check className="w-4 h-4 mr-2" />
                              From: {pkg.farm_name}
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Next Steps:
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  1
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Proceed to checkout to confirm your delivery
                                  details
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  2
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Choose your preferred delivery day
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  3
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Complete your subscription setup
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const selectedPkg = packages.find(
                              (p) => p.package_id === pkg.package_id
                            );
                            localStorage.setItem(
                              "selectedPackage",
                              JSON.stringify({
                                type: "premade",
                                plan: selectedPlan,
                                package: selectedPkg,
                              })
                            );
                            router.push("/subscription-delivery-details");
                          }}
                          disabled={isAddingToCart}
                          className="w-full py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 
                          transition-colors duration-200 flex items-center justify-center font-medium"
                        >
                          <ShoppingBasket className="w-4 h-4 mr-2" />
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Select Your Farm</h3>
            <div className="space-y-4">
              {farms.map((farm) => (
                <div
                  key={farm.farm_id}
                  onClick={() => setSelectedFarm(farm.farm_id)}
                  className={`cursor-pointer p-4 rounded-lg border-2 ${
                    selectedFarm === farm.farm_id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {farm.farm_name}
                    </h4>
                    <p className="text-sm text-gray-500">{farm.description}</p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {farm.location}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {farm.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedFarm && (
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Select Products</h3>
                <div className="flex space-x-2">
                  {getCategories().map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSelectedFarmProducts()
                  .filter(
                    (product) =>
                      selectedCategory === "All" ||
                      product.category === selectedCategory
                  )
                  .map((product) => {
                    const discountedPrice = calculateItemPrice(product.price);

                    return (
                      <div
                        key={product.id}
                        className="p-4 border rounded-lg bg-white"
                      >
                        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400">No image available</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {product.name}
                              {product.organic && (
                                <Leaf className="inline-block w-4 h-4 ml-1 text-green-500" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">
                              <span className="line-through text-gray-400">
                                £{product.price.toFixed(2)}
                              </span>{" "}
                              <span className="text-green-600">
                                £{discountedPrice.toFixed(2)}
                              </span>{" "}
                              per {product.unit}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(product.id, -1)
                              }
                              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center">
                              {customItems[product.id] || 0}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(product.id, 1)
                              }
                              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {customItems[product.id] > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Total:{" "}
                            {formatTotalQuantity(
                              product.unit,
                              customItems[product.id]
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>

              {Object.keys(customItems).length > 0 && (
                <div className="mt-8">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                      <div className="flex items-center">
                        <ShoppingBasket className="w-6 h-6 text-green-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order Summary
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-3">
                            Selected items:
                          </p>
                          <div className="space-y-2">
                            {Object.entries(customItems).map(
                              ([itemId, quantity]) => {
                                const farm = farms.find((f) =>
                                  f.products.some(
                                    (p) => p.id === Number(itemId)
                                  )
                                );
                                const item = farm?.products.find(
                                  (p) => p.id === Number(itemId)
                                );
                                if (!item) return null;

                                const originalPrice = item.price * quantity;
                                const discountedPrice =
                                  calculateItemPrice(item.price) * quantity;

                                return (
                                  <div
                                    key={itemId}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="flex items-center">
                                      <Check className="w-4 h-4 text-green-500 mr-2" />
                                      {item.name} (
                                      {formatTotalQuantity(item.unit, quantity)}
                                      )
                                    </span>
                                    <span>
                                      <span className="line-through text-gray-500">
                                        £{originalPrice.toFixed(2)}
                                      </span>{" "}
                                      <span className="text-green-600">
                                        £{discountedPrice.toFixed(2)}
                                      </span>
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">
                              £{calculateCustomTotal().toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-green-600">
                            <span>Total Savings</span>
                            <span className="font-medium">
                              £{calculateTotalSavings().toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-6">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Next Steps:
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  1
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Review your custom selection
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  2
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Choose your delivery preferences
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  3
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  Complete your subscription setup
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleProceedToCheckout}
                          className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <ShoppingBasket className="w-5 h-5 mr-2" />
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
