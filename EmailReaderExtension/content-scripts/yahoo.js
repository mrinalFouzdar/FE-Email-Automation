// Yahoo Mail content script
// This script extracts email information from Yahoo Mail
// Note: utils.js is loaded automatically via manifest.json

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractEmails') {
        extractYahooData(request.chunkSize || 1000)
            .then(data => sendResponse(data))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

/**
 * Extract email data from Yahoo Mail
 */
async function extractYahooData(chunkSize) {
    try {
        if (!window.location.hostname.includes('mail.yahoo.com')) {
            throw new Error('Not on Yahoo Mail');
        }

        await waitForYahooLoad();

        const emails = [];

        if (isViewingEmail()) {
            const emailData = extractSingleEmail();
            if (emailData) {
                emails.push(emailData);
            }
        } else {
            const emailElements = document.querySelectorAll('[data-test-id="message-list-item"]');
            
            for (const emailElement of emailElements) {
                const emailData = extractEmailFromListItem(emailElement);
                if (emailData) {
                    emails.push(emailData);
                }
            }
        }

        if (emails.length === 0) {
            throw new Error('No emails found. Please open an email or ensure emails are visible.');
        }

        const processedData = processEmails(emails, chunkSize);

        return {
            success: true,
            data: processedData,
            source: 'yahoo'
        };

    } catch (error) {
        console.error('Yahoo extraction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Wait for Yahoo Mail to load
 */
function waitForYahooLoad() {
    return new Promise((resolve) => {
        if (document.querySelector('[data-test-id="message-list"]')) {
            resolve();
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.querySelector('[data-test-id="message-list"]')) {
                    obs.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            
            setTimeout(() => {
                observer.disconnect();
                resolve();
            }, 10000);
        }
    });
}

/**
 * Check if viewing single email
 */
function isViewingEmail() {
    return !!document.querySelector('[data-test-id="message-view"]');
}

/**
 * Extract single email
 */
function extractSingleEmail() {
    try {
        const subjectElement = document.querySelector('[data-test-id="message-subject"]');
        const subject = subjectElement?.textContent || '';

        const fromElement = document.querySelector('[data-test-id="message-from"]');
        const from = fromElement?.textContent || '';

        const dateElement = document.querySelector('[data-test-id="message-date"]');
        const date = dateElement?.textContent || '';

        const toElement = document.querySelector('[data-test-id="message-to"]');
        const to = toElement?.textContent?.split(',').map(s => s.trim()) || [];

        const bodyElement = document.querySelector('[data-test-id="message-view-body"]') ||
                          document.querySelector('div[class*="MessageBody"]');
        const body = bodyElement?.innerHTML || bodyElement?.textContent || '';

        const attachmentElements = document.querySelectorAll('[data-test-id*="attachment"]');
        const attachments = Array.from(attachmentElements).map(el => ({
            name: el.textContent || el.getAttribute('aria-label') || ''
        })).filter(a => a.name);

        const isStarred = !!document.querySelector('[data-test-id="icon-btn-star"][aria-pressed="true"]');

        return {
            subject,
            from,
            to,
            date,
            body,
            isHTML: true,
            hasAttachments: attachments.length > 0,
            attachments,
            isRead: true,
            isStarred,
            labels: []
        };
    } catch (error) {
        console.error('Error extracting single email:', error);
        return null;
    }
}

/**
 * Extract email from list item
 */
function extractEmailFromListItem(emailElement) {
    try {
        const subjectElement = emailElement.querySelector('[data-test-id="message-list-item-subject"]');
        const subject = subjectElement?.textContent || '';

        const fromElement = emailElement.querySelector('[data-test-id="message-list-item-from"]');
        const from = fromElement?.textContent || '';

        const dateElement = emailElement.querySelector('[data-test-id="message-list-item-date"]');
        const date = dateElement?.textContent || '';

        const snippetElement = emailElement.querySelector('[data-test-id="message-list-item-snippet"]');
        const body = snippetElement?.textContent || '';

        const isRead = !emailElement.querySelector('[data-test-id="unread-indicator"]');
        const hasAttachments = !!emailElement.querySelector('[data-test-id*="attachment-indicator"]');
        const isStarred = !!emailElement.querySelector('[data-test-id="icon-btn-star"][aria-pressed="true"]');

        return {
            subject,
            from,
            to: [],
            date,
            body,
            isHTML: false,
            hasAttachments,
            attachments: [],
            isRead,
            isStarred,
            labels: []
        };
    } catch (error) {
        console.error('Error extracting email from list:', error);
        return null;
    }
}

// Auto-detect email opens and send to API
let lastEmailSubject = null;
let observerInitialized = false;
let processingTimeout = null;
let isProcessing = false;

/**
 * Initialize auto-detection of email opens
 */
function initAutoDetection() {
    if (observerInitialized) return;
    observerInitialized = true;

    console.log('Initializing Yahoo Mail email open detection...');

    // Observer to detect when email is opened
    const observer = new MutationObserver((mutations) => {
        // Check if we're viewing an email
        if (isViewingEmail()) {
            const subjectElement = document.querySelector('[data-test-id="message-subject"]');
            const currentSubject = subjectElement?.textContent || '';

            // Only process if it's a new email (different from last one) and not already processing
            if (currentSubject && currentSubject !== lastEmailSubject && !isProcessing) {
                lastEmailSubject = currentSubject;
                console.log('Email opened:', currentSubject);

                // Clear any pending timeout
                if (processingTimeout) {
                    clearTimeout(processingTimeout);
                }

                // Debounce: Wait for email to fully load before processing
                processingTimeout = setTimeout(() => {
                    handleEmailOpen();
                }, 1000);
            }
        } else {
            // Reset when not viewing an email anymore
            lastEmailSubject = null;
        }
    });

    // Observe changes in the body or main content area
    const mainArea = document.body;
    if (mainArea) {
        observer.observe(mainArea, {
            childList: true,
            subtree: true
        });
        console.log('Yahoo Mail observer attached');
    }
}

/**
 * Handle email open event
 */
async function handleEmailOpen() {
    if (isProcessing) {
        console.log('Already processing an email, skipping...');
        return;
    }

    isProcessing = true;

    try {
        // Extract the currently opened email
        const emailData = extractSingleEmail();

        if (!emailData) {
            console.log('Could not extract email data');
            isProcessing = false;
            return;
        }

        // Process the email
        const processedData = processEmail(emailData, 1000);

        // Send to API
        const result = await sendToAPI({
            emails: [processedData],
            totalEmails: 1,
            totalChunks: processedData.totalChunks,
            extractedAt: processedData.extractedAt,
            source: 'yahoo',
            trigger: 'auto'
        });

        if (result.success) {
            console.log('Email data sent to API automatically');
        } else {
            console.log('Email data not sent:', result.reason || result.error);
        }
    } catch (error) {
        console.error('Error handling email open:', error);
    } finally {
        // Reset processing flag after a delay to prevent rapid re-processing
        setTimeout(() => {
            isProcessing = false;
        }, 2000);
    }
}

// Initialize auto-detection when page loads
waitForYahooLoad().then(() => {
    initAutoDetection();
});

console.log('Yahoo Mail content script loaded');