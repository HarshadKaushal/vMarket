import Link from "next/link";
import styles from "../page.module.css";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className={styles.main}>
      <h1>Create an account</h1>
      <SignupForm />
      <Link href="/login">Already have an account? Log in</Link>
      <Link href="/">Back to shops</Link>
    </main>
  );
}
