"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Check,
  Plus,
  X,
  Loader2,
  Tag,
  Package,
  TractorIcon as Farm,
  ShoppingBasket,
  Clock,
} from "lucide-react";
import { PlanType } from "../../../types/types";

interface PackageItem {
  name: string;
  quantity: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  organic: boolean;
}

interface FormErrors {
  name?: string;
  farmer?: string;
  farmId?: string;
  description?: string;
  retailValue?: string;
  items?: string;
  tags?: string;
}

interface FarmDetails {
  farm_id: number;
  farm_name: string;
  description: string;
  location: string;
  specialties: string[];
  products: Product[];
}

interface CreatePackageProps {
  farmId?: string;
  farmName?: string;
}

export default function CreatePackage({ farmId, farmName }: CreatePackageProps = {}) {
  const [packageData, setPackageData] = useState({
    name: "",
    farmer: "",
    farmId: "",
    description: "",
    retailValue: "",
    tags: [] as string[],
    items: [] as PackageItem[],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [newItem, setNewItem] = useState<PackageItem>({
    name: "",
    quantity: "",
    price: 0,
  });
  const [farmProducts, setFarmProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [newTag, setNewTag] = useState("");
  const [itemError, setItemError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [farmError, setFarmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [planType, setPlanType] = useState<PlanType>("weekly");

  const parseUnit = (unitStr: string) => {
    const match = unitStr.match(/^(\d+)\s*(.+)$/);
    if (match) {
      return {
        value: Number.parseInt(match[1]),
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

  const calculatePrice = (
    baseUnit: string,
    basePrice: number,
    quantity: number
  ) => {
    const { value } = parseUnit(baseUnit);
    const multiplier = quantity * value;
    const baseUnitQuantity = value;
    return (multiplier / baseUnitQuantity) * basePrice;
  };

  const calculateTotalRetailValue = (items: PackageItem[]) => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!farmId) {
        
        if (!packageData.farmId.trim()) {
          setFarmProducts([]);
          return;
        }
        
        return;
      }

      setIsLoading(true);
      setFarmError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setFarmError("Authentication required");
          setIsLoading(false);
          return;
        }

        
        const response = await fetch("/api/farmer/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const products: Product[] = await response.json();
        setFarmProducts(products);

        
        if (farmName) {
          setPackageData((prev) => ({
            ...prev,
            farmer: farmName,
            farmId: farmId,
          }));
        }

        setFarmError(null);
      } catch (error) {
        console.error("Error fetching products:", error);
        setFarmError("Failed to load products. Please try again.");
        setFarmProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [farmId, farmName]);

  
  useEffect(() => {
    if (farmId) return; 

    const fetchFarmDetails = async () => {
      if (!packageData.farmId.trim()) {
        setPackageData((prev) => ({ ...prev, farmer: "" }));
        setFarmError(null);
        setFarmProducts([]);
        return;
      }

      setIsLoading(true);
      setFarmError(null);

      try {
        const response = await fetch("/api/subscription/farms");
        if (!response.ok) {
          throw new Error("Failed to fetch farm details");
        }
        const farms: FarmDetails[] = await response.json();

        const farm = farms.find(
          (f) => f.farm_id.toString() === packageData.farmId
        );

        if (farm) {
          setPackageData((prev) => ({
            ...prev,
            farmer: farm.farm_name,
          }));

          const products = Array.isArray(farm.products) ? farm.products : [];
          setFarmProducts(products);

          if (errors.farmId) {
            setErrors((prev) => ({ ...prev, farmId: undefined }));
          }
          setFarmError(null);
        } else {
          setFarmError("Farm not found. Please check the Farm ID.");
          setPackageData((prev) => ({ ...prev, farmer: "" }));
          setFarmProducts([]);
          setErrors((prev) => ({ ...prev, farmId: "Invalid Farm ID" }));
        }
      } catch (error) {
        console.error("Error fetching farm:", error);
        setFarmError("Farm not found. Please check the Farm ID.");
        setPackageData((prev) => ({ ...prev, farmer: "" }));
        setFarmProducts([]);
        setErrors((prev) => ({ ...prev, farmId: "Invalid Farm ID" }));
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchFarmDetails();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [packageData.farmId, errors.farmId, farmId]);

  const handleBlur = (field: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: keyof FormErrors) => {
    const newErrors: FormErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!packageData.name.trim()) {
          newErrors.name = "Package name is required";
        } else if (packageData.name.length < 3) {
          newErrors.name = "Package name must be at least 3 characters";
        } else {
          delete newErrors.name;
        }
        break;

      case 'description':
        if (!packageData.description.trim()) {
          newErrors.description = "Description is required";
        } else if (packageData.description.length < 10) {
          newErrors.description = "Description must be at least 10 characters";
        } else {
          delete newErrors.description;
        }
        break;

      case 'farmer':
        if (!packageData.farmer.trim()) {
          newErrors.farmer = "Farmer/Farm name is required";
        } else {
          delete newErrors.farmer;
        }
        break;

      case 'farmId':
        
        if (!farmId) {
          if (!packageData.farmId) {
            newErrors.farmId = "Farm ID is required";
          } else if (Number(packageData.farmId) <= 0) {
            newErrors.farmId = "Farm ID must be a positive number";
          } else {
            delete newErrors.farmId;
          }
        } else {
          delete newErrors.farmId;
        }
        break;

      case 'retailValue':
        if (!packageData.retailValue) {
          newErrors.retailValue = "Retail value is required";
        } else if (Number(packageData.retailValue) <= 0) {
          newErrors.retailValue = "Retail value must be greater than 0";
        } else {
          delete newErrors.retailValue;
        }
        break;

      case 'items':
        if (packageData.items.length === 0) {
          newErrors.items = "At least one item is required";
        } else {
          delete newErrors.items;
        }
        break;

      case 'tags':
        if (packageData.tags.length === 0) {
          newErrors.tags = "At least one tag is required";
        } else {
          delete newErrors.tags;
        }
        break;
    }

    setErrors(newErrors);
    checkFormValidity(newErrors);
  };

  const checkFormValidity = (currentErrors: FormErrors) => {
    const isValid = Object.keys(currentErrors).length === 0 &&
      packageData.name.trim().length >= 3 &&
      packageData.farmer.trim().length > 0 &&
      packageData.description.trim().length >= 10 &&
      (farmId || Number(packageData.farmId) > 0) &&
      Number(packageData.retailValue) > 0 &&
      packageData.items.length > 0 &&
      packageData.tags.length > 0;
    
    setIsFormValid(isValid);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPackageData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      validateField(name as keyof FormErrors);
    }
  };

  const validateItem = (productName: string, quantity: string): boolean => {
    if (!productName) {
      setItemError("Please select a product");
      return false;
    }
    if (!quantity.trim()) {
      setItemError("Quantity is required");
      return false;
    }
    if (Number(quantity) <= 0) {
      setItemError("Quantity must be greater than 0");
      return false;
    }
    return true;
  };

  const handleAddItem = () => {
    if (validateItem(selectedProduct, newItem.quantity)) {
      const product = farmProducts.find((p) => p.name === selectedProduct);
      if (product) {
        const totalQuantity = formatTotalQuantity(
          product.unit,
          Number(newItem.quantity)
        );
        const totalPrice = calculatePrice(
          product.unit,
          product.price,
          Number(newItem.quantity)
        );
        const newItems = [
          ...packageData.items,
          {
            name: selectedProduct,
            quantity: totalQuantity,
            price: totalPrice,
          },
        ];

        setPackageData((prev) => ({
          ...prev,
          items: newItems,
          retailValue: calculateTotalRetailValue(newItems).toFixed(2),
        }));

        setSelectedProduct("");
        setNewItem({
          name: "",
          quantity: "",
          price: 0,
        });
        setItemError("");

        validateField('items');
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    setPackageData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: newItems,
        retailValue: calculateTotalRetailValue(newItems).toFixed(2),
      };
    });
  };

  const handleAddTag = () => {
    if (!newTag.trim()) {
      setErrors((prev) => ({ ...prev, tags: "Tag cannot be empty" }));
      return;
    }

    if (!packageData.tags.includes(newTag)) {
      setPackageData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
      validateField('tags');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setPackageData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      try {
        const response = await fetch("/api/subscription/packages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: packageData.name,
            farmer: packageData.farmer,
            farmId: packageData.farmId,
            description: packageData.description,
            retailValue: Number(packageData.retailValue),
            items: packageData.items,
            tags: packageData.tags,
            planType,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create package");
        }

        setPackageData({
          name: "",
          farmer: "",
          farmId: "",
          description: "",
          retailValue: "",
          tags: [],
          items: [],
        });
        setSubmitSuccess(true);
        setFarmProducts([]);
        setSelectedProduct("");
        setNewItem({
          name: "",
          quantity: "",
          price: 0,
        });
        setNewTag("");
      } catch (error) {
        console.error("Error creating package:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Failed to create package"
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!packageData.name.trim()) {
      newErrors.name = "Package name is required";
    } else if (packageData.name.length < 3) {
      newErrors.name = "Package name must be at least 3 characters";
    }

    if (!packageData.farmer.trim()) {
      newErrors.farmer = "Farmer/Farm name is required";
    }

    
    if (!farmId) {
      if (!packageData.farmId) {
        newErrors.farmId = "Farm ID is required";
      } else if (Number(packageData.farmId) <= 0) {
        newErrors.farmId = "Farm ID must be a positive number";
      }
    }

    if (!packageData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (packageData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!packageData.retailValue) {
      newErrors.retailValue = "Retail value is required";
    } else if (Number(packageData.retailValue) <= 0) {
      newErrors.retailValue = "Retail value must be greater than 0";
    }

    if (packageData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    if (packageData.tags.length === 0) {
      newErrors.tags = "At least one tag is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <form id="create-package-form" onSubmit={handleSubmit} className="divide-y divide-gray-900/5">
              
              {(submitError || submitSuccess) && (
                <div className="p-6">
                  {submitError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <X className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <div className="mt-2 text-sm text-red-700">{submitError}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {submitSuccess && (
                    <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Success</h3>
                          <div className="mt-2 text-sm text-green-700">Package created successfully!</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-600">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Package Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Basic details about your package</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Package Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={packageData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name')}
                      placeholder="e.g., Essential Fresh Box"
                      className={`block w-full px-4 py-3 rounded-xl border ${
                        touched.name && errors.name
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                      } focus:ring-2 focus:outline-none transition-colors shadow-sm`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="retailValue" className="block text-sm font-medium text-gray-700">
                      Retail Value (£)
                    </label>
                    <div className="relative">
                      <input
                        id="retailValue"
                        name="retailValue"
                        type="number"
                        step="0.01"
                        value={packageData.retailValue}
                        readOnly
                        className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 shadow-sm"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">£</span>
                    </div>
                    <p className="text-xs text-gray-500">Automatically calculated from product prices</p>
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="description"
                      name="description"
                      value={packageData.description}
                      onChange={handleChange}
                      onBlur={() => handleBlur('description')}
                      placeholder="Describe the package contents and benefits"
                      rows={4}
                      className={`block w-full px-4 py-3 rounded-xl border ${
                        touched.description && errors.description
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                      } focus:ring-2 focus:outline-none transition-colors shadow-sm resize-none`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>
              </div>

              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-600">
                    <Farm className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Farm Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Select your farm and its products</p>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${farmId ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                  {!farmId && (
                    <div className="space-y-2">
                      <label htmlFor="farmId" className="block text-sm font-medium text-gray-700">
                        Farm ID
                      </label>
                      <input
                        id="farmId"
                        name="farmId"
                        type="number"
                        value={packageData.farmId}
                        onChange={handleChange}
                        onBlur={() => handleBlur('farmId')}
                        placeholder="e.g., 1"
                        className={`block w-full px-4 py-3 rounded-xl border ${
                          touched.farmId && errors.farmId
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                        } focus:ring-2 focus:outline-none transition-colors shadow-sm`}
                      />
                      {errors.farmId && (
                        <p className="text-sm text-red-600 mt-1">{errors.farmId}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="farmer" className="block text-sm font-medium text-gray-700">
                      Farm Name
                    </label>
                    <div className="relative">
                      <input
                        id="farmer"
                        name="farmer"
                        value={packageData.farmer}
                        readOnly
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
                        placeholder={isLoading ? "Loading..." : "Farm name will appear here"}
                      />
                      {isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-600">
                    <ShoppingBasket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Package Items</h2>
                    <p className="mt-1 text-sm text-gray-500">Add products to your package</p>
                  </div>
                </div>

                {(farmId || packageData.farmId) && farmProducts.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors shadow-sm bg-white"
                      >
                        <option value="">Select a product</option>
                        {farmProducts.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name} ({product.unit}) - £{product.price.toFixed(2)}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-3">
                        <input
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) =>
                            setNewItem((prev) => ({
                              ...prev,
                              quantity: e.target.value,
                            }))
                          }
                          placeholder="Qty"
                          className="block w-24 sm:w-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="inline-flex items-center px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      {packageData.items.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 bg-gray-50 border-b border-gray-200">
                            <div className="font-medium text-gray-600">Product</div>
                            <div className="font-medium text-gray-600">Quantity</div>
                            <div className="font-medium text-gray-600">Price</div>
                          </div>
                          {packageData.items.map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-gray-600">{item.quantity}</div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-emerald-700">
                                  £{item.price.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="ml-3 p-1 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 bg-emerald-50 border-t border-emerald-100">
                            <div className="font-semibold text-gray-900">Total</div>
                            <div></div>
                            <div className="font-bold text-emerald-700">
                              £{packageData.retailValue}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                          <ShoppingBasket className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600 font-medium">No items added yet</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Select products from the dropdown above
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    {isLoading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-3" />
                        <p className="text-gray-600 font-medium">
                          Loading farm details and products...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Farm className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">
                          {farmId || packageData.farmId
                            ? "No products available for this farm"
                            : "Enter a Farm ID to view available products"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {farmId || packageData.farmId
                            ? "Please add products to your farm first"
                            : "Farm products will appear here"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 divide-y divide-gray-900/5">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-600">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Package Tags</h2>
                  <p className="mt-1 text-sm text-gray-500">Add relevant tags</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag (e.g., Fresh, Organic)"
                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {packageData.tags.length > 0 ? (
                    packageData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors group border border-emerald-200"
                      >
                        <span className="text-sm font-medium">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 p-0.5 rounded-full hover:bg-emerald-200 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove {tag}</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full py-4">
                      <Tag className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No tags added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Plan Type</h2>
                  <p className="mt-1 text-sm text-gray-500">Set delivery frequency</p>
                </div>
              </div>

              <div className="space-y-4">
                <select
                  id="planType"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as PlanType)}
                  className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors shadow-sm bg-white"
                >
                  <option value="weekly">Weekly Plan</option>
                  <option value="biweekly">Bi-Weekly Plan</option>
                  <option value="monthly">Monthly Plan</option>
                </select>
                <p className="text-sm text-gray-500">
                  This package will only be shown to customers with the matching plan type
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to reset the form? All data will be lost."
                      )
                    ) {
                      setPackageData({
                        name: "",
                        farmer: "",
                        farmId: "",
                        description: "",
                        retailValue: "",
                        tags: [],
                        items: [],
                      });
                      setFarmProducts([]);
                      setSelectedProduct("");
                      setNewItem({ name: "", quantity: "", price: 0 });
                      setNewTag("");
                      setErrors({});
                    }
                  }}
                  className="w-full px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors shadow-sm"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  form="create-package-form"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl ${
                    isFormValid
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  } focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      {isFormValid ? "Create Package" : "Please fill all required fields"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
