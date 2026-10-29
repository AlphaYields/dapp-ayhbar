import { redirect } from 'next/navigation';

// This app serves a single ayTOKEN; the index opens it.
export default function AytokensPage() {
  redirect('/aytokens/ayhbar');
}
