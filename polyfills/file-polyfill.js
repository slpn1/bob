// File polyfill for server-side environments
class FilePolyfill {
  constructor(bits, name, options = {}) {
    this.name = name || '';
    this.type = options.type || '';
    this.size = 0;
    this.lastModified = Date.now();
    
    // For compatibility, store the bits if provided
    if (bits) {
      if (Array.isArray(bits)) {
        this.size = bits.reduce((total, chunk) => {
          if (typeof chunk === 'string') return total + chunk.length;
          if (chunk && chunk.byteLength) return total + chunk.byteLength;
          return total;
        }, 0);
      }
    }
  }
  
  // Add basic methods that might be expected
  text() {
    return Promise.resolve('');
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  stream() {
    return new Response().body;
  }
  
  slice() {
    return new FilePolyfill([], this.name, { type: this.type });
  }
}

// Export both as default and named export for maximum compatibility
module.exports = FilePolyfill;
module.exports.default = FilePolyfill;