import React from "react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="relative bg-[#0f3d3e] text-white py-4 px-6 flex justify-between items-center">
      
      <h1 className="text-lg font-bold">Harvest Hub</h1>

      
      <nav className="flex space-x-6">
        <div className="relative group">
          <button className="flex items-center space-x-1">
            <span>Browse</span>
            <span className="ml-1">▼</span>
          </button>
          
          <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white text-black rounded-md mt-2 py-2 shadow-lg w-32 transition-all duration-200">
            <Link href="#" passHref>
              <span className="block px-4 py-2 hover:bg-gray-200">Fruits</span>
            </Link>
            <Link href="#" passHref>
              <span className="block px-4 py-2 hover:bg-gray-200">Vegetables</span>
            </Link>
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center space-x-1">
            <span>Locations</span>
            <span className="ml-1">▼</span>
          </button>
          <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white text-black rounded-md mt-2 py-2 shadow-lg w-32 transition-all duration-200">
            <Link href="#" passHref>
              <span className="block px-4 py-2 hover:bg-gray-200">UK</span>
            </Link>
            <Link href="#" passHref>
              <span className="block px-4 py-2 hover:bg-gray-200">Europe</span>
            </Link>
          </div>
        </div>

        <Link href="#" className="hover:text-gray-300">Contact</Link>
        <Link href="#" className="hover:text-gray-300">About us</Link>
      </nav>
    </header>
  );
};

export default Header;

