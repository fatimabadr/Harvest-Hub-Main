"use client";
import React, { useState } from "react";
import Link from "next/link";
import UserMenu from "./UserMenu";

export const FarmerHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const farmerNavLinks = [
    {
      label: "Dashboard",
      href: "/dashboard/farmer",
    },
    {
      label: "Products",
      href: "/dashboard/farmer/products",
    },
    {
      label: "Packages",
      href: "/dashboard/farmer/packages",
    },
    {
      label: "Orders",
      href: "/dashboard/farmer/orders",
    },
    {
      label: "Settings",
      href: "/dashboard/farmer/settings",
    },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="px-24 mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden hover:bg-gray-100 p-1 rounded-md transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Link
              href="/dashboard/farmer"
              className="text-xl md:text-2xl font-bold text-green-900 hover:text-green-700 transition-colors duration-200"
            >
              Harvest Hub
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <UserMenu />
          </div>
        </div>

        <div
          className={`${
            isMenuOpen ? "block" : "hidden"
          } lg:hidden mt-4 pb-4 border-t border-gray-200`}
        >
          <div className="mt-4 space-y-4">
            <div className="flex flex-col space-y-2">
              {farmerNavLinks.map((link) => (
                <Navlink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex justify-center py-2 border-t border-gray-200 bg-white">
        <div className="flex space-x-12">
          {farmerNavLinks.map((link) => (
            <Navlink key={link.href} href={link.href} label={link.label} />
          ))}
        </div>
      </div>
    </nav>
  );
};

const Navlink = ({ href, label }: { href: string; label: string }) => {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-green-900 hover:bg-gray-50 py-2 px-3 rounded-md transition-all duration-200"
    >
      {label}
    </Link>
  );
};

