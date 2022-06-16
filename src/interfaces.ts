export interface AdapterOptions {
  redisOptions: { url: string };
  inChannel: string;
  outChannel: string;
  processMessage: (message: string | Buffer) => string | Buffer | Promise<string | Buffer>;
  handleError: (error: Error) => void;
  isBufferMode?: boolean;
}