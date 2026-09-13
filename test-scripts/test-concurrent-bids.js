/**
 * Concurrent Bid Idempotency Test Script
 * Tests that multiple simultaneous bid requests with the same idempotency key
 * result in only one bid being created.
 *
 * Usage:
 *   node test-scripts/test-concurrent-bids.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isServerRunning() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auctions`, { signal: AbortSignal.timeout(3000) });
    return res.status === 200 || res.status === 204;
  } catch {
    return false;
  }
}

async function ensureServerRunning() {
  console.log('--- Checking if server is running ---');
  
  for (let i = 0; i < 5; i++) {
    const serverRunning = await isServerRunning();
    if (serverRunning) {
      console.log('✓ Server is already running');
      return;
    }
    console.log(`Attempt ${i + 1}: Server not responding, waiting...`);
    await sleep(1000);
  }
  
  console.error('Server not running. Please start the server first: npm run dev');
  process.exit(1);
}

async function httpGet(path, token) {
  const url = `${API_BASE_URL}${path}`;
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function httpPost(path, payload, idempotencyKey, token) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
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

async function signup(email, password) {
  const result = await httpPost('/api/auth/signup', { email, password });
  if (result.status !== 201) {
    throw new Error(`Signup failed: ${JSON.stringify(result.body)}`);
  }
  return result.body.access_token;
}

async function login(email, password) {
  const result = await httpPost('/api/auth/login', { email, password });
  if (result.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(result.body)}`);
  }
  return result.body.access_token;
}

async function getOpenAuctions(token) {
  const result = await httpGet('/api/auctions', token);
  if (!Array.isArray(result.body)) {
    throw new Error(`Failed to get auctions: ${JSON.stringify(result.body)}`);
  }
  return result.body.filter(a => a.status === 'OPEN');
}

async function getAuctionBids(auctionId, token) {
  const result = await httpGet(`/api/auctions/${auctionId}/bids`, token);
  if (!Array.isArray(result.body)) {
    throw new Error(`Failed to get bids: ${JSON.stringify(result.body)}`);
  }
  return result.body;
}

async function placeBid(auctionId, userId, amount, idempotencyKey, token) {
  return await httpPost('/api/bid', {
    auction_id: auctionId,
    user_id: userId,
    amount: amount,
  }, idempotencyKey, token);
}

/**
 * Test concurrent bid placement with same idempotency key
 */
async function testConcurrentBids() {
  console.log('\n=== Concurrent Bid Idempotency Test ===\n');
  
  // Ensure server is running
  await ensureServerRunning();
  
  // 1. Signup a new user
  const email = `concurrent_test_${Date.now()}@example.com`;
  const password = 'SecurePass123!';
  console.log(`1. Signing up user: ${email}`);
  const token = await signup(email, password);
  console.log('✓ Signup successful\n');
  
  // 2. Login
  console.log('2. Logging in');
  const authToken = await login(email, password);
  console.log('✓ Login successful\n');
  
  // 3. Get open auctions
  console.log('3. Getting open auctions');
  const auctions = await getOpenAuctions(authToken);
  if (auctions.length === 0) {
    console.error('No open auctions found. Run the seed script first: npx ts-node src/seed.ts');
    process.exit(1);
  }
  const auction = auctions[0];
  console.log(`✓ Found open auction: ${auction.auction_id}`);
  console.log(`  Current top bid: ${auction.current_top_bid || 'none'}\n`);
  
  // 4. Get current bids
  console.log('4. Getting current bids');
  const initialBids = await getAuctionBids(auction.auction_id, authToken);
  console.log(`✓ Current bid count: ${initialBids.length}\n`);
  
  // 5. Determine bid amount
  const currentTopBid = parseFloat(auction.current_top_bid) || 0;
  const newBidAmount = currentTopBid + 10;
  const userId = 'a1b2c3d4-1111-2222-3333-444455556666';
  const idempotencyKey = `concurrent-test-${Date.now()}`;
  
  console.log(`5. Preparing concurrent bid test`);
  console.log(`   Current top bid: ${currentTopBid}`);
  console.log(`   New bid amount: ${newBidAmount}`);
  console.log(`   Idempotency key: ${idempotencyKey}`);
  console.log(`   Number of concurrent requests: 10\n`);
  
  // 6. Send multiple concurrent requests with SAME idempotency key
  const concurrentRequests = 10;
  const promises = [];
  
  console.log(`6. Sending ${concurrentRequests} concurrent bid requests...\n`);
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      placeBid(auction.auction_id, userId, newBidAmount, idempotencyKey, authToken)
        .then(result => ({ index: i, result }))
        .catch(err => ({ index: i, error: err.message }))
    );
  }
  
  // Wait for all requests to complete
  const results = await Promise.all(promises);
  
  // 7. Analyze results
  console.log('7. Results from concurrent requests:\n');
  
  const successfulBids = results.filter(r => !r.error && r.result.status === 201);
  const failedBids = results.filter(r => !r.error && r.result.status !== 201);
  const errors = results.filter(r => r.error);
  
  console.log(`   Successful (201): ${successfulBids.length}`);
  console.log(`   Failed (non-201): ${failedBids.length}`);
  console.log(`   Errors: ${errors.length}\n`);
  
  // Show details of first few successful bids
  if (successfulBids.length > 0) {
    console.log('   First 3 successful responses:');
    successfulBids.slice(0, 3).forEach(({ index, result }) => {
      const bidId = result.body.bid_id;
      console.log(`     Request ${index}: bid_id=${bidId}, status=${result.status}`);
    });
    console.log('');
  }
  
  // 8. Verify only ONE bid was actually created
  console.log('8. Verifying database state');
  const finalBids = await getAuctionBids(auction.auction_id, authToken);
  const newBidsCreated = finalBids.length - initialBids.length;
  
  console.log(`   Initial bid count: ${initialBids.length}`);
  console.log(`   Final bid count: ${finalBids.length}`);
  console.log(`   New bids created: ${newBidsCreated}\n`);
  
  // 9. Check if all successful responses returned the SAME bid
  const uniqueBidIds = new Set(successfulBids.map(r => r.result.body.bid_id));
  
  console.log('9. Idempotency verification:');
  console.log(`   Unique bid IDs returned: ${uniqueBidIds.size}`);
  console.log(`   Expected: 1 (all should return the same bid)\n`);
  
  // 10. Final verdict
  console.log('=== Test Results ===\n');
  
  let passed = true;
  
  if (newBidsCreated !== 1) {
    console.error(`❌ FAIL: Expected 1 new bid, but ${newBidsCreated} were created`);
    passed = false;
  } else {
    console.log('✓ PASS: Only 1 bid was created in the database');
  }
  
  if (uniqueBidIds.size !== 1) {
    console.error(`❌ FAIL: Expected 1 unique bid ID, but got ${uniqueBidIds.size}`);
    console.error('   This means the idempotency check may not be working correctly');
    passed = false;
  } else {
    console.log('✓ PASS: All successful requests returned the same bid ID');
  }
  
  if (successfulBids.length < concurrentRequests) {
    console.log(`✓ PASS: ${concurrentRequests - successfulBids.length} duplicate requests were rejected`);
  }
  
  console.log('');
  
  if (passed) {
    console.log('🎉 All tests PASSED! Idempotency is working correctly.');
    console.log('   Even with 10 concurrent requests, only 1 bid was created.');
  } else {
    console.log('⚠️  Some tests FAILED. Review the results above.');
    process.exit(1);
  }
}

// Run the test
testConcurrentBids().catch(err => {
  console.error('Test failed with error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
