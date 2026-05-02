import {getAnalytics, isSupported, type Analytics} from 'firebase/analytics';
import {getFirebaseApp, isFirebaseConfigured} from './firebase';

let analyticsPromise: Promise<Analytics | null> | null = null;

export function initAnalyticsWhenReady(): Promise<Analytics | null> {
  if (!isFirebaseConfigured()) {
    return Promise.resolve(null);
  }
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      try {
        if (!(await isSupported())) {
          return null;
        }
        return getAnalytics(getFirebaseApp());
      } catch {
        return null;
      }
    })();
  }
  return analyticsPromise;
}
