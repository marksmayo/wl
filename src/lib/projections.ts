// Explanations for the three "if this pace holds" projection models —
// shared between server code (leaderboard.ts) and client components
// (RankingsList, the dashboard's projection chart) that display them, so it
// can't import "server-only" itself.
export const PROJECTION_MODELS = [
  {
    key: "straightLine" as const,
    label: "Straight line",
    description: "Your average daily rate from your very first weigh-in, held constant to the end.",
  },
  {
    key: "lastWeek" as const,
    label: "Last 7 days",
    description: "Your average daily rate over just the last week, extrapolated to the end.",
  },
  {
    key: "lastMonth" as const,
    label: "Last 30 days",
    description: "Your average daily rate over the last month, extrapolated to the end.",
  },
];
