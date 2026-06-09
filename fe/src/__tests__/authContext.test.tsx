// // fe/src/__tests__/authContext.test.ts
// // Tests for AuthProvider and useAuth hook using Vitest and React Testing Library

// import { render, screen, waitFor } from '@testing-library/react';
// import { describe, it, expect, vi, beforeEach } from 'vitest';
// import AuthProvider, { useAuth } from '@/context/AuthProvider.jsx';
// import '@testing-library/jest-dom/vitest';
// import axiosInstance from '@/hooks/axios';

// // Mock axios for auth calls
// vi.mock('@/hooks/axios', () => ({
//   default: {
//     post: vi.fn(),
//     get: vi.fn(),
//   },
// }));

// // Simple component that consumes the auth context
// function Consumer() {
//   const { isAuthenticated, user, login, logout } = useAuth();
//   return (
//     <div>
//       <span data-testid="auth-status">{isAuthenticated ? 'auth' : 'guest'}</span>
//       {user?.email && <span data-testid="email">{user.email}</span>}
//       <button onClick={() => login({ email: 'test@example.com', password: 'pwd' })}>Login</button>
//       <button onClick={logout}>Logout</button>
//     </div>
//   );
// }

// describe('AuthProvider & useAuth', () => {
//   beforeEach(() => {
//     vi.resetAllMocks();
//   });

//   it('provides guest state by default', () => {
//     render(
//       <AuthProvider>
//         <Consumer />
//       </AuthProvider>
//     );
//     expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
//   });

//   it('handles successful login', async () => {
//     const mockResponse = { status: 200, data: { success: true, data: { token: 'abc', user: { email: 'test@example.com' } } } };
//     (axiosInstance.post as any).mockResolvedValueOnce(mockResponse);

//     render(
//       <AuthProvider>
//         <Consumer />
//       </AuthProvider>
//     );

//     screen.getByText('Login').click();

//     await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));
//     expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
//     expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/login', { email: 'test@example.com', password: 'pwd' });
//   });
// });
