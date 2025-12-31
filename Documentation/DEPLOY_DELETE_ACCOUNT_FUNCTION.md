# How to Deploy the Delete Account Function via Supabase Dashboard

## Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **zadjehlurkkyjrfuavtj**

## Step 2: Create the Edge Function
1. In the left sidebar, click on **Edge Functions**
2. Click the **"Create a new function"** button
3. Name the function: **delete-account**
4. Click **"Create function"**

## Step 3: Add the Function Code
1. Once created, you'll see a code editor
2. Replace all the default code with the following:

```typescript
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Delete account function")

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Get the user from the JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    const userId = user.id

    console.log(`Starting account deletion for user: ${userId}`)

    // Delete all user data in the correct order (due to foreign key constraints)
    // First delete expenses and income (they reference categories)
    // Then delete categories
    // Finally delete the user account

    // Delete expenses
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', userId)

    if (expensesError) {
      console.error('Error deleting expenses:', expensesError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete expenses', details: expensesError.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }
    console.log('Expenses deleted successfully')

    // Delete income (singular table name)
    const { error: incomeError } = await supabase
      .from('income')
      .delete()
      .eq('user_id', userId)

    if (incomeError) {
      console.error('Error deleting income:', incomeError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete income', details: incomeError.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }
    console.log('Income deleted successfully')

    // Delete categories
    const { error: categoriesError } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId)

    if (categoriesError) {
      console.error('Error deleting categories:', categoriesError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete categories', details: categoriesError.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }
    console.log('Categories deleted successfully')

    // Finally, delete the user account
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    console.log('User account deleted successfully')

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    )
  }
})
```

3. Click **"Save"** or **"Deploy"** button (depends on the UI version)

## Important: The CORS Fix

The updated code above includes CORS (Cross-Origin Resource Sharing) headers that allow your frontend (https://uttx.vercel.app) to call the function. The key additions are:

- `corsHeaders` object with `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers`
- Handling of OPTIONS preflight requests
- CORS headers added to ALL responses (success and error)

**Make sure you replace the entire function code with the updated version above!**

## Step 4: Verify Deployment
1. Wait for the deployment to complete (usually takes 10-30 seconds)
2. You should see a success message
3. The function status should show as "Active" or "Deployed"

## Step 5: Test the Function (Optional but Recommended)
1. In the Edge Functions page, click on the **delete-account** function
2. Look for the "Invocations" or "Logs" tab to monitor activity
3. You can test it by:
   - Using the test user account in your app
   - Going to Account dropdown → Delete Account
   - Confirming the deletion
   - Check the logs to see if it executed successfully

## What Gets Deleted

The function deletes everything in this order:
1. ✅ All expense records for the user
2. ✅ All income records for the user
3. ✅ All categories for the user
4. ✅ The user's authentication account
5. ✅ All associated metadata

## Security Features

✅ **Authentication Required**: Only authenticated users can delete their own account  
✅ **Server-Side**: Deletion happens securely on the server, not client-side  
✅ **Service Role**: Uses elevated permissions to ensure complete deletion  
✅ **Error Handling**: Provides detailed error messages if anything fails  
✅ **Logging**: Logs each step for debugging and audit trails  

## Frontend Changes Already Made

The following UI changes have been implemented:
- ✅ "Delete Account" option added to Account dropdown (next to Sign Out)
- ✅ Comprehensive confirmation dialog with detailed warnings
- ✅ Loading state during deletion
- ✅ Success/error toast notifications
- ✅ Automatic sign-out after successful deletion

## Environment Variables

The function automatically uses these environment variables (no configuration needed):
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

These are automatically available in Edge Functions.

## Troubleshooting

### If deployment fails:
1. Check that you copied the entire code
2. Make sure there are no syntax errors
3. Try clicking "Deploy" again

### If the function doesn't work:
1. Check the function logs in the Supabase dashboard
2. Make sure your app is using the correct project URL
3. Verify that Row Level Security (RLS) policies allow deletions

### To view logs:
1. Go to Edge Functions → delete-account
2. Click on "Logs" or "Invocations" tab
3. You'll see all execution logs with timestamps

## That's it! 🎉

Your users can now delete their accounts completely through the app's Account dropdown menu.
