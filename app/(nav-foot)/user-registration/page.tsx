"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  User,
  Mail,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  googleToken?: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasUpperCase: boolean;
}

const UserTypeCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ title, description, icon, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
      isSelected
        ? "border-green-500 bg-green-50"
        : "border-gray-200 hover:border-green-300"
    }`}
  >
    <div className="flex gap-4">
      <div className={isSelected ? "text-green-600" : "text-gray-400"}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {isSelected && (
        <div className="absolute top-4 right-4">
          <Check className="w-5 h-5 text-green-600" />
        </div>
      )}
    </div>
  </div>
);

const SocialLoginButton: React.FC<{
  provider: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ provider, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
  >
    {icon}
    <span className="font-medium">Continue with {provider}</span>
  </button>
);

const RegistrationPage: React.FC = () => {
  const [step, setStep] = useState(1); 
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loginMethod, setLoginMethod] = useState<"email" | "google" | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    dateOfBirth: "",
  });
  const [emailInput, setEmailInput] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasMinLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUpperCase: false,
  });
  const [twoFactorData, setTwoFactorData] = useState<{
    qrCode?: string;
    backupCodes?: string[];
    message?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    if (!email) {
      setEmailStatus({ checking: false, available: undefined, message: "" });
      return false;
    }
    if (!validateEmail(email)) {
      setEmailStatus({
        checking: false,
        available: false,
        message: "Please enter a valid email address",
      });
      return false;
    }
    setEmailStatus({
      checking: true,
      available: undefined,
      message: "Checking email availability...",
    });
    try {
      const response = await fetch("/api/user-registration/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      const isAvailable = data.available === true;
      setEmailStatus({
        checking: false,
        available: isAvailable,
        message: data.message,
      });
      return isAvailable;
    } catch (error) {
      setEmailStatus({
        checking: false,
        available: false,
        message: "Error checking email availability. Please try again.",
      });
      return false;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmailInput(newEmail);
    
    if (newEmail.trim() === "") {
      setEmailStatus({ checking: false, available: undefined, message: "" });
    } else if (step === 2 && loginMethod === "email") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (validateEmail(newEmail)) {
          checkEmailAvailability(newEmail);
        } else {
          setEmailStatus({ checking: false, available: false, message: "Please enter a valid email address" });
        }
      }, 500);
    }
  };

  const validatePassword = (password: string) => {
    const strengthChecks = {
      hasMinLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
    };
    setPasswordStrength(strengthChecks);
    return Object.values(strengthChecks).every((check) => check);
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D+/g, "");
    if (!cleaned) return { isValid: false, error: "Phone number is required" };
    if (cleaned.startsWith("44") && cleaned.length === 12)
      phone = "0" + cleaned.slice(2);
    if (!/^07\d{9}$/.test(phone))
      return {
        isValid: false,
        error: "Enter a valid UK mobile number (07xxxxxxxxx)",
      };
    return { isValid: true };
  };

  const validateDateOfBirth = (dob: string) => {
    if (!dob) return { isValid: false, error: "Date of birth is required" };
    const today = new Date("2025-02-23");
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (birthDate > today)
      return { isValid: false, error: "Date of birth cannot be in the future" };
    if (adjustedAge < 18)
      return { isValid: false, error: "You must be at least 18 years old" };
    if (adjustedAge > 100)
      return { isValid: false, error: "Age cannot exceed 100 years" };
    return { isValid: true };
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);

      try {
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        const userData = await userInfoResponse.json();

        const response = await fetch("/api/user-registration-auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenResponse.access_token,
            accountType: "individual",
          }),
        });
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        if (!response.ok)
          throw new Error(data.error || "Google registration failed");
        setTwoFactorData({
          qrCode: data.twoFactorSecret,
          backupCodes: data.backupCodes,
          message:
            data.message || "Account created via Google. Please set up 2FA.",
        });
        setStep(5);
      } catch (err: any) {
        console.error("Google signup error:", err.message);
        setErrors({ ...errors, email: err.message });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      console.error("Google OAuth error");
      setErrors({ ...errors, email: "Google login failed. Please try again." });
    },
  });

  const handleSocialLogin = (provider: "google") => {
    setLoginMethod(provider);
    googleLogin();
  };

  const handleEmailLogin = () => {
    setLoginMethod("email");
    setStep(2);
  };

  const validateStep = (currentStep: number) => {
    const newErrors: FormErrors = {};

    
    if (currentStep === 2 && loginMethod === "email") {
      if (!emailInput) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(emailInput)) {
        newErrors.email = "Please enter a valid email";
      } else if (emailStatus.checking) {
        newErrors.email = "Checking email...";
      } else if (emailStatus.available === false) {
        newErrors.email = emailStatus.message || "Email is not available";
      } else if (emailStatus.available !== true) {
        
        newErrors.email = "Please wait for email verification to complete";
      }
    }

    
    if (currentStep === 3) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      
      const phoneValidation = validatePhoneNumber(formData.phoneNumber || "");
      if (!phoneValidation.isValid)
        newErrors.phoneNumber = phoneValidation.error;
      const dobValidation = validateDateOfBirth(formData.dateOfBirth || "");
      if (!dobValidation.isValid) newErrors.dateOfBirth = dobValidation.error;
    }

    
    if (currentStep === 4 && loginMethod === "email") {
      if (!formData.password) newErrors.password = "Password is required";
      else if (!validatePassword(formData.password))
        newErrors.password = "Password does not meet requirements";
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    console.log("Validation errors:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 2 && loginMethod === "email") {
      
      if (emailInput && validateEmail(emailInput)) {
        let emailAvailable = emailStatus.available;
        
        
        if (emailAvailable === undefined || emailStatus.checking) {
          
          emailAvailable = await checkEmailAvailability(emailInput);
          
          
          if (!emailAvailable) {
            return;
          }
        } else if (emailAvailable !== true) {
          
          console.log("Email check not completed or email not available");
          return;
        }
      }
    }

    
    if (validateStep(step)) {
      if (step === 2 && loginMethod === "email") {
        setFormData({ ...formData, email: emailInput });
      }

      setStep(step + 1);
    } else {
      console.log("Validation failed for step", step);
    }
  };

  const handleBack = () => {
    if (step > 1 && !loading) {
      if (step === 5 && loginMethod === "google") {
        setStep(1);
      } else {
        setStep(step - 1);
      }
    }
  };

  const handleSubmit = async () => {
    
    if (!validateStep(4)) {
      console.log("Validation failed for step 4");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/user-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          accountType: "individual",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");
      setTwoFactorData({
        qrCode: data.twoFactorSecret,
        backupCodes: data.backupCodes,
        message: data.message,
      });
      setStep(5); 
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrors({ ...errors, password: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isNextDisabled = useCallback(() => {
    if (loading) return true;
    if (step === 2 && loginMethod === "email") {
      return (
        !emailInput ||
        !validateEmail(emailInput) ||
        emailStatus.checking ||
        emailStatus.available !== true
      );
    }
    
    if (step === 4 && loginMethod === "email") {
      return false;
    }
    return false;
  }, [loading, step, loginMethod, emailInput, emailStatus]);

  const getStepContent = (isMobile = false) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sign Up</h2>
            <SocialLoginButton
              provider="Google"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
              }
              onClick={() => handleSocialLogin("google")}
            />
            <SocialLoginButton
              provider="Email"
              icon={<Mail className="w-5 h-5 text-gray-600" />}
              onClick={handleEmailLogin}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
            <div className="pt-4 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <a href="/login/user" className="text-green-600 font-medium">
                  Log in
                </a>
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full">
            <label
              htmlFor={isMobile ? "email-mobile" : "email-desktop"}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              What's your email?
            </label>
            <input
              type="email"
              id={isMobile ? "email-mobile" : "email-desktop"}
              value={emailInput}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
            <p
              className={`mt-1 text-sm ${
                emailStatus.available === true
                  ? "text-green-600"
                  : emailStatus.available === false
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              {emailStatus.checking
                ? "Checking email availability..."
                : emailStatus.message || ""}
            </p>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 w-full">
            {loginMethod !== "google" && (
              <>
                <div>
                  <label
                    htmlFor={
                      isMobile ? "firstName-mobile" : "firstName-desktop"
                    }
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id={isMobile ? "firstName-mobile" : "firstName-desktop"}
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Enter your first name"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={
                      isMobile ? "lastName-mobile" : "lastName-desktop"
                    }
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id={isMobile ? "lastName-mobile" : "lastName-desktop"}
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Enter your last name"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </>
            )}
            <div>
              <label
                htmlFor={
                  isMobile ? "phoneNumber-mobile" : "phoneNumber-desktop"
                }
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id={isMobile ? "phoneNumber-mobile" : "phoneNumber-desktop"}
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value.slice(0, 11) })
                }
                placeholder="Enter phone number"
                maxLength={11}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phoneNumber}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor={
                  isMobile ? "dateOfBirth-mobile" : "dateOfBirth-desktop"
                }
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id={isMobile ? "dateOfBirth-mobile" : "dateOfBirth-desktop"}
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>
          </div>
        );
      case 4:
        if (loginMethod === "email") {
          return (
            <div className="space-y-4 w-full">
              <div>
                <label
                  htmlFor={isMobile ? "password-mobile" : "password-desktop"}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id={isMobile ? "password-mobile" : "password-desktop"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      validatePassword(e.target.value);
                    }}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Password requirements:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        label: "At least 8 characters",
                        met: passwordStrength.hasMinLength,
                      },
                      {
                        label: "Contains a number",
                        met: passwordStrength.hasNumber,
                      },
                      {
                        label: "Contains a special character",
                        met: passwordStrength.hasSpecialChar,
                      },
                      {
                        label: "Contains an uppercase letter",
                        met: passwordStrength.hasUpperCase,
                      },
                    ].map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            req.met ? "bg-green-600" : "bg-gray-200"
                          }`}
                        >
                          {req.met && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`text-sm ${
                            req.met ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor={
                    isMobile
                      ? "confirmPassword-mobile"
                      : "confirmPassword-desktop"
                  }
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id={
                    isMobile
                      ? "confirmPassword-mobile"
                      : "confirmPassword-desktop"
                  }
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          );
        }
        return null;
      case 5: 
        return (
          <div className="text-center py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Account Created!
            </h2>
            <p className="text-gray-600 mb-4">
              {twoFactorData.message ||
                (loginMethod === "google"
                  ? "Account created via Google. Please set up 2FA."
                  : "Please verify your email. Set up 2FA by scanning this QR code:")}
            </p>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Two-Factor Authentication Setup Instructions
              </h3>
              <ol className="text-left text-gray-600 space-y-3 mb-4">
                <li>1. Download an authenticator app on your phone:
                  <ul className="ml-6 mt-1 list-disc">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                  </ul>
                </li>
                <li>2. Open your authenticator app</li>
                <li>3. Tap the + or "Add Account" button in your app</li>
                <li>4. Choose "Scan QR Code" and scan the code below</li>
                <li>5. The app will now show a 6-digit code that changes every 30 seconds</li>
                <li>6. You'll need this code along with your password when logging in</li>
              </ol>
            </div>

            {twoFactorData.qrCode && (
              <div className="mb-6">
                <QRCodeSVG
                  value={twoFactorData.qrCode}
                  size={150}
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-gray-500">
                  Can't scan? The QR code contains a secret key for generating secure login codes.
                </p>
              </div>
            )}

            <div className="bg-yellow-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                Important: Save Your Backup Codes
              </h3>
              <p className="text-yellow-700 mb-3">
                If you lose access to your authenticator app, you'll need these backup codes to log in.
                Store them in a secure place - they can only be used once each.
              </p>
              <ul className="text-sm font-mono bg-white p-4 rounded border border-yellow-200 mb-4 space-y-1">
                {twoFactorData.backupCodes?.map((code, i) => (
                  <li key={i}>{code}</li>
                ))}
              </ul>
              <button
                onClick={() => {
                  const blob = new Blob(
                    [twoFactorData.backupCodes?.join("\n") || ""],
                    { type: "text/plain" }
                  );
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "backup-codes.txt";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg w-full sm:w-auto"
              >
                Download Backup Codes
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileProgress = () => {
    if (step === 0) return null;
    const totalSteps = loginMethod === "email" ? 6 : 3;
    const progressStep =
      step === 1 ? 2 : step === 2 ? 3 : step === 3 ? 4 : step === 4 ? 5 : 6;
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          {step >= 1 && step !== 5 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex items-center text-gray-600 gap-1.5 py-1 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}
          <div className="flex gap-1.5 absolute left-1/2 -translate-x-1/2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  progressStep >= num ? "bg-green-600 w-4" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>
      </div>
    );
  };

  const renderDesktopProgress = () => {
    if (step === 0) return null;
    const labels =
      loginMethod === "email"
        ? [
            "Account Type",
            "Sign Up",
            "Email",
            "Personal Info",
            "Password",
            "Success",
          ]
        : ["Account Type", "Sign Up", "Complete"];
    const totalSteps = labels.length;
    const progressStep =
      step === 1 ? 2 : step === 2 ? 3 : step === 3 ? 4 : step === 4 ? 5 : 6;
    return (
      <div className="hidden md:flex justify-between mb-8 relative">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
          (number, index) => (
            <div key={number} className="flex-1 text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  progressStep >= number
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {progressStep > number ? <Check className="w-5 h-5" /> : number}
              </div>
              <p
                className={`text-sm ${
                  progressStep >= number
                    ? "font-medium text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {labels[index]}
              </p>
            </div>
          )
        )}
        <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-200 -z-10">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{
              width: `${((progressStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  };

  const getHeaderText = () =>
    [
      "Choose Account Type",
      "Sign up to continue",
      "What's your email?",
      "Tell us about yourself",
      "Create a password",
      "All set!",
    ][step] || "";
  const getSubHeaderText = () =>
    [
      "Select the type of account you want to create",
      "Select how you want to sign up",
      "We'll use this to keep your account secure",
      "Help us personalize your experience",
      "Make sure it's secure",
      "Your account is ready",
    ][step] || "";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 md:bg-gray-100">
      {renderMobileProgress()}
      <main className="flex-grow md:py-12">
        <div className="w-full md:max-w-xl mx-auto">
          <div className="md:hidden">
            <div className="bg-white min-h-screen px-5 pt-16 pb-20">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {getHeaderText()}
                </h1>
                <p className="text-sm text-gray-500">{getSubHeaderText()}</p>
              </div>
              <div className="space-y-6">{getStepContent(true)}</div>
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
                {step >= 0 && (
                  <div className="flex gap-4">
                    {step >= 1 && step !== 5 && (
                      <button
                        onClick={handleBack}
                        disabled={loading}
                        className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </button>
                    )}
                    <button
                      onClick={
                        step === 4 && loginMethod === "email"
                          ? handleSubmit
                          : step === 5
                          ? () => (window.location.href = "/login/user")
                          : handleNext
                      }
                      disabled={isNextDisabled()}
                      className={`flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors ${
                        isNextDisabled() ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading
                        ? "Processing..."
                        : step === 4 && loginMethod === "email"
                        ? "Create Account"
                        : step === 5
                        ? "Done"
                        : "Next"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create an account
              </h1>
              <p className="text-base text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Log in
                </a>
              </p>
            </div>
            {renderDesktopProgress()}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="space-y-6">{getStepContent(false)}</div>
              {step >= 0 && (
                <div className="flex gap-4 pt-4">
                  {step >= 1 && step !== 5 && (
                    <button
                      onClick={handleBack}
                      disabled={loading}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={
                      step === 4 && loginMethod === "email"
                        ? handleSubmit
                        : step === 5
                        ? () => (window.location.href = "/login")
                        : handleNext
                    }
                    disabled={isNextDisabled()}
                    className={`flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      isNextDisabled() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading
                      ? "Processing..."
                      : step === 4 && loginMethod === "email"
                      ? "Create Account"
                      : step === 5
                      ? "Done"
                      : "Next"}
                    {step !== 4 && step !== 5 && (
                      <ArrowRight className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default () => (
  <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
    <RegistrationPage />
  </GoogleOAuthProvider>
);

