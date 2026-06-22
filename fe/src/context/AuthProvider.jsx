// "use client";

// import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import useAuthStore, { waitForAuthHydration } from "@/store/useAuthStore";
// import AuthInitializingScreen from "@/components/auth/AuthInitializingScreen";
// import { syncAuthCookie, logAuthEvent, logLogoutTrigger } from "@/utils/authSession";
// import supabase from "@/lib/supabaseClient";

// const AuthContext = createContext(null);

// const PUBLIC_PATHS = ["/login", "/signup", "/pricing", "/", "/reset-password"];
// const AUTH_ENTRY_PATHS = ["/login", "/signup"];
// const ME_TIMEOUT_MS = 15000;

// function isPublicPath(pathname) {
//   return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
// }

// function isAuthEntryPath(pathname) {
//   return AUTH_ENTRY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
// }

// export default function AuthProvider({ children }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isInitializingAuth, setIsInitializingAuth] = useState(true);

//   const { user, token, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();

//   const extractUserFromSession = useCallback((session) => {
//     if (!session?.user) return null;
//     return {
//       id: session.user.id,
//       email: session.user.email || "",
//       name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
//       role: (session.user.user_metadata?.role || "user").toLowerCase(),
//       userVersion: session.user.user_metadata?.userVersion || 0,
//     };
//   }, []);

//   const performLogout = useCallback(async (reason, detail) => {
//     console.log(`[Auth] Performing logout: ${reason}`, detail);
//     logLogoutTrigger(reason, detail);

//     try {
//       await supabase.auth.signOut();
//     } catch {
//       // Ignore Supabase errors during logout
//     }

//     clearAuth(reason);
//     syncAuthCookie(null);

//     if (typeof window !== "undefined") {
//       Object.keys(localStorage)
//         .filter((k) => k.startsWith("job-bot:") || k.includes("persist"))
//         .forEach((k) => localStorage.removeItem(k));
//       window.location.href = "/login";
//     }
//   }, [clearAuth]);

//   useEffect(() => {
//     let cancelled = false;

//     const initialize = async () => {
//       console.log("[Auth] Initialization start");
//       try {
//         await waitForAuthHydration();
//         if (cancelled) return;

//         const { data: { session } } = await supabase.auth.getSession();

//         if (session?.access_token) {
//           console.log("[Auth] Supabase session found — restoring state");
//           syncAuthCookie(session.access_token);

//           const userFromSession = extractUserFromSession(session);
//           if (userFromSession) {
//             setAuth(userFromSession, session.access_token);
//           }
//           setIsInitializingAuth(false);

//           try {
//             const res = await supabase
//               .from("profiles")
//               .select("*")
//               .eq("id", session.user.id)
//               .single()
//               .timeout(ME_TIMEOUT_MS);

//             if (!cancelled && res.data) {
//               console.log("[Auth] Profile loaded in background", { version: res.data?.userVersion });
//               setAuth({ ...userFromSession, ...res.data }, session.access_token);
//             }
//           } catch (err) {
//             console.error("[Auth] Profile fetch error — keeping session", err?.message);
//           }
//           return;
//         }

//         const { token: storedToken, user: storedUser } = useAuthStore.getState();
//         if (storedToken) {
//           console.log("[Auth] No Supabase session — trying stored token");
//           syncAuthCookie(storedToken);

//           if (storedUser) {
//             setIsInitializingAuth(false);
//           }

//           try {
//             const { data: { user: supabaseUser } } = await supabase.auth.getUser(storedToken);
//             if (!cancelled && supabaseUser) {
//               const refreshedUser = extractUserFromSession({ user: supabaseUser });
//               if (refreshedUser) {
//                 setAuth(refreshedUser, storedToken);
//               }
//             }
//           } catch (err) {
//             console.error("[Auth] Legacy token validation error — clearing auth", err?.message);
//             if (!cancelled) {
//               await performLogout("bootstrap_legacy_unauthorized", err?.message);
//             }
//           } finally {
//             if (!cancelled) {
//               setIsInitializingAuth(false);
//             }
//           }
//           return;
//         }

//         console.log("[Auth] No session found — unauthenticated");
//       } finally {
//         if (!cancelled) {
//           console.log("[Auth] Initialization end");
//           setIsInitializingAuth(false);
//         }
//       }
//     };

//     void initialize();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         logAuthEvent(event, session);
//         console.log("[Auth] onAuthStateChange", event, {
//           hasSession: !!session,
//           hasToken: !!(session?.access_token),
//         });

//         if (event === "SIGNED_OUT") {
//           console.log("[Auth] Supabase SIGNED_OUT event — verifying session");
//           logAuthEvent("SIGNED_OUT", session, "pending_verification");

