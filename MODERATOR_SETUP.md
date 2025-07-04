# Moderator Setup Instructions

## Overview
By default, all new users are created as regular "server" users. To set up moderator access, you need to manually promote the first moderator, who can then grant access to others.

## Step 1: Make the First Moderator

### Method 1: Direct Database Update (Recommended)
1. Both you and your mother need to log into the system at least once to create user accounts
2. Go to the database SQL tool in the project
3. Run this query to see all users:
   ```sql
   SELECT id, email, role FROM users;
   ```
4. Find your mother's user ID from the results
5. Run this query to make her a moderator (replace 'USER_ID' with her actual ID):
   ```sql
   UPDATE users SET role = 'moderator' WHERE id = 'USER_ID';
   ```

### Method 2: Via Code (Alternative)
If you prefer to do it through code, you can temporarily add this to your server startup:

1. Add this code to `server/index.ts` temporarily:
   ```javascript
   // Temporary: Make first moderator
   // Replace 'mother@email.com' with your mother's actual email
   setTimeout(async () => {
     try {
       const motherUser = await storage.getUserByEmail('mother@email.com');
       if (motherUser && motherUser.role !== 'moderator') {
         await storage.updateUserRole(motherUser.id, 'moderator');
         console.log('First moderator created successfully');
       }
     } catch (error) {
       console.log('Moderator setup:', error);
     }
   }, 5000);
   ```

2. Restart the server
3. Remove this code after the moderator is created

## Step 2: Grant Additional Moderators

Once your mother has moderator access, she can:

1. Log into the system
2. Go to the Moderator Dashboard
3. Click on the "Users" tab
4. Use the "Make Moderator" button next to any user to grant them access
5. Use "Remove Moderator" to revoke access if needed

## Current Setup

Based on your setup:
- **You**: Regular server user (can clock in/out, view your own stats)
- **Your Mother**: Will be the main moderator (can view all users, manage roles, export data, oversee all service sessions)
- **Future Users**: Will be servers by default, can be promoted by existing moderators

## Security Note

- Only moderators can grant or remove moderator access
- All moderator actions are logged for security
- Make sure to keep moderator access limited to trusted individuals