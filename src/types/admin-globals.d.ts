export {};

declare global {
  interface Window {
    siglock: {
      services: {
        test: (message: string) => void;
      }
    };
  }
}