import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kqrowzctukxtplvvaneb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SnfNWzW-Lw1hyTGS3c2_-Q_R05_h50B';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);