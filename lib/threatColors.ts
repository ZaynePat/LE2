// Color coding for different threat types

export function getThreatColor(threat: string | null): string {
  if (!threat) return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  
  const threatLower = threat.toLowerCase();
  
  if (threatLower.includes("malware")) {
    return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
  }
  if (threatLower.includes("phishing")) {
    return "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  }
  if (threatLower.includes("exploit")) {
    return "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  }
  if (threatLower.includes("ransomware")) {
    return "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  }
  if (threatLower.includes("trojan")) {
    return "bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800";
  }
  if (threatLower.includes("botnet")) {
    return "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  }
  if (threatLower.includes("spam")) {
    return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
  }
  
  // Default for unknown threats
  return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
}

export function getThreatLabel(threat: string | null): string {
  return threat || "unknown";
}
