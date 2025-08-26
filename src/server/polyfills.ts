// Server-side polyfills for browser APIs
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File {
    name: string;
    type: string;
    size: number;
    lastModified: number;

    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      this.name = name;
      this.type = options?.type || '';
      this.size = 0;
      this.lastModified = Date.now();
      
      // Calculate approximate size
      if (bits) {
        this.size = bits.reduce((total: number, chunk: any) => {
          if (typeof chunk === 'string') return total + new TextEncoder().encode(chunk).length;
          if (chunk && typeof chunk.byteLength === 'number') return total + chunk.byteLength;
          return total;
        }, 0);
      }
    }
    
    text(): Promise<string> {
      return Promise.resolve('');
    }
    
    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(new ArrayBuffer(0));
    }
    
    slice(): File {
      return new File([], this.name, { type: this.type });
    }
  } as any;
}