"use client";

import React, { useEffect, useState } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { FarmerHeader } from "./FarmerHeader";
import { FarmerFooter } from "./FarmerFooter";
import { useAuth } from "@/app/context/AuthContext";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [cartTotal, setCartTotal] = useState(0);
  const { user, isLoading } = useAuth();
  const isFarmer = user?.accountType === "farmer";

  useEffect(() => {
    const updateCartTotal = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const total = mainElement.getAttribute('data-cart-total');
        if (total) {
          setCartTotal(parseFloat(total));
        }
      }
    };

    updateCartTotal();
    const observer = new MutationObserver(updateCartTotal);
    const mainElement = document.querySelector('main');
    if (mainElement) {
      observer.observe(mainElement, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  
  if (isFarmer) {
    return (
      <>
        <FarmerHeader />
        {children}
        <FarmerFooter />
      </>
    );
  }

  return (
    <>
      <Header cartTotal={cartTotal} />
      {children}
      <Footer />
    </>
  );
}

