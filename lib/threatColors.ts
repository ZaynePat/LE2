// Color coding for different threat types

export function getThreatColor(threat: string | null): string {
  if (!threat) return "bg-gray-100 text-gray-700";
  
  const threatLower = threat.toLowerCase();
  
  if (threatLower.includes("malware")) {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (threatLower.includes("phishing")) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (threatLower.includes("exploit")) {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }
  if (threatLower.includes("ransomware")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  if (threatLower.includes("trojan")) {
    return "bg-pink-100 text-pink-700 border-pink-200";
  }
  if (threatLower.includes("botnet")) {
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  }
  if (threatLower.includes("spam")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
  
  // Default for unknown threats
  return "bg-blue-100 text-blue-700 border-blue-200";
}

export function getThreatLabel(threat: string | null): string {
  return threat || "unknown";
}