//           setTimeout(async () => {
//             try {
//               const { data: verifyData } = await supabase.auth.getSession();
//               if (verifyData?.session?.access_token) {
//                 console.log("[Auth] SIGNED_OUT was transient — session recovered");
//                 logAuthEvent("SIGNED_OUT_RECOVERED", verifyData.session, "session_recovery");
//                 const recoveredUser = extractUserFromSession(verifyData.session);
//                 if (recoveredUser) {
//                   setAuth(recoveredUser, verifyData.session.access_token);
//                 }
//                 syncAuthCookie(verifyData.session.access_token);
//                 return;
//               }
//             } catch (verifyErr) {
//               console.warn("[Auth] Could not verify session after SIGNED_OUT");
//             }

//             const { token: storeToken } = useAuthStore.getState();
//             if (storeToken) {
//               try {
//                 const { data: refreshData } = await supabase.auth.refreshSession();
//                 if (refreshData.session?.access_token) {
//                   console.log("[Auth] Session refreshed after SIGNED_OUT");
//                   const refreshedUser = extractUserFromSession(refreshData.session);
//                   if (refreshedUser) {
//                     setAuth(refreshedUser, refreshData.session.access_token);
//                   }
//                   syncAuthCookie(refreshData.session.access_token);
//                   return;
//                 }
//               } catch {
//                 // Refresh failed, proceed to logout
//               }
//             }

//             console.log("[Auth] Session confirmed gone after SIGNED_OUT — clearing auth");
//             await performLogout("supabase_signed_out", "onAuthStateChange:SIGNED_OUT:confirmed");
//           }, 1500);
//           return;
//         }

//         if (session?.access_token) {
//           syncAuthCookie(session.access_token);
//           const userFromSession = extractUserFromSession(session);
//           if (userFromSession) {
//             setAuth(userFromSession, session.access_token);
//           }
//           setIsInitializingAuth(false);

//           if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
//             try {
//               const { data: profileData } = await supabase
//                 .from("profiles")
//                 .select("*")
//                 .eq("id", session.user.id)
//                 .single()
//                 .timeout(ME_TIMEOUT_MS);

//               if (profileData) {
//                 setAuth({ ...userFromSession, ...profileData }, session.access_token);
//               }
//             } catch (err) {
//               console.warn("[Auth] Profile refresh failed — keeping session", err?.message);
//             }
//           }
//         }
//       }
//     );

//     return () => {
//       cancelled = true;
//       subscription?.unsubscribe();
//     };
//   }, [setAuth, clearAuth, extractUserFromSession, performLogout]);

//   useEffect(() => {
//     if (!hasHydrated || isInitializingAuth) return;

//     const isPublic = isPublicPath(pathname);
//     console.log("[Auth] Route guard check", { pathname, isAuthenticated, isPublic });

//     if (!isAuthenticated && !isPublic) {
//       console.log("[Auth] Redirect → /login (unauthenticated protected route)");
//       router.replace("/login");
//       return;
//     }

//     if (isAuthenticated && isAuthEntryPath(pathname)) {
//       console.log("[Auth] Redirect → /dashboard (authenticated auth entry route)");
//       router.replace("/dashboard");
//     }
//   }, [pathname, isAuthenticated, hasHydrated, isInitializingAuth, router]);

//   const signup = async ({ name, email, password }) => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { name },
//       },
//     });

//     if (error) {
//       throw new Error(error.message || "Signup failed");
//     }

//     if (!data.session?.access_token) {
//       throw new Error("Signup succeeded but no session returned. Check email confirmation settings.");
//     }

//     const { session } = data;
//     const userFromSession = extractUserFromSession(session);

//     setAuth(userFromSession, session.access_token);
//     syncAuthCookie(session.access_token);
//     setIsInitializingAuth(false);
//     router.replace("/dashboard");
//   };

//   const login = async ({ email, password }) => {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       throw new Error(error.message || "Login failed");
//     }

//     if (!data.session?.access_token) {
//       throw new Error("Login succeeded but no session returned.");
//     }

//     const { session } = data;
//     const userFromSession = extractUserFromSession(session);

//     setAuth(userFromSession, session.access_token);
//     syncAuthCookie(session.access_token);
//     setIsInitializingAuth(false);
//     router.replace("/dashboard");
//   };

//   const logout = async () => {
//     await supabase.auth.signOut().catch(() => { });
//     await performLogout("user_logout");
//   };

//   const resetPassword = async ({ email }) => {
//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
//     });

//     if (error) {
//       throw new Error(error.message || "Reset failed");
//     }
//   };

//   const loading = !hasHydrated || isInitializingAuth;

