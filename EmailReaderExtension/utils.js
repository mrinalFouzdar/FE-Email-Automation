// Utility functions for email processing and chunking

/**
 * Split text into chunks of specified size
 * @param {string} text - Text to split
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array<string>} Array of text chunks
 */
function chunkText(text, chunkSize = 1000) {
    if (!text) return [];
    
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        let end = start + chunkSize;
        
        // Try to break at word boundary
        if (end < text.length) {
            const lastSpace = text.lastIndexOf(' ', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastSpace, lastNewline);
            
            if (breakPoint > start) {
                end = breakPoint + 1;
            }
        }
        
        chunks.push(text.substring(start, end).trim());
        start = end;
    }
    
    return chunks;
}

/**
 * Extract text content from HTML
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function extractTextFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * Clean email address
 * @param {string} email - Email string that might contain name
 * @returns {string} Cleaned email
 */
function cleanEmail(email) {
    if (!email) return '';
    
    // Extract email from "Name <email@example.com>" format
    const match = email.match(/<?([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)>?/);
    return match ? match[1] : email.trim();
}

/**
 * Extract sender name from email string
 * @param {string} email - Email string
 * @returns {string} Sender name
 */
function extractSenderName(email) {
    if (!email) return '';
    
    // Extract name from "Name <email@example.com>" format
    const match = email.match(/^([^<]+)</);
    if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
    }
    
    return '';
}

/**
 * Parse date string to ISO format
 * @param {string} dateStr - Date string
 * @returns {string} ISO date string
 */
function parseDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toISOString();
    } catch (error) {
        return dateStr;
    }
}

/**
 * Extract metadata from email
 * @param {Object} emailData - Raw email data
 * @returns {Object} Structured email metadata
 */
function extractEmailMetadata(emailData) {
    // Process 'to' field and remove duplicates
    let toEmails = [];
    if (emailData.to) {
        const toArray = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
        toEmails = [...new Set(toArray.map(cleanEmail).filter(Boolean))];
    }

    // Process 'cc' field and remove duplicates
    let ccEmails = [];
    if (emailData.cc) {
        const ccArray = Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc];
        ccEmails = [...new Set(ccArray.map(cleanEmail).filter(Boolean))];
    }

    // Remove duplicate labels
    const uniqueLabels = emailData.labels ? [...new Set(emailData.labels.filter(Boolean))] : [];

    return {
        subject: emailData.subject || 'No Subject',
        from: cleanEmail(emailData.from),
        fromName: extractSenderName(emailData.from),
        to: toEmails,
        cc: ccEmails,
        date: parseDate(emailData.date),
        hasAttachments: emailData.hasAttachments || false,
        attachments: emailData.attachments || [],
        labels: uniqueLabels,
        isRead: emailData.isRead !== undefined ? emailData.isRead : true,
        isStarred: emailData.isStarred || false
    };
}

/**
 * Process email and create chunks
 * @param {Object} emailData - Raw email data
 * @param {number} chunkSize - Size of each chunk
 * @returns {Object} Processed email with chunks
 */
function processEmail(emailData, chunkSize = 1000) {
    const metadata = extractEmailMetadata(emailData);
    
    // Extract and clean body text
    let bodyText = emailData.body || '';
    if (emailData.isHTML) {
        bodyText = extractTextFromHTML(bodyText);
    }
    
    // Create chunks
    const chunks = chunkText(bodyText, chunkSize);
    
    return {
        ...metadata,
        bodyLength: bodyText.length,
        chunks: chunks.map((chunk, index) => ({
            index: index,
            text: chunk,
            length: chunk.length
        })),
        totalChunks: chunks.length,
        extractedAt: new Date().toISOString()
    };
}

/**
 * Process multiple emails
 * @param {Array<Object>} emails - Array of raw email data
 * @param {number} chunkSize - Size of each chunk
 * @returns {Object} Processed emails data
 */
