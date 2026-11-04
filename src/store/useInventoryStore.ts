import { create } from 'zustand';
import { sendNotification } from '../lib/notifications';

export interface MenuItem {
  id: string;
  name: string;
  station: 'grill' | 'fry' | 'prep' | 'bar';
  price: number;
  is86d: boolean;
  stockLevel: number; // e.g., 15 left, or 0 (which triggers 86'd)
}

interface InventoryState {
  items: MenuItem[];
  initialized: boolean;
  initialize: () => void;
  toggle86: (itemId: string, updatedBy?: string) => void;
  adjustStock: (itemId: string, amount: number) => void;
  getStationItems: (station: MenuItem['station']) => MenuItem[];
}

const DEFAULT_ITEMS: MenuItem[] = [
  // Grill
  { id: 'g1', name: 'Bridge Burger', station: 'grill', price: 16.50, is86d: false, stockLevel: 25 },
  { id: 'g2', name: 'Ribeye Steak', station: 'grill', price: 34.00, is86d: false, stockLevel: 8 },
  { id: 'g3', name: 'Grilled Chicken Club', station: 'grill', price: 14.50, is86d: false, stockLevel: 15 },
  { id: 'g4', name: 'Smoked Pork Belly', station: 'grill', price: 18.00, is86d: false, stockLevel: 12 },
  
  // Fry
  { id: 'f1', name: 'Crispy Garlic Fries', station: 'fry', price: 6.50, is86d: false, stockLevel: 40 },
  { id: 'f2', name: 'Sweet Potato Waffles', station: 'fry', price: 7.50, is86d: false, stockLevel: 30 },
  { id: 'f3', name: 'Tempura Shrimp', station: 'fry', price: 13.00, is86d: false, stockLevel: 14 },
  { id: 'f4', name: 'Onion Rings', station: 'fry', price: 7.00, is86d: false, stockLevel: 20 },

  // Prep
  { id: 'p1', name: 'Caesar Salad', station: 'prep', price: 12.00, is86d: false, stockLevel: 18 },
  { id: 'p2', name: 'Avocado Toast', station: 'prep', price: 11.50, is86d: false, stockLevel: 10 },
  { id: 'p3', name: 'Quinoa Harvest Bowl', station: 'prep', price: 13.50, is86d: false, stockLevel: 15 },
  { id: 'p4', name: 'Seasonal Fruit Plate', station: 'prep', price: 9.00, is86d: false, stockLevel: 8 },

  // Bar
  { id: 'b1', name: 'Amber Espresso Latte', station: 'bar', price: 6.00, is86d: false, stockLevel: 50 },
  { id: 'b2', name: 'Nitro Cold Brew', station: 'bar', price: 5.50, is86d: false, stockLevel: 30 },
  { id: 'b3', name: 'Matcha Ceremonial Tea', station: 'bar', price: 6.50, is86d: false, stockLevel: 22 },
  { id: 'b4', name: 'Hibiscus Ginger Fizz', station: 'bar', price: 7.00, is86d: false, stockLevel: 25 }
];

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    const stored = localStorage.getItem('bridge_boh_inventory');
    if (stored) {
      try {
        set({ items: JSON.parse(stored), initialized: true });
        return;
      } catch (e) {
        console.error('Failed to parse inventory', e);
      }
    }
    set({ items: DEFAULT_ITEMS, initialized: true });
  },

  toggle86: (itemId, updatedBy = 'Staff') => {
    set((state) => {
      const updated = state.items.map(item => {
        if (item.id === itemId) {
          const nextIs86 = !item.is86d;
          
          // Trigger push notification / chime in-app
          sendNotification(nextIs86 ? `⚠️ ITEM 86'd: ${item.name}` : `✅ ITEM AVAILABLE: ${item.name}`, {
            body: `${item.name} has been marked ${nextIs86 ? "86'd (out of stock)" : "Available"} by ${updatedBy}`,
            tag: `86-${item.id}`
          });
          
          return {
            ...item,
            is86d: nextIs86,
            stockLevel: nextIs86 ? 0 : 15 // Reset stock level as reasonable default
          };
        }
        return item;
      });
      localStorage.setItem('bridge_boh_inventory', JSON.stringify(updated));
      return { items: updated };
    });
  },

  adjustStock: (itemId, amount) => {
    set((state) => {
      const updated = state.items.map(item => {
        if (item.id === itemId) {
          const nextStock = Math.max(0, item.stockLevel + amount);
          const nextIs86 = nextStock === 0;
          
          if (nextIs86 && !item.is86d) {
            sendNotification(`⚠️ ITEM 86'd: ${item.name}`, {
              body: `${item.name} stock depleted to 0. Auto-marked 86'd.`,
              tag: `86-${item.id}`
            });
          }

          return {
            ...item,
            stockLevel: nextStock,
            is86d: nextIs86
          };
        }
        return item;
      });
      localStorage.setItem('bridge_boh_inventory', JSON.stringify(updated));
      return { items: updated };
    });
  },

  getStationItems: (station) => {
    const { items, initialize } = get();
    if (items.length === 0) {
      initialize();
    }
    return get().items.filter(item => item.station === station);
  }
}));
