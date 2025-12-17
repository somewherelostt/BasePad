/**
 * Format ETH values to a readable format
 * e.g., "0.001000000 ETH" -> "0.001 ETH"
 */
export function formatEth(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0 ETH";
  
  // Remove trailing zeros and unnecessary decimals
  const formatted = numValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
  
  return `${formatted} ETH`;
}

/**
 * Truncate long numbers for display
 * e.g., "0.001000000000000000" -> "0.001"
 */
export function truncateNumber(value: string | number, decimals: number = 6): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0";
  
  return numValue.toFixed(decimals).replace(/\.?0+$/, "");
}
