/** Display name from a From header: "UW CIRCLE <uwcircle@uw.edu>" -> "UW CIRCLE". */
export const senderName = (from: string): string => from.split('<')[0].trim() || from

/** Address from a From header, lower-cased. This is what sender rules match on. */
export const senderAddr = (from: string): string =>
  (from.match(/<(.+)>/)?.[1] ?? from).toLowerCase()
