/**
 * Deduplicates items by their _id field using O(n) time complexity
 * @param items Array of items to deduplicate
 * @returns Array of unique items
 */
export function deduplicateItemsById(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item._id.toString();
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}
