export {};

declare global {
  interface Window {
    go?: {
      main?: {
        App?: unknown;
      };
    };
    runtime?: {
      EventsOn?: unknown;
      EventsOff?: unknown;
    };
  }
}
