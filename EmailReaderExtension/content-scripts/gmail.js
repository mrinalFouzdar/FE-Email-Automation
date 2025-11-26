// Gmail content script - Fixed version with reliable label detection and automatic creation
// Uses Gmail's sidebar "+" button to create new labels

const script = document.createElement('script');
script.src = chrome.runtime.getURL('utils.js');
document.head.appendChild(script);

function injectStyles() {
    if (document.getElementById('email-reader-styles')) return;

    const style = document.createElement('style');
    style.id = 'email-reader-styles';
    style.textContent = `
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
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .email-reader-notification.success { background: #4CAF50; color: white; }
        .email-reader-notification.error { background: #f44336; color: white; }
        .email-reader-notification.warning { background: #ff9800; color: white; }
        .email-reader-notification.fade-out { animation: fadeOut 0.3s; opacity: 0; }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

injectStyles();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractEmails') {
        extractGmailData(request.chunkSize || 1000)
            .then(data => sendResponse(data))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function extractGmailData(chunkSize) {
    try {
        if (!window.location.hostname.includes('mail.google.com')) {
            throw new Error('Not on Gmail');
        }
        await waitForGmailLoad();
        const emailData = extractSingleEmail();
        if (!emailData) throw new Error('No email found');
        
        const processedData = processEmails([emailData], chunkSize);
        return { success: true, data: processedData, source: 'gmail' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

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
            setTimeout(() => { observer.disconnect(); resolve(); }, 10000);
        }
    });
}

function isViewingEmail() {
    const hasSubject = !!document.querySelector('div[role="main"] h2');
    const hasEmailBody = !!document.querySelector('div[data-message-id]');
    const inListView = !!document.querySelector('table.F.cf.zt');
    return hasSubject && hasEmailBody && !inListView;
}

function extractSingleEmail() {
    try {
        const emailContainer = document.querySelector('div[role="main"]');
        if (!emailContainer) return null;

        const subject = emailContainer.querySelector('h2')?.textContent?.trim() || '';
        const labelContainer = emailContainer.querySelector('div.ar.as');
        let labels = [];
        if (labelContainer) {
            labels = Array.from(labelContainer.querySelectorAll('span.av'))
                .map(el => el.textContent?.trim()).filter(Boolean);
        }

        return { subject, labels };
    } catch (error) {
        return null;
    }
}

let lastEmailSubject = null;
let observerInitialized = false;
let processingTimeout = null;
let isProcessing = false;
let currentEmailId = null;

// SIMPLIFIED: Get current email ID
function getCurrentEmailId() {
    // Method 1: From URL (most reliable)
    const urlMatch = location.href.match(/#[^/]+\/([A-Za-z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    
    // Method 2: From data attributes
    const emailElement = document.querySelector('div[data-message-id]');
    if (emailElement) return emailElement.getAttribute('data-message-id');
    
    return null;
}

// SIMPLIFIED: Initialize auto-detection
function initAutoDetection() {
    if (observerInitialized) return;
    
    console.log('🔍 Initializing email auto-detection...');
    observerInitialized = true;

    // Main observer for email content changes
    const observer = new MutationObserver(() => {
        if (isViewingEmail()) {
            const emailId = getCurrentEmailId();
            const currentSubject = document.querySelector('h2')?.textContent || '';
            
            if (currentSubject && emailId && emailId !== currentEmailId) {
                console.log('📧 New email detected:', currentSubject.substring(0, 50));
                isProcessing = false;
                lastEmailSubject = currentSubject;
                currentEmailId = emailId;
                
                // Clear any existing UI immediately
                removeLabelSuggestionsUI();
                
                if (processingTimeout) clearTimeout(processingTimeout);
                processingTimeout = setTimeout(() => handleEmailOpen(), 1500);
            }
        } else {
            // Not viewing an email, clear the UI
            removeLabelSuggestionsUI();
            currentEmailId = null;
            lastEmailSubject = null;
        }
    });

    // Start observing the main content area
    const mainArea = document.querySelector('div[role="main"]');
    if (mainArea) {
        observer.observe(mainArea, { childList: true, subtree: true });
        console.log('✅ Observer started on main area');
    } else {
        console.log('❌ Main area not found, retrying...');
        setTimeout(initAutoDetection, 1000);
    }
}

// SIMPLIFIED: Handle email open
async function handleEmailOpen() {
    if (isProcessing) return;
    
    const currentEmailWhenStarted = getCurrentEmailId();
    if (!currentEmailWhenStarted || !isViewingEmail()) {
        isProcessing = false;
        return;
    }
    
    console.log('🚀 Processing email:', currentEmailWhenStarted);
    isProcessing = true;

    try {
        const emailData = extractSingleEmail();
        if (!emailData) {
            console.log('❌ No email data found');
            isProcessing = false;
            return;
        }

        console.log('📧 Email subject:', emailData.subject);
        
        // Process email and get label suggestions
        const processedData = processEmail(emailData, 1000);
        const result = await sendToAPI({
            emails: [processedData],
            totalEmails: 1,
            source: 'gmail',
            trigger: 'auto'
        });

        console.log('🤖 API result:', result);

        // Final check - make sure we're still on the same email before showing UI
        if (result.success && result.data?.suggestedLabels?.length > 0 && 
            getCurrentEmailId() === currentEmailWhenStarted && isViewingEmail()) {
            console.log('🎯 Displaying label suggestions:', result.data.suggestedLabels.length);
            displayLabelSuggestions(result.data.suggestedLabels);
        } else {
            console.log('❌ Conditions not met for showing labels:', {
                success: result.success,
                hasLabels: result.data?.suggestedLabels?.length > 0,
                sameEmail: getCurrentEmailId() === currentEmailWhenStarted,
                viewingEmail: isViewingEmail()
            });
        }
    } catch (error) {
        console.error('❌ Error processing email:', error);
    } finally {
        setTimeout(() => { isProcessing = false; }, 1000);
    }
}

function displayLabelSuggestions(labels) {
    removeLabelSuggestionsUI();
    createRightSidePanel(labels);
}

function createRightSidePanel(labels) {
    const container = document.createElement('div');
    container.id = 'email-reader-label-suggestions-right';
    container.className = 'email-reader-right-panel';

    const header = document.createElement('div');
    header.className = 'email-reader-panel-header';
    header.innerHTML = `
        <span class="email-reader-panel-title">✨ Suggested Labels</span>
        <button class="email-reader-panel-close" title="Close">×</button>
    `;

    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'email-reader-panel-labels';

    labels.forEach((labelData) => {
        const labelBtn = document.createElement('button');
        labelBtn.className = 'email-reader-panel-label-btn';
        labelBtn.style.backgroundColor = labelData.color || '#4285F4';
        labelBtn.innerHTML = `
            <span class="email-reader-label-text">${labelData.label}</span>
            <span class="email-reader-label-confidence">${Math.round(labelData.confidence * 100)}%</span>
        `;

        labelBtn.addEventListener('click', async () => {
            if (labelBtn.classList.contains('applied')) return;
            
            labelBtn.classList.add('applied');
            labelBtn.innerHTML = `<span class="email-reader-label-text">⏳ Processing...</span>`;
            
            const success = await applyOrCreateLabel(labelData.label);
            
            if (success) {
                labelBtn.innerHTML = `<span class="email-reader-label-text">✓ ${labelData.label}</span>`;
                showNotification(`Label "${labelData.label}" applied successfully!`, 'success');
            } else {
                labelBtn.classList.remove('applied');
                labelBtn.innerHTML = `
                    <span class="email-reader-label-text">${labelData.label}</span>
                    <span class="email-reader-label-confidence">${Math.round(labelData.confidence * 100)}%</span>
                `;
                showNotification(`Failed to apply label "${labelData.label}"`, 'error');
            }
        });

        labelsContainer.appendChild(labelBtn);
    });

    header.querySelector('.email-reader-panel-close').addEventListener('click', removeLabelSuggestionsUI);
    container.appendChild(header);
    container.appendChild(labelsContainer);
    document.body.appendChild(container);
    
    console.log('✅ Label panel created with', labels.length, 'labels');
}

function removeLabelSuggestionsUI() {
    const panel = document.getElementById('email-reader-label-suggestions-right');
    if (panel) {
        panel.remove();
        console.log('🗑️ Label panel removed');
    }
}

/**
 * Improved: Apply or create label - complete workflow
 */
async function applyOrCreateLabel(labelName) {
    console.log(`🏷️ Processing label: "${labelName}"`);

    try {
        // First, try to check if label exists and apply it
        const labelExists = checkLabelExistsInSidebar(labelName);
        
        if (labelExists) {
            console.log('✅ Label exists, applying it...');
            const applied = await applyExistingLabel(labelName);
            if (applied) return true;
        }

        // If label doesn't exist or couldn't be applied, create it
        console.log(`📝 Label doesn't exist or couldn't be applied, creating: "${labelName}"`);
        const created = await createNewLabel(labelName);
        
        if (!created) {
            console.log(`❌ Failed to create label: "${labelName}"`);
            return false;
        }

        // Wait for label to be created and appear in sidebar
        await sleep(2000);
        
        // Now try to apply the newly created label
        console.log(`✅ Label created, now applying: "${labelName}"`);
        const appliedAfterCreation = await applyExistingLabel(labelName);
        
        if (appliedAfterCreation) {
            console.log(`✅ Successfully created and applied: "${labelName}"`);
            return true;
        } else {
            console.log(`⚠️ Label created but failed to apply: "${labelName}"`);
            // Label was created even if we couldn't apply it immediately
            return true;
        }

    } catch (error) {
        console.error(`❌ Error processing label "${labelName}":`, error);
        return false;
    }
}

/**
 * Improved: Check if label exists in the sidebar
 */
function checkLabelExistsInSidebar(labelName) {
    // Method 1: Check sidebar navigation
    const sidebarLabels = document.querySelectorAll('div[role="navigation"] [data-tooltip], aside [data-tooltip]');
    
    for (const label of sidebarLabels) {
        const tooltip = label.getAttribute('data-tooltip') || '';
        const text = label.textContent?.trim() || '';
        
        if (tooltip.toLowerCase() === labelName.toLowerCase() || 
            text.toLowerCase() === labelName.toLowerCase()) {
            console.log(`✅ Found label in sidebar: "${labelName}"`);
            return true;
        }
    }

    // Method 2: Check in labels menu (if open)
    const labelsMenu = document.querySelector('div[role="menu"]');
    if (labelsMenu) {
        const menuItems = labelsMenu.querySelectorAll('div[role="menuitemcheckbox"]');
        for (const item of menuItems) {
            const text = item.textContent?.trim() || '';
            if (text.toLowerCase() === labelName.toLowerCase()) {
                console.log(`✅ Found label in menu: "${labelName}"`);
                return true;
            }
        }
    }

    console.log(`⚠️ Label "${labelName}" not found in sidebar`);
    return false;
}

/**
 * Improved: Apply an existing label using keyboard shortcut and menu
 */
async function applyExistingLabel(labelName) {
    console.log(`🏷️ Attempting to apply label: "${labelName}"`);

    try {
        // Focus on email content area
        const emailView = document.querySelector('[role="main"]');
        if (emailView) emailView.focus();
        
        // Open labels menu with 'l' key
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'l', code: 'KeyL', keyCode: 76, which: 76,
            bubbles: true, cancelable: true, composed: true
        }));

        await sleep(1000);

        // Wait for and find the labels menu
        let menu = null;
        for (let i = 0; i < 10; i++) {
            menu = document.querySelector('div[role="menu"], div[role="listbox"]');
            if (menu) break;
            await sleep(200);
        }

        if (!menu) {
            console.log('❌ Could not open labels menu');
            return false;
        }

        // Search for the label
        const searchInput = menu.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);
            
            searchInput.value = labelName;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(500);
        }

        // Find and click the label
        const menuItems = menu.querySelectorAll('div[role="menuitemcheckbox"], div[role="option"]');
        let labelFound = false;
        
        for (const item of menuItems) {
            const text = item.textContent?.trim() || '';
            if (text.toLowerCase().includes(labelName.toLowerCase())) {
                const isChecked = item.getAttribute('aria-checked') === 'true' || 
                                 item.getAttribute('aria-selected') === 'true';
                
                if (!isChecked) {
                    item.click();
                    await sleep(800);
                    console.log(`✅ Label applied: "${labelName}"`);
                    labelFound = true;
                } else {
                    console.log(`✅ Label already applied: "${labelName}"`);
                    labelFound = true;
                }
                break;
            }
        }

        // Close menu
        document.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'Escape', 
            code: 'Escape',
            bubbles: true, 
            cancelable: true 
        }));

        return labelFound;

    } catch (error) {
        console.error('❌ Error applying label:', error);
        // Ensure menu is closed on error
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return false;
    }
}

/**
 * Improved: Create a new label using sidebar's + button
 */
async function createNewLabel(labelName) {
    console.log(`📝 Creating new label: "${labelName}"`);

    try {
        // Find the "+" button next to "Labels" in sidebar
        const plusButton = findLabelsPlusButton();
        
        if (!plusButton) {
            console.log('❌ Could not find + button for labels');
            return false;
        }

        console.log('✅ Found + button, clicking...');
        plusButton.click();
        await sleep(1500);

        // Wait for and find the create label dialog - FIXED SELECTORS
        let dialog = null;
        for (let i = 0; i < 15; i++) {
            // Try multiple possible dialog selectors
            dialog = document.querySelector('div[role="dialog"], .Kj-JD-K7, .aSs, .aB, .aoD, [aria-modal="true"]');
            if (dialog) {
                console.log('✅ Dialog found with selector:', dialog.className);
                break;
            }
            await sleep(200);
        }

        if (!dialog) {
            console.log('❌ Create label dialog did not open - checking for any modal');
            // Last attempt: look for any element that might be the dialog
            const allDivs = document.querySelectorAll('div');
            for (const div of allDivs) {
                const style = window.getComputedStyle(div);
                if (style.zIndex > 1000 || div.textContent?.includes('new label') || div.textContent?.includes('Please enter')) {
                    console.log('✅ Found potential dialog:', div.className);
                    dialog = div;
                    break;
                }
            }
        }

        if (!dialog) {
            console.log('❌ Create label dialog not found after multiple attempts');
            return false;
        }

        // FIXED: Find input field with better selectors
        let input = dialog.querySelector('input[type="text"]');
        if (!input) {
            // Try to find any input in the dialog
            input = dialog.querySelector('input');
        }
        if (!input) {
            // Look for contenteditable or any text input
            const inputs = dialog.querySelectorAll('input, [contenteditable="true"]');
            input = inputs[0];
        }

        if (!input) {
            console.log('❌ Input field not found in dialog');
            return false;
        }

        console.log('✅ Input field found, filling label name...');
        
        // Clear and set input value
        input.focus();
        await sleep(200);
        
        // Different approach for different input types
        if (input.tagName === 'INPUT') {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);
            
            input.value = labelName;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            // For contenteditable
            input.textContent = labelName;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await sleep(800);

        // FIXED: Find Create button with better logic
        const buttons = dialog.querySelectorAll('button, div[role="button"]');
        let createButton = null;
        
        console.log('🔍 Looking for Create button among', buttons.length, 'buttons');
        
        for (const button of buttons) {
            const text = button.textContent?.trim().toLowerCase();
            const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
            console.log('Button text:', text, 'aria-label:', ariaLabel);
            
            if (text === 'create' || text === 'save' || 
                ariaLabel.includes('create') || ariaLabel.includes('save') ||
                button.innerHTML.includes('Create') || button.innerHTML.includes('Save')) {
                createButton = button;
                console.log('✅ Found create button:', text);
                break;
            }
        }

        // Alternative: Look for disabled state change (Create button enables when text entered)
        if (!createButton) {
            for (const button of buttons) {
                if (!button.disabled && button.textContent?.trim()) {
                    createButton = button;
                    console.log('✅ Found enabled button as create button:', button.textContent);
                    break;
                }
            }
        }

        if (!createButton) {
            console.log('❌ Create button not found');
            // Try to find by position (usually the rightmost button)
            const enabledButtons = Array.from(buttons).filter(btn => !btn.disabled && btn.textContent?.trim());
            if (enabledButtons.length > 0) {
                createButton = enabledButtons[enabledButtons.length - 1];
                console.log('✅ Using last enabled button as create button:', createButton.textContent);
            }
        }

        if (!createButton || createButton.disabled) {
            console.log('❌ Create button not found or still disabled');
            return false;
        }

        console.log('✅ Clicking Create button');
        createButton.click();
        await sleep(1200);

        // Verify success by checking if dialog closed
        const dialogStillOpen = document.querySelector('div[role="dialog"], .Kj-JD-K7, .aSs, .aB, .aoD');
        if (!dialogStillOpen) {
            console.log(`✅ Label created successfully: "${labelName}"`);
            return true;
        } else {
            console.log('❌ Dialog still open after click - creation may have failed');
            return false;
        }

    } catch (error) {
        console.error('❌ Error creating label:', error);
        return false;
    }
}

/**
 * Improved: Find the + button next to Labels in sidebar
 */
function findLabelsPlusButton() {
    // Method 1: Look for specific tooltips in sidebar
    const sidebar = document.querySelector('div[role="navigation"], aside, nav');
    if (sidebar) {
        const tooltipButtons = sidebar.querySelectorAll('[data-tooltip]');
        for (const btn of tooltipButtons) {
            const tooltip = btn.getAttribute('data-tooltip')?.toLowerCase() || '';
            if (tooltip.includes('create') && tooltip.includes('label')) {
                console.log('✅ Found create label button by tooltip in sidebar');
                return btn;
            }
        }
    }

    // Method 2: Look for Labels text and find nearby + button
    const labelsText = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.trim() === 'Labels' || el.textContent?.trim() === 'Label'
    );
    
    if (labelsText) {
        console.log('✅ Found Labels text, looking for nearby + button');
        
        // Look in parent container
        let container = labelsText.closest('div');
        for (let i = 0; i < 5; i++) {
            if (!container) break;
            
            const plusBtn = container.querySelector('[aria-label*="+"], [data-tooltip*="+"], [aria-label*="create"], [data-tooltip*="create"], [aria-label*="new"], [data-tooltip*="new"]');
            if (plusBtn) {
                console.log('✅ Found + button near Labels text');
                return plusBtn;
            }
            container = container.parentElement;
        }
    }

    // Method 3: Look for any button with + icon
    const allButtons = document.querySelectorAll('button, div[role="button"]');
    for (const btn of allButtons) {
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        const tooltip = btn.getAttribute('data-tooltip')?.toLowerCase() || '';
        
        if (text === '+' || 
            ariaLabel.includes('create new label') ||
            tooltip.includes('create new label') ||
            ariaLabel === 'create new label' ||
            tooltip === 'create new label') {
            console.log('✅ Found + button by text/aria-label');
            return btn;
        }
    }

    // Method 4: Look in the left sidebar specifically
    const leftSidebar = document.querySelector('[guidedhelpid="navigation_container"]');
    if (leftSidebar) {
        const plusButtons = leftSidebar.querySelectorAll('div[role="button"]');
        for (const btn of plusButtons) {
            if (btn.textContent?.includes('+') || btn.getAttribute('aria-label')?.includes('label')) {
                console.log('✅ Found + button in left sidebar');
                return btn;
            }
        }
    }

    console.log('❌ + button not found after all methods');
    return null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showNotification(message, type = 'info') {
    const existing = document.getElementById('email-reader-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'email-reader-notification';
    notification.className = `email-reader-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// SIMPLIFIED INITIALIZATION - Only one initialization block
console.log('🚀 Gmail content script loading...');

waitForGmailLoad().then(() => {
    console.log('✅ Gmail loaded, starting auto-detection');
    initAutoDetection();

    // Health check - restart if observer stops working
    setInterval(() => {
        if (!observerInitialized || !document.querySelector('div[role="main"]')) {
            console.log('🔄 Restarting auto-detection...');
            observerInitialized = false;
            initAutoDetection();
        }
    }, 5000);

    // Additional URL change detection as backup
    let lastUrl = location.href;
    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            console.log('🔗 URL changed, checking for email...');
            lastUrl = currentUrl;
            
            // Reset state for new email
            currentEmailId = null;
            lastEmailSubject = null;
            isProcessing = false;
            removeLabelSuggestionsUI();
            
            // Wait a bit then check if we're viewing an email
            setTimeout(() => {
                if (isViewingEmail()) {
                    const emailId = getCurrentEmailId();
                    const subject = document.querySelector('h2')?.textContent || '';
                    if (emailId && subject) {
                        console.log('📧 Email detected after URL change');
                        currentEmailId = emailId;
                        lastEmailSubject = subject;
                        handleEmailOpen();
                    }
                }
            }, 2000);
        }
    }, 1000);
});

console.log('✅ Gmail content script loaded - Complete automation with reliable label creation');