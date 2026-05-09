// Veřejné API auth feature.
// Vnitřní soubory by se neměly importovat přímo z jiných features —
// jen přes tento barrel.

export { useLogin, useRegister, useLogout, useAuthBootstrap, useCurrentUserHydration } from './api/useAuth';
export { useCheckUsername, useCheckEmail } from './api/useAvailability';

export { LoginModal } from './components/LoginModal';
export { RegisterModal } from './components/RegisterModal';
export { AuthBootstrap } from './components/AuthBootstrap';

// loginIntent přesunut do shared/lib (cross-feature utility — používá ho i shared/api/client)
export { loginSchema, type LoginFormValues } from './lib/loginSchema';
export { registerSchema, type RegisterFormValues } from './lib/registerSchema';
