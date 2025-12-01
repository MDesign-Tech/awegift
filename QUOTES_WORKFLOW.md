# Quote Management System Workflow

## Overview
The Quote Management System allows users to request free quotes and enables administrators to manage and respond to these requests through a comprehensive dashboard.

## System Architecture

### Collections
- **quotes**: Main collection storing quote requests
- **notifications**: In-app notifications for users

### API Endpoints
- `POST /api/quotes` - Submit new quote request
- `POST /api/quotes/notifications` - Send notifications for completed quotes
- `GET /api/admin/quotes` - Fetch all quotes for admin dashboard
- `GET /api/admin/quotes/[id]` - Fetch specific quote details
- `PUT /api/admin/quotes/[id]` - Update quote status and admin response

## Workflow Steps

### 1. User Submits Quote Request
```
User clicks "Request Free Quote" → Fills form → Submits
    ↓
API validates input → Saves to Firestore (status: "pending", notified: false)
    ↓
Success message displayed to user
```

### 2. Admin Reviews Quote
```
Admin logs into dashboard → Views quotes table
    ↓
Filters by status (pending/in_review/completed)
    ↓
Searches by name, email, or phone
    ↓
Clicks "View Details" to open quote modal
```

### 3. Admin Processes Quote
```
Admin reviews quote details → Writes response in admin response field
    ↓
Updates status to "completed" (automatic if response provided)
    ↓
Saves changes
```

### 4. Automatic Notification Trigger
```
Status changes to "completed" AND adminResponse exists
    ↓
System automatically calls /api/quotes/notifications
    ↓
Sends email, SMS, and in-app notifications
    ↓
Updates quote.notified = true
```

### 5. User Receives Response
```
User receives notifications via:
- Email (detailed response)
- SMS (brief notification)
- In-app notification (dashboard/app)
    ↓
User can view response in their preferred channel
```

## Status Transitions

### Valid Status Flow:
```
pending → in_review → completed
   ↓         ↓
   └─────────┘ (can go directly to completed)
```

### Status Definitions:
- **pending**: New quote request, not yet reviewed
- **in_review**: Admin is actively working on the quote
- **completed**: Admin has provided response, ready for notification

### Notification Rules:
- Notifications are ONLY sent when: `status === "completed" AND notified === false`
- Once notified, `notified` is set to `true` to prevent duplicate notifications
- Manual notification sending is available via the "Send" button for completed quotes

## Firestore Document Structure

### Quotes Collection
```javascript
{
  id: "QUOTE-{timestamp}-{randomSuffix}",
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  reason: "Project details...",
  status: "pending", // "pending" | "in_review" | "completed"
  adminResponse: null, // String or null
  notified: false, // Boolean
  createdAt: serverTimestamp,
  updatedAt: serverTimestamp
}
```

### Notifications Collection (Optional)
```javascript
{
  userId: "user@example.com", // Using email as userId
  title: "Quote Response Available",
  message: "Your quote request has been processed...",
  type: "quote_response",
  read: false,
  createdAt: serverTimestamp
}
```

## Security Considerations

### Admin Access
- Only users with "admin" role can access `/dashboard/admin/quotes`
- Protected by `RoleProtectedRoute` component

### Input Validation
- Client-side validation on quote form
- Server-side validation on all API endpoints
- Email format validation
- Phone number format validation

### Data Privacy
- User data is stored securely in Firestore
- Admin responses are properly sanitized
- Notification preferences respected

## Integration Points

### Email Service
Replace `sendEmail()` function in `/api/quotes/notifications/route.ts`:
```javascript
// TODO: Integrate with SendGrid, Mailgun, etc.
async function sendEmail(to: string, subject: string, html: string): Promise<boolean>
```

### SMS Service
Replace `sendSMS()` function in `/api/quotes/notifications/route.ts`:
```javascript
// TODO: Integrate with Twilio, AWS SNS, etc.
async function sendSMS(to: string, message: string): Promise<boolean>
```

### In-App Notifications
The `createInAppNotification()` function creates Firestore documents for in-app notifications. Integrate with your frontend notification system.

## Error Handling

### User-Facing Errors
- Form validation errors displayed inline
- Submission errors shown via alert/modal
- Network errors handled gracefully

### Admin-Facing Errors
- API errors logged to console
- Failed operations show user-friendly messages
- Notification failures don't break quote updates

## Monitoring & Maintenance

### Key Metrics to Track
- Quote submission success rate
- Average response time
- Notification delivery success rate
- Admin dashboard usage

### Regular Tasks
- Monitor Firestore usage and costs
- Review failed notifications
- Clean up old completed quotes (if needed)
- Update notification templates as needed

## Future Enhancements

### Potential Features
- Quote templates for common responses
- Bulk quote operations
- Quote analytics dashboard
- Customer quote history
- Integration with CRM systems
- Multi-language support for notifications
- Quote expiration and follow-up reminders