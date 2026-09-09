import { redirect } from 'next/navigation';

export default function NewCaseRedirect() {
  redirect('/cases/new/step1');
}