function processEmails(emails, chunkSize = 1000) {
    const processedEmails = emails.map(email => processEmail(email, chunkSize));

    return {
        emails: processedEmails,
        totalEmails: processedEmails.length,
        totalChunks: processedEmails.reduce((sum, email) => sum + email.totalChunks, 0),
        extractedAt: new Date().toISOString(),
        chunkSize: chunkSize
    };
}

/**
 * Send email data to backend API
 * @param {Object} emailData - Email data to send
 * @returns {Promise<Object>} API response
 */
/**
 * Generate dummy label suggestions based on email content
 * @param {Object} emailData - Email data
 * @returns {Object} Dummy API response with label suggestions
 */
function generateDummyLabelSuggestions(emailData) {
    const email = emailData.emails[0];
    const subject = email.subject.toLowerCase();
    const body = email.chunks.map(c => c.text).join(' ').toLowerCase();

    const suggestedLabels = [];

    // Analyze subject and body for keywords
    if (subject.includes('invoice') || body.includes('payment') || body.includes('bill')) {
        suggestedLabels.push({ label: 'Finance', confidence: 0.95, color: '#34A853' });
    }

    if (subject.includes('urgent') || subject.includes('important') || subject.includes('asap')) {
        suggestedLabels.push({ label: 'Urgent', confidence: 0.88, color: '#EA4335' });
    }

    if (subject.includes('meeting') || body.includes('schedule') || body.includes('calendar')) {
        suggestedLabels.push({ label: 'Meeting', confidence: 0.82, color: '#4285F4' });
    }

    if (subject.includes('project') || body.includes('deadline') || body.includes('task')) {
        suggestedLabels.push({ label: 'Project', confidence: 0.78, color: '#FBBC04' });
    }

    if (subject.includes('newsletter') || subject.includes('subscription') || body.includes('unsubscribe')) {
        suggestedLabels.push({ label: 'Newsletter', confidence: 0.85, color: '#9E9E9E' });
    }

    if (email.hasAttachments) {
        suggestedLabels.push({ label: 'Attachments', confidence: 0.92, color: '#673AB7' });
    }

    // If no specific labels found, suggest generic ones
    if (suggestedLabels.length === 0) {
        suggestedLabels.push(
            { label: 'Work', confidence: 0.65, color: '#4285F4' },
            { label: 'Personal', confidence: 0.60, color: '#34A853' }
        );
    }

    return {
        success: true,
        suggestedLabels: suggestedLabels.slice(0, 5), // Maximum 5 labels
        emailId: email.subject,
        processedAt: new Date().toISOString()
    };
}

async function sendToAPI(emailData) {
    try {
        // Get settings from storage
        const settings = await chrome.storage.sync.get(['backendUrl']);

        // Auto-send is ALWAYS enabled (no checkbox needed)
        console.log('Auto-send: Processing email data...');

        // If backend URL is configured, try to send to API
        if (settings.backendUrl) {
            try {
                console.log('Sending to backend:', settings.backendUrl);
                const response = await fetch(settings.backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Email data sent to API successfully:', result);
                    return { success: true, data: result };
                } else {
                    console.error('API error:', response.status, response.statusText);
                    // Fall back to dummy data on API error
                    console.log('Using dummy label suggestions due to API error');
                    const dummyData = generateDummyLabelSuggestions(emailData);
                    return { success: true, data: dummyData, isDummy: true };
                }
            } catch (fetchError) {
                console.error('Network error, using dummy data:', fetchError);
                // Use dummy data when backend is not available
                const dummyData = generateDummyLabelSuggestions(emailData);
                return { success: true, data: dummyData, isDummy: true };
            }
        } else {
            // No backend URL configured - use dummy data
            console.log('No backend URL configured, using dummy label suggestions');
            const dummyData = generateDummyLabelSuggestions(emailData);
            return { success: true, data: dummyData, isDummy: true };
        }
    } catch (error) {
        console.error('Error in sendToAPI:', error);
        // Always try to return dummy data on any error
        const dummyData = generateDummyLabelSuggestions(emailData);
        return { success: true, data: dummyData, isDummy: true };
    }
}