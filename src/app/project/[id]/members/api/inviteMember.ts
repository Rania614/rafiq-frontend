import { getAccessToken } from '@/utils/auth';
import { supabaseAuthHeaders, supabaseRestUrl, supabaseUrl, parseSupabaseRestError } from '@/utils/supabase';

export interface InviteMemberParams {
  email: string;
  projectId: string;
  appUrl: string;
}

export async function inviteMember({ email, projectId, appUrl }: InviteMemberParams): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('You must be logged in to invite members.');
  }

  const response = await fetch(supabaseRestUrl('/rpc/invite_member'), {
    method: 'POST',
    headers: supabaseAuthHeaders(token),
    body: JSON.stringify({
      p_email: email,
      p_project_id: projectId,
      p_app_url: appUrl,
      p_base_url: supabaseUrl,
    }),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized: Please log in again.');
  } else if (response.status === 403) {
    throw new Error('Forbidden: You do not have permission to invite members to this project.');
  } else if (!response.ok) {
    const message = await parseSupabaseRestError(response, 'Failed to send invitation. Please try again.');
    throw new Error(message);
  }
}
