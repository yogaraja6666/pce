// Personal Google Drive & Google Sheets Integration
// 100% Client-Side: Zero data stored on our servers.
// Directly creates and updates a native Google Sheet in the user's personal Google Drive.

export const SHEET_NAME = 'PCE_Credentials_Vault (Google Sheet)';

/**
 * Converts vault items to CSV format suitable for Google Sheets import
 */
export function itemsToCsv(items) {
  const headers = ['Provider', 'User ID', 'Password', '2FA Backup Codes', 'Created Date', 'Last Changed Date', 'Rotation Days', 'Notes'];
  const rows = items.map(i => [
    `"${(i.providerName || '').replace(/"/g, '""')}"`,
    `"${(i.username || '').replace(/"/g, '""')}"`,
    `"${(i.password || '').replace(/"/g, '""')}"`,
    `"${(i.backupCodes || '').replace(/\n/g, ' | ').replace(/"/g, '""')}"`,
    `"${new Date(i.createdDate || Date.now()).toLocaleDateString()}"`,
    `"${new Date(i.lastChangedDate || Date.now()).toLocaleDateString()}"`,
    i.rotationDays || 60,
    `"${(i.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Parses CSV rows back to vault items
 */
export function csvToItems(csvText) {
  if (!csvText) return [];
  const lines = csvText.split('\n').filter(Boolean);
  if (lines.length <= 1) return [];

  const items = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex CSV splitter handling quotes
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const clean = cols.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

    if (clean[1]) {
      items.push({
        id: 'acc_' + Date.now() + '_' + i,
        providerName: clean[0] || 'Account',
        username: clean[1] || '',
        password: clean[2] || '',
        backupCodes: (clean[3] || '').replace(/ \| /g, '\n'),
        createdDate: clean[4] ? new Date(clean[4]).toISOString() : new Date().toISOString(),
        lastChangedDate: clean[5] ? new Date(clean[5]).toISOString() : new Date().toISOString(),
        rotationDays: parseInt(clean[6], 10) || 60,
        notes: clean[7] || ''
      });
    }
  }
  return items;
}

/**
 * Initializes Google OAuth 2.0 token client to request Google Drive File scope
 */
export function requestGoogleDriveToken({ clientId, onTokenReceived, onError }) {
  if (!window.google?.accounts?.oauth2) {
    if (onError) onError(new Error('Google Identity Services SDK not loaded'));
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          if (onError) onError(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        if (onTokenReceived) onTokenReceived(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (err) {
    if (onError) onError(err);
  }
}

/**
 * Finds or creates a real Google Sheet in the user's Google Drive
 */
export async function syncVaultToGoogleDriveSheet(accessToken, items) {
  const csvData = itemsToCsv(items);

  // 1. Check if the spreadsheet already exists in the user's Drive
  const query = `name='${SHEET_NAME}' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name, webViewLink)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || 'Google Drive API error. Ensure Google Drive API is enabled in your Google Cloud project.');
  }

  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    const existingFile = searchData.files[0];
    const fileId = existingFile.id;

    // 2. Update existing file content with CSV
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/csv',
      },
      body: csvData,
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update Google Sheet');
    }

    return {
      fileId,
      name: SHEET_NAME,
      link: existingFile.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      updated: true
    };
  } else {
    // 3. Create a brand new Native Google Sheet by converting CSV to application/vnd.google-apps.spreadsheet
    const metadata = {
      name: SHEET_NAME,
      mimeType: 'application/vnd.google-apps.spreadsheet',
      description: 'Encrypted Credential & 2FA Vault generated by PCE Intelligence',
    };

    const boundary = '-------pce_drive_upload_boundary_314159';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
      csvData +
      closeDelim;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Sheet in your Drive');
    }

    const createdData = await createRes.json();
    return {
      fileId: createdData.id,
      name: createdData.name,
      link: createdData.webViewLink || `https://docs.google.com/spreadsheets/d/${createdData.id}/edit`,
      created: true
    };
  }
}
