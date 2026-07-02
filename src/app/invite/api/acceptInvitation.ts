import { getAccessToken } from '@/utils/auth';
import { supabaseAuthHeaders, supabaseRestUrl, parseSupabaseRestError } from '@/utils/supabase';

export interface AcceptInvitationParams {
  token: string;
}

export async function acceptInvitation({ token }: AcceptInvitationParams): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('You must be logged in to accept this invitation.');
  }

  const response = await fetch(supabaseRestUrl('/rpc/accept_invitation'), {
    method: 'POST',
    headers: supabaseAuthHeaders(accessToken),
    body: JSON.stringify({
      p_token: token,
    }),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized: Please log in again to accept the invitation.');
  } else if (response.status === 403) {
    throw new Error('Forbidden: You do not have permission to accept this invitation.');
  } else if (!response.ok) {
    const errorDetail = await parseSupabaseRestError(
      response,
      'Failed to accept the invitation. It may have expired or is invalid.'
    );
    throw new Error(errorDetail);
  }
}
