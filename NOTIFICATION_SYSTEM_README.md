# Real-Time Notification System

This document describes the real-time notification system implemented using Firebase Firestore onSnapshot listeners.

## Features

- **Real-time updates**: Uses Firestore `onSnapshot` for instant notification delivery
- **Popup notifications**: Animated slide-down notifications from the top-right
- **Clickable popups**: Click to view notification details or navigate to notifications page
- **Auto-dismiss**: Notifications automatically hide after 4 seconds
- **New notification detection**: Only shows popups for truly new notifications
- **Persistent View buttons**: "View" buttons remain visible even for read notifications
- **Menu badges**: Notification count displayed in user menu with "9+" for 10+
- **Clean UI**: Modern design with progress bar, close button, and hover effects

## Architecture

### Components

1. **`useNotifications` Hook** (`src/hooks/useNotifications.ts`)
   - Manages Firestore listener
   - Detects new notifications
   - Provides notification state

2. **`NotificationPopdown` Component** (`src/components/NotificationPopdown.tsx`)
   - Renders the popup notification
   - Handles animations and auto-dismiss
   - Includes progress bar

3. **`NotificationProvider` Component** (`src/components/NotificationProvider.tsx`)
   - Wraps the app to provide notification context
   - Integrates with the root layout

### Firestore Structure

```javascript
// Collection: notifications
{
  userId: "string", // Firestore document ID of the user
  title: "string",
  message: "string",
  type: "string", // e.g., "order_update", "quote_response"
  read: boolean,
  quoteId?: "string", // Optional, for quote-related notifications
  createdAt: Timestamp
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Usage

The notification system is automatically active for all authenticated users:

1. **Real-time Popups**: When new notifications arrive, users see animated popdown notifications from the top-right
2. **Clickable Popups**: Clicking the popup navigates to view notification details
3. **Menu Badges**: The user profile dropdown shows notification count with blue badges (9+ for 10+)
4. **Persistent Actions**: "View" buttons remain available even after notifications are read
5. **Auto-dismiss**: Popups automatically disappear after 4 seconds

All features work seamlessly without requiring user configuration.

### Manual Integration (if needed)

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notifications, newNotification, clearNewNotification } = useNotifications();

  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

### Custom Notification Creation

```typescript
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

await addDoc(collection(db, "notifications"), {
  userId: userId,
  title: "New Order",
  message: "Your order has been placed successfully",
  type: "order_update",
  read: false,
  createdAt: serverTimestamp(),
});
```

## Animation Details

- **Slide-in**: `translate-y-0 opacity-100` with 300ms transition
- **Slide-out**: `-translate-y-full opacity-0` with 300ms transition
- **Progress bar**: Shrinks from 100% to 0% over 4 seconds using CSS animation
- **Theme**: Uses the app's theme color (`#ed4c07`)

## Performance Considerations

- Listeners are automatically cleaned up on component unmount
- Only active when user is authenticated
- Efficient querying with compound indexes on `(userId, createdAt)`
- Minimal re-renders through proper state management

## Browser Support

- Modern browsers with ES6 support
- Requires Firebase v9+ SDK
- Tailwind CSS for styling