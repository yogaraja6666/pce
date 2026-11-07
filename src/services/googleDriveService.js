// Personal Google Drive & Google Sheets Integration
// 100% Client-Side: Zero data stored on our servers.
// Data is stored directly in the user's personal Google Drive file or Google Sheet.

const VAULT_FILE_NAME = 'PCE_Secure_Vault.json';

/**
 * Initializes or fetches existing Google OAuth token using Google Identity Services (GIS)
 */
export function initGoogleTokenClient({ clientId, onTokenReceived, onError }) {
  if (typeof window === 'undefined' || !window.google || !window.google.accounts) {
    if (onError) onError(new Error('Google Identity Services SDK not loaded'));
    return null;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (tokenResponse) => {
        if (tokenResponse.error !== undefined) {
          if (onError) onError(tokenResponse);
          return;
        }
        if (onTokenReceived) onTokenReceived(tokenResponse.access_token);
      },
    });

    return tokenClient;
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}

/**
 * Fetches Google User Profile information using the access token
 */
export async function getGoogleUserProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

/**
 * Finds or loads the vault file from the user's personal Google Drive
 */
export async function loadVaultFromGoogleDrive(accessToken) {
  // 1. Search for existing file
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${VAULT_FILE_NAME}' and trashed=false&fields=files(id, name, modifiedTime)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!searchRes.ok) throw new Error('Could not access Google Drive');
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    const fileId = searchData.files[0].id;
    // 2. Fetch file content
    const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!contentRes.ok) throw new Error('Failed to read vault file from Google Drive');
    const items = await contentRes.json();
    return { fileId, items: Array.isArray(items) ? items : [] };
  }

  // File doesn't exist yet: create an initial empty file
  const initialData = [];
  const createRes = await saveVaultToGoogleDrive(accessToken, null, initialData);
  return { fileId: createRes.fileId, items: initialData };
}

/**
 * Saves or updates the vault file directly in the user's Google Drive
 */
export async function saveVaultToGoogleDrive(accessToken, fileId, items) {
  const fileContent = JSON.stringify(items, null, 2);

  if (fileId) {
    // Update existing file (PATCH)
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });
    if (!updateRes.ok) throw new Error('Failed to update Google Drive file');
    return { fileId, success: true };
  } else {
    // Create new file (POST multipart)
    const metadata = {
      name: VAULT_FILE_NAME,
      mimeType: 'application/json',
      description: 'Encrypted Credential Vault created by PCE Intelligence',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelim;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!createRes.ok) throw new Error('Failed to create vault file on Google Drive');
    const data = await createRes.json();
    return { fileId: data.id, success: true };
  }
}

/**
 * Optional Google Sheets Webhook Sync (for users who prefer direct Google Sheet row sync)
 */
export async function syncWithGoogleSheetWebhook(webhookUrl, items) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'save', items }),
  });
  return res.json();
}
