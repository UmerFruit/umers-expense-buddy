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
    // First delete loan_transactions (they reference loans)
    // Then delete loans
    // Then delete expenses and income (they reference categories)
    // Then delete categories
    // Finally delete the user account

    // Get all loan IDs for this user first
    const { data: userLoans, error: loansQueryError } = await supabase
      .from('loans')
      .select('id')
      .eq('user_id', userId)

    if (loansQueryError) {
      console.error('Error fetching user loans:', loansQueryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user loans', details: loansQueryError.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Delete loan transactions for all user's loans
    if (userLoans && userLoans.length > 0) {
      const loanIds = userLoans.map(loan => loan.id)
      const { error: loanTransactionsError } = await supabase
        .from('loan_transactions')
        .delete()
        .in('loan_id', loanIds)

      if (loanTransactionsError) {
        console.error('Error deleting loan transactions:', loanTransactionsError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete loan transactions', details: loanTransactionsError.message }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        )
      }
      console.log('Loan transactions deleted successfully')
    }

    // Delete loans
    const { error: loansError } = await supabase
      .from('loans')
      .delete()
      .eq('user_id', userId)

    if (loansError) {
      console.error('Error deleting loans:', loansError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete loans', details: loansError.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }
    console.log('Loans deleted successfully')

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