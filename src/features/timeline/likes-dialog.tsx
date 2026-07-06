"use client";

import { UserListDialog } from "@/features/users/components/user-list-dialog";
import { getPostLikes } from "@/features/social/api";
import { queryKeys } from "@/lib/query-keys";

type LikesDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  postId: number;
};

const LIKES_PAGE_SIZE = 10;

export function LikesDialog({ onOpenChange, open, postId }: LikesDialogProps) {
  const likesQueryKey = queryKeys.postLikes.list(postId);

  return (
    <UserListDialog
      emptyMessage="No likes yet."
      errorMessage="Unable to load likes."
      onOpenChange={onOpenChange}
      open={open}
      queryFn={(page) => getPostLikes(postId, page, LIKES_PAGE_SIZE)}
      queryKey={likesQueryKey}
      title="Likes"
    />
  );
}
