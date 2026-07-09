export const mockMerch = [
  {
    id: '1',
    name: 'Pirates Hoody',
    price: 79.99,
    originalPrice: 99.99,
    category: 'hoodies',
    featured: false,
    image: '/PiratesHoody.webp',
  },
  {
    id: '2',
    name: 'Pirates Jersey',
    price: 89.99,
    originalPrice: 119.99,
    category: 'jerseys',
    featured: false,
    image: '/PiratesJersey.webp',
  },
  {
    id: '3',
    name: 'Pirates Shirt',
    price: 59.99,
    originalPrice: 79.99,
    category: 'shirts',
    featured: false,
    image: '/PiratesShirt.webp',
  },
  {
    id: '4',
    name: 'Sirens T-Shirt',
    price: 49.99,
    originalPrice: 69.99,
    category: 't-shirts',
    featured: false,
    image: '/SirensTshirt.webp',
  },
  {
    id: '5',
    name: 'Pirates Sirens Slim Hoody',
    price: 69.99,
    originalPrice: 99.99,
    category: 'hoodies',
    featured: true,
    image: '/PiratesSirensSlimHoody.webp',
    limitedTime: true,
  },
];

export const getMerchOfTheDay = () => {
  return mockMerch.find(item => item.featured) || mockMerch[0];
};
