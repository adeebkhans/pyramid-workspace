'use client';

import { RefreshCcw } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useIdentity } from '@/providers/identity-provider';
import { useToast } from '@/providers/toast-provider';
import type { Member } from '@/shared/domain/models';
import { apiClient, describeError } from '@/shared/lib/http/api-client';
import { guestSession } from '@/shared/lib/session/guest-session';
import { MemberAvatar } from '@/shared/ui/member-avatar';

/**
 * Profile settings.
 *
 * Fields persist on blur rather than behind a save button, which suits a form
 * of independent single-value settings. Because portraits are generated from a
 * seed rather than uploaded, this is also the natural home for a control that
 * re-rolls one.
 */
export function ProfileSettings() {
  const router = useRouter();
  const { member, refresh } = useIdentity();
  const { notify, reportError } = useToast();

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [isRerolling, setIsRerolling] = useState(false);

  useEffect(() => {
    if (!member) return;
    setFullName(member.name);
    setJobTitle(member.jobTitle ?? '');
    setHandle(member.email.split('@')[0]);
  }, [member]);

  const persist = async (changes: Record<string, string>) => {
    if (!member) return;

    try {
      await apiClient.patch<Member>(`/members/${member.id}`, changes);
      refresh();
      notify('Profile updated');
    } catch (cause) {
      reportError(describeError(cause));
    }
  };

  /** Re-seeds the generated portrait with fresh entropy. */
  const rerollAvatar = async () => {
    if (!member) return;
    setIsRerolling(true);

    try {
      await apiClient.patch<Member>(`/members/${member.id}`, {
        avatarSeed: `${member.id}-${Date.now().toString(36)}`,
      });
      refresh();
      notify('New avatar generated');
    } catch (cause) {
      reportError(describeError(cause));
    } finally {
      setIsRerolling(false);
    }
  };

  const leaveWorkspace = async () => {
    guestSession.close();
    await signOut({ redirect: false });
    router.push('/sign-in');
  };

  return (
    <div className="p-10 max-w-[800px] mx-auto">
      <h1 className="text-[22px] font-bold text-primary mb-8">Profile</h1>

      <div className="bg-surface border border-default rounded-xl overflow-hidden mb-8 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <span className="text-[14px] font-medium text-primary">Profile picture</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={rerollAvatar}
              disabled={!member || isRerolling}
              title="Generate a new avatar"
              className="text-tertiary hover:text-secondary p-1 disabled:opacity-40"
            >
              <RefreshCcw className={isRerolling ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            </button>
            <MemberAvatar member={member} size={36} />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <span className="text-[14px] font-medium text-primary">Email</span>
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-secondary">{member?.email ?? '...'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <span className="text-[14px] font-medium text-primary">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            onBlur={() => fullName.trim() && fullName !== member?.name && persist({ name: fullName.trim() })}
            aria-label="Full name"
            className="w-[180px] h-[36px] px-3 bg-surface border border-default rounded-md text-[14px] text-primary outline-none focus:border-neutral-400 placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <div>
            <div className="text-[14px] font-medium text-primary">Title</div>
            <div className="text-[12px] text-secondary mt-0.5">Your job title or role</div>
          </div>
          <input
            type="text"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            onBlur={() => jobTitle !== (member?.jobTitle ?? '') && persist({ jobTitle })}
            placeholder="Designer"
            aria-label="Title"
            className="w-[180px] h-[36px] px-3 border border-default rounded-md text-[14px] text-primary bg-surface outline-none focus:border-neutral-400 placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="text-[14px] font-medium text-primary">Username</div>
            <div className="text-[12px] text-secondary mt-0.5">One word, like a nickname or first name</div>
          </div>
          <input
            type="text"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            onBlur={() => handle.trim() && persist({ handle: handle.trim() })}
            placeholder="Dexuser"
            aria-label="Username"
            className="w-[180px] h-[36px] px-3 border border-default rounded-md text-[14px] text-primary bg-surface outline-none focus:border-neutral-400 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <h2 className="text-[14px] font-semibold text-primary mb-3 ml-1">Workspace access</h2>
      <div className="bg-surface border border-default rounded-xl overflow-hidden shadow-sm p-5 flex items-center justify-between">
        <span className="text-[14px] text-secondary">Remove yourself from the workspace</span>
        <button
          type="button"
          onClick={leaveWorkspace}
          className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[13px] font-medium hover:bg-red-200 transition-colors"
        >
          Leave Workspace
        </button>
      </div>
    </div>
  );
}
