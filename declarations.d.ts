// Global type declarations for better TypeScript compatibility

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  namespace NodeJS {
    interface Timeout {}
  }
}

// NOTE: The declaration below was injected by `"framer"`
// see https://www.framer.com/docs/guides/handshake for more information.
declare module "https://framer.com/m/*";

export {};
