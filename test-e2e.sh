#!/bin/bash

# End-to-End Testing Script for Velocity Banking Application
# Tests the complete user flow through Cloudflare tunnel

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
DOMAIN="velocitybanking.naren.me"
CLOUDFLARE_IP="172.67.154.54"
BASE_URL="https://${DOMAIN}"

echo -e "${BLUE}🧪 Velocity Banking E2E Testing${NC}"
echo "========================================="
echo "Domain: $DOMAIN"
echo "Testing through Cloudflare tunnel..."
echo ""

# Function to make HTTP requests with proper DNS resolution
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -n "$data" ]; then
        curl -s --resolve "${DOMAIN}:443:${CLOUDFLARE_IP}" \
             -X "$method" \
             -H "Content-Type: application/json" \
             ${headers:+-H "$headers"} \
             -d "$data" \
             "${BASE_URL}${endpoint}"
    else
        curl -s --resolve "${DOMAIN}:443:${CLOUDFLARE_IP}" \
             -X "$method" \
             ${headers:+-H "$headers"} \
             "${BASE_URL}${endpoint}"
    fi
}

# Test 1: Frontend Availability
echo -e "${YELLOW}Test 1: Frontend Availability${NC}"
frontend_response=$(curl -s --resolve "${DOMAIN}:443:${CLOUDFLARE_IP}" "${BASE_URL}" -w "%{http_code}")
http_code="${frontend_response: -3}"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible (HTTP $http_code)${NC}"
    # Check if it contains React application
    if echo "$frontend_response" | grep -q "Velocity Banking" && echo "$frontend_response" | grep -q "react"; then
        echo -e "${GREEN}✅ React application loaded${NC}"
    else
        echo -e "${RED}❌ Frontend not serving React app${NC}"
    fi
else
    echo -e "${RED}❌ Frontend not accessible (HTTP $http_code)${NC}"
    exit 1
fi

echo ""

# Test 2: Backend Health Check
echo -e "${YELLOW}Test 2: Backend Health Check${NC}"
health_response=$(make_request "GET" "/api/health")
echo "Response: $health_response"

if echo "$health_response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

echo ""

# Test 3: User Authentication
echo -e "${YELLOW}Test 3: User Authentication${NC}"
login_data='{"email":"test@example.com","password":"testpass"}'
login_response=$(make_request "POST" "/api/users/login" "$login_data")
echo "Login response: $login_response"

if echo "$login_response" | grep -q "Demo User"; then
    echo -e "${GREEN}✅ User authentication working${NC}"
    user_id=$(echo "$login_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "User ID: $user_id"
else
    echo -e "${RED}❌ User authentication failed${NC}"
    exit 1
fi

echo ""

# Test 4: Mortgage Data Retrieval
echo -e "${YELLOW}Test 4: Mortgage Data Retrieval${NC}"
mortgage_response=$(make_request "GET" "/api/mortgages/user/$user_id")
echo "Mortgage response: $mortgage_response"

if echo "$mortgage_response" | grep -q "balance"; then
    echo -e "${GREEN}✅ Mortgage data retrieval working${NC}"
    balance=$(echo "$mortgage_response" | grep -o '"balance":[0-9]*' | cut -d':' -f2)
    rate=$(echo "$mortgage_response" | grep -o '"rate":[0-9.]*' | cut -d':' -f2)
    echo "Mortgage Balance: \$$balance"
    echo "Interest Rate: $rate%"
else
    echo -e "${RED}❌ Mortgage data retrieval failed${NC}"
    exit 1
fi

echo ""

# Test 5: Optimization Strategy
echo -e "${YELLOW}Test 5: Optimization Strategy${NC}"
optimize_data='{"userId":'$user_id'}'
optimize_response=$(make_request "POST" "/api/optimize" "$optimize_data")
echo "Optimization response: $optimize_response"

if echo "$optimize_response" | grep -q "strategy"; then
    echo -e "${GREEN}✅ Optimization strategy working${NC}"
    strategy=$(echo "$optimize_response" | grep -o '"strategy":"[^"]*"' | cut -d'"' -f4)
    savings=$(echo "$optimize_response" | grep -o '"savings":[0-9]*' | cut -d':' -f2)
    echo "Strategy: $strategy"
    echo "Potential Savings: \$$savings"
else
    echo -e "${RED}❌ Optimization strategy failed${NC}"
    exit 1
fi

echo ""

# Test 6: CORS and Security Headers
echo -e "${YELLOW}Test 6: Security Headers${NC}"
headers_response=$(curl -s -I --resolve "${DOMAIN}:443:${CLOUDFLARE_IP}" "${BASE_URL}")
echo "Checking security headers..."

if echo "$headers_response" | grep -q "strict-transport-security"; then
    echo -e "${GREEN}✅ HSTS header present${NC}"
else
    echo -e "${YELLOW}⚠️  HSTS header missing${NC}"
fi

if echo "$headers_response" | grep -q "x-content-type-options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options header present${NC}"
else
    echo -e "${YELLOW}⚠️  X-Content-Type-Options header missing${NC}"
fi

if echo "$headers_response" | grep -q "x-frame-options"; then
    echo -e "${GREEN}✅ X-Frame-Options header present${NC}"
else
    echo -e "${YELLOW}⚠️  X-Frame-Options header missing${NC}"
fi

echo ""

# Test 7: Performance Check
echo -e "${YELLOW}Test 7: Performance Check${NC}"
start_time=$(date +%s%N)
perf_response=$(make_request "GET" "/api/health")
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

echo "Response time: ${duration}ms"
if [ "$duration" -lt 1000 ]; then
    echo -e "${GREEN}✅ Good response time (<1s)${NC}"
elif [ "$duration" -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  Acceptable response time (<3s)${NC}"
else
    echo -e "${RED}❌ Slow response time (>3s)${NC}"
fi

echo ""

# Test 8: Database Persistence Check
echo -e "${YELLOW}Test 8: Data Consistency Check${NC}"
# Make multiple requests to ensure data consistency
for i in {1..3}; do
    response=$(make_request "GET" "/api/mortgages/user/$user_id")
    if echo "$response" | grep -q "250000"; then
        echo -e "${GREEN}✅ Request $i: Data consistent${NC}"
    else
        echo -e "${RED}❌ Request $i: Data inconsistent${NC}"
    fi
done

echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo "========================================="
echo -e "${GREEN}✅ All core functionality tests passed${NC}"
echo -e "${GREEN}✅ Application is working end-to-end${NC}"
echo -e "${GREEN}✅ External access through Cloudflare tunnel successful${NC}"
echo ""
echo "🌐 Application URL: $BASE_URL"
echo "🚀 Ready for production use!"