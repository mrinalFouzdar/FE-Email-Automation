# Email Reader & Chunker Browser Extension

A powerful browser extension that extracts email information from popular webmail services (Gmail, Outlook, Yahoo Mail) and provides the data in manageable chunks for use in frontend or backend applications.

## Features

- 📧 **Multi-Platform Support**: Works with Gmail, Outlook, and Yahoo Mail
- 📦 **Text Chunking**: Automatically splits email content into configurable chunks
- 💾 **Multiple Export Options**: Download JSON, copy to clipboard, or send to backend
- 🎯 **Rich Metadata**: Extracts subject, sender, recipients, date, attachments, and more
- ⚡ **Efficient Processing**: Handles both single emails and batch extraction
- 🔒 **Privacy-Focused**: All processing happens locally in your browser

## Installation

### Chrome/Edge

1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `email-reader-extension` folder
6. The extension icon will appear in your browser toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the extension folder and select `manifest.json`

## Usage

### Basic Usage

1. Open your email service (Gmail, Outlook, or Yahoo Mail)
2. Navigate to an email or keep the inbox open
3. Click the extension icon in your browser toolbar
4. Click "Extract Email Data"
5. The extension will extract and chunk the email data

### Configuring Chunk Size

- Adjust the "Chunk Size" field (default: 1000 characters)
- Larger chunks = fewer chunks, smaller chunks = more precise processing
- Recommended: 500-2000 characters depending on your use case

### Export Options

#### 1. Download JSON
- Exports all extracted data as a JSON file
- File format: `emails_[timestamp].json`

#### 2. Copy to Clipboard
- Copies the JSON data to your clipboard
- Perfect for quick testing or manual processing

#### 3. Send to Backend
- Configure your backend URL in the "Backend URL" field
- Click "Send to Backend" to POST the data
- Default endpoint structure expected: `POST /api/emails`

## Data Structure

### Output Format

```json
{
  "emails": [
    {
      "subject": "Email Subject",
      "from": "sender@example.com",
      "fromName": "Sender Name",
      "to": ["recipient@example.com"],
      "cc": [],
      "date": "2024-01-01T12:00:00.000Z",
      "bodyLength": 5000,
      "chunks": [
        {
          "index": 0,
          "text": "First chunk of email content...",
          "length": 1000
        },
        {
          "index": 1,
          "text": "Second chunk of email content...",
          "length": 1000
        }
      ],
      "totalChunks": 5,
      "hasAttachments": true,
      "attachments": [
        { "name": "document.pdf" }
      ],
      "labels": ["Important", "Work"],
      "isRead": true,
      "isStarred": false,
      "extractedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "totalEmails": 1,
  "totalChunks": 5,
  "extractedAt": "2024-01-01T12:00:00.000Z",
  "chunkSize": 1000
}
```

## Backend Integration

### Node.js/Express Example

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/emails', (req, res) => {
  const emailData = req.body;
  
  console.log(`Received ${emailData.totalEmails} emails with ${emailData.totalChunks} chunks`);
  
  // Process the chunks
  emailData.emails.forEach(email => {
    console.log(`Processing: ${email.subject}`);
    email.chunks.forEach(chunk => {
      // Process each chunk
      processChunk(chunk.text);
    });
  });
  
  res.json({ success: true, message: 'Emails processed' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Python/Flask Example

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/emails', methods=['POST'])
def receive_emails():
    email_data = request.get_json()
    
    print(f"Received {email_data['totalEmails']} emails with {email_data['totalChunks']} chunks")
    
    for email in email_data['emails']:
        print(f"Processing: {email['subject']}")
        for chunk in email['chunks']:
            # Process each chunk
            process_chunk(chunk['text'])
    
    return jsonify({'success': True, 'message': 'Emails processed'})

if __name__ == '__main__':
    app.run(port=3000)
```

## Frontend Integration

### React Example

```javascript
import React, { useState } from 'react';

function EmailProcessor() {
  const [emailData, setEmailData] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const text = await file.text();
    const data = JSON.parse(text);
    setEmailData(data);
  };

  return (
    <div>
      <input type="file" accept=".json" onChange={handleFileUpload} />
      
      {emailData && (
        <div>
          <h2>Email Data Loaded</h2>
          <p>Total Emails: {emailData.totalEmails}</p>
          <p>Total Chunks: {emailData.totalChunks}</p>
          
          {emailData.emails.map((email, index) => (
            <div key={index}>
              <h3>{email.subject}</h3>
              <p>From: {email.from}</p>
              <p>Chunks: {email.totalChunks}</p>
              
              {email.chunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex}>
                  <p>Chunk {chunk.index + 1}: {chunk.text.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Use Cases

1. **AI/LLM Processing**: Feed email chunks to language models for analysis
2. **Email Analytics**: Analyze email content, sentiment, and patterns
3. **Data Migration**: Export emails for migration to other platforms
4. **Search Indexing**: Index email content for full-text search
5. **Email Automation**: Process emails for automated workflows
6. **Training Data**: Collect email data for machine learning models

## Troubleshooting

### Extension Not Working
- Ensure you're on a supported email platform (Gmail, Outlook, Yahoo Mail)
- Refresh the page after installing the extension
- Check browser console for error messages

### No Emails Extracted
- Make sure emails are visible on the page
- Try opening a single email first
- Check that the email platform has fully loaded

### Backend Connection Failed
- Verify the backend URL is correct
- Ensure CORS is enabled on your backend
- Check that your backend server is running

## Privacy & Security

- All data processing happens locally in your browser
- No data is sent to third parties
- Extension only accesses email data when you explicitly trigger extraction
- Review the code - it's open source!

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Firefox 85+ (with manifest v2 compatibility)
- ✅ Brave 88+
- ✅ Opera 74+

## Development

### Project Structure

```
email-reader-extension/
├── manifest.json           # Extension configuration
├── background.js          # Background service worker
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── utils.js              # Utility functions
├── content-scripts/
│   ├── gmail.js         # Gmail content script
│   ├── outlook.js       # Outlook content script
│   └── yahoo.js         # Yahoo Mail content script
└── icons/               # Extension icons
```

### Adding New Email Platforms

1. Create a new content script in `content-scripts/`
2. Implement the extraction logic following the existing patterns
3. Add the match pattern and script to `manifest.json`
4. Test thoroughly with the target platform

## License

MIT License - Feel free to use and modify for your needs

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

If you encounter any issues or have questions, please open an issue on the repository.