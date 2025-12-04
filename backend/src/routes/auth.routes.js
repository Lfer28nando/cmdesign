import { Router } from "express";
import {login, logout, profile, register, editUser, changePassword, requestPasswordReset, resetPassword, requestEmailVerification, verifyEmail, setup2FA, verifyAndEnable2FA, disable2FA, verify2FA, requestEmailChange, confirmEmailChange, unsubscribe} from '../controllers/auth.controller.js'
import { authRequired, guestOnly, authRequiredFor2FA } from "../middlewares/validateToken.middleware.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { registerSchema, loginSchema, editUserSchema, changePasswordSchema, requestPasswordResetSchema, resetPasswordSchema, requestEmailVerificationSchema, setup2FASchema, verifyAndEnable2FASchema, disable2FASchema, verify2FASchema, requestEmailChangeSchema, confirmEmailChangeSchema } from "../schemas/auth.schema.js";


const router = Router()

// Registro - máximo 3 por hora
router.post('/register', guestOnly,  validateSchema(registerSchema), register);

// Login - máximo 5 intentos por 15 min + slow down
router.post('/login', guestOnly, validateSchema(loginSchema), login);

// Logout - sin límite estricto
router.get('/logout', logout);

// Perfil - límite moderado
router.get('/profile', authRequired, profile);
router.put('/edit', authRequired, validateSchema(editUserSchema), editUser);

// Cambio de contraseña - límite estricto
router.put('/changePassword', authRequired, validateSchema(changePasswordSchema), changePassword);

// Reset de contraseña - muy estricto (3 por 15 min)
router.post('/requestPasswordReset', validateSchema(requestPasswordResetSchema), requestPasswordReset);
router.post('/resetPassword', validateSchema(resetPasswordSchema), resetPassword);
// Verificación de email - estricto (3 por 5 min)
router.post('/requestEmailVerification', authRequired, validateSchema(requestEmailVerificationSchema), requestEmailVerification);
router.post('/verifyEmail', verifyEmail);

// Two-Factor Authentication
router.post('/setup2FA', authRequired, validateSchema(setup2FASchema), setup2FA);
router.post('/verify2FA', authRequired, validateSchema(verifyAndEnable2FASchema), verifyAndEnable2FA);
router.post('/disable2FA', authRequired, validateSchema(disable2FASchema), disable2FA);
router.post('/verify2FACode', authRequiredFor2FA, validateSchema(verify2FASchema), verify2FA);

// Cambio de email
router.post('/requestEmailChange', authRequired, validateSchema(requestEmailChangeSchema), requestEmailChange);
router.post('/confirmEmailChange', authRequired, validateSchema(confirmEmailChangeSchema), confirmEmailChange);

// Eliminar cuenta
router.post('/unsubscribe', authRequired, unsubscribe);

export default router;