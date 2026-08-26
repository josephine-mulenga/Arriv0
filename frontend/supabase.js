import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbhupvfnxxcrezxobjbz.supabase.co';
const supabaseAnonKey = 'sb_publishable_2xj1XVBVNKXCJ5bj4WiQMw_HQ82rdrL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);