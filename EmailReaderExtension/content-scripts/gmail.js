// Gmail content script
// This script extracts email information from Gmail

// Load utility functions
const script = document.createElement('script');
script.src = chrome.runtime.getURL('utils.js');
document.head.appendChild(script);

// Inject CSS styles for label suggestions UI
function injectStyles() {
    if (document.getElementById('email-reader-styles')) return;

    const style = document.createElement('style');
    style.id = 'email-reader-styles';
    style.textContent = `
        .email-reader-label-container {
            display: inline-flex;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            padding: 6px 12px;
            margin-right: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
            position: relative;
            z-index: 1000;
            max-width: fit-content;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .email-reader-label-header {
            display: inline-flex;
            align-items: center;
            margin-right: 8px;
        }

        .email-reader-label-title {
            color: white;
            font-weight: 500;
            font-size: 12px;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            margin-right: 6px;
        }

        .email-reader-label-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 16px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            padding: 0;
            transition: background 0.2s;
            margin-left: 4px;
        }

        .email-reader-label-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .email-reader-labels {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .email-reader-label-btn {
            background: #4285F4;
            border: none;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 11px;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            white-space: nowrap;
        }

        .email-reader-label-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .email-reader-label-btn.applied {
            opacity: 0.7;
            cursor: default;
        }

        .email-reader-label-btn.applied:hover {
            transform: none;
        }

        .email-reader-label-text {
            font-weight: 500;
        }

        .email-reader-label-confidence {
            background: rgba(255, 255, 255, 0.3);
            padding: 2px 5px;
            border-radius: 8px;
            font-size: 10px;
        }

        /* Subject label styles (larger, below subject line) */
        .email-reader-subject {
            display: block !important;
            width: 100%;
            margin: 12px 0;
            padding: 12px 16px;
        }

        .email-reader-label-header-subject {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .email-reader-label-title-subject {
            color: white;
            font-weight: 600;
            font-size: 13px;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
        }

        .email-reader-label-close-subject {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 20px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            padding: 0;
            transition: background 0.2s;
        }

        .email-reader-label-close-subject:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .email-reader-labels-subject {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .email-reader-label-btn-subject {
            background: #4285F4;
            border: none;
            color: white;
            padding: 6px 14px;
            border-radius: 16px;
            cursor: pointer;
            font-size: 12px;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .email-reader-label-btn-subject:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .email-reader-label-btn-subject.applied {
            opacity: 0.7;
            cursor: default;
        }

        .email-reader-label-btn-subject.applied:hover {
            transform: none;
        }

        /* Right side floating panel */
        .email-reader-right-panel {
            position: fixed;
            top: 106px;
            right: 404px;
            width: 280px;
            max-height: calc(100vh - 200px);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
            overflow-y: auto;
        }

        .email-reader-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .email-reader-panel-title {
            color: white;
            font-weight: 600;
            font-size: 14px;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
        }

        .email-reader-panel-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 20px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            padding: 0;
            transition: background 0.2s;
        }

        .email-reader-panel-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .email-reader-panel-labels {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .email-reader-panel-label-btn {
            background: #4285F4;
            border: none;
            color: white;
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            font-weight: 500;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
        }

        .email-reader-panel-label-btn:hover {
            transform: translateX(-4px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .email-reader-panel-label-btn.applied {
            opacity: 0.7;
            cursor: default;
        }

        .email-reader-panel-label-btn.applied:hover {
            transform: none;
        }

        .email-reader-notification {
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            color: #333;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            font-size: 14px;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .email-reader-notification.success {
            background: #4CAF50;
            color: white;
        }

        .email-reader-notification.error {
            background: #f44336;
            color: white;
        }

        .email-reader-notification.warning {
            background: #ff9800;
            color: white;
        }

        .email-reader-notification.fade-out {
            animation: fadeOut 0.3s ease-out;
            opacity: 0;
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Inject styles when script loads
injectStyles();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractEmails') {
        extractGmailData(request.chunkSize || 1000)
            .then(data => sendResponse(data))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
});

/**
 * Extract email data from Gmail
 * @param {number} chunkSize - Size of chunks
 * @returns {Promise<Object>} Extracted email data
 */
async function extractGmailData(chunkSize) {
    try {
        // Check if we're on Gmail
        if (!window.location.hostname.includes('mail.google.com')) {
            throw new Error('Not on Gmail');
        }

        // Wait for Gmail to load
        await waitForGmailLoad();

        const emails = [];

        // Check if viewing a single email
        const viewingSingle = isViewingEmail();

        if (viewingSingle) {
            console.log('Detected: Viewing single email - extracting one email');
            const emailData = extractSingleEmail();
            if (emailData) {
                emailData.emailIndex = 1;
                emails.push(emailData);
                console.log('Successfully extracted single email:', emailData.subject);
            }
        } else {
            console.log('Detected: List view - extracting multiple emails');

            // Extract multiple emails from list view
            // Try multiple selectors to catch all email rows
            let emailElements = document.querySelectorAll('tr.zA');
            console.log(`Try selector 'tr.zA': found ${emailElements.length} rows`);

            if (emailElements.length === 0) {
                emailElements = document.querySelectorAll('table.F.cf.zt tbody tr');
                console.log(`Try selector 'table.F.cf.zt tbody tr': found ${emailElements.length} rows`);
            }

            if (emailElements.length === 0) {
                emailElements = document.querySelectorAll('tbody tr[jsaction]');
                console.log(`Try selector 'tbody tr[jsaction]': found ${emailElements.length} rows`);
            }

            console.log(`Total email rows found: ${emailElements.length}`);

            let index = 1;
            for (const emailElement of emailElements) {
                const emailData = extractEmailFromListItem(emailElement);
                if (emailData && emailData.subject) {  // Only add if we got valid data
                    emailData.emailIndex = index;
                    emails.push(emailData);
                    console.log(`Extracted email ${index}: "${emailData.subject.substring(0, 50)}..." from ${emailData.fromName || emailData.from}`);
                    index++;
                } else {
                    console.log(`Skipped row ${index} - no valid data`);
                }
            }

            console.log(`Total emails extracted: ${emails.length}`);
        }

        if (emails.length === 0) {
            throw new Error('No emails found. Please open an email or ensure emails are visible.');
        }

        // Process emails with chunking
        const processedData = processEmails(emails, chunkSize);

        return {
            success: true,
            data: processedData,
            source: 'gmail'
        };

    } catch (error) {
        console.error('Gmail extraction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Wait for Gmail to fully load
 */
function waitForGmailLoad() {
    return new Promise((resolve) => {
        if (document.querySelector('div[role="main"]')) {
            resolve();
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.querySelector('div[role="main"]')) {
                    obs.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Timeout after 10 seconds
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
    // Check if we're actually viewing a single email, not the list view
    // A single email view has an h2 (subject) AND email body content
    const hasSubject = !!document.querySelector('div[role="main"] h2');
    const hasEmailBody = !!document.querySelector('div[data-message-id]') ||
                        !!document.querySelector('div[role="main"] div.a3s');

    // Also check that we're NOT in list view by checking for the email list table
    const inListView = !!document.querySelector('table.F.cf.zt') ||
                      !!document.querySelector('div[role="main"] table tbody tr.zA');

    // We're viewing a single email if we have subject + body AND we're not in list view
    const viewingSingleEmail = hasSubject && hasEmailBody && !inListView;

    console.log(`isViewingEmail check: hasSubject=${hasSubject}, hasEmailBody=${hasEmailBody}, inListView=${inListView}, result=${viewingSingleEmail}`);

    return viewingSingleEmail;
}

/**
 * Extract data from a single opened email
 */
function extractSingleEmail() {
    try {
        // Get the main email container
        const emailContainer = document.querySelector('div[role="main"]');
        if (!emailContainer) {
            console.error('Email container not found');
            return null;
        }

        // Extract subject - look for h2 within the email view
        const subject = emailContainer.querySelector('h2')?.textContent?.trim() || '';

        // Find sender info - look within the email header area
        const senderElement = emailContainer.querySelector('span[email]') ||
                            emailContainer.querySelector('div[data-hovercard-id] span[email]') ||
                            emailContainer.querySelector('td.gE.iv.gt span[email]');

        const from = senderElement?.getAttribute('email') || '';
        const fromName = senderElement?.closest('td')?.querySelector('span.go')?.textContent?.trim() ||
                        senderElement?.parentElement?.textContent?.trim() || '';

        // Find date - look for the date element in the email header
        const dateElement = emailContainer.querySelector('span.g3')?.textContent?.trim() ||
                          emailContainer.querySelector('td.gH span[title]')?.getAttribute('title') ||
                          emailContainer.querySelector('span[data-tooltip*="UTC"]')?.getAttribute('data-tooltip') || '';
        const date = dateElement;

        // Find recipients - only within the email header, not from the entire page
        const headerElement = emailContainer.querySelector('div.ha') ||
                            emailContainer.querySelector('td.gF');
        const toElements = headerElement ?
            headerElement.querySelectorAll('span[email], span[data-hovercard-id][email]') :
            [];
        const to = Array.from(toElements)
            .map(el => el.getAttribute('email'))
            .filter(Boolean);

        // Extract email body - find the message body within the email view
        const bodyElement = emailContainer.querySelector('div[data-message-id] div.a3s.aiL') ||
                          emailContainer.querySelector('div.a3s.aiL') ||
                          emailContainer.querySelector('div.ii.gt div') ||
                          emailContainer.querySelector('div[data-message-id]');

        const body = bodyElement?.innerHTML || bodyElement?.textContent || '';

        // Check for attachments - only within the email container
        const attachmentSection = emailContainer.querySelector('div[data-message-id] div.aQH');
        let attachments = [];
        if (attachmentSection) {
            const attachmentElements = attachmentSection.querySelectorAll('span.aV3');
            attachments = Array.from(attachmentElements).map(el => {
                const name = el.textContent?.trim() || '';
                return name ? { name } : null;
            }).filter(Boolean);
        }

        // Check if starred - look for star icon in the email header
        const starElement = emailContainer.querySelector('span[role="checkbox"][aria-label*="tarred"]');
        const isStarred = starElement?.getAttribute('aria-checked') === 'true';

        // Get actual Gmail labels - look for label badges in the email
        const labelContainer = emailContainer.querySelector('div.ar.as');
        let labels = [];
        if (labelContainer) {
            const labelElements = labelContainer.querySelectorAll('span.av');
            labels = Array.from(labelElements)
                .map(el => el.textContent?.trim())
                .filter(Boolean);
        }

        return {
            subject,
            from,
            fromName,
            to,
            date,
            body,
            isHTML: true,
            hasAttachments: attachments.length > 0,
            attachments,
            isStarred,
            labels,
            isRead: true,
            extractionType: 'single_email'
        };
    } catch (error) {
        console.error('Error extracting single email:', error);
        return null;
    }
}

/**
 * Extract email data from list item
 */
function extractEmailFromListItem(emailElement) {
    try {
        // Skip if this is not an email row (like headers or spacers)
        if (!emailElement.querySelector('td') || emailElement.querySelector('td').colSpan > 1) {
            return null;
        }

        // Extract subject - try multiple selectors
        let subject = '';
        const subjectElement = emailElement.querySelector('span[data-thread-id]') ||
                              emailElement.querySelector('td.a4W span.bog') ||
                              emailElement.querySelector('.a4W .bog span');

        if (subjectElement) {
            // Get subject text, removing any label/category badges
            const subjectText = subjectElement.textContent?.trim() || '';
            subject = subjectText.replace(/^\s*\[.*?\]\s*/, ''); // Remove [Label] prefixes
        }

        // If no subject found, this might not be a valid email row
        if (!subject) {
            return null;
        }

        // Extract sender email and name
        const senderEmailElement = emailElement.querySelector('span[email]') ||
                                   emailElement.querySelector('.yX span[email]');

        const senderNameElement = emailElement.querySelector('td.yX span.yP') ||
                                 emailElement.querySelector('td.yX span[name]') ||
                                 emailElement.querySelector('.yX .bA4 span') ||
                                 emailElement.querySelector('.yX span:not([email])');

        const from = senderEmailElement?.getAttribute('email') ||
                    senderEmailElement?.textContent?.trim() || '';

        const fromName = senderNameElement?.textContent?.trim() ||
                        senderNameElement?.getAttribute('name') || '';

        // Extract date - try multiple selectors
        const dateElement = emailElement.querySelector('td.xW span[title]') ||
                          emailElement.querySelector('td.xW span') ||
                          emailElement.querySelector('.xW span');
        const date = dateElement?.getAttribute('title') ||
                    dateElement?.textContent?.trim() || '';

        // Check if unread (unread emails have 'zE' class)
        const isRead = !emailElement.classList.contains('zE');

        // Check if starred
        const starElement = emailElement.querySelector('span[role="checkbox"][aria-label*="tarred"]');
        const isStarred = starElement?.getAttribute('aria-checked') === 'true';

        // Get snippet/preview text - the email body preview (gray text in Gmail)
        const snippetElement = emailElement.querySelector('span.y2') ||
                              emailElement.querySelector('.a4W .y2') ||
                              emailElement.querySelector('td.a4W span:not(.bog)');
        let body = snippetElement?.textContent?.trim() || '';

        // Remove any leading dashes or separators from snippet
        body = body.replace(/^[\s\-–—]+/, '');

        // Check for attachments
        const hasAttachments = emailElement.querySelector('span[aria-label*="ttachment"]') !== null ||
                              emailElement.querySelector('div.aQw') !== null ||
                              emailElement.querySelector('.aQw') !== null;

        // Try to extract labels/categories from the list item
        const labelElements = emailElement.querySelectorAll('.ar span.at, div.ar span');
        const labels = Array.from(labelElements)
            .map(el => el.textContent?.trim())
            .filter(Boolean)
            .filter(label => label.length > 0);

        return {
            subject,
            from,
            fromName,
            to: [],
            date,
            body,
            isHTML: false,
            hasAttachments,
            attachments: [],
            isRead,
            isStarred,
            labels,
            extractionType: 'list_view'
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

    console.log('Initializing Gmail email open detection...');

    // Observer to detect when email is opened
    const observer = new MutationObserver((mutations) => {
        // Check if we're viewing an email
        if (isViewingEmail()) {
            const currentSubject = document.querySelector('h2')?.textContent || '';

            console.log('Observer fired - Current:', currentSubject, '| Last:', lastEmailSubject, '| Processing:', isProcessing);

            // Only process if it's a new email (different from last one)
            if (currentSubject && currentSubject !== lastEmailSubject) {
                // Reset processing flag for new email
                isProcessing = false;
                lastEmailSubject = currentSubject;
                console.log('✅ New email detected:', currentSubject);

                // Clear any pending timeout
                if (processingTimeout) {
                    clearTimeout(processingTimeout);
                }

                // Debounce: Wait for email to fully load before processing
                processingTimeout = setTimeout(() => {
                    handleEmailOpen();
                }, 1000);
            } else {
                console.log('⏭️ Skipping - same email or no subject');
            }
        } else {
            // Don't reset immediately - might be transitioning to another email
            // Only reset isProcessing to allow new emails to be processed
            isProcessing = false;
        }
    });

    // Observe changes in the main content area
    const mainArea = document.querySelector('div[role="main"]');
    if (mainArea) {
        observer.observe(mainArea, {
            childList: true,
            subtree: true
        });
        console.log('Gmail observer attached');
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
            source: 'gmail',
            trigger: 'auto'
        });

        if (result.success) {
            console.log('Email data sent to API automatically');

            // Display label suggestions if available
            if (result.data && result.data.suggestedLabels && result.data.suggestedLabels.length > 0) {
                console.log('Received label suggestions:', result.data.suggestedLabels);
                displayLabelSuggestions(result.data.suggestedLabels, emailData.subject);
            }
        } else {
            console.log('Email data not sent:', result.reason || result.error);
        }
    } catch (error) {
        console.error('Error handling email open:', error);
    } finally {
        // Reset processing flag (it will be reset when new email is detected)
        setTimeout(() => {
            isProcessing = false;
        }, 500);
    }
}

/**
 * Display label suggestions UI over the email
 * @param {Array} labels - Array of suggested label objects
 * @param {string} emailSubject - Subject of the email
 */
function displayLabelSuggestions(labels, emailSubject) {
    console.log('🎨 displayLabelSuggestions called with', labels.length, 'labels for:', emailSubject);

    // Remove any existing label suggestion UI
    removeLabelSuggestionsUI();

    // Create floating panel on right side
    createRightSidePanel(labels, emailSubject);
}

/**
 * Create floating label panel on the right side
 */
function createRightSidePanel(labels, emailSubject) {
    // Create fixed position container on the right side
    const container = document.createElement('div');
    container.id = 'email-reader-label-suggestions-right';
    container.className = 'email-reader-right-panel';

    // Create header
    const header = document.createElement('div');
    header.className = 'email-reader-panel-header';
    header.innerHTML = `
        <span class="email-reader-panel-title">✨ Suggested Labels</span>
        <button class="email-reader-panel-close" title="Close">×</button>
    `;

    // Create labels container
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'email-reader-panel-labels';

    // Add each label as a clickable button
    labels.forEach((labelData) => {
        const labelBtn = document.createElement('button');
        labelBtn.className = 'email-reader-panel-label-btn';
        labelBtn.style.backgroundColor = labelData.color || '#4285F4';
        labelBtn.setAttribute('data-label', labelData.label);
        labelBtn.innerHTML = `
            <span class="email-reader-label-text">${labelData.label}</span>
            <span class="email-reader-label-confidence">${Math.round(labelData.confidence * 100)}%</span>
        `;

        // Add click handler
        labelBtn.addEventListener('click', () => {
            applyLabelToEmail(labelData.label, emailSubject);
            labelBtn.classList.add('applied');
            labelBtn.innerHTML = `<span class="email-reader-label-text">✓ ${labelData.label}</span>`;
        });

        labelsContainer.appendChild(labelBtn);
    });

    // Add close button handler
    const closeBtn = header.querySelector('.email-reader-panel-close');
    closeBtn.addEventListener('click', removeLabelSuggestionsUI);

    // Assemble the UI
    container.appendChild(header);
    container.appendChild(labelsContainer);

    // Add to body (fixed position, right side)
    document.body.appendChild(container);

    console.log('✅ Right side panel displayed');
}

/**
 * Create compact labels in toolbar
 */
function createToolbarLabels(labels, emailSubject) {
    // Find the toolbar area
    const toolbar = document.querySelector('div[role="toolbar"]') ||
                   document.querySelector('.iH') ||
                   document.querySelector('[gh="tm"]');

    if (!toolbar) {
        console.log('⚠️ Toolbar not found, skipping toolbar labels');
        return;
    }

    // Create the label suggestions container
    const container = document.createElement('div');
    container.id = 'email-reader-label-suggestions-toolbar';
    container.className = 'email-reader-label-container email-reader-toolbar';

    // Create header
    const header = document.createElement('div');
    header.className = 'email-reader-label-header';
    header.innerHTML = `
        <span class="email-reader-label-title">✨ Suggested Labels</span>
        <button class="email-reader-label-close" title="Close">×</button>
    `;

    // Create labels container
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'email-reader-labels';

    // Add each label as a clickable button
    labels.forEach((labelData) => {
        const labelBtn = document.createElement('button');
        labelBtn.className = 'email-reader-label-btn';
        labelBtn.style.backgroundColor = labelData.color || '#4285F4';
        labelBtn.setAttribute('data-label', labelData.label);
        labelBtn.innerHTML = `
            <span class="email-reader-label-text">${labelData.label}</span>
            <span class="email-reader-label-confidence">${Math.round(labelData.confidence * 100)}%</span>
        `;

        // Add click handler
        labelBtn.addEventListener('click', () => {
            applyLabelToEmail(labelData.label, emailSubject);
            labelBtn.classList.add('applied');
            labelBtn.innerHTML = `<span class="email-reade
            r-label-text">✓ ${labelData.label}</span>`;
        });

        labelsContainer.appendChild(labelBtn);
    });

    // Add close button handler
    const closeBtn = header.querySelector('.email-reader-label-close');
    closeBtn.addEventListener('click', removeLabelSuggestionsUI);

    // Assemble the UI
    container.appendChild(header);
    container.appendChild(labelsContainer);

    // Insert at the beginning of the toolbar (left side)
    toolbar.insertBefore(container, toolbar.firstChild);

    console.log('✅ Toolbar labels displayed');
}

