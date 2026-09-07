import { useState } from "react";
import { useCreatePost } from "../hooks/useCreatePost";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../utils/getErrorMessage";
import { toast } from "react-toastify";

function CreatePostPage() {
  const createPost = useCreatePost();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | undefined>();
  const [validationError, setValidationError] = useState("");

  const isSubmitting = createPost.isPending;

  const error =
    validationError ||
    (createPost.error
      ? getErrorMessage(createPost.error, "Failed to create post.")
      : "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setValidationError("");
    createPost.reset();

    if (!content.trim()) {
      setValidationError("Please write something before submitting.");
      return;
    }

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        image,
      });

      toast.success("Post created successfully!", {
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
      <h1>Create a new post</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          name="content"
          rows={15}
          cols={40}
          placeholder="Write your post..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />

        <br />
        <br />

        <label htmlFor="image">Add an image (optional)</label>

        <br />

        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          disabled={isSubmitting}
          onChange={(e) => {
            const file = e.target.files?.[0];

            setImage(file);
          }}
        />

        {error && <p>{error}</p>}

        <br />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit post"}
        </button>
      </form>

      <br />

      <button
        type="button"
        onClick={() => navigate(-1)}
        disabled={isSubmitting}
      >
        Go back
      </button>
    </>
  );
}

export default CreatePostPage;
