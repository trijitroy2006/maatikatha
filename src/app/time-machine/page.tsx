// This route has been moved into the main dashboard at /
// Anyone navigating directly to /time-machine is redirected to the root.
import { redirect } from 'next/navigation';

export default function TimeMachineRedirect() {
  redirect('/');
}
