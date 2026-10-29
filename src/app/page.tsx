import { redirect } from 'next/navigation';

// The app root opens the ayHBAR vault page.
export default function RootPage() {
  redirect('/aytokens/ayhbar');
}
