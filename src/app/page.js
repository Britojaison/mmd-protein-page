import { redirect } from 'next/navigation';

export default function HomePage() {
  // Server-side redirect to world-protein-day
  redirect('/world-protein-day');
}