//   const value = useMemo(
//     () => ({
//       token,
//       user,
//       loading,
//       isInitializingAuth,
//       hasHydrated,
//       login,
//       signup,
//       logout,
//       resetPassword,
//       isAuthenticated,
//     }),
//     [token, user, loading, isInitializingAuth, hasHydrated, isAuthenticated]
//   );

//   if (loading) {
//     return (
//       <AuthContext.Provider value={value}>
//         <AuthInitializingScreen />
//       </AuthContext.Provider>
//     );
//   }

//   const isPublic = isPublicPath(pathname);
//   if (!isAuthenticated && !isPublic) {
//     return (
//       <AuthContext.Provider value={value}>
//         <AuthInitializingScreen label="Redirecting..." />
//       </AuthContext.Provider>
//     );
//   }

//   if (isAuthenticated && isAuthEntryPath(pathname)) {
//     return (
//       <AuthContext.Provider value={value}>
//         <AuthInitializingScreen label="Redirecting..." />
//       </AuthContext.Provider>
//     );
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore, { waitForAuthHydration } from "@/store/useAuthStore";
import AuthInitializingScreen from "@/components/auth/AuthInitializingScreen";
import { syncAuthCookie, logAuthEvent, logLogoutTrigger } from "@/utils/authSession";
import supabase from "@/lib/supabaseClient";

const AuthContext = createContext(null);

