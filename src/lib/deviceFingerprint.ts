// Device fingerprinting using canvas, WebGL, and browser properties
// No external API required - all client-side

interface FingerprintData {
  fingerprint: string;
  components: {
    canvas: string;
    webgl: string;
    audio: string;
    screen: string;
    timezone: string;
    language: string;
    platform: string;
    plugins: string;
    fonts: string;
  };
}

// Simple hash function
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

// WebGL fingerprint
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    
    if (debugInfo) {
      const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }
    
    return webgl.getParameter(webgl.VERSION) || 'webgl-unknown';
  } catch {
    return 'webgl-error';
  }
}

// Audio fingerprint (simplified)
function getAudioFingerprint(): string {
  try {
    const audioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContext) return 'no-audio';
    
    const context = new audioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    
    gain.gain.value = 0;
    oscillator.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);
    
    oscillator.start(0);
    
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);
    
    oscillator.stop();
    context.close();
    
    return data.slice(0, 10).join(',');
  } catch {
    return 'audio-error';
  }
}

// Screen fingerprint
function getScreenFingerprint(): string {
  return `${screen.width}x${screen.height}x${screen.colorDepth}x${screen.pixelDepth}x${window.devicePixelRatio}`;
}

// Get installed plugins
function getPluginsFingerprint(): string {
  const plugins = Array.from(navigator.plugins || []);
  return plugins.map(p => p.name).join(',');
}

// Font detection (simplified)
function getFontsFingerprint(): string {
  const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Impact'];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'no-fonts';
  
  const detected: string[] = [];
  const baseFont = 'monospace';
  const testString = 'mmmmmmmmmmlli';
  
  ctx.font = `72px ${baseFont}`;
  const baseWidth = ctx.measureText(testString).width;
  
  for (const font of testFonts) {
    ctx.font = `72px '${font}', ${baseFont}`;
    const width = ctx.measureText(testString).width;
    if (width !== baseWidth) {
      detected.push(font);
    }
  }
  
  return detected.join(',');
}

export async function generateDeviceFingerprint(): Promise<FingerprintData> {
  const components = {
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    audio: getAudioFingerprint(),
    screen: getScreenFingerprint(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    plugins: getPluginsFingerprint(),
    fonts: getFontsFingerprint(),
  };
  
  const combinedString = Object.values(components).join('|||');
  const fingerprint = await hashString(combinedString);
  
  return {
    fingerprint,
    components,
  };
}

export async function getShortFingerprint(): Promise<string> {
  const { fingerprint } = await generateDeviceFingerprint();
  return fingerprint.substring(0, 16);
}
