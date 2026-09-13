/**
 * API Test Script
 * Runs automated API calls against the auction bidding backend.
 * Uses ONLY the REST API — no direct database access.
 *
 * Usage:
 *   node test-scripts/api-tests.js
 *
 * Automatically starts Docker and server if not running.
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const { execSync } = require('child_process');
const { spawn } = require('child_process');

let serverProcess = null;

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

async function isDockerRunning() {
  try {
    execSync('docker ps', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function startDocker() {
  console.log('\n--- Starting Docker containers ---');
  try {
    execSync('docker-compose -f docker/docker-compose.yml up -d', { stdio: 'inherit' });
    console.log('Docker containers started successfully');
    await sleep(5000);
  } catch (err) {
    console.error('Failed to start Docker:', err.message);
    throw err;
  }
}

async function startServer() {
  console.log('\n--- Starting server ---');
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let started = false;
    const onOutput = (data) => {
      const output = data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        if (!started) {
          started = true;
          console.log('Server started successfully');
          resolve();
        }
      }
    };

    serverProcess.stdout.on('data', onOutput);
    serverProcess.stderr.on('data', onOutput);

    setTimeout(() => {
      if (!started) {
        reject(new Error('Server startup timeout'));
      }
    }, 15000);
  });
}

async function ensureServerRunning() {
  console.log('\n--- Checking if server is running ---');
  
  // Try multiple times with delays
  for (let i = 0; i < 10; i++) {
    const serverRunning = await isServerRunning();
    if (serverRunning) {
      console.log('✓ Server is already running');
      return;
    }
    console.log(`Attempt ${i + 1}: Server not responding, waiting...`);
    await sleep(1000);
  }
  
  console.log('Server not running, starting...');
  const dockerRunning = await isDockerRunning();
  if (!dockerRunning) {
    await startDocker();
  }

  await startServer();
  await sleep(3000);
}

function cleanup() {
  if (serverProcess) {
    console.log('\n--- Cleaning up: stopping server ---');
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM node.exe 2>nul || true', { stdio: 'ignore' });
      } catch {}
    } else {
      serverProcess.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

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

async function httpDelete(path, token) {
  const url = `${API_BASE_URL}${path}`;
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(url, { method: 'DELETE', headers });
  const body = await res.status === 204 ? {} : await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function logStep(step, result) {
  console.log(`\n--- ${step} ---`);
  console.log(JSON.stringify(result, null, 2));
}

async function findOpenAuction() {
  const listResult = await httpGet('/api/auctions');
  if (!Array.isArray(listResult.body)) {
    console.error('Unexpected response from GET /api/auctions:', listResult);
    return null;
  }
  const openAuction = listResult.body.find((a) => a.status === 'OPEN');
  return openAuction || null;
}

async function runTests() {
  console.log('API_BASE_URL:', API_BASE_URL);

  // 0. Ensure server is running
  await ensureServerRunning();

  // 1. Signup a new user
  const signupPayload = {
    email: `test_${Date.now()}@example.com`,
    password: 'SecurePass123!',
  };
  const signupResult = await httpPost('/api/auth/signup', signupPayload);
  logStep('POST /api/auth/signup', signupResult);
  if (signupResult.status !== 201) {
    console.error('Signup failed. This might be due to database connection issues.');
    console.error('Make sure Docker is running and environment variables are set.');
    console.error('Run: docker-compose -f docker/docker-compose.yml up -d');
    process.exit(1);
  }
  const signupToken = signupResult.body.access_token;
  console.log('✓ Signup successful, token received');

  // 2. Login the user
  const loginPayload = {
    email: signupPayload.email,
    password: signupPayload.password,
  };
  const loginResult = await httpPost('/api/auth/login', loginPayload);
  logStep('POST /api/auth/login', loginResult);
  if (loginResult.status !== 200) {
    console.error('Login failed:', loginResult);
    process.exit(1);
  }
  const authToken = loginResult.body.access_token;
  console.log('✓ Login successful, token received');

  // 3. Discover an open auction via the API
  const auction = await findOpenAuction();
  if (!auction) {
    console.error('No OPEN auctions found. Run the seed script first (npx ts-node src/seed.ts).');
    process.exit(1);
  }
  const auctionId = auction.auction_id;
  console.log(`✓ Using auction ID: ${auctionId}`);

  // 4. GET auction by ID (public endpoint)
  const getResult = await httpGet(`/api/auctions/${auctionId}`);
  logStep('GET /api/auctions/:id (public)', getResult);

  // 5. Place a bid WITHOUT token (should fail)
  const bidPayloadNoAuth = {
    auction_id: auctionId,
    user_id: 'a1b2c3d4-1111-2222-3333-444455556666',
    amount: 100.0,
  };
  const postResultNoAuth = await httpPost('/api/bid', bidPayloadNoAuth, 'ik-noauth');
  logStep('POST /api/bid (no auth - should fail)', postResultNoAuth);
  if (postResultNoAuth.status !== 401) {
    console.error('Expected 401 for unauthenticated bid, got:', postResultNoAuth.status);
  } else {
    console.log('✓ Auth guard working: unauthenticated request rejected');
  }

  // 6. Place a bid WITH token
  const bidPayload = {
    auction_id: auctionId,
    user_id: 'a1b2c3d4-1111-2222-3333-444455556666',
    amount: 100.0,
  };
  const postResult = await httpPost('/api/bid', bidPayload, 'ik-001', authToken);
  logStep('POST /api/bid (first bid with auth)', postResult);

  // 7. Place a higher bid with different user
  const signupPayload2 = {
    email: `test2_${Date.now()}@example.com`,
    password: 'SecurePass123!',
  };
  const signupResult2 = await httpPost('/api/auth/signup', signupPayload2);
  const loginPayload2 = {
    email: signupPayload2.email,
    password: signupPayload2.password,
  };
  const loginResult2 = await httpPost('/api/auth/login', loginPayload2);
  const authToken2 = loginResult2.body.access_token;
  
  const bidPayload2 = {
    auction_id: auctionId,
    user_id: 'b2c3d4e5-2222-3333-4444-555566667777',
    amount: 150.0,
  };
  const postResult2 = await httpPost('/api/bid', bidPayload2, 'ik-002', authToken2);
  logStep('POST /api/bid (higher bid with auth)', postResult2);

  // 8. Idempotency test - same request again (should return same result or error)
  const postResultIdempotent = await httpPost('/api/bid', bidPayload, 'ik-001', authToken);
  logStep('POST /api/bid (idempotency test - same key)', postResultIdempotent);
  if (postResultIdempotent.status === 201 || postResultIdempotent.status === 409) {
    console.log('✓ Idempotency check: duplicate request handled');
  }

  // 9. Place a duplicate bid (same user, same amount, different key) — should fail
  const bidPayloadDup = {
    auction_id: auctionId,
    user_id: 'a1b2c3d4-1111-2222-3333-444455556666',
    amount: 100.0,
  };
  const postResultDup = await httpPost('/api/bid', bidPayloadDup, 'ik-003', authToken);
  logStep('POST /api/bid (duplicate bid - same user/amount)', postResultDup);

  // 10. Place a too-low bid — should fail
  const bidPayloadLow = {
    auction_id: auctionId,
    user_id: 'c3d4e5f6-3333-4444-5555-666677778888',
    amount: 50.0,
  };
  const postResultLow = await httpPost('/api/bid', bidPayloadLow, 'ik-004', authToken);
  logStep('POST /api/bid (bid too low)', postResultLow);

  // 11. GET auction again to verify state
  const getResult2 = await httpGet(`/api/auctions/${auctionId}`);
  logStep('GET /api/auctions/:id (after bids)', getResult2);

  // 12. GET bids for the auction (public)
  const bidsResult = await httpGet(`/api/auctions/${auctionId}/bids`);
  logStep('GET /api/auctions/:id/bids (public)', bidsResult);

  // 13. DELETE bid WITHOUT token (should fail)
  const firstBidId = postResult.body?.bid_id;
  if (firstBidId) {
    const deleteResultNoAuth = await httpDelete(`/api/bids/${firstBidId}`);
    logStep(`DELETE /api/bids/${firstBidId} (no auth - should fail)`, deleteResultNoAuth);
    if (deleteResultNoAuth.status !== 401) {
      console.error('Expected 401 for unauthenticated delete, got:', deleteResultNoAuth.status);
    } else {
      console.log('✓ Auth guard working: unauthenticated delete rejected');
    }

    // 14. DELETE the first bid WITH token
    const deleteResult = await httpDelete(`/api/bids/${firstBidId}`, authToken);
    logStep(`DELETE /api/bids/${firstBidId} (with auth)`, deleteResult);

    // 15. GET bids again to verify deletion
    const bidsAfterDelete = await httpGet(`/api/auctions/${auctionId}/bids`);
    logStep('GET /api/auctions/:id/bids (after delete)', bidsAfterDelete);
  } else {
    console.log('\n--- Skipping delete test: no bid_id returned ---');
  }

  console.log('\n=== All tests completed ===');
}

runTests().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
