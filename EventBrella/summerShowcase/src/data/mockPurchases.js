export const mockPurchases = [
  {
    id: '1',
    date: '2024-03-14',
    item: 'Pirates Jersey',
    category: 'merch',
    amount: 89.99,
    location: 'Merch Stand A',
  },
  {
    id: '2',
    date: '2024-03-14',
    item: 'Burger Combo + 2 Beers',
    category: 'food',
    amount: 21.99,
    location: 'Concession Stand 3',
  },
  {
    id: '3',
    date: '2024-03-10',
    item: 'Stadium Parking',
    category: 'parking',
    amount: 15.00,
    location: 'North Gate',
  },
  {
    id: '4',
    date: '2024-02-28',
    item: 'Match Ticket',
    category: 'ticket',
    amount: 45.00,
    location: 'Online',
  },
];

export const getSpendingByCategory = () => {
  const categories = {};
  mockPurchases.forEach(purchase => {
    if (!categories[purchase.category]) {
      categories[purchase.category] = 0;
    }
    categories[purchase.category] += purchase.amount;
  });
  return categories;
};
