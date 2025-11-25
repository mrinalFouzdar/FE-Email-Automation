// Background service worker for the extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('Email Reader Extension installed');
    console.log('Auto-send is ALWAYS enabled - no configuration needed!');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'emailsExtracted') {
        console.log('Emails extracted:', request.data);
        // Store in chrome.storage if needed
        chrome.storage.local.set({ lastExtractedData: request.data });
    }
    return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'extractEmails' });
});