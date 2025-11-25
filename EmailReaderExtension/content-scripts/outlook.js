// Outlook content script
// This script extracts email information from Outlook Web
// Note: utils.js is loaded automatically via manifest.json

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractEmails') {
        extractOutlookData(request.chunkSize || 1000)
            .then(data => sendResponse(data))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

/**
 * Extract email data from Outlook
 */
async function extractOutlookData(chunkSize) {
    try {
        // Check if we're on Outlook
        if (!window.location.hostname.includes('outlook')) {
            throw new Error('Not on Outlook');
        }

        await waitForOutlookLoad();

        const emails = [];

        // Check if viewing a single email
        if (isViewingEmail()) {
            const emailData = extractSingleEmail();
            if (emailData) {
                emails.push(emailData);
            }
        } else {
            // Extract from list view
            const emailElements = document.querySelectorAll('[role="listitem"][aria-label*="message"]');
            
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
            source: 'outlook'
        };

    } catch (error) {
        console.error('Outlook extraction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Wait for Outlook to load
 */
function waitForOutlookLoad() {
    return new Promise((resolve) => {
        if (document.querySelector('[role="main"]')) {
            resolve();
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.querySelector('[role="main"]')) {
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
 * Check if viewing a single email
 */
function isViewingEmail() {
    return !!document.querySelector('[role="region"][aria-label*="Message"]');
}

/**
 * Extract single email data
 */
function extractSingleEmail() {
    try {
        // Subject
        const subjectElement = document.querySelector('span[id*="Subject"]') ||
                             document.querySelector('div[aria-label*="Subject"] span');
        const subject = subjectElement?.textContent || '';

        // Sender
        const fromElement = document.querySelector('span[id*="From"]') ||
                          document.querySelector('button[aria-label*="From"] span');
        const from = fromElement?.textContent || '';

        // Date
        const dateElement = document.querySelector('span[id*="Date"]') ||
                          document.querySelector('span[aria-label*="Received"]');
        const date = dateElement?.textContent || dateElement?.getAttribute('aria-label') || '';

        // Recipients
        const toElement = document.querySelector('span[id*="To"]') ||
                        document.querySelector('button[aria-label*="To"] span');
        const to = toElement?.textContent?.split(';').map(s => s.trim()) || [];

        // Body
        const bodyElement = document.querySelector('div[aria-label*="Message body"]') ||
                          document.querySelector('div[class*="MessageBody"]') ||
                          document.querySelector('[role="document"]');
        const body = bodyElement?.innerHTML || bodyElement?.textContent || '';

        // Attachments
        const attachmentElements = document.querySelectorAll('[aria-label*="attachment"]');
        const attachments = Array.from(attachmentElements).map(el => ({
            name: el.getAttribute('aria-label') || el.textContent || ''
        })).filter(a => a.name);

        // Flags
        const isImportant = !!document.querySelector('[aria-label*="Important"][aria-checked="true"]');
        const isFlagged = !!document.querySelector('[aria-label*="Flag"][aria-checked="true"]');

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
            isStarred: isFlagged,
            isImportant,
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
        // Subject
        const subjectElement = emailElement.querySelector('[aria-label*="Subject"]') ||
                             emailElement.querySelector('span[title]');
        const subject = subjectElement?.textContent || subjectElement?.getAttribute('title') || '';

        // Sender
        const fromElement = emailElement.querySelector('[aria-label*="From"]') ||
                          emailElement.querySelector('span[class*="Sender"]');
        const from = fromElement?.textContent || '';

        // Date
        const dateElement = emailElement.querySelector('[aria-label*="Received"]') ||
                          emailElement.querySelector('span[class*="Time"]');
        const date = dateElement?.textContent || dateElement?.getAttribute('aria-label') || '';

        // Preview/snippet
        const previewElement = emailElement.querySelector('[aria-label*="Preview"]') ||
                             emailElement.querySelector('span[class*="Preview"]');
        const body = previewElement?.textContent || '';

        // Status flags
        const isRead = !emailElement.classList.contains('Unread') && 
                      !emailElement.getAttribute('aria-label')?.includes('unread');
        
        const hasAttachments = emailElement.querySelector('[aria-label*="attachment"]') !== null;
        const isFlagged = emailElement.querySelector('[aria-label*="Flagged"]') !== null;

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
            isStarred: isFlagged,
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

    console.log('Initializing Outlook email open detection...');

    // Observer to detect when email is opened
    const observer = new MutationObserver((mutations) => {
        // Check if we're viewing an email
        if (isViewingEmail()) {
            const subjectElement = document.querySelector('span[id*="Subject"]') ||
                                 document.querySelector('div[aria-label*="Subject"] span');
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

    // Observe changes in the main content area
    const mainArea = document.querySelector('[role="main"]');
    if (mainArea) {
        observer.observe(mainArea, {
            childList: true,
            subtree: true
        });
        console.log('Outlook observer attached');
    } else {
        // If main area not found, try again after a delay
        setTimeout(initAutoDetection, 1000);
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
            source: 'outlook',
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
waitForOutlookLoad().then(() => {
    initAutoDetection();
});

console.log('Outlook content script loaded');