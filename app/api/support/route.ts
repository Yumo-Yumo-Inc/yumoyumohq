import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;
    const nameText = typeof name === "string" ? name.trim() : "";
    const emailText = typeof email === "string" ? email.trim() : "";
    const subjectText = typeof subject === "string" ? subject.trim() : "";
    const messageText = typeof message === "string" ? message.trim() : "";

    // Validate required fields
    if (!nameText || !emailText || !subjectText || !messageText) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (
      nameText.length > 120 ||
      emailText.length > 254 ||
      subjectText.length > 160 ||
      messageText.length > 4000
    ) {
      return NextResponse.json(
        { error: "Support request is too long" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailText)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // In production, you would use an email service like:
    // - Resend (recommended for Next.js)
    // - SendGrid
    // - Nodemailer with SMTP
    // - AWS SES
    
    // For now, log only non-sensitive metadata and return success.
    console.log("Support form submission received:", {
      to: "support@yumoyumo.com",
      subject: `Support Request: ${subjectText}`,
      emailDomain: emailText.split("@")[1] ?? "unknown",
      messageLength: messageText.length,
    });

    // TODO: Implement actual email sending
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@yumoyumo.com',
    //   to: 'support@yumoyumo.com',
    //   subject: `Support Request: ${subject}`,
    //   text: emailContent,
    //   replyTo: email,
    // });

    // For development, you can use a service like Mailtrap or just log it
    // In production, configure your email service and uncomment the code above

    return NextResponse.json({
      success: true,
      message: "Support request submitted successfully",
    });
  } catch (error) {
    console.error("Support form error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit support request",
      },
      { status: 500 }
    );
  }
}




