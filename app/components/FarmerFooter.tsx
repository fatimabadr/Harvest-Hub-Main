import React from 'react';
import Link from 'next/link';

export const FarmerFooter: React.FC = () => {
  return (
    <footer className="bg-green-900 text-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg md:text-xl font-bold mb-4">Harvest Hub</h3>
            <p className="text-sm opacity-80 mb-4">
              Connect with customers and grow your farm business with Harvest Hub
            </p>
            <div className="text-sm">
              <div>(219) 555-0114</div>
              <div>Harvesthub@gmail.com</div>
            </div>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-bold mb-4">Farmer Dashboard</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/dashboard/farmer" className="hover:text-gray-300">Dashboard</Link></li>
              <li><Link href="/dashboard/farmer/products" className="hover:text-gray-300">Manage Products</Link></li>
              <li><Link href="/dashboard/farmer/packages" className="hover:text-gray-300">My Packages</Link></li>
              <li><Link href="/dashboard/farmer/orders" className="hover:text-gray-300">Orders & Subscriptions</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-bold mb-4">Account</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/dashboard/farmer/settings" className="hover:text-gray-300">Settings</Link></li>
              <li><Link href="/subscriptions/create" className="hover:text-gray-300">Create Package</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/contact" className="hover:text-gray-300">Contact</Link></li>
              <li><Link href="/faqs" className="hover:text-gray-300">FAQs</Link></li>
              <li><Link href="/terms" className="hover:text-gray-300">Terms & Condition</Link></li>
              <li><Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-xs text-gray-300 order-2 md:order-1">
              Harvest Hub © 2024. All Rights Reserved
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

