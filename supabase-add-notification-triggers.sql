-- =====================================================
-- NOTIFICATION AUTOMATION TRIGGERS
-- Adds auto-triggers for Contracts & Account Status
-- =====================================================

-- 1. Trigger for Account Verification Status (Activated/Rejected)
CREATE OR REPLACE FUNCTION public.trigger_account_status_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- We need the user's email which is located in user_roles table
  SELECT user_email INTO v_user_email
  FROM public.user_roles 
  WHERE user_id = NEW.id LIMIT 1;

  IF v_user_email IS NOT NULL THEN
    -- If status changed to approved
    IF NEW.account_status = 'approved' AND (OLD.account_status = 'pending' OR OLD.account_status IS NULL) THEN
      PERFORM public.create_notification(
        v_user_email,
        'ACCOUNT_ACTIVATED',
        'Account Activated',
        'Your account verification is complete. You now have full access to the platform.'
      );
    -- If status changed to rejected
    ELSIF NEW.account_status = 'rejected' AND OLD.account_status != 'rejected' THEN
      PERFORM public.create_notification(
        v_user_email,
        'ACCOUNT_REJECTED',
        'Account Registration Rejected',
        COALESCE('Reason: ' || NEW.rejection_reason, 'Your business documents could not be verified. Please contact support.')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_account_status_notification ON public.profiles;
CREATE TRIGGER trg_account_status_notification
  AFTER UPDATE OF account_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_account_status_notification();


-- 2. Trigger for New Contracts needing signature
CREATE OR REPLACE FUNCTION public.trigger_new_contract_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contract_name TEXT;
  v_tender_id UUID;
BEGIN
  -- Only trigger if the contract is being marked as 'sent'
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN

    -- Get the tender_id to link the notification if needed
    v_tender_id := NEW.tender_id;
    v_contract_name := 'Contract ' || NEW.contract_number;

    -- Send notification to all pending signatories for this contract
    -- Cannot use PERFORM directly in a query loop gracefully without RECORD, replacing with INSERT loop
    INSERT INTO public.notifications (user_email, type, title, message, tender_id)
    SELECT 
      signatory_email,
      'NEW_CONTRACT',
      'Contract Requires Signature',
      'You have received ' || v_contract_name || ' for final sign-off.',
      v_tender_id
    FROM public.contract_signatories
    WHERE contract_id = NEW.id;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_contract_notification ON public.contracts;
CREATE TRIGGER trg_new_contract_notification
  AFTER UPDATE OF status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_new_contract_notification();
