import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Create an account</h1>
          </CardTitle>
          <CardDescription>
            This creates your shopkeeper account and your shop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <Link href="/login">Already have an account? Log in</Link>
          <Link href="/">Back to shops</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
