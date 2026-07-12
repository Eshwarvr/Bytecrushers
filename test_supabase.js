const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uinxrzafobcqxwxniojf.supabase.co';
const supabaseAnonKey = 'sb_publishable_qTCGM5Weh77dnyVanIYMHg_S1Ii5XjB';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing connection to Supabase from Node...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@company.com',
      password: 'password123'
    });
    if (error) {
      console.error('Login failed with error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('Login succeeded! User ID:', data.user.id);
    }
  } catch (err) {
    console.error('Caught script error:', err);
  }
}

run();