/**
 * Create labels below subject line
 */
function createSubjectLabels(labels, emailSubject) {
    // Find the subject element
    const subjectElement = document.querySelector('h2');
    if (!subjectElement) {
        console.log('⚠️ Subject element not found, skipping subject labels');
        return;
    }

    // Create container for subject labels (larger, full-width version)
    const container = document.createElement('div');
    container.id = 'email-reader-label-suggestions-subject';
    container.className = 'email-reader-label-container email-reader-subject';

    // Create header
    const header = document.createElement('div');
    header.className = 'email-reader-label-header-subject';
    header.innerHTML = `
        <span class="email-reader-label-title-subject">✨ AI Suggested Labels</span>
        <button class="email-reader-label-close-subject" title="Close">×</button>
    `;

    // Create labels container
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'email-reader-labels-subject';

    // Add each label as a clickable button
    labels.forEach((labelData) => {
        const labelBtn = document.createElement('button');
        labelBtn.className = 'email-reader-label-btn-subject';
        labelBtn.style.backgroundColor = labelData.color || '#4285F4';
        labelBtn.setAttribute('data-label', labelData.label);
        labelBtn.innerHTML = `
            <span class="email-reader-label-text">${labelData.label}</span>
            <span class="email-reader-label-confidence">${Math.round(labelData.confidence * 100)}%</span>
        `;

        // Add click handler
        labelBtn.addEventListener('click', () => {
            applyLabelToEmail(labelData.label, emailSubject);
            labelBtn.classList.add('applied');
            labelBtn.innerHTML = `<span class="email-reader-label-text">✓ ${labelData.label}</span>`;
        });

        labelsContainer.appendChild(labelBtn);
    });

    // Add close button handler
    const closeBtn = header.querySelector('.email-reader-label-close-subject');
    closeBtn.addEventListener('click', removeLabelSuggestionsUI);

    // Assemble the UI
    container.appendChild(header);
    container.appendChild(labelsContainer);

    // Insert after the subject
    subjectElement.parentElement.insertBefore(container, subjectElement.nextSibling);

    console.log('✅ Subject labels displayed');
}

