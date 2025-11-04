export const mockFarmerSubscriptionData = {
    validFarm: {
      farm_id: 1,
      farm_name: 'Test Farm',
      description: 'A test farm',
      address: '123 Farm Road',
      contact_name: 'Farmer John',
      contact_email: 'farmer@example.com',
      contact_phone: '123-456-7890'
    },
    
    validPackage: {
      name: 'Fresh Veggie Box',
      farmId: '1',
      description: 'A box of fresh vegetables',
      retailValue: 29.99,
      items: [
        {
          name: 'Carrots',
          quantity: '2 kg',
          price: 4.99
        },
        {
          name: 'Potatoes',
          quantity: '3 kg',
          price: 6.99
        },
        {
          name: 'Lettuce',
          quantity: '1 unit',
          price: 2.99
        }
      ],
      tags: ['organic', 'vegetables', 'local'],
      planType: 'weekly'
    },
    
    invalidPackage: {
      
      name: 'Invalid Package',
      description: 'Missing farmId and other fields'
    },
    
    invalidFarmPackage: {
      name: 'Non-existent Farm Package',
      farmId: '9999', 
      description: 'A package for a non-existent farm',
      retailValue: 19.99,
      items: [
        {
          name: 'Apples',
          quantity: '1 kg',
          price: 3.99
        }
      ],
      tags: ['fruit'],
      planType: 'biweekly'
    }
  }; 