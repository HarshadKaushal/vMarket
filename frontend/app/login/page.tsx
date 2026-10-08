import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Log in</h1>
          </CardTitle>
          <CardDescription>
            Use the email and password for your shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <Link href="/signup">Create an account</Link>
          <Link href="/">Back to shops</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
