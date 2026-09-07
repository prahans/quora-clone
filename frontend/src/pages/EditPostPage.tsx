import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { usePost } from "../hooks/usePost";
import { useUpdatePost } from "../hooks/useUpdatePost";
import type { Post } from "../types/post";
import { getErrorMessage } from "../utils/getErrorMessage";

function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: post, isPending, error, refetch, isFetching } = usePost(id);

  if (!id) return <h2>Post not found.</h2>;
  if (isPending) return <h2>Loading post...</h2>;

  if (!post) {
    return (
      <>
        <h2>{getErrorMessage(error, "Failed to load post.")}</h2>
        <button onClick={() => void refetch()} disabled={isFetching}>
          Try again
        </button>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </>
    );
  }

  // A new post gets a new draft; background refreshes do not overwrite typing.
  return (
    <>
      {error && (
        <p role="alert">
          {getErrorMessage(
            error,
            "Unable to refresh this post. Your draft is preserved.",
          )}
        </p>
      )}
      <EditPostForm key={post._id} post={post} />
    </>
  );
}

function EditPostForm({ post }: { post: Post }) {
  const navigate = useNavigate();
  const updatePost = useUpdatePost();
  const [originalContent] = useState(post.content);
  const [originalImage] = useState(post.image);
  const [content, setContent] = useState(post.content);
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    previewUrl: string;
  }>();
  const [removeImage, setRemoveImage] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState("");
  const hasChanges =
    content !== originalContent || Boolean(selectedImage) || removeImage;
  const imageUrl =
    selectedImage?.previewUrl || (!removeImage ? originalImage?.url : undefined);
  const error =
    validationError ||
    (updatePost.error
      ? getErrorMessage(updatePost.error, "Failed to update post.")
      : "");

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setValidationError("");
    updatePost.reset();

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setValidationError("Please choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationError("Please choose an image no larger than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage({ file, previewUrl: URL.createObjectURL(file) });
    setRemoveImage(false);
  };

  const cancelImageSelection = () => {
    setSelectedImage(undefined);
    if (imageInput.current) imageInput.current.value = "";
    setValidationError("");
    updatePost.reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (updatePost.isPending || !hasChanges) return;
    setValidationError("");
    updatePost.reset();

    if (!content.trim()) {
      setValidationError("Please write something before submitting.");
      return;
    }

    try {
      const result = await updatePost.mutateAsync({
        id: post._id,
        content: content.trim(),
        image: selectedImage?.file,
        ...(removeImage && { removeImage: true }),
      });
      const showNotification = result.warning ? toast.warning : toast.success;
      showNotification(result.warning || "Post updated successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
      navigate("/");
    } catch {
      // The mutation supplies the error rendered below.
    }
  };

  return (
    <>
      <h2>Edit your post</h2>
      <p>username : @{post.author.username}</p>
      <p>post id : {post._id}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={15}
          cols={40}
          name="content"
          aria-label="Post content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={updatePost.isPending}
        />
        <div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={selectedImage ? "Selected image preview" : "Current post image"}
              style={{
                display: "block",
                maxWidth: "500px",
                width: "100%",
                height: "auto",
              }}
            />
          )}
          <label htmlFor="edit-image">
            {originalImage?.url && !removeImage
              ? "Replace image"
              : "Add an image (optional)"}
          </label>
          <input
            ref={imageInput}
            id="edit-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="edit-image-help"
            disabled={updatePost.isPending}
            onChange={handleImageChange}
          />
          <p id="edit-image-help">JPEG, PNG, or WebP, up to 5 MB.</p>
          {selectedImage ? (
            <>
              <p>Selected: {selectedImage.file.name}</p>
              <button
                type="button"
                onClick={cancelImageSelection}
                disabled={updatePost.isPending}
              >
                {originalImage?.url
                  ? "Cancel replacement"
                  : "Remove selected image"}
              </button>
            </>
          ) : originalImage?.url ? (
            <>
              {removeImage && (
                <p>The current image will be removed when you update the post.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setRemoveImage(!removeImage);
                  setValidationError("");
                  updatePost.reset();
                }}
                disabled={updatePost.isPending}
              >
                {removeImage ? "Undo image removal" : "Remove image"}
              </button>
            </>
          ) : null}
        </div>
        {error && <p role="alert">{error}</p>}
        {hasChanges && (
          <button type="submit" disabled={updatePost.isPending}>
            {updatePost.isPending ? "updating..." : "update post"}
          </button>
        )}
      </form>
      <button onClick={() => navigate(-1)} disabled={updatePost.isPending}>
        back
      </button>
    </>
  );
}

export default EditPostPage;
