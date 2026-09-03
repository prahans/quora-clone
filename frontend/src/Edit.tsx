import { api } from "./api";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type PostProps = {
  _id: string;
  username: string;
  content: string;
};

function Edit() {
  const location = useLocation();

  // Cast the state to your custom type safely
  const state = location.state as { post: PostProps } | null;
  const post = state?.post;

  // 1. Set up local state to capture input values
  const [content, setContent] = useState(post?.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Handle the submission event asynchronously
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents HTML from trying to reload/redirect the entire page

    if (!content?.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 3. Make the POST network request directly to your Express API
      await api.put(`/api/posts/${post?._id}`, {
        username: post?.username,
        content: content,
      });

      // 4. Redirect the user back to the feed page after success
      navigate("/");
    } catch {
      alert("Failed to submit post. Check if your server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigate = useNavigate();
  return (
    <>
      <h2>Edit your post</h2>
      <p>username : @{post?.username}</p>
      <p>post id : {post?._id}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={10}
          cols={35}
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        {content !== post?.content && (
          <button disabled={isSubmitting}>
            {isSubmitting ? "updating..." : "update post"}
          </button>
        )}
      </form>
      <button onClick={() => navigate(-1)} disabled={isSubmitting}>
        back
      </button>
    </>
  );
}

export default Edit;
