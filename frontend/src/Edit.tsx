import { api } from "./api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { Post } from "./types/post";
import axios from "axios";

function Edit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState(post?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get<Post>(`/api/posts/${id}`);
        setPost(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.message || "Failed to load post.");
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

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
      toast.success("Post updated successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
      navigate("/");
    } catch {
      toast.error("Failed to update post. Check if your server is running.", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <h2>Loading posts...</h2>;
  }

  if (error) {
    return (
      <>
        <h2>{error}</h2>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </>
    );
  }

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
