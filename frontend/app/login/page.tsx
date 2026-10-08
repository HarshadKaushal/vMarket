import Link from "next/link";
import styles from "../page.module.css";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <h1>Log in</h1>
      <LoginForm />
      <Link href="/signup">Create an account</Link>
      <Link href="/">Back to shops</Link>
    </main>
  );
}
