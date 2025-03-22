/**
 * Network utilities for enhancing connection reliability
 */

// Detect current environment
export const getEnvironment = () => {
  if (typeof window === 'undefined') return 'server';
  
  const host = window.location.hostname;
  if (host.includes('github.io')) return 'github';
  if (host.includes('vercel.app')) return 'vercel';
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  return 'unknown';
};

// Enhanced fetch with timeout and retry
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries = 3, 
  timeout = 10000
): Promise<Response> {
  let lastError: Error | null = null;
  const environment = getEnvironment();

  // Add environment-specific headers and configs
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'X-Client-Environment': environment,
    },
    // Use no-cors mode for the first attempt if it's a GET request
    mode: options.method === 'GET' ? 'no-cors' : 'cors',
    // Don't include credentials for unauthenticated requests
    credentials: 'omit',
  };

  // Try different fetch strategies based on retries remaining
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // If not first attempt, add delay to prevent overwhelming the server
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        console.log(`Retry attempt ${attempt} for ${url}`);
        
        // For retry attempts, try different modes
        if (attempt === 1) {
          // Second attempt: Switch to CORS mode with credentials
          fetchOptions.mode = 'cors';
          fetchOptions.credentials = 'same-origin';
        } else if (attempt >= 2) {
          // Third attempt and beyond: Try CORS proxies
          const corsProxies = [
            "https://corsproxy.io/?",
            "https://api.allorigins.win/raw?url="
          ];
          
          // Use a CORS proxy for the URL
          const proxyIndex = Math.min(attempt - 2, corsProxies.length - 1);
          const targetUrl = `${corsProxies[proxyIndex]}${encodeURIComponent(url)}`;
          
          // Execute fetch with timeout using the proxy
          const response = await fetch(targetUrl, {
            ...fetchOptions,
            // Reset these for proxy
            mode: 'cors',
            credentials: 'omit',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return response;
        }
      }

      // Execute fetch with timeout
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Log successful connection for debugging
      if (response.ok || response.type === 'opaque') {
        console.log(`Fetch successful for ${url} on attempt ${attempt + 1}`);
        
        // Store successful connection details if in browser
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('last_successful_fetch', JSON.stringify({
              url,
              timestamp: Date.now(),
              environment,
              attempt: attempt + 1
            }));
          } catch (e) {
            // Ignore storage errors
          }
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`Fetch attempt ${attempt + 1} failed for ${url}:`, error);
    }
  }

  // All retries failed
  throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

// Helper to detect network connectivity issues
export async function checkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a reliable endpoint
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true; // If we get here, we have connectivity
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
} 