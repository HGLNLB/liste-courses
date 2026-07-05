"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { ShoppingApp } from "@/components/ShoppingApp";
import type { User } from "@supabase/supabase-js";

export function AppShell() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker optionnel en dev
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F2F2F7] text-[#8E8E93]">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onSuccess={async () => {
          const supabase = createClient();
          const { data } = await supabase.auth.getUser();
          setUser(data.user);
        }}
      />
    );
  }

  return <ShoppingApp userId={user.id} userEmail={user.email ?? ""} />;
}
