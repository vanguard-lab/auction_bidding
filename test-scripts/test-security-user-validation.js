/**
 * Security Test: Verify user_id is validated against authenticated user
 * 
 * This test verifies that the security fix prevents users from bidding
 * on behalf of other users by manipulating the user_id in the request body.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function httpPost(path, payload, token) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function httpGet(path) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function runSecurityTest() {
  console.log('\n=== Security Test: User ID Validation ===\n');
  
  // Wait for server to be ready
  console.log('Waiting for server to be ready...');
  for (let i = 0; i < 10; i++) {
    try {
      const res = await httpGet('/api/auctions');
      if (res.status === 200 || res.status === 204) {
        console.log('✓ Server is ready\n');
        break;
      }
    } catch (e) {
      // Server not ready yet
    }
    await sleep(1000);
  }
  
  // Step 1: Create two test users
  console.log('1. Creating test user Alice');
  const aliceEmail = `alice_security_test_${Date.now()}@example.com`;
  const alicePassword = 'SecurePass123!';
  
  const aliceSignup = await httpPost('/api/auth/signup', {
    email: aliceEmail,
    password: alicePassword,
  });
  
  if (aliceSignup.status !== 201) {
    console.error('Failed to create Alice:', aliceSignup.body);
    process.exit(1);
  }
  
  const aliceToken = aliceSignup.body.access_token;
  console.log('✓ Alice created successfully');
  console.log(`  Email: ${aliceEmail}`);
  console.log(`  Token: ${aliceToken.substring(0, 20)}...\n`);
  
  console.log('2. Creating test user Bob');
  const bobEmail = `bob_security_test_${Date.now()}@example.com`;
  const bobPassword = 'SecurePass123!';
  
  const bobSignup = await httpPost('/api/auth/signup', {
    email: bobEmail,
    password: bobPassword,
  });
  
  if (bobSignup.status !== 201) {
    console.error('Failed to create Bob:', bobSignup.body);
    process.exit(1);
  }
  
  const bobToken = bobSignup.body.access_token;
  console.log('✓ Bob created successfully');
  console.log(`  Email: ${bobEmail}`);
  console.log(`  Token: ${bobToken.substring(0, 20)}...\n`);
  
  // Step 2: Get an open auction
  console.log('3. Getting open auctions');
  const auctionsResult = await httpGet('/api/auctions');
  const auctions = auctionsResult.body;
  
  if (!Array.isArray(auctions) || auctions.length === 0) {
    console.error('No open auctions found. Run: npx ts-node src/seed.ts');
    process.exit(1);
  }
  
  const auction = auctions.find(a => a.status === 'OPEN');
  if (!auction) {
    console.error('No OPEN auctions available');
    process.exit(1);
  }
  
  const auctionId = auction.auction_id;
  console.log(`✓ Found open auction: ${auctionId}`);
  console.log(`  Current top bid: ${auction.current_top_bid || 'none'}\n`);
  
  // Step 3: Test security - Alice tries to bid with Bob's user_id
  console.log('4. SECURITY TEST: Alice tries to place bid with Bob\'s user_id');
  console.log('   This should FAIL - users should only bid as themselves\n');
  
  // Get Alice's actual user ID from her token
  const alicePayload = JSON.parse(Buffer.from(aliceToken.split('.')[1], 'base64').toString());
  const aliceUserId = alicePayload.sub;
  
  // Get Bob's actual user ID from his token
  const bobPayload = JSON.parse(Buffer.from(bobToken.split('.')[1], 'base64').toString());
  const bobUserId = bobPayload.sub;
  
  console.log(`   Alice's actual user ID: ${aliceUserId}`);
  console.log(`   Bob's actual user ID: ${bobUserId}`);
  console.log(`   Alice will try to bid with user_id: ${bobUserId} (Bob's ID)\n`);
  
  // Alice tries to bid using Bob's user_id in the request body
  const maliciousBid = {
    auction_id: auctionId,
    user_id: bobUserId, // ❌ Alice trying to bid as Bob
    amount: 100.0,
  };
  
  const maliciousResult = await httpPost('/api/bid', maliciousBid, aliceToken);
  
  console.log('5. Result of malicious bid attempt:');
  console.log(`   Status: ${maliciousResult.status}`);
  console.log(`   Response: ${JSON.stringify(maliciousResult.body, null, 2)}\n`);
  
  // Step 4: Verify the bid was placed as Alice (not Bob)
  if (maliciousResult.status === 201) {
    const bidUserId = maliciousResult.body.user_id;
    
    if (bidUserId === aliceUserId) {
      console.log('✅ SECURITY TEST PASSED!');
      console.log('   Bid was placed with Alice\'s user ID (from JWT token)');
      console.log('   The user_id from request body was correctly IGNORED');
      console.log('   This prevents users from impersonating others!\n');
    } else if (bidUserId === bobUserId) {
      console.error('❌ SECURITY TEST FAILED!');
      console.error('   Bid was placed with Bob\'s user ID');
      console.error('   The system trusted the user_id from request body');
      console.error('   This is a CRITICAL SECURITY VULNERABILITY!\n');
      process.exit(1);
    } else {
      console.error('⚠️  UNEXPECTED RESULT');
      console.error(`   Bid user_id (${bidUserId}) doesn\'t match Alice or Bob`);
      process.exit(1);
    }
  } else if (maliciousResult.status === 400 || maliciousResult.status === 401) {
    console.log('✅ SECURITY TEST PASSED (ALTERNATIVE)!');
    console.log('   The malicious bid was rejected');
    console.log('   This also prevents the security issue\n');
  } else {
    console.error('⚠️  UNEXPECTED STATUS CODE');
    console.error(`   Expected 201, 400, or 401 but got ${maliciousResult.status}`);
  }
  
  // Step 5: Verify Alice can bid normally with her own user_id
  console.log('6. Verify Alice can bid normally (with correct user_id or no user_id)');
  
  const normalBid = {
    auction_id: auctionId,
    amount: 150.0,
  };
  
  const normalResult = await httpPost('/api/bid', normalBid, aliceToken);
  
  if (normalResult.status === 201) {
    console.log('✓ Normal bid successful');
    console.log(`  Bid ID: ${normalResult.body.bid_id}`);
    console.log(`  User ID: ${normalResult.body.user_id} (should match Alice)\n`);
    
    if (normalResult.body.user_id === aliceUserId) {
      console.log('✅ User ID correctly set to authenticated user\n');
    } else {
      console.error('❌ User ID mismatch in normal bid\n');
    }
  } else {
    console.error('⚠️  Normal bid failed:', normalResult.body);
  }
  
  console.log('=== Security Test Complete ===\n');
}

runSecurityTest().catch(err => {
  console.error('Test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
