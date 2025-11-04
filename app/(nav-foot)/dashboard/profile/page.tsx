"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { User, Mail, Phone, Calendar, Save, Eye, EyeOff, MapPin, CreditCard, Plus, Edit2, Trash2, X, Check } from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  accountType: string;
  emailVerified: boolean;
  loginMethod: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "cards">("profile");
  
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    city: "",
    postcode: "",
    deliveryInstructions: "",
    isDefault: false,
  });
  
  
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [cardForm, setCardForm] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    isDefault: false,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  });

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
    const fetchProfile = async () => {
      if (!isAuthenticated || user?.accountType === "farmer") return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login/user");
          return;
        }

        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          
          
          let formattedDateOfBirth = "";
          if (data.dateOfBirth) {
            
            const dateStr = typeof data.dateOfBirth === 'string' 
              ? data.dateOfBirth 
              : data.dateOfBirth.toString();
            
            
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              formattedDateOfBirth = dateStr;
            } else {
              
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                formattedDateOfBirth = `${year}-${month}-${day}`;
              }
            }
          }
          
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phoneNumber: data.phoneNumber || "",
            dateOfBirth: formattedDateOfBirth,
            password: "",
            confirmPassword: "",
          });
        } else {
          console.error("Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.accountType !== "farmer") {
      fetchProfile();
    }
  }, [user, isAuthenticated, router]);

  
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated || !user || activeTab !== "addresses") return;

      try {
        setLoadingAddresses(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/user/addresses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const addresses = await response.json();
          setSavedAddresses(addresses);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, user, activeTab]);

  
  useEffect(() => {
    const fetchCards = async () => {
      if (!isAuthenticated || !user || activeTab !== "cards") return;

      try {
        setLoadingCards(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/user/cards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const cards = await response.json();
          setSavedCards(cards);
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchCards();
  }, [isAuthenticated, user, activeTab]);

  
  const handleSaveAddress = async () => {
    setError(null);
    setSuccess(null);

    if (!addressForm.firstName.trim() || !addressForm.lastName.trim() || 
        !addressForm.address.trim() || !addressForm.city.trim() || !addressForm.postcode.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const url = editingAddressId ? `/api/user/addresses` : `/api/user/addresses`;
      const method = editingAddressId ? "PUT" : "POST";

      const body = {
        ...(editingAddressId && { id: editingAddressId }),
        firstName: addressForm.firstName,
        lastName: addressForm.lastName,
        phoneNumber: addressForm.phoneNumber,
        address: addressForm.address,
        city: addressForm.city,
        postcode: addressForm.postcode,
        deliveryInstructions: addressForm.deliveryInstructions,
        isDefault: addressForm.isDefault,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const savedAddress = await response.json();
        
        if (editingAddressId) {
          setSavedAddresses((prev) =>
            prev.map((addr) => (addr.id === editingAddressId ? savedAddress : addr))
          );
        } else {
          setSavedAddresses((prev) => [...prev, savedAddress]);
        }
        
        setShowAddressModal(false);
        setShowNewAddressForm(false);
        setEditingAddressId(null);
        setAddressForm({
          firstName: "",
          lastName: "",
          phoneNumber: "",
          address: "",
          city: "",
          postcode: "",
          deliveryInstructions: "",
          isDefault: false,
        });
        setSuccess("Address saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setError("An error occurred while saving address");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
        setSuccess("Address deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      setError("An error occurred while deleting address");
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setAddressForm({
      firstName: address.first_name,
      lastName: address.last_name,
      phoneNumber: address.phone_number || "",
      address: address.address,
      city: address.city,
      postcode: address.postcode,
      deliveryInstructions: address.delivery_instructions || "",
      isDefault: address.is_default,
    });
    setShowNewAddressForm(true);
    setShowAddressModal(true);
  };

  
  const detectCardType = (number: string): string | undefined => {
    const cleanNumber = number.replace(/\D/g, "");
    if (cleanNumber.startsWith("4")) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(011|5)/.test(cleanNumber)) return "discover";
    return undefined;
  };

  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "");
    const chunks = [];
    for (let i = 0; i < cleanValue.length; i += 4) {
      chunks.push(cleanValue.slice(i, i + 4));
    }
    return chunks.filter(Boolean).join(" ");
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCardNumber(value);
    setCardForm((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setCardForm((prev) => ({ ...prev, expiryDate: value }));
  };

  const handleSaveCard = async () => {
    setError(null);
    setSuccess(null);

    if (!cardForm.nameOnCard.trim() || !cardForm.cardNumber.trim() || 
        !cardForm.expiryDate.trim() || !cardForm.cvv.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const cardNumberDigits = cardForm.cardNumber.replace(/\s/g, "");
      if (cardNumberDigits.length < 4) {
        setError("Please enter a valid card number");
        return;
      }
      
      const lastFourDigits = cardNumberDigits.slice(-4);
      const cardType = detectCardType(cardNumberDigits);
      
      const [expiryMonth, expiryYear] = cardForm.expiryDate.split("/");
      if (!expiryMonth || !expiryYear) {
        setError("Please enter a valid expiry date");
        return;
      }
      
      const fullYear = parseInt(`20${expiryYear}`);

      const body = {
        lastFourDigits,
        cardType: cardType || "unknown",
        expiryMonth: parseInt(expiryMonth),
        expiryYear: fullYear,
        nameOnCard: cardForm.nameOnCard,
        cvv: cardForm.cvv,
        isDefault: cardForm.isDefault,
      };

      const response = await fetch("/api/user/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newCard = await response.json();
        setSavedCards((prev) => [...prev, newCard]);
        setShowCardModal(false);
        setShowNewCardForm(false);
        setCardForm({
          nameOnCard: "",
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          isDefault: false,
        });
        setSuccess("Card saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save card");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      setError("An error occurred while saving card");
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/user/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedCards((prev) => prev.filter((card) => card.id !== cardId));
        setSuccess("Card deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      setError("An error occurred while deleting card");
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login/user");
        return;
      }

      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth || null,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditing(false);
        setSuccess("Profile updated successfully!");
        
        
        let formattedDateOfBirth = "";
        if (data.dateOfBirth) {
          const dateStr = typeof data.dateOfBirth === 'string' 
            ? data.dateOfBirth 
            : data.dateOfBirth.toString();
          
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            formattedDateOfBirth = dateStr;
          } else {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedDateOfBirth = `${year}-${month}-${day}`;
            }
          }
        }
        
        setFormData({
          ...formData,
          dateOfBirth: formattedDateOfBirth,
          password: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating profile");
    } finally {
      setSaving(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-full">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Profile & Settings
                  </h1>
                  <p className="text-green-100 mt-1">
                    Manage your account information
                  </p>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`pb-4 px-1 font-medium text-sm transition-colors ${
                    activeTab === "profile"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Details
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`pb-4 px-1 font-medium text-sm transition-colors ${
                    activeTab === "addresses"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Addresses
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("cards")}
                  className={`pb-4 px-1 font-medium text-sm transition-colors ${
                    activeTab === "cards"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Methods
                  </div>
                </button>
              </nav>
            </div>

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

            
            {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {profile.emailVerified ? "✓ Verified" : "Not verified"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <input
                    type="text"
                    value={profile.accountType.charAt(0).toUpperCase() + profile.accountType.slice(1)}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg ${
                      editing
                        ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    disabled={!editing}
                    className={`w-full px-4 py-3 border rounded-lg ${
                      editing
                        ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      disabled={!editing}
                      maxLength={11}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                        editing
                          ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                      disabled={!editing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg ${
                        editing
                          ? "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {editing && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Leave blank to keep current"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Leave password fields blank to keep your current password
                  </p>
                </div>
              )}

              {editing && (
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      
                      
                      let formattedDateOfBirth = "";
                      if (profile.dateOfBirth) {
                        const dateStr = typeof profile.dateOfBirth === 'string' 
                          ? profile.dateOfBirth 
                          : String(profile.dateOfBirth);
                        
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                          formattedDateOfBirth = dateStr;
                        } else {
                          const date = new Date(dateStr);
                          if (!isNaN(date.getTime())) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            formattedDateOfBirth = `${year}-${month}-${day}`;
                          }
                        }
                      }
                      
                      setFormData({
                        firstName: profile.firstName || "",
                        lastName: profile.lastName || "",
                        phoneNumber: profile.phoneNumber || "",
                        dateOfBirth: formattedDateOfBirth,
                        password: "",
                        confirmPassword: "",
                      });
                      setError(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            )}

            
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                  <button
                    onClick={() => {
                      setShowNewAddressForm(true);
                      setShowAddressModal(true);
                      setEditingAddressId(null);
                      setAddressForm({
                        firstName: "",
                        lastName: "",
                        phoneNumber: "",
                        address: "",
                        city: "",
                        postcode: "",
                        deliveryInstructions: "",
                        isDefault: false,
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Address
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading addresses...</p>
                  </div>
                ) : savedAddresses.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No saved addresses yet</p>
                    <button
                      onClick={() => {
                        setShowNewAddressForm(true);
                        setShowAddressModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border-2 rounded-lg p-4 ${
                          address.is_default
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {address.is_default && (
                              <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs font-medium rounded mb-2">
                                Default
                              </span>
                            )}
                            <p className="font-semibold text-gray-900">
                              {address.first_name} {address.last_name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.postcode}
                            </p>
                            {address.phone_number && (
                              <p className="text-sm text-gray-600 mt-1">{address.phone_number}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            
            {activeTab === "cards" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h3>
                  <button
                    onClick={() => {
                      setShowNewCardForm(true);
                      setShowCardModal(true);
                      setEditingCardId(null);
                      setCardForm({
                        nameOnCard: "",
                        cardNumber: "",
                        expiryDate: "",
                        cvv: "",
                        isDefault: false,
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Card
                  </button>
                </div>

                {loadingCards ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading cards...</p>
                  </div>
                ) : savedCards.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No saved payment methods yet</p>
                    <button
                      onClick={() => {
                        setShowNewCardForm(true);
                        setShowCardModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Add Your First Card
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        className={`border-2 rounded-lg p-4 ${
                          card.is_default
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {card.is_default && (
                              <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs font-medium rounded mb-2">
                                Default
                              </span>
                            )}
                            <p className="font-semibold text-gray-900">{card.name_on_card}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              **** **** **** {card.last_four_digits}
                            </p>
                            <p className="text-sm text-gray-600">
                              Expires {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize mt-1">{card.card_type}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            
            {showAddressModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingAddressId ? "Edit Address" : "Add New Address"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddressModal(false);
                        setShowNewAddressForm(false);
                        setEditingAddressId(null);
                        setAddressForm({
                          firstName: "",
                          lastName: "",
                          phoneNumber: "",
                          address: "",
                          city: "",
                          postcode: "",
                          deliveryInstructions: "",
                          isDefault: false,
                        });
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={addressForm.firstName}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, firstName: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={addressForm.lastName}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, lastName: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phoneNumber}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phoneNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        value={addressForm.address}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, address: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, city: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          value={addressForm.postcode}
                          onChange={(e) =>
                            setAddressForm({ ...addressForm, postcode: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Instructions (Optional)
                      </label>
                      <textarea
                        value={addressForm.deliveryInstructions}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, deliveryInstructions: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefaultAddress"
                        checked={addressForm.isDefault}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, isDefault: e.target.checked })
                        }
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="isDefaultAddress" className="text-sm text-gray-700">
                        Make this my default address
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveAddress}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => {
                          setShowAddressModal(false);
                          setShowNewAddressForm(false);
                          setEditingAddressId(null);
                          setAddressForm({
                            firstName: "",
                            lastName: "",
                            phoneNumber: "",
                            address: "",
                            city: "",
                            postcode: "",
                            deliveryInstructions: "",
                            isDefault: false,
                          });
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            {showCardModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Add New Payment Method</h3>
                    <button
                      onClick={() => {
                        setShowCardModal(false);
                        setShowNewCardForm(false);
                        setCardForm({
                          nameOnCard: "",
                          cardNumber: "",
                          expiryDate: "",
                          cvv: "",
                          isDefault: false,
                        });
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        value={cardForm.nameOnCard}
                        onChange={(e) =>
                          setCardForm({ ...cardForm, nameOnCard: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardForm.expiryDate}
                          onChange={handleExpiryDateChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          maxLength={5}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={cardForm.cvv}
                          onChange={(e) =>
                            setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          maxLength={4}
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefaultCard"
                        checked={cardForm.isDefault}
                        onChange={(e) =>
                          setCardForm({ ...cardForm, isDefault: e.target.checked })
                        }
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="isDefaultCard" className="text-sm text-gray-700">
                        Make this my default payment method
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveCard}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Save Card
                      </button>
                      <button
                        onClick={() => {
                          setShowCardModal(false);
                          setShowNewCardForm(false);
                          setCardForm({
                            nameOnCard: "",
                            cardNumber: "",
                            expiryDate: "",
                            cvv: "",
                            isDefault: false,
                          });
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

