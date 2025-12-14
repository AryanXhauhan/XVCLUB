



'use client';

import { getAuth } from "firebase/auth";
import { useEffect } from "react";

export default function AdminCheck() {
  useEffect(() => {
    const check = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdTokenResult(true);
      console.log(token.claims.admin);
    };

    check();
  }, []);

  return null;
}
