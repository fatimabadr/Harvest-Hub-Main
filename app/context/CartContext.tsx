"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  quantity: number;
  imageUrl?: string | null;
  farmId: number;
  farmName: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: {
    id: number;
    name: string;
    price: number;
    unit: string;
    category: string;
    imageUrl?: string | null;
    farmId: number;
    farmName: string;
  }, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartTotal: () => 0,
  getCartItemCount: () => 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        setCartItems([]);
      }
    }
    setIsLoaded(true);
  }, []);

  
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
      
      
      const total = getCartTotal();
      const mainElement = document.querySelector("main");
      if (mainElement) {
        mainElement.setAttribute("data-cart-total", total.toString());
      }
    }
  }, [cartItems, isLoaded]);

  const addToCart = (
    product: {
      id: number;
      name: string;
      price: number;
      unit: string;
      category: string;
      imageUrl?: string | null;
      farmId: number;
      farmName: string;
    },
    quantity: number = 1
  ) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === product.id
      );

      if (existingItemIndex >= 0) {
        
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        
        return [
          ...prevItems,
          {
            id: Date.now(),
            productId: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            category: product.category,
            quantity,
            imageUrl: product.imageUrl,
            farmId: product.farmId,
            farmName: product.farmName,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

