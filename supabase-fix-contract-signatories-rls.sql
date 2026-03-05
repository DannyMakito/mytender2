-- Fix for infinite recursion in contract signatories visibility
-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view all signatories for their contracts" ON public.contract_signatories;

-- The previous policy caused infinite recursion because querying 'contract_signatories'
-- triggers the RLS policy, which in turn queries 'contract_signatories' AGAIN to check
-- if you are a signatory on the same contract, triggering the policy again, forever.

-- Create a SAFE policy that avoids referencing itself
CREATE POLICY "Users can view all signatories for their contracts"
ON public.contract_signatories
FOR SELECT
USING (
  -- You can view the row if it's your own signature
  signatory_email = (auth.jwt() ->> 'email')
  OR
  -- Or if you created the contract (references public.contracts instead of itself)
  contract_id IN (
    SELECT id 
    FROM public.contracts 
    WHERE created_by = (auth.jwt() ->> 'email')
  )
);
