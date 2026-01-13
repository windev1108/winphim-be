// src/config/cors.config.ts
export const getAllowedOrigins = (): string[] => {
    const originsEnv = process.env.CORS_ORIGIN;

    if (!originsEnv) {
        console.warn('⚠️ CORS_ORIGIN not set, defaulting to localhost only');
        return ['http://localhost:3000'];
    }

    try {
        // Thử parse JSON array trước
        if (originsEnv.trim().startsWith('[')) {
            return JSON.parse(originsEnv);
        }

        // Nếu không phải JSON, split by comma
        return originsEnv.split(',').map(origin => origin.trim()).filter(Boolean);
    } catch (error) {
        console.error('❌ Failed to parse CORS_ORIGIN:', error);
        return ['http://localhost:3000'];
    }
};

export const isOriginAllowed = (origin: string): boolean => {
    const allowedOrigins = getAllowedOrigins();

    // Log để debug (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Checking origin:', origin);
        console.log('✅ Allowed origins:', allowedOrigins);
    }

    return allowedOrigins.includes(origin);
};