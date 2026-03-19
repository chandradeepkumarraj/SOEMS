/**
 * Utility to detect if the current browser is Brave.
 * Brave specifically disables Canvas Fingerprinting via its Shields, which breaks our AI face-api.js models.
 * @returns {Promise<boolean>} True if the browser is Brave.
 */
export const isBraveBrowser = async (): Promise<boolean> => {
    try {
        if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
            return await (navigator as any).brave.isBrave();
        }
        return false;
    } catch (e) {
        return false;
    }
};