const PUBLIC_PATHS = ["/login", "/signup", "/pricing", "/", "/reset-password"];
const AUTH_ENTRY_PATHS = ["/login", "/signup"];
const ME_TIMEOUT_MS = 15000;

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthEntryPath(pathname) {
  return AUTH_ENTRY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const { user, token, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();

  // Track if we've already redirected to prevent loops
  const hasRedirected = useRef(false);

  const extractUserFromSession = useCallback((session) => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
      role: (session.user.user_metadata?.role || "user").toLowerCase(),
      userVersion: session.user.user_metadata?.userVersion || 0,
    };
  }, []);

  const performLogout = useCallback(async (reason, detail) => {
    console.log(`[Auth] Performing logout: ${reason}`, detail);
    logLogoutTrigger(reason, detail);

    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase errors during logout
    }

    clearAuth(reason);
    syncAuthCookie(null);

    if (typeof window !== "undefined") {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("job-bot:") || k.includes("persist"))
        .forEach((k) => localStorage.removeItem(k));

      // Only redirect if we're not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }, [clearAuth]);

  // AUTH INITIALIZATION
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      console.log("[Auth] Initialization start");
      hasRedirected.current = false; // Reset on fresh init

      try {
        await waitForAuthHydration();
        if (cancelled) return;

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
          console.log("[Auth] Supabase session found — restoring state");
          syncAuthCookie(session.access_token);

          const userFromSession = extractUserFromSession(session);
          if (userFromSession) {
            setAuth(userFromSession, session.access_token);
          }

          try {
            const res = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single()
              .timeout(ME_TIMEOUT_MS);

            if (!cancelled && res.data) {
              console.log("[Auth] Profile loaded in background", { version: res.data?.userVersion });
              setAuth({ ...userFromSession, ...res.data }, session.access_token);
            }
          } catch (err) {
            console.error("[Auth] Profile fetch error — keeping session", err?.message);
          }
          return;
        }

        const { token: storedToken } = useAuthStore.getState();
        if (storedToken) {
          console.log("[Auth] No Supabase session — trying stored token");
          syncAuthCookie(storedToken);

          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser(storedToken);
            if (!cancelled && supabaseUser) {
              const refreshedUser = extractUserFromSession({ user: supabaseUser });
              if (refreshedUser) {
                setAuth(refreshedUser, storedToken);
              }
            } else if (!cancelled) {
              console.log("[Auth] Stored token invalid — clearing auth");
              await performLogout("bootstrap_legacy_unauthorized", "invalid_token");
            }
          } catch (err) {
            console.error("[Auth] Legacy token validation error — clearing auth", err?.message);
            if (!cancelled) {
              await performLogout("bootstrap_legacy_unauthorized", err?.message);
            }
          }
          return;
        }

        console.log("[Auth] No session found — unauthenticated");
      } finally {
        if (!cancelled) {
          console.log("[Auth] Initialization end");
          setIsInitializingAuth(false);
          setAuthChecked(true);
        }
      }
    };

    void initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logAuthEvent(event, session);
        console.log("[Auth] onAuthStateChange", event, {
          hasSession: !!session,
          hasToken: !!(session?.access_token),
        });

        if (event === "SIGNED_OUT") {
          console.log("[Auth] Supabase SIGNED_OUT event — verifying session");
          logAuthEvent("SIGNED_OUT", session, "pending_verification");

          setTimeout(async () => {
            try {
              const { data: verifyData } = await supabase.auth.getSession();
              if (verifyData?.session?.access_token) {
                console.log("[Auth] SIGNED_OUT was transient — session recovered");
                logAuthEvent("SIGNED_OUT_RECOVERED", verifyData.session, "session_recovery");
                const recoveredUser = extractUserFromSession(verifyData.session);
                if (recoveredUser) {
                  setAuth(recoveredUser, verifyData.session.access_token);
                }
                syncAuthCookie(verifyData.session.access_token);
                return;
              }
            } catch (verifyErr) {
              console.warn("[Auth] Could not verify session after SIGNED_OUT");
            }

            const { token: storeToken } = useAuthStore.getState();
            if (storeToken) {
              try {
                const { data: refreshData } = await supabase.auth.refreshSession();
                if (refreshData.session?.access_token) {
                  console.log("[Auth] Session refreshed after SIGNED_OUT");
                  const refreshedUser = extractUserFromSession(refreshData.session);
                  if (refreshedUser) {
                    setAuth(refreshedUser, refreshData.session.access_token);
                  }
                  syncAuthCookie(refreshData.session.access_token);
                  return;
                }
              } catch {
                // Refresh failed, proceed to logout
              }
            }

            console.log("[Auth] Session confirmed gone after SIGNED_OUT — clearing auth");
            await performLogout("supabase_signed_out", "onAuthStateChange:SIGNED_OUT:confirmed");
          }, 1500);
          return;
        }

        if (session?.access_token) {
          syncAuthCookie(session.access_token);
          const userFromSession = extractUserFromSession(session);
          if (userFromSession) {
            setAuth(userFromSession, session.access_token);
          }

          if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
            try {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single()
                .timeout(ME_TIMEOUT_MS);

              if (profileData) {
                setAuth({ ...userFromSession, ...profileData }, session.access_token);
              }
            } catch (err) {
              console.warn("[Auth] Profile refresh failed — keeping session", err?.message);
            }
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [setAuth, clearAuth, extractUserFromSession, performLogout]);

  // ROUTE GUARD — uses router.replace with redirect lock
  useEffect(() => {
    if (!hasHydrated || isInitializingAuth || !authChecked) return;
    if (hasRedirected.current) return; // Prevent multiple redirects

    const isPublic = isPublicPath(pathname);

    if (!isAuthenticated && !isPublic) {
      console.log("[Auth] Redirect → /login (unauthenticated protected route)");
      hasRedirected.current = true;
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isAuthEntryPath(pathname)) {
      console.log("[Auth] Redirect → /dashboard (authenticated auth entry route)");
      hasRedirected.current = true;
      router.replace("/dashboard");
    }
  }, [pathname, isAuthenticated, hasHydrated, isInitializingAuth, authChecked, router]);

  // Reset redirect lock when pathname actually changes from external navigation
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  const signup = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      throw new Error(error.message || "Signup failed");
    }

    if (!data.session?.access_token) {
      throw new Error("Signup succeeded but no session returned. Check email confirmation settings.");
    }

    const { session } = data;
    const userFromSession = extractUserFromSession(session);

    setAuth(userFromSession, session.access_token);
    syncAuthCookie(session.access_token);
    setIsInitializingAuth(false);
    setAuthChecked(true);
    hasRedirected.current = true;
    router.replace("/dashboard");
  };

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || "Login failed");
    }

    if (!data.session?.access_token) {
      throw new Error("Login succeeded but no session returned.");
    }

    const { session } = data;
    const userFromSession = extractUserFromSession(session);

    setAuth(userFromSession, session.access_token);
    syncAuthCookie(session.access_token);
    setIsInitializingAuth(false);
    setAuthChecked(true);
    hasRedirected.current = true;
    router.replace("/dashboard");
  };

  const logout = async () => {
    await supabase.auth.signOut().catch(() => { });
    await performLogout("user_logout");
  };

  const resetPassword = async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
    });

    if (error) {
      throw new Error(error.message || "Reset failed");
    }
  };

  const loading = !hasHydrated || isInitializingAuth || !authChecked;

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isInitializingAuth,
      hasHydrated,
      authChecked,
      login,
      signup,
      logout,
      resetPassword,
      isAuthenticated,
    }),
    [token, user, loading, isInitializingAuth, hasHydrated, authChecked, isAuthenticated]
  );

  // CRITICAL FIX: Don't trap in "Redirecting..." — render children and let router handle it
  // The route guard effect above will handle the actual navigation
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <AuthInitializingScreen />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}