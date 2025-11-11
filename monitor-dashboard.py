#!/usr/bin/env python3
"""
Velocity Banking Monitoring Dashboard
Real-time monitoring and alerting for the deployed application
"""

import requests
import json
import time
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class VelocityBankingDashboard:
    def __init__(self):
        self.base_url = "https://velocity-banking.naren.me"
        self.cloudflare_ip = "172.67.154.54"
        self.domain = "velocitybanking.naren.me"
        self.check_history = []
        self.max_history = 50

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, timeout: int = 10) -> Dict:
        """Make HTTP request with proper DNS resolution through Cloudflare"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Host': self.domain
            }
            
            # Use direct IP to bypass DNS issues
            url = f"https://{self.cloudflare_ip}{endpoint}"
            
            start_time = time.time()
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout, verify=True)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=timeout, verify=True)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'success': True,
                'status_code': response.status_code,
                'response_time': round(response_time, 2),
                'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200],
                'size': len(response.content)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response_time': 0
            }

    def check_application_health(self) -> Dict:
        """Comprehensive application health check"""
        timestamp = datetime.now()
        results = {
            'timestamp': timestamp.isoformat(),
            'checks': {},
            'overall_status': 'healthy',
            'response_times': [],
            'errors': []
        }

        # Define checks
        checks = [
            ('Frontend', 'GET', '/'),
            ('Backend Health', 'GET', '/api/health'),
            ('User Login', 'POST', '/api/users/login', {'email': 'test@example.com', 'password': 'test123'}),
            ('Mortgage Data', 'GET', '/api/mortgages/user/1'),
            ('Optimization', 'POST', '/api/optimize', {'userId': 1})
        ]

        for name, method, endpoint, *args in checks:
            data = args[0] if args else None
            result = self.make_request(method, endpoint, data)
            
            if result['success'] and result['status_code'] == 200:
                status = 'healthy'
                status_icon = f"{Colors.GREEN}✅{Colors.END}"
            elif result['success'] and 200 <= result['status_code'] < 400:
                status = 'warning'
                status_icon = f"{Colors.YELLOW}⚠️{Colors.END}"
                results['overall_status'] = 'degraded'
            else:
                status = 'error'
                status_icon = f"{Colors.RED}❌{Colors.END}"
                results['overall_status'] = 'unhealthy'
                results['errors'].append(f"{name}: {result.get('error', 'HTTP ' + str(result.get('status_code', 'Unknown')))}")

            results['checks'][name] = {
                'status': status,
                'status_icon': status_icon,
                'response_time': result['response_time'],
                'details': result
            }
            
            if result['response_time'] > 0:
                results['response_times'].append(result['response_time'])

        # Calculate metrics
        if results['response_times']:
            results['avg_response_time'] = round(sum(results['response_times']) / len(results['response_times']), 2)
            results['max_response_time'] = max(results['response_times'])
            results['min_response_time'] = min(results['response_times'])
        else:
            results['avg_response_time'] = 0
            results['max_response_time'] = 0
            results['min_response_time'] = 0

        return results

    def check_infrastructure(self) -> Dict:
        """Check infrastructure components"""
        try:
            # Check Cloudflare tunnel status
            tunnel_result = os.popen('ps aux | grep "cloudflared tunnel run" | grep -v grep').read()
            tunnel_running = bool(tunnel_result.strip())
            
            # Check Kubernetes pods
            try:
                pods_result = os.popen('kubectl get pods -n velocity-banking -o json 2>/dev/null').read()
                if pods_result:
                    pods_data = json.loads(pods_result)
                    pods_status = {}
                    for pod in pods_data.get('items', []):
                        name = pod['metadata']['name']
                        status = pod['status']['phase']
                        pods_status[name] = status
                else:
                    pods_status = {'error': 'Unable to connect to Kubernetes'}
            except:
                pods_status = {'error': 'kubectl not available or no access'}

            return {
                'cloudflare_tunnel': 'running' if tunnel_running else 'stopped',
                'kubernetes_pods': pods_status
            }
        except Exception as e:
            return {'error': str(e)}

    def display_dashboard(self, health_data: Dict, infra_data: Dict):
        """Display the monitoring dashboard"""
        # Clear screen
        os.system('clear' if os.name == 'posix' else 'cls')
        
        # Header
        print(f"{Colors.BOLD}{Colors.BLUE}🏦 Velocity Banking - Live Monitoring Dashboard{Colors.END}")
        print(f"{Colors.BLUE}{'=' * 60}{Colors.END}")
        print(f"📅 {health_data['timestamp']}")
        
        # Overall Status
        if health_data['overall_status'] == 'healthy':
            status_color = Colors.GREEN
            status_icon = "✅"
        elif health_data['overall_status'] == 'degraded':
            status_color = Colors.YELLOW
            status_icon = "⚠️"
        else:
            status_color = Colors.RED
            status_icon = "❌"
        
        print(f"🌐 Overall Status: {status_color}{status_icon} {health_data['overall_status'].upper()}{Colors.END}")
        print(f"🌍 External URL: {Colors.CYAN}https://velocitybanking.naren.me{Colors.END}")
        print()

        # Application Health Checks
        print(f"{Colors.BOLD}📊 Application Health Checks{Colors.END}")
        print(f"{Colors.WHITE}{'─' * 50}{Colors.END}")
        
        for name, check in health_data['checks'].items():
            response_time = f"{check['response_time']}ms"
            if check['response_time'] > 1000:
                response_time = f"{Colors.RED}{response_time}{Colors.END}"
            elif check['response_time'] > 500:
                response_time = f"{Colors.YELLOW}{response_time}{Colors.END}"
            else:
                response_time = f"{Colors.GREEN}{response_time}{Colors.END}"
            
            print(f"{check['status_icon']} {name:<20} {response_time}")
        
        print()

        # Performance Metrics
        print(f"{Colors.BOLD}⚡ Performance Metrics{Colors.END}")
        print(f"{Colors.WHITE}{'─' * 50}{Colors.END}")
        print(f"📈 Average Response Time: {Colors.CYAN}{health_data['avg_response_time']}ms{Colors.END}")
        print(f"🚀 Fastest Response:      {Colors.GREEN}{health_data['min_response_time']}ms{Colors.END}")
        print(f"🐌 Slowest Response:      {Colors.YELLOW}{health_data['max_response_time']}ms{Colors.END}")
        print()

        # Infrastructure Status
        print(f"{Colors.BOLD}🏗️  Infrastructure Status{Colors.END}")
        print(f"{Colors.WHITE}{'─' * 50}{Colors.END}")
        
        # Cloudflare Tunnel
        tunnel_status = infra_data.get('cloudflare_tunnel', 'unknown')
        if tunnel_status == 'running':
            print(f"{Colors.GREEN}✅{Colors.END} Cloudflare Tunnel: Running")
        else:
            print(f"{Colors.RED}❌{Colors.END} Cloudflare Tunnel: Stopped")
        
        # Kubernetes Pods
        pods = infra_data.get('kubernetes_pods', {})
        if 'error' in pods:
            print(f"{Colors.YELLOW}⚠️{Colors.END}  Kubernetes: {pods['error']}")
        else:
            for pod_name, status in pods.items():
                if status == 'Running':
                    print(f"{Colors.GREEN}✅{Colors.END} {pod_name}: Running")
                else:
                    print(f"{Colors.RED}❌{Colors.END} {pod_name}: {status}")
        
        print()

        # Errors
        if health_data['errors']:
            print(f"{Colors.BOLD}{Colors.RED}🚨 Active Alerts{Colors.END}")
            print(f"{Colors.WHITE}{'─' * 50}{Colors.END}")
            for error in health_data['errors']:
                print(f"{Colors.RED}• {error}{Colors.END}")
            print()

        # Commands
        print(f"{Colors.BOLD}🔧 Commands{Colors.END}")
        print(f"{Colors.WHITE}{'─' * 50}{Colors.END}")
        print(f"{Colors.CYAN}Press Ctrl+C to exit{Colors.END}")
        print(f"{Colors.CYAN}Refreshing every 10 seconds...{Colors.END}")

    def run_dashboard(self):
        """Run the live monitoring dashboard"""
        try:
            while True:
                health_data = self.check_application_health()
                infra_data = self.check_infrastructure()
                
                # Store in history
                self.check_history.append(health_data)
                if len(self.check_history) > self.max_history:
                    self.check_history.pop(0)
                
                self.display_dashboard(health_data, infra_data)
                
                # Wait before next check
                time.sleep(10)
                
        except KeyboardInterrupt:
            print(f"\n{Colors.BLUE}👋 Monitoring stopped by user{Colors.END}")
            sys.exit(0)
        except Exception as e:
            print(f"\n{Colors.RED}❌ Dashboard error: {e}{Colors.END}")
            sys.exit(1)

    def run_single_check(self):
        """Run a single health check and display results"""
        print(f"{Colors.BLUE}🔍 Running health check...{Colors.END}")
        health_data = self.check_application_health()
        infra_data = self.check_infrastructure()
        self.display_dashboard(health_data, infra_data)

if __name__ == "__main__":
    dashboard = VelocityBankingDashboard()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        dashboard.run_single_check()
    else:
        dashboard.run_dashboard()