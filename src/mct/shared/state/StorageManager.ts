import { getFromCookie, setToCookie } from '$utils/storage';

export type StorageType = 'localStorage' | 'sessionStorage' | 'cookie';

export interface StorageConfig {
  type: StorageType;
  key: string;
  expires?: string; // For cookies: '1d', '7d', etc.
  secure?: boolean; // For cookies
  serialize: boolean; // true = JSON.stringify/parse, false = store as string
}

/**
 * @todo:
 *
 * - Need to update so that cookie items aren't stringified
 * - Also need to make sure they are not then parsed
 * - Do we add this to the config?
 */

export class StorageManager {
  /**
   * Store data with specified configuration
   */
  set(config: StorageConfig, data: any): void {
    try {
      // Determine if we should serialize the data
      const shouldSerialize = config.serialize === true;
      const valueToStore = shouldSerialize ? JSON.stringify(data) : String(data);

      switch (config.type) {
        case 'localStorage':
          localStorage.setItem(config.key, valueToStore);
          break;
        case 'sessionStorage':
          sessionStorage.setItem(config.key, valueToStore);
          break;
        case 'cookie':
          setToCookie(config.key, valueToStore);
          break;
      }
    } catch (error) {
      console.error(`Failed to store data in ${config.type}:`, error);
    }
  }

  /**
   * Retrieve data with specified configuration
   */
  get<T = any>(config: StorageConfig): T | null {
    try {
      let data: string | null = null;

      switch (config.type) {
        case 'localStorage':
          data = localStorage.getItem(config.key);
          break;
        case 'sessionStorage':
          data = sessionStorage.getItem(config.key);
          break;
        case 'cookie':
          data = getFromCookie(config.key);
          break;
      }

      if (!data) return null;

      // Determine if we should deserialize the data
      const shouldDeserialize = config.serialize === true;

      if (shouldDeserialize) return JSON.parse(data) as T;
      return data as T;
    } catch (error) {
      console.error(`Failed to retrieve data from ${config.type}:`, error);
      return null;
    }
  }

  /**
   * Remove data with specified configuration
   */
  remove(config: StorageConfig): void {
    try {
      switch (config.type) {
        case 'localStorage':
          localStorage.removeItem(config.key);
          break;
        case 'sessionStorage':
          sessionStorage.removeItem(config.key);
          break;
        case 'cookie':
          // For cookies, we set an expired date to remove them
          document.cookie = `${config.key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          break;
      }
    } catch (error) {
      console.error(`Failed to remove data from ${config.type}:`, error);
    }
  }

  /**
   * Check if data exists with specified configuration
   */
  has(config: StorageConfig): boolean {
    try {
      switch (config.type) {
        case 'localStorage':
          return localStorage.getItem(config.key) !== null;
        case 'sessionStorage':
          return sessionStorage.getItem(config.key) !== null;
        case 'cookie':
          return getFromCookie(config.key) !== null;
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to check data existence in ${config.type}:`, error);
      return false;
    }
  }

  // /**
  //  * Clear all data for a specific storage type
  //  */
  // clear(type: StorageType): void {
  //   try {
  //     switch (type) {
  //       case 'localStorage':
  //         localStorage.clear();
  //         break;
  //       case 'sessionStorage':
  //         sessionStorage.clear();
  //         break;
  //       case 'cookie':
  //         // Clear all cookies for this domain
  //         const cookies = document.cookie.split(';');
  //         cookies.forEach((cookie) => {
  //           const eqPos = cookie.indexOf('=');
  //           const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  //           document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  //         });
  //         break;
  //     }
  //   } catch (error) {
  //     console.error(`Failed to clear ${type}:`, error);
  //   }
  // }
}
