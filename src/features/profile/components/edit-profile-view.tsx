"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMe, updateMe } from "@/features/profile/api";
import { profileSchema, type ProfileFormValues } from "@/features/profile/schemas";
import { ApiError } from "@/lib/api";
import { PROFILE_SUCCESS_STORAGE_KEY } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { setUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function EditProfileView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewer = useAppSelector((state) => state.auth.user);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: getMe,
    initialData: viewer ? { data: viewer, message: "", success: true } : undefined,
  });
  const profile = profileQuery.data?.data;
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toProfileFormValues(profile),
  });

  useEffect(() => {
    if (profile) {
      reset(toProfileFormValues(profile));
    }
  }, [profile, reset]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const updateMutation = useMutation({
    mutationFn: ({ avatar, values }: { avatar: File | null; values: ProfileFormValues }) => {
      if (avatar) {
        const formData = new FormData();

        formData.set("name", values.name);
        formData.set("username", values.username);
        formData.set("email", values.email);
        formData.set("phone", values.phone?.trim() ?? "");
        formData.set("bio", values.bio?.trim() ?? "");
        formData.set("avatar", avatar);

        return updateMe(formData);
      }

      return updateMe({
        bio: values.bio?.trim() || undefined,
        email: values.email,
        name: values.name,
        phone: values.phone?.trim() || undefined,
        username: values.username,
      });
    },
    onSuccess: (response) => {
      dispatch(setUser(response.data));
      queryClient.setQueryData(queryKeys.profile.me(), response);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      window.sessionStorage.setItem(PROFILE_SUCCESS_STORAGE_KEY, "1");
      router.push("/me");
    },
  });

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateAvatar(file);

    if (validationError) {
      setAvatarError(validationError);
      setAvatarFile(null);
      clearAvatarPreview();
      resetAvatarInput();
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    clearAvatarPreview();
    setAvatarPreview(URL.createObjectURL(file));
  }

  function clearAvatarPreview() {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(null);
  }

  function resetAvatarInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onSubmit(values: ProfileFormValues) {
    setAvatarError(null);
    updateMutation.mutate({ avatar: avatarFile, values });
  }

  const avatarSrc = avatarPreview ?? profile?.avatarUrl;
  const displayName = profile?.name ?? "Profile";

  return (
    <>
      <EditProfileMobileHeader />
      <section className="mx-auto w-full max-w-[800px] px-4 pb-14 pt-6 lg:pb-24 lg:pt-12">
        <header className="mb-8 hidden items-center gap-4 lg:flex">
          <Link
            aria-label="Back to profile"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
            href="/me"
          >
            <ArrowLeft className="size-7" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </header>

        {profileQuery.isPending ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : null}

        {profileQuery.isError ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <h1 className="text-lg font-bold">Unable to load profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profileQuery.error instanceof Error ? profileQuery.error.message : "Please try again in a moment."}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => profileQuery.refetch()} type="button">
              Retry
            </Button>
          </div>
        ) : null}

        {profile ? (
          <form className="grid gap-8 lg:grid-cols-[176px_minmax(0,1fr)] lg:items-start" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center">
              <div className="relative size-24 overflow-hidden rounded-full bg-secondary lg:size-32">
                {avatarSrc ? (
                  <Image alt={displayName} className="object-cover" fill sizes="128px" src={avatarSrc} />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <UserRound className="size-10" />
                  </span>
                )}
              </div>
              <Button
                asChild
                className="mt-5 h-12 rounded-full border-border px-8 text-base font-bold"
                variant="outline"
              >
                <label htmlFor="profile-avatar">Change Photo</label>
              </Button>
              <input
                accept="image/png,image/jpeg"
                className="sr-only"
                id="profile-avatar"
                onChange={handleAvatarChange}
                ref={fileInputRef}
                type="file"
              />
              {avatarError ? <p className="mt-3 text-center text-sm text-[#d51b62]">{avatarError}</p> : null}
            </div>

            <div className="grid gap-5">
              <ProfileField error={errors.name?.message} label="Name">
                <Input
                  className={getInputClassName(Boolean(errors.name))}
                  placeholder="John Doe"
                  {...register("name")}
                />
              </ProfileField>

              <ProfileField error={errors.username?.message} label="Username">
                <Input
                  className={getInputClassName(Boolean(errors.username))}
                  placeholder="johndoe"
                  {...register("username")}
                />
              </ProfileField>

              <ProfileField error={errors.email?.message} label="Email">
                <Input
                  className={getInputClassName(Boolean(errors.email))}
                  placeholder="johndoe@email.com"
                  type="email"
                  {...register("email")}
                />
              </ProfileField>

              <ProfileField error={errors.phone?.message} label="Number Phone">
                <Input
                  className={getInputClassName(Boolean(errors.phone))}
                  placeholder="081234567890"
                  type="tel"
                  {...register("phone")}
                />
              </ProfileField>

              <ProfileField error={errors.bio?.message} label="Bio">
                <Textarea
                  className={cn(
                    "min-h-24 resize-none rounded-xl border-border bg-secondary px-4 py-3 text-base leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-0",
                    errors.bio && "border-[#d51b62] focus-visible:border-[#d51b62]",
                  )}
                  placeholder="Create your bio"
                  {...register("bio")}
                />
              </ProfileField>

              {updateMutation.isError ? (
                <p className="text-sm font-medium text-[#d51b62]" role="alert">
                  {getUpdateProfileErrorMessage(updateMutation.error)}
                </p>
              ) : null}

              <Button
                className="h-12 rounded-full bg-primary text-base font-bold"
                disabled={updateMutation.isPending}
                type="submit"
              >
                {updateMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
                {updateMutation.isPending ? "Saving" : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : null}
      </section>
    </>
  );
}

function ProfileField({
  children,
  error,
  label,
}: {
  children: ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-2 block text-sm text-[#d51b62]">{error}</span> : null}
    </label>
  );
}

function EditProfileMobileHeader() {
  const viewer = useAppSelector((state) => state.auth.user);
  const viewerName = viewer?.name ?? viewer?.username ?? "Profile";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <Link
          aria-label="Back to profile"
          className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          href="/me"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-lg font-bold">Edit Profile</h1>
      </div>
      <Link aria-label="Open profile" className="relative size-10 overflow-hidden rounded-full bg-secondary" href="/me">
        {viewer?.avatarUrl ? (
          <Image alt={viewerName} className="object-cover" fill sizes="40px" src={viewer.avatarUrl} />
        ) : (
          <span className="flex size-full items-center justify-center">
            <UserRound className="size-5" />
          </span>
        )}
      </Link>
    </header>
  );
}

function toProfileFormValues(profile?: UserProfile | null): ProfileFormValues {
  return {
    avatarUrl: profile?.avatarUrl ?? "",
    bio: profile?.bio ?? "",
    email: profile?.email ?? "",
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    username: profile?.username ?? "",
  };
}

function getInputClassName(hasError: boolean) {
  return cn(
    "h-12 rounded-xl border-border bg-secondary px-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0",
    hasError && "border-[#d51b62] focus-visible:border-[#d51b62]",
  );
}

function validateAvatar(file: File) {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return "Photo must be a PNG or JPG image.";
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return "Photo must be 5mb or smaller.";
  }

  return null;
}

function getUpdateProfileErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update profile. Please try again.";
}
