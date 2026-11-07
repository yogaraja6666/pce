// 100% Free Cyber Safety Breach Services (Client-side, No Server Needed)

/**
 * Checks if an email address is exposed in known data breaches using XposedOrNot free API.
 * @param {string} email
 * @returns {Promise<{found: boolean, count: number, riskScore: number, riskLabel: string, breaches: Array, exposedDataTypes: Array, passwordsSummary: object}>}
 */
export async function checkEmailBreach(email) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Please enter a valid email address');
  }

  try {
    const res = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(trimmed)}`);
    
    if (res.status === 404) {
      return {
        found: false,
        count: 0,
        riskScore: 0,
        riskLabel: 'Safe',
        breaches: [],
        exposedDataTypes: [],
        passwordsSummary: { PlainText: 0, EasyToCrack: 0, StrongHash: 0 }
      };
    }

    const data = await res.json();

    if (data.Error === 'Not found' || !data.BreachesSummary) {
      // Clean email
      return {
        found: false,
        count: 0,
        riskScore: 0,
        riskLabel: 'Safe',
        breaches: [],
        exposedDataTypes: [],
        passwordsSummary: { PlainText: 0, EasyToCrack: 0, StrongHash: 0 }
      };
    }

    const metrics = data.BreachMetrics || {};
    const risk = (metrics.risk && metrics.risk[0]) || { risk_score: 0, risk_label: 'Low' };
    const breachesDetails = (data.ExposedBreaches && data.ExposedBreaches.breaches_details) || [];
    
    // Extract exposed categories
    const categories = new Set();
    if (metrics.xposed_data && metrics.xposed_data[0]?.children) {
      metrics.xposed_data[0].children.forEach(group => {
        if (group.children) {
          group.children.forEach(child => {
            const cleanName = child.name.replace(/^data_/, '');
            categories.add(cleanName);
          });
        }
      });
    }

    const passwordsSummary = (metrics.passwords_strength && metrics.passwords_strength[0]) || {
      PlainText: 0,
      EasyToCrack: 0,
      StrongHash: 0
    };

    return {
      found: true,
      count: breachesDetails.length || (data.BreachesSummary.site ? data.BreachesSummary.site.split(';').length : 1),
      riskScore: risk.risk_score || 70,
      riskLabel: risk.risk_label || 'High Risk',
      breaches: breachesDetails.map(b => ({
        name: b.breach,
        domain: b.domain,
        year: b.xposed_date || 'Unknown',
        records: b.xposed_records,
        details: b.details,
        exposedData: b.xposed_data ? b.xposed_data.split(';') : ['Credentials'],
        passwordRisk: b.password_risk || 'unknown',
        logo: b.logo
      })),
      exposedDataTypes: Array.from(categories),
      passwordsSummary
    };

  } catch (err) {
    // Fallback to simpler endpoint if breach-analytics has an issue
    try {
      const fallbackRes = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(trimmed)}`);
      const fallbackData = await fallbackRes.json();
      if (fallbackData.Error === 'Not found' || !fallbackData.breaches) {
        return {
          found: false,
          count: 0,
          riskScore: 0,
          riskLabel: 'Safe',
          breaches: [],
          exposedDataTypes: [],
          passwordsSummary: { PlainText: 0, EasyToCrack: 0, StrongHash: 0 }
        };
      }

      const flatBreaches = fallbackData.breaches[0] || [];
      return {
        found: true,
        count: flatBreaches.length,
        riskScore: flatBreaches.length > 5 ? 85 : 50,
        riskLabel: flatBreaches.length > 5 ? 'High Risk' : 'Medium Risk',
        breaches: flatBreaches.map(name => ({
          name,
          year: 'Known Breach',
          details: `Account records exposed in the ${name} public data breach.`,
          exposedData: ['Email / Credentials']
        })),
        exposedDataTypes: ['Email addresses', 'Passwords'],
        passwordsSummary: { PlainText: 0, EasyToCrack: flatBreaches.length, StrongHash: 0 }
      };
    } catch {
      throw new Error('Unable to connect to free breach database. Please check your internet connection.');
    }
  }
}

/**
 * Checks if a password has been breached using HaveIBeenPwned k-Anonymity SHA-1 API.
 * The password NEVER leaves the user's browser!
 * @param {string} password
 * @returns {Promise<{leaked: boolean, count: number, hashPrefix: string}>}
 */
export async function checkPasswordLeak(password) {
  if (!password) {
    throw new Error('Please enter a password to test');
  }

  // 1. Compute SHA-1 hash client-side
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  // 2. Extract first 5 characters (k-Anonymity prefix) and remaining 35 characters
  const prefix = hashHex.substring(0, 5);
  const suffix = hashHex.substring(5);

  // 3. Query HIBP range API (100% Free & Open)
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!res.ok) {
    throw new Error('Failed to query password breach database');
  }

  const text = await res.text();
  const lines = text.split('\n');

  for (const line of lines) {
    const [lineSuffix, countStr] = line.trim().split(':');
    if (lineSuffix && lineSuffix.toUpperCase() === suffix) {
      return {
        leaked: true,
        count: parseInt(countStr, 10),
        hashPrefix: prefix
      };
    }
  }

  return {
    leaked: false,
    count: 0,
    hashPrefix: prefix
  };
}
