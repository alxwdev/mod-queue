/** Returns the current time. Tests pass a fixed clock, so time rules never depend on the wall clock. */
export type Clock = () => Date;

/** The real clock. */
export const systemClock: Clock = () => new Date();
