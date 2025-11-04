import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f3d3e] text-white py-4 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold mb-2">Harvest Hub</h3>
            <p className="opacity-80 mb-2">
              Connecting local farmers with communities, delivering fresh produce to your doorstep.
            </p>
            <div>
              <div>(219) 555-0114</div>
              <div>Harvesthub@gmail.com</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-2">My Account</h4>
            <ul className="space-y-1 opacity-80">
              <li><a href="/account" className="hover:text-gray-300">Account</a></li>
              <li><a href="/orders" className="hover:text-gray-300">Order History</a></li>
              <li><a href="/cart" className="hover:text-gray-300">Cart</a></li>
              <li><a href="/wishlist" className="hover:text-gray-300">Wishlist</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2">Help</h4>
            <ul className="space-y-1 opacity-80">
              <li><a href="/contact" className="hover:text-gray-300">Contact</a></li>
              <li><a href="/faqs" className="hover:text-gray-300">FAQs</a></li>
              <li><a href="/terms" className="hover:text-gray-300">Terms</a></li>
              <li><a href="/privacy" className="hover:text-gray-300">Privacy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2">Categories</h4>
            <ul className="space-y-1 opacity-80">
              <li><a href="/category/fruits-vegetables" className="hover:text-gray-300">Fruits & Vegetables</a></li>
              <li><a href="/category/meat-fish" className="hover:text-gray-300">Meat & Fish</a></li>
              <li><a href="/category/dairy-eggs" className="hover:text-gray-300">Dairy & Eggs</a></li>
              <li><a href="/category/seasonal" className="hover:text-gray-300">Seasonal Produce</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-300">
          Harvest Hub © 2025. All Rights Reserved
        </div>
      </div>
    </footer>
  );
};
