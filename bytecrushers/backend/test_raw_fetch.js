async function run() {
  const url = 'https://uinxrzafobcqxwxniojf.supabase.co/auth/v1/token?grant_type=password';
  const apikey = 'sb_publishable_qTCGM5Weh77dnyVanIYMHg_S1Ii5XjB';
  console.log('Sending raw POST fetch to:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apikey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'password123'
      })
    });
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch failed with error:', err);
  }
}
run();
