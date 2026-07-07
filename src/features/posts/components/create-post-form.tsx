"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpToLine, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/features/posts/api";
import { createPostSchema, type CreatePostFormValues } from "@/features/posts/schemas";
import { updateProfileStatQueries } from "@/features/profile/profile-stats";
import { ApiError } from "@/lib/api";
import { POST_SUCCESS_STORAGE_KEY } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export function CreatePostForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreatePostFormValues>({
    defaultValues: {
      caption: "",
    },
    resolver: zodResolver(createPostSchema),
  });

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (response) => {
      window.sessionStorage.setItem(POST_SUCCESS_STORAGE_KEY, "1");
      updateProfileStatQueries(queryClient, response.data.author.username, "posts", 1);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      router.push("/");
    },
    onError: (error) => {
      setFormError(getCreatePostErrorMessage(error));
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setImageFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      setImageFile(file);
    }
  }

  function setImageFile(file: File) {
    setFormError(null);

    const validationError = validateImageFile(file);

    if (validationError) {
      setImageError(validationError);
      setSelectedFile(null);
      replacePreviewUrl(null);
      resetFileInput();
      return;
    }

    setImageError(null);
    setSelectedFile(file);
    replacePreviewUrl(URL.createObjectURL(file));
  }

  function deleteImage() {
    setImageError(null);
    setSelectedFile(null);
    replacePreviewUrl(null);
    resetFileInput();
  }

  function replacePreviewUrl(nextPreviewUrl: string | null) {
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onSubmit(values: CreatePostFormValues) {
    setFormError(null);
    if (!selectedFile) {
      setImageError("Photo is required.");
      return;
    }

    createPostMutation.mutate({
      caption: values.caption.trim(),
      image: selectedFile,
    });
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <label className="text-base font-bold" htmlFor="post-image">
          Photo
        </label>

        {previewUrl ? (
          <div className="rounded-lg border border-border bg-secondary p-4 sm:p-8">
            <div
              aria-label="Selected post image preview"
              className="mx-auto aspect-square w-full max-w-[394px] bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="h-10 rounded-lg bg-muted px-4 text-sm font-medium text-foreground hover:bg-muted/80"
                variant="secondary"
              >
                <label htmlFor="post-image">
                  <ArrowUpToLine className="size-5" />
                  Change Image
                </label>
              </Button>
              <Button
                className="h-10 rounded-lg bg-muted px-4 text-sm font-medium text-[#d51b62] hover:bg-muted/80 hover:text-[#d51b62]"
                onClick={deleteImage}
                type="button"
                variant="secondary"
              >
                <Trash2 className="size-5" />
                Delete Image
              </Button>
            </div>
          </div>
        ) : (
          <label
            className={cn(
              "flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary px-4 text-center transition-colors hover:border-primary/70",
              dragActive && "border-primary bg-primary/10",
              imageError && "border-[#d51b62]",
            )}
            htmlFor="post-image"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <span className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border text-foreground">
              <UploadCloud className="size-5" />
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              <span className="font-bold text-primary">Click to upload</span> or drag and drop
            </span>
            <span className="mt-3 text-sm font-semibold text-muted-foreground">PNG or JPG (max. 5mb)</span>
          </label>
        )}

        <input
          accept="image/png,image/jpeg"
          className="sr-only"
          id="post-image"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />

        {imageError ? (
          <p className="text-sm font-medium text-[#d51b62]" role="alert">
            {imageError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-base font-bold" htmlFor="post-caption">
          Caption
        </label>
        <Textarea
          className={cn(
            "min-h-24 resize-none rounded-lg border-border bg-secondary px-4 py-3 text-base leading-7 placeholder:text-muted-foreground focus-visible:ring-primary sm:min-h-[184px]",
            errors.caption && "border-[#d51b62] focus-visible:ring-[#d51b62]",
          )}
          id="post-caption"
          maxLength={1200}
          placeholder="Create your caption"
          {...register("caption", {
            onChange: () => {
              if (formError) {
                setFormError(null);
              }
            },
          })}
        />
        {errors.caption?.message ? (
          <p className="text-sm font-medium text-[#d51b62]" role="alert">
            {errors.caption.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          className="rounded-lg border border-[#d51b62]/50 bg-[#d51b62]/10 px-4 py-3 text-sm font-medium text-[#ff4f93]"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <Button className="h-12 rounded-full bg-primary text-base font-bold" disabled={createPostMutation.isPending}>
        {createPostMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
        {createPostMutation.isPending ? "Sharing" : "Share"}
      </Button>
    </form>
  );
}

function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Photo must be a PNG or JPG image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Photo must be 5mb or smaller.";
  }

  return null;
}

function getCreatePostErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to share post. Please try again.";
}
