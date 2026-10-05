import { createElement } from "react";
import { Button, Hr, Link, Section, Text } from "react-email";
import { createEmailStyles, EmailLayout } from "@/lib/email/components/layout";
import { renderEmailTemplate } from "@/lib/email/renderer";
import { renderCustomEmail } from "@/lib/email-templates";
import { getEmailBranding } from "@/lib/settings";

interface TicketMergedProps {
  customerName: string;
  /** The ticket that was merged away (closed, now forwards to the target). */
  mergedTicketNumber: number;
  mergedTicketSubject: string;
  /** The ticket the conversation continues in. */
  ticketNumber: number;
  ticketSubject: string;
  ticketUrl: string;
}

function TicketMergedEmail({
  customerName,
  mergedTicketNumber,
  mergedTicketSubject,
  ticketNumber,
  ticketSubject,
  ticketUrl,
  productName,
  logoUrl,
  accentColor,
}: TicketMergedProps & {
  productName: string;
  logoUrl: string | null;
  accentColor: string;
}) {
  const emailStyles = createEmailStyles(accentColor);
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`[#${mergedTicketNumber}] Your ticket has been merged into #${ticketNumber}`}
      productName={productName}
    >
      <Text style={emailStyles.heading}>Your tickets have been combined</Text>
      <Text style={emailStyles.paragraph}>Hi {customerName},</Text>
      <Text style={emailStyles.paragraph}>
        Your support ticket{" "}
        <strong style={emailStyles.highlight}>#{mergedTicketNumber}</strong> (
        {mergedTicketSubject}) was about the same request as ticket{" "}
        <strong style={emailStyles.highlight}>#{ticketNumber}</strong>, so we
        merged them into one. All your messages and attachments are now in{" "}
        <strong style={emailStyles.highlight}>#{ticketNumber}</strong>, and our
        team will continue there.
      </Text>
      <Text style={{ ...emailStyles.paragraph, color: "#6A89A7" }}>
        <strong>Subject:</strong> {ticketSubject}
      </Text>
      <Text style={emailStyles.paragraph}>
        Please reply on ticket #{ticketNumber} from now on. Your old link for #
        {mergedTicketNumber} also opens it.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={ticketUrl} style={emailStyles.button}>
          View Ticket #{ticketNumber}
        </Button>
      </Section>
      <Hr style={{ borderColor: "#BDDDFC", margin: "24px 0" }} />
      <Text style={emailStyles.fallbackLink}>
        If the button does not work, paste this link into your browser:{" "}
        <Link href={ticketUrl} style={emailStyles.link}>
          {ticketUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

export async function ticketMergedTemplate(props: TicketMergedProps) {
  const { productName, logoUrl, accentColor } = await getEmailBranding();

  const custom = await renderCustomEmail({
    type: "ticket_merged",
    brandName: productName,
    logoUrl,
    accentColor,
    vars: {
      customerName: props.customerName,
      mergedTicketNumber: String(props.mergedTicketNumber),
      mergedTicketSubject: props.mergedTicketSubject,
      ticketNumber: String(props.ticketNumber),
      ticketSubject: props.ticketSubject,
      ticketUrl: props.ticketUrl,
    },
  });
  const defaultSubject = `[#${props.mergedTicketNumber}] Your ticket has been merged into #${props.ticketNumber} — ${props.ticketSubject}`;
  if (custom) {
    return { subject: custom.subject, html: custom.html, text: custom.text };
  }

  const html = await renderEmailTemplate(
    createElement(TicketMergedEmail, {
      ...props,
      productName,
      logoUrl,
      accentColor,
    })
  );

  const text = `Hi ${props.customerName},

Your support ticket #${props.mergedTicketNumber} (${props.mergedTicketSubject}) was about the same request as ticket #${props.ticketNumber}, so we merged them into one. All your messages and attachments are now in #${props.ticketNumber}, and our team will continue there.

Subject: ${props.ticketSubject}

View ticket #${props.ticketNumber}: ${props.ticketUrl}

— ${productName}`;

  return { subject: defaultSubject, html, text };
}
