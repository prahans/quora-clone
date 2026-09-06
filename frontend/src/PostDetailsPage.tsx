import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Post } from "./types/post";
import { api } from "./api/api";
import axios from "axios";

function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch the post details based on the ID
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      <h2>see in details</h2>
      <p>post id : {post?._id}</p>
      <div className="post">
        <h3 style={{ fontStyle: "italic" }}>@{post?.username}</h3>
        <p>{post?.content}</p>
      </div>
      <button onClick={() => navigate(-1)}>go back</button>
    </>
  );
}

export default PostDetailsPage;
