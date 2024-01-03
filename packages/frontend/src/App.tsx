import Chat from './Chat/Chat'
import SignIn from './SignIn/SignIn'

import { useEffect, useState } from 'react';

export interface User extends UserWithoutSession {
  session: string
  syncSession: () => Promise<void>
}

interface UserWithoutSession {
  userID: string
  languages?: string[]
}

export default function _() {
  const [user, setUser] = useState<User | null>(null);

  const getUserInfo = async (session: string): Promise<UserWithoutSession | undefined> => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/session`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session}`,
          },
        }
      );
      return response.json();
    } catch (error) {
      console.error(error);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("session");
    setUser(null);
  };
  
  useEffect(() => {
    const getSession = async () => {
      const token = localStorage.getItem("session");
      if (typeof token === "string") {
        const user = await getUserInfo(token);
        if (typeof user !== 'undefined') {
          setUser({...user, session: token, syncSession: getSession});
        }
      }
    };

    getSession();
  }, []);

  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (typeof token === 'string') {
      localStorage.setItem("session", token);
      window.location.replace(window.location.origin);
    }
  }, []);

  return (
       user ? (
        <Chat signOut={signOut} user={user!}/>
        ) : <SignIn />
  );
};