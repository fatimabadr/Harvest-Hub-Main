"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { CreditCard, MapPin, Phone, ArrowLeft, Package, Check, Plus, Edit2, Trash2, X } from "lucide-react";

interface SavedAddress {
  id: number;
  label: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  address: string;
  city: string;
  postcode: string;
  delivery_instructions: string | null;
  is_default: boolean;
}

interface DeliveryAddress {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  postcode: string;
  deliveryInstructions: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    postcode: "",
    deliveryInstructions: "",
  });

  const [validationErrors, setValidationErrors] = useState<Partial<DeliveryAddress>>({});
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  
  
  interface PaymentDetails {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    nameOnCard: string;
    cardType?: string;
  }
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    cardType: undefined,
  });
  const [paymentValidationErrors, setPaymentValidationErrors] = useState<Partial<PaymentDetails>>({});
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.accountType === "farmer") {
      router.push("/dashboard/farmer");
    }
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (cartItems.length === 0 && !isLoading) {
      router.push("/cart");
    }
  }, [cartItems, isLoading, router]);

  
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated || !user) {
        setLoadingAddresses(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingAddresses(false);
          return;
        }

        const response = await fetch("/api/user/addresses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const addresses = await response.json();
          setSavedAddresses(addresses);
          
          
          const defaultAddress = addresses.find((addr: SavedAddress) => addr.is_default);
          if (defaultAddress) {
            selectAddress(defaultAddress);
            setSelectedAddressId(defaultAddress.id);
          } else if (addresses.length > 0) {
            
            selectAddress(addresses[0]);
            setSelectedAddressId(addresses[0].id);
          } else {
            
            
            const profileResponse = await fetch("/api/user/profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (profileResponse.ok) {
              const profile = await profileResponse.json();
              setDeliveryAddress((prev) => ({
                ...prev,
                firstName: user?.firstName || prev.firstName,
                lastName: user?.lastName || prev.lastName,
                email: user?.email || prev.email,
                phoneNumber: profile.phoneNumber || prev.phoneNumber,
              }));
            }
            setShowAddressModal(true);
            setShowNewAddressForm(true);
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [isAuthenticated, user]);

  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && user) {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const response = await fetch("/api/user/profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const profile = await response.json();
              setDeliveryAddress((prev) => ({
                ...prev,
                firstName: user.firstName || prev.firstName,
                lastName: user.lastName || prev.lastName,
                email: user.email || prev.email,
                phoneNumber: profile.phoneNumber || prev.phoneNumber,
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user, isAuthenticated]);

  const selectAddress = (address: SavedAddress) => {
    setDeliveryAddress({
      firstName: address.first_name,
      lastName: address.last_name,
      email: user?.email || "",
      phoneNumber: address.phone_number || "",
      address: address.address,
      city: address.city,
      postcode: address.postcode,
      deliveryInstructions: address.delivery_instructions || "",
    });
    setSelectedAddressId(address.id);
    setShowNewAddressForm(false);
    setEditingAddressId(null);
    setShowAddressModal(false);
    setValidationErrors({});
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddressId(address.id);
    setDeliveryAddress({
      firstName: address.first_name,
      lastName: address.last_name,
      email: user?.email || "",
      phoneNumber: address.phone_number || "",
      address: address.address,
      city: address.city,
      postcode: address.postcode,
      deliveryInstructions: address.delivery_instructions || "",
    });
    setShowNewAddressForm(true);
    setShowAddressModal(true);
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
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
          setShowNewAddressForm(true);
        }
      }
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleSaveAddress = async (setAsDefault: boolean = false) => {
    if (!validateForm()) return;

    if (!isAuthenticated || !user) {
      
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const url = editingAddressId
        ? `/api/user/addresses`
        : `/api/user/addresses`;
      const method = editingAddressId ? "PUT" : "POST";

      const body = {
        ...(editingAddressId && { id: editingAddressId }),
        firstName: deliveryAddress.firstName,
        lastName: deliveryAddress.lastName,
        phoneNumber: deliveryAddress.phoneNumber,
        address: deliveryAddress.address,
        city: deliveryAddress.city,
        postcode: deliveryAddress.postcode,
        deliveryInstructions: deliveryAddress.deliveryInstructions,
        isDefault: setAsDefault,
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
        
        setSelectedAddressId(savedAddress.id);
        setEditingAddressId(null);
        setShowNewAddressForm(false);
        setShowAddressModal(false);
      }
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  
  const selectCard = (card: any) => {
    setPaymentDetails({
      cardNumber: `**** **** **** ${card.last_four_digits}`,
      expiryDate: `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`,
      cvv: "",
      nameOnCard: card.name_on_card,
      cardType: card.card_type,
    });
    setSelectedCardId(card.id);
    setShowCardModal(false);
    setShowNewCardForm(false);
    setPaymentValidationErrors({});
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
        if (selectedCardId === cardId) {
          setSelectedCardId(null);
          setPaymentDetails({
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            nameOnCard: "",
            cardType: undefined,
          });
          setShowNewCardForm(true);
        }
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  const handleSaveCardAfterPayment = async () => {
    if (!isAuthenticated || !user || !saveCard) return;

    
    if (paymentDetails.cardNumber.includes("*")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      
      const cardNumberDigits = paymentDetails.cardNumber.replace(/\s/g, "");
      if (cardNumberDigits.length < 4) return;
      
      const lastFourDigits = cardNumberDigits.slice(-4);
      const cardType = paymentDetails.cardType || detectCardType(cardNumberDigits);
      
      
      const [expiryMonth, expiryYear] = paymentDetails.expiryDate.split("/");
      if (!expiryMonth || !expiryYear) return;
      
      const fullYear = parseInt(`20${expiryYear}`);

      const body = {
        lastFourDigits,
        cardType: cardType || "unknown",
        expiryMonth: parseInt(expiryMonth),
        expiryYear: fullYear,
        nameOnCard: paymentDetails.nameOnCard,
        cvv: paymentDetails.cvv,
        isDefault: savedCards.length === 0,
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
      }
    } catch (error) {
      console.error("Error saving card:", error);
    }
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
    const cardType = detectCardType(cleanValue);
    const chunks = [];
    
    if (cardType === "amex") {
      for (let i = 0; i < cleanValue.length; i += 4) {
        if (i === 4) {
          chunks.push(cleanValue.slice(i, i + 6));
          i += 2;
        } else {
          chunks.push(cleanValue.slice(i, i + 4));
        }
      }
    } else {
      for (let i = 0; i < cleanValue.length; i += 4) {
        chunks.push(cleanValue.slice(i, i + 4));
      }
    }
    
    return chunks.filter(Boolean).join(" ");
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCardNumber(value);
    const cardType = detectCardType(value);

    setPaymentDetails((prev) => ({
      ...prev,
      cardNumber: formatted,
      cardType,
    }));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setPaymentDetails((prev) => ({ ...prev, expiryDate: value }));
  };

  const validatePaymentForm = (): boolean => {
    const errors: Partial<PaymentDetails> = {};

    if (!paymentDetails.nameOnCard.trim()) {
      errors.nameOnCard = "Name on card is required";
    }
    if (!paymentDetails.cardNumber.trim() || paymentDetails.cardNumber.replace(/\s/g, "").replace(/\*/g, "").length < 13) {
      errors.cardNumber = "Card number is required";
    }
    if (!paymentDetails.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
      errors.expiryDate = "Valid expiry date is required (MM/YY)";
    }
    if (!paymentDetails.cvv.trim() || paymentDetails.cvv.length < 3) {
      errors.cvv = "CVV is required";
    }

    setPaymentValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  
  useEffect(() => {
    const fetchCards = async () => {
      if (!isAuthenticated || !user) {
        return;
      }

      try {
        setLoadingCards(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setLoadingCards(false);
          return;
        }

        const response = await fetch("/api/user/cards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const cards = await response.json();
          setSavedCards(cards);
          
          
          const defaultCard = cards.find((card: any) => card.is_default);
          if (defaultCard) {
            selectCard(defaultCard);
            setSelectedCardId(defaultCard.id);
          } else if (cards.length > 0) {
            
            selectCard(cards[0]);
            setSelectedCardId(cards[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
      } finally {
        setLoadingCards(false);
      }
    };

    if (isAuthenticated && user) {
      fetchCards();
    }
  }, [isAuthenticated, user]);

  const checkEmailExists = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      setEmailSuccess(null);
      setEmailError(null);

      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to check email");
      }

      const data = await response.json();

      if (data.exists) {
        setEmailError("This email already exists. You can finish as guest or log in later.");
        return true;
      } else {
        setEmailSuccess("Email looks good. You can continue as guest and create an account later.");
        return false;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailError("Failed to verify email. Please try again.");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateForm = () => {
    const errors: Partial<DeliveryAddress> = {};

    if (!deliveryAddress.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!deliveryAddress.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!deliveryAddress.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryAddress.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!deliveryAddress.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    }
    if (!deliveryAddress.address.trim()) {
      errors.address = "Address is required";
    }
    if (!deliveryAddress.city.trim()) {
      errors.city = "City is required";
    }
    if (!deliveryAddress.postcode.trim()) {
      errors.postcode = "Postcode is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    
    if (isAuthenticated) {
      if (!selectedAddressId && !showAddressModal && !showNewAddressForm) {
        
        setShowAddressModal(true);
        if (savedAddresses.length === 0) {
          setShowNewAddressForm(true);
          
          if (!deliveryAddress.phoneNumber) {
            const token = localStorage.getItem("token");
            if (token) {
              try {
                const profileResponse = await fetch("/api/user/profile", {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (profileResponse.ok) {
                  const profile = await profileResponse.json();
                  setDeliveryAddress((prev) => ({
                    ...prev,
                    phoneNumber: profile.phoneNumber || prev.phoneNumber,
                  }));
                }
              } catch (error) {
                console.error("Error fetching profile:", error);
              }
            }
          }
        }
        setError("Please select or add a delivery address before placing your order.");
        return;
      }
    }

    if (!validateForm()) {
      return;
    }

    
    if (!validatePaymentForm()) {
      setError("Please fill in all payment details correctly.");
      return;
    }

    
    if (isAuthenticated && showNewAddressForm && !selectedAddressId) {
      await handleSaveAddress(false);
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryAddress: {
            firstName: deliveryAddress.firstName,
            lastName: deliveryAddress.lastName,
            email: deliveryAddress.email,
            phoneNumber: deliveryAddress.phoneNumber,
            address: deliveryAddress.address,
            city: deliveryAddress.city,
            postcode: deliveryAddress.postcode,
            deliveryInstructions: deliveryAddress.deliveryInstructions,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const orderData = await response.json();
      
      
      if (saveCard && isAuthenticated) {
        await handleSaveCardAfterPayment();
      }
      
      clearCart();
      router.push(`/order-success?orderId=${orderData.orderId}`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to process order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Delivery Information
                  </h2>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              
              {isAuthenticated && loadingAddresses && (
                <div className="mb-6 flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Loading addresses...</p>
                  </div>
                </div>
              )}

              
              {isAuthenticated && !loadingAddresses && selectedAddressId && !showAddressModal && (
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Delivering to {deliveryAddress.firstName} {deliveryAddress.lastName}
                      </h3>
                      <div className="text-gray-700 space-y-1">
                        <p>{deliveryAddress.address}</p>
                        <p>{deliveryAddress.city}, {deliveryAddress.postcode}</p>
                        {deliveryAddress.phoneNumber && (
                          <p className="text-sm text-gray-600">{deliveryAddress.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      Change
                    </button>
                  </div>
                  {deliveryAddress.deliveryInstructions && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Delivery instructions:</span> {deliveryAddress.deliveryInstructions}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Add delivery instructions
                  </button>
                </div>
              )}

              
              {showAddressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {showNewAddressForm ? (editingAddressId ? "Edit Address" : "Enter a new delivery address") : "Select a delivery address"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressModal(false);
                          setShowNewAddressForm(false);
                          setEditingAddressId(null);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="p-6">
                      
                      {!showNewAddressForm && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 mb-4">
                            Delivery addresses ({savedAddresses.length})
                          </h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {savedAddresses.map((address) => (
                              <div
                                key={address.id}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                  selectedAddressId === address.id
                                    ? "border-green-600 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => selectAddress(address)}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="radio"
                                    checked={selectedAddressId === address.id}
                                    onChange={() => selectAddress(address)}
                                    className="mt-1 text-green-600"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-gray-900">
                                        {address.first_name} {address.last_name}
                                      </span>
                                      {address.is_default && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      {address.address}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-1">
                                      {address.city}, {address.postcode}
                                    </p>
                                    {address.phone_number && (
                                      <p className="text-sm text-gray-500">{address.phone_number}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAddress(address);
                                      }}
                                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAddress(address.id);
                                      }}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              
                              const token = localStorage.getItem("token");
                              let phoneNumber = "";
                              if (token && isAuthenticated) {
                                try {
                                  const profileResponse = await fetch("/api/user/profile", {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  });
                                  if (profileResponse.ok) {
                                    const profile = await profileResponse.json();
                                    phoneNumber = profile.phoneNumber || "";
                                  }
                                } catch (error) {
                                  console.error("Error fetching profile:", error);
                                }
                              }
                              
                              setShowNewAddressForm(true);
                              setEditingAddressId(null);
                              setDeliveryAddress({
                                firstName: user?.firstName || "",
                                lastName: user?.lastName || "",
                                email: user?.email || "",
                                phoneNumber: phoneNumber,
                                address: "",
                                city: "",
                                postcode: "",
                                deliveryInstructions: "",
                              });
                            }}
                            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition-all"
                          >
                            <Plus className="h-5 w-5" />
                            Add a new delivery address
                          </button>
                        </div>
                      )}

                      
                      {showNewAddressForm && (
                        <div className="space-y-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Full name (first name and surname) *
                                </label>
                                <input
                                  type="text"
                                  value={`${deliveryAddress.firstName} ${deliveryAddress.lastName}`}
                                  readOnly
                                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    validationErrors.firstName || validationErrors.lastName
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  } bg-gray-50 cursor-not-allowed`}
                                  placeholder="Enter your full name"
                                />
                                {(validationErrors.firstName || validationErrors.lastName) && (
                                  <p className="mt-1 text-sm text-red-600">
                                    {validationErrors.firstName || validationErrors.lastName}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Phone number *
                                </label>
                                <input
                                  type="tel"
                                  value={deliveryAddress.phoneNumber}
                                  onChange={(e) =>
                                    setDeliveryAddress({
                                      ...deliveryAddress,
                                      phoneNumber: e.target.value,
                                    })
                                  }
                                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    validationErrors.phoneNumber
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                  placeholder="Enter your phone number"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  May be used to assist delivery
                                </p>
                                {validationErrors.phoneNumber && (
                                  <p className="mt-1 text-sm text-red-600">
                                    {validationErrors.phoneNumber}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postcode *
                              </label>
                              <input
                                type="text"
                                value={deliveryAddress.postcode}
                                onChange={(e) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    postcode: e.target.value,
                                  })
                                }
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                  validationErrors.postcode ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Enter your area postcode"
                              />
                              {validationErrors.postcode && (
                                <p className="mt-1 text-sm text-red-600">
                                  {validationErrors.postcode}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address Line 1 (or Company Name) *
                              </label>
                              <input
                                type="text"
                                value={deliveryAddress.address}
                                onChange={(e) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    address: e.target.value,
                                  })
                                }
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                  validationErrors.address ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Start typing your address"
                              />
                              {validationErrors.address && (
                                <p className="mt-1 text-sm text-red-600">
                                  {validationErrors.address}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address line 2 (optional)
                              </label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Apartment, suite, unit, building, floor, etc."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Town/City *
                              </label>
                              <input
                                type="text"
                                value={deliveryAddress.city}
                                onChange={(e) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    city: e.target.value,
                                  })
                                }
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                  validationErrors.city ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Enter your town or city"
                              />
                              {validationErrors.city && (
                                <p className="mt-1 text-sm text-red-600">
                                  {validationErrors.city}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                County (if applicable)
                              </label>
                              <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter your county"
                              />
                            </div>

                            {isAuthenticated && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="makeDefault"
                                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="makeDefault" className="text-sm text-gray-700">
                                  Make this my default address
                                </label>
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery instructions
                              </label>
                              <textarea
                                rows={3}
                                value={deliveryAddress.deliveryInstructions}
                                onChange={(e) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    deliveryInstructions: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Add preferences, notes, access codes and more"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                const isDefault = (document.getElementById("makeDefault") as HTMLInputElement)?.checked || false;
                                handleSaveAddress(isDefault);
                              }}
                              className="flex-1 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold transition-colors"
                            >
                              Use this address
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewAddressForm(false);
                                setEditingAddressId(null);
                              }}
                              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              
              {!isLoading && !isAuthenticated && (
                <div className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress.firstName}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            firstName: e.target.value,
                          })
                        }
                        disabled={isAuthenticated}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          validationErrors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        } ${isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress.lastName}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            lastName: e.target.value,
                          })
                        }
                        disabled={isAuthenticated}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          validationErrors.lastName
                            ? "border-red-500"
                            : "border-gray-300"
                        } ${isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={deliveryAddress.email}
                      onChange={(e) =>
                        setDeliveryAddress({
                          ...deliveryAddress,
                          email: e.target.value,
                        })
                      }
                      onBlur={() => {
                        const email = deliveryAddress.email.trim();
                        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                          void checkEmailExists(email);
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        validationErrors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your email address"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.email}
                      </p>
                    )}
                    {emailSuccess && (
                      <p className="mt-1 text-sm text-green-600">
                        {emailSuccess}
                      </p>
                    )}
                    {emailError && !validationErrors.email && (
                      <p className="mt-1 text-sm text-yellow-600">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={deliveryAddress.phoneNumber}
                      onChange={(e) =>
                        setDeliveryAddress({
                          ...deliveryAddress,
                          phoneNumber: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        validationErrors.phoneNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {validationErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.phoneNumber}
                      </p>
                    )}
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.address}
                      onChange={(e) =>
                        setDeliveryAddress({
                          ...deliveryAddress,
                          address: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        validationErrors.address ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {validationErrors.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress.city}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            city: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          validationErrors.city ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {validationErrors.city && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postcode *
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress.postcode}
                        onChange={(e) =>
                          setDeliveryAddress({
                            ...deliveryAddress,
                            postcode: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          validationErrors.postcode
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.postcode && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.postcode}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={deliveryAddress.deliveryInstructions}
                      onChange={(e) =>
                        setDeliveryAddress({
                          ...deliveryAddress,
                          deliveryInstructions: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., Leave at front door, ring doorbell, etc."
                    />
                  </div>

                  
                  {isAuthenticated && showNewAddressForm && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleSaveAddress(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveAddress(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Save & Set as Default
                      </button>
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewAddressForm(false);
                            setEditingAddressId(null);
                            const defaultAddress = savedAddresses.find(
                              (addr) => addr.is_default
                            );
                            if (defaultAddress) {
                              selectAddress(defaultAddress);
                            }
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Information
                  </h2>
                </div>

                
                {isAuthenticated && loadingCards && (
                  <div className="mb-6 flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading saved cards...</p>
                    </div>
                  </div>
                )}

                
                {isAuthenticated && !loadingCards && selectedCardId && !showCardModal && (
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Paying with {paymentDetails.nameOnCard}
                        </h3>
                        <div className="text-gray-700 space-y-1">
                          <p>{paymentDetails.cardNumber}</p>
                          <p>Expires {paymentDetails.expiryDate}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCardModal(true)}
                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                      >
                        Change
                      </button>
                    </div>
                    
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.cvv}
                        onChange={(e) =>
                          setPaymentDetails((prev) => ({
                            ...prev,
                            cvv: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                          ${
                            paymentValidationErrors.cvv
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        maxLength={4}
                        placeholder="123"
                      />
                      {paymentValidationErrors.cvv && (
                        <p className="mt-1 text-sm text-red-600">
                          {paymentValidationErrors.cvv}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                
                {showCardModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {showNewCardForm ? "Enter a new payment method" : "Select a payment method"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCardModal(false);
                            setShowNewCardForm(false);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>

                      <div className="p-6">
                        
                        {!showNewCardForm && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 mb-4">
                              Payment methods ({savedCards.length})
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {savedCards.map((card) => (
                                <div
                                  key={card.id}
                                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedCardId === card.id
                                      ? "border-green-600 bg-green-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  onClick={() => selectCard(card)}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="radio"
                                      checked={selectedCardId === card.id}
                                      onChange={() => selectCard(card)}
                                      className="mt-1 text-green-600"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-gray-900">
                                          {card.name_on_card}
                                        </span>
                                        {card.is_default && (
                                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                            Default
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mb-1">
                                        **** **** **** {card.last_four_digits}
                                      </p>
                                      <p className="text-sm text-gray-600 mb-1">
                                        Expires {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
                                      </p>
                                      <p className="text-sm text-gray-500 capitalize">{card.card_type}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCard(card.id);
                                      }}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewCardForm(true);
                                setPaymentDetails({
                                  cardNumber: "",
                                  expiryDate: "",
                                  cvv: "",
                                  nameOnCard: "",
                                  cardType: undefined,
                                });
                              }}
                              className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition-all"
                            >
                              <Plus className="h-5 w-5" />
                              Add a new payment method
                            </button>
                          </div>
                        )}

                        
                        {showNewCardForm && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name on Card *
                              </label>
                              <input
                                type="text"
                                value={paymentDetails.nameOnCard}
                                onChange={(e) =>
                                  setPaymentDetails((prev) => ({
                                    ...prev,
                                    nameOnCard: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter name on card"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Card Number *
                              </label>
                              <input
                                type="text"
                                value={paymentDetails.cardNumber}
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
                                  value={paymentDetails.expiryDate}
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
                                  value={paymentDetails.cvv}
                                  onChange={(e) =>
                                    setPaymentDetails((prev) => ({
                                      ...prev,
                                      cvv: e.target.value.replace(/\D/g, ""),
                                    }))
                                  }
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  maxLength={4}
                                  placeholder="123"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewCardForm(false);
                                  if (selectedCardId) {
                                    const selectedCard = savedCards.find(c => c.id === selectedCardId);
                                    if (selectedCard) {
                                      selectCard(selectedCard);
                                    }
                                  }
                                }}
                                className="flex-1 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-semibold transition-colors"
                              >
                                Use this card
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCardModal(false);
                                  setShowNewCardForm(false);
                                }}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                
                {((!isAuthenticated) || (isAuthenticated && !selectedCardId && !showCardModal && !loadingCards)) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.nameOnCard}
                        onChange={(e) =>
                          setPaymentDetails((prev) => ({
                            ...prev,
                            nameOnCard: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                          ${
                            paymentValidationErrors.nameOnCard
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        maxLength={70}
                        placeholder="Enter name on card"
                      />
                      {paymentValidationErrors.nameOnCard && (
                        <p className="mt-1 text-sm text-red-600">
                          {paymentValidationErrors.nameOnCard}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                        {paymentDetails.cardType && (
                          <span className="ml-2 text-sm text-gray-500 capitalize">
                            ({paymentDetails.cardType})
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={paymentDetails.cardNumber}
                          onChange={handleCardNumberChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
                              paymentValidationErrors.cardNumber
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          maxLength={paymentDetails.cardType === "amex" ? 17 : 19}
                          placeholder="1234 5678 9012 3456"
                        />
                        {paymentDetails.cardType && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div
                              className={`w-8 h-6 rounded ${
                                paymentDetails.cardType === "visa"
                                  ? "bg-blue-600"
                                  : paymentDetails.cardType === "mastercard"
                                  ? "bg-red-600"
                                  : paymentDetails.cardType === "amex"
                                  ? "bg-gray-600"
                                  : "bg-orange-600"
                              }`}
                            ></div>
                          </div>
                        )}
                      </div>
                      {paymentValidationErrors.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">
                          {paymentValidationErrors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentDetails.expiryDate}
                          onChange={handleExpiryDateChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
                              paymentValidationErrors.expiryDate
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          maxLength={5}
                        />
                        {paymentValidationErrors.expiryDate && (
                          <p className="mt-1 text-sm text-red-600">
                            {paymentValidationErrors.expiryDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.cvv}
                          onChange={(e) =>
                            setPaymentDetails((prev) => ({
                              ...prev,
                              cvv: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
                              paymentValidationErrors.cvv
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          maxLength={4}
                          placeholder="123"
                        />
                        {paymentValidationErrors.cvv && (
                          <p className="mt-1 text-sm text-red-600">
                            {paymentValidationErrors.cvv}
                          </p>
                        )}
                      </div>
                    </div>

                    
                    {isAuthenticated && (!selectedCardId || showNewCardForm) && (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="saveCardCheckout"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="saveCardCheckout" className="text-sm text-gray-700">
                          Save this card for future purchases
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × £{item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
