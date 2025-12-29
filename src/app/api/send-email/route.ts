import { NextRequest, NextResponse } from 'next/server';
import { EmailPayload, EmailResponse } from '@/../type';
import { emailService, EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if email service is configured
    if (!EmailService.isConfigured()) {
      const configStatus = EmailService.getConfigStatus();
      console.error('Email service not configured:', configStatus);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured. Please check environment variables.',
          missing: configStatus?.missing || [],
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: EmailPayload = await request.json();

    // Validate required fields
    if (!body.type || !body.to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type and to are required',
        },
        { status: 400 }
      );
    }

    // Send email
    const result: EmailResponse = await emailService.sendEmail(body);

    // Return appropriate response
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-email API:', error);
    
    // Handle validation errors
    if (error instanceof Error) {
      if (error.message.includes('required')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/send-email
 * 
 * Health check endpoint to verify email service configuration
 */
export async function GET(): Promise<NextResponse> {
  const configStatus = EmailService.getConfigStatus();

  return NextResponse.json({
    configured: configStatus?.configured || false,
    missing: configStatus?.missing || [],
    message: configStatus?.configured 
      ? 'Email service is configured and ready' 
      : 'Email service is not properly configured',
  });
}

/**
 * OPTIONS /api/send-email
 * 
 * CORS preflight response
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}