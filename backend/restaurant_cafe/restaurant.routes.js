import express from 'express';

export const RESTAURANT_TABLES = [
  { id: 'T-01', name: 'Table 1', zone: 'Main Dining', seats: 4, guests: 3, status: 'OCCUPIED', orderTotal: 46.50, waiter: 'Hamza', orderTime: '18 mins ago' },
  { id: 'T-02', name: 'Table 2', zone: 'Main Dining', seats: 2, guests: 0, status: 'VACANT', orderTotal: 0, waiter: '-', orderTime: '-' },
  { id: 'T-03', name: 'Table 3', zone: 'Main Dining', seats: 6, guests: 5, status: 'BILL_PRINTED', orderTotal: 88.00, waiter: 'Ayesha', orderTime: '42 mins ago' },
  { id: 'T-04', name: 'Table 4', zone: 'Terrace Garden', seats: 4, guests: 4, status: 'OCCUPIED', orderTotal: 62.00, waiter: 'Ali', orderTime: '25 mins ago' },
  { id: 'T-05', name: 'Table 5', zone: 'Terrace Garden', seats: 2, guests: 0, status: 'RESERVED', orderTotal: 0, waiter: 'Ali', orderTime: 'Reserved 8:00 PM' },
  { id: 'T-06', name: 'Table 6 (VIP)', zone: 'VIP Lounge', seats: 8, guests: 6, status: 'OCCUPIED', orderTotal: 175.00, waiter: 'Hamza', orderTime: '30 mins ago' },
  { id: 'T-07', name: 'Table 7', zone: 'Terrace Garden', seats: 4, guests: 0, status: 'VACANT', orderTotal: 0, waiter: '-', orderTime: '-' },
  { id: 'T-08', name: 'Table 8', zone: 'Main Dining', seats: 4, guests: 0, status: 'VACANT', orderTotal: 0, waiter: '-', orderTime: '-' }
];

export const RESTAURANT_MENU = [
  { id: 'mnu-1', name: 'Truffle Smash Burger & Crispy Fries', category: 'Mains', price: 16.50, prepTime: '12 min', kitchenStation: 'Grill', dietary: 'Non-Veg', available: true },
  { id: 'mnu-2', name: 'Smoked BBQ Beef Ribs with Garlic Mash', category: 'Mains', price: 28.00, prepTime: '20 min', kitchenStation: 'Grill', dietary: 'Non-Veg', available: true },
  { id: 'mnu-3', name: 'Crispy Calamari with Zesty Tartar', category: 'Starters', price: 11.50, prepTime: '8 min', kitchenStation: 'Fryer', dietary: 'Seafood', available: true },
  { id: 'mnu-4', name: 'Wild Mushroom Risotto with Truffle Oil', category: 'Mains', price: 18.00, prepTime: '15 min', kitchenStation: 'Saute', dietary: 'Vegetarian', available: true },
  { id: 'mnu-5', name: 'Signature Thin Crust Margherita Pizza', category: 'Mains', price: 14.00, prepTime: '10 min', kitchenStation: 'Oven', dietary: 'Vegetarian', available: true },
  { id: 'mnu-6', name: 'Iced Spanish Latte & Caramel Drizzle', category: 'Beverages', price: 6.50, prepTime: '4 min', kitchenStation: 'Bar', dietary: 'Veg', available: true },
  { id: 'mnu-7', name: 'Molten Belgian Chocolate Lava Cake', category: 'Desserts', price: 9.50, prepTime: '10 min', kitchenStation: 'Bakery', dietary: 'Veg', available: true }
];

export const RESTAURANT_KDS_TICKETS = [
  { id: 'KDS-301', ticketNo: '#K-301', table: 'Table 1', items: [{ name: 'Truffle Smash Burger', qty: 2, notes: 'Medium rare, no pickles' }, { name: 'Crispy Calamari', qty: 1, notes: 'Extra tartar' }], timeAgo: '6 min', status: 'PREPARING' },
  { id: 'KDS-302', ticketNo: '#K-302', table: 'Table 4', items: [{ name: 'Margherita Pizza', qty: 1, notes: 'Extra crispy crust' }, { name: 'Spanish Latte', qty: 2, notes: 'Oat milk' }], timeAgo: '14 min', status: 'READY' },
  { id: 'KDS-303', ticketNo: '#K-303', table: 'Table 6 (VIP)', items: [{ name: 'Smoked BBQ Beef Ribs', qty: 2, notes: 'Chef special sauce' }, { name: 'Mushroom Risotto', qty: 1, notes: 'Gluten free' }], timeAgo: '2 min', status: 'NEW' }
];

export function createRestaurantRouter(sqliteDb, db, getTablesData, getMenuData, getKdsData) {
  const router = express.Router();
  const tables = () => (getTablesData ? getTablesData() : RESTAURANT_TABLES);
  const menu = () => (getMenuData ? getMenuData() : RESTAURANT_MENU);
  const tickets = () => (getKdsData ? getKdsData() : RESTAURANT_KDS_TICKETS);

  router.get('/tables', (req, res) => {
    res.json({ ok: true, tables: tables() });
  });

  router.post('/tables/:id/status', (req, res) => {
    const id = req.params.id;
    const { status, guests, orderTotal } = req.body || {};
    const tbl = tables().find(t => t.id === id);
    if (tbl) {
      if (status) tbl.status = status;
      if (guests !== undefined) tbl.guests = Number(guests);
      if (orderTotal !== undefined) tbl.orderTotal = Number(orderTotal);
      return res.json({ ok: true, message: `Table ${id} updated`, table: tbl });
    }
    res.status(404).json({ ok: false, message: 'Table not found' });
  });

  router.get('/menu', (req, res) => {
    res.json({ ok: true, menu: menu() });
  });

  router.get('/kds', (req, res) => {
    res.json({ ok: true, tickets: tickets() });
  });

  router.post('/kds/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body || {};
    const ticket = tickets().find(t => t.id === id);
    if (ticket) {
      ticket.status = status;
      return res.json({ ok: true, message: `Ticket ${id} status set to ${status}`, ticket });
    }
    res.status(404).json({ ok: false, message: 'Ticket not found' });
  });

  return router;
}