/**
 * Remove label suggestions UI
 */
function removeLabelSuggestionsUI() {
    const rightPanel = document.getElementById('email-reader-label-suggestions-right');
    if (rightPanel) rightPanel.remove();
    console.log('🗑️ Labels removed');
}

/**
 * Apply a label to the current email using Gmail UI
 * @param {string} label - Label name to apply
 * @param {string} emailSubject - Email subject for logging
 */
function applyLabelToEmail(label, emailSubject) {
    console.log(`Applying label "${label}" to email: ${emailSubject}`);

    // Try to find and click the "Labels" button in Gmail UI
    const labelsButton = document.querySelector('[aria-label="Labels"]') ||
                        document.querySelector('[data-tooltip="Labels"]') ||
                        Array.from(document.querySelectorAll('div[role="button"]')).find(btn =>
                            btn.getAttribute('aria-label')?.includes('Labels') ||
                            btn.getAttribute('data-tooltip')?.includes('Labels')
                        );

    if (labelsButton) {
        // Click the labels button to open the menu
        labelsButton.click();

        // Wait for the menu to open
        setTimeout(() => {
            // Try to find and click the specific label in the menu
            const labelMenuItems = document.querySelectorAll('[role="menuitemcheckbox"]');
            let labelFound = false;

            for (const item of labelMenuItems) {
                const labelText = item.textContent.trim();
                if (labelText.toLowerCase() === label.toLowerCase()) {
                    item.click();
                    labelFound = true;
                    console.log(`Label "${label}" applied successfully`);
                    break;
                }
            }

            if (!labelFound) {
                console.log(`Label "${label}" not found in Gmail. You may need to create it first.`);
                // Close the menu
                document.body.click();

                // Show notification to user
                showNotification(`Label "${label}" needs to be created in Gmail first`, 'warning');
            } else {
                showNotification(`Label "${label}" applied successfully!`, 'success');
            }
        }, 300);
    } else {
        console.log('Labels button not found in Gmail UI');
        showNotification('Could not find Gmail labels button', 'error');
    }
}

