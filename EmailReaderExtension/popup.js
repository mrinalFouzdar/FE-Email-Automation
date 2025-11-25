let extractedData = null;

document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const downloadJsonBtn = document.getElementById('downloadJson');
    const copyJsonBtn = document.getElementById('copyJson');
    const sendToBackendBtn = document.getElementById('sendToBackend');
    const chunkSizeInput = document.getElementById('chunkSize');
    const backendUrlInput = document.getElementById('backendUrl');
    const statusDiv = document.getElementById('status');
    const previewDiv = document.getElementById('preview');

    // Load saved settings
    chrome.storage.sync.get(['backendUrl'], function(result) {
        if (result.backendUrl) {
            backendUrlInput.value = result.backendUrl;
        }
    });

    // Save backend URL on change
    backendUrlInput.addEventListener('change', function() {
        chrome.storage.sync.set({ backendUrl: backendUrlInput.value });
        showStatus('Backend URL saved', 'success');
    });

    extractBtn.addEventListener('click', extractEmails);
    downloadJsonBtn.addEventListener('click', downloadJSON);
    copyJsonBtn.addEventListener('click', copyToClipboard);
    sendToBackendBtn.addEventListener('click', sendToBackend);

    async function extractEmails() {
        showStatus('Extracting email data...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const chunkSize = parseInt(chunkSizeInput.value) || 1000;
            
            const results = await chrome.tabs.sendMessage(tab.id, {
                action: 'extractEmails',
                chunkSize: chunkSize
            });

            if (results && results.success) {
                extractedData = results.data;
                showStatus(`Successfully extracted ${results.data.emails.length} email(s) with ${results.data.totalChunks} total chunks`, 'success');
                
                // Enable export buttons
                downloadJsonBtn.disabled = false;
                copyJsonBtn.disabled = false;
                sendToBackendBtn.disabled = false;

                // Show preview
                showPreview(results.data);
            } else {
                showStatus(results?.error || 'Failed to extract emails. Make sure you are on a supported email page.', 'error');
            }
        } catch (error) {
            showStatus(`Error: ${error.message}`, 'error');
            console.error('Extraction error:', error);
        }
    }

    function downloadJSON() {
        if (!extractedData) return;

        const dataStr = JSON.stringify(extractedData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `emails_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('JSON file downloaded successfully!', 'success');
    }

    async function copyToClipboard() {
        if (!extractedData) return;

        try {
            const dataStr = JSON.stringify(extractedData, null, 2);
            await navigator.clipboard.writeText(dataStr);
            showStatus('Data copied to clipboard!', 'success');
        } catch (error) {
            showStatus(`Failed to copy: ${error.message}`, 'error');
        }
    }

    async function sendToBackend() {
        if (!extractedData) return;

        const backendUrl = backendUrlInput.value.trim();
        if (!backendUrl) {
            showStatus('Please enter a backend URL', 'error');
            return;
        }

        showStatus('Sending data to backend...', 'info');

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(extractedData)
            });

            if (response.ok) {
                const result = await response.json();
                showStatus('Data sent successfully to backend!', 'success');
                console.log('Backend response:', result);
            } else {
                showStatus(`Backend error: ${response.status} ${response.statusText}`, 'error');
            }
        } catch (error) {
            showStatus(`Network error: ${error.message}`, 'error');
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status show ${type}`;
        setTimeout(() => {
            if (type !== 'success') {
                statusDiv.classList.remove('show');
            }
        }, 5000);
    }

    function showPreview(data) {
        const preview = {
            totalEmails: data.emails.length,
            totalChunks: data.totalChunks,
            firstEmail: data.emails[0] ? {
                subject: data.emails[0].subject,
                from: data.emails[0].from,
                chunksCount: data.emails[0].chunks.length
            } : null
        };

        previewDiv.innerHTML = `<pre>${JSON.stringify(preview, null, 2)}</pre>`;
        previewDiv.classList.add('show');
    }
});