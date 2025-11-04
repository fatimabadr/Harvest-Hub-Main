"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Calendar, MapPin, Package, Tractor } from "lucide-react";

interface SubscriptionDetails {
  subscriptionType: string;
  price: string;
  packageType: 'custom' | 'premade';
  deliveryDates: string[];
  deliveryAddress: string;
  city: string;
  postcode: string;
  items: Array<{
    name: string;
    quantity: number;
    unitText: string;
    originalPrice: number;
    finalPrice: number;
    savings: number;
  }>;
  originalTotal: number;
  finalTotal: number;
  totalSavings: number;
  retailValue?: number;
  farm?: {
    id: number;
    name: string;
    description: string;
    address: string;
  } | null;
}

const formatPrice = (price: number | string | null | undefined) => {
  if (price === null || price === undefined) return "-";
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return "-";
  return `£${numericPrice.toFixed(2)}`;
};

const calculateSavings = (retailPrice: number, weeklyPrice: number) => {
  return retailPrice - weeklyPrice;
};

const ItemRow = ({ item, packageType }: { item: any; packageType: string }) => {
  
  
  if (packageType === 'premade') {
    return (
      <tr className="border-b">
        <td className="py-4 pl-4 pr-3 text-sm sm:pl-6" colSpan={3}>
          <div className="font-medium text-gray-900">
            {item.name} ({item.quantity} {item.unitText})
          </div>
        </td>
      </tr>
    );
  }

  const retailPrice = Number(item.originalPrice);
  const weeklyPrice = Number(item.finalPrice);
  const savings = !isNaN(retailPrice) ? calculateSavings(retailPrice, weeklyPrice) : null;

  return (
    <tr className="border-b">
      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
        <div className="font-medium text-gray-900">{item.name}</div>
        <div className="text-gray-500">{item.quantity} {item.unitText}</div>
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {formatPrice(retailPrice)}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {formatPrice(weeklyPrice)}
      </td>
      <td className="px-3 py-4 text-sm text-green-600">
        {savings !== null ? formatPrice(savings) : "-"}
      </td>
    </tr>
  );
};

const PackageContents = ({ subscription }: { subscription: any }) => {
  if (subscription?.packageType === 'premade') {
    const totalRetailPrice = Number(subscription?.retailValue || 0);
    const weeklyPrice = Number(subscription?.weeklyPrice || subscription?.price || 0);
    
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Package Contents
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-4">
              Your Premium Weekly Bundle includes:
            </h4>
            <ul className="space-y-3">
              {subscription?.items?.map((item: any, index: number) => (
                <li key={index} className="text-sm text-gray-900">
                  • {item.name} ({item.quantity} {item.unitText})
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Retail Price:</dt>
                  <dd className="text-sm text-gray-900">{formatPrice(totalRetailPrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Your Weekly Price:</dt>
                  <dd className="text-sm text-green-600 font-medium">{formatPrice(weeklyPrice)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <dt className="text-sm font-medium text-gray-500">Total Savings:</dt>
                  <dd className="text-sm font-medium text-green-600">
                    {formatPrice(totalRetailPrice - weeklyPrice)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  const isCustomPackage = subscription?.packageType !== 'premade';
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Package Contents
      </h3>
      <div className="mt-4 -mx-4 sm:-mx-6 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Item
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Retail Price
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Weekly Cost
                </th>
                {isCustomPackage && (
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Savings
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscription?.items?.map((item: any, index: number) => (
                <ItemRow key={index} item={item} packageType={subscription.packageType} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionConfirmationPage() {
  const searchParams = useSearchParams();
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/subscription/${searchParams.get('id')}`);
        if (!response.ok) {
          throw new Error('Failed to fetch subscription details');
        }
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (searchParams.get('id')) {
      fetchDetails();
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error || 'Subscription details not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500" />
              <h2 className="ml-3 text-2xl font-bold text-gray-900">
                Subscription Confirmed!
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Thank you for subscribing to HarvestHub
            </p>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <dl className="divide-y divide-gray-200">
              {details.farm && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Tractor className="h-5 w-5" />
                    Farm
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="font-semibold text-green-700 mb-1">
                      {details.farm.name}
                    </div>
                    {details.farm.description && (
                      <p className="text-gray-600 mb-2">{details.farm.description}</p>
                    )}
                    {details.farm.address && (
                      <p className="text-gray-500 text-xs">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {details.farm.address}
                      </p>
                    )}
                  </dd>
                </div>
              )}

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  Subscription Plan
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {details.packageType === 'custom' ? (
                    <>
                      {details.subscriptionType} - £{details.price} per {details.subscriptionType === 'monthly' ? 'month' : details.subscriptionType === 'biweekly' ? '2 weeks' : 'week'}
                      <br />
                      <span className="text-sm text-gray-500">
                        (Includes subscription fee and custom items)
                      </span>
                    </>
                  ) : (
                    <>
                      {details.subscriptionType} - £{details.price} per {details.subscriptionType === 'monthly' ? 'month' : details.subscriptionType === 'biweekly' ? '2 weeks' : 'week'}
                      <br />
                      <span className="text-sm text-gray-500">
                        (Pre-made package included at no extra cost)
                      </span>
                    </>
                  )}
                </dd>
              </div>

              <div className="py-4">
                <div className="mb-2 text-sm font-medium text-gray-500">
                  Delivery Schedule
                </div>
                <div className="space-y-2">
                  {details.deliveryDates.map((date, index) => (
                    <div key={date} className="flex items-center text-sm">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium mr-2">Delivery {index + 1}:</span>
                      <span className="text-gray-900">
                        {new Date(date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-6">Package Contents</h2>
                <PackageContents subscription={details} />
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  Delivery Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {details.deliveryAddress}
                  <br />
                  {details.city}
                  <br />
                  {details.postcode}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-4 py-5 bg-gray-50 sm:px-6">
            <div className="flex justify-end space-x-4">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Go Home
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Need Help?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}