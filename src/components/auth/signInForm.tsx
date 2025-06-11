'use client'

import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Github, Gitlab} from "lucide-react";
import {signIn} from "next-auth/react";

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentProps<"div">) {
  return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Sign in with your chosen Git account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button onClick={() => signIn('github', {redirectTo: '/dashboard'})} variant="outline"
                        className="w-full">
                  <Github/>
                  Login with GitHub
                </Button>
                <Button variant="outline" className="w-full">
                  <Gitlab/>
                  Login with GitLab
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div
            className="
            text-muted-foreground
             *:[a]:hover:text-primary
              text-center
              text-xs
              text-balance
              *:[a]:underline
              *:[a]:underline-offset-4
              "
        >
          Can't find the git provider you would like to login with? Help us add more by contributing at our <a target={'_blank'} href="https://github.com/adr/adr-manager">GitHub Repository</a>
        </div>
      </div>
  )
}
