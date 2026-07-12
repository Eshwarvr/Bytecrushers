import type { Asset, MaintenanceRequest, AuditItem } from './types';

// Gemini API integration for AI Intelligence Layer
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Calculate rule-based risk score first
export function calculateMaintenanceRiskScore(asset: Asset, maintenanceHistory: MaintenanceRequest[]): number {
  const ageYears = Math.max(0, (new Date().getTime() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
  const recentMaintenanceCount = maintenanceHistory.filter(m => {
    const mDate = new Date(m.createdAt);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return mDate >= sixMonthsAgo;
  }).length;
  
  // Category risk factors
  let categoryRisk = 5;
  if (asset.categoryName === 'Vehicles') categoryRisk = 15;
  if (asset.categoryName === 'Laptops') categoryRisk = 8;

  const score = Math.floor((ageYears * 15) + (recentMaintenanceCount * 20) + categoryRisk);
  return Math.min(100, Math.max(0, score));
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).then(result => {
    clearTimeout(timeoutHandle);
    return result;
  });
};

export async function getMaintenanceRiskExplanation(asset: Asset, riskScore: number): Promise<string> {
  const fallbackString = `Based on age and maintenance history, this asset has a risk score of ${riskScore}/100. Routine inspection recommended.`;
  
  if (!GEMINI_API_KEY) {
    return fallbackString;
  }

  const prompt = `You are an AI assistant for an Enterprise Asset Management system. 
Analyze the maintenance risk for this asset. Keep the explanation to 1-2 concise, professional sentences.
Asset: ${asset.name} (${asset.categoryName})
Age: ${Math.round((new Date().getTime() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
Condition: ${asset.condition}
Calculated Risk Score: ${riskScore}/100`;

  try {
    const apiCall = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 100, temperature: 0.3 }
      })
    }).then(res => res.json()).then(data => {
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.replace(/\n/g, ' ').trim();
      }
      return fallbackString;
    });

    return await withTimeout(apiCall, 3000, fallbackString);
  } catch (err) {
    console.error("Gemini API error:", err);
    return fallbackString;
  }
}

export async function getDiscrepancySummary(auditItems: AuditItem[]): Promise<string> {
  const missingCount = auditItems.filter(i => i.verificationStatus === 'Missing').length;
  const damagedCount = auditItems.filter(i => i.verificationStatus === 'Damaged').length;
  
  const fallbackString = `Audit completed with ${missingCount} missing item(s) and ${damagedCount} damaged item(s). Please review the discrepancy report for details.`;
  
  if (auditItems.length === 0) return "No discrepancies found in this audit.";
  if (!GEMINI_API_KEY) return fallbackString;

  const prompt = `You are an AI assistant for an Enterprise Asset Management system.
Write a short, manager-readable paragraph summarizing these audit discrepancies. Focus on the total counts and notable items. Do not use markdown, just plain text.
Discrepancies:
${auditItems.map(i => `- ${i.assetName}: ${i.verificationStatus} (${i.notes})`).join('\n')}`;

  try {
    const apiCall = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.3 }
      })
    }).then(res => res.json()).then(data => {
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text.replace(/\n/g, ' ').trim();
      }
      return fallbackString;
    });

    return await withTimeout(apiCall, 3000, fallbackString);
  } catch (err) {
    console.error("Gemini API error:", err);
    return fallbackString;
  }
}
