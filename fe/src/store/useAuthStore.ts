import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { app } from "@/lib/firebase";

interface UserData {
  name: string;
  email: string | null;
  photoURL?: string | null;
  uid: string;
}

interface AuthState {
  user: boolean | null;
  userData: Partial<UserData>;
  userToken: string;

  setUserData: (user: User) => void;
  setUserToken: (token: string) => void;
  clearUser: () => Promise<string | unknown>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userData: {},
      userToken: "",

      setUserToken: (token) => {
        set({ userToken: token });
      },

      setUserData: (user: User) => {
        user.getIdToken().then((token) => {
          set({
            user: true,
            userToken: token,
            userData: {
              name: user.displayName || "",
              email: user.email,
              photoURL: user.photoURL || "",
              uid: user.uid,
            },
          });
        });
      },

      clearUser: async () => {
        try {
          await signOut(getAuth(app));
          set({
            user: false,
            userData: {},
            userToken: "",
          });
          return "successfully logged out";
        } catch (error) {
          console.error("Error signing out:", error);
          return error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// 🔥 Auth Listener
export async function initAuthListener() {
  const auth = getAuth(app);
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      useAuthStore.getState().setUserData(user);
      useAuthStore.getState().setUserToken(token);
      console.log("User logged in:", user);
    } else {
      useAuthStore.getState().clearUser();
      console.log("No user, logged out");
    }
  });
}

export default useAuthStore;
