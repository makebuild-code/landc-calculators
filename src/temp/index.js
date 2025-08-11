// class IDManager {
//   /**
//    * Constructs the IDManager with configurable parameters for handling IDs.
//    * @param {Object} config - Configuration object for IDManager.
//    * @param {boolean} [config.debug=true] - Enable debug logging if true.
//    * @param {string} [config.idCookieName='ID'] - The name of the cookie for storing the ID.
//    * @param {string} config.idQueryParam - The query parameter name for the ID, case-insensitive.
//    * @param {number} [config.cookieDays=90] - The number of days until the cookie expires.
//    * @param {string} [config.linkSelector=''] - CSS selector for links to append ID. Optional.
//    * @param {string} [config.customBodyAttribute=''] - Custom attribute name on the body tag for the ID. Optional.
//    */
//   constructor({
//     debug = true,
//     idCookieName = 'ID',
//     idQueryParam,
//     cookieDays = 90,
//     linkSelector = '',
//     customBodyAttribute = '',
//   } = {}) {
//     this.debug = debug;
//     this.idCookieName = idCookieName;
//     this.idQueryParam = idQueryParam.toLowerCase(); // Normalize to lower case
//     this.cookieDays = cookieDays;
//     this.linkSelector = linkSelector;
//     this.customBodyAttribute = customBodyAttribute;
//   }

//   debugLog(message) {
//     if (this.debug) {
//       console.log(`IDManager, ${this.idCookieName}:`, message);
//     }
//   }

//   /**
//    * Initializes the ID handling process.
//    */
//   init() {
//     const idSetFromBodyAttribute = this.updateIDFromCustomAttribute();
//     if (!idSetFromBodyAttribute) {
//       this.storeID();
//     }
//     this.appendIDToLinks();
//   }

//   /**
//    * Updates the ID based on a custom attribute on the <body> element.
//    * @returns {boolean} Whether the ID was set from the custom body attribute.
//    */
//   updateIDFromCustomAttribute() {
//     if (this.customBodyAttribute) {
//       const bodyAttributeID = document.body.getAttribute(this.customBodyAttribute);
//       if (bodyAttributeID) {
//         this.setCookie(bodyAttributeID);
//         this.debugLog(`ID from body attribute set: ${bodyAttributeID}`);
//         return true;
//       } else {
//         this.debugLog(`No value found for body attribute: ${this.customBodyAttribute}`);
//         return false;
//       }
//     } else {
//       this.debugLog('No custom body attribute defined.');
//       return false;
//     }
//   }

//   /**
//    * Stores the ID from the URL query parameter to a cookie.
//    */
//   storeID() {
//     const id = this.getQueryParam();
//     if (id) {
//       this.setCookie(id);
//     } else {
//       this.debugLog(`ID not found in query parameters.`);
//     }
//   }

//   /**
//    * Appends the ID to all links that match the linkSelector.
//    */
//   appendIDToLinks() {
//     if (!this.linkSelector) return;

//     const links = document.querySelectorAll(this.linkSelector);
//     const id = this.getCookie();
//     if (id) {
//       links.forEach((link) => {
//         const url = new URL(link.href);
//         url.searchParams.set(this.idQueryParam, id);
//         link.href = url.toString();
//         this.debugLog(`ID appended to URL: ${url}`);
//       });
//     } else {
//       this.debugLog(`No ID found in cookies to append to links.`);
//     }
//   }

//   /**
//    * Sets a cookie with the specified name and value for a number of days.
//    * @param {string} value - The value of the ID to store.
//    */
//   setCookie(value) {
//     const d = new Date();
//     d.setTime(d.getTime() + this.cookieDays * 24 * 60 * 60 * 1000);
//     let expires = 'expires=' + d.toUTCString();
//     document.cookie = `${this.idCookieName}=${value};${expires};path=/`;
//     this.debugLog(`Cookie set - ${this.idCookieName}: ${value}`);
//   }

//   /**
//    * Retrieves a cookie by name.
//    * @returns {string|null} The value of the cookie if found; otherwise, null.
//    */
//   getCookie() {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${this.idCookieName}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
//     return null;
//   }
// }

// /**
//  * Retrieves the value of the URL parameter specified by idQueryParam.
//  * @returns {string|null} The value of the query parameter, if it exists; otherwise, null.
//  */
// function getQueryParam() {
//   try {
//     const decodedURL = decodeURIComponent(window.location.href);
//     const urlParams = new URLSearchParams(new URL(decodedURL).search);
//     console.log(`Full URLSearchParams: ${Array.from(urlParams.entries())}`);
//     for (const [key, value] of urlParams.entries()) {
//       if (key.toLowerCase() === this.idQueryParam.toLowerCase()) {
//         console.log(`Matched QueryParam - Key: ${key}, Value: ${value}`);
//         return value;
//       }
//     }
//   } catch (error) {
//     console.debugLog(`Error parsing query parameters: ${error.message}`);
//   }
//   return null;
// }

// function test1() {
//   console.log('Non-decoded:');
//   const params = new URLSearchParams(window.location);
//   for (const [key, value] of params.entries()) {
//     console.log(`key: ${key}, value: ${value}`);
//   }

//   console.log('Decoded:');
//   const decodedURL = decodeURIComponent(window.location);
//   const decodedParams = new URLSearchParams(decodedURL);
//   for (const [key, value] of decodedParams.entries()) {
//     console.log(`key: ${key}, value: ${value}`);
//   }
// }

// /**
//  * Logs all URL parameters from the current page to the console.
//  * Similar to the existing pattern in getQueryParam() and test1() functions.
//  */
// function logUrlParams() {
//   try {
//     console.log('=== URL Parameters Log ===');

//     // Log non-decoded parameters
//     console.log('Non-decoded URL parameters:');
//     const params = new URLSearchParams(window.location.search);
//     if (params.entries().next().done) {
//       console.log('No URL parameters found');
//     } else {
//       for (const [key, value] of params.entries()) {
//         console.log(`  ${key}: ${value}`);
//       }
//     }

//     // Log decoded parameters
//     console.log('Decoded URL parameters:');
//     const decodedURL = decodeURIComponent(window.location.href);
//     const decodedParams = new URLSearchParams(new URL(decodedURL).search);
//     if (decodedParams.entries().next().done) {
//       console.log('No decoded URL parameters found');
//     } else {
//       for (const [key, value] of decodedParams.entries()) {
//         console.log(`  ${key}: ${value}`);
//       }
//     }

//     // Log full URL for reference
//     console.log(`Full URL: ${window.location.href}`);
//     console.log('=== End URL Parameters Log ===');
//   } catch (error) {
//     console.error('Error parsing URL parameters:', error.message);
//   }
// }
