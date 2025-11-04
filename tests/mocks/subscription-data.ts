export const mockSubscriptionData = {
    validSubscription: {
      email: 'test@example.com',
      subscriptionType: 'weekly',
      deliveryAddress: '123 Test Street',
      city: 'Test City',
      postcode: 'TE1 1ST',
      deliveryInstructions: 'Leave at the door',
      deliveryDates: ['2024-07-01', '2024-07-08', '2024-07-15'],
      packageType: 'custom',
      items: [
        {
          product_id: 1,
          quantity: 2,
          unit_text: 'kg',
          price_per_unit: 3.99
        },
        {
          product_id: 2,
          quantity: 1,
          unit_text: 'units',
          price_per_unit: 2.49
        }
      ],
      totalPrice: 10.47
    },
    
    validPremadePackage: {
      email: 'test@example.com',
      subscriptionType: 'monthly',
      deliveryAddress: '456 Test Avenue',
      city: 'Sample City',
      postcode: 'AB1 2CD',
      deliveryInstructions: 'Ring the bell',
      deliveryDates: ['2024-08-01', '2024-09-01', '2024-10-01'],
      packageType: 'premade',
      package: {
        package_id: 1,
        package_name: 'Premium Veggie Box'
      },
      totalPrice: 29.99
    },
    
    invalidSubscription: {
      
      email: 'test@example.com',
      subscriptionType: 'weekly'
      
    },
    
    nonExistingUserSubscription: {
      email: 'nonexistent@example.com',
      subscriptionType: 'biweekly',
      deliveryAddress: '789 Test Road',
      city: 'Another City',
      postcode: 'XY1 2ZA',
      deliveryInstructions: 'Leave with neighbor',
      deliveryDates: ['2024-07-15', '2024-07-29'],
      packageType: 'custom',
      items: [
        {
          product_id: 3,
          quantity: 1,
          unit_text: 'box',
          price_per_unit: 5.99
        }
      ],
      totalPrice: 5.99
    }
  }; 