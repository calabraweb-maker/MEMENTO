import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hqughxfyquqlpqtltamy.supabase.co';
const supabaseKey = 'sb_publishable_aOXJPNycY3k5BYE3uLZ9wg_ga5MQNrB';

export const supabase = createClient(supabaseUrl, supabaseKey); 
