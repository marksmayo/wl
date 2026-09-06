// Longest run of consecutive calendar days found anywhere in a list of
// YYYY-MM-DD date keys. Badges are awarded on the longest streak ever
// reached, not just a streak ending "today" — once earned, a badge stays
// earned even if the streak is later broken.
export function longestStreak(dateKeys: string[]): number {
  const unique = Array.from(new Set(dateKeys)).sort();
  if (unique.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i++) {
    const prevMs = new Date(`${unique[i - 1]}T00:00:00.000Z`).getTime();
    const curMs = new Date(`${unique[i]}T00:00:00.000Z`).getTime();
    const diffDays = Math.round((curMs - prevMs) / 86_400_000);
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}
