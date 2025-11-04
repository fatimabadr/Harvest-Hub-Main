"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Truck, MapPin, Plus, Edit2, Trash2, X } from "lucide-react";
import { SUBSCRIPTION_PLANS, PlanType } from "@/types/types";
import { useAuth } from "@/app/context/AuthContext";

interface DeliveryAddress {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  postcode: string;
  instructions: string;
}

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
  cardType?: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  street?: string;
  city?: string;
  postcode?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  nameOnCard?: string;
  deliveryDays?: string;
}

interface SubscriptionPlan {
  type: string;
  price: number;
  billingCycle: string;
  productDiscount: number;
  frequency: "monthly" | "biweekly" | "weekly";
}

interface SelectedPackage {
  type: "premade" | "custom";
  plan: PlanType;
  package?: any;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    postcode: "",
    instructions: "",
  });
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    cardType: undefined,
  });
  const [selectedDeliveryDays, setSelectedDeliveryDays] = useState<string[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [subscriptionPlan, setSubscriptionPlan] =
    useState<SubscriptionPlan | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SelectedPackage | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  
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
          
          
          const defaultAddress = addresses.find((addr: any) => addr.is_default);
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

  
  useEffect(() => {
    const fetchCards = async () => {
      if (!isAuthenticated || !user || step !== 2) {
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

    fetchCards();
  }, [isAuthenticated, user, step]);

  useEffect(() => {
    const selectedPackageStr = localStorage.getItem("selectedPackage");
    if (selectedPackageStr) {
      const selectedPackage = JSON.parse(selectedPackageStr) as SelectedPackage;
      setSelectedPackage(selectedPackage);

      const planDetails = SUBSCRIPTION_PLANS[selectedPackage.plan];

      let frequency: "monthly" | "biweekly" | "weekly";
      switch (selectedPackage.plan) {
        case "monthly":
          frequency = "monthly";
          break;
        case "biweekly":
          frequency = "biweekly";
          break;
        case "weekly":
          frequency = "weekly";
          break;
        default:
          frequency = "monthly";
      }

      setSubscriptionPlan({
        type: selectedPackage.plan,
        price: planDetails.price,
        billingCycle: "monthly",
        productDiscount: planDetails.productDiscount,
        frequency,
      });
    }
  }, [isLoading, isAuthenticated, user, router]);

  const selectAddress = (address: any) => {
    setDeliveryAddress({
      firstName: address.first_name,
      lastName: address.last_name,
      email: user?.email || "",
      street: address.address,
      city: address.city,
      postcode: address.postcode,
      instructions: address.delivery_instructions || "",
    });
    setSelectedAddressId(address.id);
    setShowNewAddressForm(false);
    setEditingAddressId(null);
    setShowAddressModal(false);
    setValidationErrors({});
  };

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setDeliveryAddress({
      firstName: address.first_name,
      lastName: address.last_name,
      email: user?.email || "",
      street: address.address,
      city: address.city,
      postcode: address.postcode,
      instructions: address.delivery_instructions || "",
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
    if (!validateDeliveryForm()) return;

    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const url = `/api/user/addresses`;
      const method = editingAddressId ? "PUT" : "POST";

      const body = {
        ...(editingAddressId && { id: editingAddressId }),
        firstName: deliveryAddress.firstName,
        lastName: deliveryAddress.lastName,
        phoneNumber: "",
        address: deliveryAddress.street,
        city: deliveryAddress.city,
        postcode: deliveryAddress.postcode,
        deliveryInstructions: deliveryAddress.instructions,
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
    setValidationErrors({});
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

  const getDeliveryDays = () => {
    const days = new Set<string>();
    const today = new Date();
    let i = 1;
    while (days.size < 31) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.add(date.toISOString().split("T")[0]);
      i++;
    }
    return Array.from(days);
  };

  const getRequiredDeliveryDays = () => {
    if (!subscriptionPlan) return 1;
    switch (subscriptionPlan.frequency) {
      case "weekly":
        return 4;
      case "biweekly":
        return 2;
      case "monthly":
      default:
        return 1;
    }
  };

  
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  
  const isSameWeek = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      getWeekNumber(date1) === getWeekNumber(date2)
    );
  };

  
  const isDateSelectable = (
    day: string,
    selectedDays: string[],
    frequency: "weekly" | "biweekly" | "monthly"
  ): boolean => {
    const dayDate = new Date(day);
    
    
    for (const selectedDay of selectedDays) {
      const selectedDate = new Date(selectedDay);
      if (isSameWeek(dayDate, selectedDate)) {
        return false;
      }
    }

    
    if (frequency === "biweekly" && selectedDays.length > 0) {
      const dayTime = dayDate.getTime();
      for (const selectedDay of selectedDays) {
        const selectedTime = new Date(selectedDay).getTime();
        const diffDays = Math.abs(dayTime - selectedTime) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          return false;
        }
      }
    }

    return true;
  };

  const handleDeliveryDayClick = (day: string) => {
    setSelectedDeliveryDays((prev) => {
      const requiredDays = getRequiredDeliveryDays();
      
      
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      
      
      if (!subscriptionPlan || !isDateSelectable(day, prev, subscriptionPlan.frequency)) {
        return prev;
      }

      
      if (prev.length < requiredDays) {
        return [...prev, day].sort();
      }

      
      return [...prev.slice(1), day].sort();
    });
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

  const formatTotalQuantity = (unit: string, quantity: number) => {
    
    if (/^\d+[a-zA-Z]+$/.test(unit)) {
      return unit;
    }
    
    return `${quantity} ${unit}`;
  };

  const calculateItemsTotal = (
    items?: Array<{ price: number; quantity: number }>
  ) => {
    if (!items) return 0;
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateSavings = (itemsTotal: number, discountPercentage: number) => {
    return (itemsTotal * discountPercentage) / 100;
  };

  const validatePostcode = (postcode: string) => {
    const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    return postcodePattern.test(postcode.trim());
  };

  const cardPatterns = {
    visa: /^4\d{15}$/,
    mastercard: /^(5[1-5]|2[2-7])\d{14}$/,
    amex: /^3[47]\d{13}$/,
    discover: /^6(?:011|5\d{2})\d{12}$/,
  };

  const detectCardType = (number: string): string | undefined => {
    const cleanNumber = number.replace(/\D/g, "");

    if (cleanNumber.startsWith("4")) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6(011|5)/.test(cleanNumber)) return "discover";

    return undefined;
  };

  const validateCardNumber = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\D/g, "");

    if (!cleanNumber) return false;

    if (cleanNumber.length !== 15 && cleanNumber.length !== 16) return false;

    const cardType = detectCardType(cleanNumber);
    if (!cardType) return false;

    if (!cardPatterns[cardType as keyof typeof cardPatterns].test(cleanNumber))
      return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const validateExpiryDate = (expiryDate: string) => {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;

    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  };

  const validateCVV = (cvv: string) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const cardType = detectCardType(cleanValue);

    if (cardType === "amex") {
      const groups = cleanValue.match(/(\d{0,4})(\d{0,6})(\d{0,5})/);
      if (groups) {
        return [groups[1], groups[2], groups[3]].filter(Boolean).join(" ");
      }
    } else {
      const groups = cleanValue.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
      if (groups) {
        return [groups[1], groups[2], groups[3], groups[4]]
          .filter(Boolean)
          .join(" ");
      }
    }
    return cleanValue;
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
        
        setEmailError(null);
        setEmailSuccess("This email already exists. You can finish as guest or log in later.");
        return true;
      } else {
        
        setEmailSuccess("Email looks good. You can continue as guest and create an account later.");
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailError("Failed to verify email. Please try again.");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  

  const validateDeliveryForm = () => {
    const errors: ValidationErrors = {};

    if (!deliveryAddress.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!deliveryAddress.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!deliveryAddress.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryAddress.email)) {
      errors.email = "Please enter a valid email address";
    } else if (emailError) {
      errors.email = emailError;
    }

    if (!deliveryAddress.street.trim()) {
      errors.street = "Street address is required";
    }

    if (!deliveryAddress.city.trim()) {
      errors.city = "City is required";
    }

    if (!deliveryAddress.postcode.trim()) {
      errors.postcode = "Postcode is required";
    } else if (!validatePostcode(deliveryAddress.postcode)) {
      errors.postcode = "Please enter a valid UK postcode";
    }

    const requiredDays = getRequiredDeliveryDays();
    if (selectedDeliveryDays.length !== requiredDays) {
      errors.deliveryDays = `Please select ${requiredDays} delivery ${
        requiredDays === 1 ? "day" : "days"
      }`;
      setError(errors.deliveryDays);
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePaymentForm = () => {
    const errors: ValidationErrors = {};
    const isSavedCard = paymentDetails.cardNumber.includes("*");

    if (!paymentDetails.nameOnCard.trim()) {
      errors.nameOnCard = "Name on card is required";
    }

    
    if (!isSavedCard) {
      if (!paymentDetails.cardNumber.trim()) {
        errors.cardNumber = "Card number is required";
      } else if (!validateCardNumber(paymentDetails.cardNumber)) {
        errors.cardNumber = "Please enter a valid card number";
      }

      if (!paymentDetails.expiryDate) {
        errors.expiryDate = "Expiry date is required";
      } else if (!validateExpiryDate(paymentDetails.expiryDate)) {
        errors.expiryDate = "Please enter a valid expiry date (MM/YY)";
      }
    } else {
      
      if (!paymentDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
        errors.expiryDate = "Expiry date is required";
      }
    }

    
    if (!paymentDetails.cvv) {
      errors.cvv = "CVV is required";
    } else if (!validateCVV(paymentDetails.cvv)) {
      errors.cvv = "Please enter a valid CVV";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDeliveryForm()) {
      return;
    }

    
    if (isAuthenticated && showNewAddressForm && !selectedAddressId) {
      await handleSaveAddress(false);
    }

    setError(null);
    setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePaymentForm()) {
      setIsProcessing(true);
      setError(null);

      try {
        const selectedPackageStr = localStorage.getItem("selectedPackage");
        if (!selectedPackageStr || !subscriptionPlan) {
          throw new Error("No subscription plan selected");
        }

        const selectedPackage = JSON.parse(selectedPackageStr);
        
        
        let retailValue = subscriptionPlan.price;
        let finalPrice = subscriptionPlan.price;
        
        if (selectedPackage.type === "custom") {
          const itemsTotal = calculateItemsTotal(selectedPackage.items);
          const savings = calculateSavings(itemsTotal, subscriptionPlan.productDiscount);
          retailValue += itemsTotal;  
          finalPrice += (itemsTotal - savings);  
        } else if (selectedPackage.type === "premade") {
          
          const singlePackageRetailValue = Number(selectedPackage.package.retail_value);
          if (subscriptionPlan.billingCycle === "monthly") {
            
            if (subscriptionPlan.frequency === "weekly") {
              retailValue = singlePackageRetailValue * 4; 
            } else if (subscriptionPlan.frequency === "biweekly") {
              retailValue = singlePackageRetailValue * 2; 
            } else {
              retailValue = singlePackageRetailValue; 
            }
          } else {
            
            retailValue = singlePackageRetailValue;
          }
        }
        
        
        retailValue = Number(retailValue.toFixed(2));
        finalPrice = Number(finalPrice.toFixed(2));

        
        let items;
        if (selectedPackage.type === "premade") {
          
          const productsResponse = await fetch('/api/subscription/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: selectedPackage.package.items.map((item: any) => item.name)
            })
          });

          if (!productsResponse.ok) {
            throw new Error('Failed to fetch product IDs');
          }

          const productsData = await productsResponse.json();
          items = selectedPackage.package.items.map((item: any, index: number) => ({
            product_id: productsData[index].product_id,
            quantity: item.quantity,
          }));
        } else {
          items = selectedPackage.items;
        }

        const response = await fetch("/api/subscription/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: deliveryAddress.firstName,
            lastName: deliveryAddress.lastName,
            email: deliveryAddress.email,
            subscriptionType: subscriptionPlan.frequency,
            deliveryAddress: deliveryAddress.street,
            city: deliveryAddress.city,
            postcode: deliveryAddress.postcode,
            deliveryInstructions: deliveryAddress.instructions,
            deliveryDates: selectedDeliveryDays,
            items: items,
            totalPrice: finalPrice,
            retail_value: retailValue,
            packageType: selectedPackage.type,
            package: selectedPackage.type === 'premade' ? selectedPackage.package : undefined
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.requiresRegistration) {
            setError("Please register an account before creating a subscription. You will be redirected to the registration page.");
            setTimeout(() => {
              router.push("/sign-up");
            }, 3000);
            return;
          }
          throw new Error(data.error || "Failed to create subscription");
        }

        
        
        if (saveCard && isAuthenticated) {
          await handleSaveCardAfterPayment();
        }

        localStorage.removeItem("selectedPackage");

        
        router.push(`/subscription-confirmation?id=${data.subscriptionId}`);

      } catch (error) {
        console.error("Error processing subscription:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while processing your subscription"
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const renderOrderSummary = () => {
    if (!selectedPackage) return null;

    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-600">Package Type</span>
          <span className="font-medium capitalize">
            {selectedPackage.type || "-"}
          </span>
        </div>

        {selectedPackage.type === "custom" && (
          <>
            <div className="py-2 border-b">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Selected Items</span>
                <span className="font-medium">
                  £{calculateItemsTotal(selectedPackage.items).toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                {selectedPackage.items?.map((item: any, index: number) => {
                  const originalPrice = item.price * item.quantity;
                  const discountedPrice =
                    item.price *
                    item.quantity *
                    (1 - (subscriptionPlan?.productDiscount || 0) / 100);

                  return (
                    <div key={index} className="flex flex-col text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {item.name} ({formatTotalQuantity(item.unit, item.quantity)})
                        </span>
                        <div className="text-right">
                          <span className="line-through text-gray-400 mr-2">
                            £{originalPrice.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-medium">
                            £{discountedPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Unit price:{" "}
                        <span className="line-through">£{item.price.toFixed(2)}</span>
                        <span className="text-green-600 ml-1">
                          £{(item.price * (1 - (subscriptionPlan?.productDiscount || 0) / 100)).toFixed(2)}
                        </span>
                        <span className="ml-1">per {item.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Original Price</span>
              <span className="font-medium line-through text-gray-400">
                £{calculateItemsTotal(selectedPackage.items).toFixed(2)}
              </span>
            </div>

            {subscriptionPlan && (
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>
                  Subscription Savings (
                  {subscriptionPlan.productDiscount}% off)
                </span>
                <span className="font-medium">
                  -£{calculateSavings(calculateItemsTotal(selectedPackage.items), subscriptionPlan.productDiscount).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b text-green-700">
              <span>Items Total (after discount)</span>
              <span className="font-medium">
                £{(calculateItemsTotal(selectedPackage.items) - calculateSavings(calculateItemsTotal(selectedPackage.items), subscriptionPlan?.productDiscount || 0)).toFixed(2)}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between py-2 border-b">
          <div>
            <span className="text-gray-600">Subscription Plan</span>
            {subscriptionPlan && (
              <p className="text-sm text-gray-500">
                {subscriptionPlan.type} ({subscriptionPlan.billingCycle})
              </p>
            )}
          </div>
          <span className="font-medium">
            {subscriptionPlan ? `£${subscriptionPlan.price.toFixed(2)}` : "-"}
          </span>
        </div>

        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-600">Delivery</span>
          <span className="font-medium">Free</span>
        </div>

        {selectedPackage.type === 'premade' && subscriptionPlan && (() => {
          
          const singlePackageRetailValue = Number(selectedPackage.package.retail_value);
          let totalRetailValue = singlePackageRetailValue;
          if (subscriptionPlan.billingCycle === "monthly") {
            if (subscriptionPlan.frequency === "weekly") {
              totalRetailValue = singlePackageRetailValue * 4; 
            } else if (subscriptionPlan.frequency === "biweekly") {
              totalRetailValue = singlePackageRetailValue * 2; 
            }
          }
          const savings = totalRetailValue - subscriptionPlan.price;
          
          return (
            <>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Package Retail Value</span>
                <span className="font-medium line-through text-gray-400">
                  £{totalRetailValue.toFixed(2)}
                  {subscriptionPlan.billingCycle === "monthly" && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({subscriptionPlan.frequency === "weekly" ? "4 weeks" : subscriptionPlan.frequency === "biweekly" ? "2 deliveries" : "1 month"})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>Total Savings</span>
                <span className="font-medium">
                  £{savings.toFixed(2)}
                </span>
              </div>
            </>
          );
        })()}

        <div className="flex justify-between py-2 font-bold text-lg">
          <span>Your Total</span>
          <span>
            {subscriptionPlan ? `£${(subscriptionPlan.price + (selectedPackage.type === "custom" ? calculateItemsTotal(selectedPackage.items) - calculateSavings(calculateItemsTotal(selectedPackage.items), subscriptionPlan.productDiscount) : 0)).toFixed(2)}` : "£0.00"}
          </span>
        </div>

        {subscriptionPlan && (
          <div className="mt-3 sm:mt-4 space-y-2 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              You will be charged:
            </p>
            <ul className="text-xs sm:text-sm text-gray-600 list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-2">
              <li>
                £{subscriptionPlan.price.toFixed(2)} {subscriptionPlan.billingCycle} for your subscription
              </li>
              {selectedPackage.type === "custom" && (
                <>
                  <li>
                    £{(calculateItemsTotal(selectedPackage.items) - calculateSavings(calculateItemsTotal(selectedPackage.items), subscriptionPlan.productDiscount)).toFixed(2)} for your selected items
                    <span className="block text-green-600 text-xs mt-1">
                      (Includes {subscriptionPlan.productDiscount}% subscription discount, saving you £{calculateSavings(calculateItemsTotal(selectedPackage.items), subscriptionPlan.productDiscount).toFixed(2)})
                    </span>
                  </li>
                  <li className="text-xs text-gray-500 !mt-4">
                    Without a subscription, you would pay £{calculateItemsTotal(selectedPackage.items).toFixed(2)} for these items
                  </li>
                </>
              )}
              {selectedPackage.type === "premade" && (() => {
                
                const singlePackageRetailValue = Number(selectedPackage.package.retail_value);
                let totalRetailValue = singlePackageRetailValue;
                let multiplierText = "";
                if (subscriptionPlan.billingCycle === "monthly") {
                  if (subscriptionPlan.frequency === "weekly") {
                    totalRetailValue = singlePackageRetailValue * 4;
                    multiplierText = ` (4 weeks × £${singlePackageRetailValue.toFixed(2)})`;
                  } else if (subscriptionPlan.frequency === "biweekly") {
                    totalRetailValue = singlePackageRetailValue * 2;
                    multiplierText = ` (2 deliveries × £${singlePackageRetailValue.toFixed(2)})`;
                  }
                }
                const savings = totalRetailValue - subscriptionPlan.price;
                
                return (
                  <li className="text-xs text-gray-500 !mt-4">
                    Retail value: £{totalRetailValue.toFixed(2)}
                    {multiplierText && (
                      <span className="text-xs">{multiplierText}</span>
                    )}
                    <span className="block text-green-600 text-xs mt-1">
                      (You save £{savings.toFixed(2)})
                    </span>
                  </li>
                );
              })()}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-center items-center">
              <div className="flex items-center">
                <div
                  className={`flex items-center ${
                    step >= 1 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="ml-2 font-medium text-sm">Delivery</span>
                </div>
              </div>

              <div className="hidden sm:block w-16 h-0.5 bg-gray-200 mx-2" />
              <div className="block sm:hidden h-6" />

              <div className="flex items-center">
                <div
                  className={`flex items-center ${
                    step >= 2 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="ml-2 font-medium text-sm">Payment</span>
                </div>
              </div>

              <div className="hidden sm:block w-16 h-0.5 bg-gray-200 mx-2" />
              <div className="block sm:hidden h-6" />

              <div className="flex items-center">
                <div
                  className={`flex items-center ${
                    step >= 3 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-current">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="ml-2 font-medium text-sm">Confirmation</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                {step === 1 && (
                  <form onSubmit={handleDeliverySubmit}>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                      Delivery Details
                    </h2>

                    
                    {isAuthenticated && selectedAddressId && !showAddressModal && (
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Delivering to {deliveryAddress.firstName} {deliveryAddress.lastName}
                            </h3>
                            <div className="text-gray-700 space-y-1">
                              <p>{deliveryAddress.street}</p>
                              <p>{deliveryAddress.city}, {deliveryAddress.postcode}</p>
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
                        {deliveryAddress.instructions && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Delivery instructions:</span> {deliveryAddress.instructions}
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
                                {savedAddresses.length > 0 && (
                                  <>
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
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setShowNewAddressForm(true);
                                    setEditingAddressId(null);
                                    setDeliveryAddress({
                                      firstName: user?.firstName || "",
                                      lastName: user?.lastName || "",
                                      email: user?.email || "",
                                      street: "",
                                      city: "",
                                      postcode: "",
                                      instructions: "",
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
                                        disabled={isAuthenticated}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                          validationErrors.firstName || validationErrors.lastName
                                            ? "border-red-500"
                                            : "border-gray-300"
                                        } ${isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
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
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Address Line 1 (or Company Name) *
                                    </label>
                                    <input
                                      type="text"
                                      value={deliveryAddress.street}
                                      onChange={(e) =>
                                        setDeliveryAddress({
                                          ...deliveryAddress,
                                          street: e.target.value,
                                        })
                                      }
                                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        validationErrors.street ? "border-red-500" : "border-gray-300"
                                      }`}
                                      placeholder="Start typing your address"
                                    />
                                    {validationErrors.street && (
                                      <p className="mt-1 text-sm text-red-600">
                                        {validationErrors.street}
                                      </p>
                                    )}
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

                                  {isAuthenticated && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id="makeDefaultSub"
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                      />
                                      <label htmlFor="makeDefaultSub" className="text-sm text-gray-700">
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
                                      value={deliveryAddress.instructions}
                                      onChange={(e) =>
                                        setDeliveryAddress({
                                          ...deliveryAddress,
                                          instructions: e.target.value,
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
                                      const isDefault = (document.getElementById("makeDefaultSub") as HTMLInputElement)?.checked || false;
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

                    
                    {!isAuthenticated && !showAddressModal && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress.firstName}
                            onChange={(e) =>
                              setDeliveryAddress((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            disabled={isAuthenticated}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                              ${
                                validationErrors.firstName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } ${isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                            placeholder="Enter your first name"
                          />
                          {validationErrors.firstName && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress.lastName}
                            onChange={(e) =>
                              setDeliveryAddress((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            disabled={isAuthenticated}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                              ${
                                validationErrors.lastName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } ${isAuthenticated ? "bg-gray-50 cursor-not-allowed" : ""}`}
                            placeholder="Enter your last name"
                          />
                          {validationErrors.lastName && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={deliveryAddress.email}
                          disabled={isAuthenticated}
                          onBlur={() => {
                            const email = deliveryAddress.email.trim();
                            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              void checkEmailExists(email);
                            }
                          }}
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 cursor-not-allowed
                            ${
                              validationErrors.email
                                ? "border-red-500"
                                : "border-gray-300"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.street}
                          onChange={(e) =>
                            setDeliveryAddress((prev) => ({
                              ...prev,
                              street: e.target.value,
                            }))
                          }
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
                              validationErrors.street
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                        />
                        {validationErrors.street && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.street}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.city}
                          onChange={(e) =>
                            setDeliveryAddress((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
                              validationErrors.city
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                        />
                        {validationErrors.city && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.postcode}
                          onChange={(e) =>
                            setDeliveryAddress((prev) => ({
                              ...prev,
                              postcode: e.target.value.toUpperCase(),
                            }))
                          }
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Instructions
                        </label>
                        <textarea
                          value={deliveryAddress.instructions}
                          onChange={(e) =>
                            setDeliveryAddress((prev) => ({
                              ...prev,
                              instructions: e.target.value,
                            }))
                          }
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          rows={3}
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

                    
                    {((isAuthenticated && selectedAddressId) || !isAuthenticated) && !showAddressModal && (
                      <div className="mt-4 sm:mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Delivery{" "}
                          {getRequiredDeliveryDays() === 1 ? "Day" : "Days"} *
                          {subscriptionPlan && (
                            <span className="block sm:inline text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-2">
                              ({getRequiredDeliveryDays()}{" "}
                              {getRequiredDeliveryDays() === 1 ? "day" : "days"}{" "}
                              required for {subscriptionPlan.frequency}{" "}
                              delivery)
                            </span>
                          )}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                          {getDeliveryDays().map((day, index) => {
                            const isSelected = selectedDeliveryDays.includes(day);
                            const date = new Date(day);
                            const isDisabled = subscriptionPlan && !isDateSelectable(
                              day,
                              selectedDeliveryDays.filter(d => d !== day), 
                              subscriptionPlan.frequency
                            );
                            
                            return (
                              <button
                                key={`${day}-${date.getTime()}-${index}`}
                                type="button"
                                onClick={() => handleDeliveryDayClick(day)}
                                disabled={!isSelected && Boolean(isDisabled)}
                                className={`p-3 text-center border rounded-lg transition-colors ${
                                  isSelected
                                    ? "bg-green-50 border-green-500 text-green-700"
                                    : isDisabled
                                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 hover:border-green-500"
                                }`}
                              >
                                {date.toLocaleDateString("en-GB", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </button>
                            );
                          })}
                        </div>
                        {validationErrors.deliveryDays && (
                          <p className="mt-2 text-sm text-red-600">
                            {validationErrors.deliveryDays}
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="mt-4 sm:mt-6 w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                      Continue to Payment
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handlePaymentSubmit}>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                      Payment Details
                    </h2>

                    
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
                                validationErrors.cvv
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            maxLength={4}
                            placeholder="123"
                          />
                          {validationErrors.cvv && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.cvv}
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
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                            ${
                              validationErrors.nameOnCard
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          maxLength={70}
                        />
                        {validationErrors.nameOnCard && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.nameOnCard}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                              ${
                                validationErrors.cardNumber
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            maxLength={
                              paymentDetails.cardType === "amex" ? 17 : 19
                            }
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
                        {validationErrors.cardNumber && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.cardNumber}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={paymentDetails.expiryDate}
                            onChange={handleExpiryDateChange}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 
                              ${
                                validationErrors.expiryDate
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            maxLength={5}
                          />
                          {validationErrors.expiryDate && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.expiryDate}
                            </p>
                          )}
                        </div>

                        <div>
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
                                validationErrors.cvv
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            maxLength={4}
                            placeholder="123"
                          />
                          {validationErrors.cvv && (
                            <p className="mt-1 text-sm text-red-600">
                              {validationErrors.cvv}
                            </p>
                          )}
                        </div>
                      </div>

                      
                      {isAuthenticated && (!selectedCardId || showNewCardForm) && (
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <label htmlFor="saveCard" className="text-sm text-gray-700">
                            Save this card for future purchases
                          </label>
                        </div>
                      )}
                    </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="mt-4 sm:mt-6 w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                    >
                      {isProcessing ? "Processing..." : "Complete Order"}
                    </button>
                  </form>
                )}

                {step === 3 && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Order Confirmed!
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      Thank you for your order. We'll send you a confirmation
                      email with your order details.
                    </p>
                    <button
                      onClick={() => router.push("/orders")}
                      className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      View Orders
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 order-1 lg:order-2 mb-4 lg:mb-0">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
                  Order Summary
                </h3>
                {renderOrderSummary()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
