import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { hasAnalyticsConsent, hasMarketingConsent } from '../components/CookieConsent'

// Google Analytics tracking ID (set in .env)
const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID

/**
 * Initialize Google Analytics if consent is given
 */
function initGA() {
  if (!GA_TRACKING_ID || !hasAnalyticsConsent()) return

  // Check if already initialized
  if (window.gtag) return

  // Load GA script
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
  script.async = true
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_TRACKING_ID, {
    anonymize_ip: true, // LGPD compliance
    cookie_flags: 'SameSite=None;Secure'
  })
}

/**
 * Hook to track page views (respects cookie consent)
 */
export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    // Initialize GA on first render if consent exists
    initGA()

    // Listen for consent updates
    const handleConsentUpdate = (event) => {
      if (event.detail.analytics) {
        initGA()
      }
    }
    window.addEventListener('cookieConsentUpdated', handleConsentUpdate)

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate)
    }
  }, [])

  useEffect(() => {
    if (!hasAnalyticsConsent() || !window.gtag) return

    // Track page view
    window.gtag('config', GA_TRACKING_ID, {
      page_path: location.pathname + location.search
    })
  }, [location])
}

/**
 * Hook to track events (respects cookie consent)
 */
export function useEventTracking() {
  const trackEvent = useCallback((action, category, label, value) => {
    if (!hasAnalyticsConsent() || !window.gtag) return

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    })
  }, [])

  return { trackEvent }
}

/**
 * Track specific events
 */
export const analytics = {
  // Track property view
  viewProperty: (propertyId, propertyTitle) => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'view_item', {
      items: [{
        item_id: propertyId,
        item_name: propertyTitle
      }]
    })
  },

  // Track search
  search: (searchTerm, filters) => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'search', {
      search_term: searchTerm,
      ...filters
    })
  },

  // Track lead submission
  submitLead: (propertyId) => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'generate_lead', {
      currency: 'BRL',
      value: 1,
      item_id: propertyId
    })
  },

  // Track external link click (to auction site)
  clickExternalLink: (url, propertyId) => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'click', {
      event_category: 'outbound',
      event_label: url,
      property_id: propertyId
    })
  },

  // Track registration
  signUp: () => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'sign_up', {
      method: 'email'
    })
  },

  // Track login
  login: () => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'login', {
      method: 'email'
    })
  },

  // Track favorite added
  addFavorite: (propertyId) => {
    if (!hasAnalyticsConsent() || !window.gtag) return
    window.gtag('event', 'add_to_wishlist', {
      items: [{ item_id: propertyId }]
    })
  }
}

export default usePageTracking
