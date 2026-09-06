import { useState, type FormEvent } from "react";
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
  const [content, setContent] = useState(post.content);
  const [validationError, setValidationError] = useState("");
  const error =
    validationError ||
    (updatePost.error
      ? getErrorMessage(updatePost.error, "Failed to update post.")
      : "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (updatePost.isPending) return;
    setValidationError("");
    updatePost.reset();

    if (!content.trim()) {
      setValidationError("Please write something before submitting.");
      return;
    }

    try {
      await updatePost.mutateAsync({ id: post._id, content: content.trim() });
      toast.success("Post updated successfully!", {
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
      <p>username : @{post.username}</p>
      <p>post id : {post._id}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={15}
          cols={40}
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={updatePost.isPending}
        />
        {error && <p role="alert">{error}</p>}
        {content !== post.content && (
          <button disabled={updatePost.isPending}>
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
