import { Clock, Star, Gift } from 'lucide-react';

export type PlanType = 'weekly' | 'biweekly' | 'monthly';
export type PackageType = 'premade' | 'custom';
export type ColorType = 'green';

export interface Plan {
  name: string;
  price: number;
  productDiscount: number;
  icon: typeof Clock | typeof Star | typeof Gift;
  features: string[];
  color: ColorType;
  description: string;
  popular?: boolean;
  quantityPerDelivery: string;
  deliveriesPerMonth: number;
}

export interface DBFarm {
  farm_id: number;
  farm_name: string;
  description: string;
  location: string;
  specialties: string[];
  products: DBProduct[];
}

export interface DBProduct {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  organic: boolean;
  image_url?: string;
}

export interface DBPackage {
  package_id: number;
  package_name: string;
  description: string;
  retail_value: number;
  plan_type: PlanType;
  created_at: string;
  farm_id: number;
  farm_name: string;
  farm_description: string;
  farm_location: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  tags: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanType, Plan> = {
  weekly: {
    name: 'Weekly Plan',
    price: 39.99,
    productDiscount: 5,
    icon: Clock,
    features: [
      '4 free pre-made packages/month',
      '5% discount on all products',
      'Weekly fresh deliveries',
      'Perfect for small households'
    ],
    color: 'green',
    description: 'Fresh weekly deliveries perfect for small households',
    quantityPerDelivery: '1–2 kg',
    deliveriesPerMonth: 4
  },
  biweekly: {
    name: 'Bi-Weekly Plan',
    price: 34.99,
    productDiscount: 10,
    icon: Star,
    features: [
      '2 free pre-made packages/month',
      '10% discount on all products',
      'Bi-weekly bulk deliveries',
      'Ideal for families'
    ],
    popular: true,
    color: 'green',
    description: 'Larger bi-weekly deliveries ideal for families',
    quantityPerDelivery: '5–7 kg',
    deliveriesPerMonth: 2
  },
  monthly: {
    name: 'Monthly Plan',
    price: 29.99,
    productDiscount: 15,
    icon: Gift,
    features: [
      '1 free pre-made package/month',
      '15% discount on all products',
      'Monthly bulk deliveries',
      'Best value for bulk buyers'
    ],
    color: 'green',
    description: 'Bulk monthly deliveries for maximum savings',
    quantityPerDelivery: '20–25 kg',
    deliveriesPerMonth: 1
  }
};

export const getColorClasses = (planType: PlanType, isSelected: boolean) => {
  return {
    bg: isSelected ? 'bg-green-50' : 'bg-white',
    border: isSelected ? 'border-green-500' : 'border-gray-200',
    button: isSelected 
      ? 'bg-green-600 text-white hover:bg-green-700' 
      : 'bg-white text-green-600 border-green-600 hover:bg-green-50',
    ring: 'ring-green-500',
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
  };
};