import 'server-only';
import { Resend } from 'resend';
import { getResendApiKey } from '@/lib/azure-secrets';

const FROM_ADDRESS = 'InspectionComm <no-reply@inspectioncomm.com>';

// Comma-separated list of inspectioncomm.com (or other) addresses that get
// notified of every new lead — not a secret, just configuration, so it's a
// plain env var rather than a Key Vault secret.
function getNotifyEmails(): string[] {
  return (process.env.INSPECTION_REQUEST_NOTIFY_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

let client: Resend | undefined;
async function getClient(): Promise<Resend> {
  if (!client) {
    client = new Resend(await getResendApiKey());
  }
  return client;
}

export type InspectionRequestEmailInput = {
  name: string;
  email: string;
  phone: string | null;
  vehicleType: string;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  location: string | null;
  notes: string | null;
};

function vehicleSummary(input: InspectionRequestEmailInput): string {
  return (
    [input.vehicleYear, input.vehicleMake, input.vehicleModel].filter(Boolean).join(' ') ||
    input.vehicleType
  );
}

// Fire both emails for a new lead. Callers should catch/log rather than let
// a delivery failure block the lead from being saved — the request already
// lives in the DB and is visible in /inspector/requests either way.
export async function sendInspectionRequestEmails(
  input: InspectionRequestEmailInput
): Promise<void> {
  const resend = await getClient();
  const vehicle = vehicleSummary(input);
  const notifyEmails = getNotifyEmails();

  const sends = [
    resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'We received your inspection request',
      text: `Hi ${input.name},\n\nThanks for requesting an inspection for your ${vehicle} with InspectionComm. We'll reach out shortly to schedule.\n\nIf anything changes or you have questions in the meantime, just reply to this email.\n\n— InspectionComm`,
    }),
  ];

  if (notifyEmails.length > 0) {
    sends.push(
      resend.emails.send({
        from: FROM_ADDRESS,
        to: notifyEmails,
        replyTo: input.email,
        subject: `New inspection request: ${vehicle}`,
        text: [
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          `Phone: ${input.phone || '—'}`,
          `Vehicle type: ${input.vehicleType}`,
          `Vehicle: ${vehicle}`,
          `Location: ${input.location || '—'}`,
          `Notes: ${input.notes || '—'}`,
          '',
          'View and triage in the inspector portal: /inspector/requests',
        ].join('\n'),
      })
    );
  }

  const results = await Promise.allSettled(sends);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Failed to send inspection request email', result.reason);
    }
  }
}
