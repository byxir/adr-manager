/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

function getRepos() {
  return fetch("/api/git/repos").then((r) => r.json());
}
export default function Home() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data } = useQuery({ queryKey: ["todos"], queryFn: getRepos });

  console.log(data);
  return (
    <div>
      <Button onClick={() => signIn("github")}>Sign in</Button>
      {session?.user?.name}
      {session?.user?.repositories?.data?.map((r: any) => (
        <div key={r.full_name}>{r.full_name}</div>
      ))}
    </div>
  );
}
