"use client";

import React from "react";
import { ArrowRight, Users, Tractor } from "lucide-react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "../../components/Breadcrumb";

interface SelectionCardProps {
  title: string;
  description: string;
  userType: "customer" | "farmer";
  onRegister: (type: string) => void;
  onLogin: (type: string) => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  description,
  userType,
  onRegister,
  onLogin,
}) => {
  return (
    <div className="group h-full p-1">
      <div
        className={`
        h-full rounded-2xl p-8
        transform transition-all duration-300
        group-hover:scale-105 
        ${
          userType === "customer"
            ? "bg-gradient-to-br from-green-400 to-green-600"
            : "bg-gradient-to-br from-green-700 to-green-900"
        }
      `}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          {userType === "customer" ? (
            <Users size={48} className="text-white mb-2" />
          ) : (
            <Tractor size={48} className="text-white mb-2" />
          )}

          <h2 className="text-3xl font-bold text-white text-center">{title}</h2>
          <p className="text-white/90 text-center max-w-sm mb-4">
            {description}
          </p>

          <button
            onClick={() => onRegister(userType)}
            className="w-full max-w-xs bg-yellow-500 hover:bg-yellow-600 
              text-white font-semibold px-6 py-3 rounded-xl
              flex items-center justify-center gap-2 
              transform transition-all duration-200 
              hover:shadow-lg hover:-translate-y-1"
          >
            Register now
            <ArrowRight size={20} />
          </button>

          <div className="text-white text-sm mt-4">
            Already have an account?{" "}
            <button
              onClick={() => onLogin(userType)}
              className="text-yellow-300 hover:text-yellow-400 font-medium 
                underline-offset-2 hover:underline transition-colors duration-200"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SelectionPage: React.FC = () => {
  const router = useRouter();

  const handleRegister = (type: string) => {
    console.log(`Registering as ${type}`);
    localStorage.setItem("userType", type);
    
    if (type === "customer") {
      router.push("/user-registration");
    } else if (type === "farmer") {
      router.push("/register");
    }
  };

  const handleLogin = (type: string) => {
    console.log(`Logging in as ${type}`);
    if (type === "farmer") {
      router.push("/login/farmer");
    } else if (type === "customer") {
      router.push("/login/user");
    }
  };

  return (
    <main className="flex-grow py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb pageName="Select Account Type" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[600px]">
          <SelectionCard
            title="Customer Account"
            description="Find and purchase fresh produce directly from local farmers. Get access to the best quality products for your needs."
            userType="customer"
            onRegister={handleRegister}
            onLogin={handleLogin}
          />

          <SelectionCard
            title="Farmer Account"
            description="Sell your produce directly to customers. Manage your inventory and grow your farming business."
            userType="farmer"
            onRegister={handleRegister}
            onLogin={handleLogin}
          />
        </div>
      </div>
    </main>
  );
};

export default SelectionPage;

