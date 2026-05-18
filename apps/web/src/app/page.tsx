import { redirect } from 'next/navigation';

// Root page — redirect to /upload when logged in, otherwise /login
export default function HomePage() {
  redirect('/upload');
}
