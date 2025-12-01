import { isAppError, convertToAppError, createError } from '../utils/customError.js';

// Este middleware es como el "guardia de seguridad" de la app
// Captura TODOS los errores que ocurren y los convierte en respuestas JSON bonitas
// Tiene que ir AL FINAL de todos los middlewares en app.js
export const errorHandler = (err, req, res, next) => {
    try {
        // Convertir cualquier error raro a AppError (mi formato)
        let error = convertToAppError(err);

        // Registrar el error (uso una función dedicada para poder adaptar logs fácilmente)
        logError(error, req);

        // Si por alguna razón el error no es operativo, genero un error genérico para no filtrar detalles
        if (!error || error.isOperational === false) {
            // Guardar info original para los desarrolladores
            const original = {
                message: (err && err.message) || 'Unknown error',
                stack: (err && err.stack) || undefined
            };
            // Reemplazo por un AppError seguro
            error = createError('SRV_INTERNAL_ERROR', { originalError: original.message, stack: original.stack });
        }

        // Construir la respuesta estándar
        const response = {
            success: false,
            error: {
                code: error.code || 'SRV_999',
                message: error.userMessage || 'Error interno del servidor',
                timestamp: error.timestamp || new Date().toISOString()
            }
        };

        // En desarrollo añado información para debugging
        if (process.env.NODE_ENV === 'development') {
            response.devInfo = {
                devMessage: error.devMessage || (err && err.message),
                stack: error.stack || (err && err.stack),
                additionalInfo: error.additionalInfo || {},
                originalUrl: req.originalUrl,
                method: req.method
            };
        }

        // Enviar la respuesta con el código HTTP correcto
        return res.status(error.httpStatus || 500).json(response);
    } catch (handlerError) {
        // Si el manejador de errores falla por alguna razón, aseguramos no romper la app
        console.error('Fallo en errorHandler:', handlerError);
        try {
            // Intento enviar una respuesta mínima
            return res.status(500).json({
                success: false,
                error: {
                    code: 'SRV_999',
                    message: 'Error interno del servidor',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (finalErr) {
            // Si ni siquiera puedo enviar la respuesta, finalizo sin tirar stack al cliente
            console.error('Fallo crítico al enviar respuesta de error:', finalErr);
            return;
        }
    }
};

// Middleware para capturar rutas que no existen (404)
// Este va ANTES del errorHandler en app.js
export const notFoundHandler = (req, res, next) => {
    next(createError('API_ENDPOINT_NOT_FOUND', {
        message: 'Recurso no encontrado',
        originalUrl: req.originalUrl,
        method: req.method
    }));
};

// Middleware para capturar errores asíncronos que se me olvide manejar
// Wrapper para funciones async que previene que la app se crashee
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Función para logs más organizados en producción
// En desarrollo uso console.error, en producción podría usar Winston o similar
const logError = (error, req) => {
    const logData = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        code: error.code || 'UNKNOWN',
        message: error.userMessage || error.message,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };

    // En producción aquí podría enviar a un servicio de logging
    if (process.env.NODE_ENV === 'production') {
        // TODO: Integrar con Winston, Sentry, CloudWatch, etc.
        console.error(JSON.stringify(logData));
    } else {
        console.error('🐛 Error de desarrollo:', logData);
    }
};