/**
 * Show a temporary notification to the user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotif = document.getElementById('email-reader-notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'email-reader-notification';
    notification.className = `email-reader-notification ${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize auto-detection when page loads
waitForGmailLoad().then(() => {
    initAutoDetection();

    // Re-check observer every 5 seconds to ensure it's still working
    setInterval(() => {
        if (!observerInitialized || !document.querySelector('div[role="main"]')) {
            console.log('🔄 Re-initializing observer...');
            observerInitialized = false;
            initAutoDetection();
        }
    }, 5000);

    // Watch for Gmail navigation changes (SPA routing)
    let lastUrl = location.href;
    let lastEmailId = null;

    // Extract email ID from URL hash
    function getEmailIdFromUrl() {
        const match = location.href.match(/#[^/]+\/([A-Za-z0-9]+)/);
        return match ? match[1] : null;
    }

    // Check for email changes every 500ms
    setInterval(() => {
        const currentUrl = location.href;
        const currentEmailId = getEmailIdFromUrl();

        // URL changed
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log('📍 Gmail navigation detected:', currentUrl);
        }

        // Email ID changed - new email opened!
        if (currentEmailId && currentEmailId !== lastEmailId) {
            lastEmailId = currentEmailId;
            console.log('📧 New email ID detected:', currentEmailId);

            // Reset state for new email
            isProcessing = false;
            lastEmailSubject = null;

            // Wait for email to load, then process
            setTimeout(() => {
                // Check if email subject exists (works in both full view and preview pane)
                const subject = document.querySelector('h2')?.textContent || '';
                const hasEmailBody = !!document.querySelector('div[data-message-id]') ||
                                    !!document.querySelector('.a3s.aiL');

                if (subject && hasEmailBody) {
                    console.log('🔄 Force processing new email:', subject);
                    console.log('📧 View mode:', isViewingEmail() ? 'Full view' : 'Preview pane');
                    lastEmailSubject = subject;
                    handleEmailOpen();
                } else {
                    console.log('⏳ Email not fully loaded yet, subject:', subject, 'hasBody:', hasEmailBody);
                }
            }, 1500);
        }

        // Went back to inbox - reset email ID
        if (!currentEmailId && lastEmailId) {
            console.log('📋 Back to inbox');
            lastEmailId = null;
            lastEmailSubject = null;
        }
    }, 500);
});

console.log('Gmail content script loaded');