// Mock screenshot API for local development
// This simulates the screenshot capture without actually running Puppeteer locally

export const mockCaptureScreenshot = async (url, urlId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Generate a mock response
  return {
    success: true,
    message: `Screenshot captured successfully in 2.1s`,
    image_url: `https://via.placeholder.com/1200x800/cccccc/333333?text=${encodeURIComponent(url)}`,
    capture_time: '2.1'
  }
}

// Check if we're in development mode
export const isDevelopment = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}
