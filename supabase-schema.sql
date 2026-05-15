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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by all authenticated staff') THEN
        CREATE POLICY "Public profiles are viewable by all authenticated staff" ON staff_profiles FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON staff_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
    END IF;

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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view relevant messages') THEN
        CREATE POLICY "Staff can view relevant messages" ON staff_messages FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND (role = to_role OR role = from_role OR role = 'manager'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can send messages') THEN
        CREATE POLICY "Staff can send messages" ON staff_messages FOR INSERT TO authenticated WITH CHECK (
            EXISTS (SELECT 1 FROM staff_profiles WHERE id = auth.uid() AND role = from_role)
        );
    END IF;
END $$;

-- 6. Realtime Configuration
-- Note: Re-creating publication is the safest way to ensure all tables are included
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE orders, staff_messages;

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

-- 8. Auto-create profile on signup and assign specific manager
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email = 'one2onemill@gmail.com' THEN 'manager'
      WHEN NEW.email = 'klutchkanobi@gmail.com' THEN 'manager'
      ELSE 'waitress' -- Default role for others, can be changed in DB later
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
