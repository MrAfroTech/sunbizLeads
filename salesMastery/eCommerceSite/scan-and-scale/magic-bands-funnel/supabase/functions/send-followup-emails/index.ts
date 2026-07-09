// Deploy from this directory (`supabase/functions/send-followup-emails`).
import { handler } from '../../../functions/send-followup-emails.ts';

Deno.serve(handler);
