export {};
declare global {
  interface Window {
    sigloConfig: {
      services: {
        test: (message: string) => void;
      }
    };
  }
}