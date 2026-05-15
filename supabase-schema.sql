-- BRIDGE BOH SUPABASE SCHEMA (Idempotent Version)

-- 1. Create Staff Profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('waitress', 'head_chef', 'prep_cook', 'expeditor', 'manager', 'takeout_host', 'driver', 'bartender')),
  pin_code TEXT DEFAULT '1234', -- Default PIN for easy testing
  is_active BOOLEAN DEFAULT TRUE,
  station TEXT,                  -- e.g. 'grill', 'fry', 'expo'
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT,
  customer_name TEXT,
  order_type TEXT CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
  status TEXT DEFAULT 'new' 
    CHECK (status IN ('new','in_progress','ready','delivered','cancelled')),
  items JSONB NOT NULL,          -- [{name, qty, mods, customizations, station, status}]
  special_requests TEXT,
  delivery_address TEXT,
  priority BOOLEAN DEFAULT FALSE,
  total_price DECIMAL(10,2) DEFAULT 0.00,
  customer_id UUID REFERENCES customer_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Function to award points on delivery
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
BEGIN
  -- Only trigger on status change to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.customer_id IS NOT NULL THEN
    -- Award 10 points per $1
    points_to_award := floor(NEW.total_price * 10);
    
    IF points_to_award > 0 THEN
      -- Record in ledger
      INSERT INTO loyalty_ledger (customer_id, order_id, points_change, reason)
      VALUES (NEW.customer_id, NEW.id, points_to_award, 'order_earn');
      
      -- Update customer total
      UPDATE customer_profiles 
      SET total_points = total_points + points_to_award
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_award_loyalty_points ON orders;
CREATE TRIGGER tr_award_loyalty_points
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION award_loyalty_points();

-- 3. Create Staff Messages table
CREATE TABLE IF NOT EXISTS staff_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Customer Messages table (for User <-> BOH comms)
CREATE TABLE IF NOT EXISTS customer_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- optional: link to order
  customer_name TEXT NOT NULL,
  guest_id TEXT, -- For isolating sessions
  customer_id UUID, -- For real auth users
  sender_type TEXT CHECK (sender_type IN ('customer', 'staff')),
  staff_id UUID REFERENCES staff_profiles(id),
  staff_role TEXT, -- e.g. 'waitress', 'manager'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Customer Profiles table (for Loyalty & Auth)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  total_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create Loyalty Ledger table
CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customer_profiles(id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;

-- -- 6. RLS Policies
DO $$ BEGIN
    -- Customer Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own customer profile') THEN
        CREATE POLICY "Users can view own customer profile" ON customer_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view all customer profiles') THEN
        CREATE POLICY "Staff can view all customer profiles" ON customer_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid()));
    END IF;

    -- Loyalty Ledger
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own points history') THEN
        CREATE POLICY "Users can view own points history" ON loyalty_ledger FOR SELECT TO authenticated USING (auth.uid() = customer_id);
    END IF;

    -- Customer Messages: Staff can read all, Customers can read if they know the order_id or it's a general inquiry (simplified for demo)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can manage customer messages') THEN
        CREATE POLICY "Staff can manage customer messages" ON customer_messages FOR ALL TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert customer messages') THEN
        CREATE POLICY "Anyone can insert customer messages" ON customer_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view relevant customer messages') THEN
        CREATE POLICY "Anyone can view relevant customer messages" ON customer_messages FOR SELECT TO anon, authenticated USING (true); -- Simplified for public guest inquiry
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by all authenticated staff') THEN
        CREATE POLICY "Public profiles are viewable by all authenticated staff" ON staff_profiles FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'All staff can view orders') THEN
        CREATE POLICY "All staff can view orders" ON orders FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'All staff can update orders') THEN
        CREATE POLICY "All staff can update orders" ON orders FOR UPDATE TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Waitress/Managers can create orders') THEN
        CREATE POLICY "Waitress/Managers can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (
            EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND (role = 'waitress' OR role = 'manager'))
        );
    END IF;

    -- Staff Messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view relevant messages') THEN
        CREATE POLICY "Staff can view relevant messages" ON staff_messages FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND (role = to_role OR role = from_role OR role = 'manager'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can send messages') THEN
        CREATE POLICY "Staff can send messages" ON staff_messages FOR INSERT TO authenticated WITH CHECK (
            EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND (role = from_role OR role = 'manager'))
        );
    END IF;
END $$;

-- 7. Realtime Configuration
-- Note: Re-creating publication is the safest way to ensure all tables are included
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE orders, staff_messages, customer_messages, customer_profiles, loyalty_ledger;

-- 7. Views for Station-Specific Logic
CREATE OR REPLACE VIEW kitchen_tickets AS
  SELECT 
    o.id as order_id,
    o.table_number,
    o.status as order_status,
    o.priority,
    o.created_at,
    o.special_requests,
    item
  FROM orders o,
  LATERAL jsonb_array_elements(o.items) as item
  WHERE o.status IN ('new', 'in_progress');

-- 8. Auto-create profile on signup and assign specific manager or customer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  is_staff := NEW.email IN ('one2onemill@gmail.com', 'klutchkanobi@gmail.com');
  
  IF is_staff THEN
    INSERT INTO public.staff_profiles (id, display_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      'manager'
    );
  ELSE
    INSERT INTO public.customer_profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
