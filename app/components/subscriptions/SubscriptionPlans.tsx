"use client";

import React from "react";
import { Check } from "lucide-react";
import {
  PlanType,
  SUBSCRIPTION_PLANS,
  getColorClasses,
} from "../../../types/types";

interface SubscriptionPlansProps {
  selectedPlan: PlanType;
  onPlanChange: (plan: PlanType) => void;
}

export default function SubscriptionPlans({
  selectedPlan,
  onPlanChange,
}: SubscriptionPlansProps) {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {(
          Object.entries(SUBSCRIPTION_PLANS) as [
            PlanType,
            (typeof SUBSCRIPTION_PLANS)[PlanType]
          ][]
        ).map(([planType, plan]) => {
          const colors = getColorClasses(planType, selectedPlan === planType);
          const IconComponent = plan.icon;

          return (
            <div
              key={planType}
              className={`rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 transform hover:scale-102 hover:shadow-xl ${
                colors.bg
              } ${colors.border} ${
                plan.popular ? `ring-2 ${colors.ring}` : ""
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white text-center py-2 text-sm font-medium">
                  Most Popular Choice
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-green-900 capitalize">
                      {planType}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.deliveriesPerMonth}x deliveries/month • Every{" "}
                      {planType}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${colors.iconBg} transform transition-transform duration-300 hover:rotate-12`}
                  >
                    <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                </div>

                <div className="flex flex-col mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-green-900">
                      £{plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    £{(plan.price / plan.deliveriesPerMonth).toFixed(2)}
                    /delivery • Free shipping
                  </p>
                </div>

                <div
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${colors.iconBg} ${colors.icon}`}
                >
                  Save {plan.productDiscount}% on all products
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center space-x-3 group"
                    >
                      <div
                        className={`flex-shrink-0 ${colors.iconBg} rounded-full p-1 transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Check className={`h-4 w-4 ${colors.icon}`} />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onPlanChange(planType)}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 ${colors.button} transform hover:scale-102 hover:shadow-md`}
                >
                  {selectedPlan === planType ? "Current Plan" : "Choose Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-transparent -z-10 rounded-3xl transform -skew-y-3"></div>
    </div>
  );
}
